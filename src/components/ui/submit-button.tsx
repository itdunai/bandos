"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  loadingLabel,
  ...props
}: ButtonProps & { loadingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} loading={pending} disabled={props.disabled || pending}>
      {pending && loadingLabel ? loadingLabel : children}
    </Button>
  );
}
