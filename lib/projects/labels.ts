import type { ProjectCategory, ProjectStatus } from "@/lib/db/types";

// Human-readable labels for enum values. Kept in one place so the intake
// form, admin tables and (later) student pages all say the same thing.

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  submitted: "Submitted",
  scoping: "Scoping",
  matching: "Matching",
  offered: "Offered",
  assigned: "Assigned",
  in_progress: "In progress",
  delivered: "Delivered",
  approved: "Approved",
  paid: "Paid",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  market_research: "Market research",
  competitor_analysis: "Competitor analysis",
  data_cleanup: "Data cleanup",
  data_analysis: "Data analysis",
  lead_research: "Lead research",
  spreadsheet_work: "Spreadsheet work",
  presentation: "Presentation",
  website_qa: "Website QA",
  social_media_analysis: "Social media analysis",
  other: "Other",
};

export const BUDGET_RANGES = ["under_100", "100_250", "250_500", "500_plus"] as const;
export type BudgetRange = (typeof BUDGET_RANGES)[number];

export const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
  under_100: "Under $100",
  "100_250": "$100–250",
  "250_500": "$250–500",
  "500_plus": "$500+",
};

// Stored in businesses.source. Values match the spec's examples.
export const SOURCES = ["linkedin", "warm intro", "walk-in", "search", "other"] as const;
export type Source = (typeof SOURCES)[number];

export const SOURCE_LABELS: Record<Source, string> = {
  linkedin: "LinkedIn",
  "warm intro": "Friend or colleague",
  "walk-in": "Met in person",
  search: "Web search",
  other: "Other",
};
