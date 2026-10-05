import { Check } from "lucide-react";
import type { ProjectStatus } from "@/lib/db/types";
import { PROGRESS_STEPS, progressIndex } from "@/lib/projects/next-step";
import { cn } from "@/lib/utils";

/** Horizontal stepper showing where a project is in its lifecycle. */
export function ProgressTracker({ status }: { status: ProjectStatus }) {
  const current = progressIndex(status);
  if (current === -1) return null; // cancelled: the badge says it all

  return (
    <ol className="flex w-full items-center" aria-label="Project progress">
      {PROGRESS_STEPS.map((step, i) => {
        const done = i < current || status === "closed";
        const active = i === current && status !== "closed";
        return (
          <li key={step.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-brand bg-brand-soft text-brand-foreground",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium whitespace-nowrap sm:text-xs",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < PROGRESS_STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-1 mb-5 h-0.5 flex-1 rounded-full",
                  i < current || status === "closed" ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
