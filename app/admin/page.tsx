import { requireAdmin } from "@/lib/auth/session";

// Placeholder overview (Phase 1). Status counts, grading queue and expiring
// offers arrive in later phases.
export default async function AdminOverview() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Admin overview</h1>
      <p className="text-muted-foreground">
        Project status counts, pending grading and expiring offers will appear here.
      </p>
    </div>
  );
}
