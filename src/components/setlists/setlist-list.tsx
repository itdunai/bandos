import { bandPath } from "@/lib/paths";
import { formatDuration } from "@/lib/utils";
import { ListMusic } from "lucide-react";
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
}: {
  setlists: SetlistRow[];
  bandSlug: string;
}) {
  return (
    <>
      <ul className="space-y-2 md:hidden">
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

      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {setlists.map((sl) => (
          <Link
            key={sl.id}
            href={bandPath(bandSlug, "setlists", sl.id)}
            className="flex flex-col rounded-xl border border-border bg-bg-2 p-4 transition-colors hover:border-accent"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-bg-3 text-accent">
              <ListMusic className="h-4 w-4" />
            </div>
            <div className="font-medium leading-snug">{sl.name}</div>
            <div className="mt-1 text-xs text-text-secondary">
              {metaLine(sl.itemCount, sl.durationSec)}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
