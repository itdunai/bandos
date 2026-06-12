import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Play } from "lucide-react";
import { bandPath } from "@/lib/paths";
import { notFound } from "next/navigation";

export default async function PlayIndexPage({
  params,
}: {
  params: Promise<{ bandSlug: string }>;
}) {
  const { bandSlug } = await params;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);

  const { data: performances } = await supabase
    .from("events")
    .select("id, title, starts_at, setlist_id, setlists(id, name)")
    .eq("band_id", band.id)
    .eq("event_type", "performance")
    .not("setlist_id", "is", null)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(5);

  const { data: allSetlists } = await supabase
    .from("setlists")
    .select("id, name, created_at")
    .eq("band_id", band.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="ИГРАЕМ"
    >
      <p className="mb-4 text-sm text-text-secondary">
        Выберите сет-лист — каждый участник увидит материалы для своего
        инструмента.
      </p>

      {performances && performances.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs uppercase tracking-wider text-text-muted">
            Ближайшие выступления
          </h2>
          <ul className="space-y-2">
            {performances.map((event) => {
              const raw = event.setlists as
                | { id: string; name: string }
                | { id: string; name: string }[]
                | null;
              const setlist = Array.isArray(raw) ? raw[0] : raw;
              if (!setlist) return null;
              return (
                <li key={event.id}>
                  <Link
                    href={bandPath(band.slug, "play", setlist.id)}
                    className="flex items-center gap-3 rounded-xl border border-amber/30 bg-bg-2 p-4 transition-colors hover:border-accent"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                      <Play className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{setlist.name}</div>
                      <div className="text-xs text-text-secondary">
                        {event.title} · {formatDate(event.starts_at)}
                      </div>
                    </div>
                    <Badge variant="amber">Концерт</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs uppercase tracking-wider text-text-muted">
          Все сет-листы
        </h2>
        {!allSetlists?.length ? (
          <EmptyState
            icon={<Play className="h-8 w-8" />}
            title="Нет сет-листов"
            description="Создайте сет-лист в разделе «Сет-листы»."
            action={
              <Link href={bandPath(band.slug, "setlists")}>
                <Button>Перейти к сет-листам</Button>
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {allSetlists.map((sl) => (
              <li key={sl.id}>
                <Link
                  href={bandPath(band.slug, "play", sl.id)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-bg-2 p-4 transition-colors hover:border-accent"
                >
                  <Play className="h-4 w-4 text-accent" />
                  <span className="font-medium">{sl.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
