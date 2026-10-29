import Link from "next/link";
import { submitFeedback } from "@/app/actions/feedback";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2 } from "lucide-react";

const KIND_OPTIONS = [
  { value: "bug", label: "Ошибка" },
  { value: "idea", label: "Идея" },
  { value: "question", label: "Вопрос" },
  { value: "other", label: "Другое" },
];

/** Форма обращения. `returnTo` — страница, куда вернуться после отправки. */
export function FeedbackForm({
  returnTo,
  from,
  band,
  error,
  sent,
}: {
  returnTo: string;
  from: string | null;
  band: { id: string; name: string } | null;
  error?: string;
  sent?: boolean;
}) {
  if (sent) {
    return (
      <Card className="p-5 text-center sm:p-6">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green" />
        <h2 className="text-lg font-medium">Спасибо!</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Обращение отправлено — его статус и наш ответ появятся ниже.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
          <Link href={returnTo} className="text-accent hover:underline">
            Написать ещё
          </Link>
          {from && (
            <Link href={from} className="text-text-secondary hover:text-text-primary">
              Вернуться
            </Link>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-base font-medium">Новое обращение</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Расскажите, что сломалось, чего не хватает или что неудобно. Мы читаем каждое сообщение.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {error}
        </div>
      )}

      <form action={submitFeedback} className="mt-4 space-y-3">
        <input type="hidden" name="return_to" value={returnTo} />
        {from && <input type="hidden" name="page" value={from} />}
        {band && <input type="hidden" name="band_id" value={band.id} />}

        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Тип сообщения</legend>
          {KIND_OPTIONS.map((o, i) => (
            <label key={o.value} className="cursor-pointer">
              <input
                type="radio"
                name="kind"
                value={o.value}
                defaultChecked={i === 0}
                className="peer sr-only"
              />
              <span className="inline-block rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors peer-checked:border-accent peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/25">
                {o.label}
              </span>
            </label>
          ))}
        </fieldset>

        <Textarea
          name="message"
          required
          maxLength={4000}
          rows={6}
          aria-label="Сообщение"
          placeholder="Например: в режиме «Играем» не листается сет-лист на iPhone…"
        />

        {(band || from) && (
          <p className="text-xs text-text-muted">
            {band && <>Группа: {band.name}</>}
            {band && from && " · "}
            {from && <>страница {from}</>}
          </p>
        )}

        <SubmitButton type="submit" variant="accent" loadingLabel="Отправляем…">
          Отправить
        </SubmitButton>
      </form>
    </Card>
  );
}
