"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";

function isBlobUrl(url: string) {
  return url.startsWith("blob:");
}

function formatUploadError(err: unknown) {
  if (err instanceof Error) {
    if (err.message === "Failed to fetch" || err.name === "TypeError") {
      return "Сервер не ответил. Проверьте соединение и попробуйте снова.";
    }
    return err.message;
  }
  return "Не удалось загрузить изображение";
}

export function ImageUploadField({
  label,
  hint,
  currentUrl,
  onUpload,
  onRemove,
  aspect = "square",
}: {
  label: string;
  hint?: string;
  currentUrl?: string | null;
  onUpload: (file: File) => Promise<{ error?: string; url?: string }>;
  onRemove?: () => Promise<{ error?: string }>;
  aspect?: "square" | "wide";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);

  useEffect(() => {
    setSavedUrl(null);
  }, [currentUrl]);

  const displayUrl = previewUrl ?? savedUrl ?? currentUrl ?? null;

  const frameClass =
    aspect === "wide"
      ? "relative h-24 w-40 overflow-hidden rounded-lg border border-border"
      : "relative h-20 w-20 overflow-hidden rounded-lg border border-border";

  const placeholderClass =
    aspect === "wide"
      ? "flex h-24 w-40 items-center justify-center rounded-lg border border-dashed border-border bg-bg-3 text-text-muted"
      : "flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border bg-bg-3 text-text-muted";

  function handleFile(file: File) {
    setError(null);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    startTransition(async () => {
      try {
        const result = await onUpload(file);
        if (result.error) {
          setError(result.error);
          setPreviewUrl(null);
          return;
        }

        setPreviewUrl(null);
        if (result.url) {
          setSavedUrl(result.url);
        }
      } catch (err) {
        setPreviewUrl(null);
        setError(formatUploadError(err));
      } finally {
        URL.revokeObjectURL(localPreview);
      }
    });
  }

  return (
    <div className="space-y-2">
      {label ? <div className="text-sm font-medium">{label}</div> : null}
      {hint && <p className="text-xs text-text-secondary">{hint}</p>}

      <div className="flex flex-wrap items-start gap-3">
        {displayUrl ? (
          <div className={frameClass}>
            {isBlobUrl(displayUrl) ? (
              // next/image не поддерживает blob: — ломает страницу при выборе файла
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayUrl}
                alt={label || "preview"}
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={displayUrl}
                alt={label || "preview"}
                fill
                unoptimized
                className="object-cover"
              />
            )}
          </div>
        ) : (
          <div className={placeholderClass}>
            <ImagePlus className="h-6 w-6" />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="default"
            loading={pending}
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            {pending ? "Загрузка…" : displayUrl ? "Заменить" : "Загрузить"}
          </Button>
          {currentUrl && onRemove && (
            <Button
              type="button"
              variant="default"
              disabled={pending}
              className={cn("text-red hover:border-red hover:text-red")}
              onClick={() => {
                setError(null);
                setPreviewUrl(null);
                setSavedUrl(null);
                startTransition(async () => {
                  try {
                    const result = await onRemove();
                    if (result.error) setError(result.error);
                  } catch (err) {
                    setError(formatUploadError(err));
                  }
                });
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Удалить
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  );
}
