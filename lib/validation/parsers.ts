// Small parsers shared by form schemas.

/** "Excel, SQL ,excel, " -> ["excel", "sql"]: lowercase, trimmed, de-duplicated. */
export function parseSkillTags(input: string): string[] {
  const tags = input
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, " "))
    .filter(Boolean);
  return [...new Set(tags)];
}

/**
 * "$1,250.5" -> 125050. Returns null for blank input and NaN for garbage, so
 * the Zod schema can tell "not provided" apart from "invalid".
 */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return NaN;
  // Math.round avoids float artifacts like 19.99 * 100 = 1998.9999...
  return Math.round(Number(cleaned) * 100);
}

/** Cents -> "1250.50" for prefilling a dollar input. */
export function centsToDollarInput(cents: number | null): string {
  return cents == null ? "" : (cents / 100).toFixed(2);
}
