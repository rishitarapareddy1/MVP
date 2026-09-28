import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { getProjectDetail, listProjectActivity } from "@/lib/db/projects";
import type { ProjectStatus } from "@/lib/db/types";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  BUDGET_RANGE_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  type BudgetRange,
  type Source,
} from "@/lib/projects/labels";
import { canTransition, isScopeEditable, manualTransitionsFrom } from "@/lib/projects/transitions";
import { ScopeForm } from "./scope-form";
import { StatusControls, type StatusOption } from "./status-controls";

export default async function AdminProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const { id } = await params;

  // Guard against malformed ids, which would otherwise be a Postgres error.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const project = await getProjectDetail(id);
  if (!project) notFound();
  const activity = await listProjectActivity(id);

  const statusOptions: StatusOption[] = manualTransitionsFrom(project.status).map((to) => {
    const check = canTransition(project, to, { manual: true });
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
                  <span>{describeActivity(entry.action, entry.metadata)}</span>
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

function describeActivity(action: string, metadata: unknown): string {
  const m = (metadata ?? {}) as {
    from?: ProjectStatus;
    to?: ProjectStatus;
    student_count?: number;
  };
  switch (action) {
    case "created":
      return "Request submitted";
    case "status_changed":
      return m.from && m.to
        ? `${STATUS_LABELS[m.from]} → ${STATUS_LABELS[m.to]}`
        : "Status changed";
    case "offers_sent":
      return `Offers sent to ${m.student_count ?? "?"} students`;
    default:
      return action.replaceAll("_", " ");
  }
}
