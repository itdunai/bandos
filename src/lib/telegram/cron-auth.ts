import { secretsEqual } from "@/lib/telegram/bot";

/** Проверка `Authorization: Bearer <CRON_SECRET>` для служебных маршрутов. */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 16) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return secretsEqual(token, secret);
}
