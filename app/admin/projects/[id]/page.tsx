import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowRight, FileText, HandCoins, Inbox, MessageSquareQuote, Users } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { LinkTabs } from "@/components/link-tabs";
import { OfferStatusBadge } from "@/components/offer-status-badge";
import { PageHeader } from "@/components/page-header";
import { ProgressTracker } from "@/components/progress-tracker";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { StatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/auth/session";
import { listProjectDeliverables } from "@/lib/db/delivery";
import { getProjectFeedback } from "@/lib/db/feedback";
import { listProjectOffers } from "@/lib/db/offers";
import { listProjectPayments } from "@/lib/db/payments";
import { getProjectDetail, listProjectActivity } from "@/lib/db/projects";
import { BUCKETS, signedUrl } from "@/lib/db/storage";
import type { ProjectStatus } from "@/lib/db/types";
import {
  formatCents,
  formatDate,
  formatDateOnly,
  formatDateTime,
  todayInChicago,
} from "@/lib/format";
import { getShortlist } from "@/lib/matching/shortlist";
import type { BreakdownItem } from "@/lib/matching/score";
import {
  BUDGET_RANGE_LABELS,
  CATEGORY_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  type BudgetRange,
  type Source,
} from "@/lib/projects/labels";
import { NEXT_STEP, type ProjectTab } from "@/lib/projects/next-step";
import { canTransition, isScopeEditable, manualTransitionsFrom } from "@/lib/projects/transitions";
import { getSiteOrigin } from "@/lib/site";
import { isId } from "@/lib/validation/id";
import { PaymentsPanel } from "./payments-panel";
import { ScopeForm } from "./scope-form";
import { ShortlistPanel, type ShortlistRow } from "./shortlist-panel";
import { StatusControls, type StatusOption } from "./status-controls";

const TABS: ProjectTab[] = ["overview", "matching", "delivery", "activity"];
const POST_ASSIGNMENT: ProjectStatus[] = [
  "assigned",
  "in_progress",
  "delivered",
  "approved",
  "paid",
  "closed",
];

export default async function AdminProjectPage({
  params,
  searchParams,
}: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!isId(id)) notFound();

  // (The admin layout already expired overdue offers for this request.)
  const project = await getProjectDetail(id);
  if (!project) notFound();

  // Open the tab that matches what to do next, unless one was chosen.
  const requested = (await searchParams).tab;
  const tab: ProjectTab = TABS.find((t) => t === requested) ?? NEXT_STEP[project.status].tab;

  const [activity, offers, deliverables, payments, feedback] = await Promise.all([
    listProjectActivity(id),
    listProjectOffers(id),
    listProjectDeliverables(id),
    listProjectPayments(id),
    getProjectFeedback(id),
  ]);

  const statusOptions: StatusOption[] = manualTransitionsFrom(project.status).map((to) => {
    const check = canTransition(project, to, {
      manual: true,
      paymentDirections: payments.map((p) => p.direction),
    });
    return { to, blockedReasons: check.ok ? [] : check.reasons };
  });
  const next = NEXT_STEP[project.status];
  const base = `/admin/projects/${id}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/admin/projects", label: "Projects" }}
        title={project.title}
        meta={<StatusBadge status={project.status} />}
        description={
          <>
            {project.business?.name} · {CATEGORY_LABELS[project.category]} · received{" "}
            {formatDate(project.created_at)}
            {project.deadline && <> · due {formatDateOnly(project.deadline)}</>}
          </>
        }
      />

      <div className="bg-card flex flex-col gap-6 rounded-xl border p-5">
        <ProgressTracker status={project.status} />
        {/* Next step: what to do now, with the buttons to do it. */}
        <div className="bg-brand-soft/60 flex flex-col gap-4 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-brand-foreground text-xs font-semibold tracking-wide uppercase">
              Next step
            </span>
            <span className="font-semibold">{next.title}</span>
            <span className="text-muted-foreground text-sm">{next.detail}</span>
          </div>
          {statusOptions.length > 0 && (
            <div className="shrink-0">
              <StatusControls
                projectId={project.id}
                from={project.status}
                options={statusOptions}
              />
            </div>
          )}
        </div>
      </div>

      <LinkTabs
        active={tab}
        tabs={[
          { key: "overview", label: "Overview", href: `${base}?tab=overview` },
          {
            key: "matching",
            label: "Matching",
            href: `${base}?tab=matching`,
            count: offers.length,
          },
          {
            key: "delivery",
            label: "Delivery & payment",
            href: `${base}?tab=delivery`,
            count: deliverables.length,
          },
          { key: "activity", label: "Activity", href: `${base}?tab=activity` },
        ]}
      />

      {tab === "overview" && <OverviewTab project={project} />}
      {tab === "matching" && <MatchingTab project={project} offers={offers} />}
      {tab === "delivery" && (
        <DeliveryTab
          project={project}
          deliverables={deliverables}
          payments={payments}
          feedback={feedback}
        />
      )}
      {tab === "activity" && <ActivityTab activity={activity} offers={offers} />}
    </div>
  );
}

type Project = NonNullable<Awaited<ReturnType<typeof getProjectDetail>>>;
type Offers = Awaited<ReturnType<typeof listProjectOffers>>;

function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="bg-card flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Overview: scope editor + what the business asked for
// ---------------------------------------------------------------------------

function OverviewTab({ project }: { project: Project }) {
  const editable = isScopeEditable(project.status);
  const business = project.business;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Section
        title="Scope"
        description={
          editable
            ? "What the student sees. Matching needs every field filled in."
            : "Locked: offers have gone out, so students have already seen this scope."
        }
      >
        <ScopeForm project={project} editable={editable} />
      </Section>

      <div className="flex flex-col gap-6">
        <Section title="Original request" description="In the business's own words.">
          <blockquote className="border-brand border-l-2 pl-3 text-sm whitespace-pre-wrap">
            {project.raw_request}
          </blockquote>
          {project.budget_range && (
            <p className="text-muted-foreground text-sm">
              Rough budget:{" "}
              <span className="text-foreground font-medium">
                {BUDGET_RANGE_LABELS[project.budget_range as BudgetRange]}
              </span>
            </p>
          )}
        </Section>

        {business && (
          <Section title={business.name}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Contact</dt>
              <dd>{business.contact_name}</dd>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="truncate">
                <a
                  href={`mailto:${business.contact_email}`}
                  className="text-primary hover:underline"
                >
                  {business.contact_email}
                </a>
              </dd>
              {business.contact_phone && (
                <>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{business.contact_phone}</dd>
                </>
              )}
              {business.website && (
                <>
                  <dt className="text-muted-foreground">Website</dt>
                  <dd className="truncate">
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {business.website.replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                </>
              )}
              {business.source && (
                <>
                  <dt className="text-muted-foreground">Found us via</dt>
                  <dd>{SOURCE_LABELS[business.source as Source] ?? business.source}</dd>
                </>
              )}
            </dl>
          </Section>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Matching: shortlist (while matching) + every offer sent
// ---------------------------------------------------------------------------

async function MatchingTab({ project, offers }: { project: Project; offers: Offers }) {
  const shortlist = project.status === "matching" ? await getShortlist(project.id) : null;
  const toRow = (e: NonNullable<typeof shortlist>["eligible"][number]): ShortlistRow => ({
    studentId: e.student.id,
    name: e.student.full_name ?? "Unnamed student",
    email: e.student.email,
    major: e.student.major,
    score: e.result.score,
    breakdown: e.result.breakdown,
  });

  return (
    <div className="flex flex-col gap-6">
      {shortlist && (
        <Section
          title="Shortlist"
          description={
            <>
              Top matches, best first. Pick up to 3; the first to accept gets the project.
              {project.student_pay_cents != null &&
                ` Students see the pay (${formatCents(project.student_pay_cents)}), never the budget.`}
            </>
          }
        >
          <ShortlistPanel
            projectId={project.id}
            eligible={shortlist.eligible.map(toRow)}
            overrideCandidates={shortlist.overrideCandidates.map(toRow)}
            maxOffers={3}
          />
        </Section>
      )}

      {offers.length > 0 ? (
        <Section title="Offers sent">
          <ul className="flex flex-col divide-y">
            {offers.map((o) => (
              <li key={o.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-medium">
                    {o.student?.profile?.full_name ?? o.student?.profile?.email}
                  </span>
                  <OfferStatusBadge status={o.status} />
                  <span className="text-muted-foreground text-sm">score {o.match_score}</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Sent {formatDateTime(o.created_at)}
                  {o.status === "pending" && ` · expires ${formatDateTime(o.expires_at)}`}
                  {o.responded_at && ` · answered ${formatDateTime(o.responded_at)}`}
                </p>
                {o.admin_note && <p className="text-sm">“{o.admin_note}”</p>}
                <details>
                  <summary className="text-muted-foreground cursor-pointer text-xs">
                    Score at time of offer
                  </summary>
                  <div className="mt-2 max-w-md">
                    <ScoreBreakdown items={(o.match_breakdown ?? []) as BreakdownItem[]} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </Section>
      ) : (
        !shortlist && (
          <EmptyState
            icon={Users}
            title="No offers yet"
            description={
              ["submitted", "scoping"].includes(project.status)
                ? "Finish the scope and move the project to Matching to see the shortlist."
                : "No offers were sent for this project."
            }
          />
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delivery & payment: deliverables, payments, feedback
// ---------------------------------------------------------------------------

async function DeliveryTab({
  project,
  deliverables,
  payments,
  feedback,
}: {
  project: Project;
  deliverables: Awaited<ReturnType<typeof listProjectDeliverables>>;
  payments: Awaited<ReturnType<typeof listProjectPayments>>;
  feedback: Awaited<ReturnType<typeof getProjectFeedback>>;
}) {
  if (!POST_ASSIGNMENT.includes(project.status)) {
    return (
      <EmptyState
        icon={Inbox}
        title="Nothing to deliver yet"
        description="Deliverables, payments and feedback appear once a student accepts the project."
      />
    );
  }

  const urls = await Promise.all(
    deliverables.map((d) =>
      d.file_path ? signedUrl(BUCKETS.deliverables, d.file_path, 3600) : null,
    ),
  );
  const feedbackUrl = `${await getSiteOrigin()}/feedback/${project.feedback_token}`;
  const showFeedback = ["approved", "paid", "closed"].includes(project.status);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Section
        title="Deliverables"
        description="Review, send to the business, then approve or request changes."
      >
        {deliverables.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {project.status === "assigned"
              ? "The student hasn't started yet."
              : "The student hasn't submitted anything yet."}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {deliverables.map((d, i) => {
              const href = d.url ?? urls[i];
              return (
                <li key={d.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                  <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">
                        {i === 0 ? "Latest submission" : `Earlier submission`}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDateTime(d.submitted_at)}
                      </span>
                    </div>
                    {d.note && <p className="text-muted-foreground">{d.note}</p>}
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary flex w-fit items-center gap-1 font-medium hover:underline"
                      >
                        {d.url ? "Open link" : "Download file"}
                        <ArrowRight className="size-3.5" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-destructive">File missing</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <div className="flex flex-col gap-6">
        <Section
          title="Payments"
          description="Record both after they happen outside the app, then mark Paid."
          action={<HandCoins className="text-muted-foreground size-5" aria-hidden />}
        >
          <PaymentsPanel
            projectId={project.id}
            payments={payments}
            budgetCents={project.budget_cents}
            studentPayCents={project.student_pay_cents}
            today={todayInChicago()}
          />
        </Section>

        {showFeedback && (
          <Section
            title="Business feedback"
            action={<MessageSquareQuote className="text-muted-foreground size-5" aria-hidden />}
          >
            {feedback ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Rating</dt>
                <dd
                  className="text-brand tracking-widest"
                  aria-label={`${feedback.rating} out of 5`}
                >
                  {"★".repeat(feedback.rating)}
                  <span className="text-border">{"★".repeat(5 - feedback.rating)}</span>
                </dd>
                <dt className="text-muted-foreground">Would hire again</dt>
                <dd>{feedback.would_hire_again ? "Yes" : "No"}</dd>
                <dt className="text-muted-foreground">Internship/job interest</dt>
                <dd className={feedback.interested_in_internship_or_job ? "font-semibold" : ""}>
                  {feedback.interested_in_internship_or_job ? "Yes" : "No"}
                </dd>
                {feedback.quality_notes && (
                  <>
                    <dt className="text-muted-foreground">Notes</dt>
                    <dd className="whitespace-pre-wrap">{feedback.quality_notes}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">Submitted</dt>
                <dd>{formatDateTime(feedback.submitted_at)}</dd>
              </dl>
            ) : (
              <div className="flex flex-col gap-3 text-sm">
                <p className="text-muted-foreground">
                  {project.status === "paid"
                    ? "Email this link to the business. Submitting it closes the project."
                    : "The link opens once the project is marked Paid."}
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-muted min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-xs">
                    {feedbackUrl}
                  </code>
                  <CopyButton text={feedbackUrl} label="Copy" />
                </div>
              </div>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

function ActivityTab({
  activity,
  offers,
}: {
  activity: Awaited<ReturnType<typeof listProjectActivity>>;
  offers: Offers;
}) {
  const names = new Map(
    offers.map((o) => [o.student?.id, o.student?.profile?.full_name ?? o.student?.profile?.email]),
  );
  return (
    <Section title="Activity" description="Every status change and offer event, newest first.">
      <ol className="relative flex flex-col gap-4 border-l pl-5">
        {activity.map((entry) => (
          <li key={entry.id} className="relative flex flex-col text-sm">
            <span
              className="bg-primary absolute top-1.5 -left-[23.5px] size-2 rounded-full"
              aria-hidden
            />
            <span className="font-medium">
              {describeActivity(entry.action, entry.metadata, names)}
            </span>
            <span className="text-muted-foreground text-xs">
              {formatDateTime(entry.created_at)} · {entry.actor?.email ?? "system / business"}
            </span>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function describeActivity(
  action: string,
  metadata: unknown,
  names: Map<string | undefined, string | undefined>,
): string {
  const m = (metadata ?? {}) as {
    from?: ProjectStatus;
    to?: ProjectStatus;
    student_count?: number;
    student_id?: string;
  };
  const who = names.get(m.student_id) ?? "a student";
  switch (action) {
    case "created":
      return "Request submitted";
    case "status_changed":
      return m.from && m.to
        ? `${STATUS_LABELS[m.from]} → ${STATUS_LABELS[m.to]}`
        : "Status changed";
    case "offers_sent":
      return `Offers sent to ${m.student_count ?? "?"} student(s)`;
    case "offer_accepted":
      return `Offer accepted by ${who}`;
    case "offer_declined":
      return `Offer declined by ${who}`;
    case "offer_expired":
      return `Offer to ${who} expired`;
    default:
      return action.replaceAll("_", " ");
  }
}
