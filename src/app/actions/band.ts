"use server";

import {
  requireBandAdmin,
  requireBandPermission,
} from "@/lib/band/assert-access";
import { bandPath } from "@/lib/paths";
import { redirectWithToast } from "@/lib/redirect-with-toast";
import { sanitizeExternalUrl } from "@/lib/safe-url";
import type { SocialLinks } from "@/types/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseSocialLinks(formData: FormData): SocialLinks {
  const keys = ["vk", "telegram", "youtube", "instagram", "website"] as const;
  const links: SocialLinks = {};
  for (const key of keys) {
    const val = (formData.get(`social_${key}`) as string)?.trim();
    const safe = sanitizeExternalUrl(val);
    if (safe) links[key] = safe;
  }
  return links;
}

export async function updateBandProfile(
  bandId: string,
  bandSlug: string,
  formData: FormData
) {
  const { supabase } = await requireBandPermission(bandId, "band_profile");

  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string).trim() || null;
  const genre = (formData.get("genre") as string).trim() || null;
  const city = (formData.get("city") as string).trim() || null;
  const techRider = (formData.get("tech_rider") as string).trim() || null;
  const riderPublic = formData.get("rider_public") === "on";

  const { error } = await supabase
    .from("bands")
    .update({
      name,
      description,
      genre,
      city,
      tech_rider: techRider,
      rider_public: riderPublic,
      social_links: parseSocialLinks(formData),
    })
    .eq("id", bandId);

  if (error) {
    await redirectWithToast(bandPath(bandSlug), error.message);
    return;
  }

  revalidatePath(bandPath(bandSlug));
  revalidatePath(`/rider/${bandSlug}`);
  revalidatePath("/");
  redirect(bandPath(bandSlug));
}

export async function setRepertoirePublic(
  bandId: string,
  bandSlug: string,
  isPublic: boolean
) {
  const { supabase } = await requireBandPermission(bandId, "band_profile");

  await supabase
    .from("bands")
    .update({ repertoire_public: isPublic })
    .eq("id", bandId);

  revalidatePath(bandPath(bandSlug, "songs"));
  revalidatePath(`/rider/${bandSlug}`);
  revalidatePath(`/repertoire/${bandSlug}`);
  revalidatePath("/");
}
