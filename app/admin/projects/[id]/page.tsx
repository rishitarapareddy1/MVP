import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { OfferStatusBadge } from "@/components/offer-status-badge";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { CopyButton } from "@/components/copy-button";
import { listProjectDeliverables } from "@/lib/db/delivery";
import { getProjectFeedback } from "@/lib/db/feedback";
import { expireStaleOffers, listProjectOffers } from "@/lib/db/offers";
import { listProjectPayments } from "@/lib/db/payments";
import { BUCKETS, signedUrl } from "@/lib/db/storage";
import { getSiteOrigin } from "@/lib/site";
import { getProjectDetail, listProjectActivity } from "@/lib/db/projects";
import { getShortlist } from "@/lib/matching/shortlist";
import type { BreakdownItem } from "@/lib/matching/score";
import type { ProjectStatus } from "@/lib/db/types";
import { formatCents, formatDate, formatDateTime, todayInChicago } from "@/lib/format";
import {
  BUDGET_RANGE_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  type BudgetRange,
  type Source,
} from "@/lib/projects/labels";
import { canTransition, isScopeEditable, manualTransitionsFrom } from "@/lib/projects/transitions";
import { ScopeForm } from "./scope-form";
import { PaymentsPanel } from "./payments-panel";
import { ShortlistPanel, type ShortlistRow } from "./shortlist-panel";
import { StatusControls, type StatusOption } from "./status-controls";

export default async function AdminProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const { id } = await params;

  // Guard against malformed ids, which would otherwise be a Postgres error.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  // No cron in the MVP: expire overdue offers whenever this page loads.
  await expireStaleOffers();
  const project = await getProjectDetail(id);
  if (!project) notFound();
  const [activity, offers, shortlist, deliverables, payments, feedback] = await Promise.all([
    listProjectActivity(id),
    listProjectOffers(id),
    project.status === "matching" ? getShortlist(id) : null,
    listProjectDeliverables(id),
    listProjectPayments(id),
    getProjectFeedback(id),
  ]);
  const deliverableUrls = await Promise.all(
    deliverables.map((d) =>
      d.file_path ? signedUrl(BUCKETS.deliverables, d.file_path, 3600) : null,
    ),
  );
  const feedbackUrl = `${await getSiteOrigin()}/feedback/${project.feedback_token}`;
  // Statuses after a student is assigned: show delivery/payment/feedback sections.
  const isPostAssignment = [
    "assigned",
    "in_progress",
    "delivered",
    "approved",
    "paid",
    "closed",
  ].includes(project.status);
  const studentNames = new Map(
    offers.map((o) => [o.student?.id, o.student?.profile?.full_name ?? o.student?.profile?.email]),
  );
  const toRow = (e: NonNullable<typeof shortlist>["eligible"][number]): ShortlistRow => ({
    studentId: e.student.id,
    name: e.student.full_name ?? "Unnamed student",
    email: e.student.email,
    major: e.student.major,
    score: e.result.score,
    breakdown: e.result.breakdown,
  });

  const statusOptions: StatusOption[] = manualTransitionsFrom(project.status).map((to) => {
    const check = canTransition(project, to, {
      manual: true,
      paymentDirections: payments.map((p) => p.direction),
    });
    return { to, blockedReasons: check.ok ? [] : check.reasons };
  });
  const editable = isScopeEditable(project.status);
  const business = project.business;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin/projects" className="text-muted-foreground text-sm hover:underline">
          ← All projects
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{project.title}</h1>
          <StatusBadge status={project.status} />
        </div>
        <p className="text-muted-foreground text-sm">
          {business?.name} · received {formatDate(project.created_at)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusControls projectId={project.id} options={statusOptions} />
        </CardContent>
      </Card>

      {shortlist && (
        <Card>
          <CardHeader>
            <CardTitle>Shortlist</CardTitle>
            <p className="text-muted-foreground text-sm">
              Top matches, best first. Pick up to 3; the first to accept gets the project.
              {project.student_pay_cents != null &&
                ` Students see the pay (${formatCents(project.student_pay_cents)}), not the budget.`}
            </p>
          </CardHeader>
          <CardContent>
            <ShortlistPanel
              projectId={project.id}
              eligible={shortlist.eligible.map(toRow)}
              overrideCandidates={shortlist.overrideCandidates.map(toRow)}
              maxOffers={3}
            />
          </CardContent>
        </Card>
      )}

      {offers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {offers.map((o) => (
                <li key={o.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium">
                      {o.student?.profile?.full_name ?? o.student?.profile?.email}
                    </span>
                    <OfferStatusBadge status={o.status} />
                    <span className="text-muted-foreground text-sm">
                      score {o.match_score} · sent {formatDateTime(o.created_at)}
                      {o.status === "pending" && ` · expires ${formatDateTime(o.expires_at)}`}
                      {o.responded_at && ` · answered ${formatDateTime(o.responded_at)}`}
                    </span>
                  </div>
                  {o.admin_note && (
                    <p className="text-muted-foreground text-sm">Note: {o.admin_note}</p>
                  )}
                  <details>
                    <summary className="text-muted-foreground cursor-pointer text-sm">
                      Score at time of offer
                    </summary>
                    <div className="mt-2 max-w-md">
                      <ScoreBreakdown items={(o.match_breakdown ?? []) as BreakdownItem[]} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {deliverables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deliverables</CardTitle>
            <p className="text-muted-foreground text-sm">
              Review the work and send it to the business, then mark the project Approved (or move
              it back to In progress for changes).
            </p>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-sm">
              {deliverables.map((d, i) => {
                const href = d.url ?? deliverableUrls[i];
                return (
                  <li key={d.id} className="flex flex-col gap-1">
                    <span>
                      {formatDateTime(d.submitted_at)} ·{" "}
                      {href ? (
                        <a href={href} target="_blank" rel="noreferrer" className="underline">
                          {d.url ? "Open link" : "Download file"}
                        </a>
                      ) : (
                        <span className="text-destructive">file missing</span>
                      )}
                    </span>
                    {d.note && <span className="text-muted-foreground">Note: {d.note}</span>}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {isPostAssignment && (
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
            <p className="text-muted-foreground text-sm">
              Record both payments after they happen outside the app, then mark the project Paid.
            </p>
          </CardHeader>
          <CardContent>
            <PaymentsPanel
              projectId={project.id}
              payments={payments}
              budgetCents={project.budget_cents}
              studentPayCents={project.student_pay_cents}
              today={todayInChicago()}
            />
          </CardContent>
        </Card>
      )}

      {["approved", "paid", "closed"].includes(project.status) && (
        <Card>
          <CardHeader>
            <CardTitle>Business feedback</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {feedback ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                <dt className="text-muted-foreground">Rating</dt>
                <dd>
                  {"★".repeat(feedback.rating)}
                  {"☆".repeat(5 - feedback.rating)}
                </dd>
                <dt className="text-muted-foreground">Would hire again</dt>
                <dd>{feedback.would_hire_again ? "Yes" : "No"}</dd>
                <dt className="text-muted-foreground">Interested in internship/job</dt>
                <dd className={feedback.interested_in_internship_or_job ? "font-medium" : ""}>
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
              <>
                <p className="text-muted-foreground">
                  {project.status === "paid"
                    ? "Email this link to the business. Submitting it closes the project."
                    : "The link opens for feedback once the project is marked Paid."}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="bg-muted max-w-full truncate rounded px-2 py-1 text-xs">
                    {feedbackUrl}
                  </code>
                  <CopyButton text={feedbackUrl} label="Copy link" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Original request</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {/* raw_request is never edited: it's the business's own words. */}
            <p className="whitespace-pre-wrap">{project.raw_request}</p>
            {project.budget_range && (
              <p className="text-muted-foreground">
                Rough budget: {BUDGET_RANGE_LABELS[project.budget_range as BudgetRange]}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {business && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                <dt className="text-muted-foreground">Contact</dt>
                <dd>{business.contact_name}</dd>
                <dt className="text-muted-foreground">Email</dt>
                <dd>
                  <a href={`mailto:${business.contact_email}`} className="hover:underline">
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
                        className="hover:underline"
                      >
                        {business.website}
                      </a>
                    </dd>
                  </>
                )}
                {business.source && (
                  <>
                    <dt className="text-muted-foreground">Source</dt>
                    <dd>{SOURCE_LABELS[business.source as Source] ?? business.source}</dd>
                  </>
                )}
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scope</CardTitle>
          {!editable && (
            <p className="text-muted-foreground text-sm">
              Locked: offers have gone out, so students have already seen this scope.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ScopeForm project={project} editable={editable} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {activity.map((entry) => (
                <li key={entry.id} className="flex flex-wrap gap-x-3">
                  <span className="text-muted-foreground tabular-nums">
                    {formatDateTime(entry.created_at)}
                  </span>
                  <span>{describeActivity(entry.action, entry.metadata, studentNames)}</span>
                  <span className="text-muted-foreground">
                    {entry.actor?.email ?? "system / business"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function describeActivity(
  action: string,
  metadata: unknown,
  studentNames: Map<string | undefined, string | undefined>,
): string {
  const m = (metadata ?? {}) as {
    from?: ProjectStatus;
    to?: ProjectStatus;
    student_count?: number;
    student_id?: string;
  };
  const who = studentNames.get(m.student_id) ?? "a student";
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
