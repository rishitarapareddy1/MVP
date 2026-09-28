import { requireStudent } from "@/lib/auth/session";

// Placeholder dashboard (Phase 1). Offers, projects and the onboarding
// checklist arrive in Phases 3–4.
export default async function StudentDashboard() {
  const profile = await requireStudent();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">
        Welcome{profile.full_name ? `, ${profile.full_name}` : ""}
      </h1>
      <p className="text-muted-foreground">
        Your dashboard will show pending offers, active projects and your profile checklist.
      </p>
    </div>
  );
}
