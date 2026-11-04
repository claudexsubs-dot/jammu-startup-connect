"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { requestBooking } from "@/app/actions/bookings";
import { ActionForm, Field, Select, SubmitButton, useActionFormState } from "@/components/form";
import { Icons } from "@/components/icons";

export type Slot = { id: string; starts_at: string; ends_at: string };

type Props = {
  expertId: string;
  slots: Slot[];
  offersOnline: boolean;
  offersInPerson: boolean;
  inPersonLocation: string | null;
  isPaid: boolean;
  priceLabel: string;
  signedIn: boolean;
  needsStartup: boolean;
  stages: { value: string; label: string }[];
  initialSlotId?: string;
};

const TZ = "Asia/Kolkata";
const dayKey = (iso: string) => new Date(new Date(iso).getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: TZ });
const longDay = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });

function groupByDay(slots: Slot[]) {
  const days = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = dayKey(slot.starts_at);
    days.set(key, [...(days.get(key) ?? []), slot]);
  }
  return [...days.entries()].map(([key, list]) => ({ key, slots: list }));
}

// Pick a day, tap a time, send. Everything happens in this one panel.
export function BookingPanel(props: Props) {
  const days = useMemo(() => groupByDay(props.slots), [props.slots]);
  const initial = props.slots.find((s) => s.id === props.initialSlotId) ?? null;
  const [slotId, setSlotId] = useState<string | null>(initial?.id ?? null);
  const [day, setDay] = useState<string | null>(initial ? dayKey(initial.starts_at) : (days[0]?.key ?? null));
  const chosen = props.slots.find((s) => s.id === slotId) ?? null;
  const current = days.find((d) => d.key === day) ?? days[0];

  if (!props.slots.length) {
    return (
      <div className="empty" style={{ textAlign: "left" }}>
        <p>
          <strong>No open times right now.</strong>
        </p>
        <p className="small">New times usually appear every week. Check back soon, or browse other experts.</p>
        <Link href="/experts" className="btn btn-secondary btn-small">
          See other experts
        </Link>
      </div>
    );
  }

  const picker = (
    <>
      <div className="day-strip" role="group" aria-label="Choose a day">
        {days.map((d) => {
          const date = new Date(d.slots[0].starts_at);
          return (
            <button key={d.key} type="button" className="day-chip" aria-pressed={d.key === current?.key} onClick={() => setDay(d.key)} aria-label={`${longDay(d.slots[0].starts_at)}, ${d.slots.length} open`}>
              <span className="dow">{date.toLocaleDateString("en-IN", { weekday: "short", timeZone: TZ })}</span>
              <span className="dom">{date.toLocaleDateString("en-IN", { day: "numeric", timeZone: TZ })}</span>
              <span className="cnt">{d.slots.length} open</span>
            </button>
          );
        })}
      </div>
      {current ? (
        <fieldset className="time-grid">
          <legend>{longDay(current.slots[0].starts_at)} · India time</legend>
          {current.slots.map((s) => (
            <label key={s.id} className="time-chip">
              <input type="radio" name="slot_choice" value={s.id} checked={slotId === s.id} onChange={() => setSlotId(s.id)} />
              <span>{time(s.starts_at)}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
    </>
  );

  if (!props.signedIn) {
    const next = `/experts/${props.expertId}${slotId ? `?slot=${slotId}` : ""}`;
    return (
      <div className="stack">
        {picker}
        {chosen ? <ChosenTime slot={chosen} /> : null}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="btn btn-primary btn-large btn-block">
          {chosen ? "Continue to book" : "Create a free account to book"}
        </Link>
        <p className="muted small" style={{ margin: 0, textAlign: "center" }}>
          Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>. Your chosen time is kept.
        </p>
      </div>
    );
  }

  const formats = [
    ...(props.offersOnline ? [{ value: "online", label: "Online", icon: <Icons.video /> }] : []),
    ...(props.offersInPerson ? [{ value: "in_person", label: "In person", icon: <Icons.pin /> }] : []),
  ];

  return (
    <ActionForm action={requestBooking.bind(null, props.expertId)}>
      {picker}
      <input type="hidden" name="slot_id" value={slotId ?? ""} />
      <SlotError />
      {chosen ? <ChosenTime slot={chosen} /> : null}

      {formats.length > 1 ? (
        <fieldset className="segmented">
          <legend>How would you like to meet?</legend>
          {formats.map((f, i) => (
            <label key={f.value}>
              <input type="radio" name="format" value={f.value} defaultChecked={i === 0} />
              <span>
                {f.icon} {f.label}
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <>
          <input type="hidden" name="format" value={formats[0]?.value} />
          <p className="meta-line">
            <span>
              {formats[0]?.icon} {formats[0]?.label} session
              {formats[0]?.value === "in_person" && props.inPersonLocation ? ` at ${props.inPersonLocation}` : ""}
            </span>
          </p>
        </>
      )}

      {props.needsStartup ? (
        <div className="declaration">
          <input type="hidden" name="quick_start" value="1" />
          <p style={{ margin: 0 }}>
            <strong>One quick thing:</strong> which startup is this for? We&apos;ll save it as a draft venture profile you can
            finish later.
          </p>
          <Field name="startup_name" label="Startup name" required placeholder="e.g. Saffron Route Logistics" />
          <Select name="stage_id" label="Stage" options={props.stages} placeholder="Not sure yet" />
        </div>
      ) : null}

      <details>
        <summary className="small">Add a note for the expert (optional)</summary>
        <Field name="note" label="What would you like to discuss?" hint="A short agenda helps them prepare. Don't include payment details." />
      </details>

      <SubmitButton pendingText="Sending request…">{chosen ? `Request ${time(chosen.starts_at)}` : "Request this time"}</SubmitButton>
      <p className="muted small" style={{ margin: 0 }}>
        {props.isPaid
          ? `Fee: ${props.priceLabel}. You only pay after the expert confirms, directly to them. UdyamSetu never takes payments.`
          : "Free session. It's confirmed once the mentor accepts."}
      </p>
    </ActionForm>
  );
}

function ChosenTime({ slot }: { slot: Slot }) {
  return (
    <p className="chosen-time" role="status" style={{ margin: 0 }}>
      <Icons.check /> {longDay(slot.starts_at)}, {time(slot.starts_at)} – {time(slot.ends_at)}
    </p>
  );
}

function SlotError() {
  const state = useActionFormState();
  const error = state.fieldErrors?.slot_id;
  return error ? (
    <p className="field-error" role="alert">
      {error}
    </p>
  ) : null;
}
