import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

/** Consistent page title block: optional back link, title, description, actions. */
export function PageHeader({
  title,
  description,
  back,
  actions,
  meta,
}: {
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  /** Small items shown next to the title, e.g. a status badge. */
  meta?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {back && (
        <Link
          href={back.href}
          className="text-muted-foreground hover:text-foreground -ml-1 flex w-fit items-center gap-0.5 text-sm"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {meta}
          </div>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
