"use server";

import { tryBandPermission } from "@/lib/band/assert-access";
import { bandPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function normalizePhotos(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function stripCacheParam(url: string) {
  return url.split("?")[0] ?? url;
}

export async function saveBandLogoUrl(
  bandId: string,
  bandSlug: string,
  logoUrl: string
): Promise<{ error?: string; url?: string }> {
  const access = await tryBandPermission(bandId, "band_profile");
  if ("error" in access) return { error: access.error };

  const { supabase } = access.auth;
  const cleanUrl = stripCacheParam(logoUrl);

  const { error } = await supabase
    .from("bands")
    .update({ logo_url: cleanUrl })
    .eq("id", bandId);

  if (error) return { error: error.message };

  revalidatePath(bandPath(bandSlug));
  revalidatePath(`/rider/${bandSlug}`);
  return { url: cleanUrl };
}

export async function removeBandLogo(
  bandId: string,
  bandSlug: string
): Promise<{ error?: string }> {
  const access = await tryBandPermission(bandId, "band_profile");
  if ("error" in access) return { error: access.error };

  const { supabase } = access.auth;

  const { error } = await supabase
    .from("bands")
    .update({ logo_url: null })
    .eq("id", bandId);

  if (error) return { error: error.message };

  revalidatePath(bandPath(bandSlug));
  revalidatePath(`/rider/${bandSlug}`);
  return {};
}

export async function saveBandPhotoUrl(
  bandId: string,
  bandSlug: string,
  photoUrl: string
): Promise<{ error?: string; url?: string }> {
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

  const photos = normalizePhotos(band?.photos);
  if (photos.length >= 12) return { error: "Максимум 12 фото" };
  if (photos.includes(cleanUrl)) return { url: cleanUrl };

  const { error } = await supabase
    .from("bands")
    .update({ photos: [...photos, cleanUrl] })
    .eq("id", bandId);

  if (error) return { error: error.message };

  revalidatePath(bandPath(bandSlug));
  revalidatePath(`/rider/${bandSlug}`);
  return { url: cleanUrl };
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

  const photos = normalizePhotos(band?.photos).filter((url) => url !== cleanUrl);

  const { error } = await supabase
    .from("bands")
    .update({ photos })
    .eq("id", bandId);

  if (error) return { error: error.message };

  revalidatePath(bandPath(bandSlug));
  revalidatePath(`/rider/${bandSlug}`);
  return {};
}

export async function saveMemberAvatarUrl(
  avatarUrl: string
): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const cleanUrl = stripCacheParam(avatarUrl);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: cleanUrl })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { url: cleanUrl };
}
