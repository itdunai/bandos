"use server";

import {
  requireBandPermission,
  requireReleaseMember,
} from "@/lib/band/assert-access";
import { bandPath } from "@/lib/paths";
import { revalidatePublicBand } from "@/lib/public-revalidate";
import { sanitizeExternalUrl } from "@/lib/safe-url";
import {
  RELEASE_PLATFORMS,
  type ReleasePlatform,
} from "@/types/database";
import { revalidatePath } from "next/cache";
import { redirectWithToast } from "@/lib/redirect-with-toast";
import { redirect } from "next/navigation";

function parseReleaseLinks(formData: FormData) {
  const links: { platform: ReleasePlatform; url: string }[] = [];
  for (const platform of RELEASE_PLATFORMS) {
    const raw = formData.get(`link_${platform}`);
    if (typeof raw !== "string") continue;
    const url = sanitizeExternalUrl(raw);
    if (!url) continue;
    links.push({ platform, url });
  }
  return links;
}

function parseReleaseForm(formData: FormData) {
  const songId = (formData.get("song_id") as string)?.trim() || "";
  const title = (formData.get("title") as string)?.trim() || "";
  const releasedAt = (formData.get("released_at") as string)?.trim() || "";
  const notes = (formData.get("notes") as string)?.trim() || null;
  const coverUrl = sanitizeExternalUrl(formData.get("cover_url") as string);

  return {
    song_id: songId,
    title,
    released_at: /^\d{4}-\d{2}-\d{2}$/.test(releasedAt) ? releasedAt : null,
    cover_url: coverUrl,
    notes: notes || null,
    links: parseReleaseLinks(formData),
  };
}

async function replaceReleaseLinks(
  supabase: Awaited<
    ReturnType<typeof requireBandPermission>
  >["supabase"],
  releaseId: string,
  links: { platform: ReleasePlatform; url: string }[]
) {
  await supabase.from("release_links").delete().eq("release_id", releaseId);
  if (links.length === 0) return;
  const { error } = await supabase.from("release_links").insert(
    links.map((link) => ({
      release_id: releaseId,
      platform: link.platform,
      url: link.url,
    }))
  );
  if (error) throw error;
}

export async function createRelease(
  bandId: string,
  bandSlug: string,
  formData: FormData
) {
  const { supabase } = await requireBandPermission(bandId, "songs");
  const data = parseReleaseForm(formData);

  if (!data.song_id || !data.title || !data.released_at) {
    await redirectWithToast(
      bandPath(bandSlug, "releases", "new"),
      "Укажите трек, название и дату релиза"
    );
    return;
  }

  const { data: song } = await supabase
    .from("songs")
    .select("id")
    .eq("id", data.song_id)
    .eq("band_id", bandId)
    .maybeSingle();

  if (!song) {
    await redirectWithToast(
      bandPath(bandSlug, "releases", "new"),
      "Трек не найден"
    );
    return;
  }

  const { data: release, error } = await supabase
    .from("releases")
    .insert({
      band_id: bandId,
      song_id: data.song_id,
      title: data.title,
      released_at: data.released_at,
      cover_url: data.cover_url,
      notes: data.notes,
    })
    .select("id")
    .single();

  if (error || !release) {
    await redirectWithToast(
      bandPath(bandSlug, "releases", "new"),
      error?.message ?? "Ошибка"
    );
    return;
  }

  try {
    await replaceReleaseLinks(supabase, release.id, data.links);
  } catch (e) {
    await redirectWithToast(
      bandPath(bandSlug, "releases", release.id, "edit"),
      e instanceof Error ? e.message : "Не удалось сохранить ссылки"
    );
    return;
  }

  revalidatePath(bandPath(bandSlug, "releases"));
  revalidatePath(bandPath(bandSlug, "songs", data.song_id));
  revalidatePath(bandPath(bandSlug));
  revalidatePublicBand(bandSlug);
  redirect(bandPath(bandSlug, "releases", release.id));
}

export async function updateRelease(
  releaseId: string,
  bandId: string,
  bandSlug: string,
  formData: FormData
) {
  const { supabase } = await requireBandPermission(bandId, "songs");
  const data = parseReleaseForm(formData);

  if (!data.song_id || !data.title || !data.released_at) {
    await redirectWithToast(
      bandPath(bandSlug, "releases", releaseId, "edit"),
      "Укажите трек, название и дату релиза"
    );
    return;
  }

  const { data: song } = await supabase
    .from("songs")
    .select("id")
    .eq("id", data.song_id)
    .eq("band_id", bandId)
    .maybeSingle();

  if (!song) {
    await redirectWithToast(
      bandPath(bandSlug, "releases", releaseId, "edit"),
      "Трек не найден"
    );
    return;
  }

  const { error } = await supabase
    .from("releases")
    .update({
      song_id: data.song_id,
      title: data.title,
      released_at: data.released_at,
      cover_url: data.cover_url,
      notes: data.notes,
    })
    .eq("id", releaseId)
    .eq("band_id", bandId);

  if (error) {
    await redirectWithToast(
      bandPath(bandSlug, "releases", releaseId, "edit"),
      error.message
    );
    return;
  }

  try {
    await replaceReleaseLinks(supabase, releaseId, data.links);
  } catch (e) {
    await redirectWithToast(
      bandPath(bandSlug, "releases", releaseId, "edit"),
      e instanceof Error ? e.message : "Не удалось сохранить ссылки"
    );
    return;
  }

  revalidatePath(bandPath(bandSlug, "releases"));
  revalidatePath(bandPath(bandSlug, "releases", releaseId));
  revalidatePath(bandPath(bandSlug, "songs", data.song_id));
  revalidatePath(bandPath(bandSlug));
  revalidatePublicBand(bandSlug);
  redirect(bandPath(bandSlug, "releases", releaseId));
}

export async function deleteRelease(releaseId: string, bandSlug: string) {
  const { supabase, bandId } = await requireReleaseMember(releaseId);

  const { data: release } = await supabase
    .from("releases")
    .select("song_id")
    .eq("id", releaseId)
    .eq("band_id", bandId)
    .maybeSingle();

  await supabase.from("releases").delete().eq("id", releaseId).eq("band_id", bandId);

  revalidatePath(bandPath(bandSlug, "releases"));
  revalidatePath(bandPath(bandSlug));
  revalidatePublicBand(bandSlug);
  if (release?.song_id) {
    revalidatePath(bandPath(bandSlug, "songs", release.song_id));
  }
  redirect(bandPath(bandSlug, "releases"));
}
