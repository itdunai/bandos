import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "border border-border bg-transparent text-text-secondary hover:border-accent hover:text-accent",
        accent:
          "border border-accent-dark bg-accent-dark text-white hover:bg-accent hover:border-accent",
        ghost: "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-3",
      },
      size: {
        default: "px-3 py-1.5",
        sm: "px-2 py-1 text-[11px]",
        lg: "px-4 py-2.5 text-sm",
        icon: "p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
