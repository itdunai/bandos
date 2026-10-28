"use server";

import { redirect } from "next/navigation";
import { captureServerError } from "@/lib/monitoring/sentry";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { notifyNewFeedback } from "@/lib/telegram/notify";

const KINDS = new Set(["bug", "idea", "question", "other"]);

export async function submitFeedback(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/feedback");

  const kindRaw = (formData.get("kind") as string) || "other";
  const kind = KINDS.has(kindRaw) ? kindRaw : "other";
  const message = ((formData.get("message") as string) || "").trim();
  const page = sanitizeRedirectPath(formData.get("page") as string | null);
  const bandId = (formData.get("band_id") as string) || null;

  const back = new URLSearchParams();
  if (page) back.set("from", page);

  if (!message) {
    back.set("error", "Напишите сообщение");
    redirect(`/feedback?${back.toString()}`);
  }

  // band_id из формы проверяет RPC: чужая группа обнуляется
  const { data: id, error } = await supabase.rpc("submit_feedback", {
    p_kind: kind,
    p_message: message.slice(0, 4000),
    p_page: page,
    p_band_id: bandId,
  });

  if (error || !id) {
    captureServerError(new Error(error?.message ?? "submit_feedback failed"), {
      action: "feedback.submit",
      userId: user.id,
    });
    // Тексты валидации и лимита задаёт RPC (коды 22023 / 54000) — их можно показать
    const userFacing = error && (error.code === "22023" || error.code === "54000");
    back.set("error", userFacing ? error.message : "Не удалось отправить — попробуйте позже");
    redirect(`/feedback?${back.toString()}`);
  }

  try {
    await notifyNewFeedback(id as string);
  } catch (e) {
    captureServerError(e, { action: "feedback.notify", extras: { feedbackId: id } });
  }

  back.set("sent", "1");
  redirect(`/feedback?${back.toString()}`);
}
