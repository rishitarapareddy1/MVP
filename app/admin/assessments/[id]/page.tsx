import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readRubric } from "@/lib/assessments/rubric";
import { requireAdmin } from "@/lib/auth/session";
import { getAssessment } from "@/lib/db/assessments";
import { BUCKETS, signedUrl } from "@/lib/db/storage";
import { AssessmentForm } from "../assessment-form";
import { ResourceUpload } from "../resource-upload";

export default async function EditAssessmentPage({ params }: PageProps<"/admin/assessments/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const assessment = await getAssessment(id);
  if (!assessment) notFound();

  const resourceUrl = assessment.resource_path
    ? await signedUrl(BUCKETS.assessmentResources, assessment.resource_path)
    : null;
  // Strip the "<timestamp>-" prefix added at upload for display.
  const resourceName = assessment.resource_path?.split("/").pop()?.replace(/^\d+-/, "") ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin/assessments" className="text-muted-foreground text-sm hover:underline">
          ← All assessments
        </Link>
        <h1 className="text-2xl font-semibold">{assessment.title}</h1>
      </div>
      <Card>
        <CardContent>
          <AssessmentForm values={{ ...assessment, rubric: readRubric(assessment.rubric) }} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Starter file</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourceUpload
            assessmentId={assessment.id}
            currentName={resourceName}
            currentUrl={resourceUrl}
          />
        </CardContent>
      </Card>
    </div>
  );
}
