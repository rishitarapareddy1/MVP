"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emailFeedbackLink } from "./feedback-actions";

export function FeedbackEmailButton({
  projectId,
  contactEmail,
  sentAt,
}: {
  projectId: string;
  contactEmail: string;
  /** When the link was last emailed, if ever (already formatted). */
  sentAt: string | null;
}) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    if (sentAt && !confirm(`The link was already emailed (${sentAt}). Send it again?`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await emailFeedbackLink(projectId);
      setMessage(
        result.ok
          ? { ok: true, text: `Sent to ${result.data.to}.` }
          : { ok: false, text: result.error },
      );
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={send} disabled={pending} variant={sentAt ? "outline" : "default"}>
          <Mail className="size-4" aria-hidden />
          {pending ? "Sending…" : sentAt ? "Send again" : `Email link to ${contactEmail}`}
        </Button>
        {sentAt && !message && (
          <span className="text-muted-foreground text-xs">Last sent {sentAt}</span>
        )}
      </div>
      {message && (
        <p className={message.ok ? "text-success text-sm" : "text-destructive text-sm"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
