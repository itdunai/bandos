"use server";

import {
  requireBandPermission,
  requireSetlistMember,
} from "@/lib/band/assert-access";
import { bandPath } from "@/lib/paths";
import { revalidatePath } from "next/cache";
import { redirectWithToast } from "@/lib/redirect-with-toast";
import { redirect } from "next/navigation";

export async function createSetlist(bandId: string, bandSlug: string, formData: FormData) {
  const { supabase } = await requireBandPermission(bandId, "setlists");
  const name = (formData.get("name") as string).trim();

  if (!name) {
    await redirectWithToast(bandPath(bandSlug, "setlists", "new"), "Укажите название");
    return;
  }

  const { data, error } = await supabase
    .from("setlists")
    .insert({ band_id: bandId, name })
    .select("id")
    .single();

  if (error || !data) {
    await redirectWithToast(
      bandPath(bandSlug, "setlists", "new"),
      error?.message ?? "Ошибка"
    );
    return;
  }

  revalidatePath(bandPath(bandSlug, "setlists"));
  redirect(bandPath(bandSlug, "setlists", data.id));
}

export async function updateSetlistName(
  setlistId: string,
  bandSlug: string,
  name: string
) {
  const { supabase } = await requireSetlistMember(setlistId);
  await supabase.from("setlists").update({ name }).eq("id", setlistId);
  revalidatePath(bandPath(bandSlug, "setlists", setlistId));
}

export async function deleteSetlist(setlistId: string, bandSlug: string) {
  const { supabase } = await requireSetlistMember(setlistId);
  await supabase.from("setlists").delete().eq("id", setlistId);
  revalidatePath(bandPath(bandSlug, "setlists"));
  redirect(bandPath(bandSlug, "setlists"));
}

export async function addSetlistSong(
  setlistId: string,
  bandSlug: string,
  songId: string
) {
  const { supabase } = await requireSetlistMember(setlistId);

  const { data: items } = await supabase
    .from("setlist_items")
    .select("position")
    .eq("setlist_id", setlistId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPos = (items?.[0]?.position ?? -1) + 1;

  await supabase.from("setlist_items").insert({
    setlist_id: setlistId,
    song_id: songId,
    position: nextPos,
  });

  revalidatePath(bandPath(bandSlug, "setlists", setlistId));
}

export async function addSetlistCustomItem(
  setlistId: string,
  bandSlug: string,
  title: string,
  notes?: string
) {
  const { supabase } = await requireSetlistMember(setlistId);

  const { data: items } = await supabase
    .from("setlist_items")
    .select("position")
    .eq("setlist_id", setlistId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPos = (items?.[0]?.position ?? -1) + 1;

  await supabase.from("setlist_items").insert({
    setlist_id: setlistId,
    title: title.trim(),
    notes: notes?.trim() || null,
    position: nextPos,
  });

  revalidatePath(bandPath(bandSlug, "setlists", setlistId));
}

export async function removeSetlistItem(
  itemId: string,
  setlistId: string,
  bandSlug: string
) {
  const { supabase } = await requireSetlistMember(setlistId);
  await supabase.from("setlist_items").delete().eq("id", itemId);
  revalidatePath(bandPath(bandSlug, "setlists", setlistId));
}

export async function reorderSetlistItems(
  setlistId: string,
  bandSlug: string,
  orderedIds: string[]
) {
  const { supabase } = await requireSetlistMember(setlistId);

  await Promise.all(
    orderedIds.map((id, position) =>
      supabase
        .from("setlist_items")
        .update({ position })
        .eq("id", id)
        .eq("setlist_id", setlistId)
    )
  );

  revalidatePath(bandPath(bandSlug, "setlists", setlistId));
}

export async function updateSetlistItemNotes(
  itemId: string,
  setlistId: string,
  bandSlug: string,
  notes: string
) {
  const { supabase } = await requireSetlistMember(setlistId);
  await supabase
    .from("setlist_items")
    .update({ notes: notes.trim() || null })
    .eq("id", itemId);
  revalidatePath(bandPath(bandSlug, "setlists", setlistId));
}
