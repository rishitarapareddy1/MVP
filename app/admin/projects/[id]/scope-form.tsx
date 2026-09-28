"use client";

import { useActionState } from "react";
import { FormField, submitWithoutReset } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { PROJECT_CATEGORIES, type Project } from "@/lib/db/types";
import { CATEGORY_LABELS } from "@/lib/projects/labels";
import { centsToDollarInput } from "@/lib/validation/parsers";
import { saveScope } from "./actions";

type ScopeProject = Pick<
  Project,
  | "id"
  | "title"
  | "category"
  | "scoped_description"
  | "deliverable"
  | "required_skills"
  | "preferred_skills"
  | "estimated_hours"
  | "budget_cents"
  | "student_pay_cents"
  | "deadline"
  | "is_starter"
  | "updated_at"
>;

export function ScopeForm({ project, editable }: { project: ScopeProject; editable: boolean }) {
  // bind() fixes the project id as the first argument of the server action.
  const [state, action, pending] = useActionState(saveScope.bind(null, project.id), null);
  const errors = state?.ok === false ? (state.fieldErrors ?? {}) : {};
  const invalid = (field: string) => (errors[field] ? true : undefined);

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-5" noValidate>
      {/* fieldset disables every input at once when scope is locked.
          key: after a save the page reloads the project (with normalized
          values like lowercase skills). A new updated_at remounts the inputs
          so they pick up the new defaults; uncontrolled inputs can't change
          their defaultValue in place. The "Saved" message lives outside this
          fieldset, so it survives the remount. */}
      <fieldset
        key={project.updated_at}
        disabled={!editable || pending}
        className="flex flex-col gap-5"
      >
        <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
          <FormField id="title" label="Title" error={errors.title}>
            <Input
              id="title"
              name="title"
              defaultValue={project.title}
              aria-invalid={invalid("title")}
            />
          </FormField>
          <FormField id="category" label="Category" error={errors.category}>
            <NativeSelect id="category" name="category" defaultValue={project.category}>
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </div>

        <FormField
          id="scoped_description"
          label="Scoped description"
          hint="What the student will do, written clearly for them."
          error={errors.scoped_description}
        >
          <Textarea
            id="scoped_description"
            name="scoped_description"
            rows={4}
            defaultValue={project.scoped_description ?? ""}
            aria-invalid={invalid("scoped_description")}
          />
        </FormField>

        <FormField
          id="deliverable"
          label="Deliverable"
          hint='Exactly what gets handed over, e.g. "1-page PDF comparing 5 competitors on price".'
          error={errors.deliverable}
        >
          <Textarea
            id="deliverable"
            name="deliverable"
            rows={2}
            defaultValue={project.deliverable ?? ""}
            aria-invalid={invalid("deliverable")}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="required_skills"
            label="Required skills"
            hint="Comma-separated, e.g. excel, sql"
            error={errors.required_skills}
          >
            <Input
              id="required_skills"
              name="required_skills"
              defaultValue={project.required_skills.join(", ")}
            />
          </FormField>
          <FormField
            id="preferred_skills"
            label="Preferred skills"
            hint="Comma-separated"
            error={errors.preferred_skills}
          >
            <Input
              id="preferred_skills"
              name="preferred_skills"
              defaultValue={project.preferred_skills.join(", ")}
            />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-4">
          <FormField id="estimated_hours" label="Est. hours" error={errors.estimated_hours}>
            <Input
              id="estimated_hours"
              name="estimated_hours"
              inputMode="numeric"
              defaultValue={project.estimated_hours ?? ""}
              aria-invalid={invalid("estimated_hours")}
            />
          </FormField>
          <FormField id="budget_cents" label="Business pays ($)" error={errors.budget_cents}>
            <Input
              id="budget_cents"
              name="budget_cents"
              inputMode="decimal"
              defaultValue={centsToDollarInput(project.budget_cents)}
              aria-invalid={invalid("budget_cents")}
            />
          </FormField>
          <FormField
            id="student_pay_cents"
            label="Student gets ($)"
            error={errors.student_pay_cents}
          >
            <Input
              id="student_pay_cents"
              name="student_pay_cents"
              inputMode="decimal"
              defaultValue={centsToDollarInput(project.student_pay_cents)}
              aria-invalid={invalid("student_pay_cents")}
            />
          </FormField>
          <FormField id="deadline" label="Deadline" error={errors.deadline}>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={project.deadline ?? ""}
              aria-invalid={invalid("deadline")}
            />
          </FormField>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_starter"
            defaultChecked={project.is_starter}
            className="size-4"
          />
          Starter project (favors students with little or no experience)
        </label>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!editable || pending}>
          {pending ? "Saving…" : "Save scope"}
        </Button>
        {state?.ok === true && !pending && (
          <span className="text-muted-foreground text-sm">Saved</span>
        )}
        {state?.ok === false && <span className="text-destructive text-sm">{state.error}</span>}
      </div>
    </form>
  );
}
