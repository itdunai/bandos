import { cn } from "@/lib/utils";

export function Avatar({
  name,
  className,
  color = "accent",
}: {
  name: string;
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
