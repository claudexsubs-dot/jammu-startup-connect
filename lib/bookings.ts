import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const BOOKING_SELECT =
  "*, center_experts(id, full_name, headline, organization, user_id, in_person_location), incubation_centers(name, slug, status), startups(id, name)" as const;

// One booking with its history. Row Level Security decides who may see it: the founder
// who asked, the linked expert and the centre's staff.
export async function loadBooking(supabase: SupabaseClient<Database>, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data: booking } = await supabase.from("consultation_bookings").select(BOOKING_SELECT).eq("id", id).maybeSingle();
  if (!booking) return null;
  const { data: events } = await supabase
    .from("booking_events")
    .select("id, from_status, to_status, note, actor_side, created_at")
    .eq("booking_id", id)
    .order("created_at");
  return { booking, events: events ?? [] };
}

export type LoadedBooking = NonNullable<Awaited<ReturnType<typeof loadBooking>>>;
export type BookingRow = LoadedBooking["booking"];

// Open times the expert could suggest instead, excluding the one already requested.
export async function openSlots(supabase: SupabaseClient<Database>, expertId: string, excludeSlotId?: string | null) {
  const { data } = await supabase.rpc("available_slots", { p_expert_id: expertId });
  return (data ?? []).filter((slot) => slot.id !== excludeSlotId);
}

export const BOOKING_LIST_SELECT =
  "id, status, format, starts_at, ends_at, is_paid, fee_inr, created_at, proposed_slot_id, center_experts(id, full_name), incubation_centers(name, slug), startups(name)" as const;
