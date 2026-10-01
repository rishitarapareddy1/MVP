"use client";

import { useActionState } from "react";
import { FormField, submitWithoutReset } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { rubricToText, type RubricItem } from "@/lib/assessments/rubric";
import { PROJECT_CATEGORIES, type ProjectCategory } from "@/lib/db/types";
import { CATEGORY_LABELS } from "@/lib/projects/labels";
import { saveAssessment } from "./actions";

export type AssessmentFormValues = {
  id: string | null;
  title: string;
  category: ProjectCategory;
  instructions: string;
  time_limit_minutes: number | null;
  rubric: RubricItem[];
  pass_threshold: number;
  is_active: boolean;
  updated_at?: string;
};

export function AssessmentForm({ values }: { values: AssessmentFormValues }) {
  const [state, action, pending] = useActionState(saveAssessment.bind(null, values.id), null);
  const errors = state?.ok === false ? (state.fieldErrors ?? {}) : {};
  const invalid = (field: string) => (errors[field] ? true : undefined);

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-5" noValidate>
      <fieldset key={values.updated_at} disabled={pending} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
          <FormField id="title" label="Title" error={errors.title}>
            <Input
              id="title"
              name="title"
              defaultValue={values.title}
              aria-invalid={invalid("title")}
            />
          </FormField>
          <FormField id="category" label="Category" error={errors.category}>
            <NativeSelect id="category" name="category" defaultValue={values.category}>
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </div>

        <FormField
          id="instructions"
          label="Instructions"
          hint="Shown to students as written, with line breaks kept."
          error={errors.instructions}
        >
          <Textarea
            id="instructions"
            name="instructions"
            rows={8}
            defaultValue={values.instructions}
            aria-invalid={invalid("instructions")}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-[2fr_1fr_1fr]">
          <FormField
            id="rubric"
            label="Rubric"
            hint='One criterion per line, like "accuracy: 50". Points must add up to 100.'
            error={errors.rubric}
          >
            <Textarea
              id="rubric"
              name="rubric"
              rows={4}
              defaultValue={rubricToText(values.rubric)}
              className="font-mono"
              aria-invalid={invalid("rubric")}
            />
          </FormField>
          <FormField id="pass_threshold" label="Pass mark (0–100)" error={errors.pass_threshold}>
            <Input
              id="pass_threshold"
              name="pass_threshold"
              inputMode="numeric"
              defaultValue={values.pass_threshold}
              aria-invalid={invalid("pass_threshold")}
            />
          </FormField>
          <FormField
            id="time_limit_minutes"
            label="Time guide (min)"
            hint="Shown to students; not enforced"
            error={errors.time_limit_minutes}
          >
            <Input
              id="time_limit_minutes"
              name="time_limit_minutes"
              inputMode="numeric"
              defaultValue={values.time_limit_minutes ?? ""}
              aria-invalid={invalid("time_limit_minutes")}
            />
          </FormField>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={values.is_active}
            className="size-4"
          />
          Active (visible to students)
        </label>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : values.id ? "Save changes" : "Create assessment"}
        </Button>
        {state?.ok === true && !pending && (
          <span className="text-muted-foreground text-sm">Saved</span>
        )}
        {state?.ok === false && <span className="text-destructive text-sm">{state.error}</span>}
      </div>
    </form>
  );
}
