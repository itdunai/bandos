import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center",
        className
      )}
    >
      {icon && <div className="mb-3 text-text-muted">{icon}</div>}
      <h3 className="text-sm font-medium">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-text-secondary">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
