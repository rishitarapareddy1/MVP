"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a file straight from the browser to Supabase Storage and returns
 * its path. We don't route files through our server because Vercel caps
 * request bodies at 4.5 MB. Storage policies check that `folder` belongs to
 * the user, and bucket settings enforce size and file type; the size check
 * here just gives a faster, friendlier error.
 *
 * Paths get a timestamp prefix so a new upload never overwrites (or gets
 * served a cached copy of) an older file with the same name.
 */
export async function uploadToStorage(
  bucket: string,
  folder: string,
  file: File,
  maxBytes: number,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `File is too large (max ${Math.round(maxBytes / 1024 / 1024)} MB).`,
    };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${folder}/${Date.now()}-${safeName}`;

  const { error } = await createClient()
    .storage.from(bucket)
    .upload(path, file, {
      contentType: file.type || undefined,
    });
  if (error) {
    // Storage's own messages are fairly readable ("mime type ... is not supported").
    return { ok: false, error: `Upload failed: ${error.message}` };
  }
  return { ok: true, path };
}

export const MB = 1024 * 1024;
