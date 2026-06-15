"use client";

import { PendingOverlay } from "@/components/ui/pending-overlay";
import { useFormStatus } from "react-dom";

export function FormPending({
  children,
  label,
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <PendingOverlay pending={pending} label={label}>
      {children}
    </PendingOverlay>
  );
}
