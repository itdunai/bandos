"use client";

import { saveMemberAvatarUrl } from "@/app/actions/media";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { clientUploadAvatar } from "@/lib/upload/client-media";
import { createClient } from "@/lib/supabase/client";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
                const supabase = createClient();
                const {
                  data: { user },
                } = await supabase.auth.getUser();
                if (!user) {
                  setError("Не авторизован");
                  return;
                }

                const uploaded = await clientUploadAvatar(userId, file);
                if (uploaded.error || !uploaded.publicUrl) {
                  setError(uploaded.error ?? "Ошибка загрузки");
                  return;
                }

                const saved = await saveMemberAvatarUrl(uploaded.publicUrl);
                if (saved.error) {
                  setError(saved.error);
                  return;
                }

                setUrl(uploaded.publicUrl);
                router.refresh();
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
