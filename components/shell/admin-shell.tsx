"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FolderKanban,
  Inbox,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof Inbox; count?: number; exact?: boolean };

/**
 * Admin layout: fixed sidebar on desktop, top bar + slide-over menu on phones.
 * A client component only because it needs the current path (active link)
 * and the open/closed state of the mobile menu.
 */
export function AdminShell({
  email,
  todayCount,
  gradingCount,
  children,
}: {
  email: string;
  todayCount: number;
  gradingCount: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // The mobile menu remembers which page it was opened on, so navigating to
  // another page closes it automatically (no effect needed).
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (value: boolean) => setOpenedOn(value ? pathname : null);

  const items: NavItem[] = [
    { href: "/admin", label: "Today", icon: Inbox, count: todayCount, exact: true },
    { href: "/admin/projects", label: "Projects", icon: FolderKanban },
    { href: "/admin/students", label: "Students", icon: Users },
    { href: "/admin/submissions", label: "Grading", icon: ClipboardCheck, count: gradingCount },
    { href: "/admin/assessments", label: "Assessments", icon: ClipboardList },
    { href: "/admin/metrics", label: "Metrics", icon: BarChart3 },
  ];
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Admin">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item) ? "page" : undefined}
          className={cn(
            "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(item)
              ? "bg-ink-foreground/10 text-ink-foreground before:bg-brand before:absolute before:inset-y-1.5 before:-left-3 before:w-1 before:rounded-r-full"
              : "text-ink-foreground/65 hover:bg-ink-foreground/5 hover:text-ink-foreground",
          )}
        >
          <item.icon className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">{item.label}</span>
          {!!item.count && (
            <span className="bg-brand text-brand-foreground min-w-5 rounded-full px-1.5 text-center text-xs font-bold">
              {item.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-ink-foreground/10 flex flex-col gap-2 border-t px-6 py-4">
      <span className="text-ink-foreground/50 truncate text-xs">{email}</span>
      <form action={signOut}>
        <button
          type="submit"
          className="text-ink-foreground/65 hover:text-ink-foreground flex items-center gap-2 text-sm"
        >
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-full flex-1">
      {/* Desktop sidebar */}
      <aside className="bg-ink text-ink-foreground sticky top-0 hidden h-screen w-60 shrink-0 flex-col lg:flex">
        <div className="flex h-16 items-center px-6">
          <BrandMark href="/admin" onDark />
        </div>
        <span className="text-ink-foreground/40 px-6 pb-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
          Admin
        </span>
        {nav}
        {footer}
      </aside>

      {/* Mobile slide-over */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/30"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="bg-ink text-ink-foreground absolute inset-y-0 left-0 flex w-72 flex-col shadow-xl">
            <div className="flex h-16 items-center justify-between px-6">
              <BrandMark href="/admin" onDark />
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="-ml-1 p-1">
            <Menu className="size-5" />
          </button>
          <BrandMark href="/admin" />
          {todayCount > 0 && (
            <span className="bg-brand text-brand-foreground ml-auto rounded-full px-2 text-xs font-semibold">
              {todayCount} to do
            </span>
          )}
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
