"use client";

const OUTPUT_TYPE = "image/webp";
const OUTPUT_QUALITY = 0.88;
const MAX_SIDE = 1920;

function mimeFromName(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return null;
}

export function resolveImageMime(file: File): string {
  if (file.type) return file.type;
  return mimeFromName(file.name) ?? "image/jpeg";
}

/** Сжимает и конвертирует в WebP перед загрузкой — стабильнее, чем сырой PNG/JPEG через Server Actions. */
export async function prepareImageFile(file: File): Promise<File> {
  const mime = resolveImageMime(file);
  if (mime === "image/gif") return file;

  const bitmap = await createImageBitmap(file);
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > MAX_SIDE ? MAX_SIDE / longest : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Не удалось обработать изображение");

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("Не удалось сжать изображение")),
        OUTPUT_TYPE,
        OUTPUT_QUALITY
      );
    });

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.webp`, { type: OUTPUT_TYPE });
  } finally {
    bitmap.close();
  }
}
