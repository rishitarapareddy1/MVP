import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ToneBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { loadStatsRows } from "@/lib/db/matching";
import { buildStudentStats } from "@/lib/matching/stats";
import { CATEGORY_LABELS } from "@/lib/projects/labels";

export default async function AdminStudentsPage() {
  await requireAdmin();
  const { rows, people } = await loadStatsRows();
  const students = buildStudentStats(rows)
    .map((s) => ({ ...s, ...people.get(s.id)! }))
    .sort((a, b) => (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Students"
        description="Everyone who has signed up, with their verified skills and track record."
      />
      {students.length === 0 ? (
        <p className="text-muted-foreground">No students yet.</p>
      ) : (
        <div className="bg-card overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Student</TableHead>
                <TableHead className="hidden xl:table-cell">Skills</TableHead>
                <TableHead>Passed assessments</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-4">
                    <Link href={`/admin/students/${s.id}`} className="font-medium hover:underline">
                      {s.full_name ?? "Unnamed"}
                    </Link>
                    <div className="text-muted-foreground text-xs">
                      {s.email}
                      {s.major ? ` · ${s.major}` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-48 truncate text-sm xl:table-cell">
                    {s.skills.join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.passedAssessments.length
                      ? s.passedAssessments
                          .map((a) => `${CATEGORY_LABELS[a.category]} (${a.score})`)
                          .join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.completedProjects}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.activeProjects}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.averageRating?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell>
                    {!s.is_active ? (
                      <ToneBadge tone="neutral">Deactivated</ToneBadge>
                    ) : !s.is_available ? (
                      <ToneBadge tone="waiting">Unavailable</ToneBadge>
                    ) : (
                      <ToneBadge tone="done">Available</ToneBadge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
