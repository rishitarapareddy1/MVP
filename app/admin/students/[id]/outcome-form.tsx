"use client";

import { useActionState } from "react";
import { FormField, submitWithoutReset } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { OUTCOME_TYPES } from "@/lib/db/types";
import { OUTCOME_LABELS } from "@/lib/projects/labels";
import { recordOutcome } from "./outcome-actions";

export function OutcomeForm({
  studentId,
  projects,
  today,
  formKey,
}: {
  studentId: string;
  projects: { id: string; title: string }[];
  today: string;
  /** Changes after each save so the form resets. */
  formKey: number;
}) {
  const [state, action, pending] = useActionState(recordOutcome.bind(null, studentId), null);
  const errors = state?.ok === false ? (state.fieldErrors ?? {}) : {};

  return (
    <form
      key={formKey}
      onSubmit={submitWithoutReset(action)}
      className="flex flex-col gap-4 rounded-lg border p-4 text-sm"
      noValidate
    >
      <span className="font-medium">Record an outcome</span>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField id="type" label="What happened" error={errors.type}>
          <NativeSelect id="type" name="type" defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            {OUTCOME_TYPES.map((t) => (
              <option key={t} value={t}>
                {OUTCOME_LABELS[t]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField
          id="project_id"
          label="Related project"
          hint="Optional"
          error={errors.project_id}
        >
          <NativeSelect id="project_id" name="project_id" defaultValue="">
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id="occurred_at" label="When" error={errors.occurred_at}>
          <Input id="occurred_at" name="occurred_at" type="date" max={today} defaultValue={today} />
        </FormField>
      </div>
      <FormField id="notes" label="Notes" hint="Optional" error={errors.notes}>
        <Input
          id="notes"
          name="notes"
          maxLength={1000}
          placeholder="e.g. Bakery offered a summer internship"
        />
      </FormField>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Record outcome"}
        </Button>
        {state?.ok === false && <span className="text-destructive">{state.error}</span>}
      </div>
    </form>
  );
}
