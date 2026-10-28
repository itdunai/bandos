import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg px-4 py-8">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/" className="mb-6 inline-block" aria-label="На главную">
          <SiteLogo className="h-6" />
        </Link>
        {children}
        <p className="mt-6 text-center text-xs text-text-muted">
          <Link href="/privacy" className="hover:text-text-primary">
            Политика конфиденциальности
          </Link>
        </p>
      </div>
    </div>
  );
}
