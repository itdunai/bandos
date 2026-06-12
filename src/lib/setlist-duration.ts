type SongDurationRef =
  | { duration_sec: number | null }
  | { duration_sec: number | null }[]
  | null;

export function resolveItemDurationSec(item: {
  duration_sec: number | null;
  songs: SongDurationRef;
}): number {
  if (item.duration_sec != null) return item.duration_sec;
  const raw = item.songs;
  const song = Array.isArray(raw) ? raw[0] : raw;
  return song?.duration_sec ?? 0;
}

export function sumSetlistDurationSec(
  items: { duration_sec: number | null; songs: SongDurationRef }[]
): number {
  return items.reduce((sum, item) => sum + resolveItemDurationSec(item), 0);
}
