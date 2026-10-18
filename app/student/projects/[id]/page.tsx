import { notFound } from "next/navigation";
import { Check, FileText } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { StudentProjectDetails } from "@/components/student-project-details";
import { requireStudent } from "@/lib/auth/session";
import { getOwnProject, listOwnDeliverables } from "@/lib/db/delivery";
import { BUCKETS, signedUrl } from "@/lib/db/storage";
import type { ProjectStatus } from "@/lib/db/types";
import { formatDateTime } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/projects/labels";
import { cn } from "@/lib/utils";
import { isId } from "@/lib/validation/id";
import { DeliverForm, StartButton } from "./project-actions";

/** The student's view of a project's lifecycle (simpler than the admin's). */
const STEPS: { label: string; statuses: ProjectStatus[] }[] = [
  { label: "Accepted", statuses: ["assigned"] },
  { label: "Working", statuses: ["in_progress"] },
  { label: "Submitted", statuses: ["delivered"] },
  { label: "Approved", statuses: ["approved"] },
  { label: "Paid", statuses: ["paid", "closed"] },
];

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
  const current = STEPS.findIndex((s) => s.statuses.includes(project.status));
  const done = project.status === "paid" || project.status === "closed";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/student", label: "Home" }}
        title={project.title}
        meta={<StatusBadge status={project.status} />}
        description={CATEGORY_LABELS[project.category]}
      />

      {current >= 0 && (
        <ol
          className="bg-card flex items-center rounded-2xl border p-4 sm:p-5"
          aria-label="Progress"
        >
          {STEPS.map((step, i) => {
            const complete = i < current || done;
            const active = i === current && !done;
            return (
              <li key={step.label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold",
                      complete && "border-ink bg-ink text-ink-foreground",
                      active && "border-brand bg-brand-soft text-brand-foreground",
                      !complete && !active && "text-muted-foreground",
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    {complete ? <Check className="size-3.5" aria-hidden /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-medium sm:text-xs",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span
                    className={cn(
                      "mx-1 mb-5 h-0.5 flex-1 rounded-full",
                      i < current || done ? "bg-ink" : "bg-border",
                    )}
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* What to do now. */}
      <section className="bg-ink text-ink-foreground flex flex-col gap-4 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <CategoryIcon category={project.category} tone="solid" />
          <span className="text-ink-foreground/70 text-xs font-semibold tracking-[0.14em] uppercase">
            Next step
          </span>
        </div>
        {project.status === "assigned" && (
          <>
            <p className="text-xl font-semibold">Start when you&apos;re ready</p>
            <p className="text-ink-foreground/75 text-sm">
              Let us know when you begin so we can track progress.
            </p>
            <StartButton projectId={project.id} />
          </>
        )}
        {project.status === "in_progress" && (
          <>
            <p className="text-xl font-semibold">
              {deliverables.length > 0 ? "Send your updated work" : "Submit your work"}
            </p>
            <p className="text-ink-foreground/75 text-sm">
              {deliverables.length > 0
                ? "We asked for some changes. Upload the new version below."
                : "Upload a file or share a link when the deliverable is ready."}
            </p>
            <div className="bg-card text-card-foreground rounded-xl p-5">
              <DeliverForm projectId={project.id} studentId={me.id} />
            </div>
          </>
        )}
        {project.status === "delivered" && (
          <p className="text-xl font-semibold">
            Submitted. We&apos;re reviewing it and will be in touch by email.
          </p>
        )}
        {project.status === "approved" && (
          <p className="text-xl font-semibold">Approved. Your payment is on its way.</p>
        )}
        {done && (
          <p className="text-xl font-semibold">
            Done and paid. <span className="font-serif font-normal italic">Great work.</span>
          </p>
        )}
        {project.status === "cancelled" && (
          <p className="text-xl font-semibold">This project was cancelled.</p>
        )}
      </section>

      <section className="bg-card flex flex-col gap-4 rounded-2xl border p-6">
        <h2 className="text-lg font-semibold">The project</h2>
        <StudentProjectDetails project={project} />
      </section>

      {deliverables.length > 0 && (
        <section className="bg-card flex flex-col gap-3 rounded-2xl border p-6">
          <h2 className="text-lg font-semibold">Your submissions</h2>
          <ul className="flex flex-col gap-3">
            {deliverables.map((d, i) => {
              const href = d.url ?? fileUrls[i];
              return (
                <li key={d.id} className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                  <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span>
                      {formatDateTime(d.submitted_at)} ·{" "}
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary font-medium hover:underline"
                        >
                          {d.url ? "Open link" : "Download file"}
                        </a>
                      ) : (
                        "file"
                      )}
                    </span>
                    {d.note && <span className="text-muted-foreground">{d.note}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
