"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          // Перезагрузка только при обновлении уже работающего SW (после деплоя).
          if (!worker || !navigator.serviceWorker.controller) return;

          worker.addEventListener("statechange", () => {
            if (worker.state === "activated") {
              window.location.reload();
            }
          });
        });

        registration.update().catch(() => {});
      })
      .catch(() => {});

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      navigator.serviceWorker.getRegistration().then((r) => r?.update());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return null;
}
