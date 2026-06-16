import { bandPath } from "@/lib/paths";
import { formatDuration } from "@/lib/utils";
import { ListMusic, Plus } from "lucide-react";
import Link from "next/link";

export interface SetlistRow {
  id: string;
  name: string;
  itemCount: number;
  durationSec: number;
}

function metaLine(itemCount: number, durationSec: number) {
  const parts = [`${itemCount} треков`];
  if (durationSec > 0) {
    parts.push(formatDuration(durationSec));
  }
  return parts.join(" · ");
}

export function SetlistList({
  setlists,
  bandSlug,
  canCreate = false,
}: {
  setlists: SetlistRow[];
  bandSlug: string;
  canCreate?: boolean;
}) {
  return (
    <>
      <ul className="space-y-2 md:hidden">
        {canCreate && (
          <li>
            <Link
              href={bandPath(bandSlug, "setlists", "new")}
              className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-bg-2 p-4 text-accent transition-colors hover:border-accent"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-3">
                <Plus className="h-4 w-4" />
              </div>
              <span className="font-medium">Создать сет-лист</span>
            </Link>
          </li>
        )}
        {setlists.map((sl) => (
          <li key={sl.id}>
            <Link
              href={bandPath(bandSlug, "setlists", sl.id)}
              className="block rounded-xl border border-border bg-bg-2 p-4 transition-colors hover:border-accent"
            >
              <div className="font-medium">{sl.name}</div>
              <div className="text-xs text-text-secondary">
                {metaLine(sl.itemCount, sl.durationSec)}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {canCreate && (
          <Link
            href={bandPath(bandSlug, "setlists", "new")}
            className="flex min-h-[100px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-bg-2 p-3 text-accent transition-colors hover:border-accent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-3">
              <Plus className="h-4 w-4" />
            </div>
            <span className="mt-2 text-xs font-medium">Создать</span>
          </Link>
        )}
        {setlists.map((sl) => (
          <Link
            key={sl.id}
            href={bandPath(bandSlug, "setlists", sl.id)}
            className="flex flex-col rounded-lg border border-border bg-bg-2 p-3 transition-colors hover:border-accent"
          >
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-bg-3 text-accent">
              <ListMusic className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium leading-snug line-clamp-2">{sl.name}</div>
            <div className="mt-1 text-[10px] text-text-secondary">
              {metaLine(sl.itemCount, sl.durationSec)}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
