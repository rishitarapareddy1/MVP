import type { BreakdownItem } from "@/lib/matching/score";

/** The point-by-point explanation of a match score (spec: never a bare number). */
export function ScoreBreakdown({ items }: { items: BreakdownItem[] }) {
  return (
    <ul className="flex flex-col gap-0.5 text-xs">
      {items.map((item) => (
        <li key={item.label} className="flex justify-between gap-4">
          <span className="text-muted-foreground">{item.label}</span>
          <span
            className={
              item.points > 0
                ? "font-medium tabular-nums"
                : item.points < 0
                  ? "text-destructive tabular-nums"
                  : "text-muted-foreground tabular-nums"
            }
          >
            {item.points > 0 ? `+${item.points}` : item.points}
          </span>
        </li>
      ))}
    </ul>
  );
}
