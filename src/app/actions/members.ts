"use server";

import { requireBandAdmin, requireBandMember } from "@/lib/band/assert-access";
import {
  parsePermissionsPayload,
  parsePresetInput,
} from "@/lib/band/permissions";
import { bandPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirectWithToast } from "@/lib/redirect-with-toast";
import { redirect } from "next/navigation";

export async function updateMemberPermissions(
  memberId: string,
  bandId: string,
  bandSlug: string,
  formData: FormData
): Promise<{ error?: string }> {
  const { supabase } = await requireBandAdmin(bandId);

  const { data: target } = await supabase
    .from("band_members")
    .select("role, user_id")
    .eq("id", memberId)
    .eq("band_id", bandId)
    .maybeSingle();

  if (!target) return { error: "Участник не найден" };
  if (target.role === "admin") {
    return { error: "Права администратора нельзя изменить" };
  }

  const preset = parsePresetInput(formData.get("permission_preset") as string);
  const { permissions } = parsePermissionsPayload(preset, formData);

  const { error } = await supabase
    .from("band_members")
    .update({
      permission_preset: preset,
      permissions,
      role: "member",
    })
    .eq("id", memberId)
    .eq("band_id", bandId);

  if (error) return { error: error.message };

  revalidatePath(bandPath(bandSlug, "members"));
  return {};
}

export async function updateMemberProfile(
  memberId: string,
  bandSlug: string,
  formData: FormData
) {
  const bootstrap = await createClient();
  const {
    data: { user },
  } = await bootstrap.auth.getUser();
  if (!user) redirect("/login");

  const { data: target } = await bootstrap
    .from("band_members")
    .select("band_id, user_id")
    .eq("id", memberId)
    .maybeSingle();

  if (!target?.band_id) redirect("/");

  const { supabase, member: self } = await requireBandMember(target.band_id);

  if (target.user_id !== user.id && self.role !== "admin") {
    await redirectWithToast(bandPath(bandSlug, "members"), "Нет доступа");
    return;
  }

  const displayName = (formData.get("display_name") as string).trim();
  const phone = (formData.get("phone") as string) || null;
  const telegram = (formData.get("telegram") as string) || null;
  const instrument = formData.get("instrument") as string;

  const { error } = await supabase
    .from("band_members")
    .update({
      display_name: displayName || null,
      phone,
      telegram: telegram?.replace(/^@/, "") || null,
      instrument,
    })
    .eq("id", memberId);

  if (error) {
    await redirectWithToast(bandPath(bandSlug, "members"), error.message);
    return;
  }

  revalidatePath(bandPath(bandSlug, "members"));
  redirect(bandPath(bandSlug, "members"));
}

export async function excludeMember(
  memberId: string,
  bandId: string,
  bandSlug: string
): Promise<{ error?: string }> {
  const { supabase, member: self } = await requireBandAdmin(bandId);

  const { data: target } = await supabase
    .from("band_members")
    .select("id, role, user_id, is_active")
    .eq("id", memberId)
    .eq("band_id", bandId)
    .maybeSingle();

  if (!target || !target.is_active) {
    return { error: "Участник не найден" };
  }

  if (target.user_id === self.user_id) {
    return { error: "Нельзя исключить себя" };
  }

  if (target.role === "admin") {
    const { count } = await supabase
      .from("band_members")
      .select("*", { count: "exact", head: true })
      .eq("band_id", bandId)
      .eq("role", "admin")
      .eq("is_active", true);

    if ((count ?? 0) <= 1) {
      return { error: "Нельзя исключить последнего администратора" };
    }
  }

  const { error } = await supabase
    .from("band_members")
    .update({ is_active: false })
    .eq("id", memberId)
    .eq("band_id", bandId);

  if (error) return { error: error.message };

  revalidatePath(bandPath(bandSlug, "members"));
  return {};
}
