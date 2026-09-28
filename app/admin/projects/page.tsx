import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { listProjects } from "@/lib/db/projects";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/db/types";
import { formatCents, formatDate, formatDateOnly } from "@/lib/format";
import {
  BUDGET_RANGE_LABELS,
  CATEGORY_LABELS,
  STATUS_LABELS,
  type BudgetRange,
} from "@/lib/projects/labels";

function parseStatus(value: string | string[] | undefined): ProjectStatus | undefined {
  return PROJECT_STATUSES.find((s) => s === value);
}

export default async function AdminProjectsPage({ searchParams }: PageProps<"/admin/projects">) {
  await requireAdmin();
  const status = parseStatus((await searchParams).status);
  const projects = await listProjects({ status });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Projects</h1>

      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Filter by status">
        <FilterLink href="/admin/projects" active={!status} label="All" />
        {PROJECT_STATUSES.map((s) => (
          <FilterLink
            key={s}
            href={`/admin/projects?status=${s}`}
            active={status === s}
            label={STATUS_LABELS[s]}
          />
        ))}
      </nav>

      {projects.length === 0 ? (
        <p className="text-muted-foreground">
          No projects{status ? ` in ${STATUS_LABELS[status]}` : ""}.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-64 truncate font-medium">
                    <Link href={`/admin/projects/${p.id}`} className="hover:underline">
                      {p.title}
                    </Link>
                  </TableCell>
                  <TableCell>{p.business?.name}</TableCell>
                  <TableCell>{CATEGORY_LABELS[p.category]}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {/* Scoped price if set, otherwise the business's rough range. */}
                    {p.budget_cents != null ? (
                      formatCents(p.budget_cents)
                    ) : p.budget_range ? (
                      <span className="text-muted-foreground">
                        {BUDGET_RANGE_LABELS[p.budget_range as BudgetRange]}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{p.deadline ? formatDateOnly(p.deadline) : "—"}</TableCell>
                  <TableCell>{formatDate(p.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "bg-primary text-primary-foreground rounded-full px-3 py-1"
          : "hover:bg-muted rounded-full border px-3 py-1"
      }
    >
      {label}
    </Link>
  );
}
