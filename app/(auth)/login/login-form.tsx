"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendLoginCode, verifyLoginCode } from "./actions";

/**
 * Two steps: enter email -> enter the code we emailed. Codes (not links) are
 * used because university mail scanners open links and use them up.
 */
export function LoginForm() {
  const [sendState, sendAction, sending] = useActionState(sendLoginCode, null);
  // "Use a different email" dismisses the current result to go back to step 1.
  // Each new send returns a new object, so a fresh success shows step 2 again.
  const [dismissed, setDismissed] = useState<typeof sendState>(null);

  if (sendState?.ok && sendState !== dismissed) {
    return <CodeStep email={sendState.data.email} onChangeEmail={() => setDismissed(sendState)} />;
  }

  return (
    <form action={sendAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="netid@illinois.edu"
          defaultValue={sendState?.ok ? sendState.data.email : undefined}
          required
          aria-invalid={sendState?.ok === false || undefined}
        />
      </div>
      {sendState?.ok === false && <p className="text-destructive text-sm">{sendState.error}</p>}
      <Button type="submit" disabled={sending}>
        {sending ? "Sending…" : "Email me a login code"}
      </Button>
    </form>
  );
}

function CodeStep({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  const [state, action, verifying] = useActionState(verifyLoginCode, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm">
        We sent a code to <span className="font-medium">{email}</span>. It may take a minute to
        arrive.
      </p>
      <input type="hidden" name="email" value={email} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Login code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={10}
          required
          autoFocus
          aria-invalid={state?.ok === false || undefined}
        />
      </div>
      {state?.ok === false && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" disabled={verifying}>
        {verifying ? "Checking…" : "Log in"}
      </Button>
      <Button type="button" variant="link" onClick={onChangeEmail}>
        Use a different email
      </Button>
    </form>
  );
}
