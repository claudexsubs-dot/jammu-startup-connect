import type { Metadata } from "next";
import Link from "next/link";
import { BookingTable, splitBookings } from "@/components/bookings/booking-table";
import { Notice } from "@/components/notice";
import { requireUser } from "@/lib/auth";
import { BOOKING_LIST_SELECT } from "@/lib/bookings";

export const metadata: Metadata = { title: "My sessions" };

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const { supabase, user } = await requireUser("/bookings");
  const { data } = await supabase.from("consultation_bookings").select(BOOKING_LIST_SELECT).eq("founder_id", user.id).order("starts_at");
  const { current, past } = splitBookings(data ?? []);

  return (
    <>
      <Notice code={notice} />
      <div className="section-head">
        <h1>My mentor and expert sessions</h1>
        <Link href="/experts" className="btn btn-primary">
          Book a new session
        </Link>
      </div>
      <p className="muted">
        A request stays <strong>pending</strong> until the mentor or expert confirms it. UdyamSetu never takes payments: for paid
        sessions the expert sends payment instructions and you pay them directly.
      </p>
      <h2>Requests and upcoming sessions</h2>
      {current.length ? (
        <BookingTable bookings={current} basePath="/bookings" show="expert" caption="Requests and upcoming sessions" />
      ) : (
        <div className="empty">
          <p>Nothing pending or coming up.</p>
          <Link href="/experts" className="btn btn-primary">
            Find a mentor or expert
          </Link>
        </div>
      )}
      {past.length ? (
        <>
          <h2>Past and closed</h2>
          <BookingTable bookings={past} basePath="/bookings" show="expert" caption="Past and closed sessions" />
        </>
      ) : null}
    </>
  );
}
