import type { createClient } from "@/lib/supabase/server";
import { eventIncomeTitle, eventRentExpenseTitle } from "@/lib/finance";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/*
 * Внутренние помощники учёта гонорара/аренды события. Не server actions:
 * вызываются только из экшенов, которые уже проверили права (requireBandAdmin).
 */

export async function insertEventFeeIncome(
  supabase: ServerSupabase,
  bandId: string,
  eventId: string,
  userId: string
): Promise<{ error?: string }> {
  const { data: event } = await supabase
    .from("events")
    .select("id, title, fee, event_type, starts_at, band_id")
    .eq("id", eventId)
    .eq("band_id", bandId)
    .maybeSingle();

  if (!event || event.event_type !== "performance" || !event.fee || event.fee <= 0) {
    return { error: "У концерта нет гонорара" };
  }

  const { data: existing } = await supabase
    .from("finance_transactions")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing) return { error: "Гонорар уже учтён" };

  const transactionAt = new Date(event.starts_at).toISOString().slice(0, 10);

  const { error } = await supabase.from("finance_transactions").insert({
    band_id: bandId,
    transaction_type: "income",
    amount: event.fee,
    title: eventIncomeTitle(event.title),
    event_id: eventId,
    transaction_at: transactionAt,
    created_by: userId,
  });

  if (error) return { error: error.message };
  return {};
}

export async function insertEventRentExpense(
  supabase: ServerSupabase,
  bandId: string,
  eventId: string,
  userId: string
): Promise<{ error?: string }> {
  const { data: event } = await supabase
    .from("events")
    .select("id, title, rent, event_type, starts_at, band_id")
    .eq("id", eventId)
    .eq("band_id", bandId)
    .maybeSingle();

  if (!event || event.event_type !== "rehearsal" || !event.rent || event.rent <= 0) {
    return { error: "У репетиции нет аренды" };
  }

  const { data: existing } = await supabase
    .from("finance_transactions")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing) return { error: "Аренда уже учтена" };

  const transactionAt = new Date(event.starts_at).toISOString().slice(0, 10);

  const { error } = await supabase.from("finance_transactions").insert({
    band_id: bandId,
    transaction_type: "expense",
    amount: event.rent,
    title: eventRentExpenseTitle(event.title),
    event_id: eventId,
    transaction_at: transactionAt,
    created_by: userId,
  });

  if (error) return { error: error.message };
  return {};
}
