import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { todayInChicago } from "@/lib/format";

/**
 * Everything waiting on the admin, grouped by what to do next. Powers the
 * "Today" page and the count badge in the sidebar. cache() means the layout
 * and the page share one set of queries per request.
 */
export const loadInbox = cache(async () => {
  const supabase = await createClient();
  const soon = new Date(Date.now() + 24 * 3_600_000).toISOString();

  const [projects, expiring, submissions, followUps] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, title, status, deadline, created_at, updated_at, business:businesses(name), feedback(id)",
      )
      .in("status", [
        "submitted",
        "scoping",
        "matching",
        "assigned",
        "in_progress",
        "delivered",
        "approved",
        "paid",
      ])
      .order("created_at", { ascending: true }),
    supabase
      .from("offers")
      .select(
        "id, expires_at, project:projects(id, title), student:students(profile:profiles(full_name))",
      )
      .eq("status", "pending")
      .lte("expires_at", soon)
      .order("expires_at", { ascending: true }),
    supabase
      .from("assessment_submissions")
      .select(
        "id, created_at, assessment:assessments(title), student:students(profile:profiles(full_name, email))",
      )
      .eq("status", "submitted")
      .order("created_at", { ascending: true }),
    supabase
      .from("feedback")
      .select(
        "id, submitted_at, project:projects(id, title, business:businesses(name, contact_name, contact_email), student:students(id, profile:profiles(full_name)))",
      )
      .eq("interested_in_internship_or_job", true)
      .is("followed_up_at", null),
  ]);
  for (const r of [projects, expiring, submissions, followUps]) if (r.error) throw r.error;

  const p = projects.data!;
  const today = todayInChicago();
  const byStatus = (s: string) => p.filter((x) => x.status === s);

  const inbox = {
    toScope: byStatus("submitted"),
    scoping: byStatus("scoping"),
    toMatch: byStatus("matching"),
    expiringOffers: expiring.data!,
    toReview: byStatus("delivered"),
    toRecordPayment: byStatus("approved"),
    toSendFeedback: byStatus("paid").filter((x) => !x.feedback),
    // Work that's past its deadline and not delivered yet.
    overdue: p.filter(
      (x) => ["assigned", "in_progress"].includes(x.status) && x.deadline && x.deadline < today,
    ),
    toGrade: submissions.data!,
    followUps: followUps.data!,
  };
  const count = Object.values(inbox).reduce((n, list) => n + list.length, 0);
  return { ...inbox, count };
});

export type Inbox = Awaited<ReturnType<typeof loadInbox>>;
