import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// Placeholder landing page (Phase 0). /request and /login are built in later phases.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-4 py-24">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Small projects, done by vetted UIUC students.
        </h1>
        <p className="text-muted-foreground text-lg">
          Tell us what you need: research, data cleanup, lead lists, spreadsheets. We scope it and
          match it to a student who has proven the skill.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/request" className={buttonVariants({ size: "lg" })}>
          I have a project
        </Link>
        <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
          I&apos;m a student
        </Link>
      </div>
    </main>
  );
}
