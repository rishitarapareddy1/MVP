"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { respond } from "./actions";

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
        <Button size="lg" disabled={pending} onClick={() => go("accept")}>
          {pending ? "Working…" : "Accept project"}
        </Button>
        <Button size="lg" variant="outline" disabled={pending} onClick={() => go("decline")}>
          Decline
        </Button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
