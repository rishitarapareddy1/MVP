import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/auth/session";
import { countPendingSubmissions } from "@/lib/db/assessments";
import { listHiringFollowUps } from "@/lib/db/feedback";
import { expireStaleOffers } from "@/lib/db/offers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { FollowUpButton } from "./follow-up-button";
import { countProjectsByStatus } from "@/lib/db/projects";
import { PROJECT_STATUSES } from "@/lib/db/types";

// Overview. Loading it also expires overdue offers (no cron in the MVP).
export default async function AdminOverview() {
  await requireAdmin();
  await expireStaleOffers();
  const [counts, toGrade, followUps] = await Promise.all([
    countProjectsByStatus(),
    countPendingSubmissions(),
    listHiringFollowUps(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Admin overview</h1>
      <Link
        href="/admin/submissions"
        className="hover:bg-muted flex max-w-xs flex-col gap-1 rounded-lg border p-3"
      >
        <span className="text-muted-foreground text-sm font-medium">Assessments to grade</span>
        <span className="text-2xl font-semibold tabular-nums">{toGrade}</span>
      </Link>
      {followUps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hiring interest: follow up</CardTitle>
            <p className="text-muted-foreground text-sm">
              These businesses said they&apos;d consider their student for an internship or job.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {followUps.map((f) => {
                const business = f.project?.business;
                const student = f.project?.student;
                return (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex flex-col text-sm">
                      <span>
                        <span className="font-medium">{business?.name}</span> is interested in{" "}
                        {student ? (
                          <Link
                            href={`/admin/students/${student.id}`}
                            className="font-medium underline"
                          >
                            {student.profile?.full_name ?? "their student"}
                          </Link>
                        ) : (
                          "their student"
                        )}
                      </span>
                      <span className="text-muted-foreground">
                        {business?.contact_name} ({business?.contact_email}) · {f.project?.title} ·{" "}
                        {formatDate(f.submitted_at)}
                      </span>
                    </div>
                    <FollowUpButton feedbackId={f.id} />
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">Projects by status</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PROJECT_STATUSES.map((status) => (
            <Link
              key={status}
              href={`/admin/projects?status=${status}`}
              className="hover:bg-muted flex flex-col gap-2 rounded-lg border p-3"
            >
              <StatusBadge status={status} />
              <span className="text-2xl font-semibold tabular-nums">{counts[status] ?? 0}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
