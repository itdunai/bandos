"use server";

import { tryBandAdmin } from "@/lib/band/assert-access";
import {
  parsePermissionsPayload,
  parsePresetInput,
} from "@/lib/band/permissions";
import { createClient } from "@/lib/supabase/server";
import { fetchInvitationByToken } from "@/lib/invitation";
import { formatAuthError, isAlreadyRegisteredError } from "@/lib/auth-errors";
import { logPlatformEventAsync } from "@/lib/platform/audit";
import { bandPath } from "@/lib/paths";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import { getSiteUrl } from "@/lib/site-url";
import type { MemberRole } from "@/types/database";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function getInvitation(token: string) {
  const supabase = await createClient();
  return fetchInvitationByToken(supabase, token);
}

/** Регистрация аккаунта без создания группы */
export async function signUpAccount(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = (formData.get("display_name") as string).trim();
  const siteUrl = getSiteUrl();

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (signUpError) {
    redirect(
      `/register?error=${encodeURIComponent(formatAuthError(signUpError.message))}`
    );
  }

  if (!authData.user) {
    redirect("/register?error=Не удалось создать пользователя");
  }

  if (!authData.session) {
    redirect(`/register?confirm=1&email=${encodeURIComponent(email)}`);
  }

  logPlatformEventAsync({
    level: "info",
    event: "user.registered",
    userId: authData.user.id,
    meta: { email },
  });

  redirect("/");
}

/** Регистрация по приглашению → вступление в группу */
export async function signUpFromInvite(token: string, formData: FormData) {
  const invitation = await getInvitation(token);
  if (!invitation) {
    redirect(`/invite/${token}?error=${encodeURIComponent("Приглашение недействительно")}`);
  }

  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = (formData.get("display_name") as string).trim();
  const siteUrl = getSiteUrl();
  const invitePath = `/invite/${token}`;

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(invitePath)}`,
    },
  });

  if (signUpError) {
    const msg = formatAuthError(signUpError.message);
    if (isAlreadyRegisteredError(signUpError.message)) {
      redirect(
        `/login?next=${encodeURIComponent(`/invite/${token}`)}&error=${encodeURIComponent(msg)}`
      );
    }
    redirect(`/invite/${token}/join?error=${encodeURIComponent(msg)}`);
  }

  if (!authData.user) {
    redirect(`/invite/${token}/join?error=Не удалось создать пользователя`);
  }

  if (!authData.session) {
    redirect(`/invite/${token}?confirm=1&email=${encodeURIComponent(email)}`);
  }

  return finishAcceptInvitation(token);
}

/** Создание группы (для уже зарегистрированных) */
export async function createBand(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/new-band");
  }

  const bandName = (formData.get("band_name") as string).trim();
  const displayName = (formData.get("display_name") as string).trim();
  const instrument = (formData.get("instrument") as string) || "guitar";

  if (!bandName) {
    redirect("/new-band?error=Укажите название группы");
  }

  const { data: bandId, error: bandError } = await supabase.rpc(
    "create_band_with_admin",
    {
      p_name: bandName,
      p_user_id: user.id,
      p_display_name: displayName || undefined,
      p_instrument: instrument,
    }
  );

  if (bandError) {
    logPlatformEventAsync({
      level: "error",
      event: "band.create_failed",
      userId: user.id,
      meta: { message: bandError.message, bandName },
    });
    redirect(`/new-band?error=${encodeURIComponent(bandError.message)}`);
  }

  logPlatformEventAsync({
    level: "info",
    event: "band.created",
    userId: user.id,
    bandId: bandId as string,
    meta: { bandName },
  });

  const { data: band } = await supabase
    .from("bands")
    .select("slug")
    .eq("id", bandId)
    .single();

  if (band) {
    redirect(bandPath(band.slug));
  }

  redirect("/");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = formData.get("next") as string | null;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const params = new URLSearchParams({
      error: formatAuthError(error.message),
    });
    if (next) params.set("next", next);
    redirect(`/login?${params.toString()}`);
  }

  const safeNext = sanitizeRedirectPath(next);
  if (safeNext) {
    redirect(safeNext);
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function finishAcceptInvitation(token: string) {
  const supabase = await createClient();

  const { data: bandId, error } = await supabase.rpc("accept_invitation", {
    p_token: token,
  });

  if (error) {
    redirect(`/invite/${token}?error=${encodeURIComponent(error.message)}`);
  }

  const { data: band } = await supabase
    .from("bands")
    .select("slug")
    .eq("id", bandId)
    .single();

  revalidatePath("/");

  if (band) {
    redirect(bandPath(band.slug));
  }

  redirect("/");
}

export async function acceptInvitation(token: string) {
  return finishAcceptInvitation(token);
}

export async function createInvitation(
  bandId: string,
  formData: FormData
): Promise<{ token?: string; error?: string }> {
  const access = await tryBandAdmin(bandId);
  if ("error" in access) return { error: access.error };

  const { supabase, user } = access.auth;
  const email = (formData.get("email") as string) || null;
  const instrument = (formData.get("instrument") as string) || "other";
  const preset = parsePresetInput(formData.get("permission_preset") as string);
  const { permissions } = parsePermissionsPayload(preset, formData);

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      band_id: bandId,
      email,
      role: "member" as MemberRole,
      instrument,
      permission_preset: preset,
      permissions,
      invited_by: user.id,
    })
    .select("token")
    .single();

  if (error) return { error: error.message };
  return { token: data.token };
}
