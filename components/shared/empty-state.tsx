import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <div className="bg-muted mb-4 flex h-14 w-14 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground h-7 w-7" />
      </div>
      <p className="text-foreground mb-1 font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground mb-4 max-w-sm text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
