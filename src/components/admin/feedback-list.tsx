import Link from "next/link";
import { setFeedbackStatus } from "@/app/actions/platform-admin";
import { Card } from "@/components/ui/card";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FeedbackRow } from "@/lib/platform/queries";
import { cn } from "@/lib/utils";

const KIND_LABELS: Record<FeedbackRow["kind"], string> = {
  bug: "Ошибка",
  idea: "Идея",
  question: "Вопрос",
  other: "Другое",
};

export function FeedbackList({ items }: { items: FeedbackRow[] }) {
  if (!items.length) {
    return (
      <Card className="p-6 text-center text-sm text-text-secondary">
        Сообщений пока нет
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((f) => {
        const done = f.status === "done";
        return (
          <Card key={f.id} className={cn("p-4", done && "opacity-60")}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
              <span className="rounded bg-bg-3 px-1.5 py-0.5 font-medium text-text-primary">
                {KIND_LABELS[f.kind]}
              </span>
              <span>{f.email ?? "удалённый пользователь"}</span>
              {f.bands && (
                <Link href={`/${f.bands.slug}`} className="text-accent hover:underline">
                  {f.bands.name}
                </Link>
              )}
              {f.page && <span className="truncate">{f.page}</span>}
              <span className="ml-auto">
                <LocalDateTime
                  value={f.created_at}
                  options={{ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }}
                />
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{f.message}</p>
            <form
              action={setFeedbackStatus.bind(null, f.id, done ? "new" : "done")}
              className="mt-2"
            >
              <SubmitButton type="submit" variant="ghost" size="sm" loadingLabel="…">
                {done ? "Вернуть в новые" : "Обработано"}
              </SubmitButton>
            </form>
          </Card>
        );
      })}
    </div>
  );
}
