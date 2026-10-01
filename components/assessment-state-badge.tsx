import { Badge } from "@/components/ui/badge";
import type { AssessmentState } from "@/lib/assessments/eligibility";
import { formatDate } from "@/lib/format";

export function AssessmentStateBadge({ state }: { state: AssessmentState }) {
  switch (state.kind) {
    case "not_started":
      return <Badge variant="outline">Not started</Badge>;
    case "pending":
      return <Badge variant="secondary">Waiting for grading</Badge>;
    case "passed":
      return <Badge>Passed{state.score != null ? ` · ${state.score}` : ""}</Badge>;
    case "failed":
      return (
        <Badge variant="destructive">
          {state.canRetake ? "Retake available" : `Retake from ${formatDate(state.retakeAt)}`}
        </Badge>
      );
  }
}
