import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  forbiddenBackPath,
  getForbiddenMessage,
} from "@/lib/forbidden";
import { ArrowLeft, Guitar, ShieldX } from "lucide-react";

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{
    reason?: string;
    permission?: string;
    band?: string;
    back?: string;
  }>;
}) {
  const params = await searchParams;
  const { title, description } = getForbiddenMessage(params);
  const backPath = forbiddenBackPath(params);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="border-b border-border bg-bg-2 px-4 py-3 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent">
          <Guitar className="h-4 w-4" />
          BandOS
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber/30 bg-amber/10 text-amber">
          <ShieldX className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-medium">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={backPath}>
            <Button variant="accent" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              {backPath === "/" ? "На главную" : "Назад"}
            </Button>
          </Link>
          <Link href="/">
            <Button variant="default" size="sm">
              Каталог групп
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
