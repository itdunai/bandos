"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { prepareImageFile, resolveImageMime } from "@/lib/image-prepare";
import {
  BAND_MEDIA_BUCKET,
  avatarStoragePath,
  bandLogoStoragePath,
  validateImageFile,
} from "@/lib/storage";

async function uploadPrepared(
  supabase: SupabaseClient,
  path: string,
  file: File
): Promise<{ publicUrl?: string; error?: string }> {
  const prepared =
    resolveImageMime(file) === "image/gif" ? file : await prepareImageFile(file);

  const { error } = await supabase.storage
    .from(BAND_MEDIA_BUCKET)
    .upload(path, prepared, {
      upsert: true,
      contentType: prepared.type,
      cacheControl: "3600",
    });

  if (error) return { error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BAND_MEDIA_BUCKET).getPublicUrl(path);

  return { publicUrl: `${publicUrl}?v=${Date.now()}` };
}

export async function clientUploadBandLogo(
  supabase: SupabaseClient,
  bandId: string,
  file: File
) {
  const validation = validateImageFile(file);
  if (validation) return { error: validation };
  try {
    return await uploadPrepared(
      supabase,
      bandLogoStoragePath(bandId, "webp"),
      file
    );
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Не удалось обработать изображение",
    };
  }
}

export async function clientUploadBandPhoto(
  supabase: SupabaseClient,
  bandId: string,
  file: File
) {
  const validation = validateImageFile(file);
  if (validation) return { error: validation };
  try {
    return await uploadPrepared(
      supabase,
      `bands/${bandId}/photos/${crypto.randomUUID()}.webp`,
      file
    );
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Не удалось обработать изображение",
    };
  }
}

export async function clientUploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
) {
  const validation = validateImageFile(file);
  if (validation) return { error: validation };
  try {
    return await uploadPrepared(
      supabase,
      avatarStoragePath(userId, "webp"),
      file
    );
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Не удалось обработать изображение",
    };
  }
}
