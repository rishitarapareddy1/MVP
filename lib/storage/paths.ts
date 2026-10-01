/**
 * Server-side check that a client-supplied storage path is inside the folder
 * it should be. Rejects "../" tricks and absolute paths. Storage RLS also
 * enforces ownership; this keeps our database from storing a path that
 * points somewhere else.
 */
export function isPathInFolder(path: string, folder: string): boolean {
  if (path.includes("..") || path.startsWith("/")) return false;
  return path.startsWith(`${folder}/`) && path.length > folder.length + 1;
}
