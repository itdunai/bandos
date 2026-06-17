import Link from "next/link";
import { Guitar } from "lucide-react";

export function AdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-bg-2">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-dark">
              <Guitar className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium">BandOS Admin</div>
              <div className="text-[10px] text-text-muted">{userEmail}</div>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-text-secondary hover:text-accent"
          >
            ← На сайт
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
