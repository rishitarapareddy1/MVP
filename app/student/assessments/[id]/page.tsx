import Link from "next/link";
import { notFound } from "next/navigation";
import { AssessmentStateBadge } from "@/components/assessment-state-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assessmentState, canSubmit } from "@/lib/assessments/eligibility";
import { readRubric } from "@/lib/assessments/rubric";
import { requireStudent } from "@/lib/auth/session";
import { getAssessmentForStudent } from "@/lib/db/assessments";
import { BUCKETS, signedUrl } from "@/lib/db/storage";
import { formatDate, formatDateTime } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/projects/labels";
import { SubmitForm } from "./submit-form";

export default async function StudentAssessmentPage({
  params,
}: PageProps<"/student/assessments/[id]">) {
  const me = await requireStudent();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const assessment = await getAssessmentForStudent(id, me.id);
  if (!assessment) notFound();

  const state = assessmentState(assessment.submissions);
  const rubric = readRubric(assessment.rubric);
  const resourceUrl = assessment.resource_path
    ? await signedUrl(BUCKETS.assessmentResources, assessment.resource_path, 3600)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/student/assessments" className="text-muted-foreground text-sm hover:underline">
          ← All assessments
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{assessment.title}</h1>
          <AssessmentStateBadge state={state} />
        </div>
        <p className="text-muted-foreground text-sm">
          {CATEGORY_LABELS[assessment.category]}
          {assessment.time_limit_minutes
            ? ` · plan for about ${assessment.time_limit_minutes} minutes`
            : ""}
          {` · pass mark ${assessment.pass_threshold}/100`}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p className="whitespace-pre-wrap">{assessment.instructions}</p>
          {resourceUrl && (
            <a href={resourceUrl} className="self-start underline" download>
              Download the starter file
            </a>
          )}
          {rubric.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="font-medium">How it&apos;s graded</span>
              <ul className="text-muted-foreground list-inside list-disc">
                {rubric.map((r) => (
                  <li key={r.criterion}>
                    {r.criterion}: {r.max} points
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submit your work</CardTitle>
        </CardHeader>
        <CardContent>
          {canSubmit(state) ? (
            <SubmitForm assessmentId={assessment.id} studentId={me.id} />
          ) : (
            <p className="text-muted-foreground text-sm">
              {state.kind === "pending" &&
                `Submitted ${formatDateTime(state.submittedAt)}. We'll grade it soon.`}
              {state.kind === "passed" && "You passed this assessment. Nice work!"}
              {state.kind === "failed" &&
                `You can retake this assessment from ${formatDate(state.retakeAt)}.`}
            </p>
          )}
        </CardContent>
      </Card>

      {assessment.submissions.some((s) => s.status !== "submitted") && (
        <Card>
          <CardHeader>
            <CardTitle>Past results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-sm">
              {assessment.submissions
                .filter((s) => s.status !== "submitted")
                .map((s) => (
                  <li key={s.id} className="flex flex-col gap-1">
                    <span>
                      {s.status === "passed" ? "Passed" : "Not passed"} · {s.total_score}/100
                      {s.graded_at ? ` · ${formatDate(s.graded_at)}` : ""}
                    </span>
                    {s.grader_notes && (
                      <span className="text-muted-foreground">Feedback: {s.grader_notes}</span>
                    )}
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
