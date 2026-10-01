"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { MB, uploadToStorage } from "@/lib/storage/upload";
import { removeResource, saveResource } from "./actions";

export function ResourceUpload({
  assessmentId,
  currentName,
  currentUrl,
}: {
  assessmentId: string;
  currentName: string | null;
  currentUrl: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFileChosen(file: File | undefined) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const upload = await uploadToStorage("assessment-resources", assessmentId, file, 10 * MB);
      if (!upload.ok) return setError(upload.error);
      const result = await saveResource(assessmentId, upload.path);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      {currentUrl ? (
        <div className="flex flex-wrap items-center gap-3">
          <a href={currentUrl} className="underline" download>
            {currentName}
          </a>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await removeResource(assessmentId);
                if (!result.ok) setError(result.error);
              })
            }
          >
            Remove
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground">
          No starter file. Optional, e.g. a messy CSV for a cleanup task (up to 10 MB).
        </p>
      )}
      <input
        type="file"
        aria-label={currentUrl ? "Replace starter file" : "Upload starter file"}
        disabled={pending}
        onChange={(e) => {
          onFileChosen(e.target.files?.[0]);
          e.target.value = "";
        }}
        className="file:bg-muted text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5"
      />
      {pending && <p className="text-muted-foreground">Working…</p>}
      {error && <p className="text-destructive">{error}</p>}
    </div>
  );
}
