import { ToneBadge } from "@/components/status-badge";
import type { AssessmentState } from "@/lib/assessments/eligibility";
import { formatDate } from "@/lib/format";

export function AssessmentStateBadge({ state }: { state: AssessmentState }) {
  switch (state.kind) {
    case "not_started":
      return <ToneBadge tone="neutral">Not started</ToneBadge>;
    case "pending":
      return <ToneBadge tone="waiting">Waiting for grading</ToneBadge>;
    case "passed":
      return (
        <ToneBadge tone="done">Passed{state.score != null ? ` · ${state.score}` : ""}</ToneBadge>
      );
    case "failed":
      return state.canRetake ? (
        <ToneBadge tone="action">Retake available</ToneBadge>
      ) : (
        <ToneBadge tone="neutral">Retake from {formatDate(state.retakeAt)}</ToneBadge>
      );
  }
}
