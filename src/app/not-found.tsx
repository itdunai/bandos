import Link from "next/link";
import { ErrorScreen } from "@/components/error-screen";

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      title="Страница не найдена"
      description="Возможно, ссылка устарела или группа сменила адрес."
    >
      <Link
        href="/"
        className="rounded-lg border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink hover:bg-accent-dark"
      >
        На главную
      </Link>
    </ErrorScreen>
  );
}
