"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { errorCode, friendlyError } from "@/lib/errors";
import type { ApplicationStatus } from "@/lib/types";
import { checked, formValues, text, type FormState } from "./types";

// Start or resume the application for a centre. Duplicates resume the existing one.
export async function startApplication(centreId: string, slug: string) {
  const { supabase } = await requireUser(`/centres/${slug}/apply`);
  const { data, error } = await supabase.rpc("start_application", { p_center_id: centreId });
  if (error || !data) redirect(`/centres/${slug}/apply?error=${errorCode(error) ?? "unknown"}`);
  revalidatePath("/applications");
  redirect(`/applications/${data}`);
}

export async function saveDraft(applicationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const note = text(formData, "cover_note").trim();
  if (note.length > 3000) return { fieldErrors: { cover_note: "Must be 3000 characters or fewer" }, values };

  const { supabase } = await requireUser(`/applications/${applicationId}`);
  const { error: saveError } = await supabase.rpc("save_application_draft", {
    p_application_id: applicationId,
    p_cover_note: note,
    p_share_financials: checked(formData, "share_financials"),
  });
  if (saveError) return { error: friendlyError(saveError) ?? undefined, values };

  if (text(formData, "intent") !== "submit") {
    revalidatePath(`/applications/${applicationId}`);
    return { success: "Draft saved. You can come back and submit it later.", values };
  }

  const { error } = await supabase.rpc("submit_application", { p_application_id: applicationId });
  if (error) {
    const details = error.message === "profile_incomplete" && error.details ? error.details.split("; ") : undefined;
    return {
      error: error.message === "profile_incomplete" ? "Your draft is saved, but these details are still missing from your venture profile:" : (friendlyError(error) ?? undefined),
      details,
      values,
    };
  }
  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}`);
  redirect(`/applications/${applicationId}?notice=submitted`);
}

export async function deleteDraft(applicationId: string) {
  const { supabase } = await requireUser(`/applications/${applicationId}`);
  await supabase.from("startup_applications").delete().eq("id", applicationId).eq("status", "draft");
  revalidatePath("/applications");
  redirect("/applications?notice=draft-deleted");
}

export async function respondToRequest(applicationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const response = text(formData, "response").trim();
  if (!response) return { fieldErrors: { response: "Write your reply" }, values };
  if (response.length > 3000) return { fieldErrors: { response: "Must be 3000 characters or fewer" }, values };

  const { supabase } = await requireUser(`/applications/${applicationId}`);
  const { error } = await supabase.rpc("respond_to_information_request", { p_application_id: applicationId, p_response: response });
  if (error) return { error: friendlyError(error) ?? undefined, values };
  revalidatePath(`/applications/${applicationId}`);
  redirect(`/applications/${applicationId}?notice=response-sent`);
}

// Centre staff change an application's status, with an optional note for the founder.
export async function changeStatus(slug: string, applicationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const status = text(formData, "status") as ApplicationStatus;
  const note = text(formData, "note").trim();
  if (!status) return { fieldErrors: { status: "Choose the new status" }, values };
  if (note.length > 3000) return { fieldErrors: { note: "Must be 3000 characters or fewer" }, values };
  if (status === "more_information_needed" && !note) return { fieldErrors: { note: "Tell the founder what information you need" }, values };

  const path = `/manage/${slug}/applications/${applicationId}`;
  const { supabase } = await requireUser(path);
  const { error } = await supabase.rpc("change_application_status", { p_application_id: applicationId, p_status: status, p_note: note || undefined });
  if (error) {
    if (errorCode(error) === "not_allowed") await supabase.rpc("log_access_denied", { p_path: path });
    return { error: friendlyError(error) ?? undefined, values };
  }
  revalidatePath(`/manage/${slug}/applications`);
  revalidatePath(path);
  redirect(`${path}?notice=status-updated`);
}
