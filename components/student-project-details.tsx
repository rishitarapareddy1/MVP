import { formatCents, formatDateOnly } from "@/lib/format";
import type { ProjectCategory } from "@/lib/db/types";
import { CATEGORY_LABELS } from "@/lib/projects/labels";

/** Student-safe project details (from the student_projects view: no budget, no business). */
export type StudentProject = {
  title: string;
  scoped_description: string | null;
  deliverable: string | null;
  category: ProjectCategory;
  required_skills: string[];
  preferred_skills: string[];
  estimated_hours: number | null;
  student_pay_cents: number | null;
  deadline: string | null;
};

export function StudentProjectDetails({ project }: { project: StudentProject }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact
          label="You earn"
          value={project.student_pay_cents != null ? formatCents(project.student_pay_cents) : "—"}
        />
        <Fact
          label="Estimated time"
          value={project.estimated_hours ? `${project.estimated_hours} hours` : "—"}
        />
        <Fact label="Due" value={project.deadline ? formatDateOnly(project.deadline) : "—"} />
        <Fact label="Type" value={CATEGORY_LABELS[project.category]} />
      </dl>
      {project.scoped_description && (
        <section className="flex flex-col gap-1">
          <h3 className="font-medium">What you&apos;ll do</h3>
          <p className="whitespace-pre-wrap">{project.scoped_description}</p>
        </section>
      )}
      {project.deliverable && (
        <section className="flex flex-col gap-1">
          <h3 className="font-medium">What you&apos;ll hand over</h3>
          <p className="whitespace-pre-wrap">{project.deliverable}</p>
        </section>
      )}
      {project.required_skills.length > 0 && (
        <p>
          <span className="font-medium">Skills:</span> {project.required_skills.join(", ")}
          {project.preferred_skills.length > 0 &&
            ` (nice to have: ${project.preferred_skills.join(", ")})`}
        </p>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg border p-3">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
