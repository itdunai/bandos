"use client";

import { Button } from "@/components/ui/button";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

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
  onUpload: (formData: FormData) => Promise<{ error?: string }>;
  onRemove?: () => Promise<{ error?: string }>;
  aspect?: "square" | "wide";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    setError(null);
    startTransition(async () => {
      const result = await onUpload(formData);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      {hint && <p className="text-xs text-text-secondary">{hint}</p>}

      <div className="flex flex-wrap items-start gap-3">
        {currentUrl ? (
          <div
            className={
              aspect === "wide"
                ? "relative h-24 w-40 overflow-hidden rounded-lg border border-border"
                : "relative h-20 w-20 overflow-hidden rounded-lg border border-border"
            }
          >
            <Image
              src={currentUrl}
              alt={label}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className={
              aspect === "wide"
                ? "flex h-24 w-40 items-center justify-center rounded-lg border border-dashed border-border bg-bg-3 text-text-muted"
                : "flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border bg-bg-3 text-text-muted"
            }
          >
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
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            {currentUrl ? "Заменить" : "Загрузить"}
          </Button>
          {currentUrl && onRemove && (
            <Button
              type="button"
              variant="default"
              disabled={pending}
              className="text-red hover:border-red hover:text-red"
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await onRemove();
                  if (result.error) setError(result.error);
                  else router.refresh();
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
