import Link from "next/link";
import { ArrowUpRight, ClipboardList, Clock } from "lucide-react";
import { AssessmentStateBadge } from "@/components/assessment-state-badge";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { assessmentState } from "@/lib/assessments/eligibility";
import { requireStudent } from "@/lib/auth/session";
import { listAssessmentsForStudent } from "@/lib/db/assessments";
import { CATEGORY_LABELS } from "@/lib/projects/labels";

export default async function StudentAssessmentsPage() {
  const me = await requireStudent();
  const assessments = await listAssessmentsForStudent(me.id);
  const passed = assessments.filter((a) => assessmentState(a.submissions).kind === "passed").length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-ink text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Prove your <span className="font-serif font-normal italic">skills</span>
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Short, real-world tasks graded on a rubric. Each one you pass unlocks paid projects in
          that category.
          {assessments.length > 0 && (
            <>
              {" "}
              You&apos;ve passed{" "}
              <span className="text-foreground font-semibold">
                {passed} of {assessments.length}
              </span>
              .
            </>
          )}
        </p>
      </div>

      {assessments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assessments are open right now"
          description="Check back soon. We'll add new ones as projects come in."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {assessments.map((a) => {
            const state = assessmentState(a.submissions);
            return (
              <li key={a.id}>
                <Link
                  href={`/student/assessments/${a.id}`}
                  className="group bg-card hover:border-ink/30 flex h-full flex-col gap-4 rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <CategoryIcon category={a.category} />
                    <AssessmentStateBadge state={state} />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      {CATEGORY_LABELS[a.category]}
                    </span>
                    <span className="text-lg leading-snug font-semibold">{a.title}</span>
                  </div>
                  <div className="text-muted-foreground flex items-center justify-between text-sm">
                    <span className="flex items-center gap-3">
                      {a.time_limit_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" aria-hidden /> ~{a.time_limit_minutes} min
                        </span>
                      )}
                      <span>Pass mark {a.pass_threshold}</span>
                    </span>
                    <ArrowUpRight
                      className="group-hover:text-foreground size-4 transition-colors"
                      aria-hidden
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
