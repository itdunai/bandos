"use server";

import { requireBandAdmin } from "@/lib/band/assert-access";
import { canViewFinances } from "@/lib/band/permissions";
import { redirectForbidden } from "@/lib/forbidden";
import { eventIncomeTitle } from "@/lib/finance";
import { bandPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import type { FinanceTransactionType } from "@/types/database";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function parseAmount(raw: string): number | null {
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const value = parseFloat(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

export async function setOpeningBalance(
  bandId: string,
  bandSlug: string,
  formData: FormData
): Promise<{ error?: string }> {
  const { supabase } = await requireBandAdmin(bandId);
  const amount = parseAmount(formData.get("opening_balance") as string);
  if (amount === null) return { error: "Укажите корректную сумму" };

  const { error } = await supabase.rpc("set_finance_opening_balance", {
    p_band_id: bandId,
    p_amount: amount,
  });

  if (error) return { error: error.message };

  revalidatePath(bandPath(bandSlug, "finances"));
  return {};
}

export async function addFinanceTransaction(
  bandId: string,
  bandSlug: string,
  formData: FormData
): Promise<{ error?: string }> {
  const { supabase, user } = await requireBandAdmin(bandId);

  const type = formData.get("transaction_type") as FinanceTransactionType;
  if (type !== "income" && type !== "expense") {
    return { error: "Некорректный тип операции" };
  }

  const amount = parseAmount(formData.get("amount") as string);
  if (amount === null) return { error: "Укажите сумму больше 0" };

  const title = (formData.get("title") as string).trim();
  if (!title) return { error: "Укажите название" };

  const notes = (formData.get("notes") as string)?.trim() || null;
  const transactionAt = (formData.get("transaction_at") as string) || null;
  const eventId = (formData.get("event_id") as string) || null;

  if (eventId && type !== "income") {
    return { error: "Концерт можно привязать только к доходу" };
  }

  if (eventId) {
    const { data: event } = await supabase
      .from("events")
      .select("id, band_id, event_type, fee")
      .eq("id", eventId)
      .eq("band_id", bandId)
      .maybeSingle();

    if (!event || event.event_type !== "performance") {
      return { error: "Концерт не найден" };
    }
  }

  const { error } = await supabase.from("finance_transactions").insert({
    band_id: bandId,
    transaction_type: type,
    amount,
    title,
    notes,
    event_id: eventId || null,
    transaction_at: transactionAt || new Date().toISOString().slice(0, 10),
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(bandPath(bandSlug, "finances"));
  return {};
}

export async function deleteFinanceTransaction(
  transactionId: string,
  bandId: string,
  bandSlug: string
): Promise<{ error?: string }> {
  const { supabase } = await requireBandAdmin(bandId);

  const { error } = await supabase
    .from("finance_transactions")
    .delete()
    .eq("id", transactionId)
    .eq("band_id", bandId);

  if (error) return { error: error.message };

  revalidatePath(bandPath(bandSlug, "finances"));
  return {};
}

export async function insertEventFeeIncome(
  bandId: string,
  eventId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

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

export async function recordEventFeeIncome(
  eventId: string,
  bandId: string,
  bandSlug: string
): Promise<{ error?: string }> {
  const { user } = await requireBandAdmin(bandId);
  const result = await insertEventFeeIncome(bandId, eventId, user.id);

  if (!result.error) {
    revalidatePath(bandPath(bandSlug, "finances"));
    revalidatePath(bandPath(bandSlug, "schedule"));
  }

  return result;
}

/** Page guard: members with finances view or admins */
export async function assertFinanceView(bandId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("band_members")
    .select("*")
    .eq("band_id", bandId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!member || !canViewFinances(member)) {
    redirectForbidden({ reason: "no_permission", permission: "finances" });
  }
  return { supabase, user, member };
}
