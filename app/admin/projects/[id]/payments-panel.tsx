"use client";

import { useActionState, useTransition } from "react";
import { FormField, submitWithoutReset } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { formatCents, formatDate } from "@/lib/format";
import {
  PAYMENT_DIRECTION_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/projects/labels";
import { centsToDollarInput } from "@/lib/validation/parsers";
import { deletePaymentAction, recordPaymentAction } from "./payment-actions";

type Payment = {
  id: string;
  direction: string;
  amount_cents: number;
  method: string;
  paid_at: string;
  reference: string | null;
};

export function PaymentsPanel({
  projectId,
  payments,
  budgetCents,
  studentPayCents,
  today,
}: {
  projectId: string;
  payments: Payment[];
  budgetCents: number | null;
  studentPayCents: number | null;
  today: string;
}) {
  const [state, action, pending] = useActionState(recordPaymentAction.bind(null, projectId), null);
  const [deleting, startDelete] = useTransition();
  const errors = state?.ok === false ? (state.fieldErrors ?? {}) : {};
  const has = (d: string) => payments.some((p) => p.direction === d);
  const bothRecorded = has("business_to_us") && has("us_to_student");
  // Default the form to whichever payment is still missing.
  const nextDirection = has("business_to_us") ? "us_to_student" : "business_to_us";
  const expected = nextDirection === "business_to_us" ? budgetCents : studentPayCents;

  return (
    <div className="flex flex-col gap-5 text-sm">
      {payments.length === 0 ? (
        <p className="text-muted-foreground">No payments recorded yet.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {payments.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <span className="font-medium">
                {PAYMENT_DIRECTION_LABELS[p.direction as keyof typeof PAYMENT_DIRECTION_LABELS]}
              </span>
              <span className="tabular-nums">{formatCents(p.amount_cents)}</span>
              <span className="text-muted-foreground">
                {PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ?? p.method} ·{" "}
                {formatDate(p.paid_at)}
                {p.reference ? ` · ${p.reference}` : ""}
              </span>
              <Button
                variant="ghost"
                size="xs"
                disabled={deleting}
                onClick={() => {
                  if (!confirm("Delete this payment record?")) return;
                  startDelete(async () => {
                    await deletePaymentAction(projectId, p.id);
                  });
                }}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* key: after a save, remount so the defaults switch to the next missing payment.
          Once both payments exist the form tucks away behind a disclosure. */}
      <details key={`d${payments.length}`} open={!bothRecorded} className="group">
        <summary
          className={
            bothRecorded
              ? "text-primary w-fit cursor-pointer text-sm font-medium hover:underline"
              : "hidden"
          }
        >
          Record another payment
        </summary>
        <form
          key={payments.length}
          onSubmit={submitWithoutReset(action)}
          className={`flex flex-col gap-4 rounded-lg border p-4 ${bothRecorded ? "mt-3" : ""}`}
          noValidate
        >
          <span className="font-medium">Record a payment</span>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="direction" label="Direction" error={errors.direction}>
              <NativeSelect id="direction" name="direction" defaultValue={nextDirection}>
                <option value="business_to_us">{PAYMENT_DIRECTION_LABELS.business_to_us}</option>
                <option value="us_to_student">{PAYMENT_DIRECTION_LABELS.us_to_student}</option>
              </NativeSelect>
            </FormField>
            <FormField id="amount_cents" label="Amount ($)" error={errors.amount_cents}>
              <Input
                id="amount_cents"
                name="amount_cents"
                inputMode="decimal"
                defaultValue={centsToDollarInput(expected)}
                aria-invalid={errors.amount_cents ? true : undefined}
              />
            </FormField>
            <FormField id="method" label="Method" error={errors.method}>
              <NativeSelect id="method" name="method" defaultValue="zelle">
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField id="paid_at" label="Date paid" error={errors.paid_at}>
              <Input id="paid_at" name="paid_at" type="date" max={today} defaultValue={today} />
            </FormField>
            <FormField
              id="reference"
              label="Reference"
              hint="Optional, e.g. invoice #"
              error={errors.reference}
            >
              <Input id="reference" name="reference" />
            </FormField>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Record payment"}
            </Button>
            {state?.ok === false && <span className="text-destructive">{state.error}</span>}
          </div>
        </form>
      </details>
    </div>
  );
}
