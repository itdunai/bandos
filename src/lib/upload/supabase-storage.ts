import { BAND_MEDIA_BUCKET } from "@/lib/storage";
import { deleteLocalMediaUrl } from "@/lib/upload/local-storage";
import { isLocalMediaUrl } from "@/lib/upload/media-url";
import {
  displayUrlWithCacheBust,
  isSupabaseMediaUrl,
  pathFromSupabasePublicUrl,
  stripCacheParam,
} from "@/lib/upload/media-url";
import type { SupabaseClient } from "@supabase/supabase-js";

export {
  displayUrlWithCacheBust,
  isSupabaseMediaUrl,
  pathFromSupabasePublicUrl,
  stripCacheParam,
};

export async function uploadBandMedia(
  supabase: SupabaseClient,
  storagePath: string,
  buffer: Buffer,
  contentType: string,
  upsert: boolean
): Promise<{ publicUrl: string } | { error: string }> {
  const { error } = await supabase.storage
    .from(BAND_MEDIA_BUCKET)
    .upload(storagePath, buffer, {
      upsert,
      contentType,
      cacheControl: "3600",
    });

  if (error) {
    return { error: translateStorageError(error.message) };
  }

  const { data } = supabase.storage
    .from(BAND_MEDIA_BUCKET)
    .getPublicUrl(storagePath);

  if (!data.publicUrl) {
    return { error: "Не удалось получить публичный URL файла" };
  }

  return { publicUrl: data.publicUrl };
}

export async function deleteSupabaseMediaUrl(
  supabase: SupabaseClient,
  url: string
) {
  const storagePath = pathFromSupabasePublicUrl(url);
  if (!storagePath) return;

  await supabase.storage.from(BAND_MEDIA_BUCKET).remove([storagePath]);
}

/** Удаляет файл из Supabase Storage и/или локального диска (старые URL). */
export async function deleteMediaByUrl(
  supabase: SupabaseClient,
  url: string | null | undefined
) {
  if (!url) return;

  if (isLocalMediaUrl(url)) {
    await deleteLocalMediaUrl(url);
    return;
  }

  if (isSupabaseMediaUrl(url)) {
    await deleteSupabaseMediaUrl(supabase, url);
  }
}

function translateStorageError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("payload too large") || lower.includes("exceeded")) {
    return "Файл слишком большой (максимум 5 МБ)";
  }
  if (lower.includes("mime") || lower.includes("not allowed")) {
    return "Формат файла не поддерживается";
  }
  if (lower.includes("row-level security") || lower.includes("policy")) {
    return "Нет прав на загрузку в хранилище. Проверьте миграцию 020.";
  }
  return message;
}
