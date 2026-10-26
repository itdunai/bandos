"use server";

import { requireBandPermission } from "@/lib/band/assert-access";
import { bandPath } from "@/lib/paths";
import { createPublicSupabaseClient } from "@/lib/supabase/public-server";
import { notifyNewBooking } from "@/lib/telegram/notify";
import { captureServerError } from "@/lib/monitoring/sentry";
import type { BookingStatus } from "@/types/database";
import { revalidatePath } from "next/cache";

const STATUSES: BookingStatus[] = ["new", "in_progress", "agreed", "declined"];

export type BookingFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

function field(formData: FormData, name: string, max: number) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

/**
 * Публичная заявка «Заказать выступление» — без входа. Проверки, лимиты и
 * вставка — в RPC submit_booking_request (SECURITY DEFINER).
 */
export async function submitBookingRequest(
  bandSlug: string,
  _prev: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  // Ловушка для ботов: поле скрыто от людей.
  if (field(formData, "website", 200)) return { status: "success" };

  const name = field(formData, "name", 100);
  const contact = field(formData, "contact", 200);
  if (!name) return { status: "error", message: "Укажите, как к вам обращаться" };
  if (contact.length < 3) {
    return { status: "error", message: "Укажите телефон, e-mail или Telegram" };
  }

  const date = field(formData, "event_date", 10);
  const supabase = createPublicSupabaseClient();
  if (!supabase) return { status: "error", message: "Сервис временно недоступен" };

  const { data: id, error } = await supabase.rpc("submit_booking_request", {
    p_slug: bandSlug,
    p_name: name,
    p_contact: contact,
    p_event_date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    p_city: field(formData, "city", 100) || null,
    p_format: field(formData, "event_format", 100) || null,
    p_message: field(formData, "message", 2000) || null,
  });

  if (error || typeof id !== "string") {
    // Тексты ошибок валидации задаёт сама RPC (код P0001) — их можно показать.
    const message =
      error?.code === "P0001" && error.message
        ? error.message
        : "Не удалось отправить заявку. Попробуйте позже.";
    return { status: "error", message };
  }

  try {
    await notifyNewBooking(id);
  } catch (e) {
    captureServerError(e, { action: "bookings.notify", extras: { bookingId: id } });
  }
  return { status: "success" };
}

export async function updateBookingStatus(
  bookingId: string,
  bandId: string,
  bandSlug: string,
  status: BookingStatus
) {
  if (!STATUSES.includes(status)) return;
  const { supabase } = await requireBandPermission(bandId, "band_profile");
  await supabase
    .from("booking_requests")
    .update({ status })
    .eq("id", bookingId)
    .eq("band_id", bandId);
  revalidatePath(bandPath(bandSlug, "bookings"));
}

export async function deleteBooking(bookingId: string, bandId: string, bandSlug: string) {
  const { supabase } = await requireBandPermission(bandId, "band_profile");
  await supabase.from("booking_requests").delete().eq("id", bookingId).eq("band_id", bandId);
  revalidatePath(bandPath(bandSlug, "bookings"));
}
