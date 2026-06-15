"use client";

import {
  removeBandLogo,
  removeBandPhoto,
  uploadBandLogo,
  uploadBandPhoto,
} from "@/app/actions/media";
import { ImageUploadField } from "@/components/uploads/image-upload-field";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

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
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-xl border border-border bg-bg-2 p-4 space-y-4">
      <h2 className="text-sm font-medium">Фото и логотип</h2>

      <ImageUploadField
        label="Логотип"
        hint="JPEG, PNG, WebP или GIF до 5 МБ"
        currentUrl={logoUrl}
        onUpload={uploadBandLogo.bind(null, bandId, bandSlug)}
        onRemove={removeBandLogo.bind(null, bandId, bandSlug)}
        aspect="square"
      />

      <div className="space-y-2 border-t border-border pt-4">
        <div className="text-sm font-medium">Фото группы</div>
        <p className="text-xs text-text-secondary">
          До 12 фото — показываются на публичной странице
        </p>

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((url) => (
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
                      if (!result.error) router.refresh();
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
          onUpload={uploadBandPhoto.bind(null, bandId, bandSlug)}
          aspect="square"
        />
      </div>
    </section>
  );
}
