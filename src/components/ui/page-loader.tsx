import { Spinner } from "@/components/ui/spinner";

export function PageLoader({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-12 text-text-secondary">
      <Spinner size="lg" className="text-accent" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
