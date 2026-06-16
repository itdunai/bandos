import { SafeMediaImage } from "@/components/ui/safe-media-image";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  src,
  className,
  color = "accent",
}: {
  name: string;
  src?: string | null;
  className?: string;
  color?: "accent" | "blue" | "green" | "amber";
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const colors = {
    accent: "bg-accent/15 text-accent",
    blue: "bg-blue/15 text-blue",
    green: "bg-green/15 text-green",
    amber: "bg-amber/15 text-amber",
  };

  if (src) {
    return (
      <div
        className={cn(
          "relative h-12 w-12 shrink-0 overflow-hidden rounded-full",
          className
        )}
      >
        <SafeMediaImage
          src={src}
          alt={name}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-medium",
        colors[color],
        className
      )}
    >
      {initials}
    </div>
  );
}
