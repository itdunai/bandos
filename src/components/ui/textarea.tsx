import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-border bg-bg-3 px-3 py-2 text-sm text-text-primary",
      "placeholder:text-text-muted outline-none transition-colors resize-y min-h-[80px]",
      "focus:border-accent focus:ring-1 focus:ring-accent/30",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
