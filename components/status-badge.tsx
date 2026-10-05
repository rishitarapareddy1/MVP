import type { ProjectStatus } from "@/lib/db/types";
import { STATUS_LABELS } from "@/lib/projects/labels";
import { cn } from "@/lib/utils";

/**
 * Badge tone tells you whose turn it is:
 *   amber = needs the admin, blue = waiting on a student/business,
 *   green = done, gray = cancelled. The text label always says the status,
 *   so color is never the only signal.
 */
export type Tone = "action" | "waiting" | "done" | "neutral";

export const STATUS_TONE: Record<ProjectStatus, Tone> = {
  submitted: "action",
  scoping: "action",
  matching: "action",
  offered: "waiting",
  assigned: "waiting",
  in_progress: "waiting",
  delivered: "action",
  approved: "action",
  paid: "waiting",
  closed: "done",
  cancelled: "neutral",
};

export const TONE_CLASSES: Record<Tone, string> = {
  action: "bg-warning-soft text-warning",
  waiting: "bg-info-soft text-info",
  done: "bg-success-soft text-success",
  neutral: "bg-muted text-muted-foreground",
};

export function ToneBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <ToneBadge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</ToneBadge>;
}
