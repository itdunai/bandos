"use client";

import { SafeMediaImage } from "@/components/ui/safe-media-image";
import { cn } from "@/lib/utils";
import { stripCacheParam } from "@/lib/upload/media-url";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function ImageLightbox({
  images,
  initialIndex = 0,
  onClose,
}: {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goPrev, goNext]);

  if (!images.length) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
        aria-label="Закрыть"
      >
        <X className="h-5 w-5" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 sm:left-4"
            aria-label="Предыдущее"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 sm:right-4"
            aria-label="Следующее"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div
        className="relative z-[1] max-h-[85vh] w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] w-full sm:aspect-auto sm:h-[min(85vh,720px)]">
          <SafeMediaImage
            src={images[index]}
            alt=""
            fill
            priority
            className="object-contain"
          />
        </div>
        {images.length > 1 && (
          <p className="mt-2 text-center text-xs text-white/70">
            {index + 1} / {images.length}
          </p>
        )}
      </div>
    </div>
  );
}

export function PhotoGrid({
  photos,
  className,
  tileClassName,
  onPhotoClick,
}: {
  photos: string[];
  className?: string;
  tileClassName?: string;
  onPhotoClick?: (index: number) => void;
}) {
  if (!photos.length) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-8",
        className
      )}
    >
      {photos.map((url, i) => (
        <button
          key={stripCacheParam(url)}
          type="button"
          onClick={() => onPhotoClick?.(i)}
          className={cn(
            "relative aspect-square overflow-hidden rounded-md border border-border bg-bg-3",
            onPhotoClick && "cursor-zoom-in transition-opacity hover:opacity-90",
            tileClassName
          )}
        >
          <SafeMediaImage
            src={url}
            alt=""
            fill
            sizes="120px"
            className="object-cover"
          />
        </button>
      ))}
    </div>
  );
}

export function PhotoGallery({
  photos,
  title,
  className,
}: {
  photos: string[];
  title?: string;
  className?: string;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!photos.length) return null;

  return (
    <div className={className}>
      {title && <h3 className="mb-2 text-sm font-medium">{title}</h3>}
      <PhotoGrid photos={photos} onPhotoClick={setLightboxIndex} />
      {lightboxIndex !== null && (
        <ImageLightbox
          images={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
