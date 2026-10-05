import { StudentShell } from "@/components/shell/student-shell";
import { requireStudent } from "@/lib/auth/session";

export default async function StudentLayout({ children }: LayoutProps<"/student">) {
  const profile = await requireStudent();
  return <StudentShell email={profile.email}>{children}</StudentShell>;
}
