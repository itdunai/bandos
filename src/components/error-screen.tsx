import { SiteLogo } from "@/components/brand/site-logo";

/** Полноэкранная заглушка для 404 / ошибок: логотип, код, текст и действия. */
export function ErrorScreen({
  code,
  title,
  description,
  children,
}: {
  code: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm text-center">
        <SiteLogo className="mx-auto mb-8 h-8" />
        <div className="font-display text-6xl font-bold text-accent">{code}</div>
        <h1 className="mt-3 text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-text-secondary">{description}</p>
        {children && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {children}
          </div>
        )}
      </div>
    </main>
  );
}
