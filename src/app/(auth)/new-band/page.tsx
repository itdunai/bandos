import Link from "next/link";
import { createBand } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Guitar } from "lucide-react";
import { INSTRUMENT_LABELS, type Instrument } from "@/types/database";
import { redirect } from "next/navigation";

const INSTRUMENTS = Object.entries(INSTRUMENT_LABELS) as [Instrument, string][];

export default async function NewBandPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/new-band");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-dark">
          <Guitar className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-lg font-medium">Создать группу</h1>
        <p className="text-center text-xs text-text-secondary">
          Ваша первая (или новая) группа в BandOS
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={createBand} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-text-secondary">
            Название группы *
          </label>
          <Input name="band_name" required placeholder="Dead Signals" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">
            Ваше имя в группе
          </label>
          <Input
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            placeholder="Алекс К."
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Инструмент</label>
          <select
            name="instrument"
            className="w-full rounded-lg border border-border bg-bg-3 px-3 py-2 text-sm outline-none focus:border-accent"
            defaultValue="guitar"
          >
            {INSTRUMENTS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton type="submit" variant="accent" className="w-full py-2.5" loadingLabel="Создание…">
          Создать группу
        </SubmitButton>
      </form>

      <p className="mt-4 text-center text-xs text-text-secondary">
        Вас пригласили в группу?{" "}
        <span className="text-text-muted">Перейдите по ссылке из приглашения.</span>
      </p>
    </Card>
  );
}
