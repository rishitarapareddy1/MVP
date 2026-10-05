import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlarmClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileSearch,
  HandCoins,
  Hourglass,
  MailOpen,
  PenLine,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/auth/session";
import { loadInbox } from "@/lib/db/inbox";
import { countProjectsByStatus } from "@/lib/db/projects";
import { PROJECT_STATUSES } from "@/lib/db/types";
import { formatDate, formatDateOnly, formatDateTime } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/projects/labels";
import { cn } from "@/lib/utils";
import { FollowUpButton } from "./follow-up-button";

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Chicago",
    }).format(new Date()),
  );
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

/** "Today": everything waiting on the admin, most urgent first. */
export default async function AdminTodayPage() {
  const profile = await requireAdmin();
  const [inbox, counts] = await Promise.all([loadInbox(), countProjectsByStatus()]);
  const firstName = profile.full_name?.split(" ")[0];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`${greeting()}${firstName ? `, ${firstName}` : ""}`}
        description={
          inbox.count === 0
            ? "You're all caught up."
            : `${inbox.count} thing${inbox.count === 1 ? " needs" : "s need"} your attention.`
        }
      />

      {/* Pipeline snapshot: how many projects sit at each stage. */}
      <section aria-label="Pipeline" className="flex flex-wrap gap-2">
        {PROJECT_STATUSES.filter((s) => s !== "cancelled").map((s) => (
          <Link
            key={s}
            href={`/admin/projects?status=${s}`}
            className={cn(
              "bg-card hover:bg-accent flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
              !counts[s] && "opacity-60",
            )}
          >
            <span className="font-semibold">{counts[s] ?? 0}</span>
            <span className="text-muted-foreground">{STATUS_LABELS[s]}</span>
          </Link>
        ))}
      </section>

      {inbox.count === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up"
          description="New requests, submissions to grade and work to review will show up here."
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Group
            icon={UserPlus}
            title="New requests"
            hint="Review and start scoping"
            items={inbox.toScope}
          >
            {(p) => (
              <Row
                key={p.id}
                href={`/admin/projects/${p.id}`}
                title={p.title}
                subtitle={`${p.business?.name} · received ${formatDate(p.created_at)}`}
              />
            )}
          </Group>
          <Group
            icon={PenLine}
            title="Scoping"
            hint="Finish the scope, then match"
            items={inbox.scoping}
          >
            {(p) => (
              <Row
                key={p.id}
                href={`/admin/projects/${p.id}`}
                title={p.title}
                subtitle={p.business?.name}
              />
            )}
          </Group>
          <Group
            icon={Users}
            title="Ready to match"
            hint="Pick up to 3 students"
            items={inbox.toMatch}
          >
            {(p) => (
              <Row
                key={p.id}
                href={`/admin/projects/${p.id}?tab=matching`}
                title={p.title}
                subtitle={p.deadline ? `due ${formatDateOnly(p.deadline)}` : p.business?.name}
              />
            )}
          </Group>
          <Group
            icon={Hourglass}
            title="Offers expiring within 24h"
            hint="Consider a nudge"
            items={inbox.expiringOffers}
          >
            {(o) => (
              <Row
                key={o.id}
                href={`/admin/projects/${o.project?.id}?tab=matching`}
                title={o.project?.title ?? "Project"}
                subtitle={`${o.student?.profile?.full_name ?? "Student"} · expires ${formatDateTime(o.expires_at)}`}
              />
            )}
          </Group>
          <Group
            icon={FileSearch}
            title="Work to review"
            hint="Approve or request changes"
            items={inbox.toReview}
          >
            {(p) => (
              <Row
                key={p.id}
                href={`/admin/projects/${p.id}?tab=delivery`}
                title={p.title}
                subtitle={`delivered ${formatDate(p.updated_at)}`}
              />
            )}
          </Group>
          <Group
            icon={AlarmClock}
            title="Past deadline"
            hint="Check in with the student"
            items={inbox.overdue}
          >
            {(p) => (
              <Row
                key={p.id}
                href={`/admin/projects/${p.id}?tab=delivery`}
                title={p.title}
                subtitle={p.deadline ? `was due ${formatDateOnly(p.deadline)}` : undefined}
                badge={<StatusBadge status={p.status} />}
              />
            )}
          </Group>
          <Group
            icon={HandCoins}
            title="Record payments"
            hint="Then mark as Paid"
            items={inbox.toRecordPayment}
          >
            {(p) => (
              <Row
                key={p.id}
                href={`/admin/projects/${p.id}?tab=delivery`}
                title={p.title}
                subtitle={p.business?.name}
              />
            )}
          </Group>
          <Group
            icon={MailOpen}
            title="Send feedback link"
            hint="Closes the project"
            items={inbox.toSendFeedback}
          >
            {(p) => (
              <Row
                key={p.id}
                href={`/admin/projects/${p.id}?tab=delivery`}
                title={p.title}
                subtitle={p.business?.name}
              />
            )}
          </Group>
          <Group
            icon={ClipboardCheck}
            title="Assessments to grade"
            hint="Oldest first"
            items={inbox.toGrade}
          >
            {(s) => (
              <Row
                key={s.id}
                href="/admin/submissions"
                title={s.assessment?.title ?? "Assessment"}
                subtitle={`${s.student?.profile?.full_name ?? s.student?.profile?.email} · ${formatDate(s.created_at)}`}
              />
            )}
          </Group>
          <Group
            icon={Sparkles}
            title="Hiring interest"
            hint="Follow up on these"
            items={inbox.followUps}
          >
            {(f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 flex-col text-sm">
                  <span className="truncate font-medium">
                    {f.project?.business?.name} →{" "}
                    {f.project?.student ? (
                      <Link href={`/admin/students/${f.project.student.id}`} className="underline">
                        {f.project.student.profile?.full_name ?? "their student"}
                      </Link>
                    ) : (
                      "their student"
                    )}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {f.project?.business?.contact_name} · {f.project?.business?.contact_email}
                  </span>
                </div>
                <FollowUpButton feedbackId={f.id} />
              </li>
            )}
          </Group>
        </div>
      )}
    </div>
  );
}

/** A to-do group. Renders nothing when empty, so the page only shows real work. */
function Group<T>({
  icon: Icon,
  title,
  hint,
  items,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  items: T[];
  children: (item: T) => ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <section className="bg-card flex flex-col overflow-hidden rounded-xl border">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <span className="bg-brand-soft text-brand-foreground flex size-8 items-center justify-center rounded-lg">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="flex flex-1 flex-col">
          <h2 className="text-sm font-semibold">
            {title} <span className="text-muted-foreground font-normal">· {items.length}</span>
          </h2>
          <p className="text-muted-foreground text-xs">{hint}</p>
        </div>
      </header>
      <ul className="divide-y">{items.map(children)}</ul>
    </section>
  );
}

function Row({
  href,
  title,
  subtitle,
  badge,
}: {
  href: string;
  title: string;
  subtitle?: string | null;
  badge?: ReactNode;
}) {
  return (
    <li>
      <Link href={href} className="hover:bg-accent/60 flex items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{title}</span>
          {subtitle && <span className="text-muted-foreground truncate text-xs">{subtitle}</span>}
        </div>
        {badge}
        <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
      </Link>
    </li>
  );
}
