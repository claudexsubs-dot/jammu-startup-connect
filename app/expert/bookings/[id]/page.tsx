import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingDetails, BookingHistory } from "@/components/bookings/booking-details";
import { ManagerBookingActions } from "@/components/bookings/manager-actions";
import { Notice } from "@/components/notice";
import { denyAccess, requireUser } from "@/lib/auth";
import { loadBooking, openSlots } from "@/lib/bookings";

export const metadata: Metadata = { title: "Session request" };

export default async function ExpertBookingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { id } = await params;
  const { notice, error } = await searchParams;
  const path = `/expert/bookings/${id}`;
  const { supabase, experts } = await requireUser(path);
  const loaded = await loadBooking(supabase, id);
  if (!loaded) notFound();
  const { booking, events } = loaded;
  if (!experts.some((e) => e.id === booking.expert_id)) return denyAccess(path);
  const slots = await openSlots(supabase, booking.expert_id, booking.slot_id);
  const expertName = booking.center_experts?.full_name ?? "You";

  return (
    <>
      <p className="breadcrumbs">
        <Link href="/expert">Requests and sessions</Link>
      </p>
      <Notice code={notice} error={error} />
      <h1>Session request from {booking.startups?.name ?? "a startup"}</h1>
      {booking.proposed_slot_id ? <p className="alert alert-info">You suggested another time. Waiting for the founder to accept it.</p> : null}
      <div className="layout-split">
        <div className="stack">
          <BookingDetails booking={booking} viewer="manager" />
          <BookingHistory events={events} expertName={expertName} />
        </div>
        <aside className="side-panel">
          <ManagerBookingActions booking={booking} returnPath={path} openSlots={slots} />
        </aside>
      </div>
    </>
  );
}
