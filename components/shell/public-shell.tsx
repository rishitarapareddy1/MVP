import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

/** Header + footer for public pages (landing, request form, feedback, login). */
export function PublicShell({
  children,
  minimal = false,
}: {
  children: ReactNode;
  /** Hide the marketing links, e.g. on the business feedback page. */
  minimal?: boolean;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <BrandMark />
          {!minimal && (
            <>
              <nav className="text-muted-foreground hidden items-center gap-6 text-sm md:flex">
                <Link href="/#how-it-works" className="hover:text-foreground">
                  How it works
                </Link>
                <Link href="/#students" className="hover:text-foreground">
                  For students
                </Link>
              </nav>
              <div className="ml-auto flex items-center gap-2">
                <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
                  Log in
                </Link>
                {/* Hidden on phones: the hero already has this button. */}
                <Link
                  href="/request"
                  className={buttonVariants({ className: "hidden sm:inline-flex" })}
                >
                  Request a project
                </Link>
              </div>
            </>
          )}
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <BrandMark className="text-foreground" />
          <span>{BRAND.tagline}</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
