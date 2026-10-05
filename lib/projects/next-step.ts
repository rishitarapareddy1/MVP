import type { ProjectStatus } from "@/lib/db/types";

export type ProjectTab = "overview" | "matching" | "delivery" | "activity";

/**
 * For each status: what the admin should do next, in plain words, and which
 * tab of the project page has the tools for it. Shown in a callout at the top
 * of the project page so nobody has to remember the workflow.
 */
export const NEXT_STEP: Record<ProjectStatus, { title: string; detail: string; tab: ProjectTab }> =
  {
    submitted: {
      title: "Review the request",
      detail:
        "Read what the business wrote, then move to Scoping and follow up with them by email.",
      tab: "overview",
    },
    scoping: {
      title: "Finish the scope",
      detail:
        "Fill in the description, deliverable, skills, hours, prices and deadline, then move to Matching.",
      tab: "overview",
    },
    matching: {
      title: "Pick students",
      detail: "Choose up to 3 students from the shortlist and send offers.",
      tab: "matching",
    },
    offered: {
      title: "Waiting for a student to accept",
      detail: "The first student to accept gets the project. Offers expire after 48 hours.",
      tab: "matching",
    },
    assigned: {
      title: "Waiting for the student to start",
      detail: "The student will mark the project as started.",
      tab: "delivery",
    },
    in_progress: {
      title: "Student is working",
      detail: "You'll see the deliverable here when they submit it.",
      tab: "delivery",
    },
    delivered: {
      title: "Review the deliverable",
      detail:
        "Send it to the business. Then approve it, or move it back to In progress for changes.",
      tab: "delivery",
    },
    approved: {
      title: "Record payments",
      detail: "Record the business's payment and the student's payment, then mark it Paid.",
      tab: "delivery",
    },
    paid: {
      title: "Send the feedback link",
      detail: "Email the business their feedback link. Submitting it closes the project.",
      tab: "delivery",
    },
    closed: {
      title: "Done",
      detail: "Record any outcomes (interviews, offers, referrals) on the student's page.",
      tab: "delivery",
    },
    cancelled: { title: "Cancelled", detail: "Nothing left to do.", tab: "overview" },
  };

/** The main path a project takes, used for the progress tracker. */
export const PROGRESS_STEPS: { label: string; statuses: ProjectStatus[] }[] = [
  { label: "Request", statuses: ["submitted"] },
  { label: "Scope", statuses: ["scoping"] },
  { label: "Match", statuses: ["matching", "offered"] },
  { label: "Work", statuses: ["assigned", "in_progress"] },
  { label: "Review", statuses: ["delivered"] },
  { label: "Payment", statuses: ["approved", "paid"] },
  { label: "Closed", statuses: ["closed"] },
];

/** Index of the current step (0-based), or -1 if cancelled. */
export function progressIndex(status: ProjectStatus): number {
  return PROGRESS_STEPS.findIndex((s) => s.statuses.includes(status));
}
