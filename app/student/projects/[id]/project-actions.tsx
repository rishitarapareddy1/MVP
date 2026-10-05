"use client";

import { useState, useTransition } from "react";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MB, uploadToStorage } from "@/lib/storage/upload";
import { deliver, markStarted } from "./actions";

export function StartButton({ projectId }: { projectId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <Button
        className="self-start"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await markStarted(projectId);
            if (!result.ok) setError(result.error);
          })
        }
      >
        {pending ? "Starting…" : "I've started working on this"}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}

export function DeliverForm({ projectId, studentId }: { projectId: string; studentId: string }) {
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!confirm("Submit this as your final deliverable?")) return;
    setError(null);
    startTransition(async () => {
      let result;
      if (mode === "file") {
        if (!file) return setError("Choose a file to upload.");
        // Folder = student id / project id, which the storage policy checks.
        const upload = await uploadToStorage(
          "deliverables",
          `${studentId}/${projectId}`,
          file,
          25 * MB,
        );
        if (!upload.ok) return setError(upload.error);
        result = await deliver(projectId, { path: upload.path, note });
      } else {
        result = await deliver(projectId, { url, note });
      }
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
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
        <FormField id="deliverable_file" label="Your file" hint="Up to 25 MB">
          <input
            id="deliverable_file"
            type="file"
            disabled={pending}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="file:bg-muted text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5"
          />
        </FormField>
      ) : (
        <FormField
          id="deliverable_url"
          label="Link to your work"
          hint="Make sure anyone with the link can view it."
        >
          <Input
            id="deliverable_url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.google.com/…"
            disabled={pending}
          />
        </FormField>
      )}
      <FormField id="deliverable_note" label="Note (optional)" hint="Anything we should know?">
        <Textarea
          id="deliverable_note"
          rows={3}
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={pending}
        />
      </FormField>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button className="self-start" onClick={submit} disabled={pending}>
        {pending ? "Submitting…" : "Submit deliverable"}
      </Button>
    </div>
  );
}
