"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import {
  FEEDBACK_BUCKET,
  FEEDBACK_MAX_FILES,
  FEEDBACK_MAX_FILE_BYTES,
  FEEDBACK_MAX_TOTAL_BYTES,
  sniffImageType,
} from "@/lib/feedback/attachments";
import { captureServerError } from "@/lib/monitoring/sentry";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { notifyNewFeedback } from "@/lib/telegram/notify";

const KINDS = new Set(["bug", "idea", "question", "other"]);

/** Куда вернуть после отправки: страница обратной связи в группе или общая. */
function feedbackBasePath(raw: FormDataEntryValue | null): string {
  const path = sanitizeRedirectPath(raw as string | null);
  return path && /^\/(?:[^/?]+\/)?feedback$/.test(path) ? path : "/feedback";
}

export async function submitFeedback(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/feedback");

  const kindRaw = (formData.get("kind") as string) || "other";
  const kind = KINDS.has(kindRaw) ? kindRaw : "other";
  const message = ((formData.get("message") as string) || "").trim();
  const page = sanitizeRedirectPath(formData.get("page") as string | null);
  const bandId = (formData.get("band_id") as string) || null;
  const base = feedbackBasePath(formData.get("return_to"));

  const back = new URLSearchParams();
  if (page) back.set("from", page);

  if (!message) {
    back.set("error", "Напишите сообщение");
    redirect(`${base}?${back.toString()}`);
  }

  // Скриншоты: проверяем содержимое (не имя файла) и кладём в папку автора
  const files = formData
    .getAll("attachments")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const fileError =
    files.length > FEEDBACK_MAX_FILES
      ? `Не больше ${FEEDBACK_MAX_FILES} вложений`
      : files.some((f) => f.size > FEEDBACK_MAX_FILE_BYTES)
        ? "Каждый файл — до 5 МБ"
        : files.reduce((sum, f) => sum + f.size, 0) > FEEDBACK_MAX_TOTAL_BYTES
          ? "Все вложения вместе — до 9 МБ"
          : null;
  if (fileError) {
    back.set("error", fileError);
    redirect(`${base}?${back.toString()}`);
  }

  const uploaded: string[] = [];
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = sniffImageType(bytes);
    if (!ext) {
      back.set("error", "Вложения — только картинки PNG или JPG");
      break;
    }
    const path = `${user.id}/${randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(FEEDBACK_BUCKET)
      .upload(path, bytes, { contentType: ext === "png" ? "image/png" : "image/jpeg" });
    if (uploadError) {
      captureServerError(new Error(uploadError.message), {
        action: "feedback.attachment_upload",
        userId: user.id,
      });
      back.set("error", "Не удалось загрузить вложение — попробуйте без него или позже");
      break;
    }
    uploaded.push(path);
  }
  if (back.has("error")) {
    if (uploaded.length) await supabase.storage.from(FEEDBACK_BUCKET).remove(uploaded);
    redirect(`${base}?${back.toString()}`);
  }

  // band_id из формы проверяет RPC: чужая группа обнуляется.
  // p_attachments — только если есть: до миграции 034 у RPC нет этого параметра.
  const { data: id, error } = await supabase.rpc("submit_feedback", {
    p_kind: kind,
    p_message: message.slice(0, 4000),
    p_page: page,
    p_band_id: bandId,
    ...(uploaded.length ? { p_attachments: uploaded } : {}),
  });

  if (error || !id) {
    if (uploaded.length) await supabase.storage.from(FEEDBACK_BUCKET).remove(uploaded);
    captureServerError(new Error(error?.message ?? "submit_feedback failed"), {
      action: "feedback.submit",
      userId: user.id,
    });
    // Тексты валидации и лимита задаёт RPC (коды 22023 / 54000) — их можно показать
    const userFacing = error && (error.code === "22023" || error.code === "54000");
    back.set("error", userFacing ? error.message : "Не удалось отправить — попробуйте позже");
    redirect(`${base}?${back.toString()}`);
  }

  try {
    await notifyNewFeedback(id as string);
  } catch (e) {
    captureServerError(e, { action: "feedback.notify", extras: { feedbackId: id } });
  }

  back.set("sent", "1");
  redirect(`${base}?${back.toString()}`);
}

/** Автор открыл свои обращения — гасим индикатор «новое». */
export async function markFeedbackSeen(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc("mark_my_feedback_seen");
}
