import "server-only";
import { createClient } from "@/lib/supabase/server";

export const BUCKETS = {
  resumes: "resumes",
  submissions: "submissions",
  assessmentResources: "assessment-resources",
  deliverables: "deliverables",
} as const;
export type Bucket = (typeof BUCKETS)[keyof typeof BUCKETS];

/**
 * A short-lived download link. Runs as the logged-in user, so storage RLS
 * decides whether they may read the file; returns null if not (or missing).
 */
export async function signedUrl(bucket: Bucket, path: string, seconds = 300) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, seconds);
  return error ? null : data.signedUrl;
}

/**
 * Files are uploaded from the browser, then the path is sent to a server
 * action. Before saving that path we check the file is really there (and
 * readable by this user), so a forged request can't point at nothing.
 */
export async function fileExists(bucket: Bucket, path: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(bucket).exists(path);
  return !error && data;
}

export async function removeFile(bucket: Bucket, path: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
