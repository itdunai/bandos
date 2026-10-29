import { MarkFeedbackSeen } from "@/components/feedback/mark-feedback-seen";
import { Card } from "@/components/ui/card";
import { LocalDateTime } from "@/components/ui/local-date-time";
import {
  FEEDBACK_KIND_LABELS,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_STATUS_STYLES,
  isFeedbackUnread,
  type MyFeedbackRow,
} from "@/lib/feedback/tickets";
import { cn } from "@/lib/utils";

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

/** «Мои обращения»: статус и ответ. Новое с последнего визита подсвечено. */
export function MyFeedbackList({ items }: { items: MyFeedbackRow[] }) {
  if (!items.length) return null;
  const hasUnread = items.some(isFeedbackUnread);

  return (
    <section className="space-y-2">
      {hasUnread && <MarkFeedbackSeen />}
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
        Мои обращения
      </h2>
      {items.map((f) => {
        const unread = isFeedbackUnread(f);
        return (
          <Card key={f.id} className={cn("p-4", unread && "border-accent/60")}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 font-medium",
                  FEEDBACK_STATUS_STYLES[f.status]
                )}
              >
                {FEEDBACK_STATUS_LABELS[f.status]}
              </span>
              <span>{FEEDBACK_KIND_LABELS[f.kind]}</span>
              {unread && <span className="font-semibold text-accent">новое</span>}
              <span className="ml-auto">
                <LocalDateTime value={f.created_at} options={DATE_OPTIONS} />
              </span>
            </div>
            <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm">{f.message}</p>
            {f.admin_reply && (
              <div className="mt-3 rounded-lg border border-border bg-bg-3 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                  Ответ BandOS
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{f.admin_reply}</p>
              </div>
            )}
          </Card>
        );
      })}
    </section>
  );
}
