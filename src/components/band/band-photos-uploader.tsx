"use client";

import { Spinner } from "@/components/ui/spinner";
import { clientUploadBandPhoto } from "@/lib/upload/client-media";
import { cn } from "@/lib/utils";
import { AlertCircle, ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

interface QueueItem {
  id: string;
  name: string;
  preview: string;
  status: "waiting" | "uploading" | "error";
  error?: string;
}

/**
 * Добавление фото группы: несколько файлов сразу (выбор или перетаскивание),
 * превью с прогрессом. Загружаем по одному — сервер дописывает фото в список
 * группы, параллельные запросы затирали бы друг друга.
 */
export function BandPhotosUploader({
  bandId,
  bandSlug,
  freeSlots,
  onUploaded,
}: {
  bandId: string;
  bandSlug: string;
  /** Сколько ещё можно добавить до лимита */
  freeSlots: number;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const busy = queue.some((q) => q.status !== "error");
  const available = freeSlots - queue.filter((q) => q.status !== "error").length;

  async function addFiles(list: File[]) {
    setNotice(null);
    const images = list.filter((f) => ACCEPT.split(",").includes(f.type));
    if (images.length < list.length) setNotice("Пропущены файлы не-картинки (нужны JPEG, PNG, WebP или GIF)");
    const accepted = images.slice(0, Math.max(0, available));
    if (images.length > accepted.length) {
      setNotice(`Можно добавить ещё ${Math.max(0, available)} — лимит 12 фото`);
    }
    if (!accepted.length) return;

    const items: QueueItem[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      preview: URL.createObjectURL(file),
      status: "waiting",
    }));
    setQueue((prev) => [...prev, ...items]);

    for (const [i, file] of accepted.entries()) {
      const item = items[i];
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "uploading" } : q)));
      let result: { publicUrl?: string; error?: string };
      try {
        result = await clientUploadBandPhoto(bandId, bandSlug, file);
      } catch {
        result = { error: "Сервер не ответил — проверьте соединение" };
      }
      if (result.publicUrl) {
        onUploaded(result.publicUrl);
        URL.revokeObjectURL(item.preview);
        setQueue((prev) => prev.filter((q) => q.id !== item.id));
      } else {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "error", error: result.error ?? "Ошибка загрузки" } : q
          )
        );
      }
    }
  }

  function dismiss(id: string) {
    setQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((q) => q.id !== id);
    });
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          void addFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-8">
        {queue.map((item) => (
          <div
            key={item.id}
            className="relative aspect-square overflow-hidden rounded-md border border-border"
            title={item.error ?? item.name}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- локальное превью (blob:) */}
            <img
              src={item.preview}
              alt=""
              className={cn("h-full w-full object-cover", item.status !== "error" && "opacity-50")}
            />
            {item.status === "uploading" && (
              <span className="absolute inset-0 flex items-center justify-center bg-bg/40">
                <Spinner size="md" />
              </span>
            )}
            {item.status === "waiting" && (
              <span className="absolute inset-x-0 bottom-0 bg-bg/80 py-0.5 text-center text-[10px] text-text-secondary">
                в очереди
              </span>
            )}
            {item.status === "error" && (
              <>
                <span className="absolute inset-0 flex items-center justify-center bg-red/30">
                  <AlertCircle className="h-5 w-5 text-red" />
                </span>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Убрать"
                  className="absolute right-0.5 top-0.5 rounded bg-bg/80 p-0.5 text-text-secondary hover:text-text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        ))}

        {available > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void addFiles(Array.from(e.dataTransfer.files));
            }}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed text-text-muted transition-colors hover:border-accent hover:text-accent",
              dragOver ? "border-accent bg-accent/10 text-accent" : "border-border-strong bg-bg-3"
            )}
            aria-label="Добавить фото — можно выбрать несколько"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[11px] font-medium">Добавить</span>
          </button>
        )}
      </div>

      <p className="text-xs text-text-muted">
        {busy
          ? "Загружаем по одному — можно продолжать редактирование"
          : "Можно выбрать несколько фото сразу или перетащить их на «Добавить»."}
      </p>
      {queue.some((q) => q.status === "error") && (
        <p className="text-xs text-red">
          Не все фото загрузились — наведите на красное превью, чтобы увидеть причину.
        </p>
      )}
      {notice && <p className="text-xs text-amber">{notice}</p>}
    </div>
  );
}
