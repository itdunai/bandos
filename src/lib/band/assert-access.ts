import { createClient } from "@/lib/supabase/server";
import {
  hasPermission,
  isBandAdmin,
  type BandPermission,
} from "@/lib/band/permissions";
import { redirectForbidden } from "@/lib/forbidden";
import type { BandMember } from "@/types/database";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export type BandAuth = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  member: BandMember;
  bandId: string;
};

export { hasPermission, isBandAdmin };

async function loadAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function loadMember(
  supabase: BandAuth["supabase"],
  user: User,
  bandId: string
): Promise<BandMember | null> {
  const { data } = await supabase
    .from("band_members")
    .select("*")
    .eq("band_id", bandId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

export async function requireBandMember(bandId: string): Promise<BandAuth> {
  const { supabase, user } = await loadAuth();
  const member = await loadMember(supabase, user, bandId);
  if (!member) redirectForbidden({ reason: "not_member" });
  return { supabase, user, member, bandId };
}

export async function requireBandPermission(
  bandId: string,
  permission: BandPermission
): Promise<BandAuth> {
  const auth = await requireBandMember(bandId);
  if (!hasPermission(auth.member, permission)) {
    redirectForbidden({ reason: "no_permission", permission });
  }
  return auth;
}

export async function requireBandAdmin(bandId: string): Promise<BandAuth> {
  const auth = await requireBandMember(bandId);
  if (!isBandAdmin(auth.member)) {
    redirectForbidden({ reason: "admin_required" });
  }
  return auth;
}

async function requireMemberByResource(
  table: "setlists" | "songs" | "events" | "todos",
  id: string,
  permission: BandPermission
): Promise<BandAuth> {
  const { supabase, user } = await loadAuth();
  const { data } = await supabase
    .from(table)
    .select("band_id")
    .eq("id", id)
    .maybeSingle();

  if (!data?.band_id) redirectForbidden({ reason: "not_found" });

  const member = await loadMember(supabase, user, data.band_id);
  if (!member) redirectForbidden({ reason: "not_member" });
  if (!hasPermission(member, permission)) {
    redirectForbidden({ reason: "no_permission", permission });
  }

  return { supabase, user, member, bandId: data.band_id };
}

export function requireSetlistMember(setlistId: string) {
  return requireMemberByResource("setlists", setlistId, "setlists");
}

export function requireSongMember(songId: string) {
  return requireMemberByResource("songs", songId, "songs");
}

export function requireEventMember(eventId: string) {
  return requireMemberByResource("events", eventId, "schedule");
}

export function requireTodoMember(todoId: string) {
  return requireMemberByResource("todos", todoId, "todos");
}

/** For actions that return `{ error }` instead of redirecting. */
export async function tryBandPermission(
  bandId: string,
  permission: BandPermission
): Promise<{ auth: BandAuth } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const member = await loadMember(supabase, user, bandId);
  if (!member) return { error: "Нет доступа" };
  if (!hasPermission(member, permission)) return { error: "Нет прав" };
  return { auth: { supabase, user, member, bandId } };
}

export async function tryBandAdmin(
  bandId: string
): Promise<{ auth: BandAuth } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизован" };

  const member = await loadMember(supabase, user, bandId);
  if (!member) return { error: "Нет доступа" };
  if (!isBandAdmin(member)) return { error: "Нет прав" };
  return { auth: { supabase, user, member, bandId } };
}
