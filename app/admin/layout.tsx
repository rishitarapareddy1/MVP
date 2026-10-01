import { AppHeader } from "@/components/app-header";
import { requireAdmin } from "@/lib/auth/session";

const NAV = [
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/assessments", label: "Assessments" },
  { href: "/admin/submissions", label: "Grading" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const profile = await requireAdmin();

  return (
    <>
      <AppHeader homeHref="/admin" label="Admin" email={profile.email} nav={NAV} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
