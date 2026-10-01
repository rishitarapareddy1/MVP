"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleStudentActive } from "./actions";

export function ActiveToggle({ studentId, isActive }: { studentId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant={isActive ? "destructive" : "default"}
      size="sm"
      disabled={pending}
      onClick={() => {
        if (isActive && !confirm("Deactivate this student? They won't appear in shortlists."))
          return;
        startTransition(async () => {
          await toggleStudentActive(studentId, !isActive);
        });
      }}
    >
      {isActive ? "Deactivate" : "Reactivate"}
    </Button>
  );
}
