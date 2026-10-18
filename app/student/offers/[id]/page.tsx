import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock, MessageSquareQuote } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { StudentProjectDetails } from "@/components/student-project-details";
import { requireStudent } from "@/lib/auth/session";
import { expireStaleOffers, getOwnOffer } from "@/lib/db/offers";
import { formatCents, formatDateTime } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/projects/labels";
import { isId } from "@/lib/validation/id";
import { RespondButtons } from "./respond-buttons";

const CLOSED_MESSAGES = {
  accepted: "You accepted this project. It's in your projects now, and we'll email you next steps.",
  withdrawn: "Another student accepted first, so this project has been filled.",
  declined: "You declined this offer.",
  expired: "This offer expired before it was accepted.",
} as const;

export default async function StudentOfferPage({ params }: PageProps<"/student/offers/[id]">) {
  const me = await requireStudent();
  const { id } = await params;
  if (!isId(id)) notFound();

  await expireStaleOffers();
  const offer = await getOwnOffer(id, me.id);
  if (!offer?.project) notFound();
  const project = offer.project;
  const pending = offer.status === "pending";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/student"
        className="text-muted-foreground hover:text-foreground -ml-1 flex w-fit items-center gap-0.5 text-sm"
      >
        <ChevronLeft className="size-4" aria-hidden /> Home
      </Link>

      {/* The offer at a glance, with the decision right here. */}
      <section className="bg-ink text-ink-foreground relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div
          className="bg-brand/30 absolute -top-16 -right-16 size-56 rounded-full blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <CategoryIcon category={project.category} tone="solid" />
            <span className="text-ink-foreground/70 text-xs font-semibold tracking-[0.14em] uppercase">
              {pending ? "Project offer" : "Offer"} · {CATEGORY_LABELS[project.category]}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
            {project.title}
          </h1>
          <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
            {project.student_pay_cents != null && (
              <div className="flex flex-col">
                <span className="text-ink-foreground/60 text-xs">You&apos;d earn</span>
                <span className="font-serif text-5xl italic">
                  {formatCents(project.student_pay_cents)}
                </span>
              </div>
            )}
            {pending && (
              <div className="text-ink-foreground/80 flex items-center gap-2 text-sm">
                <Clock className="size-4" aria-hidden />
                Respond by {formatDateTime(offer.expires_at)}
              </div>
            )}
          </div>
          {pending ? (
            <div className="flex flex-col gap-3">
              <RespondButtons offerId={offer.id} />
              <p className="text-ink-foreground/60 text-xs">
                Up to 3 students got this offer. The first to accept gets the project.
              </p>
            </div>
          ) : (
            <p className="bg-ink-foreground/10 rounded-xl p-4 text-sm">
              {CLOSED_MESSAGES[offer.status as keyof typeof CLOSED_MESSAGES]}
            </p>
          )}
        </div>
      </section>

      {offer.admin_note && (
        <section className="bg-cream flex gap-3 rounded-2xl border p-5">
          <MessageSquareQuote className="text-brand mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              A note for you
            </span>
            <p>{offer.admin_note}</p>
          </div>
        </section>
      )}

      <section className="bg-card flex flex-col gap-4 rounded-2xl border p-6">
        <h2 className="text-lg font-semibold">The project</h2>
        <StudentProjectDetails project={project} />
      </section>
    </div>
  );
}
