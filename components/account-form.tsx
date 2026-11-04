"use client";

import { updateName } from "@/app/actions/account";
import { ActionForm, Field, SubmitButton } from "@/components/form";

export function AccountForm({ fullName }: { fullName: string | null }) {
  return (
    <ActionForm action={updateName}>
      <Field name="full_name" label="Full name" defaultValue={fullName} required autoComplete="name" />
      <div className="actions">
        <SubmitButton>Save</SubmitButton>
      </div>
    </ActionForm>
  );
}
