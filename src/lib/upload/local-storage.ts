import {
  avatarStoragePath,
  bandLogoStoragePath,
  bandPhotoStoragePath,
} from "@/lib/storage";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const PUBLIC_PREFIX = "/media/";

export function getUploadRoot() {
  const configured = process.env.UPLOAD_DIR?.trim();
  return configured
    ? path.resolve(configured)
    : path.join(process.cwd(), "data", "uploads");
}

export function isLocalMediaUrl(url: string) {
  return url.startsWith(PUBLIC_PREFIX);
}

export function publicUrlForStoragePath(storagePath: string) {
  return `${PUBLIC_PREFIX}${storagePath.replace(/\\/g, "/")}`;
}

function resolveSafeAbsolutePath(relativePath: string): string | null {
  const normalized = path.normalize(relativePath).replace(/\\/g, "/");
  if (
    !normalized ||
    path.isAbsolute(normalized) ||
    normalized.split("/").some((part) => part === "..")
  ) {
    return null;
  }

  const root = path.resolve(getUploadRoot());
  const absolute = path.resolve(root, normalized);
  if (!absolute.startsWith(root + path.sep) && absolute !== root) {
    return null;
  }
  return absolute;
}

function contentTypeForPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".webp") return "image/webp";
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

export async function writeLocalMedia(
  storagePath: string,
  buffer: Buffer
): Promise<{ publicUrl: string } | { error: string }> {
  const absolute = resolveSafeAbsolutePath(storagePath);
  if (!absolute) return { error: "Некорректный путь файла" };

  try {
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, buffer);
    return { publicUrl: publicUrlForStoragePath(storagePath) };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Не удалось сохранить файл",
    };
  }
}

export async function readLocalMediaFile(relativePath: string) {
  const absolute = resolveSafeAbsolutePath(relativePath);
  if (!absolute) return { error: "Not found" as const };

  try {
    const buffer = await readFile(absolute);
    return {
      buffer,
      contentType: contentTypeForPath(absolute),
    };
  } catch {
    return { error: "Not found" as const };
  }
}

export async function deleteLocalMediaUrl(url: string) {
  if (!isLocalMediaUrl(url)) return;

  const relative = url.slice(PUBLIC_PREFIX.length);
  const absolute = resolveSafeAbsolutePath(relative);
  if (!absolute) return;

  try {
    await unlink(absolute);
  } catch {
    // already removed
  }
}

export function bandLogoPath(bandId: string, ext: string) {
  return bandLogoStoragePath(bandId, ext);
}

export function bandPhotoPath(bandId: string, ext: string) {
  return bandPhotoStoragePath(bandId, ext);
}

export function avatarPath(userId: string, ext: string) {
  return avatarStoragePath(userId, ext);
}
