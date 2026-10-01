import { AppHeader } from "@/components/app-header";
import { requireStudent } from "@/lib/auth/session";

const NAV = [
  { href: "/student/profile", label: "Profile" },
  { href: "/student/assessments", label: "Assessments" },
];

export default async function StudentLayout({ children }: LayoutProps<"/student">) {
  const profile = await requireStudent();

  return (
    <>
      <AppHeader homeHref="/student" label="Student" email={profile.email} nav={NAV} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
