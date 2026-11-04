import type { Metadata } from "next";
import { BookingTable, splitBookings } from "@/components/bookings/booking-table";
import { Notice } from "@/components/notice";
import { denyAccess, requireUser } from "@/lib/auth";
import { BOOKING_LIST_SELECT } from "@/lib/bookings";

export const metadata: Metadata = { title: "Expert workspace" };

export default async function ExpertHomePage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const { supabase, experts } = await requireUser("/expert");
  if (!experts.length) return denyAccess("/expert");
  const { data } = await supabase
    .from("consultation_bookings")
    .select(BOOKING_LIST_SELECT)
    .in(
      "expert_id",
      experts.map((e) => e.id),
    )
    .order("starts_at")
    .limit(300);
  const { current, past } = splitBookings(data ?? []);
  const waiting = current.filter((b) => b.status !== "confirmed");
  const upcoming = current.filter((b) => b.status === "confirmed");

  return (
    <>
      <Notice code={notice} />
      <h1>Requests and sessions</h1>
      <p className="muted">
        Founders&apos; requests stay pending until you confirm. For paid sessions, send payment instructions first; the founder pays you
        directly and you confirm here. UdyamSetu never takes payments.
      </p>
      <h2 className="h3">Waiting for your reply ({waiting.length})</h2>
      {waiting.length ? <BookingTable bookings={waiting} basePath="/expert/bookings" show="startup" caption="Requests waiting for your reply" /> : <p className="muted">None.</p>}
      <h2 className="h3">Confirmed and upcoming ({upcoming.length})</h2>
      {upcoming.length ? <BookingTable bookings={upcoming} basePath="/expert/bookings" show="startup" caption="Confirmed sessions" /> : <p className="muted">None.</p>}
      {past.length ? (
        <>
          <h2 className="h3">Past and closed</h2>
          <BookingTable bookings={past.reverse()} basePath="/expert/bookings" show="startup" caption="Past and closed bookings" />
        </>
      ) : null}
    </>
  );
}
