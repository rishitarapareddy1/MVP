import Link from "next/link";
import { LoginForm } from "./login-form";

const ERROR_MESSAGES: Record<string, string> = {
  domain: "That email isn't eligible. Students must sign in with an @illinois.edu address.",
  link: "That login link is invalid or has expired. Please request a new one.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? ERROR_MESSAGES[error] : undefined;

  return (
    <main className="from-accent/50 to-background flex flex-1 items-center justify-center bg-gradient-to-b px-4 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="bg-card flex flex-col gap-5 rounded-2xl border p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold">Log in</h1>
            <p className="text-muted-foreground text-sm">
              Students: use your @illinois.edu email. We&apos;ll email you a one-time code, no
              password needed.
            </p>
          </div>
          {errorMessage && (
            <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
              {errorMessage}
            </p>
          )}
          <LoginForm />
        </div>
        <p className="text-muted-foreground text-center text-sm">
          Have a project for us?{" "}
          <Link href="/request" className="text-primary font-medium hover:underline">
            Businesses don&apos;t need an account
          </Link>
        </p>
      </div>
    </main>
  );
}
