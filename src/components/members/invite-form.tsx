"use client";

import { createInvitation } from "@/app/actions/auth";
import { PermissionPresetFields } from "@/components/members/permission-preset-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INSTRUMENT_LABELS, type Instrument } from "@/types/database";
import { Link2 } from "lucide-react";
import { useState, useTransition } from "react";

const INSTRUMENTS = Object.entries(INSTRUMENT_LABELS) as [Instrument, string][];

export function InviteForm({ bandId }: { bandId: string }) {
  const [pending, startTransition] = useTransition();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createInvitation(bandId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.token) {
        const url = `${window.location.origin}/invite/${result.token}`;
        setInviteUrl(url);
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-bg-2 p-4">
      <h3 className="mb-1 text-sm font-medium">Пригласить участника</h3>
      <p className="mb-3 text-[11px] text-text-muted">
        Только администратор может приглашать и назначать права
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input name="email" type="email" placeholder="Email (опционально)" />
        <select
          name="instrument"
          className="w-full rounded-lg border border-border bg-bg-3 px-3 py-2 text-sm outline-none focus:border-accent"
          defaultValue="other"
        >
          {INSTRUMENTS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <PermissionPresetFields defaultPreset="musician" />
        <Button type="submit" variant="accent" loading={pending} disabled={pending}>
          <Link2 className="h-3.5 w-3.5" />
          {pending ? "Создание…" : "Создать ссылку"}
        </Button>
      </form>
      {error && <p className="mt-2 text-xs text-red">{error}</p>}
      {inviteUrl && (
        <div className="mt-3 rounded-lg bg-bg-3 p-2">
          <p className="mb-1 text-[11px] text-text-muted">Ссылка-приглашение:</p>
          <code className="break-all text-xs text-accent">{inviteUrl}</code>
        </div>
      )}
    </div>
  );
}
