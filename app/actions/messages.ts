"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { errorCode, friendlyError } from "@/lib/errors";
import { formValues, text, type FormState } from "./types";

// Where each side reads a conversation.
function threadPath(side: "founder" | "center", threadId: string, slug?: string) {
  return side === "founder" ? `/messages/${threadId}` : `/manage/${slug}/messages/${threadId}`;
}

export async function startThread(
  input: { centreId: string; startupId: string; applicationId?: string; side: "founder" | "center"; slug: string },
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData);
  const subject = text(formData, "subject").trim();
  const body = text(formData, "body").trim();
  const fieldErrors: Record<string, string> = {};
  if (!subject) fieldErrors.subject = "Add a subject";
  if (subject.length > 150) fieldErrors.subject = "Must be 150 characters or fewer";
  if (!body) fieldErrors.body = "Write your message";
  if (body.length > 5000) fieldErrors.body = "Must be 5000 characters or fewer";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const { supabase } = await requireUser(input.side === "founder" ? "/messages" : `/manage/${input.slug}/messages`);
  const { data, error } = await supabase.rpc("start_thread", {
    p_center_id: input.centreId,
    p_startup_id: input.startupId,
    p_subject: subject,
    p_body: body,
    p_application_id: input.applicationId,
  });
  if (error || !data) {
    if (errorCode(error) === "not_allowed") await supabase.rpc("log_access_denied", { p_path: "start_thread" });
    return { error: friendlyError(error) ?? undefined, values };
  }
  revalidatePath("/messages");
  redirect(`${threadPath(input.side, data, input.slug)}?notice=message-sent`);
}

export async function sendMessage(threadId: string, returnPath: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const body = text(formData, "body").trim();
  if (!body) return { fieldErrors: { body: "Write your message" }, values };
  if (body.length > 5000) return { fieldErrors: { body: "Must be 5000 characters or fewer" }, values };
  const { supabase } = await requireUser(returnPath);
  const { error } = await supabase.rpc("send_message", { p_thread_id: threadId, p_body: body });
  if (error) return { error: friendlyError(error) ?? undefined, values };
  revalidatePath(returnPath);
  redirect(`${returnPath}?notice=message-sent`);
}

export async function setArchived(threadId: string, returnPath: string, archived: boolean) {
  const { supabase } = await requireUser(returnPath);
  const { error } = await supabase.rpc("set_thread_archived", { p_thread_id: threadId, p_archived: archived });
  revalidatePath(returnPath);
  if (error) redirect(`${returnPath}?error=${errorCode(error)}`);
  redirect(`${returnPath}?notice=${archived ? "archived" : "unarchived"}`);
}

export async function reportThread(threadId: string, returnPath: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const reason = text(formData, "reason").trim();
  if (reason.length < 5) return { fieldErrors: { reason: "Tell us briefly what happened (at least 5 characters)" }, values };
  if (reason.length > 2000) return { fieldErrors: { reason: "Must be 2000 characters or fewer" }, values };
  const { supabase } = await requireUser(returnPath);
  const { error } = await supabase.rpc("report_thread", { p_thread_id: threadId, p_reason: reason, p_message_id: text(formData, "message_id") || undefined });
  if (error) return { error: friendlyError(error) ?? undefined, values };
  redirect(`${returnPath}?notice=reported`);
}
