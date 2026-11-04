import { managerBookingAction } from "@/app/actions/bookings";
import { ActionForm, Field, Select, SubmitButton, TextArea } from "@/components/form";
import { formatTimeRange } from "@/lib/format";
import type { BookingRow } from "@/lib/bookings";

// What the expert (or centre staff) can do next with a request. The platform never takes payment.
export function ManagerBookingActions({ booking, returnPath, openSlots }: { booking: BookingRow; returnPath: string; openSlots: { id: string; starts_at: string; ends_at: string }[] }) {
  const action = managerBookingAction.bind(null, returnPath, booking.id);
  const open = booking.status === "pending" || booking.status === "payment_instructions_sent";
  const started = new Date(booking.starts_at).getTime() <= Date.now();

  if (open) {
    return (
      <div className="stack">
        {booking.is_paid ? (
          <details className="card" open={booking.status === "pending"}>
            <summary>{booking.status === "pending" ? "1. Send payment instructions" : "Update payment instructions"}</summary>
            <ActionForm action={action}>
              <input type="hidden" name="action" value="send_payment_instructions" />
              <TextArea
                name="payment_instructions"
                label="How the founder should pay you"
                required
                rows={4}
                defaultValue={booking.payment_instructions}
                hint="For example your preferred payment method and any reference to include. The founder pays you directly. UdyamSetu doesn't collect or check payments, and don't ask for payment screenshots here."
              />
              <TextArea name="note" label="Note to the founder" rows={2} />
              <SubmitButton pendingText="Sending…">Send instructions</SubmitButton>
            </ActionForm>
          </details>
        ) : null}

        <details className="card" open={!booking.is_paid || booking.status === "payment_instructions_sent"}>
          <summary>{booking.is_paid ? "2. Confirm once you've been paid" : "Confirm the session"}</summary>
          <ActionForm action={action}>
            <input type="hidden" name="action" value="confirm" />
            {booking.format === "online" ? (
              <Field name="meeting_link" label="Meeting link" type="url" required placeholder="https://" hint="Shared with the founder only after you confirm." />
            ) : (
              <Field name="meeting_location" label="Meeting place" required defaultValue={booking.meeting_location} />
            )}
            <TextArea name="note" label="Note to the founder" rows={2} />
            <SubmitButton pendingText="Confirming…">Confirm session</SubmitButton>
          </ActionForm>
        </details>

        <details className="card">
          <summary>Suggest another time</summary>
          {openSlots.length ? (
            <ActionForm action={action}>
              <input type="hidden" name="action" value="propose_time" />
              <Select
                name="proposed_slot_id"
                label="Open time"
                required
                options={openSlots.slice(0, 40).map((s) => ({ value: s.id, label: formatTimeRange(s.starts_at, s.ends_at) }))}
              />
              <TextArea name="note" label="Note to the founder" rows={2} />
              <SubmitButton pendingText="Sending…">Suggest this time</SubmitButton>
            </ActionForm>
          ) : (
            <p className="muted small">There are no other open times. Add availability first.</p>
          )}
        </details>

        <details className="card">
          <summary>Decline</summary>
          <ActionForm action={action}>
            <input type="hidden" name="action" value="decline" />
            <TextArea name="note" label="Reason (shared with the founder)" rows={2} />
            <SubmitButton variant="danger" pendingText="Declining…">
              Decline request
            </SubmitButton>
          </ActionForm>
        </details>
      </div>
    );
  }

  if (booking.status === "confirmed") {
    return (
      <div className="stack">
        {started ? (
          <div className="card stack">
            <h3>How did it go?</h3>
            <ActionForm action={action} className="actions">
              <input type="hidden" name="action" value="complete" />
              <SubmitButton pendingText="Saving…">Mark as completed</SubmitButton>
            </ActionForm>
            <ActionForm action={action} className="actions">
              <input type="hidden" name="action" value="no_show" />
              <SubmitButton variant="secondary" pendingText="Saving…">
                Founder didn&apos;t attend
              </SubmitButton>
            </ActionForm>
          </div>
        ) : null}
        <details className="card">
          <summary>Cancel this session</summary>
          <ActionForm action={action}>
            <input type="hidden" name="action" value="cancel" />
            <TextArea name="note" label="Reason (shared with the founder)" rows={2} />
            <SubmitButton variant="danger" pendingText="Cancelling…">
              Cancel session
            </SubmitButton>
          </ActionForm>
        </details>
      </div>
    );
  }

  return <p className="muted">This booking is closed. Nothing more to do.</p>;
}
