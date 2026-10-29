import type { SupabaseClient } from "@supabase/supabase-js";

export interface MetricsDay {
  day: string;
  registrations: number;
  bands: number;
  active: number;
  songs: number;
  events: number;
}

export interface TopBand {
  name: string;
  slug: string;
  created_at: string;
  members: number;
  songs: number;
  setlists: number;
  events: number;
  last_activity: string | null;
}

export interface PlatformMetrics {
  days: number;
  series: MetricsDay[];
  active: { dau: number; wau: number; mau: number; tracking_since: string | null };
  funnel: {
    registered: number;
    in_band: number;
    band_with_team: number;
    band_with_own_songs: number;
    telegram: number;
  };
  retention: { cohort: number; returned: number };
  top_bands: TopBand[];
  feedback: { open: number; new: number };
  errors_7d: number;
}

export const METRICS_PERIODS = [30, 90] as const;

/** Метрика для /admin (RPC из миграции 031). null — миграции нет или нет прав. */
export async function getPlatformMetrics(
  supabase: SupabaseClient,
  days: number
): Promise<PlatformMetrics | null> {
  const { data, error } = await supabase.rpc("get_platform_metrics", { p_days: days });
  if (error || !data) return null;
  return data as PlatformMetrics;
}

export function percent(part: number, total: number): number | null {
  return total > 0 ? Math.round((part / total) * 100) : null;
}
