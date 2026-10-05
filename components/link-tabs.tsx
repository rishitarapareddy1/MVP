import Link from "next/link";
import { cn } from "@/lib/utils";

export type LinkTab = { key: string; label: string; href: string; count?: number };

/**
 * Tabs as links (?tab=...), so they work without JavaScript, survive a
 * refresh, and can be linked to directly (e.g. from the Today page).
 */
export function LinkTabs({ tabs, active }: { tabs: LinkTab[]; active: string }) {
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto border-b" aria-label="Sections">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          scroll={false}
          aria-current={t.key === active ? "page" : undefined}
          className={cn(
            "flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
            t.key === active
              ? "border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground border-transparent",
          )}
        >
          {t.label}
          {!!t.count && (
            <span className="bg-muted text-muted-foreground rounded-full px-1.5 text-xs">
              {t.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
