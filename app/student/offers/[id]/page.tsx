import Link from "next/link";
import { notFound } from "next/navigation";
import { StudentProjectDetails } from "@/components/student-project-details";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/session";
import { expireStaleOffers, getOwnOffer } from "@/lib/db/offers";
import { formatDateTime } from "@/lib/format";
import { isId } from "@/lib/validation/id";
import { RespondButtons } from "./respond-buttons";

export default async function StudentOfferPage({ params }: PageProps<"/student/offers/[id]">) {
  const me = await requireStudent();
  const { id } = await params;
  if (!isId(id)) notFound();

  await expireStaleOffers();
  const offer = await getOwnOffer(id, me.id);
  if (!offer?.project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/student" className="text-muted-foreground text-sm hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-semibold">{offer.project.title}</h1>
        <p className="text-muted-foreground text-sm">
          Project offer · {formatDateTime(offer.created_at)}
        </p>
      </div>

      {offer.admin_note && (
        <Card>
          <CardContent>
            <p className="text-sm">
              <span className="font-medium">A note for you: </span>
              {offer.admin_note}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>The project</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentProjectDetails project={offer.project} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3">
          {offer.status === "pending" && (
            <>
              <p className="text-sm">
                Up to 3 students received this offer, and the first to accept gets the project. This
                offer expires {formatDateTime(offer.expires_at)}.
              </p>
              <RespondButtons offerId={offer.id} />
            </>
          )}
          {offer.status === "accepted" && (
            <p className="text-sm font-medium">
              You accepted this project. It&apos;s now in your active projects. We&apos;ll be in
              touch by email with next steps.
            </p>
          )}
          {offer.status === "withdrawn" && <p className="text-sm">This project has been filled.</p>}
          {offer.status === "declined" && <p className="text-sm">You declined this offer.</p>}
          {offer.status === "expired" && <p className="text-sm">This offer has expired.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
