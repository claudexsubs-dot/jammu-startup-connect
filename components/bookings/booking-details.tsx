import { BookingStatusBadge } from "@/components/status";
import { ExternalLink } from "@/components/external-link";
import { formatDateTime, formatInr, formatTimeRange, timeUntil } from "@/lib/format";
import { SESSION_FORMATS, labelFor } from "@/lib/options";
import type { BookingRow, LoadedBooking } from "@/lib/bookings";

// The facts of a session request, shown to the founder and to whoever manages the expert.
export function BookingDetails({ booking, viewer }: { booking: BookingRow; viewer: "founder" | "manager" }) {
  const confirmed = booking.status === "confirmed";
  const upcoming = confirmed && new Date(booking.starts_at).getTime() > Date.now();
  return (
    <>
      {upcoming ? (
        <p className="alert alert-success" role="status">
          <strong>Reminder:</strong> {timeUntil(booking.starts_at)} · {formatTimeRange(booking.starts_at, booking.ends_at)} (India time)
        </p>
      ) : null}
      <dl className="details">
        <div>
          <dt>Status</dt>
          <dd>
            <BookingStatusBadge status={booking.status} />
          </dd>
        </div>
        <div>
          <dt>Time (India time)</dt>
          <dd>{formatTimeRange(booking.starts_at, booking.ends_at)}</dd>
        </div>
        <div>
          <dt>Format</dt>
          <dd>{labelFor(SESSION_FORMATS, booking.format)}</dd>
        </div>
        <div>
          <dt>Fee</dt>
          <dd>{booking.is_paid ? `${formatInr(booking.fee_inr)}, paid directly to the expert` : "Free"}</dd>
        </div>
        {viewer === "manager" && booking.startups ? (
          <div>
            <dt>Startup</dt>
            <dd>{booking.startups.name}</dd>
          </div>
        ) : null}
        <div>
          <dt>Requested</dt>
          <dd>{formatDateTime(booking.created_at)}</dd>
        </div>
      </dl>

      {booking.founder_note ? (
        <section className="card">
          <h2 className="h3">What the founder wants to discuss</h2>
          <p className="pre-line">{booking.founder_note}</p>
        </section>
      ) : null}

      {booking.payment_instructions && !["declined", "cancelled"].includes(booking.status) ? (
        <section className="card">
          <h2 className="h3">Payment instructions from the expert</h2>
          <p className="pre-line">{booking.payment_instructions}</p>
          <p className="muted small">
            UdyamSetu does not take or check payments. The founder pays the expert directly, and the expert confirms the
            session here. Don&apos;t send card details or payment screenshots through UdyamSetu.
          </p>
        </section>
      ) : null}

      {confirmed ? (
        <section className="card">
          <h2 className="h3">How to join</h2>
          {booking.format === "online" ? (
            booking.meeting_link ? (
              <p>
                Meeting link: <ExternalLink href={booking.meeting_link}>{booking.meeting_link}</ExternalLink>
              </p>
            ) : (
              <p className="muted">The expert hasn&apos;t added a meeting link.</p>
            )
          ) : (
            <p>Meet at: {booking.meeting_location ?? "the expert will share the place"}</p>
          )}
        </section>
      ) : null}

      {booking.expert_note ? (
        <section className="card">
          <h2 className="h3">Note from the expert</h2>
          <p className="pre-line">{booking.expert_note}</p>
        </section>
      ) : null}
    </>
  );
}

export function BookingHistory({ events, expertName }: { events: LoadedBooking["events"]; expertName: string }) {
  if (!events.length) return null;
  return (
    <section aria-labelledby="history">
      <h2 id="history" className="h3">
        History
      </h2>
      <ol className="timeline">
        {events.map((event) => (
          <li key={event.id}>
            <div className="timeline-head">
              <BookingStatusBadge status={event.to_status} />
              <span className="muted small">
                {formatDateTime(event.created_at)} · {event.actor_side === "founder" ? "Founder" : expertName}
              </span>
            </div>
            {event.note ? <p className="pre-line timeline-note">{event.note}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
