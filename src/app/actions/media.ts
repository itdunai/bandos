"use server";

import {
  requireBandAdmin,
  requireBandMember,
  requireBandPermission,
} from "@/lib/band/assert-access";
import { bandPath } from "@/lib/paths";
import {
  BAND_MEDIA_BUCKET,
  avatarStoragePath,
  bandLogoStoragePath,
  bandPhotoStoragePath,
  imageExtension,
  validateImageFile,
} from "@/lib/storage";
import { revalidatePath } from "next/cache";

async function uploadImage(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >,
  path: string,
  file: File
) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(BAND_MEDIA_BUCKET)
    .upload(path, buffer, { upsert: true, contentType: file.type });

  if (error) return { error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BAND_MEDIA_BUCKET).getPublicUrl(path);

  return { publicUrl };
}

export async function uploadBandLogo(
  bandId: string,
  bandSlug: string,
  formData: FormData
): Promise<{ error?: string }> {
  const file = formData.get("file") as File | null;
  if (!file?.size) return { error: "Выберите файл" };

  const validation = validateImageFile(file);
  if (validation) return { error: validation };

  const { supabase } = await requireBandPermission(bandId, "band_profile");
  const path = bandLogoStoragePath(bandId, imageExtension(file));
  const uploaded = await uploadImage(supabase, path, file);
  if (uploaded.error) return { error: uploaded.error };

  const { error } = await supabase
    .from("bands")
    .update({ logo_url: uploaded.publicUrl })
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

export async function uploadBandPhoto(
  bandId: string,
  bandSlug: string,
  formData: FormData
): Promise<{ error?: string }> {
  const file = formData.get("file") as File | null;
  if (!file?.size) return { error: "Выберите файл" };

  const validation = validateImageFile(file);
  if (validation) return { error: validation };

  const { supabase } = await requireBandPermission(bandId, "band_profile");

  const { data: band } = await supabase
    .from("bands")
    .select("photos")
    .eq("id", bandId)
    .single();

  const photos = Array.isArray(band?.photos) ? [...band.photos] : [];
  if (photos.length >= 12) return { error: "Максимум 12 фото" };

  const path = bandPhotoStoragePath(bandId, imageExtension(file));
  const uploaded = await uploadImage(supabase, path, file);
  if (uploaded.error) return { error: uploaded.error };

  photos.push(uploaded.publicUrl!);

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

export async function uploadMemberAvatar(
  formData: FormData
): Promise<{ error?: string; avatarUrl?: string }> {
  const file = formData.get("file") as File | null;
  if (!file?.size) return { error: "Выберите файл" };

  const validation = validateImageFile(file);
  if (validation) return { error: validation };

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const path = avatarStoragePath(user.id, imageExtension(file));
  const uploaded = await uploadImage(supabase, path, file);
  if (uploaded.error) return { error: uploaded.error };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: uploaded.publicUrl })
    .eq("id", user.id);

  if (error) return { error: error.message };

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");

  return { avatarUrl: uploaded.publicUrl };
}
