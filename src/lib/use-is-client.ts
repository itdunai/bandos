"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `false` при SSR и гидрации, `true` после — для значений, зависящих от браузера
 * (часовой пояс, локаль), чтобы не показывать время сервера (UTC).
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
