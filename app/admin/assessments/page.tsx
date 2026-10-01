import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { listAllAssessments } from "@/lib/db/assessments";
import { CATEGORY_LABELS } from "@/lib/projects/labels";

export default async function AdminAssessmentsPage() {
  await requireAdmin();
  const assessments = await listAllAssessments();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Assessments</h1>
        <Link href="/admin/assessments/new" className={buttonVariants()}>
          New assessment
        </Link>
      </div>

      {assessments.length === 0 ? (
        <p className="text-muted-foreground">No assessments yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Pass mark</TableHead>
                <TableHead className="text-right">Passed</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="text-right">To grade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((a) => {
                const count = (s: string) => a.submissions.filter((x) => x.status === s).length;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/assessments/${a.id}`} className="hover:underline">
                        {a.title}
                      </Link>
                    </TableCell>
                    <TableCell>{CATEGORY_LABELS[a.category]}</TableCell>
                    <TableCell className="text-right tabular-nums">{a.pass_threshold}</TableCell>
                    <TableCell className="text-right tabular-nums">{count("passed")}</TableCell>
                    <TableCell className="text-right tabular-nums">{count("failed")}</TableCell>
                    <TableCell className="text-right tabular-nums">{count("submitted")}</TableCell>
                    <TableCell>
                      {a.is_active ? (
                        <Badge variant="outline">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
