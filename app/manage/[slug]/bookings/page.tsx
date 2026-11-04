import type { Metadata } from "next";
import { BookingTable, splitBookings } from "@/components/bookings/booking-table";
import { requireCentreStaff } from "@/lib/auth";
import { BOOKING_LIST_SELECT } from "@/lib/bookings";

export const metadata: Metadata = { title: "Bookings" };

export default async function ManageBookingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/manage/${slug}/bookings`;
  const { supabase, centre } = await requireCentreStaff(slug, base);
  const { data } = await supabase.from("consultation_bookings").select(BOOKING_LIST_SELECT).eq("center_id", centre.id).order("starts_at").limit(300);
  const { current, past } = splitBookings(data ?? []);
  const waiting = current.filter((b) => b.status !== "confirmed");
  const upcoming = current.filter((b) => b.status === "confirmed");

  return (
    <>
      <h2>Session bookings</h2>
      <p className="muted">
        Requests for all mentors and experts at {centre.name}. A request stays pending until the expert (or you) confirms it. UdyamSetu never
        takes payments.
      </p>
      <h3>Waiting for a reply ({waiting.length})</h3>
      {waiting.length ? <BookingTable bookings={waiting} basePath={base} show="startup" caption="Requests waiting for a reply" /> : <p className="muted">None.</p>}
      <h3>Confirmed and upcoming ({upcoming.length})</h3>
      {upcoming.length ? <BookingTable bookings={upcoming} basePath={base} show="startup" caption="Confirmed sessions" /> : <p className="muted">None.</p>}
      {past.length ? (
        <>
          <h3>Past and closed</h3>
          <BookingTable bookings={past.reverse()} basePath={base} show="startup" caption="Past and closed bookings" />
        </>
      ) : null}
    </>
  );
}
