"use server";

import { tryBandPermission } from "@/lib/band/assert-access";
import { bandPath } from "@/lib/paths";
import {
  avatarStoragePath,
  bandLogoStoragePath,
  bandPhotoStoragePath,
  validateImageFile,
} from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import {
  deleteMediaByUrl,
  displayUrlWithCacheBust,
  stripCacheParam,
  uploadBandMedia,
} from "@/lib/upload/supabase-storage";
import { logPlatformEventAsync } from "@/lib/platform/audit";
import { captureServerError } from "@/lib/monitoring/sentry";
import { revalidatePublicBand } from "@/lib/public-revalidate";
import { revalidatePath } from "next/cache";

function fileFromFormData(formData: FormData): File | null {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return null;
  return file;
}

function contentTypeForFile(file: File) {
  return file.type === "image/gif" ? "image/gif" : "image/webp";
}

function extensionForFile(file: File) {
  return file.type === "image/gif" ? "gif" : "webp";
}

function normalizePhotos(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function revalidateBandMedia(bandSlug: string) {
  revalidatePublicBand(bandSlug);
}

function logMediaError(
  userId: string,
  bandId: string | null,
  type: string,
  message: string
) {
  captureServerError(new Error(message), {
    action: "media.upload",
    userId,
    bandId,
    extras: { type },
  });

  logPlatformEventAsync({
    level: "error",
    event: "media.upload_failed",
    userId,
    bandId,
    meta: { type, message },
  });
}

export async function uploadBandLogoFile(
  bandId: string,
  bandSlug: string,
  formData: FormData
): Promise<{ publicUrl?: string; error?: string }> {
  const access = await tryBandPermission(bandId, "band_profile");
  if ("error" in access) return { error: access.error };

  const file = fileFromFormData(formData);
  if (!file) return { error: "Файл не получен" };

  const validation = validateImageFile(file);
  if (validation) return { error: validation };

  const { supabase } = access.auth;
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extensionForFile(file);
  const storagePath = bandLogoStoragePath(bandId, ext);

  const { data: band } = await supabase
    .from("bands")
    .select("logo_url")
    .eq("id", bandId)
    .single();

  const uploaded = await uploadBandMedia(
    supabase,
    storagePath,
    buffer,
    contentTypeForFile(file),
    true
  );
  if ("error" in uploaded) {
    logMediaError(access.auth.user.id, bandId, "logo", uploaded.error);
    return uploaded;
  }

  const cleanUrl = stripCacheParam(uploaded.publicUrl);
  const { error } = await supabase
    .from("bands")
    .update({ logo_url: cleanUrl })
    .eq("id", bandId);

  if (error) {
    await deleteMediaByUrl(supabase, cleanUrl);
    return { error: error.message };
  }

  if (band?.logo_url && stripCacheParam(band.logo_url) !== cleanUrl) {
    await deleteMediaByUrl(supabase, band.logo_url);
  }

  revalidateBandMedia(bandSlug);
  return { publicUrl: displayUrlWithCacheBust(cleanUrl) };
}

export async function uploadBandPhotoFile(
  bandId: string,
  bandSlug: string,
  formData: FormData
): Promise<{ publicUrl?: string; error?: string }> {
  const access = await tryBandPermission(bandId, "band_profile");
  if ("error" in access) return { error: access.error };

  const file = fileFromFormData(formData);
  if (!file) return { error: "Файл не получен" };

  const validation = validateImageFile(file);
  if (validation) return { error: validation };

  const { supabase } = access.auth;
  const { data: band, error: readError } = await supabase
    .from("bands")
    .select("photos")
    .eq("id", bandId)
    .single();

  if (readError) return { error: readError.message };

  const photos = normalizePhotos(band?.photos);
  if (photos.length >= 12) return { error: "Максимум 12 фото" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extensionForFile(file);
  const storagePath = bandPhotoStoragePath(bandId, ext);

  const uploaded = await uploadBandMedia(
    supabase,
    storagePath,
    buffer,
    contentTypeForFile(file),
    false
  );
  if ("error" in uploaded) {
    logMediaError(access.auth.user.id, bandId, "photo", uploaded.error);
    return uploaded;
  }

  const cleanUrl = stripCacheParam(uploaded.publicUrl);
  if (photos.includes(cleanUrl)) {
    return { publicUrl: displayUrlWithCacheBust(cleanUrl) };
  }

  const { error } = await supabase
    .from("bands")
    .update({ photos: [...photos, cleanUrl] })
    .eq("id", bandId);

  if (error) {
    await deleteMediaByUrl(supabase, cleanUrl);
    return { error: error.message };
  }

  revalidateBandMedia(bandSlug);
  return { publicUrl: displayUrlWithCacheBust(cleanUrl) };
}

export async function uploadAvatarFile(
  userId: string,
  formData: FormData
): Promise<{ publicUrl?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return { error: "Не авторизован" };
  }

  const file = fileFromFormData(formData);
  if (!file) return { error: "Файл не получен" };

  const validation = validateImageFile(file);
  if (validation) return { error: validation };

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extensionForFile(file);
  const storagePath = avatarStoragePath(userId, ext);

  const uploaded = await uploadBandMedia(
    supabase,
    storagePath,
    buffer,
    contentTypeForFile(file),
    true
  );
  if ("error" in uploaded) {
    logMediaError(user.id, null, "avatar", uploaded.error);
    return uploaded;
  }

  const cleanUrl = stripCacheParam(uploaded.publicUrl);
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: cleanUrl })
    .eq("id", userId);

  if (error) {
    await deleteMediaByUrl(supabase, cleanUrl);
    return { error: error.message };
  }

  if (profile?.avatar_url && stripCacheParam(profile.avatar_url) !== cleanUrl) {
    await deleteMediaByUrl(supabase, profile.avatar_url);
  }

  revalidatePath("/", "layout");
  return { publicUrl: displayUrlWithCacheBust(cleanUrl) };
}
