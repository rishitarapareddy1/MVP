import type { Metadata } from "next";
import { connection } from "next/server";
import { todayInChicago } from "@/lib/format";
import { IntakeForm } from "./intake-form";

export const metadata: Metadata = { title: "Request a project" };

export default async function RequestPage() {
  // Render per request so the date picker's minimum is today, not build day.
  await connection();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Tell us about your project</h1>
        <p className="text-muted-foreground">
          Takes about 2 minutes. We&apos;ll follow up by email to confirm the scope and price before
          any work starts.
        </p>
      </div>
      <IntakeForm minDeadline={todayInChicago()} />
    </main>
  );
}
