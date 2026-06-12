import { createSetlist } from "@/app/actions/setlists";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <div>
          <Label>Название *</Label>
          <Input name="name" required placeholder="Концерт 22 июня" />
        </div>
        <Button type="submit" variant="accent" className="w-full py-2.5">
          Создать и настроить
        </Button>
      </form>
    </AppShell>
  );
}
