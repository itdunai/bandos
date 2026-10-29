import { logPlatformEvent } from "@/lib/platform/audit";
import { isCronAuthorized } from "@/lib/telegram/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Отчёт GitHub Actions (.github/workflows/db-backup.yml) о ночной копии —
 * чтобы в /admin было видно, когда она была. Доступ — по CRON_SECRET.
 */
export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);
  const runUrl = str(body.runUrl, 300);

  const meta = {
    trigger: "github",
    file: str(body.file, 120),
    bytes: num(body.bytes),
    delivered: num(body.delivered),
    // Только ссылка на запуск в GitHub — другие адреса не сохраняем
    runUrl: runUrl?.startsWith("https://github.com/") ? runUrl : null,
  };

  await logPlatformEvent(
    body.ok === true
      ? { level: "info", event: "backup.created", meta }
      : { level: "error", event: "backup.failed", meta: { ...meta, message: "Ошибка в GitHub Actions — см. запуск" } }
  );

  return Response.json({ ok: true });
}
