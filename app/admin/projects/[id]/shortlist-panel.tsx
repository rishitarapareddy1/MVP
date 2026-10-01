"use client";

import { useState, useTransition } from "react";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BreakdownItem } from "@/lib/matching/score";
import { sendOffersAction } from "./offer-actions";

export type ShortlistRow = {
  studentId: string;
  name: string;
  email: string;
  major: string | null;
  score: number;
  breakdown: BreakdownItem[];
};

type Selection = { note: string; override: boolean };

export function ShortlistPanel({
  projectId,
  eligible,
  overrideCandidates,
  maxOffers,
}: {
  projectId: string;
  eligible: ShortlistRow[];
  overrideCandidates: ShortlistRow[];
  maxOffers: number;
}) {
  const [selected, setSelected] = useState<Map<string, Selection>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const full = selected.size >= maxOffers;

  function toggle(id: string, override: boolean) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < maxOffers) next.set(id, { note: "", override });
      return next;
    });
  }

  function setNote(id: string, note: string) {
    setSelected((prev) => new Map(prev).set(id, { ...prev.get(id)!, note }));
  }

  function send() {
    if (
      !confirm(`Send offers to ${selected.size} student(s)? The first to accept gets the project.`)
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await sendOffersAction(
        projectId,
        [...selected].map(([student_id, s]) => ({
          student_id,
          admin_note: s.note,
          override: s.override,
        })),
      );
      if (!result.ok) setError(result.error);
      else setSelected(new Map());
    });
  }

  const renderRow = (row: ShortlistRow, rank: number, override: boolean) => {
    const isSelected = selected.has(row.studentId);
    return (
      <li key={row.studentId} className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start gap-3">
          <input
            type="checkbox"
            aria-label={`Select ${row.name}`}
            checked={isSelected}
            disabled={pending || (!isSelected && full)}
            onChange={() => toggle(row.studentId, override)}
            className="mt-1 size-4"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-medium">
              {rank}. {row.name}
            </span>
            <span className="text-muted-foreground truncate text-sm">
              {row.email}
              {row.major ? ` · ${row.major}` : ""}
            </span>
          </div>
          {override && <Badge variant="outline">Needs override</Badge>}
          <span className="text-2xl font-semibold tabular-nums">{row.score}</span>
        </div>
        <details className="ml-7">
          <summary className="text-muted-foreground cursor-pointer text-sm">Why this score</summary>
          <div className="mt-2 max-w-md">
            <ScoreBreakdown items={row.breakdown} />
          </div>
        </details>
        {isSelected && (
          <Input
            className="ml-7 max-w-md"
            placeholder="Optional personal note to this student"
            value={selected.get(row.studentId)!.note}
            onChange={(e) => setNote(row.studentId, e.target.value)}
            maxLength={500}
          />
        )}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {eligible.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No eligible students yet. Students need a passed assessment in this category, be active
          and available, and have fewer than 2 active projects.
        </p>
      ) : (
        <ol className="divide-y rounded-lg border">
          {eligible.map((r, i) => renderRow(r, i + 1, false))}
        </ol>
      )}

      {overrideCandidates.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-medium">
            Students without an assessment in this category ({overrideCandidates.length})
          </summary>
          <p className="text-muted-foreground my-2 text-sm">
            Selecting one overrides the assessment requirement for this offer.
          </p>
          <ol className="divide-y rounded-lg border">
            {overrideCandidates.map((r, i) => renderRow(r, i + 1, true))}
          </ol>
        </details>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={send} disabled={pending || selected.size === 0}>
          {pending
            ? "Sending…"
            : `Send ${selected.size || ""} offer${selected.size === 1 ? "" : "s"}`}
        </Button>
        <span className="text-muted-foreground text-sm">
          {selected.size}/{maxOffers} selected · offers expire after 48 hours
        </span>
        {error && <span className="text-destructive text-sm">{error}</span>}
      </div>
    </div>
  );
}
