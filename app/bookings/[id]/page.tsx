import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { founderBookingAction } from "@/app/actions/bookings";
import { BookingDetails, BookingHistory } from "@/components/bookings/booking-details";
import { ConfirmButton } from "@/components/confirm-button";
import { SubmitButton } from "@/components/form";
import { Notice } from "@/components/notice";
import { requireUser } from "@/lib/auth";
import { loadBooking, openSlots } from "@/lib/bookings";
import { formatTimeRange } from "@/lib/format";

export const metadata: Metadata = { title: "Session request" };

export default async function FounderBookingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { id } = await params;
  const { notice, error } = await searchParams;
  const { supabase, user } = await requireUser(`/bookings/${id}`);
  const loaded = await loadBooking(supabase, id);
  if (!loaded || loaded.booking.founder_id !== user.id) notFound();
  const { booking, events } = loaded;
  const expert = booking.center_experts;
  const live = booking.status === "pending" || booking.status === "payment_instructions_sent" || booking.status === "confirmed";

  // Founders can't read slots directly; a suggested time is shown if it is still open.
  const proposed = booking.proposed_slot_id && expert ? (await openSlots(supabase, expert.id)).find((s) => s.id === booking.proposed_slot_id) : undefined;

  return (
    <article className="narrow">
      <p className="breadcrumbs">
        <Link href="/bookings">My sessions</Link>
      </p>
      <Notice code={notice} error={error} />
      <h1>Session with {expert?.full_name ?? "an expert"}</h1>
      <p className="muted">
        {[expert?.headline, expert?.organization].filter(Boolean).join(" · ")}
        {booking.incubation_centers ? (
          <>
            {" · "}
            <Link href={`/centres/${booking.incubation_centers.slug}`}>{booking.incubation_centers.name}</Link>
          </>
        ) : null}
      </p>

      {booking.status === "pending" ? (
        <p className="alert alert-info">
          {booking.is_paid
            ? "Waiting for the expert. They will either send you payment instructions or reply to your request."
            : "Waiting for the mentor to confirm. If they don't reply, the request stays pending and you can cancel it at any time."}
        </p>
      ) : null}
      {booking.status === "payment_instructions_sent" ? (
        <p className="alert alert-info">
          The expert sent payment instructions below. Pay them directly, then wait for them to confirm the session here.
        </p>
      ) : null}

      {booking.proposed_slot_id ? (
        <section className="card highlight" aria-labelledby="proposal">
          <h2 id="proposal" className="h3">
            The expert suggested another time
          </h2>
          {booking.proposed_note ? <p className="pre-line">{booking.proposed_note}</p> : null}
          {proposed ? (
            <form action={founderBookingAction.bind(null, booking.id, "accept_proposal")} className="stack">
              <p>
                <strong>{formatTimeRange(proposed.starts_at, proposed.ends_at)}</strong> (India time)
              </p>
              <div className="actions">
                <SubmitButton pendingText="Accepting…">Accept this time</SubmitButton>
              </div>
            </form>
          ) : (
            <p className="muted">That time is no longer available. You can wait for the expert to reply, or cancel and choose another time.</p>
          )}
        </section>
      ) : null}

      <BookingDetails booking={booking} viewer="founder" />

      {live ? (
        <form action={founderBookingAction.bind(null, booking.id, "cancel")} className="stack card">
          <h2 className="h3">Cancel this {booking.status === "confirmed" ? "session" : "request"}</h2>
          <div className="field">
            <label htmlFor="note">
              Reason <span className="optional">(optional)</span>
            </label>
            <textarea id="note" name="note" rows={2} />
          </div>
          <div className="actions">
            <ConfirmButton message="Cancel this session request?">Cancel {booking.status === "confirmed" ? "session" : "request"}</ConfirmButton>
          </div>
        </form>
      ) : null}

      {expert ? (
        <p>
          <Link href={`/experts/${expert.id}`}>View {expert.full_name}&apos;s profile</Link>
        </p>
      ) : null}
      <BookingHistory events={events} expertName={expert?.full_name ?? "Expert"} />
    </article>
  );
}
