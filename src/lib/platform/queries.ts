import type { SupabaseClient } from "@supabase/supabase-js";

export interface PlatformStats {
  users: number;
  bands: number;
  active_members: number;
  songs: number;
  setlists: number;
  public_bands: number;
  registrations_7d: number;
  bands_7d: number;
}

export interface AuditLogRow {
  id: string;
  level: "info" | "warn" | "error";
  event: string;
  user_id: string | null;
  band_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export async function getPlatformStats(
  supabase: SupabaseClient
): Promise<PlatformStats | null> {
  const { data, error } = await supabase.rpc("get_platform_stats");
  if (error || !data) return null;
  return data as PlatformStats;
}

export async function getPlatformAuditLog(
  supabase: SupabaseClient,
  limit = 50
): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from("platform_audit_log")
    .select("id, level, event, user_id, band_id, meta, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as AuditLogRow[];
}

export async function checkPlatformHealth(supabase: SupabaseClient) {
  const checks: { name: string; ok: boolean; detail?: string }[] = [];

  const { error: bandsError } = await supabase
    .from("bands")
    .select("id", { count: "exact", head: true })
    .limit(1);

  checks.push({
    name: "PostgreSQL (bands)",
    ok: !bandsError,
    detail: bandsError?.message,
  });

  const { error: catalogError } = await supabase.rpc("get_public_bands_catalog");
  checks.push({
    name: "RPC get_public_bands_catalog",
    ok: !catalogError,
    detail: catalogError?.message,
  });

  const { error: storageError } = await supabase.storage
    .from("band-media")
    .list("", { limit: 1 });

  checks.push({
    name: "Storage bucket band-media",
    ok: !storageError,
    detail: storageError?.message,
  });

  return checks;
}
