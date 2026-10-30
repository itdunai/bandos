import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type ToastType = "error" | "success";

/** Стирает её ToastProvider в браузере после показа (имя продублировано там). */
const TOAST_COOKIE = "bandos_toast";

export async function redirectWithToast(
  path: string,
  message: string,
  type: ToastType = "error"
) {
  const cookieStore = await cookies();
  cookieStore.set(
    TOAST_COOKIE,
    JSON.stringify({ type, message }),
    { maxAge: 10, path: "/", httpOnly: false }
  );
  redirect(path);
}

/**
 * Уведомление после redirectWithToast — для корневого layout. Только читает:
 * менять куки при отрисовке страницы Next.js запрещает (ошибка роняет весь
 * layout), поэтому стирает её ToastProvider в браузере после показа.
 */
export async function consumeToast(): Promise<{
  type: ToastType;
  message: string;
} | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(TOAST_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { type: ToastType; message: string };
    if (parsed?.message) return parsed;
  } catch {
    return null;
  }
  return null;
}
