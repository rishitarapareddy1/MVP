import { Badge } from "@/components/ui/badge";
import type { OfferStatus } from "@/lib/db/types";

const LABELS: Record<OfferStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  withdrawn: "Filled by someone else",
};

const VARIANT: Record<OfferStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  accepted: "default",
  declined: "secondary",
  expired: "secondary",
  withdrawn: "secondary",
};

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return <Badge variant={VARIANT[status]}>{LABELS[status]}</Badge>;
}
