"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { errorCode, friendlyError } from "@/lib/errors";
import { expertSchema, inviteSchema, toFieldErrors } from "@/lib/validation";
import { checked, formValues, type FormState } from "./types";

function readExpert(formData: FormData) {
  return expertSchema.safeParse({
    full_name: formData.get("full_name") ?? "",
    headline: formData.get("headline") ?? "",
    organization: formData.get("organization") ?? "",
    bio: formData.get("bio") ?? "",
    expertise_tags: formData.get("expertise_tags") ?? "",
    engagement_policy: formData.get("engagement_policy") ?? "",
    is_paid: formData.get("is_paid") === "paid",
    fee_inr: formData.get("fee_inr") ?? "",
    session_minutes: formData.get("session_minutes") ?? "",
    offers_online: checked(formData, "offers_online"),
    offers_in_person: checked(formData, "offers_in_person"),
    in_person_location: formData.get("in_person_location") ?? "",
  });
}

// Centre staff add a mentor or paid college expert to their centre.
export async function createExpert(centreId: string, slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = readExpert(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const path = `/manage/${slug}/experts/new`;
  const { supabase, user } = await requireUser(path);
  const { data, error } = await supabase
    .from("center_experts")
    .insert({ ...parsed.data, center_id: centreId, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) {
    if (errorCode(error) === "not_allowed") await supabase.rpc("log_access_denied", { p_path: path });
    return { error: friendlyError(error) ?? undefined, values };
  }
  revalidatePath(`/manage/${slug}/experts`);
  redirect(`/manage/${slug}/experts/${data.id}?notice=created`);
}

// Staff or the linked expert edit the expert's profile, fee, format and policy.
export async function updateExpert(expertId: string, returnPath: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = readExpert(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const { supabase } = await requireUser(returnPath);
  const { data, error } = await supabase.from("center_experts").update(parsed.data).eq("id", expertId).select("id").maybeSingle();
  if (error || !data) {
    await supabase.rpc("log_access_denied", { p_path: returnPath });
    return { error: friendlyError(error) ?? "You don't have permission to edit this profile.", values };
  }
  revalidatePath(returnPath);
  revalidatePath(`/experts/${expertId}`);
  return { success: "The profile was saved." };
}

export async function setExpertActive(expertId: string, returnPath: string, active: boolean) {
  const { supabase } = await requireUser(returnPath);
  const { data, error } = await supabase.from("center_experts").update({ is_active: active }).eq("id", expertId).select("id").maybeSingle();
  revalidatePath(returnPath);
  if (error || !data) redirect(`${returnPath}?error=${errorCode(error) ?? "not_allowed"}`);
  redirect(`${returnPath}?notice=${active ? "expert-activated" : "expert-deactivated"}`);
}

export async function deleteExpert(expertId: string, slug: string) {
  const returnPath = `/manage/${slug}/experts/${expertId}`;
  const { supabase } = await requireUser(returnPath);
  const { data, error } = await supabase.from("center_experts").delete().eq("id", expertId).select("id").maybeSingle();
  if (error || !data) redirect(`${returnPath}?error=${errorCode(error) === "in_use" ? "expert_in_use" : (errorCode(error) ?? "not_allowed")}`);
  revalidatePath(`/manage/${slug}/experts`);
  redirect(`/manage/${slug}/experts?notice=deleted`);
}

// Creates a link the expert opens to connect their own account to this profile.
export async function inviteExpert(expertId: string, returnPath: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = inviteSchema.safeParse({ email: formData.get("email") ?? "" });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };
  const { supabase } = await requireUser(returnPath);
  const { data, error } = await supabase.rpc("invite_expert", { p_expert_id: expertId, p_email: parsed.data.email });
  if (error || !data) return { error: friendlyError(error) ?? undefined, values };
  revalidatePath(returnPath);
  return {
    success: `Invitation created for ${parsed.data.email}. UdyamSetu doesn't send emails yet, so copy this link and send it to them yourself: ${env.siteUrl}/invite/${data}`,
  };
}

export async function revokeInvitation(invitationId: string, returnPath: string) {
  const { supabase } = await requireUser(returnPath);
  const { error } = await supabase.rpc("revoke_invitation", { p_invitation_id: invitationId });
  revalidatePath(returnPath);
  if (error) redirect(`${returnPath}?error=${errorCode(error)}`);
  redirect(`${returnPath}?notice=invitation-revoked`);
}
