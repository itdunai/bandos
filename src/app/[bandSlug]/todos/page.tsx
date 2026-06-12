import { AppShell } from "@/components/layout/app-shell";
import { AddTodoForm } from "@/components/todos/add-todo-form";
import { TodoList } from "@/components/todos/todo-list";
import { Card } from "@/components/ui/card";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/band/permissions";
import { bandPath } from "@/lib/paths";
import { notFound } from "next/navigation";

export default async function TodosPage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { bandSlug } = await params;
  const { filter: filterParam } = await searchParams;
  const filter = (filterParam as "all" | "open" | "done") || "open";

  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);

  const { data: todos } = await supabase
    .from("todos")
    .select("*")
    .eq("band_id", band.id)
    .order("is_done")
    .order("position")
    .order("created_at");

  const openCount = todos?.filter((t) => !t.is_done).length ?? 0;
  const doneCount = todos?.filter((t) => t.is_done).length ?? 0;
  const canEditTodos = member ? hasPermission(member, "todos") : false;

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="Список дел"
    >
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <div className="text-xs uppercase tracking-wider text-text-muted">
            Не готово
          </div>
          <div className="text-2xl font-medium text-amber">{openCount}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-text-muted">
            Готово
          </div>
          <div className="text-2xl font-medium text-green">{doneCount}</div>
        </Card>
      </div>

      <div className="mb-4 flex gap-2">
        {(["open", "done", "all"] as const).map((f) => (
          <a
            key={f}
            href={`${bandPath(band.slug, "todos")}?filter=${f}`}
            className={
              filter === f
                ? "rounded-full bg-accent/15 px-3 py-1 text-xs text-accent"
                : "rounded-full bg-bg-3 px-3 py-1 text-xs text-text-secondary hover:text-text-primary"
            }
          >
            {f === "open" ? "Активные" : f === "done" ? "Готово" : "Все"}
          </a>
        ))}
      </div>

      {canEditTodos && (
        <AddTodoForm bandId={band.id} bandSlug={band.slug} />
      )}

      <div className="mt-4">
        <TodoList
          todos={todos ?? []}
          bandSlug={band.slug}
          filter={filter}
          canEdit={canEditTodos}
        />
      </div>
    </AppShell>
  );
}
