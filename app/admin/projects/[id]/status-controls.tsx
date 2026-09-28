"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ProjectStatus } from "@/lib/db/types";
import { STATUS_LABELS } from "@/lib/projects/labels";
import { changeStatus } from "./actions";

export type StatusOption = { to: ProjectStatus; blockedReasons: string[] };

/**
 * One button per allowed manual transition. Options and their blockers are
 * computed on the server; the server action re-checks everything on submit.
 */
export function StatusControls({
  projectId,
  options,
}: {
  projectId: string;
  options: StatusOption[];
}) {
  const [state, action, pending] = useActionState(changeStatus, null);

  if (options.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No manual status changes from here. The next step happens automatically.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {options.map(({ to, blockedReasons }) => (
          <form
            key={to}
            action={action}
            onSubmit={(e) => {
              if (to === "cancelled" && !confirm("Cancel this project? This can't be undone.")) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="to" value={to} />
            <Button
              type="submit"
              variant={to === "cancelled" ? "destructive" : "default"}
              disabled={pending || blockedReasons.length > 0}
            >
              Move to {STATUS_LABELS[to]}
            </Button>
          </form>
        ))}
      </div>
      {options
        .filter((o) => o.blockedReasons.length > 0)
        .map((o) => (
          <p key={o.to} className="text-muted-foreground text-sm">
            <span className="font-medium">{STATUS_LABELS[o.to]}</span> needs:{" "}
            {o.blockedReasons.join(", ").replace(/Missing /g, "")}
          </p>
        ))}
      {state?.ok === false && <p className="text-destructive text-sm">{state.error}</p>}
    </div>
  );
}
