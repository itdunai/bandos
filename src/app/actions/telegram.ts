"use server";

import { bandPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import { getBotUsername, isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram/bot";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Одноразовая ссылка t.me/<bot>?start=<token> для привязки чата (15 минут). */
export async function createTelegramLink(
  timezone: string
): Promise<{ url: string; botUsername: string } | { error: string }> {
  if (!isTelegramConfigured()) return { error: "Уведомления в Telegram пока не настроены на сервере" };
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Требуется вход" };

  const { data: token, error } = await supabase.rpc("create_telegram_link_token", {
    p_timezone: timezone,
  });
  if (error || typeof token !== "string") return { error: "Не удалось создать ссылку" };

  const botUsername = await getBotUsername();
  if (!botUsername) return { error: "Бот недоступен, попробуйте позже" };
  return { url: `https://t.me/${botUsername}?start=${token}`, botUsername };
}

export async function updateTelegramSettings(settings: {
  notifyEvents: boolean;
  notifyTodos: boolean;
  notifyBookings: boolean;
  timezone: string;
}): Promise<{ ok: boolean }> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false };
  const { error } = await supabase.rpc("update_telegram_settings", {
    p_notify_events: settings.notifyEvents,
    p_notify_todos: settings.notifyTodos,
    p_notify_bookings: settings.notifyBookings,
    p_timezone: settings.timezone,
  });
  return { ok: !error };
}

export async function unlinkTelegram(bandSlug: string): Promise<{ ok: boolean }> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false };

  const { data } = await supabase
    .from("telegram_accounts")
    .delete()
    .eq("user_id", user.id)
    .select("chat_id");
  const chatId = data?.[0]?.chat_id as number | undefined;
  if (chatId) {
    await sendTelegramMessage(chatId, "Уведомления BandOS отключены из профиля.");
  }
  revalidatePath(bandPath(bandSlug, "members"));
  return { ok: true };
}
