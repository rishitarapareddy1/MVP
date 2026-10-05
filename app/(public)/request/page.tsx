import type { Metadata } from "next";
import { connection } from "next/server";
import { CalendarCheck, Handshake, MessageSquareText } from "lucide-react";
import { todayInChicago } from "@/lib/format";
import { IntakeForm } from "./intake-form";

export const metadata: Metadata = { title: "Request a project" };

export default async function RequestPage() {
  // Render per request so the date picker's minimum is today, not build day.
  await connection();

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-14">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Tell us about your project</h1>
          <p className="text-muted-foreground">
            Takes about 2 minutes. No account needed, and nothing is agreed until you approve the
            scope and price.
          </p>
        </div>
        <div className="bg-card rounded-2xl border p-5 sm:p-8">
          <IntakeForm minDeadline={todayInChicago()} />
        </div>
      </div>

      <aside className="bg-muted/50 flex flex-col gap-5 rounded-2xl border p-6 lg:sticky lg:top-24">
        <h2 className="font-semibold">What happens next</h2>
        <ol className="flex flex-col gap-5">
          <NextStep
            icon={MessageSquareText}
            title="We reply within 1–2 business days"
            body="We'll email you to clarify the task and agree on a deliverable, price and deadline."
          />
          <NextStep
            icon={Handshake}
            title="We match a vetted student"
            body="Someone who has passed a skills assessment for this kind of work."
          />
          <NextStep
            icon={CalendarCheck}
            title="You get reviewed work"
            body="We check the deliverable before sending it to you."
          />
        </ol>
      </aside>
    </main>
  );
}

function NextStep({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Handshake;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="bg-card text-primary flex size-9 shrink-0 items-center justify-center rounded-lg border">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="flex flex-col gap-0.5 text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">{body}</span>
      </div>
    </li>
  );
}
