import {
  SONG_STATUS_LABELS,
  SONG_TYPE_LABELS,
  type Song,
} from "@/types/database";
import { formatDuration } from "@/lib/utils";

function escapeCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportSongsToExcel(songs: Song[], bandSlug: string) {
  const headers = [
    "Название",
    "Тип",
    "Статус",
    "Тональность",
    "BPM",
    "Размер",
    "Длительность",
    "Жанр",
  ];

  const rows = songs.map((song) => [
    song.title,
    SONG_TYPE_LABELS[song.song_type],
    SONG_STATUS_LABELS[song.status],
    song.key ?? "",
    song.bpm?.toString() ?? "",
    song.time_signature ?? "",
    formatDuration(song.duration_sec),
    song.genre ?? "",
  ]);

  const content =
    "\ufeff" +
    [headers, ...rows]
      .map((row) => row.map((cell) => escapeCell(cell)).join(";"))
      .join("\r\n");

  const blob = new Blob([content], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `treki-${bandSlug}-${date}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
