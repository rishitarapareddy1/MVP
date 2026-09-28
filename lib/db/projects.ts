import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "./types";
import type { ScopeInput } from "@/lib/validation/project";

// Admin-only queries. They run as the logged-in user, so RLS guarantees
// only admins get rows back even if a caller forgets requireAdmin().

export async function listProjects(filter: { status?: ProjectStatus }) {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select(
      "id, title, status, category, budget_cents, budget_range, deadline, created_at, business:businesses(name)",
    )
    .order("created_at", { ascending: false });
  if (filter.status) query = query.eq("status", filter.status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getProjectDetail(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, business:businesses(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ProjectDetail = NonNullable<Awaited<ReturnType<typeof getProjectDetail>>>;

export async function updateProjectScope(id: string, scope: ScopeInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update(scope).eq("id", id);
  if (error) throw error;
}

/**
 * Changes status only if the project is still in `from`. If someone else
 * changed it in the meantime, nothing is updated and this returns false, so
 * two admins (or an admin and a student) can't overwrite each other.
 * The DB trigger writes the activity_log row.
 */
export async function setProjectStatus(
  id: string,
  from: ProjectStatus,
  to: ProjectStatus,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ status: to })
    .eq("id", id)
    .eq("status", from)
    .select("id");
  if (error) throw error;
  return data.length === 1;
}

export async function countProjectsByStatus(): Promise<Partial<Record<ProjectStatus, number>>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("status");
  if (error) throw error;
  const counts: Partial<Record<ProjectStatus, number>> = {};
  for (const { status } of data) counts[status] = (counts[status] ?? 0) + 1;
  return counts;
}

export async function listProjectActivity(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, action, metadata, created_at, actor:profiles(email)")
    .eq("entity_type", "project")
    .eq("entity_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
