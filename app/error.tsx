"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Catches unexpected errors in any page so users see a way forward instead of
 * a blank screen. The details are logged on the server; `digest` lets us find
 * them in the logs.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <span className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">
        Sorry about that. Try again, and if it keeps happening, let us know.
        {error.digest && <span className="mt-2 block text-xs">Reference: {error.digest}</span>}
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Go home
        </Link>
      </div>
    </main>
  );
}
