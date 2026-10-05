import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFeedbackPageContext } from "@/lib/db/feedback";
import { feedbackTokenSchema } from "@/lib/validation/feedback";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = {
  title: "Project feedback",
  // Private link: keep it out of search engines.
  robots: { index: false, follow: false },
};

export default async function FeedbackPage({ params }: PageProps<"/feedback/[token]">) {
  const { token } = await params;
  // Check the token's shape before it ever reaches the database.
  if (!feedbackTokenSchema.safeParse(token).success) notFound();
  const context = await getFeedbackPageContext(token);
  if (!context) notFound();

  const studentName = context.studentFirstName ?? "your student";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">{context.businessName}</p>
        <h1 className="text-2xl font-semibold tracking-tight">How did {studentName} do?</h1>
        <p className="text-muted-foreground">
          Feedback on <span className="text-foreground font-medium">{context.title}</span>. Takes
          about a minute.
        </p>
      </div>

      {context.alreadySubmitted ? (
        <p>Feedback for this project has already been submitted. Thank you!</p>
      ) : context.status !== "paid" ? (
        <p>This feedback form isn&apos;t open yet. We&apos;ll send you the link when it is.</p>
      ) : (
        <FeedbackForm token={token} studentName={studentName} />
      )}
    </main>
  );
}
