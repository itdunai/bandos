"use server";

import { tryBandPermission } from "@/lib/band/assert-access";
import { createClient } from "@/lib/supabase/server";
import {
  deleteMediaByUrl,
  stripCacheParam,
} from "@/lib/upload/supabase-storage";
import { revalidatePublicBand } from "@/lib/public-revalidate";

function normalizePhotos(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function revalidateBandMedia(bandSlug: string) {
  revalidatePublicBand(bandSlug);
}

export async function removeBandLogo(
  bandId: string,
  bandSlug: string
): Promise<{ error?: string }> {
  const access = await tryBandPermission(bandId, "band_profile");
  if ("error" in access) return { error: access.error };

  const { supabase } = access.auth;

  const { data: band } = await supabase
    .from("bands")
    .select("logo_url")
    .eq("id", bandId)
    .single();

  const { error } = await supabase
    .from("bands")
    .update({ logo_url: null })
    .eq("id", bandId);

  if (error) return { error: error.message };

  if (band?.logo_url) {
    await deleteMediaByUrl(supabase, band.logo_url);
  }

  revalidateBandMedia(bandSlug);
  return {};
}

export async function removeBandPhoto(
  bandId: string,
  bandSlug: string,
  photoUrl: string
): Promise<{ error?: string }> {
  const access = await tryBandPermission(bandId, "band_profile");
  if ("error" in access) return { error: access.error };

  const { supabase } = access.auth;
  const cleanUrl = stripCacheParam(photoUrl);

  const { data: band, error: readError } = await supabase
    .from("bands")
    .select("photos")
    .eq("id", bandId)
    .single();

  if (readError) return { error: readError.message };

  const photos = normalizePhotos(band?.photos).filter(
    (url) => stripCacheParam(url) !== cleanUrl
  );

  const { error } = await supabase
    .from("bands")
    .update({ photos })
    .eq("id", bandId);

  if (error) return { error: error.message };

  await deleteMediaByUrl(supabase, cleanUrl);

  revalidateBandMedia(bandSlug);
  return {};
}
