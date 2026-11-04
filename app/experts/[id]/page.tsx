import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requestBooking } from "@/app/actions/bookings";
import { feeLabel, formatsLabel } from "@/components/experts/expert-card";
import { ActionForm, RadioGroup, SubmitButton, TextArea } from "@/components/form";
import { SampleBadge } from "@/components/status";
import { getViewer } from "@/lib/auth";
import { messageForCode } from "@/lib/errors";
import { formatTimeRange } from "@/lib/format";
import { policyExplanation } from "@/lib/options";

export const metadata: Metadata = { title: "Mentor or expert" };

export default async function ExpertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getViewer();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: expert } = await supabase
    .from("center_experts")
    .select("*, incubation_centers(slug, name, is_sample, status)")
    .eq("id", id)
    .maybeSingle();
  if (!expert || !expert.incubation_centers) notFound();
  const centre = expert.incubation_centers;

  let eligibility: string | null = "not_signed_in";
  let slots: { id: string; starts_at: string; ends_at: string }[] = [];
  let liveRequest: { id: string; status: string } | null = null;
  if (user) {
    const [{ data: reason }, { data: open }, { data: existing }] = await Promise.all([
      supabase.rpc("booking_eligibility", { p_expert_id: id }),
      supabase.rpc("available_slots", { p_expert_id: id }),
      supabase
        .from("consultation_bookings")
        .select("id, status")
        .eq("expert_id", id)
        .eq("founder_id", user.id)
        .in("status", ["pending", "payment_instructions_sent", "confirmed"])
        .limit(1)
        .maybeSingle(),
    ]);
    eligibility = reason ?? null;
    slots = open ?? [];
    liveRequest = existing;
  }

  const formatOptions = [
    ...(expert.offers_online ? [{ value: "online", label: "Online", description: "The meeting link is shared once the expert confirms." }] : []),
    ...(expert.offers_in_person ? [{ value: "in_person", label: "In person", description: expert.in_person_location ?? undefined }] : []),
  ];

  return (
    <article className="narrow">
      <p className="breadcrumbs">
        <Link href={`/centres/${centre.slug}`}>{centre.name}</Link>
      </p>
      <h1>{expert.full_name}</h1>
      <p className="muted">
        {[expert.headline, expert.organization].filter(Boolean).join(" · ")} <SampleBadge show={centre.is_sample} />
      </p>
      {!expert.is_active ? <p className="alert alert-info">This profile is inactive and isn&apos;t taking requests.</p> : null}
      {expert.bio ? <p className="pre-line">{expert.bio}</p> : null}
      {expert.expertise_tags.length ? (
        <ul className="tags plain">
          {expert.expertise_tags.map((tag) => (
            <li className="badge badge-quiet" key={tag}>
              {tag}
            </li>
          ))}
        </ul>
      ) : null}

      <dl className="details">
        <div>
          <dt>Centre</dt>
          <dd>
            <Link href={`/centres/${centre.slug}`}>{centre.name}</Link>
          </dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{expert.is_paid ? "Paid consulting" : "Free mentorship"}</dd>
        </div>
        <div>
          <dt>Session</dt>
          <dd>{feeLabel(expert)}</dd>
        </div>
        <div>
          <dt>Format</dt>
          <dd>{formatsLabel(expert)}</dd>
        </div>
        {expert.offers_in_person && expert.in_person_location ? (
          <div>
            <dt>In-person meetings at</dt>
            <dd>{expert.in_person_location}</dd>
          </div>
        ) : null}
        <div>
          <dt>Who can book</dt>
          <dd>{policyExplanation(expert.engagement_policy)}</dd>
        </div>
      </dl>

      <section aria-labelledby="request" className="card">
        <h2 id="request" className="h3">
          Request a session
        </h2>
        {expert.is_paid ? (
          <p className="alert alert-info">
            UdyamSetu doesn&apos;t take payments. After you request a time, the expert sends you payment instructions here.
            You pay them directly, and they confirm the session. Until then your request is <strong>pending</strong>.
          </p>
        ) : (
          <p className="muted">Your request is pending until the mentor confirms it.</p>
        )}

        {!user ? (
          <p>
            <Link href={`/login?next=/experts/${expert.id}`}>Log in</Link> or <Link href="/register">register as a founder</Link> to request a session.
          </p>
        ) : liveRequest ? (
          <p>
            You already have a request with this expert. <Link href={`/bookings/${liveRequest.id}`}>View your request</Link>
          </p>
        ) : eligibility ? (
          <p className="alert alert-error">
            {messageForCode(eligibility) ?? "You can't book this expert right now."}{" "}
            {eligibility === "no_startup" ? <Link href="/venture">Create your venture profile</Link> : null}
          </p>
        ) : slots.length === 0 ? (
          <p className="empty">There are no open times right now. Check back later, or look at other mentors at this centre.</p>
        ) : (
          <ActionForm action={requestBooking.bind(null, expert.id)}>
            <RadioGroup
              name="slot_id"
              legend="Choose a time (India time)"
              options={slots.slice(0, 30).map((slot) => ({ value: slot.id, label: formatTimeRange(slot.starts_at, slot.ends_at) }))}
            />
            {formatOptions.length > 1 ? (
              <RadioGroup name="format" legend="Format" options={formatOptions} />
            ) : (
              <>
                <input type="hidden" name="format" value={formatOptions[0]?.value} />
                <p className="muted">Format: {formatOptions[0]?.label}</p>
              </>
            )}
            <TextArea name="note" label="What would you like to discuss?" hint="A short agenda helps the expert prepare. Don't include payment details." rows={3} />
            <SubmitButton pendingText="Sending request…">Send request</SubmitButton>
          </ActionForm>
        )}
      </section>
    </article>
  );
}
