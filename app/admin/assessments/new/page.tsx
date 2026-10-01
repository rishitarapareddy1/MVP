import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { AssessmentForm } from "../assessment-form";

export default async function NewAssessmentPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin/assessments" className="text-muted-foreground text-sm hover:underline">
          ← All assessments
        </Link>
        <h1 className="text-2xl font-semibold">New assessment</h1>
      </div>
      <Card>
        <CardContent>
          <AssessmentForm
            values={{
              id: null,
              title: "",
              category: "data_cleanup",
              instructions: "",
              time_limit_minutes: 60,
              rubric: [
                { criterion: "accuracy", max: 50 },
                { criterion: "completeness", max: 30 },
                { criterion: "clarity", max: 20 },
              ],
              pass_threshold: 70,
              is_active: true,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
