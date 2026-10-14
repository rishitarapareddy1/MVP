"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth/session";
import { getOwnOffer, respondToOffer, type OfferResponse } from "@/lib/db/offers";
import { notifyOfferAccepted } from "@/lib/email/notify";
import { isId } from "@/lib/validation/id";
import { fail, ok, type ActionResult } from "@/lib/result";

const MESSAGES: Record<Exclude<OfferResponse, "accepted" | "declined">, string> = {
  filled: "Sorry, another student accepted this project first.",
  expired: "This offer has expired.",
  not_pending: "You've already responded to this offer.",
  too_many_projects: "You already have 2 active projects. Finish one before taking another.",
  not_found: "Offer not found.",
};

/** Accept or decline. The database function decides who wins (see accept_offer). */
export async function respond(
  offerId: string,
  response: "accept" | "decline",
): Promise<ActionResult<OfferResponse>> {
  const me = await requireStudent();
  if (!isId(offerId)) return fail("Offer not found.");

  const result = await respondToOffer(offerId, response);
  if (result === "accepted") {
    // Let the admin know right away. Never blocks or undoes the acceptance.
    const offer = await getOwnOffer(offerId, me.id);
    if (offer?.project) {
      await notifyOfferAccepted({
        studentName: me.full_name ?? me.email,
        projectTitle: offer.project.title,
        projectId: offer.project_id,
      });
    }
  }
  revalidatePath(`/student/offers/${offerId}`);
  revalidatePath("/student");

  return result === "accepted" || result === "declined" ? ok(result) : fail(MESSAGES[result]);
}
