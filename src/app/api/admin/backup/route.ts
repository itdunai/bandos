import { backupFileName, createDatabaseDump } from "@/lib/backup/pg-dump";
import { captureServerError } from "@/lib/monitoring/sentry";
import { logPlatformEvent } from "@/lib/platform/audit";
import { isPlatformAdminUser } from "@/lib/platform/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Скачать дамп БД прямо сейчас (только админ платформы). Файл не шифруется — канал HTTPS. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdminUser(user))) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const dump = await createDatabaseDump();
    const name = backupFileName();
    await logPlatformEvent({
      level: "info",
      event: "backup.downloaded",
      userId: user.id,
      meta: { file: name, bytes: dump.length },
    });
    return new Response(new Uint8Array(dump), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Content-Length": String(dump.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    captureServerError(error, { action: "backup.download", userId: user.id });
    const message = error instanceof Error ? error.message : "Не удалось сделать дамп";
    return new Response(`Резервная копия не создана: ${message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
