"use client";

import { updateMemberProfile } from "@/app/actions/members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INSTRUMENT_LABELS, type BandMember, type Instrument } from "@/types/database";
const INSTRUMENTS = Object.entries(INSTRUMENT_LABELS) as [Instrument, string][];

const selectClass =
  "w-full rounded-lg border border-border bg-bg-3 px-3 py-2 text-sm outline-none focus:border-accent";

export function MemberProfileForm({
  member,
  bandSlug,
}: {
  member: BandMember;
  bandSlug: string;
}) {
  const action = updateMemberProfile.bind(null, member.id, bandSlug);

  return (
    <form action={action} className="space-y-3">
      <div>
        <Label>Имя в группе</Label>
        <Input name="display_name" defaultValue={member.display_name ?? ""} placeholder="Алекс К." />
      </div>
      <div>
        <Label>Инструмент</Label>
        <select name="instrument" className={selectClass} defaultValue={member.instrument}>
          {INSTRUMENTS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Телефон</Label>
          <Input name="phone" type="tel" defaultValue={member.phone ?? ""} placeholder="+7..." />
        </div>
        <div>
          <Label>Telegram</Label>
          <Input name="telegram" defaultValue={member.telegram ?? ""} placeholder="username" />
        </div>
      </div>
      <Button type="submit" variant="accent" className="w-full py-2">
        Сохранить профиль
      </Button>
    </form>
  );
}
