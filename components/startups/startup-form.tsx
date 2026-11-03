"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/types";
import { initialFormState } from "@/app/actions/types";
import { Checkbox, Field, FormMessage, Select, SubmitButton, TextArea } from "@/components/form";
import type { Tables } from "@/lib/database.types";
import { DISTRICTS, LEGAL_STATUSES, OFFERING_TYPES, STAGES } from "@/lib/options";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  sectors: Pick<Tables<"sectors">, "id" | "name">[];
  startup?: Tables<"startups">;
  submitLabel: string;
};

export function StartupForm({ action, sectors, startup, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);
  const year = String(new Date().getFullYear());

  return (
    <form action={formAction} className="stack" noValidate>
      <FormMessage state={state} />
      {state.fieldErrors ? (
        <p className="alert alert-error" role="alert">
          Please fix the highlighted fields.
        </p>
      ) : null}

      <fieldset>
        <legend>About the startup</legend>
        <Field name="name" label="Startup name" state={state} defaultValue={startup?.name} required />
        <TextArea name="description" label="Description" state={state} defaultValue={startup?.description} hint="What does your startup do, in a few sentences?" />
        <div className="grid-2">
          <Field name="founding_year" label="Founding year" state={state} defaultValue={startup?.founding_year} inputMode="numeric" placeholder={year} />
          <Select name="stage" label="Stage" state={state} options={STAGES} defaultValue={startup?.stage ?? "ideation"} required />
        </div>
        <div className="grid-2">
          <Select
            name="sector_id"
            label="Sector"
            state={state}
            options={sectors.map((sector) => ({ value: String(sector.id), label: sector.name }))}
            defaultValue={startup?.sector_id}
          />
          <Field name="domain" label="Domain" state={state} defaultValue={startup?.domain} hint="Your niche, e.g. organic saffron, ed-tech for schools." />
        </div>
      </fieldset>

      <fieldset>
        <legend>Product and customers</legend>
        <Select name="offering_type" label="You offer a" state={state} options={OFFERING_TYPES} defaultValue={startup?.offering_type} />
        <TextArea name="product_or_service" label="Product or service" state={state} defaultValue={startup?.product_or_service} rows={3} />
        <TextArea name="target_customers" label="Target customers" state={state} defaultValue={startup?.target_customers} rows={3} hint="Who buys or uses it?" />
      </fieldset>

      <fieldset>
        <legend>Location</legend>
        <div className="grid-2">
          <Select name="district" label="District" state={state} options={DISTRICTS.map((d) => ({ value: d, label: d }))} defaultValue={startup?.district} />
          <Field name="city" label="City or town" state={state} defaultValue={startup?.city} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Legal registration</legend>
        <div className="grid-2">
          <Select name="legal_status" label="Legal status" state={state} options={LEGAL_STATUSES} defaultValue={startup?.legal_status ?? "not_registered"} required />
          <Field name="registration_number" label="Registration number" state={state} defaultValue={startup?.registration_number} hint="CIN, LLPIN or Udyam number." />
        </div>
        <Checkbox name="dpiit_recognised" label="Recognised by DPIIT (Startup India)" state={state} defaultChecked={startup?.dpiit_recognised} />
        <Field name="website" label="Website" state={state} defaultValue={startup?.website} type="url" placeholder="https://" />
      </fieldset>

      <div className="actions">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
