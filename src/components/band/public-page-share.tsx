"use client";

import { Check, Link2 } from "lucide-react";
import { useEffect, useState } from "react";

function resolveUrl(pathOrUrl: string): string {
  if (typeof window === "undefined") return pathOrUrl;

  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    try {
      const parsed = new URL(pathOrUrl);
      return window.location.origin + parsed.pathname + parsed.search;
    } catch {
      return pathOrUrl;
    }
  }

  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return window.location.origin + path;
}

/** Показывает URL публичной страницы и копирует его по клику. */
export function PublicPageShare({
  path,
  title = "Публичная страница",
  hint = "Нажмите, чтобы скопировать и отправить",
}: {
  path: string;
  title?: string;
  hint?: string;
}) {
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(resolveUrl(path));
  }, [path]);

  async function copy() {
    const full = resolveUrl(path);
    setUrl(full);
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Скопируйте ссылку:", full);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-bg-2 p-4">
      <h3 className="mb-1 text-sm font-medium">{title}</h3>
      <p className="mb-3 text-[11px] text-text-muted">{hint}</p>
      <button
        type="button"
        onClick={copy}
        className="w-full rounded-lg bg-bg-3 p-3 text-left transition-colors hover:bg-bg hover:ring-1 hover:ring-accent/30"
      >
        <code className="flex items-start gap-2 break-all text-xs text-accent">
          {copied ? (
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green" />
          ) : (
            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span>{copied ? "Скопировано" : url}</span>
        </code>
      </button>
    </div>
  );
}
