"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import {
  basicsSchema,
  financialsSchema,
  founderDetailsSchema,
  memberSchema,
  problemSchema,
  supportSchema,
  toFieldErrors,
  tractionSchema,
} from "@/lib/validation";
import { STEPS, type Step } from "@/lib/venture-steps";
import { checked, formValues, multiValues, text, type FormState } from "./types";

function afterSave(step: Step, formData: FormData): FormState {
  revalidatePath("/venture", "layout");
  revalidatePath("/centres");
  if (text(formData, "intent") === "next") {
    const next = STEPS[STEPS.indexOf(step) + 1];
    redirect(next ? `/venture/edit/${next}` : "/venture?notice=saved");
  }
  return { success: "Saved as a draft. You can come back any time." };
}

async function myStartupId(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], userId: string) {
  const { data } = await supabase.from("startups").select("id").eq("owner_id", userId).maybeSingle();
  return data?.id ?? null;
}

export async function saveFounderDetails(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = founderDetailsSchema.safeParse({
    full_name: text(formData, "full_name"),
    phone: text(formData, "phone"),
    district: text(formData, "district"),
    city: text(formData, "city"),
    domicile_declared: checked(formData, "domicile_declared"),
    consent_given: checked(formData, "consent_given"),
    share_contact_with_centres: checked(formData, "share_contact_with_centres"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const { supabase, user } = await requireUser("/venture/edit/founder");
  const { full_name, ...founder } = parsed.data;
  const { error: nameError } = await supabase.from("profiles").update({ full_name }).eq("id", user.id);
  const { error } = await supabase.from("founder_profiles").upsert({ user_id: user.id, ...founder }, { onConflict: "user_id" });
  if (nameError || error) return { error: friendlyError(nameError ?? error) ?? undefined, values };
  revalidatePath("/", "layout");
  return afterSave("founder", formData);
}

export async function saveBasics(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const multi = multiValues(formData, ["sector_ids"]);
  const parsed = basicsSchema.safeParse({
    name: text(formData, "name"),
    description: text(formData, "description"),
    founding_year: text(formData, "founding_year"),
    stage_id: text(formData, "stage_id"),
    sector_ids: multi.sector_ids,
    district: text(formData, "district"),
    city: text(formData, "city"),
    legal_status: text(formData, "legal_status") || "not_registered",
    registration_number: text(formData, "registration_number"),
    dpiit_recognised: checked(formData, "dpiit_recognised"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values, multi };

  const { supabase, user } = await requireUser("/venture/edit/basics");
  const { sector_ids, ...fields } = parsed.data;
  let startupId = await myStartupId(supabase, user.id);

  if (startupId) {
    const { error } = await supabase.from("startups").update(fields).eq("id", startupId);
    if (error) return { error: friendlyError(error) ?? undefined, values, multi };
  } else {
    const { data, error } = await supabase.from("startups").insert({ ...fields, owner_id: user.id }).select("id").single();
    if (error || !data) return { error: friendlyError(error) ?? undefined, values, multi };
    startupId = data.id;
  }

  // Replace the sector list with what was ticked.
  await supabase.from("startup_sectors").delete().eq("startup_id", startupId);
  if (sector_ids.length) {
    const { error } = await supabase.from("startup_sectors").insert(sector_ids.map((sector_id) => ({ startup_id: startupId, sector_id })));
    if (error) return { error: friendlyError(error) ?? undefined, values, multi };
  }
  return afterSave("basics", formData);
}

export async function saveProblem(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = problemSchema.safeParse({
    problem: text(formData, "problem"),
    solution: text(formData, "solution"),
    target_customers: text(formData, "target_customers"),
    offering_type: text(formData, "offering_type"),
    domain: text(formData, "domain"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };
  const { supabase, user } = await requireUser("/venture/edit/problem");
  const startupId = await myStartupId(supabase, user.id);
  if (!startupId) redirect("/venture/edit/basics");
  const { error } = await supabase.from("startups").update(parsed.data).eq("id", startupId);
  if (error) return { error: friendlyError(error) ?? undefined, values };
  return afterSave("problem", formData);
}

export async function saveTraction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = tractionSchema.safeParse({
    traction_level: text(formData, "traction_level"),
    traction_summary: text(formData, "traction_summary"),
    website: text(formData, "website"),
    pitch_deck_url: text(formData, "pitch_deck_url"),
    demo_url: text(formData, "demo_url"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };
  const { supabase, user } = await requireUser("/venture/edit/traction");
  const startupId = await myStartupId(supabase, user.id);
  if (!startupId) redirect("/venture/edit/basics");
  const { error } = await supabase.from("startups").update(parsed.data).eq("id", startupId);
  if (error) return { error: friendlyError(error) ?? undefined, values };
  return afterSave("traction", formData);
}

export async function saveSupport(_prev: FormState, formData: FormData): Promise<FormState> {
  const multi = multiValues(formData, ["support_need_ids"]);
  const parsed = supportSchema.safeParse({ support_need_ids: multi.support_need_ids });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), multi };
  const { supabase, user } = await requireUser("/venture/edit/support");
  const startupId = await myStartupId(supabase, user.id);
  if (!startupId) redirect("/venture/edit/basics");
  await supabase.from("startup_support_needs").delete().eq("startup_id", startupId);
  if (parsed.data.support_need_ids.length) {
    const { error } = await supabase
      .from("startup_support_needs")
      .insert(parsed.data.support_need_ids.map((support_need_id) => ({ startup_id: startupId, support_need_id })));
    if (error) return { error: friendlyError(error) ?? undefined, multi };
  }
  return afterSave("support", formData);
}

export async function addMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = memberSchema.safeParse({
    full_name: text(formData, "full_name"),
    email: text(formData, "email"),
    role_title: text(formData, "role_title"),
    is_founder: checked(formData, "is_founder"),
    linkedin_url: text(formData, "linkedin_url"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };
  const { supabase, user } = await requireUser("/venture/team");
  const startupId = await myStartupId(supabase, user.id);
  if (!startupId) redirect("/venture/edit/basics");

  const { email, ...member } = parsed.data;
  const { data, error } = await supabase.from("startup_members").insert({ ...member, startup_id: startupId }).select("id").single();
  if (error || !data) return { error: friendlyError(error) ?? undefined, values };
  if (email) await supabase.from("startup_member_contacts").insert({ member_id: data.id, email });
  revalidatePath("/venture", "layout");
  return { success: `${member.full_name} was added to the team.` };
}

export async function removeMember(memberId: string) {
  const { supabase } = await requireUser("/venture/team");
  await supabase.from("startup_members").delete().eq("id", memberId);
  revalidatePath("/venture", "layout");
  redirect("/venture/team?notice=deleted");
}

export async function saveFinancials(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = financialsSchema.safeParse({
    as_of_date: text(formData, "as_of_date"),
    annual_revenue: text(formData, "annual_revenue"),
    monthly_operating_expenses: text(formData, "monthly_operating_expenses"),
    cash_balance: text(formData, "cash_balance"),
    total_funding_received: text(formData, "total_funding_received"),
    monthly_burn_rate: text(formData, "monthly_burn_rate"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };
  const { supabase, user } = await requireUser("/venture/financials");
  const startupId = await myStartupId(supabase, user.id);
  if (!startupId) redirect("/venture/edit/basics");
  // One set of figures per date: saving the same date again updates it.
  const { error } = await supabase.from("startup_financials").upsert({ ...parsed.data, startup_id: startupId }, { onConflict: "startup_id,as_of_date" });
  if (error) return { error: friendlyError(error) ?? undefined, values };
  revalidatePath("/venture/financials");
  return { success: "Figures saved. Only you can see them unless you choose to share them with a centre when you apply." };
}

export async function deleteFinancials(reportId: string) {
  const { supabase } = await requireUser("/venture/financials");
  await supabase.from("startup_financials").delete().eq("id", reportId);
  revalidatePath("/venture/financials");
  redirect("/venture/financials?notice=deleted");
}

export async function deleteStartup() {
  const { supabase, user } = await requireUser("/venture");
  const { error } = await supabase.from("startups").delete().eq("owner_id", user.id);
  revalidatePath("/", "layout");
  if (error) redirect("/venture?error=in_use_startup");
  redirect("/dashboard?notice=deleted");
}
