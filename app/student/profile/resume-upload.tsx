"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { MB, uploadToStorage } from "@/lib/storage/upload";
import { removeResume, saveResume } from "./actions";

export function ResumeUpload({
  studentId,
  currentUrl,
}: {
  studentId: string;
  currentUrl: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFileChosen(file: File | undefined) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      // 1) browser -> Storage, 2) server action records the path.
      const upload = await uploadToStorage("resumes", studentId, file, 5 * MB);
      if (!upload.ok) return setError(upload.error);
      const result = await saveResume(upload.path);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      {currentUrl ? (
        <div className="flex flex-wrap items-center gap-3">
          <a href={currentUrl} target="_blank" rel="noreferrer" className="underline">
            View current resume
          </a>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await removeResume();
                if (!result.ok) setError(result.error);
              })
            }
          >
            Remove
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground">No resume uploaded. Optional, PDF up to 5 MB.</p>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="font-medium">{currentUrl ? "Replace resume" : "Upload resume"}</span>
        <input
          type="file"
          accept="application/pdf"
          disabled={pending}
          onChange={(e) => {
            onFileChosen(e.target.files?.[0]);
            e.target.value = ""; // allow choosing the same file again
          }}
          className="file:bg-muted text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5"
        />
      </label>
      {pending && <p className="text-muted-foreground">Working…</p>}
      {error && <p className="text-destructive">{error}</p>}
    </div>
  );
}
