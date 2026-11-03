"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/account";
import { initialFormState } from "@/app/actions/types";
import { Field, FormMessage, SubmitButton } from "@/components/form";

export function AccountForm({ fullName, phone }: { fullName: string | null; phone: string | null }) {
  const [state, action] = useActionState(updateProfile, initialFormState);
  return (
    <form action={action} className="stack" noValidate>
      <FormMessage state={state} />
      <Field name="full_name" label="Full name" state={state} defaultValue={fullName} required autoComplete="name" />
      <Field name="phone" label="Phone" type="tel" state={state} defaultValue={phone} autoComplete="tel" />
      <div className="actions">
        <SubmitButton>Save</SubmitButton>
      </div>
    </form>
  );
}
