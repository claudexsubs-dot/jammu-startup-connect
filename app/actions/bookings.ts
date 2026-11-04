"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { errorCode, friendlyError } from "@/lib/errors";
import { istLocalToIso } from "@/lib/format";
import type { SessionFormat } from "@/lib/types";
import { formValues, text, type FormState } from "./types";

// A founder asks for a session. It stays PENDING until the expert confirms. No payment is taken.
export async function requestBooking(expertId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const slotId = text(formData, "slot_id");
  const format = text(formData, "format") as SessionFormat;
  const note = text(formData, "note").trim();
  const fieldErrors: Record<string, string> = {};
  if (!slotId) fieldErrors.slot_id = "Choose a time";
  if (format !== "online" && format !== "in_person") fieldErrors.format = "Choose online or in person";
  if (note.length > 2000) fieldErrors.note = "Must be 2000 characters or fewer";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const { supabase } = await requireUser(`/experts/${expertId}`);
  const { data, error } = await supabase.rpc("request_booking", { p_slot_id: slotId, p_format: format, p_note: note || undefined });
  if (error || !data) {
    revalidatePath(`/experts/${expertId}`);
    const code = errorCode(error);
    return {
      error:
        code === "slot_unavailable"
          ? "Someone else just requested that time, so it's no longer available. The list below shows the times that are still open."
          : (friendlyError(error) ?? undefined),
      values: code === "slot_unavailable" ? { ...values, slot_id: "" } : values,
    };
  }
  revalidatePath("/bookings");
  redirect(`/bookings/${data}?notice=booking-requested`);
}

export async function founderBookingAction(bookingId: string, action: "cancel" | "accept_proposal", formData: FormData) {
  const { supabase } = await requireUser(`/bookings/${bookingId}`);
  const { error } = await supabase.rpc("founder_update_booking", {
    p_booking_id: bookingId,
    p_action: action,
    p_note: text(formData, "note").trim() || undefined,
  });
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  if (error) redirect(`/bookings/${bookingId}?error=${errorCode(error)}`);
  redirect(`/bookings/${bookingId}?notice=${action === "cancel" ? "booking-cancelled" : "proposal-accepted"}`);
}

// The expert or centre staff act on a request.
export async function managerBookingAction(returnPath: string, bookingId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const action = text(formData, "action");
  const { supabase } = await requireUser(returnPath);
  const { error } = await supabase.rpc("update_booking", {
    p_booking_id: bookingId,
    p_action: action,
    p_note: text(formData, "note").trim() || undefined,
    p_payment_instructions: text(formData, "payment_instructions").trim() || undefined,
    p_meeting_link: text(formData, "meeting_link").trim() || undefined,
    p_meeting_location: text(formData, "meeting_location").trim() || undefined,
    p_proposed_slot_id: text(formData, "proposed_slot_id") || undefined,
  });
  if (error) {
    if (errorCode(error) === "not_allowed") await supabase.rpc("log_access_denied", { p_path: returnPath });
    return { error: friendlyError(error) ?? undefined, values };
  }
  revalidatePath(returnPath);
  redirect(`${returnPath}?notice=booking-updated`);
}

// Availability slots, added by centre staff or the linked expert.
export async function addSlot(expertId: string, returnPath: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const startsAt = istLocalToIso(text(formData, "starts_at"));
  const minutes = Number(text(formData, "minutes"));
  const repeatWeeks = Math.min(Math.max(Number(text(formData, "repeat_weeks") || "1"), 1), 8);
  if (!startsAt) return { fieldErrors: { starts_at: "Choose a date and time" }, values };
  if (!Number.isInteger(minutes) || minutes < 15 || minutes > 480) return { fieldErrors: { minutes: "Between 15 and 480 minutes" }, values };
  if (new Date(startsAt).getTime() <= Date.now()) return { fieldErrors: { starts_at: "Choose a time in the future" }, values };

  const rows = Array.from({ length: repeatWeeks }, (_, week) => {
    const start = new Date(new Date(startsAt).getTime() + week * 7 * 86_400_000);
    return { expert_id: expertId, starts_at: start.toISOString(), ends_at: new Date(start.getTime() + minutes * 60_000).toISOString() };
  });

  const { supabase, user } = await requireUser(returnPath);
  const { error } = await supabase.from("availability_slots").insert(rows.map((row) => ({ ...row, created_by: user.id })));
  if (error) return { error: friendlyError(error) ?? undefined, values };
  revalidatePath(returnPath);
  return { success: repeatWeeks > 1 ? `Added ${repeatWeeks} weekly slots.` : "Slot added." };
}

export async function removeSlot(slotId: string, returnPath: string) {
  const { supabase } = await requireUser(returnPath);
  // Slots with past bookings are kept for history and marked cancelled instead.
  const { error } = await supabase.from("availability_slots").delete().eq("id", slotId);
  if (error && errorCode(error) === "in_use") {
    const { error: cancelError } = await supabase.from("availability_slots").update({ is_cancelled: true }).eq("id", slotId);
    revalidatePath(returnPath);
    if (cancelError) redirect(`${returnPath}?error=${errorCode(cancelError)}`);
    redirect(`${returnPath}?notice=slot-removed`);
  }
  revalidatePath(returnPath);
  if (error) redirect(`${returnPath}?error=${errorCode(error)}`);
  redirect(`${returnPath}?notice=slot-removed`);
}
