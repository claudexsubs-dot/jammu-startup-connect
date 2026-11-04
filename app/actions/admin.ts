"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { readCentreForm, saveCentreLinks } from "@/lib/centre-form";
import { env } from "@/lib/env";
import { errorCode, friendlyError } from "@/lib/errors";
import { inviteSchema, slugify, slugSchema, taxonomySchema, toFieldErrors } from "@/lib/validation";
import type { CenterStatus, Enum } from "@/lib/types";
import { checked, formValues, text, type FormState } from "./types";

// ---------- Centres ----------

export async function createCentre(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const { parsed, multi } = readCentreForm(formData);
  const slug = slugSchema.safeParse(text(formData, "slug").trim() || slugify(text(formData, "name")));
  if (!parsed.success || !slug.success) {
    return {
      fieldErrors: { ...(parsed.success ? {} : toFieldErrors(parsed.error)), ...(slug.success ? {} : { slug: slug.error.issues[0]?.message ?? "Check the web address" }) },
      values,
      multi,
    };
  }
  const { stage_ids, sector_ids, service_ids, ...fields } = parsed.data;
  const { supabase, user } = await requireAdmin("/admin/centres/new");
  const { data, error } = await supabase
    .from("incubation_centers")
    .insert({ ...fields, slug: slug.data, is_sample: checked(formData, "is_sample"), created_by: user.id })
    .select("id")
    .single();
  if (error || !data) {
    return { error: errorCode(error) === "duplicate" ? "Another centre already uses that web address. Choose a different one." : (friendlyError(error) ?? undefined), values, multi };
  }
  const linkError = await saveCentreLinks(supabase, data.id, { stage_ids, sector_ids, service_ids });
  revalidatePath("/centres");
  revalidatePath("/admin/centres");
  redirect(`/admin/centres/${data.id}?notice=created${linkError ? "&error=unknown" : ""}`);
}

const CENTRE_STATUSES: CenterStatus[] = ["active", "suspended", "archived"];

export async function setCentreStatus(centreId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const status = text(formData, "status") as CenterStatus;
  const reason = text(formData, "reason").trim();
  if (!CENTRE_STATUSES.includes(status)) return { fieldErrors: { status: "Choose a status" }, values };
  if (status !== "active" && reason.length < 5) return { fieldErrors: { reason: "Give a short reason. Staff of the centre will see it." }, values };
  if (reason.length > 500) return { fieldErrors: { reason: "Must be 500 characters or fewer" }, values };

  const path = `/admin/centres/${centreId}`;
  const { supabase } = await requireAdmin(path);
  const { error } = await supabase
    .from("incubation_centers")
    .update({ status, status_reason: status === "active" ? null : reason })
    .eq("id", centreId);
  if (error) return { error: friendlyError(error) ?? undefined, values };
  revalidatePath(path);
  revalidatePath("/centres");
  redirect(`${path}?notice=centre-status`);
}

export async function deleteCentre(centreId: string) {
  const path = `/admin/centres/${centreId}`;
  const { supabase } = await requireAdmin(path);
  const { data, error } = await supabase.from("incubation_centers").delete().eq("id", centreId).select("id").maybeSingle();
  if (error || !data) redirect(`${path}?error=${errorCode(error) === "in_use" ? "centre_in_use" : (errorCode(error) ?? "not_found")}`);
  revalidatePath("/centres");
  redirect("/admin/centres?notice=deleted");
}

export async function inviteStaff(centreId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = inviteSchema.safeParse({ email: formData.get("email") ?? "" });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };
  const path = `/admin/centres/${centreId}`;
  const { supabase } = await requireAdmin(path);
  const { data, error } = await supabase.rpc("admin_invite_staff", { p_center_id: centreId, p_email: parsed.data.email });
  if (error || !data) return { error: friendlyError(error) ?? undefined, values };
  revalidatePath(path);
  return {
    success: `Invitation created for ${parsed.data.email}. UdyamSetu doesn't send emails yet, so copy this link and send it to them: ${env.siteUrl}/invite/${data}`,
  };
}

export async function revokeStaff(membershipId: string, centreId: string) {
  const path = `/admin/centres/${centreId}`;
  const { supabase } = await requireAdmin(path);
  const { error } = await supabase.rpc("admin_revoke_staff", { p_membership_id: membershipId });
  revalidatePath(path);
  if (error) redirect(`${path}?error=${errorCode(error)}`);
  redirect(`${path}?notice=staff-revoked`);
}

// ---------- Users and moderation ----------

export async function setUserSuspension(userId: string, suspend: boolean, returnPath: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const reason = text(formData, "reason").trim();
  if (suspend && reason.length < 5) return { fieldErrors: { reason: "Give a short reason (at least 5 characters)" }, values };
  const { supabase } = await requireAdmin(returnPath);
  const { error } = await supabase.rpc("admin_set_user_suspension", { p_user_id: userId, p_suspended: suspend, p_reason: reason || undefined });
  if (error) return { error: friendlyError(error) ?? undefined, values };
  revalidatePath(returnPath);
  redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}notice=user-updated`);
}

export async function hideMessage(messageId: string, returnPath: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const reason = text(formData, "reason").trim();
  if (reason.length < 5) return { fieldErrors: { reason: "Give a short reason (at least 5 characters)" }, values };
  const { supabase } = await requireAdmin(returnPath);
  const { error } = await supabase.rpc("admin_hide_message", { p_message_id: messageId, p_reason: reason });
  if (error) return { error: friendlyError(error) ?? undefined, values };
  revalidatePath(returnPath);
  redirect(`${returnPath}?notice=message-hidden`);
}

export async function resolveReport(reportId: string, returnPath: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const status = text(formData, "status") as Enum<"report_status">;
  if (status !== "resolved" && status !== "dismissed") return { fieldErrors: { status: "Choose resolved or dismissed" }, values };
  const { supabase } = await requireAdmin(returnPath);
  const { error } = await supabase.rpc("admin_resolve_report", { p_report_id: reportId, p_status: status, p_note: text(formData, "note").trim() || undefined });
  if (error) return { error: friendlyError(error) ?? undefined, values };
  revalidatePath("/admin/reports");
  redirect(`${returnPath}?notice=report-updated`);
}

// ---------- Stages, sectors and support needs ----------

export type TaxonomyKind = "stages" | "sectors" | "needs";
const TABLES = { stages: "startup_stages", sectors: "sectors", needs: "support_needs" } as const;

function readTaxonomy(formData: FormData) {
  return taxonomySchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    sort_order: formData.get("sort_order") || "100",
  });
}

export async function addTaxonomy(kind: TaxonomyKind, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = readTaxonomy(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };
  const { supabase } = await requireAdmin("/admin/taxonomy");
  const key = slugify(parsed.data.name);
  const { name, description, sort_order } = parsed.data;
  const { error } =
    kind === "stages"
      ? await supabase.from("startup_stages").insert({ code: key.replace(/-/g, "_"), name, description, sort_order })
      : kind === "sectors"
        ? await supabase.from("sectors").insert({ slug: key, name, sort_order })
        : await supabase.from("support_needs").insert({ slug: key, name, description, sort_order });
  if (error) return { error: errorCode(error) === "duplicate" ? "That name is already in the list." : (friendlyError(error) ?? undefined), values };
  revalidatePath("/admin/taxonomy");
  return { success: `Added "${name}".` };
}

export async function updateTaxonomy(kind: TaxonomyKind, id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = readTaxonomy(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };
  const { supabase } = await requireAdmin("/admin/taxonomy");
  const { name, description, sort_order } = parsed.data;
  const is_active = checked(formData, "is_active");
  const { error } =
    kind === "sectors"
      ? await supabase.from(TABLES[kind]).update({ name, sort_order, is_active }).eq("id", id)
      : await supabase.from(TABLES[kind]).update({ name, description, sort_order, is_active }).eq("id", id);
  if (error) return { error: errorCode(error) === "duplicate" ? "That name is already in the list." : (friendlyError(error) ?? undefined), values };
  revalidatePath("/", "layout");
  return { success: is_active ? "Saved." : "Saved. It's hidden from new choices but kept on existing profiles." };
}
