import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { StudentProjectDetails } from "@/components/student-project-details";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/session";
import { getOwnProject, listOwnDeliverables } from "@/lib/db/delivery";
import { BUCKETS, signedUrl } from "@/lib/db/storage";
import { formatDateTime } from "@/lib/format";
import { isId } from "@/lib/validation/id";
import { DeliverForm, StartButton } from "./project-actions";

export default async function StudentProjectPage({ params }: PageProps<"/student/projects/[id]">) {
  const me = await requireStudent();
  const { id } = await params;
  if (!isId(id)) notFound();

  const project = await getOwnProject(id, me.id);
  if (!project) notFound();
  const deliverables = await listOwnDeliverables(id, me.id);
  const fileUrls = await Promise.all(
    deliverables.map((d) => (d.file_path ? signedUrl(BUCKETS.deliverables, d.file_path) : null)),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/student" className="text-muted-foreground text-sm hover:underline">
          ← Dashboard
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{project.title}</h1>
          <StatusBadge status={project.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next step</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {project.status === "assigned" && (
            <>
              <p>When you begin, let us know so we can track progress.</p>
              <StartButton projectId={project.id} />
            </>
          )}
          {project.status === "in_progress" && (
            <>
              {deliverables.length > 0 && (
                <p className="font-medium">
                  We asked for some changes. Submit your updated work below.
                </p>
              )}
              <DeliverForm projectId={project.id} studentId={me.id} />
            </>
          )}
          {project.status === "delivered" && (
            <p>Submitted. We&apos;re reviewing your work and will be in touch by email.</p>
          )}
          {project.status === "approved" && <p>Your work was approved. Payment is on its way.</p>}
          {(project.status === "paid" || project.status === "closed") && (
            <p>Done and paid. Thanks for your great work!</p>
          )}
          {project.status === "cancelled" && <p>This project was cancelled.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>The project</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentProjectDetails project={project} />
        </CardContent>
      </Card>

      {deliverables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-sm">
              {deliverables.map((d, i) => {
                const href = d.url ?? fileUrls[i];
                return (
                  <li key={d.id} className="flex flex-col gap-1">
                    <span>
                      {formatDateTime(d.submitted_at)} ·{" "}
                      {href ? (
                        <a href={href} target="_blank" rel="noreferrer" className="underline">
                          {d.url ? "link" : "file"}
                        </a>
                      ) : (
                        "file"
                      )}
                    </span>
                    {d.note && <span className="text-muted-foreground">{d.note}</span>}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
