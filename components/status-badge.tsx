import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/lib/db/types";
import { STATUS_LABELS } from "@/lib/projects/labels";

// Solid = needs the admin's attention; outline = waiting on someone else;
// secondary = finished.
const VARIANT: Record<ProjectStatus, "default" | "secondary" | "outline" | "destructive"> = {
  submitted: "default",
  scoping: "default",
  matching: "default",
  offered: "outline",
  assigned: "outline",
  in_progress: "outline",
  delivered: "default",
  approved: "default",
  paid: "default",
  closed: "secondary",
  cancelled: "destructive",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
}
