import { ActionForm, Checkbox, CheckboxGroup, Field, Select, SubmitButton, TextArea } from "@/components/form";
import type { FormState } from "@/app/actions/types";
import { DISTRICTS } from "@/lib/options";
import type { Taxonomy } from "@/lib/taxonomy";
import { toOptions } from "@/lib/taxonomy";
import type { Row } from "@/lib/types";

type Centre = Pick<
  Row<"incubation_centers">,
  | "name"
  | "short_description"
  | "description"
  | "host_institution"
  | "district"
  | "city"
  | "address"
  | "website"
  | "public_email"
  | "application_guidance"
  | "accepting_applications"
  | "applications_close_on"
>;

// The centre's public profile: used by centre staff and by the master admin.
export function CentreProfileForm({
  action,
  centre,
  taxonomy,
  selected,
  submitLabel = "Save centre profile",
  children,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  centre: Partial<Centre> | null;
  taxonomy: Taxonomy;
  selected: { stage_ids: number[]; sector_ids: number[]; service_ids: number[] };
  submitLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <ActionForm action={action}>
      {children}
      <fieldset className="stack">
        <legend className="h3">About the centre</legend>
        <Field name="name" label="Centre name" defaultValue={centre?.name} required />
        <Field name="short_description" label="One-line summary" defaultValue={centre?.short_description} hint="Shown on directory cards. Up to 300 characters." />
        <TextArea name="description" label="Full description" defaultValue={centre?.description} rows={5} />
        <Field name="host_institution" label="Host institution" defaultValue={centre?.host_institution} />
      </fieldset>
      <fieldset className="stack">
        <legend className="h3">Location and contact</legend>
        <Select name="district" label="District" options={DISTRICTS.map((d) => ({ value: d, label: d }))} defaultValue={centre?.district} />
        <Field name="city" label="City or town" defaultValue={centre?.city} />
        <Field name="address" label="Address" defaultValue={centre?.address} />
        <Field name="website" label="Website" type="url" defaultValue={centre?.website} placeholder="https://" />
        <Field name="public_email" label="Public contact email" type="email" defaultValue={centre?.public_email} hint="Shown on the public page. Leave blank to receive messages only through UdyamSetu." />
      </fieldset>
      <fieldset className="stack">
        <legend className="h3">What the centre supports</legend>
        <CheckboxGroup name="stage_ids" legend="Startup stages" options={toOptions(taxonomy.stages)} defaultValues={selected.stage_ids.map(String)} />
        <CheckboxGroup name="sector_ids" legend="Sector expertise" options={toOptions(taxonomy.sectors).map((o) => ({ ...o, description: null }))} defaultValues={selected.sector_ids.map(String)} />
        <CheckboxGroup name="service_ids" legend="Support offered" options={toOptions(taxonomy.needs)} defaultValues={selected.service_ids.map(String)} />
      </fieldset>
      <fieldset className="stack">
        <legend className="h3">Applications</legend>
        <Checkbox name="accepting_applications" label="Accepting applications now" defaultChecked={centre?.accepting_applications ?? true} />
        <Field name="applications_close_on" label="Applications close on" type="date" defaultValue={centre?.applications_close_on} hint="Optional. After this date the Apply button is hidden." />
        <TextArea
          name="application_guidance"
          label="Guidance for applicants"
          defaultValue={centre?.application_guidance}
          rows={4}
          hint="What you look for and how you review. Each centre decides its own admissions."
        />
      </fieldset>
      <div className="actions sticky-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  );
}
