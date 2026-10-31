"use client";

import {
  FEEDBACK_MAX_FILES,
  FEEDBACK_MAX_FILE_BYTES,
  FEEDBACK_MAX_TOTAL_BYTES,
} from "@/lib/feedback/attachments";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const ACCEPT = ["image/png", "image/jpeg"];

/**
 * Скриншоты к обращению: кнопка выбора или Ctrl+V прямо на странице.
 * Выбранные файлы уходят в форму через скрытое поле `attachments`.
 */
export function FeedbackAttachmentsInput() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const formInputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  // Скрытое поле формы — всегда то, что видно в превью
  useEffect(() => {
    const input = formInputRef.current;
    if (!input) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
  }, [files]);

  function add(incoming: File[]) {
    setError(null);
    const images = incoming.filter((f) => ACCEPT.includes(f.type));
    if (images.length < incoming.length) setError("Можно прикрепить только PNG или JPG");
    const next = [...files];
    for (const file of images) {
      if (next.length >= FEEDBACK_MAX_FILES) {
        setError(`Не больше ${FEEDBACK_MAX_FILES} картинок`);
        break;
      }
      if (file.size > FEEDBACK_MAX_FILE_BYTES) {
        setError(`«${file.name}» больше 5 МБ`);
        continue;
      }
      if (next.reduce((s, f) => s + f.size, 0) + file.size > FEEDBACK_MAX_TOTAL_BYTES) {
        setError("Все картинки вместе — до 9 МБ");
        break;
      }
      next.push(file);
    }
    setFiles(next);
  }

  // Скриншот из буфера: Ctrl+V / ⌘V где угодно на странице
  const addRef = useRef(add);
  useEffect(() => {
    addRef.current = add;
  });
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const pasted = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (!pasted.length) return;
      e.preventDefault();
      addRef.current(
        pasted.map((f, i) =>
          f.name && f.name !== "image.png"
            ? f
            : new File([f], `screenshot-${Date.now()}-${i + 1}.png`, { type: f.type })
        )
      );
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  return (
    <div className="space-y-2">
      <input ref={formInputRef} type="file" name="attachments" multiple hidden tabIndex={-1} />
      <input
        ref={pickerRef}
        type="file"
        accept={ACCEPT.join(",")}
        multiple
        hidden
        onChange={(e) => {
          add(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- локальное превью (blob:) */}
              <img
                src={previews[i]}
                alt={file.name}
                className="h-20 w-20 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                aria-label={`Убрать ${file.name}`}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-bg-2 text-text-secondary hover:text-red"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length < FEEDBACK_MAX_FILES && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={() => pickerRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border-strong px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            <ImagePlus className="h-4 w-4" />
            Прикрепить скриншот
          </button>
          <span className="text-xs text-text-muted">
            PNG или JPG, до {FEEDBACK_MAX_FILES} шт. Можно вставить из буфера — Ctrl+V
          </span>
        </div>
      )}

      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  );
}
