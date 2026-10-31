import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getSiteUrl } from "@/lib/site-url";
import { escapeHtml, isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram/bot";
import { hasPermission, type BandPermission } from "@/lib/band/permissions";
import { bandPath } from "@/lib/paths";
import { EVENT_TYPE_LABELS, type BandMember, type EventType } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

type NotifyKind = "event_24h" | "todo_due" | "booking_new";
type PrefColumn = "notify_events" | "notify_todos" | "notify_bookings";

interface TelegramAccount {
  user_id: string;
  chat_id: number;
  timezone: string;
  notify_events: boolean;
  notify_todos: boolean;
  notify_bookings: boolean;
}

interface MemberRow {
  id: string;
  user_id: string;
  band_id: string;
  role: string;
  permissions: unknown;
  permission_preset: string | null;
}

export interface Recipient {
  userId: string;
  memberId: string;
  chatId: number;
  timezone: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const TODO_REMINDER_LOCAL_HOUR = 9;

function link(path: string) {
  return `${getSiteUrl().replace(/\/$/, "")}${path}`;
}

/** Часовой пояс из БД может быть невалидным — проверяем через Intl. */
export function safeTimeZone(tz: string): string {
  try {
    new Intl.DateTimeFormat("ru-RU", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

export function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

function formatWhen(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function relativeDay(iso: string, timeZone: string, now: Date) {
  const target = localParts(new Date(iso), timeZone).date;
  if (target === localParts(now, timeZone).date) return "сегодня";
  if (target === localParts(new Date(now.getTime() + DAY_MS), timeZone).date) return "завтра";
  return null;
}

/**
 * Участники группы с привязанным Telegram и включённой настройкой.
 * `filter` — дополнительное условие по участнику (права, исполнитель дела).
 */
async function bandRecipients(
  db: SupabaseClient,
  bandId: string,
  pref: PrefColumn,
  filter?: (m: MemberRow) => boolean
): Promise<Recipient[]> {
  const { data: members } = await db
    .from("band_members")
    .select("id, user_id, band_id, role, permissions, permission_preset")
    .eq("band_id", bandId)
    .eq("is_active", true);

  const eligible = ((members ?? []) as MemberRow[]).filter((m) => !filter || filter(m));
  if (eligible.length === 0) return [];

  const { data: accounts } = await db
    .from("telegram_accounts")
    .select("user_id, chat_id, timezone, notify_events, notify_todos, notify_bookings")
    .in("user_id", eligible.map((m) => m.user_id))
    .eq(pref, true);

  const byUser = new Map(((accounts ?? []) as TelegramAccount[]).map((a) => [a.user_id, a]));
  return eligible.flatMap((m) => {
    const acc = byUser.get(m.user_id);
    return acc
      ? [{ userId: m.user_id, memberId: m.id, chatId: acc.chat_id, timezone: safeTimeZone(acc.timezone) }]
      : [];
  });
}

function memberHas(m: MemberRow, permission: BandPermission) {
  return hasPermission(m as unknown as BandMember, permission);
}

/**
 * Отправка с защитой от дублей: сначала «застолбить» запись в журнале
 * (ON CONFLICT DO NOTHING), и только если она новая — слать. При ошибке
 * отправки запись удаляется, чтобы следующий запуск попробовал снова.
 */
async function sendOnce(
  db: SupabaseClient,
  kind: NotifyKind,
  refId: string,
  recipient: Recipient,
  html: string
): Promise<boolean> {
  const { data: claimed, error } = await db
    .from("notification_log")
    .upsert(
      { kind, ref_id: refId, user_id: recipient.userId },
      { onConflict: "kind,ref_id,user_id", ignoreDuplicates: true }
    )
    .select("user_id");
  if (error || !claimed || claimed.length === 0) return false;

  const res = await sendTelegramMessage(recipient.chatId, html);
  if (!res.ok) {
    await db
      .from("notification_log")
      .delete()
      .eq("kind", kind)
      .eq("ref_id", refId)
      .eq("user_id", recipient.userId);
    // Пользователь заблокировал бота — отвязываем, чтобы не стучаться впустую.
    if (res.error_code === 403) {
      await db.from("telegram_accounts").delete().eq("user_id", recipient.userId);
    }
    return false;
  }
  return true;
}

/* ------------------------------- События -------------------------------- */

interface EventRow {
  id: string;
  band_id: string;
  event_type: EventType;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  setlist_id: string | null;
  bands: { name: string; slug: string } | { name: string; slug: string }[] | null;
  setlists: { name: string } | { name: string }[] | null;
}

const EVENT_EMOJI: Record<EventType, string> = {
  rehearsal: "🎸",
  performance: "🎤",
  other: "📌",
};

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v;
}

function eventMessage(e: EventRow, tz: string, now: Date) {
  const band = one(e.bands);
  const setlist = one(e.setlists);
  const rel = relativeDay(e.starts_at, tz, now);
  const label = EVENT_TYPE_LABELS[e.event_type];
  const when = formatWhen(e.starts_at, tz) + (e.ends_at ? `–${formatTime(e.ends_at, tz)}` : "");
  const lines = [
    `${EVENT_EMOJI[e.event_type]} <b>${escapeHtml(label)}${rel ? ` ${rel}` : ""}</b> · ${escapeHtml(band?.name ?? "")}`,
    `<b>${escapeHtml(e.title)}</b>`,
    `🕒 ${escapeHtml(when)}`,
  ];
  if (e.location) lines.push(`📍 ${escapeHtml(e.location)}`);
  if (band && e.setlist_id && setlist) {
    lines.push(
      `🎼 Сет-лист: <a href="${link(bandPath(band.slug, "play", e.setlist_id))}">${escapeHtml(setlist.name)}</a>`
    );
  }
  if (band) {
    lines.push("", `<a href="${link(bandPath(band.slug, "schedule", e.id, "edit"))}">Открыть в BandOS</a>`);
  }
  return lines.join("\n");
}

async function remindEvents(db: SupabaseClient, now: Date) {
  const { data } = await db
    .from("events")
    .select(
      "id, band_id, event_type, title, starts_at, ends_at, location, setlist_id, bands(name, slug), setlists(name)"
    )
    .gt("starts_at", now.toISOString())
    .lte("starts_at", new Date(now.getTime() + DAY_MS).toISOString());

  let sent = 0;
  const cache = new Map<string, Promise<Recipient[]>>();
  for (const e of (data ?? []) as EventRow[]) {
    if (!cache.has(e.band_id)) cache.set(e.band_id, bandRecipients(db, e.band_id, "notify_events"));
    const recipients = await cache.get(e.band_id)!;
    for (const r of recipients) {
      if (await sendOnce(db, "event_24h", e.id, r, eventMessage(e, r.timezone, now))) sent++;
    }
  }
  return sent;
}

/* --------------------------------- Дела ---------------------------------- */

interface TodoRow {
  id: string;
  band_id: string;
  title: string;
  due_date: string;
  assignee_id: string | null;
  bands: { name: string; slug: string } | { name: string; slug: string }[] | null;
}

async function remindTodos(db: SupabaseClient, now: Date) {
  // Окно ±1 день покрывает все часовые пояса; точная проверка — по поясу получателя.
  const from = new Date(now.getTime() - DAY_MS).toISOString().slice(0, 10);
  const to = new Date(now.getTime() + DAY_MS).toISOString().slice(0, 10);
  const { data } = await db
    .from("todos")
    .select("id, band_id, title, due_date, assignee_id, bands(name, slug)")
    .eq("is_done", false)
    .gte("due_date", from)
    .lte("due_date", to);

  let sent = 0;
  for (const t of (data ?? []) as TodoRow[]) {
    const band = one(t.bands);
    // Дело назначено — пишем исполнителю, иначе тем, кто ведёт дела группы.
    const recipients = await bandRecipients(db, t.band_id, "notify_todos", (m) =>
      t.assignee_id ? m.id === t.assignee_id : memberHas(m, "todos")
    );
    for (const r of recipients) {
      const local = localParts(now, r.timezone);
      if (local.date !== t.due_date || local.hour < TODO_REMINDER_LOCAL_HOUR) continue;
      const html = [
        `✅ <b>Срок по делу — сегодня</b> · ${escapeHtml(band?.name ?? "")}`,
        escapeHtml(t.title),
        band ? `\n<a href="${link(bandPath(band.slug, "todos"))}">Открыть дела</a>` : "",
      ].join("\n");
      if (await sendOnce(db, "todo_due", t.id, r, html)) sent++;
    }
  }
  return sent;
}

/** Один проход рассылки. Безопасно вызывать часто: дубли отсекает журнал. */
export async function runReminders(now = new Date()) {
  if (!isTelegramConfigured()) return { skipped: true as const };
  const db = createServiceSupabaseClient();
  if (!db) return { skipped: true as const };
  const [events, todos] = await Promise.all([remindEvents(db, now), remindTodos(db, now)]);
  return { skipped: false as const, events, todos };
}

/* -------------------------------- Заявки --------------------------------- */

export async function notifyNewBooking(bookingId: string) {
  if (!isTelegramConfigured()) return;
  const db = createServiceSupabaseClient();
  if (!db) return;

  const { data: b } = await db
    .from("booking_requests")
    .select("id, band_id, name, contact, event_date, city, event_format, message, bands(name, slug)")
    .eq("id", bookingId)
    .maybeSingle();
  if (!b) return;

  const band = one(b.bands as { name: string; slug: string } | { name: string; slug: string }[] | null);
  const recipients = await bandRecipients(db, b.band_id, "notify_bookings", (m) =>
    memberHas(m, "band_profile")
  );

  const date = b.event_date
    ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
        new Date(`${b.event_date}T00:00:00Z`)
      )
    : null;
  const lines = [
    `📩 <b>Новая заявка на выступление</b> · ${escapeHtml(band?.name ?? "")}`,
    `👤 ${escapeHtml(b.name)} — ${escapeHtml(b.contact)}`,
  ];
  if (date) lines.push(`📅 ${escapeHtml(date)}`);
  if (b.city) lines.push(`📍 ${escapeHtml(b.city)}`);
  if (b.event_format) lines.push(`🎉 ${escapeHtml(b.event_format)}`);
  if (b.message) lines.push("", escapeHtml(b.message.slice(0, 800)));
  if (band) lines.push("", `<a href="${link(bandPath(band.slug, "bookings"))}">Открыть заявки</a>`);
  const html = lines.join("\n");

  await Promise.all(recipients.map((r) => sendOnce(db, "booking_new", b.id, r, html)));
}

/* ------------------------------ Обратная связь ---------------------------- */

const FEEDBACK_KIND_LABELS: Record<string, string> = {
  bug: "🐞 Ошибка",
  idea: "💡 Идея",
  question: "❓ Вопрос",
  other: "💬 Сообщение",
};

/** Новое сообщение обратной связи — админам платформы с привязанным Telegram. */
export async function notifyNewFeedback(feedbackId: string) {
  if (!isTelegramConfigured()) return;
  const db = createServiceSupabaseClient();
  if (!db) return;

  const { data: f } = await db
    .from("feedback")
    .select("*, bands(name)")
    .eq("id", feedbackId)
    .maybeSingle();
  if (!f) return;

  // telegram_accounts ссылается на auth.users, не на profiles — embed недоступен
  const { data: admins } = await db.from("profiles").select("id").eq("is_platform_admin", true);
  const adminIds = (admins ?? []).map((a) => a.id as string);
  if (!adminIds.length) return;

  const { data: accounts } = await db
    .from("telegram_accounts")
    .select("chat_id")
    .in("user_id", adminIds);
  const chatIds = (accounts ?? []).map((a) => a.chat_id as number).filter(Boolean);
  if (!chatIds.length) return;

  const band = one(f.bands as { name: string } | { name: string }[] | null);
  const lines = [
    `<b>${FEEDBACK_KIND_LABELS[f.kind] ?? FEEDBACK_KIND_LABELS.other}</b> · BandOS`,
    `👤 ${escapeHtml(f.email ?? "—")}${band ? ` · ${escapeHtml(band.name)}` : ""}`,
  ];
  if (f.page) lines.push(`📄 ${escapeHtml(f.page)}`);
  const attachments = Array.isArray(f.attachments) ? f.attachments.length : 0;
  if (attachments) lines.push(`📎 Скриншотов: ${attachments} — смотреть в админке`);
  lines.push("", escapeHtml(f.message.slice(0, 2000)), "", `<a href="${link("/admin/feedback")}">Открыть в админке</a>`);
  const html = lines.join("\n");

  await Promise.all(chatIds.map((chatId) => sendTelegramMessage(chatId, html)));
}

const FEEDBACK_STATUS_TEXT: Record<string, string> = {
  new: "🆕 Новое",
  in_progress: "🛠 В работе",
  done: "✅ Выполнено",
  declined: "🚫 Отклонено",
};

/** Ответ или новый статус обращения — автору, если он подключил Telegram. */
export async function notifyFeedbackUpdate(feedbackId: string): Promise<boolean> {
  if (!isTelegramConfigured()) return false;
  const db = createServiceSupabaseClient();
  if (!db) return false;

  const { data: f } = await db
    .from("feedback")
    .select("user_id, message, status, admin_reply")
    .eq("id", feedbackId)
    .maybeSingle();
  if (!f?.user_id) return false;

  const { data: account } = await db
    .from("telegram_accounts")
    .select("chat_id")
    .eq("user_id", f.user_id)
    .maybeSingle();
  if (!account?.chat_id) return false;

  const quote = f.message.length > 300 ? `${f.message.slice(0, 300)}…` : f.message;
  const lines = [
    `<b>Ваше обращение в BandOS</b> · ${FEEDBACK_STATUS_TEXT[f.status] ?? f.status}`,
    "",
    `<i>${escapeHtml(quote)}</i>`,
  ];
  if (f.admin_reply) lines.push("", `<b>Ответ:</b> ${escapeHtml(f.admin_reply.slice(0, 2500))}`);
  lines.push("", `<a href="${link("/feedback")}">Открыть обращения</a>`);

  const res = await sendTelegramMessage(account.chat_id as number, lines.join("\n"));
  return res.ok;
}
