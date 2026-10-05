import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaymentInput } from "@/lib/validation/payment";

// Admin-only (RLS). Payments happen outside the app and are recorded here.

export async function listProjectPayments(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, direction, amount_cents, method, paid_at, reference")
    .eq("project_id", projectId)
    .order("paid_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function recordPayment(projectId: string, input: PaymentInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({ project_id: projectId, ...input });
  if (error) throw error;
}

export async function deletePayment(paymentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) throw error;
}
