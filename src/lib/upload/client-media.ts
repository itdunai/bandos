"use client";

import { prepareImageFile, resolveImageMime } from "@/lib/image-prepare";
import { createClient } from "@/lib/supabase/client";
import {
  BAND_MEDIA_BUCKET,
  avatarStoragePath,
  bandLogoStoragePath,
  validateImageFile,
} from "@/lib/storage";

async function uploadPrepared(
  path: string,
  file: File
): Promise<{ publicUrl?: string; error?: string }> {
  const supabase = createClient();
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

export async function clientUploadBandLogo(bandId: string, file: File) {
  const validation = validateImageFile(file);
  if (validation) return { error: validation };
  try {
    return await uploadPrepared(bandLogoStoragePath(bandId, "webp"), file);
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Не удалось обработать изображение",
    };
  }
}

export async function clientUploadBandPhoto(bandId: string, file: File) {
  const validation = validateImageFile(file);
  if (validation) return { error: validation };
  try {
    return await uploadPrepared(
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

export async function clientUploadAvatar(userId: string, file: File) {
  const validation = validateImageFile(file);
  if (validation) return { error: validation };
  try {
    return await uploadPrepared(avatarStoragePath(userId, "webp"), file);
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Не удалось обработать изображение",
    };
  }
}
