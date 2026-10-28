import type { SupabaseClient } from "@supabase/supabase-js";
import { captureServerError } from "@/lib/monitoring/sentry";

/**
 * Стартовый контент новой группы: несколько треков, сет-лист и чек-лист
 * «первых шагов» в «Делах». Пометка «(пример)» в названиях — чтобы было
 * понятно, что это можно удалить. Репертуар по умолчанию не публичный,
 * поэтому в каталог демо-треки не попадают.
 */

interface DemoSong {
  title: string;
  status: "ready" | "in_progress" | "demo";
  bpm: number;
  key: string;
  time_signature: string;
  duration_sec: number;
  genre: string;
  structure: string;
  chords: string;
  lyrics?: string;
  bassTab?: string;
}

export const DEMO_SONGS: DemoSong[] = [
  {
    title: "Ночная трасса (пример)",
    status: "ready",
    bpm: 128,
    key: "Em",
    time_signature: "4/4",
    duration_sec: 252,
    genre: "Альт-рок",
    structure: "Intro → Куплет → Припев → Куплет → Припев → Соло → Припев → Outro",
    chords: "[Куплет]\nEm — C — G — D\n\n[Припев]\nC — G — D — Em\n\n[Соло]\nEm — C — G — D ×2",
    lyrics:
      "[Куплет]\nНочной асфальт под колёсами,\nГород спит, а мы не спим.\n\n[Припев]\nФары режут темноту —\nМы успеем до утра.",
    bassTab:
      "[Куплет]\nG|----------------|\nD|----------------|\nA|--------------5-|\nE|--0---0---3-----|",
  },
  {
    title: "Эхо (пример)",
    status: "in_progress",
    bpm: 94,
    key: "Am",
    time_signature: "4/4",
    duration_sec: 330,
    genre: "Альт-рок",
    structure: "Intro → Куплет → Припев → Бридж → Припев → Outro",
    chords: "[Куплет]\nAm — F — C — G\n\n[Бридж]\nDm — Am — E",
    lyrics: "[Куплет]\nЭхо в пустом зале\nПовторяет наши имена.",
  },
  {
    title: "Сигналы (пример)",
    status: "ready",
    bpm: 110,
    key: "Dm",
    time_signature: "4/4",
    duration_sec: 238,
    genre: "Рок",
    structure: "Intro → Куплет → Припев → Соло → Outro",
    chords: "Dm — B♭ — F — C",
  },
  {
    title: "Вальс у моря (пример)",
    status: "demo",
    bpm: 84,
    key: "G",
    time_signature: "3/4",
    duration_sec: 205,
    genre: "Инди",
    structure: "Куплет → Припев → Куплет → Припев",
    chords: "G — Em — C — D",
  },
];

export const DEMO_SETLIST_NAME = "Пример сет-листа";

export const DEMO_TODOS = [
  "Добавить свой первый трек",
  "Пригласить участников группы («Участники»)",
  "Запланировать репетицию в «Графике»",
  "Открыть сет-лист в режиме «Играем»",
  "Удалить треки с пометкой «(пример)»",
];

/** Best-effort: ошибка сида не должна мешать созданию группы. */
export async function seedDemoContent(supabase: SupabaseClient, bandId: string) {
  try {
    const { data: songs, error: songsError } = await supabase
      .from("songs")
      .insert(
        DEMO_SONGS.map((s, i) => ({
          band_id: bandId,
          title: s.title,
          status: s.status,
          bpm: s.bpm,
          key: s.key,
          time_signature: s.time_signature,
          duration_sec: s.duration_sec,
          song_type: "original",
          genre: s.genre,
          structure: s.structure,
          sort_order: i + 1,
        }))
      )
      .select("id, title");
    if (songsError || !songs) throw songsError ?? new Error("songs insert failed");

    const idByTitle = new Map(songs.map((s) => [s.title as string, s.id as string]));
    const contents = DEMO_SONGS.flatMap((s) => {
      const songId = idByTitle.get(s.title);
      if (!songId) return [];
      const rows: { song_id: string; content_type: string; instrument: string | null; body: string }[] = [
        { song_id: songId, content_type: "chords", instrument: null, body: s.chords },
      ];
      if (s.lyrics) rows.push({ song_id: songId, content_type: "lyrics", instrument: null, body: s.lyrics });
      if (s.bassTab) rows.push({ song_id: songId, content_type: "tabs", instrument: "bass", body: s.bassTab });
      return rows;
    });

    const { data: setlist, error: setlistError } = await supabase
      .from("setlists")
      .insert({ band_id: bandId, name: DEMO_SETLIST_NAME })
      .select("id")
      .single();
    if (setlistError || !setlist) throw setlistError ?? new Error("setlist insert failed");

    const [first, second, third] = DEMO_SONGS.map((s) => idByTitle.get(s.title) ?? null);
    const items = [
      { setlist_id: setlist.id, song_id: first, position: 1, notes: "Начинаем без пауз" },
      { setlist_id: setlist.id, song_id: third, position: 2, notes: null },
      { setlist_id: setlist.id, song_id: null, title: "Настройка / приветствие", position: 3, notes: null, duration_sec: 60 },
      { setlist_id: setlist.id, song_id: second, position: 4, notes: "Медленный финал" },
    ];

    const results = await Promise.all([
      supabase.from("song_contents").insert(contents),
      supabase.from("setlist_items").insert(items),
      supabase.from("todos").insert(
        DEMO_TODOS.map((title, i) => ({ band_id: bandId, title, position: i + 1 }))
      ),
    ]);
    const failed = results.find((r) => r.error);
    if (failed?.error) throw failed.error;
  } catch (e) {
    captureServerError(e, { action: "band.seed_demo", bandId });
  }
}
