import { createClient } from "@/lib/supabase/server";
import { decodeBandSlug } from "@/lib/paths";
import { slugify } from "@/lib/slug";
import type { Band, BandMember, Event } from "@/types/database";

export async function getUserBands(): Promise<Band[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("band_members")
    .select("band_id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (!memberships?.length) return [];

  const bandIds = memberships.map((m) => m.band_id);
  const { data: bands } = await supabase
    .from("bands")
    .select("*")
    .in("id", bandIds)
    .order("name");

  return bands ?? [];
}

export async function getBandBySlug(rawSlug: string): Promise<Band | null> {
  const supabase = await createClient();
  const decoded = decodeBandSlug(rawSlug);

  const candidates = [...new Set([decoded, slugify(decoded), rawSlug])];

  for (const slug of candidates) {
    if (!slug) continue;
    const { data } = await supabase
      .from("bands")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (data) return data;
  }

  return null;
}

export async function getCurrentMember(
  bandId: string
): Promise<BandMember | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("band_members")
    .select("*")
    .eq("band_id", bandId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  return data;
}

export async function getBandMemberCount(bandId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("band_members")
    .select("*", { count: "exact", head: true })
    .eq("band_id", bandId)
    .eq("is_active", true);
  return count ?? 0;
}

export async function getUpcomingEvent(bandId: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("band_id", bandId)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data;
}
