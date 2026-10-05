import Link from "next/link";
import { FolderOpen, LayoutGrid, List } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, STATUS_TONE, TONE_CLASSES } from "@/components/status-badge";
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
import { cn } from "@/lib/utils";

type Project = Awaited<ReturnType<typeof listProjects>>[number];

/** Board columns: the active pipeline. Closed/cancelled live in the table view. */
const BOARD_COLUMNS: ProjectStatus[] = [
  "submitted",
  "scoping",
  "matching",
  "offered",
  "assigned",
  "in_progress",
  "delivered",
  "approved",
  "paid",
];

function parseStatus(value: string | string[] | undefined): ProjectStatus | undefined {
  return PROJECT_STATUSES.find((s) => s === value);
}

/** Scoped price if set, otherwise the business's rough range. */
function priceLabel(p: Project): string | null {
  if (p.budget_cents != null) return formatCents(p.budget_cents);
  if (p.budget_range) return BUDGET_RANGE_LABELS[p.budget_range as BudgetRange];
  return null;
}

export default async function AdminProjectsPage({ searchParams }: PageProps<"/admin/projects">) {
  await requireAdmin();
  const sp = await searchParams;
  const view = sp.view === "board" ? "board" : "table";
  const status = view === "table" ? parseStatus(sp.status) : undefined;
  const projects = await listProjects({ status });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projects"
        description="Every business request, from intake to close."
        actions={
          <div className="bg-muted flex rounded-lg p-0.5" role="group" aria-label="View">
            <ViewLink href="/admin/projects" active={view === "table"} icon={List} label="Table" />
            <ViewLink
              href="/admin/projects?view=board"
              active={view === "board"}
              icon={LayoutGrid}
              label="Board"
            />
          </div>
        }
      />

      {view === "board" ? (
        <Board projects={projects} />
      ) : (
        <>
          <nav className="flex flex-wrap gap-1.5 text-sm" aria-label="Filter by status">
            <FilterChip href="/admin/projects" active={!status} label="All" />
            {PROJECT_STATUSES.map((s) => (
              <FilterChip
                key={s}
                href={`/admin/projects?status=${s}`}
                active={status === s}
                label={STATUS_LABELS[s]}
              />
            ))}
          </nav>
          {projects.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={
                status ? `No ${STATUS_LABELS[status].toLowerCase()} projects` : "No projects yet"
              }
              description="Requests from the public intake form show up here."
            />
          ) : (
            <ProjectTable projects={projects} />
          )}
        </>
      )}
    </div>
  );
}

function ProjectTable({ projects }: { projects: Project[] }) {
  return (
    <div className="bg-card overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="hidden sm:table-cell">Deadline</TableHead>
            <TableHead className="hidden lg:table-cell">Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((p) => (
            <TableRow key={p.id} className="group">
              <TableCell className="max-w-72 pl-4">
                <Link href={`/admin/projects/${p.id}`} className="flex flex-col">
                  <span className="truncate font-medium group-hover:underline">{p.title}</span>
                  <span className="text-muted-foreground truncate text-xs">{p.business?.name}</span>
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={p.status} />
              </TableCell>
              <TableCell className="text-muted-foreground hidden md:table-cell">
                {CATEGORY_LABELS[p.category]}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {priceLabel(p) ?? <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {p.deadline ? formatDateOnly(p.deadline) : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground hidden lg:table-cell">
                {formatDate(p.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Kanban-style pipeline: one column per active status, scrolls sideways. */
function Board({ projects }: { projects: Project[] }) {
  const finished = projects.filter((p) => p.status === "closed" || p.status === "cancelled");
  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8">
        <div className="flex min-w-max gap-3">
          {BOARD_COLUMNS.map((status) => {
            const items = projects.filter((p) => p.status === status);
            return (
              <section key={status} className="bg-muted/60 flex w-64 flex-col gap-2 rounded-xl p-2">
                <header className="flex items-center justify-between px-1.5 py-1">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      TONE_CLASSES[STATUS_TONE[status]],
                    )}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="text-muted-foreground text-xs">{items.length}</span>
                </header>
                {items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/projects/${p.id}`}
                    className="bg-card hover:border-primary/40 flex flex-col gap-1.5 rounded-lg border p-3 shadow-xs transition-colors"
                  >
                    <span className="line-clamp-2 text-sm font-medium">{p.title}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {p.business?.name}
                    </span>
                    <span className="text-muted-foreground flex justify-between text-xs">
                      <span>{p.deadline ? `due ${formatDateOnly(p.deadline)}` : ""}</span>
                      <span className="text-foreground font-medium">{priceLabel(p)}</span>
                    </span>
                  </Link>
                ))}
                {items.length === 0 && (
                  <p className="text-muted-foreground px-2 py-3 text-center text-xs">Empty</p>
                )}
              </section>
            );
          })}
        </div>
      </div>
      {finished.length > 0 && (
        <p className="text-muted-foreground text-sm">
          {finished.length} closed or cancelled project{finished.length === 1 ? "" : "s"} not shown.{" "}
          <Link href="/admin/projects?status=closed" className="text-primary hover:underline">
            View in table
          </Link>
        </p>
      )}
    </div>
  );
}

function ViewLink({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: typeof List;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium",
        active
          ? "bg-card text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </Link>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
