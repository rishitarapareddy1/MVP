"use client";

import { useActionState } from "react";
import { FormField, submitWithoutReset } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { PROJECT_CATEGORIES } from "@/lib/db/types";
import {
  BUDGET_RANGES,
  BUDGET_RANGE_LABELS,
  CATEGORY_LABELS,
  SOURCES,
  SOURCE_LABELS,
} from "@/lib/projects/labels";
import { HONEYPOT_FIELD } from "@/lib/validation/intake";
import { submitIntake } from "./actions";

export function IntakeForm({ minDeadline }: { minDeadline: string }) {
  const [state, action, pending] = useActionState(submitIntake, null);
  const errors = state?.ok === false ? (state.fieldErrors ?? {}) : {};
  const invalid = (field: string) => (errors[field] ? true : undefined);

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="business_name" label="Business name" error={errors.business_name}>
          <Input
            id="business_name"
            name="business_name"
            autoComplete="organization"
            required
            aria-invalid={invalid("business_name")}
          />
        </FormField>
        <FormField id="website" label="Website" hint="Optional" error={errors.website}>
          <Input
            id="website"
            name="website"
            placeholder="example.com"
            aria-invalid={invalid("website")}
          />
        </FormField>
        <FormField id="contact_name" label="Your name" error={errors.contact_name}>
          <Input
            id="contact_name"
            name="contact_name"
            autoComplete="name"
            required
            aria-invalid={invalid("contact_name")}
          />
        </FormField>
        <FormField id="contact_email" label="Email" error={errors.contact_email}>
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={invalid("contact_email")}
          />
        </FormField>
        <FormField id="contact_phone" label="Phone" hint="Optional" error={errors.contact_phone}>
          <Input
            id="contact_phone"
            name="contact_phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={invalid("contact_phone")}
          />
        </FormField>
      </div>

      <FormField
        id="description"
        label="Describe the task in your own words"
        hint="What do you need, and what would you like to get back?"
        error={errors.description}
      >
        <Textarea
          id="description"
          name="description"
          rows={5}
          required
          aria-invalid={invalid("description")}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="category" label="Type of work" error={errors.category}>
          <NativeSelect
            id="category"
            name="category"
            defaultValue=""
            required
            aria-invalid={invalid("category")}
          >
            <option value="" disabled>
              Choose one
            </option>
            <option value="not_sure">Not sure</option>
            {PROJECT_CATEGORIES.filter((c) => c !== "other").map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
            <option value="other">Something else</option>
          </NativeSelect>
        </FormField>
        <FormField id="budget_range" label="Rough budget" error={errors.budget_range}>
          <NativeSelect
            id="budget_range"
            name="budget_range"
            defaultValue=""
            required
            aria-invalid={invalid("budget_range")}
          >
            <option value="" disabled>
              Choose one
            </option>
            {BUDGET_RANGES.map((b) => (
              <option key={b} value={b}>
                {BUDGET_RANGE_LABELS[b]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField
          id="deadline"
          label="Desired deadline"
          hint="Optional; leave blank if flexible"
          error={errors.deadline}
        >
          <Input
            id="deadline"
            name="deadline"
            type="date"
            min={minDeadline}
            aria-invalid={invalid("deadline")}
          />
        </FormField>
        <FormField id="source" label="How did you hear about us?" error={errors.source}>
          <NativeSelect
            id="source"
            name="source"
            defaultValue=""
            required
            aria-invalid={invalid("source")}
          >
            <option value="" disabled>
              Choose one
            </option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
      <div aria-hidden="true" className="absolute left-[-10000px] h-px w-px overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>Leave this blank</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state?.ok === false && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Send request"}
      </Button>
    </form>
  );
}
