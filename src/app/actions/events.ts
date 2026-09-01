"use server";

import {
  requireBandPermission,
  requireEventMember,
} from "@/lib/band/assert-access";
import { insertEventFeeIncome, insertEventRentExpense } from "@/app/actions/finances";
import {
  datetimeLocalToIso,
  parseTimezoneOffsetMinutes,
} from "@/lib/datetime";
import { bandPath } from "@/lib/paths";
import { revalidatePath } from "next/cache";
import { redirectWithToast } from "@/lib/redirect-with-toast";
import { redirect } from "next/navigation";

function parseEventForm(formData: FormData) {
  const startsAt = formData.get("starts_at") as string;
  const endsAt = (formData.get("ends_at") as string) || null;
  const feeRaw = formData.get("fee") as string;
  const rentRaw = formData.get("rent") as string;
  const setlistId = (formData.get("setlist_id") as string) || null;
  const tzOffset = parseTimezoneOffsetMinutes(
    formData.get("timezone_offset")
  );

  return {
    event_type: formData.get("event_type") as string,
    title: (formData.get("title") as string).trim(),
    starts_at: startsAt ? datetimeLocalToIso(startsAt, tzOffset) : null,
    ends_at: endsAt ? datetimeLocalToIso(endsAt, tzOffset) : null,
    location: (formData.get("location") as string) || null,
    notes: (formData.get("notes") as string) || null,
    setlist_id: setlistId || null,
    organizer: (formData.get("organizer") as string) || null,
    fee: feeRaw ? parseFloat(feeRaw) : null,
    rent: rentRaw ? parseFloat(rentRaw) : null,
  };
}

export async function createEvent(bandId: string, bandSlug: string, formData: FormData) {
  const { supabase, user } = await requireBandPermission(bandId, "schedule");
  const data = parseEventForm(formData);

  if (!data.title || !data.starts_at) {
    await redirectWithToast(
      bandPath(bandSlug, "schedule", "new"),
      "Заполните название и дату"
    );
    return;
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      band_id: bandId,
      event_type: data.event_type,
      title: data.title,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      location: data.location,
      notes: data.notes,
      setlist_id: data.event_type === "performance" ? data.setlist_id : null,
      organizer: data.event_type === "performance" ? data.organizer : null,
      fee: data.event_type === "performance" ? data.fee : null,
      rent: data.event_type === "rehearsal" ? data.rent : null,
    })
    .select("id")
    .single();

  if (error || !event) {
    await redirectWithToast(
      bandPath(bandSlug, "schedule", "new"),
      error?.message ?? "Ошибка"
    );
    return;
  }

  if (formData.get("record_in_finances") === "on") {
    await insertEventFeeIncome(bandId, event.id, user.id);
  }

  if (formData.get("record_rent_in_finances") === "on") {
    await insertEventRentExpense(bandId, event.id, user.id);
  }

  revalidatePath(bandPath(bandSlug, "schedule"));
  revalidatePath(bandPath(bandSlug, "finances"));
  redirect(bandPath(bandSlug, "schedule"));
}

export async function updateEvent(
  eventId: string,
  bandId: string,
  bandSlug: string,
  formData: FormData
) {
  const { supabase, user } = await requireBandPermission(bandId, "schedule");
  const data = parseEventForm(formData);

  const { error } = await supabase
    .from("events")
    .update({
      event_type: data.event_type,
      title: data.title,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      location: data.location,
      notes: data.notes,
      setlist_id: data.event_type === "performance" ? data.setlist_id : null,
      organizer: data.event_type === "performance" ? data.organizer : null,
      fee: data.event_type === "performance" ? data.fee : null,
      rent: data.event_type === "rehearsal" ? data.rent : null,
    })
    .eq("id", eventId)
    .eq("band_id", bandId);

  if (error) {
    await redirectWithToast(
      bandPath(bandSlug, "schedule", eventId, "edit"),
      error.message
    );
    return;
  }

  if (formData.get("record_in_finances") === "on") {
    await insertEventFeeIncome(bandId, eventId, user.id);
  }

  if (formData.get("record_rent_in_finances") === "on") {
    await insertEventRentExpense(bandId, eventId, user.id);
  }

  revalidatePath(bandPath(bandSlug, "schedule"));
  revalidatePath(bandPath(bandSlug, "finances"));
  redirect(bandPath(bandSlug, "schedule"));
}

export async function deleteEvent(eventId: string, bandSlug: string) {
  const { supabase } = await requireEventMember(eventId);
  await supabase.from("events").delete().eq("id", eventId);
  revalidatePath(bandPath(bandSlug, "schedule"));
  revalidatePath(bandPath(bandSlug));
  redirect(bandPath(bandSlug, "schedule"));
}
