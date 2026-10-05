import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  ClipboardCheck,
  FileSpreadsheet,
  Handshake,
  ListChecks,
  MessageSquareText,
  Presentation,
  Search,
  Sparkles,
  Table2,
  Users,
  Wallet,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="from-accent/60 to-background bg-gradient-to-b">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col gap-6">
            <span className="bg-brand-soft text-brand-foreground w-fit rounded-full px-3 py-1 text-xs font-semibold">
              Projects from $50 to $500 · about 2–10 hours of work
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Get small projects done by vetted university students.
            </h1>
            <p className="text-muted-foreground max-w-xl text-lg text-pretty">
              Research, data cleanup, lead lists, spreadsheets. Tell us what you need. We scope it,
              agree a price with you, and match it to a student who has already proven the skill.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/request" className={buttonVariants({ size: "xl" })}>
                Request a project <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/login" className={buttonVariants({ size: "xl", variant: "outline" })}>
                I&apos;m a student
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">
              Takes about 2 minutes. No account needed.
            </p>
          </div>
          <ProductPreview />
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
      >
        <SectionTitle
          eyebrow="For businesses"
          title="How it works"
          description="We run every project, from the first call to delivery, so you're never managing freelancers."
        />
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          <Step
            n={1}
            icon={MessageSquareText}
            title="Tell us what you need"
            body="Describe the task in your own words. We follow up to agree on the scope, deliverable, price and deadline."
          />
          <Step
            n={2}
            icon={Handshake}
            title="We match a vetted student"
            body="Students prove their skills with short, real-world assessments. We pick the best fit for your project."
          />
          <Step
            n={3}
            icon={BadgeCheck}
            title="Get reviewed work"
            body="We check the deliverable before it reaches you. Then tell us how it went: a great student could be a future hire."
          />
        </ol>
      </section>

      {/* Project types */}
      <section className="bg-muted/50 border-y">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionTitle
            title="What students can help with"
            description="Small, well-defined projects of about 2 to 10 hours."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TypeCard
              icon={Search}
              title="Market research"
              body="Size up a market, a customer segment or a new location."
            />
            <TypeCard
              icon={BarChart3}
              title="Competitor analysis"
              body="Compare pricing, offerings and positioning side by side."
            />
            <TypeCard
              icon={Table2}
              title="Data cleanup"
              body="Deduplicate, standardize and fix messy lists and exports."
            />
            <TypeCard
              icon={Users}
              title="Lead lists"
              body="Build targeted lists of prospects with verified contact details."
            />
            <TypeCard
              icon={FileSpreadsheet}
              title="Spreadsheet work"
              body="Pivot tables, trackers, formulas and simple dashboards."
            />
            <TypeCard
              icon={Presentation}
              title="Presentations"
              body="Turn findings into a clean, client-ready slide deck."
            />
          </div>
        </div>
      </section>

      {/* Students */}
      <section id="students" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="bg-primary text-primary-foreground grid gap-10 overflow-hidden rounded-3xl p-8 sm:p-12 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <span className="text-primary-foreground/70 text-xs font-semibold tracking-wide uppercase">
              For students
            </span>
            <h2 className="text-3xl font-semibold text-balance">
              Prove your skills. Get paid projects. No applications.
            </h2>
            <p className="text-primary-foreground/80">
              Skip the 200-applicant job posts. Pass a short assessment and we bring real projects
              to you, with pay agreed up front.
            </p>
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "xl", variant: "secondary" }), "w-fit")}
            >
              Join with your university email <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="flex flex-col gap-4">
            <StudentPoint
              icon={ClipboardCheck}
              title="Take a skills assessment"
              body="A short, practical task graded with a clear rubric."
            />
            <StudentPoint
              icon={Sparkles}
              title="Get offers, not rejections"
              body="When a project fits, you get an offer. Accept or pass."
            />
            <StudentPoint
              icon={Wallet}
              title="Get paid and build a track record"
              body="Real clients, real deliverables, real references."
            />
          </ul>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 pb-20 text-center sm:px-6">
        <h2 className="text-2xl font-semibold text-balance">Have a project in mind?</h2>
        <p className="text-muted-foreground max-w-md">
          Tell us about it. We&apos;ll reply within 1–2 business days with a scope and a price.
        </p>
        <Link href="/request" className={buttonVariants({ size: "xl" })}>
          Request a project <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    </main>
  );
}

/** A static illustration of the product: a scoped project and its explained match. */
function ProductPreview() {
  return (
    <div className="relative" aria-hidden>
      <div className="bg-brand/20 absolute -inset-4 -z-10 rounded-[2rem] blur-2xl" />
      <div className="bg-card flex flex-col gap-4 rounded-2xl border p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Green Street Bakery</span>
            <span className="font-semibold">Competitor pricing snapshot</span>
          </div>
          <span className="bg-success-soft text-success rounded-full px-2.5 py-0.5 text-xs font-medium">
            Matched
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Fact label="Price" value="$150" />
          <Fact label="Time" value="4 hours" />
          <Fact label="Due" value="Oct 8" />
        </div>
        <div className="flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full text-sm font-semibold">
              MP
            </span>
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-medium">Maya P. · Statistics &apos;27</span>
              <span className="text-muted-foreground text-xs">
                Passed competitor analysis · 92/100
              </span>
            </div>
            <span className="text-2xl font-semibold">87</span>
          </div>
          <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
            <PreviewLine label="Assessment score" points="+28" />
            <PreviewLine label="Required skills: market research, excel" points="+16" />
            <PreviewLine label="Available 10 h/week" points="+10" />
          </ul>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ListChecks className="text-success size-4" />
          <span className="text-muted-foreground">
            Deliverable: 1-page PDF comparing 5 bakeries
          </span>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/60 flex flex-col rounded-lg py-2">
      <span className="text-muted-foreground text-[11px]">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function PreviewLine({ label, points }: { label: string; points: string }) {
  return (
    <li className="flex justify-between gap-4">
      <span>{label}</span>
      <span className="text-foreground font-medium">{points}</span>
    </li>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-2">
      {eyebrow && (
        <span className="text-primary text-xs font-semibold tracking-wide uppercase">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-semibold text-balance">{title}</h2>
      {description && <p className="text-muted-foreground text-pretty">{description}</p>}
    </div>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  body,
}: {
  n: number;
  icon: typeof Search;
  title: string;
  body: ReactNode;
}) {
  return (
    <li className="bg-card flex flex-col gap-3 rounded-2xl border p-6">
      <div className="flex items-center justify-between">
        <span className="bg-accent text-primary flex size-10 items-center justify-center rounded-xl">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="text-muted-foreground text-sm font-semibold">0{n}</span>
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{body}</p>
    </li>
  );
}

function TypeCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Search;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-card flex gap-4 rounded-2xl border p-5">
      <span className="bg-brand-soft text-brand-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{body}</p>
      </div>
    </div>
  );
}

function StudentPoint({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Search;
  title: string;
  body: string;
}) {
  return (
    <li className="bg-primary-foreground/10 flex gap-4 rounded-2xl p-4">
      <span className="bg-brand text-brand-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold">{title}</span>
        <span className="text-primary-foreground/75 text-sm">{body}</span>
      </div>
    </li>
  );
}
