import Link from "next/link";
import { notFound } from "next/navigation";
import { OfferStatusBadge } from "@/components/offer-status-badge";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { BUCKETS, signedUrl } from "@/lib/db/storage";
import { getStudentForAdmin } from "@/lib/db/students";
import { formatDate } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/projects/labels";
import { isId } from "@/lib/validation/id";
import { ActiveToggle } from "./active-toggle";

export default async function AdminStudentPage({ params }: PageProps<"/admin/students/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!isId(id)) notFound();
  const student = await getStudentForAdmin(id);
  if (!student) notFound();
  const resumeUrl = student.resume_path
    ? await signedUrl(BUCKETS.resumes, student.resume_path)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin/students" className="text-muted-foreground text-sm hover:underline">
          ← All students
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {student.profile?.full_name ?? "Unnamed student"}
          </h1>
          {!student.is_active && <Badge variant="destructive">Deactivated</Badge>}
          {student.is_active && !student.is_available && (
            <Badge variant="secondary">Unavailable</Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {student.profile?.email}
          {student.profile?.created_at && ` · joined ${formatDate(student.profile.created_at)}`}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            <dt className="text-muted-foreground">Major</dt>
            <dd>{student.major ?? "—"}</dd>
            <dt className="text-muted-foreground">Graduates</dt>
            <dd>{student.graduation_year ?? "—"}</dd>
            <dt className="text-muted-foreground">Hours/week</dt>
            <dd>{student.hours_per_week ?? "—"}</dd>
            <dt className="text-muted-foreground">Skills</dt>
            <dd>{student.skills.join(", ") || "—"}</dd>
            <dt className="text-muted-foreground">Interests</dt>
            <dd>
              {student.interested_categories.map((c) => CATEGORY_LABELS[c]).join(", ") || "—"}
            </dd>
            <dt className="text-muted-foreground">Links</dt>
            <dd className="flex flex-col">
              {student.portfolio_links.length
                ? student.portfolio_links.map((l) => (
                    <a
                      key={l}
                      href={l}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate underline"
                    >
                      {l}
                    </a>
                  ))
                : "—"}
            </dd>
            <dt className="text-muted-foreground">Resume</dt>
            <dd>
              {resumeUrl ? (
                <a href={resumeUrl} target="_blank" rel="noreferrer" className="underline">
                  View PDF
                </a>
              ) : (
                "—"
              )}
            </dd>
          </dl>
          {student.bio && <p className="whitespace-pre-wrap">{student.bio}</p>}
          <div>
            <ActiveToggle studentId={student.id} isActive={student.is_active} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {student.submissions.length === 0 ? (
            <p className="text-muted-foreground text-sm">None yet.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {student.submissions.map((s) => (
                <li key={s.id}>
                  {s.assessment?.title} ·{" "}
                  {s.status === "submitted" ? "awaiting grading" : `${s.status} (${s.total_score})`}{" "}
                  <span className="text-muted-foreground">· {formatDate(s.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {student.projects.length === 0 ? (
              <p className="text-muted-foreground text-sm">None yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {student.projects.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/projects/${p.id}`} className="hover:underline">
                      {p.title}
                    </Link>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Offers</CardTitle>
          </CardHeader>
          <CardContent>
            {student.offers.length === 0 ? (
              <p className="text-muted-foreground text-sm">None yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {student.offers.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/projects/${o.project?.id}`} className="hover:underline">
                      {o.project?.title}
                    </Link>
                    <OfferStatusBadge status={o.status} />
                    <span className="text-muted-foreground">score {o.match_score}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
