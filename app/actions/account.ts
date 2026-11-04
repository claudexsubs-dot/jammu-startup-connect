"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, safeNext } from "@/lib/auth";
import { errorCode } from "@/lib/errors";
import { toFieldErrors } from "@/lib/validation";
import { formValues, type FormState } from "./types";

const nameSchema = z.object({ full_name: z.string().trim().min(2, "Enter your full name").max(120, "Must be 120 characters or fewer") });

export async function updateName(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = nameSchema.safeParse({ full_name: formData.get("full_name") ?? "" });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const { supabase, user } = await requireUser("/account");
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name }).eq("id", user.id);
  if (error) return { error: "We couldn't save your name. Please try again.", values };
  revalidatePath("/", "layout");
  return { success: "Your name was saved." };
}

export async function markNotificationsRead() {
  const { supabase } = await requireUser("/notifications");
  await supabase.rpc("mark_notifications_read");
  revalidatePath("/", "layout");
  redirect("/notifications");
}

// Opening a notification marks it read, then goes to the page it points to.
export async function openNotification(id: string, link: string | null) {
  const { supabase } = await requireUser("/notifications");
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null);
  revalidatePath("/", "layout");
  redirect(safeNext(link, "/notifications"));
}

export async function acceptInvitation(token: string) {
  const { supabase } = await requireUser(`/invite/${token}`);
  const { data, error } = await supabase.rpc("accept_invitation", { p_token: token });
  if (error || !data) redirect(`/invite/${token}?error=${errorCode(error)}`);
  revalidatePath("/", "layout");
  redirect(`${safeNext(data)}?notice=invite-accepted`);
}
