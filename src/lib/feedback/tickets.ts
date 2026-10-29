import type { SupabaseClient } from "@supabase/supabase-js";

export type FeedbackKind = "bug" | "idea" | "question" | "other";
export type FeedbackStatus = "new" | "in_progress" | "done" | "declined";

export const FEEDBACK_KIND_LABELS: Record<FeedbackKind, string> = {
  bug: "Ошибка",
  idea: "Идея",
  question: "Вопрос",
  other: "Другое",
};

export const FEEDBACK_STATUSES: FeedbackStatus[] = ["new", "in_progress", "done", "declined"];

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "Новое",
  in_progress: "В работе",
  done: "Выполнено",
  declined: "Отклонено",
};

/** Классы бейджа статуса (токены темы). */
export const FEEDBACK_STATUS_STYLES: Record<FeedbackStatus, string> = {
  new: "bg-blue/15 text-blue",
  in_progress: "bg-amber/15 text-amber",
  done: "bg-green/15 text-green",
  declined: "bg-bg-4 text-text-secondary",
};

export function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return typeof value === "string" && (FEEDBACK_STATUSES as string[]).includes(value);
}

export interface MyFeedbackRow {
  id: string;
  kind: FeedbackKind;
  message: string;
  status: FeedbackStatus;
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
  user_seen_at: string;
}

/** Обращения текущего пользователя (RLS: только свои). До миграции 031 — пусто. */
export async function getMyFeedback(
  supabase: SupabaseClient,
  userId: string
): Promise<MyFeedbackRow[]> {
  const { data, error } = await supabase
    .from("feedback")
    .select("id, kind, message, status, admin_reply, created_at, updated_at, user_seen_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data as MyFeedbackRow[];
}

export function isFeedbackUnread(row: Pick<MyFeedbackRow, "updated_at" | "user_seen_at">) {
  return new Date(row.updated_at).getTime() > new Date(row.user_seen_at).getTime();
}

/** Сколько обращений с ответом или новым статусом пользователь ещё не видел. */
export async function getUnreadFeedbackCount(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase.rpc("my_unread_feedback_count");
  if (error || typeof data !== "number") return 0;
  return data;
}
