"use server";

import { tryBandPermission } from "@/lib/band/assert-access";
import { createClient } from "@/lib/supabase/server";
import {
  avatarPath,
  bandLogoPath,
  bandPhotoPath,
  writeLocalMedia,
} from "@/lib/upload/local-storage";
import { validateImageFile } from "@/lib/storage";

function fileFromFormData(formData: FormData): File | null {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return null;
  return file;
}

export async function uploadBandLogoFile(
  bandId: string,
  formData: FormData
): Promise<{ publicUrl?: string; error?: string }> {
  const access = await tryBandPermission(bandId, "band_profile");
  if ("error" in access) return { error: access.error };

  const file = fileFromFormData(formData);
  if (!file) return { error: "Файл не получен" };

  const validation = validateImageFile(file);
  if (validation) return { error: validation };

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/gif" ? "gif" : "webp";

  const saved = await writeLocalMedia(bandLogoPath(bandId, ext), buffer);
  if ("error" in saved) return saved;
  return { publicUrl: saved.publicUrl };
}

export async function uploadBandPhotoFile(
  bandId: string,
  formData: FormData
): Promise<{ publicUrl?: string; error?: string }> {
  const access = await tryBandPermission(bandId, "band_profile");
  if ("error" in access) return { error: access.error };

  const file = fileFromFormData(formData);
  if (!file) return { error: "Файл не получен" };

  const validation = validateImageFile(file);
  if (validation) return { error: validation };

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/gif" ? "gif" : "webp";

  const saved = await writeLocalMedia(bandPhotoPath(bandId, ext), buffer);
  if ("error" in saved) return saved;
  return { publicUrl: saved.publicUrl };
}

export async function uploadAvatarFile(
  userId: string,
  formData: FormData
): Promise<{ publicUrl?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return { error: "Не авторизован" };
  }

  const file = fileFromFormData(formData);
  if (!file) return { error: "Файл не получен" };

  const validation = validateImageFile(file);
  if (validation) return { error: validation };

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/gif" ? "gif" : "webp";

  const saved = await writeLocalMedia(avatarPath(userId, ext), buffer);
  if ("error" in saved) return saved;
  return { publicUrl: saved.publicUrl };
}
