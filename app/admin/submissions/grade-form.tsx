"use client";

import { useActionState, useState } from "react";
import { submitWithoutReset } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RubricItem } from "@/lib/assessments/rubric";
import { grade } from "./actions";

export function GradeForm({
  submissionId,
  rubric,
  passThreshold,
}: {
  submissionId: string;
  rubric: RubricItem[];
  passThreshold: number;
}) {
  const [state, action, pending] = useActionState(grade.bind(null, submissionId), null);
  const errors = state?.ok === false ? (state.fieldErrors ?? {}) : {};
  // Scores are tracked only to show a live total; the server recomputes it.
  const [scores, setScores] = useState<Record<string, string>>({});
  const total = rubric.reduce((sum, r) => sum + (Number(scores[r.criterion]) || 0), 0);
  const allFilled = rubric.every((r) => scores[r.criterion]?.trim());

  if (state?.ok) return <p className="text-muted-foreground text-sm">Graded.</p>;

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-3">
        {rubric.map((r) => {
          const name = `score:${r.criterion}`;
          return (
            <label key={r.criterion} className="flex flex-col gap-1.5 text-sm">
              <span>
                {r.criterion} <span className="text-muted-foreground">/ {r.max}</span>
              </span>
              <Input
                name={name}
                inputMode="numeric"
                value={scores[r.criterion] ?? ""}
                onChange={(e) => setScores((s) => ({ ...s, [r.criterion]: e.target.value }))}
                aria-invalid={errors[name] ? true : undefined}
              />
              {errors[name] && <span className="text-destructive text-xs">{errors[name]}</span>}
            </label>
          );
        })}
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span>Feedback for the student (optional)</span>
        <Textarea name="grader_notes" rows={2} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save grade"}
        </Button>
        <span className="text-sm tabular-nums">
          Total {total}/100 ·{" "}
          {allFilled ? (
            <span className={total >= passThreshold ? "font-medium" : "text-destructive"}>
              {total >= passThreshold ? "Pass" : "Fail"}
            </span>
          ) : (
            <span className="text-muted-foreground">pass mark {passThreshold}</span>
          )}
        </span>
        {state?.ok === false && <span className="text-destructive text-sm">{state.error}</span>}
      </div>
    </form>
  );
}
