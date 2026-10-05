import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { loadMetricsRows } from "@/lib/db/metrics";
import { expireStaleOffers } from "@/lib/db/offers";
import { OUTCOME_TYPES } from "@/lib/db/types";
import { formatCents, formatDateOnly } from "@/lib/format";
import { computeMetrics, type Ratio } from "@/lib/metrics/compute";
import { CATEGORY_LABELS, OUTCOME_LABELS, SOURCE_LABELS, type Source } from "@/lib/projects/labels";

const pct = (r: Ratio) => (r.pct === null ? "—" : `${Math.round(r.pct * 100)}%`);
const of = (r: Ratio) => `${r.num} of ${r.den}`;

function formatHours(h: number | null): string {
  if (h === null) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} days`;
}

export default async function MetricsPage() {
  await requireAdmin();
  // Expire overdue offers first so offer metrics count them correctly.
  await expireStaleOffers();
  const m = computeMetrics(await loadMetricsRows());

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Metrics</h1>
        <p className="text-muted-foreground text-sm">
          All-time unless noted. Each number shows what it&apos;s counting.
        </p>
      </div>

      {/* The one number the MVP is trying to move (spec section 8). */}
      <Card>
        <CardContent className="flex flex-col gap-1">
          <span className="text-muted-foreground text-sm font-medium">Repeat business</span>
          <span className="text-5xl font-semibold tracking-tight">{pct(m.repeatBusiness)}</span>
          <span className="text-muted-foreground text-sm">
            of businesses have 2+ projects ({of(m.repeatBusiness)}, cancelled projects excluded)
          </span>
        </CardContent>
      </Card>

      <Section title="Demand">
        <Tiles>
          <Tile
            label="Requests"
            value={String(m.demand.totalRequests)}
            note="all intake requests"
          />
          <Tile
            label="Request to paid"
            value={pct(m.demand.requestToPaid)}
            note={`${of(m.demand.requestToPaid)} reached paid or closed`}
          />
          <Tile
            label="Average budget"
            value={
              m.demand.averageBudgetCents === null ? "—" : formatCents(m.demand.averageBudgetCents)
            }
            note="scoped projects only"
          />
        </Tiles>
        <div className="grid gap-4 md:grid-cols-2">
          <SmallTable
            caption="Requests per week (last 8 weeks)"
            headers={["Week of", "Requests"]}
            rows={m.demand.perWeek.map((w) => [formatDateOnly(w.week), w.count])}
          />
          <SmallTable
            caption="Requests by source"
            headers={["Source", "Requests"]}
            rows={m.demand.bySource.map((s) => [
              SOURCE_LABELS[s.source as Source] ?? s.source,
              s.count,
            ])}
            empty="No requests yet"
          />
        </div>
      </Section>

      <Section title="Student supply">
        <Tiles>
          <Tile
            label="Signups"
            value={String(m.supply.signups)}
            note={`${m.supply.signupsLast30Days} in the last 30 days`}
          />
          <Tile
            label="Took an assessment"
            value={pct(m.supply.tookAssessment)}
            note={`${of(m.supply.tookAssessment)} students`}
          />
        </Tiles>
        <SmallTable
          caption="Assessment pass rate by category (graded only)"
          headers={["Category", "Passed", "Pass rate"]}
          rows={m.supply.passRateByCategory.map((c) => [
            CATEGORY_LABELS[c.category],
            of(c),
            pct(c),
          ])}
          empty="Nothing graded yet"
        />
      </Section>

      <Section title="Offers">
        <Tiles>
          <Tile
            label="Acceptance rate"
            value={pct(m.offers.acceptanceRate)}
            note={`${of(m.offers.acceptanceRate)} answered offers (accepted, declined or expired)`}
          />
          <Tile
            label="Median time to accept"
            value={formatHours(m.offers.medianHoursToAccept)}
            note="from offer sent to accepted"
          />
          <Tile
            label="Filled on first round"
            value={pct(m.offers.filledFirstRound)}
            note={`${of(m.offers.filledFirstRound)} projects with a finished first round`}
          />
        </Tiles>
      </Section>

      <Section title="Quality">
        <Tiles>
          <Tile
            label="Average rating"
            value={
              m.quality.averageRating === null ? "—" : `${m.quality.averageRating.toFixed(1)} / 5`
            }
            note={`from ${m.quality.ratingCount} business review${m.quality.ratingCount === 1 ? "" : "s"}`}
          />
          <Tile
            label="Approved without rework"
            value={pct(m.quality.approvedWithoutRework)}
            note={`${of(m.quality.approvedWithoutRework)} approved projects needed one deliverable`}
          />
          <Tile
            label="Would hire again"
            value={pct(m.quality.wouldHireAgain)}
            note={`${of(m.quality.wouldHireAgain)} reviews`}
          />
        </Tiles>
      </Section>

      <Section title="Hiring signal">
        <Tiles>
          <Tile
            label="Students with an outcome"
            value={pct(m.hiring.studentsWithOutcome)}
            note={`${of(m.hiring.studentsWithOutcome)} students who completed a project`}
          />
        </Tiles>
        <SmallTable
          caption="Outcomes recorded"
          headers={["Outcome", "Count"]}
          rows={OUTCOME_TYPES.map((t) => [OUTCOME_LABELS[t], m.hiring.outcomeCounts[t]])}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Tiles({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

/** Stat tile: label, value (proportional figures at display size), and what it counts. */
function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        <span className="text-3xl font-semibold tracking-tight">{value}</span>
        <span className="text-muted-foreground text-xs">{note}</span>
      </CardContent>
    </Card>
  );
}

function SmallTable({
  caption,
  headers,
  rows,
  empty = "No data yet",
}: {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
  empty?: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">{caption}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">{empty}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((h, i) => (
                  <TableHead key={h} className={i > 0 ? "text-right" : undefined}>
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={String(row[0])}>
                  {row.map((cell, i) => (
                    // Columns of numbers align with tabular figures.
                    <TableCell key={i} className={i > 0 ? "text-right tabular-nums" : undefined}>
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
