import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";
import { cn } from "@/lib/utils";

export type AdminSection = "overview" | "feedback" | "system" | "privacy";

const NAV: { section: AdminSection; href: string; label: string }[] = [
  { section: "overview", href: "/admin", label: "Обзор" },
  { section: "feedback", href: "/admin/feedback", label: "Обращения" },
  { section: "system", href: "/admin/system", label: "Система" },
  { section: "privacy", href: "/admin/privacy", label: "Политика" },
];

export function AdminShell({
  children,
  userEmail,
  buildSha,
  section,
  newFeedback = 0,
}: {
  children: React.ReactNode;
  userEmail: string;
  buildSha: string;
  section: AdminSection;
  newFeedback?: number;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-bg-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <SiteLogo className="h-8" />
            <div>
              <div className="text-sm font-medium">Admin</div>
              <div className="text-[11px] text-text-muted">{userEmail}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="rounded-md border border-border bg-bg px-2 py-1 text-[11px] text-text-muted"
              title="Версия текущего деплоя"
            >
              build: {buildSha}
            </div>
            <Link href="/" className="text-xs text-text-secondary hover:text-accent">
              ← На сайт
            </Link>
          </div>
        </div>
        <nav
          aria-label="Разделы админки"
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6"
        >
          {NAV.map((item) => {
            const active = item.section === section;
            return (
              <Link
                key={item.section}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-accent text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                )}
              >
                {item.label}
                {item.section === "feedback" && newFeedback > 0 && (
                  <span className="rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">
                    {newFeedback}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
