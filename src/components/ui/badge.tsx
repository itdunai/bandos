import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
  {
    variants: {
      variant: {
        green: "bg-green/12 text-green",
        amber: "bg-amber/12 text-amber",
        red: "bg-red/12 text-red",
        purple: "bg-accent/12 text-accent",
        blue: "bg-blue/12 text-blue",
        muted: "bg-bg-3 text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "muted",
    },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
