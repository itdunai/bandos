"use client";

import { Button } from "@/components/ui/button";
import { Check, Link2 } from "lucide-react";
import { useState } from "react";

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

export function ShareLinkButton({
  path,
  label = "Скопировать ссылку",
}: {
  /** Путь вида /rider/gorizont — полный URL собирается из текущего адреса в браузере */
  path: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = resolveUrl(path);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Скопируйте ссылку:", url);
    }
  }

  return (
    <Button type="button" variant="default" onClick={copy}>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green" />
      ) : (
        <Link2 className="h-3.5 w-3.5" />
      )}
      {copied ? "Скопировано" : label}
    </Button>
  );
}
