"use client";

import { useState, useTransition } from "react";
import { BadgeCheck } from "lucide-react";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confirmUniversityCode, sendUniversityCode } from "./verify-actions";

/**
 * Lets a student who logged in with a non-university email (e.g. Gmail)
 * prove they're a student: enter the university address, get a code there,
 * type it back. Verified students see a confirmation instead.
 */
export function UniversityEmailCard({
  verifiedEmail,
  verifiedVia,
}: {
  verifiedEmail: string | null;
  /** "login" = their login address is a university one; "code" = confirmed by code. */
  verifiedVia: "login" | "code" | null;
}) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (verifiedVia) {
    return (
      <div className="bg-success-soft text-success flex items-start gap-3 rounded-lg p-4 text-sm">
        <BadgeCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="flex flex-col">
          <span className="font-medium">Verified student</span>
          <span>
            {verifiedVia === "login"
              ? "You signed in with your university email."
              : `Confirmed ${verifiedEmail}.`}
          </span>
        </div>
      </div>
    );
  }

  function send(target: string) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await sendUniversityCode(target);
      if (!result.ok) return setError(result.error);
      setSentTo(result.data.email);
      setNotice(`We sent a 6-digit code to ${result.data.email}. It may take a minute.`);
    });
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmUniversityCode(code);
      if (!result.ok) setError(result.error);
      // On success the page re-renders as verified.
    });
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="text-muted-foreground">
        You signed in with a personal email. Confirm your university email to be matched to
        projects. We only use it to check that you&apos;re a student.
      </p>

      {!sentTo ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FormField id="university_email" label="University email">
              <Input
                id="university_email"
                type="email"
                placeholder="netid@illinois.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
              />
            </FormField>
          </div>
          <Button onClick={() => send(email)} disabled={pending || !email}>
            {pending ? "Sending…" : "Send code"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <FormField id="university_code" label="6-digit code">
                <Input
                  id="university_code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  disabled={pending}
                  autoFocus
                />
              </FormField>
            </div>
            <Button onClick={confirm} disabled={pending || code.length !== 6}>
              {pending ? "Checking…" : "Verify"}
            </Button>
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <button
              className="hover:text-foreground underline"
              disabled={pending}
              onClick={() => send(sentTo)}
            >
              Resend code
            </button>
            <button
              className="hover:text-foreground underline"
              disabled={pending}
              onClick={() => {
                setSentTo(null);
                setCode("");
                setNotice(null);
              }}
            >
              Use a different email
            </button>
          </div>
        </div>
      )}

      {notice && !error && <p className="text-muted-foreground">{notice}</p>}
      {error && <p className="text-destructive">{error}</p>}
    </div>
  );
}
