"use client";

import { useActionState } from "react";
import { FormField, submitWithoutReset } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PROJECT_CATEGORIES } from "@/lib/db/types";
import type { OwnStudent } from "@/lib/db/students";
import { CATEGORY_LABELS } from "@/lib/projects/labels";
import { saveProfile } from "./actions";

export function ProfileForm({ student }: { student: OwnStudent }) {
  const [state, action, pending] = useActionState(saveProfile, null);
  const errors = state?.ok === false ? (state.fieldErrors ?? {}) : {};
  const invalid = (field: string) => (errors[field] ? true : undefined);

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-5" noValidate>
      {/* key: remount with the saved (normalized) values after each save. */}
      <fieldset key={student.updated_at} disabled={pending} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="full_name" label="Full name" error={errors.full_name}>
            <Input
              id="full_name"
              name="full_name"
              autoComplete="name"
              defaultValue={student.profile?.full_name ?? ""}
              aria-invalid={invalid("full_name")}
            />
          </FormField>
          <FormField id="major" label="Major" error={errors.major}>
            <Input
              id="major"
              name="major"
              defaultValue={student.major ?? ""}
              aria-invalid={invalid("major")}
            />
          </FormField>
          <FormField id="graduation_year" label="Graduation year" error={errors.graduation_year}>
            <Input
              id="graduation_year"
              name="graduation_year"
              inputMode="numeric"
              placeholder="2027"
              defaultValue={student.graduation_year ?? ""}
              aria-invalid={invalid("graduation_year")}
            />
          </FormField>
          <FormField
            id="hours_per_week"
            label="Hours available per week"
            error={errors.hours_per_week}
          >
            <Input
              id="hours_per_week"
              name="hours_per_week"
              inputMode="numeric"
              defaultValue={student.hours_per_week ?? ""}
              aria-invalid={invalid("hours_per_week")}
            />
          </FormField>
        </div>

        <FormField
          id="skills"
          label="Skills"
          hint="Comma-separated, e.g. excel, sql, python, market research"
          error={errors.skills}
        >
          <Input
            id="skills"
            name="skills"
            defaultValue={student.skills.join(", ")}
            aria-invalid={invalid("skills")}
          />
        </FormField>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Projects you&apos;re interested in</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PROJECT_CATEGORIES.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="interested_categories"
                  value={c}
                  defaultChecked={student.interested_categories.includes(c)}
                  className="size-4"
                />
                {CATEGORY_LABELS[c]}
              </label>
            ))}
          </div>
        </fieldset>

        <FormField id="bio" label="Short bio" hint="Up to 500 characters" error={errors.bio}>
          <Textarea
            id="bio"
            name="bio"
            rows={3}
            maxLength={500}
            defaultValue={student.bio ?? ""}
            aria-invalid={invalid("bio")}
          />
        </FormField>

        <FormField
          id="portfolio_links"
          label="Portfolio links"
          hint="One per line, up to 5 (GitHub, LinkedIn, personal site…)"
          error={errors.portfolio_links}
        >
          <Textarea
            id="portfolio_links"
            name="portfolio_links"
            rows={3}
            defaultValue={student.portfolio_links.join("\n")}
            aria-invalid={invalid("portfolio_links")}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_available"
            defaultChecked={student.is_available}
            className="size-4"
          />
          I&apos;m available for new projects
        </label>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
        {state?.ok === true && !pending && (
          <span className="text-muted-foreground text-sm">Saved</span>
        )}
        {state?.ok === false && <span className="text-destructive text-sm">{state.error}</span>}
      </div>
    </form>
  );
}
