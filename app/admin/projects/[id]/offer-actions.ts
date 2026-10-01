"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { sendOffers, type NewOffer } from "@/lib/db/offers";
import { getProjectDetail } from "@/lib/db/projects";
import { getShortlist } from "@/lib/matching/shortlist";
import { canTransition } from "@/lib/projects/transitions";
import { idSchema } from "@/lib/validation/id";
import { fail, ok, type ActionResult } from "@/lib/result";

const MAX_OFFERS = 3;

const selectionsSchema = z
  .array(
    z.object({
      student_id: idSchema,
      admin_note: z.string().trim().max(500, "Keep notes under 500 characters"),
      override: z.boolean(),
    }),
  )
  .min(1, "Pick at least one student")
  .max(MAX_OFFERS, `Pick at most ${MAX_OFFERS} students`);

export type OfferSelection = z.infer<typeof selectionsSchema>[number];

/**
 * Sends offers to the chosen students. The browser only says WHO; scores and
 * breakdowns are recomputed here so the snapshot saved on each offer can't
 * be tampered with, and eligibility is re-checked against fresh data.
 */
export async function sendOffersAction(
  projectId: string,
  selections: OfferSelection[],
): Promise<ActionResult> {
  await requireAdmin();
  if (!idSchema.safeParse(projectId).success) return fail("Unknown project");
  const parsed = selectionsSchema.safeParse(selections);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const project = await getProjectDetail(projectId);
  if (!project) return fail("Project not found");
  const check = canTransition(project, "offered", { manual: false });
  if (!check.ok) return fail(check.reasons.join(". "));

  const shortlist = await getShortlist(projectId);
  if (!shortlist) return fail("Project not found");

  const offers: NewOffer[] = [];
  for (const sel of parsed.data) {
    // Overrides only count for students blocked solely by the assessment filter.
    const entry =
      shortlist.eligible.find((e) => e.student.id === sel.student_id) ??
      (sel.override
        ? shortlist.overrideCandidates.find((e) => e.student.id === sel.student_id)
        : undefined);
    if (!entry) {
      return fail("One of the selected students is no longer eligible. Refresh and try again.");
    }
    offers.push({
      student_id: sel.student_id,
      match_score: entry.result.score,
      match_breakdown: entry.result.breakdown,
      admin_note: sel.admin_note || null,
    });
  }

  try {
    await sendOffers(projectId, offers);
  } catch (error) {
    // send_offers raises readable messages ("At most 3 offers…").
    const message =
      error instanceof Error
        ? error.message
        : String((error as { message?: string })?.message ?? error);
    return fail(message);
  }

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  return ok(undefined);
}
