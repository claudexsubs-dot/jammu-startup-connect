import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingDetails, BookingHistory } from "@/components/bookings/booking-details";
import { ManagerBookingActions } from "@/components/bookings/manager-actions";
import { Notice } from "@/components/notice";
import { requireCentreStaff } from "@/lib/auth";
import { loadBooking, openSlots } from "@/lib/bookings";

export const metadata: Metadata = { title: "Booking" };

export default async function ManageBookingPage({ params, searchParams }: { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { slug, id } = await params;
  const { notice, error } = await searchParams;
  const path = `/manage/${slug}/bookings/${id}`;
  const { supabase, centre } = await requireCentreStaff(slug, path);
  const loaded = await loadBooking(supabase, id);
  if (!loaded || loaded.booking.center_id !== centre.id) notFound();
  const { booking, events } = loaded;
  const slots = await openSlots(supabase, booking.expert_id, booking.slot_id);
  const expertName = booking.center_experts?.full_name ?? "Expert";

  return (
    <>
      <p className="breadcrumbs">
        <Link href={`/manage/${slug}/bookings`}>Bookings</Link>
        {" · "}
        <Link href={`/manage/${slug}/experts/${booking.expert_id}`}>{expertName}</Link>
      </p>
      <Notice code={notice} error={error} />
      <h2>
        {booking.startups?.name ?? "Startup"} with {expertName}
      </h2>
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
