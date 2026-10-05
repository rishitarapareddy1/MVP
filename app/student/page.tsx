import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, Circle, Clock, PartyPopper, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { requireStudent } from "@/lib/auth/session";
import { listOwnSubmissionStatuses } from "@/lib/db/assessments";
import { expireStaleOffers, listOwnActiveProjects, listOwnOffers } from "@/lib/db/offers";
import { getOwnStudent } from "@/lib/db/students";
import { formatCents, formatDateOnly, formatDateTime } from "@/lib/format";
import { onboardingChecklist } from "@/lib/students/checklist";
import { cn } from "@/lib/utils";

export default async function StudentDashboard() {
  const me = await requireStudent();
  await expireStaleOffers();
  const [student, statuses, offers, activeProjects] = await Promise.all([
    getOwnStudent(me.id),
    listOwnSubmissionStatuses(me.id),
    listOwnOffers(me.id),
    listOwnActiveProjects(me.id),
  ]);
  const firstName = student.profile?.full_name?.split(" ")[0];
  const steps = onboardingChecklist(student, student.profile?.full_name ?? null, statuses);
  const doneSteps = steps.filter((s) => s.done).length;
  const pendingOffers = offers.filter((o) => o.status === "pending" && o.project);

  // The single most useful thing to do right now.
  const offer = pendingOffers[0];
  const toStart = activeProjects.find((p) => p.status === "assigned");
  const toDeliver = activeProjects.find((p) => p.status === "in_progress");
  const nextSetup = steps.find((s) => !s.done);

  let hero: ReactNode;
  if (offer?.project) {
    hero = (
      <Hero
        icon={Sparkles}
        eyebrow="New project offer"
        title={offer.project.title}
        detail={
          <>
            {offer.project.student_pay_cents != null &&
              `You'd earn ${formatCents(offer.project.student_pay_cents)}. `}
            Respond by {formatDateTime(offer.expires_at)}. The first student to accept gets it.
          </>
        }
        href={`/student/offers/${offer.id}`}
        cta="View offer"
      />
    );
  } else if (toDeliver) {
    hero = (
      <Hero
        icon={Clock}
        eyebrow="In progress"
        title={toDeliver.title}
        detail={toDeliver.deadline ? `Due ${formatDateOnly(toDeliver.deadline)}.` : undefined}
        href={`/student/projects/${toDeliver.id}`}
        cta="Submit your work"
      />
    );
  } else if (toStart) {
    hero = (
      <Hero
        icon={PartyPopper}
        eyebrow="You got the project"
        title={toStart.title}
        detail="Let us know when you start working on it."
        href={`/student/projects/${toStart.id}`}
        cta="Open project"
      />
    );
  } else if (nextSetup) {
    hero = (
      <Hero
        icon={ArrowRight}
        eyebrow={`Step ${doneSteps + 1} of ${steps.length}`}
        title={nextSetup.label}
        detail={nextSetup.detail ?? "Finish setup to start getting matched to paid projects."}
        href={nextSetup.href}
        cta="Continue"
      />
    );
  } else {
    hero = (
      <Hero
        icon={CheckCircle2}
        eyebrow="You're all set"
        title="We'll email you when a project fits your skills"
        detail="Passing more assessments opens up more kinds of projects."
        href="/student/assessments"
        cta="Browse assessments"
        quiet
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Hi{firstName ? `, ${firstName}` : ""} 👋</h1>
        <p className="text-muted-foreground text-sm">Here&apos;s what&apos;s happening.</p>
      </div>

      {hero}

      {pendingOffers.length > 1 && (
        <Section title="Offers">
          {pendingOffers.map((o) => (
            <ListLink
              key={o.id}
              href={`/student/offers/${o.id}`}
              title={o.project!.title}
              subtitle={`respond by ${formatDateTime(o.expires_at)}`}
              right={
                o.project!.student_pay_cents != null
                  ? formatCents(o.project!.student_pay_cents)
                  : undefined
              }
            />
          ))}
        </Section>
      )}

      {activeProjects.length > 0 && (
        <Section title="Your projects">
          {activeProjects.map((p) => (
            <ListLink
              key={p.id}
              href={`/student/projects/${p.id}`}
              title={p.title}
              subtitle={p.deadline ? `due ${formatDateOnly(p.deadline)}` : undefined}
              right={<StatusBadge status={p.status} />}
            />
          ))}
        </Section>
      )}

      {/* Hidden once everything is done: it's only useful while onboarding. */}
      {doneSteps < steps.length && (
        <Section
          title="Getting started"
          aside={
            <span className="text-muted-foreground text-xs">
              {doneSteps} of {steps.length} done
            </span>
          }
        >
          <div className="flex flex-col gap-4 p-4">
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${(doneSteps / steps.length) * 100}%` }}
              />
            </div>
            <ol className="flex flex-col gap-3">
              {steps.map((step) => (
                <li key={step.label} className="flex items-start gap-3">
                  {step.done ? (
                    <CheckCircle2 className="text-success mt-0.5 size-5 shrink-0" aria-hidden />
                  ) : (
                    <Circle className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden />
                  )}
                  <div className="flex flex-col text-sm">
                    {step.done ? (
                      <span className="text-muted-foreground line-through decoration-1">
                        {step.label} <span className="sr-only">(done)</span>
                      </span>
                    ) : (
                      <Link href={step.href} className="font-medium hover:underline">
                        {step.label}
                      </Link>
                    )}
                    {step.detail && !step.done && (
                      <span className="text-muted-foreground text-xs">{step.detail}</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Section>
      )}
    </div>
  );
}

function Hero({
  icon: Icon,
  eyebrow,
  title,
  detail,
  href,
  cta,
  quiet,
}: {
  icon: typeof Sparkles;
  eyebrow: string;
  title: string;
  detail?: ReactNode;
  href: string;
  cta: string;
  quiet?: boolean;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:p-6",
        quiet ? "bg-card" : "bg-primary text-primary-foreground border-primary",
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          quiet ? "bg-success-soft text-success" : "bg-brand text-brand-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <span
          className={cn(
            "text-xs font-semibold tracking-wide uppercase",
            quiet ? "text-muted-foreground" : "text-primary-foreground/70",
          )}
        >
          {eyebrow}
        </span>
        <span className="text-lg font-semibold">{title}</span>
        {detail && (
          <span
            className={cn(
              "text-sm",
              quiet ? "text-muted-foreground" : "text-primary-foreground/80",
            )}
          >
            {detail}
          </span>
        )}
      </div>
      <Link
        href={href}
        className={cn(
          buttonVariants({ size: "lg", variant: quiet ? "outline" : "secondary" }),
          "shrink-0",
        )}
      >
        {cta}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {aside}
      </div>
      <div className="bg-card divide-y overflow-hidden rounded-xl border">{children}</div>
    </section>
  );
}

function ListLink({
  href,
  title,
  subtitle,
  right,
}: {
  href: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <Link href={href} className="hover:bg-accent/60 flex items-center gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{title}</span>
        {subtitle && <span className="text-muted-foreground text-xs">{subtitle}</span>}
      </div>
      {right && <span className="shrink-0 text-sm font-medium">{right}</span>}
    </Link>
  );
}
