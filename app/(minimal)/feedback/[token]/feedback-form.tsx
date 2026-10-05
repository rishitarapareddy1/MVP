"use client";

import { useActionState } from "react";
import { FormField, submitWithoutReset } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HONEYPOT_FIELD } from "@/lib/validation/intake";
import { sendFeedback } from "./actions";

export function FeedbackForm({ token, studentName }: { token: string; studentName: string }) {
  const [state, action, pending] = useActionState(sendFeedback.bind(null, token), null);
  const errors = state?.ok === false ? (state.fieldErrors ?? {}) : {};

  if (state?.ok) {
    return (
      <p className="text-lg">
        Thank you! Your feedback helps {studentName} and helps us find you great students next time.
      </p>
    );
  }

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-6" noValidate>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">How would you rate the work overall?</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-ring/50 flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-2 text-sm has-[:focus-visible]:ring-3"
            >
              <input type="radio" name="rating" value={n} className="sr-only" />
              {"★".repeat(n)}
              <span className="sr-only">{n} out of 5</span>
            </label>
          ))}
        </div>
        {errors.rating && <p className="text-destructive text-sm">{errors.rating}</p>}
      </fieldset>

      <YesNo
        name="would_hire_again"
        question={`Would you work with ${studentName} again?`}
        error={errors.would_hire_again}
      />
      <YesNo
        name="interested_in_internship_or_job"
        question={`Would you consider ${studentName} for an internship or job?`}
        error={errors.interested_in_internship_or_job}
      />

      <FormField
        id="quality_notes"
        label="Anything else?"
        hint="Optional: what went well, what could be better"
        error={errors.quality_notes}
      >
        <Textarea id="quality_notes" name="quality_notes" rows={4} maxLength={2000} />
      </FormField>

      {/* Honeypot, same as the intake form. */}
      <div aria-hidden="true" className="absolute left-[-10000px] h-px w-px overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>Leave this blank</label>
        <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
      </div>

      {state?.ok === false && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Send feedback"}
      </Button>
    </form>
  );
}

function YesNo({ name, question, error }: { name: string; question: string; error?: string }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{question}</legend>
      <div className="flex gap-4 text-sm">
        {["yes", "no"].map((v) => (
          <label key={v} className="flex items-center gap-2">
            <input type="radio" name={name} value={v} className="size-4" />
            {v === "yes" ? "Yes" : "No"}
          </label>
        ))}
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </fieldset>
  );
}
