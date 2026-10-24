import { canViewFinances } from "@/lib/band/permissions";
import { monthlyTotals } from "@/lib/finance";
import { resolveItemDurationSec } from "@/lib/setlist-duration";
import { createClient } from "@/lib/supabase/server";
import type { Band, BandMember, EventType, SongType } from "@/types/database";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Окно событий вокруг «сейчас»: неделя назад (текущая неделя) и 5 недель вперёд. */
const EVENTS_PAST_DAYS = 7;
const EVENTS_FUTURE_DAYS = 35;
const TODOS_LIMIT = 5;

export interface OverviewEvent {
  id: string;
  title: string;
  event_type: EventType;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  setlist_id: string | null;
  fee: number | null;
}

export interface OverviewSetlistItem {
  id: string;
  title: string;
  key: string | null;
  bpm: number | null;
  durationSec: number;
  isCover: boolean;
  isSong: boolean;
}

export interface OverviewSetlist {
  id: string;
  name: string;
  eventId: string;
  eventTitle: string;
  eventStartsAt: string;
  items: OverviewSetlistItem[];
  totalSec: number;
}

export interface OverviewTodo {
  id: string;
  title: string;
  due_date: string | null;
}

export interface OverviewFinance {
  balance: number;
  months: { key: string; income: number; expense: number }[];
}

export interface BandOverview {
  events: OverviewEvent[];
  setlist: OverviewSetlist | null;
  todos: OverviewTodo[];
  openTodosCount: number;
  repertoire: { total: number; ready: number };
  finance: OverviewFinance | null;
}

type SongRef = {
  title: string;
  key: string | null;
  bpm: number | null;
  duration_sec: number | null;
  song_type: SongType;
};

export async function getBandOverview(
  band: Band,
  member: BandMember | null
): Promise<BandOverview> {
  const supabase = await createClient();
  const now = Date.now();
  const from = new Date(now - EVENTS_PAST_DAYS * DAY_MS).toISOString();
  const to = new Date(now + EVENTS_FUTURE_DAYS * DAY_MS).toISOString();
  const showFinance = member ? canViewFinances(member) : false;

  const [eventsRes, todosRes, openCountRes, songsTotalRes, songsReadyRes, txRes] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, title, event_type, starts_at, ends_at, location, setlist_id, fee")
        .eq("band_id", band.id)
        .gte("starts_at", from)
        .lte("starts_at", to)
        .order("starts_at", { ascending: true }),
      supabase
        .from("todos")
        .select("id, title, due_date")
        .eq("band_id", band.id)
        .eq("is_done", false)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("position", { ascending: true })
        .limit(TODOS_LIMIT),
      supabase
        .from("todos")
        .select("id", { count: "exact", head: true })
        .eq("band_id", band.id)
        .eq("is_done", false),
      supabase
        .from("songs")
        .select("id", { count: "exact", head: true })
        .eq("band_id", band.id),
      supabase
        .from("songs")
        .select("id", { count: "exact", head: true })
        .eq("band_id", band.id)
        .eq("status", "ready"),
      showFinance
        ? supabase
            .from("finance_transactions")
            .select("transaction_type, amount, transaction_at")
            .eq("band_id", band.id)
        : Promise.resolve({ data: null }),
    ]);

  const events = (eventsRes.data ?? []) as OverviewEvent[];
  // Supabase отдаёт timestamptz как "…+00:00" — сравниваем числа, не строки.
  const nextWithSetlist = events.find(
    (e) => e.setlist_id && Date.parse(e.starts_at) >= now
  );

  let setlist: OverviewSetlist | null = null;
  if (nextWithSetlist?.setlist_id) {
    const [{ data: setlistRow }, { data: items }] = await Promise.all([
      supabase
        .from("setlists")
        .select("id, name")
        .eq("id", nextWithSetlist.setlist_id)
        .eq("band_id", band.id)
        .maybeSingle(),
      supabase
        .from("setlist_items")
        .select("id, title, duration_sec, songs(title, key, bpm, duration_sec, song_type)")
        .eq("setlist_id", nextWithSetlist.setlist_id)
        .order("position"),
    ]);

    if (setlistRow) {
      const mapped = (items ?? []).map((item) => {
        const raw = item.songs as SongRef | SongRef[] | null;
        const song = Array.isArray(raw) ? raw[0] ?? null : raw;
        return {
          id: item.id,
          title: song?.title ?? item.title ?? "—",
          key: song?.key ?? null,
          bpm: song?.bpm ?? null,
          durationSec: resolveItemDurationSec({
            duration_sec: item.duration_sec,
            songs: song,
          }),
          isCover: song?.song_type === "cover",
          isSong: !!song,
        };
      });
      setlist = {
        id: setlistRow.id,
        name: setlistRow.name,
        eventId: nextWithSetlist.id,
        eventTitle: nextWithSetlist.title,
        eventStartsAt: nextWithSetlist.starts_at,
        items: mapped,
        totalSec: mapped.reduce((sum, i) => sum + i.durationSec, 0),
      };
    }
  }

  let finance: OverviewFinance | null = null;
  if (showFinance && txRes.data) {
    const tx = txRes.data as {
      transaction_type: "income" | "expense";
      amount: number;
      transaction_at: string;
    }[];
    let balance = Number(band.finance_opening_balance ?? 0);
    for (const t of tx) {
      balance += t.transaction_type === "income" ? Number(t.amount) : -Number(t.amount);
    }
    finance = { balance, months: monthlyTotals(tx) };
  }

  return {
    events,
    setlist,
    todos: (todosRes.data ?? []) as OverviewTodo[],
    openTodosCount: openCountRes.count ?? 0,
    repertoire: {
      total: songsTotalRes.count ?? 0,
      ready: songsReadyRes.count ?? 0,
    },
    finance,
  };
}
