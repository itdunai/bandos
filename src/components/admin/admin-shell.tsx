import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";

export function AdminShell({
  children,
  userEmail,
  buildSha,
}: {
  children: React.ReactNode;
  userEmail: string;
  buildSha: string;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-bg-2">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <SiteLogo className="h-8" />
            <div>
              <div className="text-sm font-medium">Admin</div>
              <div className="text-[10px] text-text-muted">{userEmail}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-xs text-text-secondary hover:text-accent"
            >
              Панель
            </Link>
            <Link
              href="/admin/privacy"
              className="text-xs text-text-secondary hover:text-accent"
            >
              Политика
            </Link>
            <div
              className="rounded-md border border-border bg-bg px-2 py-1 text-[10px] text-text-muted"
              title="Версия текущего деплоя"
            >
              build: {buildSha}
            </div>
            <Link
              href="/"
              className="text-xs text-text-secondary hover:text-accent"
            >
              ← На сайт
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
