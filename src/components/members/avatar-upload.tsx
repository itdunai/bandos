"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { clientUploadAvatar } from "@/lib/upload/client-media";
import { Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";

export function AvatarUpload({
  name,
  avatarUrl,
  userId,
}: {
  name: string;
  avatarUrl: string | null;
  userId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState(avatarUrl);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} src={url} className="h-16 w-16 text-lg" />
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError(null);
            startTransition(async () => {
              try {
                const result = await clientUploadAvatar(userId, file);
                if (result.error || !result.publicUrl) {
                  setError(result.error ?? "Ошибка загрузки");
                  return;
                }
                setUrl(result.publicUrl);
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Не удалось загрузить аватар"
                );
              }
            });
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
          {pending ? "Загрузка…" : url ? "Сменить аватар" : "Загрузить аватар"}
        </Button>
        {error && <p className="mt-1 text-xs text-red">{error}</p>}
      </div>
    </div>
  );
}
