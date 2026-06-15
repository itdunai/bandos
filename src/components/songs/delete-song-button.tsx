"use client";

import { deleteSong } from "@/app/actions/songs";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";

export function DeleteSongButton({
  songId,
  bandSlug,
  title,
}: {
  songId: string;
  bandSlug: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="default"
      loading={pending}
      disabled={pending}
      className="text-red hover:border-red hover:text-red"
      onClick={() => {
        if (!confirm(`Удалить трек «${title}»?`)) return;
        startTransition(async () => {
          await deleteSong(songId, bandSlug);
        });
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Удаление…" : "Удалить"}
    </Button>
  );
}
