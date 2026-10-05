import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function RequestThanksPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-5 px-4 py-20 text-center">
      <span className="bg-success-soft text-success flex size-14 items-center justify-center rounded-full">
        <CheckCircle2 className="size-7" aria-hidden />
      </span>
      <h1 className="text-3xl font-semibold">Thanks, we got your request</h1>
      <p className="text-muted-foreground">
        We&apos;ll review it and email you within 1–2 business days to confirm the scope, price and
        timeline. Nothing is agreed until you approve the scope.
      </p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Back to home
      </Link>
    </main>
  );
}
