import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function RequestThanksPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Thanks, we got your request</h1>
      <p className="text-muted-foreground">
        We&apos;ll review it and email you within 1–2 business days to confirm the scope, price and
        timeline. Nothing is charged until you approve the scope.
      </p>
      <Link href="/" className={buttonVariants({ variant: "outline", className: "self-start" })}>
        Back to home
      </Link>
    </main>
  );
}
