import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readRubric } from "@/lib/assessments/rubric";
import { requireAdmin } from "@/lib/auth/session";
import { listPendingSubmissions } from "@/lib/db/assessments";
import { BUCKETS, signedUrl } from "@/lib/db/storage";
import { formatDateTime } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/projects/labels";
import { GradeForm } from "./grade-form";

export default async function GradingQueuePage() {
  await requireAdmin();
  const submissions = await listPendingSubmissions();
  // Signed links for uploaded files (1 hour, enough to grade the page).
  const fileUrls = await Promise.all(
    submissions.map((s) =>
      s.submission_path ? signedUrl(BUCKETS.submissions, s.submission_path, 3600) : null,
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Grading queue</h1>
        <p className="text-muted-foreground">
          Oldest first. Pass or fail is set automatically from the total and the pass mark.
        </p>
      </div>

      {submissions.length === 0 ? (
        <p className="text-muted-foreground">Nothing to grade. 🎉</p>
      ) : (
        submissions.map((s, i) => {
          const assessment = s.assessment;
          const student = s.student?.profile;
          if (!assessment) return null;
          const workUrl = s.submission_url ?? fileUrls[i];
          return (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle>{assessment.title}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {student?.full_name ?? "Unnamed student"} ({student?.email}) ·{" "}
                  {CATEGORY_LABELS[assessment.category]} · submitted {formatDateTime(s.created_at)}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {workUrl ? (
                  <a
                    href={workUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="self-start underline"
                  >
                    {s.submission_url ? "Open submitted link" : "Download submitted file"}
                  </a>
                ) : (
                  <p className="text-destructive text-sm">The submitted file could not be found.</p>
                )}
                <GradeForm
                  submissionId={s.id}
                  rubric={readRubric(assessment.rubric)}
                  passThreshold={assessment.pass_threshold}
                />
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
