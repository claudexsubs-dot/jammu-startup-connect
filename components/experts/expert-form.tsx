import type { FormState } from "@/app/actions/types";
import { ActionForm, Checkbox, Field, RadioGroup, SubmitButton, TextArea } from "@/components/form";
import { ENGAGEMENT_POLICIES } from "@/lib/options";
import type { Row } from "@/lib/types";

type Expert = Pick<
  Row<"center_experts">,
  | "full_name"
  | "headline"
  | "organization"
  | "bio"
  | "expertise_tags"
  | "engagement_policy"
  | "is_paid"
  | "fee_inr"
  | "session_minutes"
  | "offers_online"
  | "offers_in_person"
  | "in_person_location"
>;

// Profile, policy, format, duration and fee for a mentor or paid college expert.
export function ExpertForm({ action, expert, submitLabel = "Save profile" }: { action: (state: FormState, formData: FormData) => Promise<FormState>; expert: Expert | null; submitLabel?: string }) {
  return (
    <ActionForm action={action}>
      <fieldset className="stack">
        <legend className="h3">Profile</legend>
        <Field name="full_name" label="Full name" defaultValue={expert?.full_name} required />
        <Field name="headline" label="Role or title" defaultValue={expert?.headline} placeholder="Professor of Computer Science" />
        <Field name="organization" label="College or organisation" defaultValue={expert?.organization} />
        <TextArea name="bio" label="Short bio" defaultValue={expert?.bio} rows={4} hint="How they help founders." />
        <Field
          name="expertise_tags"
          label="Expertise"
          defaultValue={expert?.expertise_tags.join(", ")}
          hint="Separate with commas, for example: Pricing, FSSAI, Cloud. Up to 15."
        />
      </fieldset>
      <fieldset className="stack">
        <legend className="h3">Who they support</legend>
        <RadioGroup
          name="engagement_policy"
          legend="Engagement policy"
          options={ENGAGEMENT_POLICIES.map((p) => ({ value: p.value, label: p.label }))}
          defaultValue={expert?.engagement_policy ?? "both"}
          hint="Founders who don't match the policy see it on the profile and can't send a request."
        />
      </fieldset>
      <fieldset className="stack">
        <legend className="h3">Sessions</legend>
        <RadioGroup
          name="is_paid"
          legend="Free or paid"
          options={[
            { value: "free", label: "Free mentorship" },
            { value: "paid", label: "Paid consulting", description: "The founder pays the expert directly. UdyamSetu never handles payments." },
          ]}
          defaultValue={expert ? (expert.is_paid ? "paid" : "free") : "free"}
        />
        <Field name="fee_inr" label="Fee per session (₹)" inputMode="numeric" defaultValue={expert?.fee_inr} hint="Only for paid consulting." />
        <Field name="session_minutes" label="Session length (minutes)" type="number" min="15" max="480" step="5" defaultValue={expert?.session_minutes ?? 45} required />
        <Checkbox name="offers_online" label="Offers online sessions" defaultChecked={expert?.offers_online ?? true} />
        <Checkbox name="offers_in_person" label="Offers in-person sessions" defaultChecked={expert?.offers_in_person ?? false} />
        <Field name="in_person_location" label="In-person location" defaultValue={expert?.in_person_location} hint="Required for in-person sessions, for example: Room 12, Main Building." />
      </fieldset>
      <div className="actions">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  );
}
