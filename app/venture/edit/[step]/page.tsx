import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { saveBasics, saveFounderDetails, saveProblem, saveSupport, saveTraction } from "@/app/actions/venture";
import { ActionForm, Checkbox, CheckboxGroup, Field, Select, TextArea } from "@/components/form";
import { StepActions } from "@/components/venture/step-actions";
import { Stepper } from "@/components/venture/stepper";
import { requireUser } from "@/lib/auth";
import { DISTRICTS, LEGAL_STATUSES, OFFERING_TYPES, TRACTION_LEVELS } from "@/lib/options";
import { loadTaxonomy, toOptions } from "@/lib/taxonomy";
import { loadVenture } from "@/lib/venture";
import { STEP_TITLES, STEPS, type Step } from "@/lib/venture-steps";

export const metadata: Metadata = { title: "Edit venture profile" };

const districtOptions = DISTRICTS.map((d) => ({ value: d, label: d }));

export default async function EditStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step: raw } = await params;
  if (!STEPS.includes(raw as Step)) notFound();
  const step = raw as Step;

  const { supabase, user } = await requireUser(`/venture/edit/${step}`);
  const [{ profile, founder, startup, stepDone }, taxonomy] = await Promise.all([loadVenture(supabase, user.id), loadTaxonomy(supabase)]);
  if (!startup && step !== "founder" && step !== "basics") redirect("/venture/edit/basics");

  const index = STEPS.indexOf(step);

  return (
    <>
      <p className="breadcrumbs">
        <Link href="/venture">Venture profile</Link>
      </p>
      <h1>
        Step {index + 1} of {STEPS.length}: {STEP_TITLES[step]}
      </h1>
      <Stepper current={step} done={stepDone} hasStartup={Boolean(startup)} />

      <div className="narrow">
        {step === "founder" ? (
          <ActionForm action={saveFounderDetails}>
            <p className="muted">Your email is {user.email}. Centres never see your email or phone unless you choose to share them below.</p>
            <Field name="full_name" label="Full name" required autoComplete="name" defaultValue={profile?.full_name} />
            <div className="grid-2">
              <Field name="phone" label="Phone" type="tel" autoComplete="tel" inputMode="tel" defaultValue={founder?.phone} required />
              <Select name="district" label="District" options={districtOptions} defaultValue={founder?.district} required />
            </div>
            <Field name="city" label="City or town" defaultValue={founder?.city} />
            <fieldset>
              <legend>Declarations</legend>
              <Checkbox
                name="domicile_declared"
                label="I declare that I am domiciled in Jammu (the Jammu division of Jammu and Kashmir)."
                hint="Self-declared. No documents are checked on UdyamSetu."
                defaultChecked={founder?.domicile_declared}
              />
              <Checkbox
                name="consent_given"
                label="I agree that incubation centres on UdyamSetu can see my venture profile."
                defaultChecked={founder?.consent_given}
              />
              <Checkbox
                name="share_contact_with_centres"
                label="Share my email and phone with centres."
                hint="Off by default. If off, centres can only reach you through UdyamSetu messages."
                defaultChecked={founder?.share_contact_with_centres}
              />
            </fieldset>
            <StepActions />
          </ActionForm>
        ) : null}

        {step === "basics" ? (
          <ActionForm action={saveBasics}>
            <Field name="name" label="Startup name" required defaultValue={startup?.name} />
            <TextArea name="description" label="Short description" required rows={3} hint="One or two sentences, up to 500 characters." defaultValue={startup?.description} />
            <div className="grid-2">
              <Select
                name="stage_id"
                label="Stage"
                required
                options={taxonomy.stages.map((s) => ({ value: String(s.id), label: s.name }))}
                defaultValue={startup?.stage_id}
                hint={taxonomy.stages.map((s) => `${s.name}: ${s.description ?? ""}`).join(" ")}
              />
              <Field name="founding_year" label="Year founded" inputMode="numeric" defaultValue={startup?.founding_year} />
            </div>
            <CheckboxGroup
              name="sector_ids"
              legend="Sectors"
              required
              hint="Choose up to 5."
              options={toOptions(taxonomy.sectors).map(({ value, label }) => ({ value, label }))}
              defaultValues={startup?.startup_sectors.map((s) => String(s.sector_id)) ?? []}
            />
            <div className="grid-2">
              <Select name="district" label="Startup's district" options={districtOptions} defaultValue={startup?.district ?? founder?.district} />
              <Field name="city" label="City or town" defaultValue={startup?.city ?? founder?.city} />
            </div>
            <div className="grid-2">
              <Select name="legal_status" label="Legal status" required placeholder={null} options={LEGAL_STATUSES} defaultValue={startup?.legal_status ?? "not_registered"} />
              <Field name="registration_number" label="Registration number (CIN, LLPIN or Udyam)" defaultValue={startup?.registration_number} />
            </div>
            <Checkbox name="dpiit_recognised" label="Recognised by DPIIT as a startup" defaultChecked={startup?.dpiit_recognised} />
            <StepActions />
          </ActionForm>
        ) : null}

        {step === "problem" && startup ? (
          <ActionForm action={saveProblem}>
            <TextArea name="problem" label="What problem are you solving?" required rows={4} hint="Who has the problem, and how do they deal with it today?" defaultValue={startup.problem} />
            <TextArea name="solution" label="Your solution" required rows={4} hint="What you offer and why it's better." defaultValue={startup.solution} />
            <TextArea name="target_customers" label="Target customers" required rows={3} defaultValue={startup.target_customers} />
            <div className="grid-2">
              <Select name="offering_type" label="You offer a" options={OFFERING_TYPES} defaultValue={startup.offering_type} />
              <Field name="domain" label="Domain or niche" placeholder="For example: cold chain" defaultValue={startup.domain} />
            </div>
            <StepActions />
          </ActionForm>
        ) : null}

        {step === "traction" && startup ? (
          <ActionForm action={saveTraction}>
            <p className="muted">Everything on this step is optional. Revenue and funding figures go in the private Financials section.</p>
            <Select name="traction_level" label="Where are you today?" options={TRACTION_LEVELS} defaultValue={startup.traction_level} />
            <TextArea name="traction_summary" label="Traction so far" rows={3} hint="Users, pilots, customers, partnerships or awards." defaultValue={startup.traction_summary} />
            <Field name="website" label="Website" type="url" placeholder="https://" defaultValue={startup.website} />
            <Field name="pitch_deck_url" label="Pitch deck link" type="url" placeholder="https://" hint="A shareable link, for example from Google Drive." defaultValue={startup.pitch_deck_url} />
            <Field name="demo_url" label="Demo or video link" type="url" placeholder="https://" defaultValue={startup.demo_url} />
            <StepActions />
          </ActionForm>
        ) : null}

        {step === "support" && startup ? (
          <ActionForm action={saveSupport}>
            <CheckboxGroup
              name="support_need_ids"
              legend="What support do you need?"
              required
              hint="We use this to recommend centres that offer it."
              options={toOptions(taxonomy.needs)}
              defaultValues={startup.startup_support_needs.map((s) => String(s.support_need_id))}
            />
            <StepActions last />
          </ActionForm>
        ) : null}
      </div>
    </>
  );
}
