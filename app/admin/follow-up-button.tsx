"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markFollowedUpAction } from "./follow-up-actions";

export function FollowUpButton({ feedbackId }: { feedbackId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(async () => void (await markFollowedUpAction(feedbackId)))}
    >
      Mark followed up
    </Button>
  );
}
