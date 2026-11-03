"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/types";
import { initialFormState } from "@/app/actions/types";
import { Field, FormMessage, SubmitButton } from "@/components/form";

export function FinancialsForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction] = useActionState(action, initialFormState);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={formAction} className="stack" noValidate key={state.success}>
      <FormMessage state={state} />
      <Field name="as_of_date" label="Figures as of" type="date" state={state} defaultValue={today} max={today} required hint="Saving the same date again replaces that report." />
      <div className="grid-2">
        <Field name="annual_revenue" label="Annual revenue (₹)" state={state} inputMode="decimal" />
        <Field name="monthly_operating_expenses" label="Monthly operating expenses (₹)" state={state} inputMode="decimal" />
        <Field name="cash_balance" label="Cash balance (₹)" state={state} inputMode="decimal" />
        <Field name="total_funding_received" label="Total funding received (₹)" state={state} inputMode="decimal" />
        <Field name="monthly_burn_rate" label="Monthly burn rate (₹)" state={state} inputMode="decimal" hint="How much cash you lose each month." />
      </div>
      <p className="muted">Cash runway is worked out for you: cash balance ÷ monthly burn rate.</p>
      <div className="actions">
        <SubmitButton>Save figures</SubmitButton>
      </div>
    </form>
  );
}
