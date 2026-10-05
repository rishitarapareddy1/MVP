import { AdminShell } from "@/components/shell/admin-shell";
import { requireAdmin } from "@/lib/auth/session";
import { loadInbox } from "@/lib/db/inbox";
import { expireStaleOffers } from "@/lib/db/offers";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const profile = await requireAdmin();
  // Expire overdue offers first so the to-do counts are accurate.
  await expireStaleOffers();
  const inbox = await loadInbox();

  return (
    <AdminShell email={profile.email} todayCount={inbox.count} gradingCount={inbox.toGrade.length}>
      {children}
    </AdminShell>
  );
}
