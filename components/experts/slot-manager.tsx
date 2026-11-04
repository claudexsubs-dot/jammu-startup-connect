import { addSlot, removeSlot } from "@/app/actions/bookings";
import { ConfirmButton } from "@/components/confirm-button";
import { ActionForm, Field, Select, SubmitButton } from "@/components/form";
import { BookingStatusBadge } from "@/components/status";
import { formatTimeRange } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

export type SlotRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  is_cancelled: boolean;
  consultation_bookings: { id: string; status: BookingStatus }[];
};

const LIVE: BookingStatus[] = ["pending", "payment_instructions_sent", "confirmed"];

// Upcoming availability for one expert, with forms to add and remove times.
export function SlotManager({ expertId, returnPath, slots, sessionMinutes, bookingBasePath }: { expertId: string; returnPath: string; slots: SlotRow[]; sessionMinutes: number; bookingBasePath: string }) {
  return (
    <section aria-labelledby="availability" className="stack">
      <h2 id="availability" className="h3">
        Availability
      </h2>
      <p className="muted small">Times are in India time. Founders only see open times. A time with a live request can&apos;t be removed until the request is closed.</p>
      {slots.length ? (
        <ul className="slot-list">
          {slots.map((slot) => {
            const live = slot.consultation_bookings.find((b) => LIVE.includes(b.status));
            return (
              <li key={slot.id}>
                <span>{formatTimeRange(slot.starts_at, slot.ends_at)}</span>
                {live ? (
                  <a href={`${bookingBasePath}/${live.id}`}>
                    <BookingStatusBadge status={live.status} />
                  </a>
                ) : (
                  <>
                    <span className="badge badge-quiet">Open</span>
                    <form action={removeSlot.bind(null, slot.id, returnPath)}>
                      <ConfirmButton message="Remove this time?" className="link-button danger-link">
                        Remove
                      </ConfirmButton>
                    </form>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="empty">No upcoming times. Add some so founders can request a session.</p>
      )}
      <details className="card">
        <summary>Add a time</summary>
        <ActionForm action={addSlot.bind(null, expertId, returnPath)}>
          <Field name="starts_at" label="Starts at (India time)" type="datetime-local" required />
          <Field name="minutes" label="Length in minutes" type="number" min="15" max="480" step="5" defaultValue={sessionMinutes} required />
          <Select
            name="repeat_weeks"
            label="Repeat"
            placeholder={null}
            options={[1, 2, 4, 6, 8].map((n) => ({ value: String(n), label: n === 1 ? "Just once" : `Every week for ${n} weeks` }))}
            defaultValue="1"
          />
          <SubmitButton pendingText="Adding…">Add availability</SubmitButton>
        </ActionForm>
      </details>
    </section>
  );
}
