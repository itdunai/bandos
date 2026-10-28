import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { submitFeedback } from "@/app/actions/feedback";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Обратная связь",
  robots: { index: false, follow: false },
};

const KIND_OPTIONS = [
  { value: "bug", label: "Ошибка" },
  { value: "idea", label: "Идея" },
  { value: "question", label: "Вопрос" },
  { value: "other", label: "Другое" },
];

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/feedback");

  const from = sanitizeRedirectPath(params.from);
  const backHref = from ?? "/";

  if (params.sent === "1") {
    return (
      <Card className="p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green" />
        <h1 className="text-lg font-medium">Спасибо!</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Сообщение отправлено. Если понадобится уточнение — ответим на {user.email}.
        </p>
        <Link href={backHref} className="mt-5 inline-block text-sm text-accent hover:underline">
          Вернуться
        </Link>
      </Card>
    );
  }

  // Группа, из которой пришли (/{slug}/...), — чтобы было понятно, о чём речь
  const slug = from?.split("/")[1];
  const { data: band } = slug
    ? await supabase.from("bands").select("id, name").eq("slug", slug).maybeSingle()
    : { data: null };

  return (
    <Card className="p-6">
      <h1 className="text-lg font-medium">Обратная связь</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Расскажите, что сломалось, чего не хватает или что неудобно. Мы читаем каждое сообщение.
      </p>

      {params.error && (
        <div className="mt-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={submitFeedback} className="mt-4 space-y-3">
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

        {band && (
          <p className="text-xs text-text-muted">
            Группа: {band.name}
            {from && <> · страница {from}</>}
          </p>
        )}

        <div className="flex items-center gap-3">
          <SubmitButton type="submit" variant="accent" loadingLabel="Отправляем…">
            Отправить
          </SubmitButton>
          <Link href={backHref} className="text-sm text-text-secondary hover:text-text-primary">
            Отмена
          </Link>
        </div>
      </form>
    </Card>
  );
}
