import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { IntakeInput } from "@/lib/validation/intake";

/** First sentence of the request, cut to ~60 chars. The admin can retitle it while scoping. */
export function deriveTitle(description: string): string {
  const firstSentence = description.split(/(?<=[.!?])\s|\n/)[0].trim();
  return firstSentence.length <= 60 ? firstSentence : `${firstSentence.slice(0, 57).trimEnd()}…`;
}

/**
 * Saves a public intake request. Uses the service role because the business
 * isn't logged in (anon has no table access under RLS).
 * Reuses the existing business row if this contact email has submitted before,
 * without overwriting its details (the admin may have corrected them).
 */
export async function createIntakeRequest(input: IntakeInput): Promise<{ projectId: string }> {
  const supabase = createAdminClient();

  // ignoreDuplicates: insert if new, do nothing if the email already exists.
  const { error: upsertError } = await supabase.from("businesses").upsert(
    {
      name: input.business_name,
      website: input.website,
      contact_name: input.contact_name,
      contact_email: input.contact_email,
      contact_phone: input.contact_phone,
      source: input.source,
    },
    { onConflict: "contact_email", ignoreDuplicates: true },
  );
  if (upsertError) throw upsertError;

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .eq("contact_email", input.contact_email)
    .single();
  if (businessError) throw businessError;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      business_id: business.id,
      title: deriveTitle(input.description),
      raw_request: input.description,
      category: input.category === "not_sure" ? "other" : input.category,
      budget_range: input.budget_range,
      // The business's desired date. The admin confirms or changes it while scoping.
      deadline: input.deadline,
    })
    .select("id")
    .single();
  if (projectError) throw projectError;

  return { projectId: project.id };
}
