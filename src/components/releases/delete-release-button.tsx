"use client";

import { deleteRelease } from "@/app/actions/releases";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";

export function DeleteReleaseButton({
  releaseId,
  bandSlug,
  title,
}: {
  releaseId: string;
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
        if (!confirm(`Удалить релиз «${title}»?`)) return;
        startTransition(async () => {
          await deleteRelease(releaseId, bandSlug);
        });
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Удаление…" : "Удалить"}
    </Button>
  );
}
