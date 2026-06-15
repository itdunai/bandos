import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function Spinner({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "h-8 w-8" : size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";

  return (
    <Loader2
      className={cn("animate-spin shrink-0", sizeClass, className)}
      aria-hidden
    />
  );
}
