import { ToneBadge, type Tone } from "@/components/status-badge";
import type { OfferStatus } from "@/lib/db/types";

const LABELS: Record<OfferStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  withdrawn: "Filled by someone else",
};

const TONE: Record<OfferStatus, Tone> = {
  pending: "waiting",
  accepted: "done",
  declined: "neutral",
  expired: "neutral",
  withdrawn: "neutral",
};

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return <ToneBadge tone={TONE[status]}>{LABELS[status]}</ToneBadge>;
}
