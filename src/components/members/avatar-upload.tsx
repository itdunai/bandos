"use client";

import { uploadMemberAvatar } from "@/app/actions/media";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export function AvatarUpload({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
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
            const formData = new FormData();
            formData.set("file", file);
            setError(null);
            startTransition(async () => {
              const result = await uploadMemberAvatar(formData);
              if (result.error) {
                setError(result.error);
                return;
              }
              if (result.avatarUrl) setUrl(result.avatarUrl);
              router.refresh();
            });
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
          {url ? "Сменить аватар" : "Загрузить аватар"}
        </Button>
        {error && <p className="mt-1 text-xs text-red">{error}</p>}
      </div>
    </div>
  );
}
