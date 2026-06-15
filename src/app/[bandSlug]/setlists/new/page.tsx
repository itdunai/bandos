import { createSetlist } from "@/app/actions/setlists";
import { AppShell } from "@/components/layout/app-shell";
import { FormPending } from "@/components/ui/form-pending";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { notFound } from "next/navigation";

export default async function NewSetlistPage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { bandSlug } = await params;
  const { error } = await searchParams;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
  ]);

  const action = createSetlist.bind(null, band.id, band.slug);

  return (
    <AppShell band={band} member={member} memberCount={memberCount} title="Новый сет-лист">
      {error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(error)}
        </div>
      )}
      <form action={action} className="max-w-md space-y-4 rounded-xl border border-border bg-bg-2 p-4">
        <FormPending label="Создание…">
        <div>
          <Label>Название *</Label>
          <Input name="name" required placeholder="Концерт 22 июня" />
        </div>
        <SubmitButton type="submit" variant="accent" className="w-full py-2.5" loadingLabel="Создание…">
          Создать и настроить
        </SubmitButton>
        </FormPending>
      </form>
    </AppShell>
  );
}
