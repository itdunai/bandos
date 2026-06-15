"use client";

import {
  uploadAvatarFile,
  uploadBandLogoFile,
  uploadBandPhotoFile,
} from "@/app/actions/media-upload";
import { prepareImageFile, resolveImageMime } from "@/lib/image-prepare";
import { validateImageFile } from "@/lib/storage";

async function prepareForUpload(file: File): Promise<File> {
  if (resolveImageMime(file) === "image/gif") return file;
  return prepareImageFile(file);
}

async function uploadViaServer<T extends (bandId: string, formData: FormData) => Promise<{ publicUrl?: string; error?: string }>>(
  uploadAction: T,
  id: string,
  file: File
) {
  const validation = validateImageFile(file);
  if (validation) return { error: validation };

  try {
    const prepared = await prepareForUpload(file);
    const formData = new FormData();
    formData.append("file", prepared, prepared.name);
    return await uploadAction(id, formData);
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Не удалось обработать изображение",
    };
  }
}

export async function clientUploadBandLogo(bandId: string, file: File) {
  return uploadViaServer(uploadBandLogoFile, bandId, file);
}

export async function clientUploadBandPhoto(bandId: string, file: File) {
  return uploadViaServer(uploadBandPhotoFile, bandId, file);
}

export async function clientUploadAvatar(userId: string, file: File) {
  const validation = validateImageFile(file);
  if (validation) return { error: validation };

  try {
    const prepared = await prepareForUpload(file);
    const formData = new FormData();
    formData.append("file", prepared, prepared.name);
    return await uploadAvatarFile(userId, formData);
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Не удалось обработать изображение",
    };
  }
}
