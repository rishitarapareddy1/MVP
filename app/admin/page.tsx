import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/auth/session";
import { countPendingSubmissions } from "@/lib/db/assessments";
import { expireStaleOffers } from "@/lib/db/offers";
import { countProjectsByStatus } from "@/lib/db/projects";
import { PROJECT_STATUSES } from "@/lib/db/types";

// Overview. Loading it also expires overdue offers (no cron in the MVP).
export default async function AdminOverview() {
  await requireAdmin();
  await expireStaleOffers();
  const [counts, toGrade] = await Promise.all([countProjectsByStatus(), countPendingSubmissions()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Admin overview</h1>
      <Link
        href="/admin/submissions"
        className="hover:bg-muted flex max-w-xs flex-col gap-1 rounded-lg border p-3"
      >
        <span className="text-muted-foreground text-sm font-medium">Assessments to grade</span>
        <span className="text-2xl font-semibold tabular-nums">{toGrade}</span>
      </Link>
      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">Projects by status</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PROJECT_STATUSES.map((status) => (
            <Link
              key={status}
              href={`/admin/projects?status=${status}`}
              className="hover:bg-muted flex flex-col gap-2 rounded-lg border p-3"
            >
              <StatusBadge status={status} />
              <span className="text-2xl font-semibold tabular-nums">{counts[status] ?? 0}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
