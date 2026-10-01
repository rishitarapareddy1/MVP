import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
      <h1 className="text-2xl font-semibold">Students</h1>
      {students.length === 0 ? (
        <p className="text-muted-foreground">No students yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Passed assessments</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Avg rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={`/admin/students/${s.id}`} className="font-medium hover:underline">
                      {s.full_name ?? "Unnamed"}
                    </Link>
                    <div className="text-muted-foreground text-xs">
                      {s.email}
                      {s.major ? ` · ${s.major}` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-sm">
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
                      <Badge variant="destructive">Deactivated</Badge>
                    ) : !s.is_available ? (
                      <Badge variant="secondary">Unavailable</Badge>
                    ) : (
                      <Badge variant="outline">Available</Badge>
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
