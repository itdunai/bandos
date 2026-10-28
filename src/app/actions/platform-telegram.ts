"use server";

import { requirePlatformAdmin } from "@/lib/platform/admin";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { sendTelegramMessage } from "@/lib/telegram/bot";
import { registerTelegramWebhook } from "@/lib/telegram/diag";
import { revalidatePath } from "next/cache";

/** Перерегистрировать webhook и команды бота (только админ платформы). */
export async function adminRegisterTelegramWebhook(): Promise<{ ok: boolean; message: string }> {
  await requirePlatformAdmin("/admin");
  const result = await registerTelegramWebhook();
  revalidatePath("/admin");
  return result;
}

/** Тестовое сообщение в Telegram самому админу (если его аккаунт привязан). */
export async function adminSendTelegramTest(): Promise<{ ok: boolean; message: string }> {
  const { user } = await requirePlatformAdmin("/admin");
  const db = createServiceSupabaseClient();
  if (!db) return { ok: false, message: "SUPABASE_SERVICE_ROLE_KEY не задан" };

  const { data } = await db
    .from("telegram_accounts")
    .select("chat_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data?.chat_id) {
    return { ok: false, message: "Ваш Telegram не подключён: «Аккаунт» → «Подключить Telegram»" };
  }

  const res = await sendTelegramMessage(
    data.chat_id as number,
    `✅ <b>Тест BandOS</b>\nБот работает: сообщение отправлено из админки ${new Date().toISOString()}`
  );
  return res.ok
    ? { ok: true, message: "Сообщение отправлено — проверьте Telegram" }
    : { ok: false, message: `Telegram не принял сообщение: ${res.description ?? "ошибка сети"}` };
}
