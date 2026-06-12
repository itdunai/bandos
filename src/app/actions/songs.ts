"use server";

import {
  requireBandPermission,
  requireSongMember,
} from "@/lib/band/assert-access";
import { createClient } from "@/lib/supabase/server";
import { bandPath } from "@/lib/paths";
import { sanitizeExternalUrl } from "@/lib/safe-url";
import { parseDurationInput } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { redirectWithToast } from "@/lib/redirect-with-toast";
import { redirect } from "next/navigation";

async function upsertContent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  songId: string,
  contentType: "chords" | "tabs" | "lyrics",
  body: string,
  instrument: string | null = null
) {
  const trimmed = body.trim();
  let query = supabase
    .from("song_contents")
    .select("id")
    .eq("song_id", songId)
    .eq("content_type", contentType);

  query = instrument
    ? query.eq("instrument", instrument)
    : query.is("instrument", null);

  const { data: existing } = await query.maybeSingle();

  if (!trimmed) {
    if (existing) {
      await supabase.from("song_contents").delete().eq("id", existing.id);
    }
    return;
  }

  if (existing) {
    await supabase
      .from("song_contents")
      .update({ body: trimmed })
      .eq("id", existing.id);
  } else {
    await supabase.from("song_contents").insert({
      song_id: songId,
      content_type: contentType,
      instrument,
      body: trimmed,
    });
  }
}

function parseSongForm(formData: FormData) {
  return {
    title: (formData.get("title") as string).trim(),
    status: formData.get("status") as string,
    bpm: formData.get("bpm") ? parseInt(formData.get("bpm") as string, 10) : null,
    time_signature: (formData.get("time_signature") as string) || "4/4",
    key: (formData.get("key") as string) || null,
    duration_sec: parseDurationInput((formData.get("duration") as string) || ""),
    song_type: formData.get("song_type") as string,
    genre: (formData.get("genre") as string) || null,
    structure: (formData.get("structure") as string) || null,
    source_url: sanitizeExternalUrl(formData.get("source_url") as string),
    chords: (formData.get("chords") as string) || "",
    tabs: (formData.get("tabs") as string) || "",
    lyrics: (formData.get("lyrics") as string) || "",
  };
}

export async function createSong(bandId: string, bandSlug: string, formData: FormData) {
  const { supabase } = await requireBandPermission(bandId, "songs");
  const data = parseSongForm(formData);

  if (!data.title) {
    await redirectWithToast(bandPath(bandSlug, "songs", "new"), "Укажите название");
    return;
  }

  const { data: song, error } = await supabase
    .from("songs")
    .insert({
      band_id: bandId,
      title: data.title,
      status: data.status,
      bpm: data.bpm,
      time_signature: data.time_signature,
      key: data.key,
      duration_sec: data.duration_sec,
      song_type: data.song_type,
      genre: data.genre,
      structure: data.structure,
      source_url: data.source_url,
    })
    .select("id")
    .single();

  if (error || !song) {
    await redirectWithToast(
      bandPath(bandSlug, "songs", "new"),
      error?.message ?? "Ошибка"
    );
    return;
  }

  await Promise.all([
    upsertContent(supabase, song.id, "chords", data.chords),
    upsertContent(supabase, song.id, "tabs", data.tabs, "bass"),
    upsertContent(supabase, song.id, "lyrics", data.lyrics),
  ]);

  revalidatePath(bandPath(bandSlug, "songs"));
  redirect(bandPath(bandSlug, "songs", song.id));
}

export async function updateSong(
  songId: string,
  bandId: string,
  bandSlug: string,
  formData: FormData
) {
  const { supabase } = await requireBandPermission(bandId, "songs");
  const data = parseSongForm(formData);

  const { error } = await supabase
    .from("songs")
    .update({
      title: data.title,
      status: data.status,
      bpm: data.bpm,
      time_signature: data.time_signature,
      key: data.key,
      duration_sec: data.duration_sec,
      song_type: data.song_type,
      genre: data.genre,
      structure: data.structure,
      source_url: data.source_url,
    })
    .eq("id", songId)
    .eq("band_id", bandId);

  if (error) {
    await redirectWithToast(
      bandPath(bandSlug, "songs", songId, "edit"),
      error.message
    );
    return;
  }

  await Promise.all([
    upsertContent(supabase, songId, "chords", data.chords),
    upsertContent(supabase, songId, "tabs", data.tabs, "bass"),
    upsertContent(supabase, songId, "lyrics", data.lyrics),
  ]);

  revalidatePath(bandPath(bandSlug, "songs"));
  revalidatePath(bandPath(bandSlug, "songs", songId));
  redirect(bandPath(bandSlug, "songs", songId));
}

export async function deleteSong(songId: string, bandSlug: string) {
  const { supabase } = await requireSongMember(songId);
  await supabase.from("songs").delete().eq("id", songId);
  revalidatePath(bandPath(bandSlug, "songs"));
  redirect(bandPath(bandSlug, "songs"));
}
