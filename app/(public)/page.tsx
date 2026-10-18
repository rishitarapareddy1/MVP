import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PROJECT_TYPES = [
  "Market research",
  "Competitor analysis",
  "Data cleanup",
  "Lead lists",
  "Spreadsheet work",
  "Data analysis",
  "Presentations",
  "Website QA",
  "Social media analysis",
];

export default function Home() {
  return (
    <main className="flex flex-col">
      <Hero />
      <Marquee />
      <HowItWorks />
      <Audiences />
      <Numbers />
      <Faq />
      <ClosingCta />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <section className="bg-cream relative overflow-hidden border-b">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-24 lg:pb-28">
        <div className="flex flex-col gap-7">
          <span className="bg-card text-foreground w-fit rounded-full border px-3 py-1 text-xs font-medium shadow-xs">
            <span className="bg-brand mr-2 inline-block size-1.5 -translate-y-px rounded-full align-middle" />
            Scoped and priced up front · $50–$500 projects
          </span>
          <h1 className="text-ink text-5xl leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
            Real work, done by{" "}
            <span className="relative isolate inline-block font-serif font-normal tracking-normal italic">
              proven
              <span
                className="bg-brand/70 absolute inset-x-0 bottom-1 -z-10 h-3 rounded-sm sm:bottom-2 sm:h-4"
                aria-hidden
              />
            </span>{" "}
            students.
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg text-pretty sm:text-xl">
            Research, data cleanup, lead lists and spreadsheets. Tell us what you need. We scope it,
            agree a price with you, and match it to a university student who has already passed a
            skills test for that exact kind of work.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/request"
              className={cn(
                buttonVariants({ size: "xl" }),
                "bg-ink hover:bg-ink/90 text-ink-foreground",
              )}
            >
              Request a project <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "xl", variant: "outline" }), "bg-card")}
            >
              I&apos;m a student
            </Link>
          </div>
          <ul className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {["No account needed", "Takes 2 minutes", "Work reviewed before delivery"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="text-success size-4" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
        <Collage />
      </div>
    </section>
  );
}

/** Illustrative product collage: a scoped project, its explained match, the deliverable. */
function Collage() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
      <div className="bg-brand/30 absolute -top-6 -right-6 size-40 rounded-full blur-3xl" />
      <div className="bg-card relative rotate-[-2deg] rounded-2xl border p-5 shadow-2xl shadow-black/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">Green Street Bakery</span>
            <span className="font-semibold">Competitor pricing snapshot</span>
          </div>
          <span className="bg-success-soft text-success rounded-full px-2.5 py-0.5 text-xs font-medium">
            Matched
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ["Price", "$150"],
            ["Time", "4 hrs"],
            ["Due", "Oct 8"],
          ].map(([k, v]) => (
            <div key={k} className="bg-muted/70 rounded-lg py-2">
              <div className="text-muted-foreground text-[11px]">{k}</div>
              <div className="text-sm font-semibold">{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-ink text-ink-foreground relative -mt-3 ml-8 rotate-[1.5deg] rounded-2xl p-5 shadow-2xl shadow-black/20 sm:ml-14">
        <div className="flex items-center gap-3">
          <span className="bg-brand text-brand-foreground flex size-10 items-center justify-center rounded-full text-sm font-bold">
            MP
          </span>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-semibold">Maya P. · Statistics &apos;27</span>
            <span className="text-ink-foreground/60 text-xs">Passed competitor analysis · 92</span>
          </div>
          <span className="font-serif text-4xl italic">87</span>
        </div>
        <ul className="text-ink-foreground/70 mt-4 flex flex-col gap-1.5 text-xs">
          {[
            ["Assessment score", "+28"],
            ["Required skills matched", "+16"],
            ["Available 10 h/week", "+10"],
          ].map(([k, v]) => (
            <li key={k} className="flex justify-between">
              <span>{k}</span>
              <span className="text-ink-foreground font-semibold">{v}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-card relative -mt-2 mr-6 ml-auto flex w-fit rotate-[-1deg] items-center gap-3 rounded-xl border px-4 py-3 shadow-xl shadow-black/10">
        <span className="bg-brand-soft text-brand-foreground flex size-9 items-center justify-center rounded-lg">
          <FileSpreadsheet className="size-4" />
        </span>
        <div className="flex flex-col text-sm">
          <span className="font-medium">competitors.pdf delivered</span>
          <span className="text-muted-foreground text-xs">Reviewed · ★★★★★ from the business</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Marquee of project types
// ---------------------------------------------------------------------------

function Marquee() {
  // The list is rendered twice so the -50% scroll loops seamlessly.
  const row = [...PROJECT_TYPES, ...PROJECT_TYPES];
  return (
    <section className="bg-ink text-ink-foreground overflow-hidden py-5" aria-label="Project types">
      <div className="animate-marquee flex w-max gap-10">
        {row.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-10 font-serif text-2xl whitespace-nowrap italic sm:text-3xl"
            aria-hidden={i >= PROJECT_TYPES.length}
          >
            {t}
            <Sparkles className="text-brand size-5 not-italic" aria-hidden />
          </span>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

function HowItWorks() {
  const steps = [
    {
      title: "Tell us what you need",
      body: "Describe the task in your own words. We follow up by email to pin down the deliverable, price and deadline. Nothing is agreed until you approve the scope.",
    },
    {
      title: "We match a proven student",
      body: "Every student passes a short, real-world assessment graded with a rubric. We rank candidates on that score, their skills, past ratings and availability, then hand-pick up to three.",
    },
    {
      title: "Get reviewed work",
      body: "The first student to accept gets the project. We check the deliverable before it reaches you, and can send it back for changes.",
    },
  ];
  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28"
    >
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>For businesses</Eyebrow>
          <h2 className="text-ink text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            A managed service, <span className="font-serif font-normal italic">not</span> a job
            board.
          </h2>
          <p className="text-muted-foreground max-w-md text-lg">
            You never sift through applicants or manage freelancers. We run each project from the
            first email to the final file.
          </p>
        </div>
        <ol className="flex flex-col divide-y border-y">
          {steps.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[auto_1fr] gap-6 py-8">
              <span className="text-brand font-serif text-6xl leading-none italic">{i + 1}</span>
              <div className="flex flex-col gap-2">
                <h3 className="text-ink text-xl font-semibold">{s.title}</h3>
                <p className="text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Businesses vs students color blocks
// ---------------------------------------------------------------------------

function Audiences() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-5 px-4 pb-20 sm:px-6 lg:grid-cols-2 lg:pb-28">
      <div className="bg-brand text-brand-foreground flex flex-col gap-6 rounded-3xl p-8 sm:p-10">
        <Eyebrow className="text-brand-foreground/70">If you run a business</Eyebrow>
        <h3 className="text-3xl font-semibold tracking-[-0.02em] text-balance">
          Get the research and data work done without hiring.
        </h3>
        <Checklist
          items={[
            "Small, well-defined projects of 2–10 hours",
            "A clear deliverable and price before work starts",
            "Students vetted with real skills tests",
            "Feedback that helps you spot a future hire",
          ]}
        />
        <Link
          href="/request"
          className={cn(
            buttonVariants({ size: "xl" }),
            "bg-ink hover:bg-ink/90 text-ink-foreground mt-auto w-fit",
          )}
        >
          Request a project <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div
        id="students"
        className="bg-ink text-ink-foreground flex scroll-mt-20 flex-col gap-6 rounded-3xl p-8 sm:p-10"
      >
        <Eyebrow className="text-ink-foreground/60">If you&apos;re a student</Eyebrow>
        <h3 className="text-3xl font-semibold tracking-[-0.02em] text-balance">
          Prove your skills. Get paid projects.{" "}
          <span className="font-serif font-normal italic">No applications.</span>
        </h3>
        <Checklist
          dark
          items={[
            "Pass a short, practical assessment once",
            "Get offers when a project fits. Accept or pass",
            "Pay agreed up front, real clients, real references",
            "Sign in with your university email",
          ]}
        />
        <Link
          href="/login"
          className={cn(
            buttonVariants({ size: "xl" }),
            "bg-brand text-brand-foreground hover:bg-brand/90 mt-auto w-fit",
          )}
        >
          Join as a student <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function Checklist({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <BadgeCheck
            className={cn("mt-0.5 size-5 shrink-0", dark ? "text-brand" : "text-ink")}
            aria-hidden
          />
          <span className={dark ? "text-ink-foreground/85" : ""}>{t}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Numbers band: facts about how the service works
// ---------------------------------------------------------------------------

function Numbers() {
  const facts = [
    { n: "$0", label: "to request a project. You approve the scope and price first." },
    { n: "3", label: "hand-picked students offered each project, at most." },
    { n: "48h", label: "for a student to accept. The first to accept gets the project." },
    { n: "100", label: "point rubric behind every student's assessment score." },
  ];
  return (
    <section className="bg-cream border-y">
      <div className="mx-auto grid max-w-6xl gap-px overflow-hidden px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {facts.map((f) => (
          <div key={f.n} className="flex flex-col gap-2 py-10 sm:px-6 lg:py-14">
            <span className="text-ink font-serif text-6xl leading-none italic">{f.n}</span>
            <span className="text-muted-foreground max-w-56 text-sm">{f.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

function Faq() {
  const qa: [string, ReactNode][] = [
    [
      "How much does a project cost?",
      "Most projects are between $50 and $500, depending on the work. We agree on the price with you before anything starts.",
    ],
    [
      "Who does the work?",
      "University students who have passed a short skills assessment for that type of project, graded on a rubric. We pick the best fit based on that score, their skills, ratings from past projects and their availability.",
    ],
    [
      "How long does it take?",
      "Projects are sized at roughly 2 to 10 hours of work. We set the deadline together while scoping.",
    ],
    [
      "What if the work needs changes?",
      "We review every deliverable before it reaches you, and can send it back to the student for changes.",
    ],
    ["Do I need an account?", "No. Businesses just fill out a short request form."],
  ];
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
      <Eyebrow>Questions</Eyebrow>
      <h2 className="text-ink mt-3 text-4xl font-semibold tracking-[-0.03em]">
        Good to <span className="font-serif font-normal italic">know</span>
      </h2>
      <div className="mt-8 divide-y border-y">
        {qa.map(([q, a]) => (
          <details key={q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
              {q}
              <span className="text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="text-muted-foreground mt-3">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Closing call to action
// ---------------------------------------------------------------------------

function ClosingCta() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="bg-ink text-ink-foreground relative mx-auto flex max-w-6xl flex-col items-start gap-6 overflow-hidden rounded-3xl p-10 sm:p-14 lg:flex-row lg:items-end lg:justify-between">
        <div
          className="bg-brand/40 absolute -right-20 -bottom-24 size-72 rounded-full blur-3xl"
          aria-hidden
        />
        <h2 className="relative max-w-xl text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
          Have a project in <span className="font-serif font-normal italic">mind?</span>
        </h2>
        <div className="relative flex flex-col gap-3">
          <p className="text-ink-foreground/70 max-w-sm">
            Tell us about it. We&apos;ll reply within 1–2 business days with a scope and a price.
          </p>
          <Link
            href="/request"
            className={cn(
              buttonVariants({ size: "xl" }),
              "bg-brand text-brand-foreground hover:bg-brand/90 w-fit",
            )}
          >
            Request a project <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}
