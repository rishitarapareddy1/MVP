import { AppHeader } from "@/components/app-header";
import { requireStudent } from "@/lib/auth/session";

export default async function StudentLayout({ children }: LayoutProps<"/student">) {
  const profile = await requireStudent();

  return (
    <>
      <AppHeader homeHref="/student" label="Student" email={profile.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
