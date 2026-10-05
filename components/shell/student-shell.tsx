"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ClipboardList, Home, LogOut, UserRound } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/student", label: "Home", icon: Home, exact: true },
  { href: "/student/assessments", label: "Assessments", icon: ClipboardList },
  { href: "/student/profile", label: "Profile", icon: UserRound },
];

/**
 * Student layout: top bar on desktop; on phones the same three links move to
 * a bottom tab bar, where thumbs can reach them.
 */
export function StudentShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-6 px-4">
          <BrandMark href="/student" />
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Student">
            {ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href, item.exact) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive(item.href, item.exact)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-muted-foreground hidden text-sm md:inline">{email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
                <span className="sr-only sm:hidden">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Extra bottom padding on phones so content clears the tab bar. */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-24 sm:py-8">{children}</main>

      <nav
        className="bg-background/95 fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
        aria-label="Student"
      >
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href, item.exact) ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-xs font-medium",
              isActive(item.href, item.exact) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="size-5" aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
