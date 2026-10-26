"use client";

import { useEffect, useState } from "react";

/**
 * Не даёт экрану погаснуть, пока компонент смонтирован (Screen Wake Lock API).
 * Браузер сам снимает блокировку, когда вкладка скрыта, поэтому при возврате
 * во вкладку запрашиваем её заново. Возвращает, активна ли блокировка сейчас.
 */
export function useWakeLock(enabled = true): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    async function request() {
      if (disposed || document.visibilityState !== "visible") return;
      if (sentinel && !sentinel.released) return;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (disposed) {
          await next.release();
          return;
        }
        sentinel = next;
        setActive(true);
        next.addEventListener("release", () => setActive(false));
      } catch {
        // Некоторые браузеры дают блокировку только после жеста пользователя —
        // попробуем ещё раз по первому касанию.
        setActive(false);
        document.addEventListener("pointerdown", onGesture, { once: true });
      }
    }

    function onGesture() {
      void request();
    }

    function onVisibility() {
      if (document.visibilityState === "visible") void request();
    }

    void request();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointerdown", onGesture);
      void sentinel?.release().catch(() => {});
    };
  }, [enabled]);

  return active;
}
