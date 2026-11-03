"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { financialsSchema, memberSchema, startupSchema, toFieldErrors } from "@/lib/validation";
import { formValues, type FormState } from "./types";

function readStartup(formData: FormData) {
  return startupSchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    founding_year: formData.get("founding_year") ?? "",
    stage: formData.get("stage") ?? "",
    sector_id: formData.get("sector_id") ?? "",
    domain: formData.get("domain") ?? "",
    offering_type: formData.get("offering_type") ?? "",
    product_or_service: formData.get("product_or_service") ?? "",
    target_customers: formData.get("target_customers") ?? "",
    district: formData.get("district") ?? "",
    city: formData.get("city") ?? "",
    legal_status: formData.get("legal_status") ?? "",
    registration_number: formData.get("registration_number") ?? "",
    dpiit_recognised: formData.get("dpiit_recognised") === "on",
    website: formData.get("website") ?? "",
  });
}

export async function createStartup(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = readStartup(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const { supabase, user } = await requireUser("/startups/new");
  const { data, error } = await supabase
    .from("startups")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();

  if (error || !data) return { error: "We couldn't save your startup. Please try again.", values };

  revalidatePath("/dashboard");
  redirect(`/startups/${data.id}?notice=created`);
}

export async function updateStartup(startupId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = readStartup(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const { supabase } = await requireUser(`/startups/${startupId}/edit`);
  const { data, error } = await supabase.from("startups").update(parsed.data).eq("id", startupId).select("id");

  // RLS returns zero rows when this person may not edit the startup.
  if (error || !data?.length) return { error: "We couldn't save your changes. You may not have permission to edit this startup.", values };

  revalidatePath(`/startups/${startupId}`);
  revalidatePath("/startups");
  revalidatePath("/dashboard");
  redirect(`/startups/${startupId}?notice=saved`);
}

export async function setPublished(startupId: string, publish: boolean) {
  const { supabase } = await requireUser(`/startups/${startupId}`);
  await supabase.from("startups").update({ is_published: publish }).eq("id", startupId);
  revalidatePath(`/startups/${startupId}`);
  revalidatePath("/startups");
  revalidatePath("/");
  revalidatePath("/dashboard");
}

export async function deleteStartup(startupId: string) {
  const { supabase } = await requireUser(`/startups/${startupId}/edit`);
  await supabase.from("startups").delete().eq("id", startupId);
  revalidatePath("/dashboard");
  revalidatePath("/startups");
  redirect("/dashboard?notice=deleted");
}

export async function addMember(startupId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = memberSchema.safeParse({
    full_name: formData.get("full_name") ?? "",
    email: formData.get("email") ?? "",
    role_title: formData.get("role_title") ?? "",
    is_founder: formData.get("is_founder") === "on",
    linkedin_url: formData.get("linkedin_url") ?? "",
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const { supabase } = await requireUser(`/startups/${startupId}/team`);
  const { error } = await supabase.from("startup_members").insert({ ...parsed.data, startup_id: startupId });
  if (error) return { error: "We couldn't add this person. Only the startup's owner can change the team.", values };

  revalidatePath(`/startups/${startupId}/team`);
  return { success: `${parsed.data.full_name} was added to the team.` };
}

export async function removeMember(startupId: string, memberId: string) {
  const { supabase } = await requireUser(`/startups/${startupId}/team`);
  await supabase.from("startup_members").delete().eq("id", memberId).eq("startup_id", startupId);
  revalidatePath(`/startups/${startupId}/team`);
}

export async function saveFinancials(startupId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = financialsSchema.safeParse({
    as_of_date: formData.get("as_of_date") ?? "",
    annual_revenue: formData.get("annual_revenue") ?? "",
    monthly_operating_expenses: formData.get("monthly_operating_expenses") ?? "",
    cash_balance: formData.get("cash_balance") ?? "",
    total_funding_received: formData.get("total_funding_received") ?? "",
    monthly_burn_rate: formData.get("monthly_burn_rate") ?? "",
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const { supabase } = await requireUser(`/startups/${startupId}/financials`);
  // One report per date: saving the same date again updates it.
  const { error } = await supabase
    .from("startup_financials")
    .upsert({ ...parsed.data, startup_id: startupId }, { onConflict: "startup_id,as_of_date" });

  if (error) return { error: "We couldn't save these figures. Only the owner and editors can add financials.", values };

  revalidatePath(`/startups/${startupId}/financials`);
  return { success: "Financial figures saved. Only you and your editors can see them." };
}

export async function deleteFinancials(startupId: string, reportId: string) {
  const { supabase } = await requireUser(`/startups/${startupId}/financials`);
  await supabase.from("startup_financials").delete().eq("id", reportId).eq("startup_id", startupId);
  revalidatePath(`/startups/${startupId}/financials`);
}
