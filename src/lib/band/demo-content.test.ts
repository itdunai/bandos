import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/monitoring/sentry", () => ({ captureServerError: vi.fn() }));

import { captureServerError } from "@/lib/monitoring/sentry";
import {
  DEMO_SETLIST_NAME,
  DEMO_SONGS,
  DEMO_TODOS,
  seedDemoContent,
} from "@/lib/band/demo-content";

type Row = Record<string, unknown>;

/** Минимальный фейк supabase-js: insert(...).select(...)(.single()) */
function fakeSupabase(failTable?: string) {
  const inserted: Record<string, Row[]> = {};
  let seq = 0;

  const from = (table: string) => ({
    insert(rows: Row | Row[]) {
      const list = (Array.isArray(rows) ? rows : [rows]).map((r) => ({
        id: `${table}-${++seq}`,
        ...r,
      }));
      const error = table === failTable ? { message: `${table} failed` } : null;
      if (!error) inserted[table] = [...(inserted[table] ?? []), ...list];
      // Как в supabase-js: билдер — thenable, .select()/.single() уточняют результат
      const result = { data: error ? null : list, error };
      return {
        select: () => ({
          then: (cb: (r: typeof result) => unknown) => Promise.resolve(result).then(cb),
          single: () => Promise.resolve({ data: error ? null : list[0], error }),
        }),
        then: (cb: (r: { error: typeof error }) => unknown) =>
          Promise.resolve({ error }).then(cb),
      };
    },
  });

  return { client: { from } as unknown as SupabaseClient, inserted };
}

describe("seedDemoContent", () => {
  beforeEach(() => vi.mocked(captureServerError).mockClear());

  it("creates demo songs, a setlist and onboarding todos for the band", async () => {
    const { client, inserted } = fakeSupabase();
    await seedDemoContent(client, "band-1");

    expect(inserted.songs).toHaveLength(DEMO_SONGS.length);
    expect(inserted.songs.every((s) => s.band_id === "band-1")).toBe(true);
    expect(inserted.songs.every((s) => String(s.title).includes("(пример)"))).toBe(true);

    expect(inserted.setlists).toEqual([
      expect.objectContaining({ band_id: "band-1", name: DEMO_SETLIST_NAME }),
    ]);

    const songIds = new Set(inserted.songs.map((s) => s.id));
    const items = inserted.setlist_items;
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.every((i) => i.setlist_id === inserted.setlists[0].id)).toBe(true);
    // Позиции идут по порядку, ссылки на треки — только на только что созданные
    expect(items.map((i) => i.position)).toEqual(items.map((_, idx) => idx + 1));
    expect(items.filter((i) => i.song_id).every((i) => songIds.has(i.song_id))).toBe(true);

    expect(inserted.song_contents.every((c) => songIds.has(c.song_id))).toBe(true);
    expect(inserted.todos.map((t) => t.title)).toEqual(DEMO_TODOS);
    expect(captureServerError).not.toHaveBeenCalled();
  });

  it("never throws — a failed insert is reported and band creation continues", async () => {
    const { client, inserted } = fakeSupabase("setlists");
    await expect(seedDemoContent(client, "band-1")).resolves.toBeUndefined();
    expect(inserted.setlist_items).toBeUndefined();
    expect(captureServerError).toHaveBeenCalledOnce();
  });
});
