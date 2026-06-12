"use client";

import { cn } from "@/lib/utils";
import type { ToastType } from "@/lib/redirect-with-toast";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export function ToastProvider({
  initial,
}: {
  initial: { type: ToastType; message: string } | null;
}) {
  const [toast, setToast] = useState(initial);

  useEffect(() => {
    setToast(initial);
  }, [initial]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      role="alert"
      className={cn(
        "fixed bottom-20 left-1/2 z-[200] flex max-w-md -translate-x-1/2 items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg md:bottom-6",
        toast.type === "error"
          ? "border-red/30 bg-bg-2 text-red"
          : "border-green/30 bg-bg-2 text-green"
      )}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => setToast(null)}
        className="shrink-0 opacity-70 hover:opacity-100"
        aria-label="Закрыть"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
