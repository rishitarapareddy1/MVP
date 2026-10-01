import Link from "next/link";
import { AssessmentStateBadge } from "@/components/assessment-state-badge";
import { assessmentState } from "@/lib/assessments/eligibility";
import { requireStudent } from "@/lib/auth/session";
import { listAssessmentsForStudent } from "@/lib/db/assessments";
import { CATEGORY_LABELS } from "@/lib/projects/labels";

export default async function StudentAssessmentsPage() {
  const me = await requireStudent();
  const assessments = await listAssessmentsForStudent(me.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Skills assessments</h1>
        <p className="text-muted-foreground">
          Short, real-world tasks. Passing one makes you eligible for projects in that category.
        </p>
      </div>

      {assessments.length === 0 ? (
        <p className="text-muted-foreground">No assessments are open right now.</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {assessments.map((a) => (
            <li key={a.id}>
              <Link
                href={`/student/assessments/${a.id}`}
                className="hover:bg-muted flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-muted-foreground text-sm">
                    {CATEGORY_LABELS[a.category]}
                    {a.time_limit_minutes ? ` · about ${a.time_limit_minutes} min` : ""}
                  </span>
                </div>
                <AssessmentStateBadge state={assessmentState(a.submissions)} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
