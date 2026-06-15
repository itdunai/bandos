"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const creepTimer = useRef<number | null>(null);
  const completeTimer = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (creepTimer.current) {
      window.clearInterval(creepTimer.current);
      creepTimer.current = null;
    }
    if (completeTimer.current) {
      window.clearTimeout(completeTimer.current);
      completeTimer.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimers();
    setActive(true);
    setProgress(12);
    document.documentElement.classList.add("navigating");

    creepTimer.current = window.setInterval(() => {
      setProgress((p) => (p < 88 ? p + (88 - p) * 0.12 : p));
    }, 280);
  }, [clearTimers]);

  const complete = useCallback(() => {
    clearTimers();
    setProgress(100);
    completeTimer.current = window.setTimeout(() => {
      setActive(false);
      setProgress(0);
      document.documentElement.classList.remove("navigating");
    }, 220);
  }, [clearTimers]);

  useEffect(() => {
    complete();
  }, [pathname, complete]);

  useEffect(() => {
    function isInternalNav(href: string) {
      if (!href || href.startsWith("#")) return false;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
      if (href.startsWith("/")) return true;
      try {
        const url = new URL(href, window.location.origin);
        return url.origin === window.location.origin;
      } catch {
        return false;
      }
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || !isInternalNav(href)) return;

      const current = `${window.location.pathname}${window.location.search}`;
      const next = href.startsWith("/")
        ? href
        : new URL(href, window.location.origin).pathname +
          new URL(href, window.location.origin).search;

      if (next !== current) start();
    }

    function onSubmit(e: Event) {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.getAttribute("target") === "_blank") return;
      start();
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      clearTimers();
      document.documentElement.classList.remove("navigating");
    };
  }, [start, clearTimers]);

  if (!active && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[300] h-0.5"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-label="Загрузка страницы"
    >
      <div
        className="h-full bg-accent shadow-[0_0_8px_var(--accent)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
