import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-bg-3 px-3 py-2 text-sm text-text-primary",
        "placeholder:text-text-muted outline-none transition-colors",
        "focus:border-accent focus:ring-2 focus:ring-accent/25",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
