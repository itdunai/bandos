"use client";

import { updateMemberPermissions } from "@/app/actions/members";
import { PermissionPresetFields } from "@/components/members/permission-preset-fields";
import { Button } from "@/components/ui/button";
import {
  presetBadgeLabel,
  type BandPermissions,
  type PermissionPreset,
} from "@/lib/band/permissions";
import type { BandMember } from "@/types/database";
import { Shield } from "lucide-react";
import { useState, useTransition } from "react";

export function MemberPermissionsEditor({
  member,
  bandId,
  bandSlug,
}: {
  member: BandMember;
  bandId: string;
  bandSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const preset = (member.permission_preset ?? "musician") as PermissionPreset;
  const permissions = (member.permissions ?? {}) as BandPermissions;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateMemberPermissions(
        member.id,
        bandId,
        bandSlug,
        formData
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setOpen(false);
    });
  }

  return (
    <div className="mt-3 w-full border-t border-border pt-3 text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-1.5 text-[11px] text-accent hover:underline"
      >
        <Shield className="h-3 w-3" />
        {open ? "Скрыть права" : `Права: ${presetBadgeLabel(member)}`}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <PermissionPresetFields
            defaultPreset={preset}
            defaultPermissions={permissions}
          />
          {error && <p className="text-[11px] text-red">{error}</p>}
          {saved && (
            <p className="text-[11px] text-green">Сохранено</p>
          )}
          <Button
            type="submit"
            variant="accent"
            className="w-full py-2 text-xs"
            loading={pending}
            disabled={pending}
          >
            {pending ? "Сохранение…" : "Сохранить права"}
          </Button>
        </form>
      )}
    </div>
  );
}
