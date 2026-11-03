"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/types";
import { initialFormState } from "@/app/actions/types";
import { Checkbox, Field, FormMessage, SubmitButton } from "@/components/form";

export function MemberForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction] = useActionState(action, initialFormState);
  return (
    <form action={formAction} className="stack" noValidate key={state.success}>
      <FormMessage state={state} />
      <div className="grid-2">
        <Field name="full_name" label="Name" state={state} required />
        <Field name="role_title" label="Role" state={state} placeholder="e.g. CTO, Sales lead" />
      </div>
      <div className="grid-2">
        <Field name="email" label="Email" type="email" state={state} />
        <Field name="linkedin_url" label="LinkedIn profile" type="url" state={state} placeholder="https://linkedin.com/in/…" />
      </div>
      <Checkbox name="is_founder" label="This person is a founder or co-founder" state={state} />
      <div className="actions">
        <SubmitButton pendingText="Adding…">Add to team</SubmitButton>
      </div>
    </form>
  );
}
