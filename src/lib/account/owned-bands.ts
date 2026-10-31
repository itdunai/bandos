import type { SupabaseClient } from "@supabase/supabase-js";
import { removeUserFeedbackAttachments } from "@/lib/feedback/attachments";
import { BAND_MEDIA_BUCKET } from "@/lib/storage";

export interface OwnedBand {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
}

/** Группы, созданные пользователем, — удаляются вместе с аккаунтом. */
export async function getOwnedBands(
  supabase: SupabaseClient,
  userId: string
): Promise<OwnedBand[]> {
  const { data } = await supabase
    .from("band_members")
    .select("band_id, bands(id, name, slug, band_members(count))")
    .eq("user_id", userId)
    .eq("role", "admin");

  return (data ?? []).flatMap((row) => {
    const band = (Array.isArray(row.bands) ? row.bands[0] : row.bands) as
      | { id: string; name: string; slug: string; band_members: { count: number }[] }
      | null;
    if (!band) return [];
    return [
      {
        id: band.id,
        name: band.name,
        slug: band.slug,
        memberCount: band.band_members?.[0]?.count ?? 1,
      },
    ];
  });
}

async function removeFolder(supabase: SupabaseClient, folder: string) {
  const bucket = supabase.storage.from(BAND_MEDIA_BUCKET);
  const { data } = await bucket.list(folder, { limit: 1000 });
  if (!data?.length) return;

  const files: string[] = [];
  for (const entry of data) {
    // У папок в списке Storage нет id
    if (entry.id) files.push(`${folder}/${entry.name}`);
    else await removeFolder(supabase, `${folder}/${entry.name}`);
  }
  if (files.length) await bucket.remove(files);
}

/**
 * Удаляет файлы пользователя и его групп из Storage — от имени самого
 * пользователя (политики 020 разрешают). Best-effort: сбой не блокирует удаление.
 */
export async function removeAccountMedia(
  supabase: SupabaseClient,
  userId: string,
  bandIds: string[]
) {
  const folders = [`avatars/${userId}`, ...bandIds.map((id) => `bands/${id}`)];
  await Promise.all([
    ...folders.map((f) => removeFolder(supabase, f).catch(() => undefined)),
    // Скриншоты из обращений — в отдельном закрытом bucket
    removeUserFeedbackAttachments(supabase, userId).catch(() => undefined),
  ]);
}
