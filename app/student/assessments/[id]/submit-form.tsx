"use client";

import { useState, useTransition } from "react";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MB, uploadToStorage } from "@/lib/storage/upload";
import { submitAssessment } from "./actions";

const ACCEPT = ".pdf,.csv,.txt,.png,.jpg,.jpeg,.zip,.xls,.xlsx,.docx,.pptx";

export function SubmitForm({
  assessmentId,
  studentId,
}: {
  assessmentId: string;
  studentId: string;
}) {
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      let result;
      if (mode === "file") {
        if (!file) return setError("Choose a file to upload.");
        // Folder per student and assessment, so storage RLS (first folder =
        // student id) and the server's path check both apply.
        const upload = await uploadToStorage(
          "submissions",
          `${studentId}/${assessmentId}`,
          file,
          10 * MB,
        );
        if (!upload.ok) return setError(upload.error);
        result = await submitAssessment(assessmentId, { path: upload.path });
      } else {
        result = await submitAssessment(assessmentId, { url });
      }
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" role="radiogroup" aria-label="How to submit">
        <Button
          type="button"
          size="sm"
          variant={mode === "file" ? "default" : "outline"}
          aria-pressed={mode === "file"}
          onClick={() => setMode("file")}
        >
          Upload a file
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "link" ? "default" : "outline"}
          aria-pressed={mode === "link"}
          onClick={() => setMode("link")}
        >
          Share a link
        </Button>
      </div>

      {mode === "file" ? (
        <FormField
          id="submission_file"
          label="Your file"
          hint="PDF, spreadsheet, doc, image or zip, up to 10 MB"
        >
          <input
            id="submission_file"
            type="file"
            accept={ACCEPT}
            disabled={pending}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="file:bg-muted text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5"
          />
        </FormField>
      ) : (
        <FormField
          id="submission_url"
          label="Link to your work"
          hint="Make sure anyone with the link can view it (e.g. a Google Doc or Sheet)."
        >
          <Input
            id="submission_url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.google.com/…"
            disabled={pending}
          />
        </FormField>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="button" onClick={submit} disabled={pending} className="self-start">
        {pending ? "Submitting…" : "Submit for grading"}
      </Button>
      <p className="text-muted-foreground text-xs">
        You can&apos;t edit a submission after sending it. If you don&apos;t pass, you can retake
        after 30 days.
      </p>
    </div>
  );
}
