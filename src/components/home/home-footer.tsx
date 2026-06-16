import Link from "next/link";
import { Guitar } from "lucide-react";

export function HomeFooter() {
  return (
    <footer className="border-t border-border bg-bg-2 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
        <div className="flex items-center gap-2 text-text-muted">
          <Guitar className="h-4 w-4 text-accent" />
          <span className="text-xs">BandOS — операционная система музыкальной группы</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-text-muted">
          <Link href="/login" className="hover:text-text-primary">
            Вход
          </Link>
          <Link href="/register" className="hover:text-text-primary">
            Регистрация
          </Link>
          <Link href="#catalog" className="hover:text-text-primary">
            Каталог
          </Link>
        </div>
      </div>
    </footer>
  );
}
