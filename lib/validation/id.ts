import { z } from "zod";

/**
 * A database id. Uses z.guid() rather than z.uuid(): z.uuid() only accepts
 * RFC 4122 version/variant digits, but Postgres's uuid type (and our
 * readable seed ids like a5500000-0000-0000-0000-000000000001) don't follow
 * them. z.guid() checks the same 8-4-4-4-12 hex shape Postgres does.
 */
export const idSchema = z.guid();

export function isId(value: unknown): value is string {
  return idSchema.safeParse(value).success;
}
