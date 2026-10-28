import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "h-3.5 w-3.5 gap-[2px]", bar: "w-[3px]" },
  md: { box: "h-5 w-5 gap-[3px]", bar: "w-1" },
  lg: { box: "h-8 w-8 gap-1", bar: "w-1.5" },
} as const;

/** Мини-эквалайзер вместо крутящегося кружка: три «играющих» столбика цвета текста. */
export function Spinner({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const s = SIZES[size];
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-end justify-center", s.box, className)}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={cn("eq-bar h-full rounded-[1px] bg-current", s.bar)} style={{ animationDelay: `${i * -0.35}s` }} />
      ))}
    </span>
  );
}
