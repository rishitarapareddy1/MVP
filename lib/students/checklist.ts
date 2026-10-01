import type { AssessmentStatus, Student } from "@/lib/db/types";

type ProfileFields = Pick<
  Student,
  "major" | "graduation_year" | "skills" | "interested_categories" | "hours_per_week"
>;

/** Profile fields the matching algorithm needs. Bio, links and resume are nice-to-have. */
export function missingProfileFields(student: ProfileFields, fullName: string | null): string[] {
  const missing: string[] = [];
  if (!fullName?.trim()) missing.push("name");
  if (!student.major?.trim()) missing.push("major");
  if (!student.graduation_year) missing.push("graduation year");
  if (student.skills.length === 0) missing.push("skills");
  if (student.interested_categories.length === 0) missing.push("project interests");
  if (student.hours_per_week == null) missing.push("weekly availability");
  return missing;
}

export type ChecklistStep = { label: string; done: boolean; href: string; detail?: string };

/**
 * Onboarding checklist (spec flow C): complete profile -> take an assessment
 * -> admin grades it -> matchable in that category.
 */
export function onboardingChecklist(
  student: ProfileFields,
  fullName: string | null,
  submissionStatuses: AssessmentStatus[],
): ChecklistStep[] {
  const missing = missingProfileFields(student, fullName);
  const submitted = submissionStatuses.length > 0;
  const passed = submissionStatuses.includes("passed");
  const awaitingGrade = submissionStatuses.includes("submitted");

  return [
    {
      label: "Complete your profile",
      done: missing.length === 0,
      href: "/student/profile",
      detail: missing.length ? `Missing: ${missing.join(", ")}` : undefined,
    },
    {
      label: "Take a skills assessment",
      done: submitted,
      href: "/student/assessments",
    },
    {
      label: "Pass an assessment",
      done: passed,
      href: "/student/assessments",
      detail: !passed && awaitingGrade ? "Waiting for grading" : undefined,
    },
  ];
}
