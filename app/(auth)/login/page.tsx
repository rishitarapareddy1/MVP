import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

const ERROR_MESSAGES: Record<string, string> = {
  domain: "That email isn't eligible. Students must sign in with an @illinois.edu address.",
  link: "That login link is invalid or has expired. Please request a new one.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? ERROR_MESSAGES[error] : undefined;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>
            Students: use your @illinois.edu email. We&apos;ll email you a login code.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {errorMessage && <p className="text-destructive text-sm">{errorMessage}</p>}
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
