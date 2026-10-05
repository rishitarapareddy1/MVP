import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Friendly placeholder for lists with nothing in them yet. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center">
      <div className="bg-muted flex size-10 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-5" aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
