import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/session";
import { listOwnSubmissionStatuses } from "@/lib/db/assessments";
import { expireStaleOffers, listOwnActiveProjects, listOwnOffers } from "@/lib/db/offers";
import { getOwnStudent } from "@/lib/db/students";
import { formatCents, formatDateOnly, formatDateTime } from "@/lib/format";
import { onboardingChecklist } from "@/lib/students/checklist";

export default async function StudentDashboard() {
  const me = await requireStudent();
  await expireStaleOffers();
  const [student, statuses, offers, activeProjects] = await Promise.all([
    getOwnStudent(me.id),
    listOwnSubmissionStatuses(me.id),
    listOwnOffers(me.id),
    listOwnActiveProjects(me.id),
  ]);
  const steps = onboardingChecklist(student, student.profile?.full_name ?? null, statuses);
  const allDone = steps.every((s) => s.done);
  const pendingOffers = offers.filter((o) => o.status === "pending" && o.project);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">
        Welcome{student.profile?.full_name ? `, ${student.profile.full_name}` : ""}
      </h1>

      {pendingOffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>New project offers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {pendingOffers.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/student/offers/${o.id}`}
                    className="hover:bg-muted -mx-2 flex flex-wrap items-center justify-between gap-2 rounded-md p-2"
                  >
                    <span className="font-medium">{o.project!.title}</span>
                    <span className="text-muted-foreground text-sm">
                      {o.project!.student_pay_cents != null &&
                        `${formatCents(o.project!.student_pay_cents)} · `}
                      respond by {formatDateTime(o.expires_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {activeProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your projects</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {activeProjects.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link href={`/student/projects/${p.id}`} className="font-medium underline">
                    {p.title}
                  </Link>
                  <span className="flex items-center gap-2 text-sm">
                    {p.deadline && (
                      <span className="text-muted-foreground">
                        due {formatDateOnly(p.deadline)}
                      </span>
                    )}
                    <StatusBadge status={p.status} />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{allDone ? "You're ready for projects" : "Get matched to projects"}</CardTitle>
        </CardHeader>
        <CardContent>
          {allDone && (
            <p className="text-muted-foreground mb-4 text-sm">
              We&apos;ll email you when a project that fits your skills comes up. Passing more
              assessments opens up more kinds of projects.
            </p>
          )}
          <ol className="flex flex-col gap-3">
            {steps.map((step) => (
              <li key={step.label} className="flex items-start gap-3">
                {step.done ? (
                  <CheckCircle2 className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
                ) : (
                  <Circle className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden />
                )}
                <div className="flex flex-col">
                  {step.done ? (
                    <span>
                      {step.label} <span className="sr-only">(done)</span>
                    </span>
                  ) : (
                    <Link href={step.href} className="font-medium underline">
                      {step.label}
                    </Link>
                  )}
                  {step.detail && (
                    <span className="text-muted-foreground text-sm">{step.detail}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
