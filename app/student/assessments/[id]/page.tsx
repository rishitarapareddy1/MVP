import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CheckCircle2, Clock, Download, Hourglass, RotateCcw } from "lucide-react";
import { AssessmentStateBadge } from "@/components/assessment-state-badge";
import { CategoryIcon } from "@/components/category-icon";
import { PageHeader } from "@/components/page-header";
import { assessmentState, canSubmit } from "@/lib/assessments/eligibility";
import { readRubric } from "@/lib/assessments/rubric";
import { requireStudent } from "@/lib/auth/session";
import { getAssessmentForStudent } from "@/lib/db/assessments";
import { BUCKETS, signedUrl } from "@/lib/db/storage";
import { formatDate, formatDateTime } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/projects/labels";
import { isId } from "@/lib/validation/id";
import { SubmitForm } from "./submit-form";

export default async function StudentAssessmentPage({
  params,
}: PageProps<"/student/assessments/[id]">) {
  const me = await requireStudent();
  const { id } = await params;
  if (!isId(id)) notFound();

  const assessment = await getAssessmentForStudent(id, me.id);
  if (!assessment) notFound();

  const state = assessmentState(assessment.submissions);
  const rubric = readRubric(assessment.rubric);
  const resourceUrl = assessment.resource_path
    ? await signedUrl(BUCKETS.assessmentResources, assessment.resource_path, 3600)
    : null;
  const graded = assessment.submissions.filter((s) => s.status !== "submitted");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={{ href: "/student/assessments", label: "Assessments" }}
        title={assessment.title}
        meta={<AssessmentStateBadge state={state} />}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{CATEGORY_LABELS[assessment.category]}</span>
            {assessment.time_limit_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden /> plan for ~{assessment.time_limit_minutes}{" "}
                min
              </span>
            )}
            <span>Pass mark {assessment.pass_threshold}/100</span>
          </span>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Left: the brief */}
        <div className="flex flex-col gap-6">
          <section className="bg-card flex flex-col gap-5 rounded-2xl border p-6">
            <div className="flex items-center gap-3">
              <CategoryIcon category={assessment.category} />
              <h2 className="text-lg font-semibold">The task</h2>
            </div>
            <p className="leading-relaxed whitespace-pre-wrap">{assessment.instructions}</p>
            {resourceUrl && (
              <a
                href={resourceUrl}
                download
                className="bg-cream hover:border-ink/30 flex w-fit items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium"
              >
                <Download className="size-4" aria-hidden /> Download the starter file
              </a>
            )}
          </section>

          {rubric.length > 0 && (
            <section className="bg-card flex flex-col gap-4 rounded-2xl border p-6">
              <h2 className="text-lg font-semibold">How it&apos;s graded</h2>
              <ul className="flex flex-col gap-3">
                {rubric.map((r) => (
                  <li key={r.criterion} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{r.criterion}</span>
                      <span className="text-muted-foreground">{r.max} pts</span>
                    </div>
                    {/* Bar width = share of the 100 points. */}
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div className="bg-ink h-full rounded-full" style={{ width: `${r.max}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-sm">
                Score {assessment.pass_threshold} or more out of 100 to pass.
              </p>
            </section>
          )}
        </div>

        {/* Right: submit (stays in view on desktop) */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          <section className="bg-card flex flex-col gap-4 rounded-2xl border p-6">
            <h2 className="text-lg font-semibold">Submit your work</h2>
            {canSubmit(state) ? (
              <SubmitForm assessmentId={assessment.id} studentId={me.id} />
            ) : state.kind === "pending" ? (
              <StatusNote icon={Hourglass} tone="info">
                Submitted {formatDateTime(state.submittedAt)}. We&apos;ll grade it soon; check back
                here for your score.
              </StatusNote>
            ) : state.kind === "passed" ? (
              <StatusNote icon={CheckCircle2} tone="success">
                You passed{state.score != null ? ` with ${state.score}/100` : ""}. You can now get
                offers for {CATEGORY_LABELS[assessment.category].toLowerCase()} projects.
              </StatusNote>
            ) : state.kind === "failed" ? (
              <StatusNote icon={RotateCcw} tone="muted">
                You can retake this from {formatDate(state.retakeAt)}.
              </StatusNote>
            ) : null}
          </section>

          {graded.length > 0 && (
            <section className="bg-card flex flex-col gap-3 rounded-2xl border p-6">
              <h2 className="font-semibold">Past results</h2>
              <ul className="flex flex-col gap-3 text-sm">
                {graded.map((s) => (
                  <li key={s.id} className="flex flex-col gap-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">
                        {s.status === "passed" ? "Passed" : "Not passed"}
                      </span>
                      <span className="text-ink font-serif text-2xl italic">
                        {s.total_score}
                        <span className="text-muted-foreground font-sans text-xs not-italic">
                          /100
                        </span>
                      </span>
                    </span>
                    {s.graded_at && (
                      <span className="text-muted-foreground text-xs">
                        {formatDate(s.graded_at)}
                      </span>
                    )}
                    {s.grader_notes && (
                      <span className="bg-cream rounded-lg p-3">“{s.grader_notes}”</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusNote({
  icon: Icon,
  tone,
  children,
}: {
  icon: typeof Clock;
  tone: "info" | "success" | "muted";
  children: ReactNode;
}) {
  const tones = {
    info: "bg-info-soft text-info",
    success: "bg-success-soft text-success",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <p className={`flex gap-3 rounded-xl p-4 text-sm ${tones[tone]}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
