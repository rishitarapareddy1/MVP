"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/db/types";
import { STATUS_LABELS } from "@/lib/projects/labels";
import { changeStatus } from "./actions";

export type StatusOption = { to: ProjectStatus; blockedReasons: string[] };

/** What each manual move is called on its button (default: "Move to X"). */
const ACTION_LABELS: Partial<Record<ProjectStatus, string>> = {
  scoping: "Start scoping",
  matching: "Ready for matching",
  in_progress: "Mark as in progress",
  approved: "Approve work",
  paid: "Mark as paid",
  closed: "Close without feedback",
  cancelled: "Cancel project",
};

/**
 * Status buttons for the current project. Options and their blockers are
 * computed on the server; the server action re-checks everything on submit.
 * The first forward move is the primary (solid) button; moving backwards
 * (e.g. "Request changes") is never the highlighted action.
 */
export function StatusControls({
  projectId,
  from,
  options,
}: {
  projectId: string;
  from: ProjectStatus;
  options: StatusOption[];
}) {
  const [state, action, pending] = useActionState(changeStatus, null);
  const isForward = (to: ProjectStatus) =>
    PROJECT_STATUSES.indexOf(to) > PROJECT_STATUSES.indexOf(from);
  // Forward moves first, so the primary button is always a step ahead.
  const moves = options
    .filter((o) => o.to !== "cancelled")
    .sort((a, b) => Number(isForward(b.to)) - Number(isForward(a.to)));
  const cancel = options.find((o) => o.to === "cancelled");

  const label = (to: ProjectStatus) => {
    // Going backwards gets clearer wording than the generic labels.
    if (from === "matching" && to === "scoping") return "Back to scoping";
    if (from === "delivered" && to === "in_progress") return "Request changes";
    return ACTION_LABELS[to] ?? `Move to ${STATUS_LABELS[to]}`;
  };

  const button = (o: StatusOption, variant: "default" | "outline" | "ghost") => (
    <form
      key={o.to}
      action={action}
      onSubmit={(e) => {
        if (o.to === "cancelled" && !confirm("Cancel this project? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="to" value={o.to} />
      <Button
        type="submit"
        variant={variant}
        size={variant === "ghost" ? "sm" : "default"}
        className={variant === "ghost" ? "text-destructive hover:text-destructive" : undefined}
        disabled={pending || o.blockedReasons.length > 0}
      >
        {label(o.to)}
      </Button>
    </form>
  );

  const blocked = options.filter((o) => o.blockedReasons.length > 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {moves.map((o, i) => button(o, i === 0 && isForward(o.to) ? "default" : "outline"))}
        {cancel && button(cancel, "ghost")}
      </div>
      {blocked.map((o) => (
        <p key={o.to} className="text-muted-foreground text-xs">
          To {label(o.to).toLowerCase()}: {o.blockedReasons.join(", ").replace(/Missing /g, "add ")}
        </p>
      ))}
      {state?.ok === false && <p className="text-destructive text-sm">{state.error}</p>}
    </div>
  );
}
