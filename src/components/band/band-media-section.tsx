"use client";

import {
  removeBandLogo,
  removeBandPhoto,
  saveBandLogoUrl,
  saveBandPhotoUrl,
} from "@/app/actions/media";
import { ImageUploadField } from "@/components/uploads/image-upload-field";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import {
  clientUploadBandLogo,
  clientUploadBandPhoto,
} from "@/lib/upload/client-media";

export function BandMediaSection({
  bandId,
  bandSlug,
  logoUrl,
  photos,
}: {
  bandId: string;
  bandSlug: string;
  logoUrl: string | null;
  photos: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [localLogoUrl, setLocalLogoUrl] = useState(logoUrl);
  const [localPhotos, setLocalPhotos] = useState(photos);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setLocalLogoUrl(logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);

  return (
    <section className="rounded-xl border border-border bg-bg-2 p-4 space-y-4">
      <h2 className="text-sm font-medium">Фото и логотип</h2>

      <ImageUploadField
        label="Логотип"
        hint="JPEG, PNG, WebP или GIF до 5 МБ — перед загрузкой сжимается в WebP"
        currentUrl={localLogoUrl}
        onUpload={async (file) => {
          const uploaded = await clientUploadBandLogo(bandId, file);
          if (uploaded.error || !uploaded.publicUrl) {
            return { error: uploaded.error ?? "Ошибка загрузки в хранилище" };
          }

          const saved = await saveBandLogoUrl(
            bandId,
            bandSlug,
            uploaded.publicUrl
          );
          if (saved.error) return { error: saved.error };

          const url = saved.url ?? uploaded.publicUrl;
          setLocalLogoUrl(url);
          return { url };
        }}
        onRemove={async () => {
          const result = await removeBandLogo(bandId, bandSlug);
          if (!result.error) setLocalLogoUrl(null);
          return result;
        }}
        aspect="square"
      />

      <div className="space-y-2 border-t border-border pt-4">
        <div className="text-sm font-medium">Фото группы</div>
        <p className="text-xs text-text-secondary">
          До 12 фото — показываются на публичной странице. Нажмите для просмотра.
        </p>

        {localPhotos.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-8">
            {localPhotos.map((url, index) => (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-md border border-border"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="absolute inset-0 cursor-zoom-in"
                  aria-label="Открыть фото"
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await removeBandPhoto(bandId, bandSlug, url);
                      if (!result.error) {
                        setLocalPhotos((prev) => prev.filter((item) => item !== url));
                      }
                    });
                  }}
                  className="absolute right-0.5 top-0.5 z-10 rounded bg-bg/80 p-0.5 text-red opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Удалить фото"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <ImageUploadField
          label=""
          currentUrl={null}
          onUpload={async (file) => {
            const uploaded = await clientUploadBandPhoto(bandId, file);
            if (uploaded.error || !uploaded.publicUrl) {
              return { error: uploaded.error ?? "Ошибка загрузки в хранилище" };
            }

            const saved = await saveBandPhotoUrl(
              bandId,
              bandSlug,
              uploaded.publicUrl
            );
            if (saved.error) return { error: saved.error };

            const url = saved.url ?? uploaded.publicUrl;
            setLocalPhotos((prev) =>
              prev.includes(url) ? prev : [...prev, url]
            );
            return { url };
          }}
          aspect="square"
        />
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={localPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
}
