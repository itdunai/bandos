export const BAND_MEDIA_BUCKET = "band-media";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!file.size) return "Файл пустой";
  if (file.size > MAX_IMAGE_BYTES) return "Максимальный размер — 5 МБ";
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Допустимы JPEG, PNG, WebP или GIF";
  }
  return null;
}

export function imageExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export function avatarStoragePath(userId: string, ext: string) {
  return `avatars/${userId}/avatar.${ext}`;
}

export function bandLogoStoragePath(bandId: string, ext: string) {
  return `bands/${bandId}/logo.${ext}`;
}

export function bandPhotoStoragePath(bandId: string, ext: string) {
  return `bands/${bandId}/photos/${crypto.randomUUID()}.${ext}`;
}
