import type { SupabaseClient } from "@supabase/supabase-js";

/** Скриншоты в обращениях — закрытый bucket, файлы в папке автора. */
export const FEEDBACK_BUCKET = "feedback-attachments";
export const FEEDBACK_MAX_FILES = 3;
export const FEEDBACK_MAX_FILE_BYTES = 5 * 1024 * 1024;
/** Server Actions принимают до 10 МБ на запрос (next.config) — с запасом на текст */
export const FEEDBACK_MAX_TOTAL_BYTES = 9 * 1024 * 1024;

const SIGNED_URL_TTL_SEC = 60 * 60;

/** Тип по содержимому, а не по имени файла: PNG или JPEG, иначе null. */
export function sniffImageType(bytes: Uint8Array): "png" | "jpg" | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  return null;
}

/** Временные ссылки на вложения (RLS: свои — автору, все — админу платформы). */
export async function signFeedbackAttachments(
  supabase: SupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (!paths.length) return urls;
  const { data } = await supabase.storage
    .from(FEEDBACK_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SEC);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}

/** Все вложения автора — при удалении аккаунта. */
export async function removeUserFeedbackAttachments(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.storage.from(FEEDBACK_BUCKET).list(userId, { limit: 1000 });
  const paths = (data ?? []).map((f) => `${userId}/${f.name}`);
  if (paths.length) await supabase.storage.from(FEEDBACK_BUCKET).remove(paths);
}
