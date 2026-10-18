"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { respond } from "./actions";

/** Accept/decline. Styled for the dark (ink) offer banner it sits on. */
export function RespondButtons({ offerId }: { offerId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function go(response: "accept" | "decline") {
    if (response === "decline" && !confirm("Decline this offer? You can't undo this.")) return;
    setError(null);
    startTransition(async () => {
      const result = await respond(offerId, response);
      // On success the page re-renders with the new status.
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <Button
          size="xl"
          disabled={pending}
          onClick={() => go("accept")}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          {pending ? "Working…" : "Accept project"}
        </Button>
        <Button
          size="xl"
          variant="outline"
          disabled={pending}
          onClick={() => go("decline")}
          className="border-ink-foreground/30 text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground bg-transparent"
        >
          Decline
        </Button>
      </div>
      {error && (
        <p className="bg-destructive/15 text-ink-foreground rounded-lg p-3 text-sm">{error}</p>
      )}
    </div>
  );
}
