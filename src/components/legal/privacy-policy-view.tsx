import { FormattedDocument } from "@/components/legal/formatted-document";
import { SiteLogo } from "@/components/brand/site-logo";
import { formatDate } from "@/lib/utils";
import type { SitePage } from "@/lib/legal/site-pages";
import Link from "next/link";

export function PrivacyPolicyView({ page }: { page: SitePage }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="border-b border-border bg-bg-2 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <SiteLogo className="h-8" />
          </Link>
          <Link
            href="/"
            className="text-xs text-text-muted hover:text-text-primary"
          >
            На главную
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <p className="text-[11px] uppercase tracking-wider text-text-muted">
          Юридическая информация
        </p>
        <h1 className="mt-2 text-3xl font-medium leading-tight">{page.title}</h1>
        {page.updated_at && (
          <p className="mt-2 text-xs text-text-muted">
            Обновлено{" "}
            {formatDate(page.updated_at, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
        <article className="mt-8">
          <FormattedDocument text={page.body} />
        </article>
      </main>
    </div>
  );
}
