"use server";

import { tryBandPermission } from "@/lib/band/assert-access";
import { createClient } from "@/lib/supabase/server";
import {
  BAND_MEDIA_BUCKET,
  avatarStoragePath,
  bandLogoStoragePath,
  bandPhotoStoragePath,
  validateImageFile,
} from "@/lib/storage";
import type { SupabaseClient } from "@supabase/supabase-js";

async function uploadBuffer(
  supabase: SupabaseClient,
  path: string,
  buffer: Buffer,
  contentType: string,
  upsert: boolean
): Promise<{ publicUrl?: string; error?: string }> {
  const { error } = await supabase.storage
    .from(BAND_MEDIA_BUCKET)
    .upload(path, buffer, {
      upsert,
      contentType,
      cacheControl: "3600",
    });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from(BAND_MEDIA_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl };
}

function fileFromFormData(formData: FormData): File | null {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return null;
  return file;
}

export async function uploadBandLogoFile(
  bandId: string,
  formData: FormData
): Promise<{ publicUrl?: string; error?: string }> {
  const access = await tryBandPermission(bandId, "band_profile");
  if ("error" in access) return { error: access.error };

  const file = fileFromFormData(formData);
  if (!file) return { error: "Файл не получен" };

  const validation = validateImageFile(file);
  if (validation) return { error: validation };

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/gif" ? "gif" : "webp";

  return uploadBuffer(
    access.auth.supabase,
    bandLogoStoragePath(bandId, ext),
    buffer,
    file.type || "image/webp",
    true
  );
}

export async function uploadBandPhotoFile(
  bandId: string,
  formData: FormData
): Promise<{ publicUrl?: string; error?: string }> {
  const access = await tryBandPermission(bandId, "band_profile");
  if ("error" in access) return { error: access.error };

  const file = fileFromFormData(formData);
  if (!file) return { error: "Файл не получен" };

  const validation = validateImageFile(file);
  if (validation) return { error: validation };

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/gif" ? "gif" : "webp";

  return uploadBuffer(
    access.auth.supabase,
    bandPhotoStoragePath(bandId, ext),
    buffer,
    file.type || "image/webp",
    false
  );
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

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/gif" ? "gif" : "webp";

  return uploadBuffer(
    supabase,
    avatarStoragePath(userId, ext),
    buffer,
    file.type || "image/webp",
    true
  );
}
