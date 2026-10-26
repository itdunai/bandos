import { isCronAuthorized } from "@/lib/telegram/cron-auth";
import { runReminders } from "@/lib/telegram/notify";

export const dynamic = "force-dynamic";

/**
 * Ручной/внешний запуск рассылки напоминаний. Обычно не нужен: сервер
 * сам запускает рассылку по таймеру (см. src/instrumentation.ts).
 */
export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const result = await runReminders();
  return Response.json({ ok: true, ...result });
}
