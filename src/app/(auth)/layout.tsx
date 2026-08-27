import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        {children}
        <p className="mt-4 text-center text-[11px] text-text-muted">
          <Link href="/privacy" className="hover:text-text-primary">
            Политика конфиденциальности
          </Link>
        </p>
      </div>
    </div>
  );
}
