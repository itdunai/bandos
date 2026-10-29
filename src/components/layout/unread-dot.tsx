import { bandPath } from "@/lib/paths";

/** Обратная связь внутри группы; `from` — откуда пришли, чтобы было понятно, о чём речь. */
export function feedbackHref(bandSlug: string, pathname: string) {
  return `${bandPath(bandSlug, "feedback")}?from=${encodeURIComponent(pathname)}`;
}

/** Точка «есть новое» у пункта меню. */
export function UnreadDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-accent">
      <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
      <span className="sr-only">новый ответ:</span>
      {count}
    </span>
  );
}
