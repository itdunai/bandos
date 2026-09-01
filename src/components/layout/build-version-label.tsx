"use client";

import { useBuildSha } from "@/components/layout/build-sha-context";

export function BuildVersionLabel({ className }: { className?: string }) {
  const sha = useBuildSha();

  return (
    <p
      className={className}
      title="Версия текущего деплоя"
    >
      build: {sha}
    </p>
  );
}
