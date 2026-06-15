"use client";

import {
  removeBandLogo,
  removeBandPhoto,
  saveBandLogoUrl,
  saveBandPhotoUrl,
} from "@/app/actions/media";
import { ImageUploadField } from "@/components/uploads/image-upload-field";
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
          До 12 фото — показываются на публичной странице
        </p>

        {localPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {localPhotos.map((url) => (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
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
                  className="absolute right-1 top-1 rounded-md bg-bg/80 p-1 text-red opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Удалить фото"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
    </section>
  );
}
