import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getSiteUrl } from "@/lib/site-url";
import {
  escapeHtml,
  secretsEqual,
  sendTelegramMessage,
  telegramWebhookSecret,
} from "@/lib/telegram/bot";

export const dynamic = "force-dynamic";

interface TelegramUpdate {
  message?: {
    text?: string;
    chat: { id: number; type: string };
    from?: { username?: string; first_name?: string };
  };
}

const OK = () => Response.json({ ok: true });

const HELP =
  "Это бот BandOS: напоминания о репетициях и концертах, сроки по делам и новые заявки на выступления.\n\n" +
  "Чтобы подключить уведомления, откройте BandOS → <b>Участники</b> → <b>Мой профиль</b> → «Подключить Telegram».";

export async function POST(request: Request) {
  // Telegram передаёт секрет, заданный в setWebhook. Без него — не наш запрос.
  const secret = telegramWebhookSecret();
  if (!secretsEqual(request.headers.get("x-telegram-bot-api-secret-token"), secret)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return OK();
  }

  const msg = update.message;
  // Только личные чаты: в группах бот не работает.
  if (!msg?.text || msg.chat.type !== "private") return OK();

  const chatId = msg.chat.id;
  const [command, arg] = msg.text.trim().split(/\s+/, 2);
  const db = createServiceSupabaseClient();
  if (!db) return OK();

  if (command === "/start" && arg && /^[a-f0-9]{48}$/.test(arg)) {
    const { data: link } = await db
      .from("telegram_link_tokens")
      .select("token, user_id, timezone, expires_at")
      .eq("token", arg)
      .maybeSingle();

    if (!link || new Date(link.expires_at).getTime() < Date.now()) {
      await sendTelegramMessage(
        chatId,
        "Ссылка устарела. Нажмите «Подключить Telegram» в BandOS ещё раз — ссылка действует 15 минут."
      );
      return OK();
    }

    // Чат мог быть привязан к другому аккаунту — переносим на текущий.
    await db.from("telegram_accounts").delete().eq("chat_id", chatId).neq("user_id", link.user_id);
    const { error } = await db.from("telegram_accounts").upsert(
      {
        user_id: link.user_id,
        chat_id: chatId,
        username: msg.from?.username ?? null,
        first_name: msg.from?.first_name ?? null,
        timezone: link.timezone,
        linked_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    await db.from("telegram_link_tokens").delete().eq("token", arg);

    await sendTelegramMessage(
      chatId,
      error
        ? "Не получилось подключить уведомления. Попробуйте ещё раз чуть позже."
        : "✅ <b>Готово!</b> Уведомления BandOS подключены.\n\n" +
            "Буду напоминать о репетициях и концертах за сутки, о сроках по делам и присылать новые заявки на выступления.\n" +
            `Настроить, что присылать: ${escapeHtml(getSiteUrl())} → Участники → Мой профиль.\n\n` +
            "Отключить: /stop"
    );
    return OK();
  }

  if (command === "/stop") {
    const { data } = await db.from("telegram_accounts").delete().eq("chat_id", chatId).select("user_id");
    await sendTelegramMessage(
      chatId,
      data && data.length > 0
        ? "Уведомления отключены. Подключить снова можно в профиле BandOS."
        : "Этот чат не подключён к BandOS."
    );
    return OK();
  }

  if (command === "/status") {
    const { data } = await db
      .from("telegram_accounts")
      .select("notify_events, notify_todos, notify_bookings")
      .eq("chat_id", chatId)
      .maybeSingle();
    const on = (v: boolean) => (v ? "вкл" : "выкл");
    await sendTelegramMessage(
      chatId,
      data
        ? `Подключено ✅\nСобытия: ${on(data.notify_events)} · Дела: ${on(data.notify_todos)} · Заявки: ${on(data.notify_bookings)}`
        : "Этот чат не подключён к BandOS.\n\n" + HELP
    );
    return OK();
  }

  await sendTelegramMessage(chatId, HELP);
  return OK();
}
