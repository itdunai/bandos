import { cn } from "@/lib/utils";

export function SiteLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- локальный SVG wordmark
    <img
      src="/logo.svg"
      alt="BandOS"
      fetchPriority={priority ? "high" : undefined}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}
