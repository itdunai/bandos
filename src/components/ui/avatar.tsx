import { cn } from "@/lib/utils";
import Image from "next/image";

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
      <Image
        src={src}
        alt={name}
        width={48}
        height={48}
        unoptimized
        className={cn("rounded-full object-cover", className)}
      />
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
