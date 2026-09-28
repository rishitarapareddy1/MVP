import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function AppHeader({
  homeHref,
  label,
  email,
}: {
  homeHref: string;
  label: string;
  email: string;
}) {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href={homeHref} className="font-semibold">
          {label}
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground hidden sm:inline">{email}</span>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
