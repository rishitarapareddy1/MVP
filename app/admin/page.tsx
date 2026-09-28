import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/auth/session";
import { countProjectsByStatus } from "@/lib/db/projects";
import { PROJECT_STATUSES } from "@/lib/db/types";

// Overview. Pending grading and expiring offers are added in Phases 3–4.
export default async function AdminOverview() {
  await requireAdmin();
  const counts = await countProjectsByStatus();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Admin overview</h1>
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
