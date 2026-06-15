"use server";

import { requireBandPermission } from "@/lib/band/assert-access";
import { bandPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveBandLogoUrl(
  bandId: string,
  bandSlug: string,
  logoUrl: string
): Promise<{ error?: string }> {
  const { supabase } = await requireBandPermission(bandId, "band_profile");

  const { error } = await supabase
    .from("bands")
    .update({ logo_url: logoUrl })
    .eq("id", bandId);

  if (error) return { error: error.message };

  revalidatePath(bandPath(bandSlug));
  revalidatePath(`/rider/${bandSlug}`);
  return {};
}

export async function removeBandLogo(
  bandId: string,
  bandSlug: string
): Promise<{ error?: string }> {
  const { supabase } = await requireBandPermission(bandId, "band_profile");

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
): Promise<{ error?: string }> {
  const { supabase } = await requireBandPermission(bandId, "band_profile");

  const { data: band } = await supabase
    .from("bands")
    .select("photos")
    .eq("id", bandId)
    .single();

  const photos = Array.isArray(band?.photos) ? [...band.photos] : [];
  if (photos.length >= 12) return { error: "Максимум 12 фото" };

  photos.push(photoUrl);

  const { error } = await supabase
    .from("bands")
    .update({ photos })
    .eq("id", bandId);

  if (error) return { error: error.message };

  revalidatePath(bandPath(bandSlug));
  revalidatePath(`/rider/${bandSlug}`);
  return {};
}

export async function removeBandPhoto(
  bandId: string,
  bandSlug: string,
  photoUrl: string
): Promise<{ error?: string }> {
  const { supabase } = await requireBandPermission(bandId, "band_profile");

  const { data: band } = await supabase
    .from("bands")
    .select("photos")
    .eq("id", bandId)
    .single();

  const photos = (Array.isArray(band?.photos) ? band.photos : []).filter(
    (url: string) => url !== photoUrl
  );

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
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}
