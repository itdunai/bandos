"use client";

import { formatDate } from "@/lib/utils";
import { useIsClient } from "@/lib/use-is-client";

/**
 * Момент времени (TIMESTAMPTZ) в часовом поясе пользователя. Сервер работает
 * в UTC, поэтому при SSR и гидрации выводится пустой плейсхолдер, а текст —
 * только в браузере.
 */
export function LocalDateTime({
  value,
  options,
  placeholder = "\u00a0",
}: {
  value: string;
  options?: Intl.DateTimeFormatOptions;
  placeholder?: string;
}) {
  const isClient = useIsClient();
  return (
    <time dateTime={value}>
      {isClient ? formatDate(value, options) : placeholder}
    </time>
  );
}
