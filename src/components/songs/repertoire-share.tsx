"use client";

import { setRepertoirePublic } from "@/app/actions/band";
import { ShareLinkButton } from "@/components/band/share-link-button";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RepertoireShare({
  bandId,
  bandSlug,
  isPublic,
  isAdmin,
}: {
  bandId: string;
  bandSlug: string;
  isPublic: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const sharePath = `/rider/${bandSlug}#repertoire`;

  if (!isAdmin) {
    if (!isPublic) return null;
    return <ShareLinkButton path={sharePath} label="Поделиться репертуаром" />;
  }

  return (
    <div
      className={`flex flex-col items-end gap-2 sm:flex-row sm:items-center ${pending ? "opacity-70" : ""}`}
    >
      <label className="flex items-center gap-2 text-xs text-text-secondary">
        {pending && <Spinner />}
        <input
          type="checkbox"
          defaultChecked={isPublic}
          disabled={pending}
          onChange={(e) =>
            startTransition(async () => {
              await setRepertoirePublic(bandId, bandSlug, e.target.checked);
              router.refresh();
            })
          }
          className="rounded border-border accent-accent"
        />
        Публичный репертуар
      </label>
      {isPublic && (
        <ShareLinkButton path={sharePath} label="Поделиться" />
      )}
    </div>
  );
}
