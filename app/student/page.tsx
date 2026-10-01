import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/session";
import { listOwnSubmissionStatuses } from "@/lib/db/assessments";
import { getOwnStudent } from "@/lib/db/students";
import { onboardingChecklist } from "@/lib/students/checklist";

// Dashboard. Pending offers and active projects arrive in Phase 4.
export default async function StudentDashboard() {
  const me = await requireStudent();
  const [student, statuses] = await Promise.all([
    getOwnStudent(me.id),
    listOwnSubmissionStatuses(me.id),
  ]);
  const steps = onboardingChecklist(student, student.profile?.full_name ?? null, statuses);
  const allDone = steps.every((s) => s.done);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">
        Welcome{student.profile?.full_name ? `, ${student.profile.full_name}` : ""}
      </h1>

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
