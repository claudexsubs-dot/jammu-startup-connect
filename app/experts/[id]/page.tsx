import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingPanel } from "@/components/experts/booking-panel";
import { feeLabel, formatsLabel, Price } from "@/components/experts/expert-card";
import { Icons } from "@/components/icons";
import { SampleBadge } from "@/components/status";
import { getViewer } from "@/lib/auth";
import { messageForCode } from "@/lib/errors";
import { formatSlotShort, initials } from "@/lib/format";
import { policyExplanation } from "@/lib/options";
import { loadTaxonomy } from "@/lib/taxonomy";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { title: "Mentor or expert" };
  const { supabase } = await getViewer();
  const { data } = await supabase.from("center_experts").select("full_name").eq("id", id).maybeSingle();
  return { title: data ? `Book ${data.full_name}` : "Mentor or expert" };
}

export default async function ExpertPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ slot?: string }>;
}) {
  const { id } = await params;
  const { slot } = await searchParams;
  const { supabase, user, roles } = await getViewer();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: expert } = await supabase
    .from("center_experts")
    .select("*, incubation_centers(slug, name, is_sample, status, district, city)")
    .eq("id", id)
    .maybeSingle();
  if (!expert || !expert.incubation_centers) notFound();
  const centre = expert.incubation_centers;

  const { data: open } = await supabase.rpc("available_slots", { p_expert_id: id });
  const slots = open ?? [];

  let eligibility: string | null = null;
  let liveRequest: { id: string; status: string } | null = null;
  if (user) {
    const [{ data: reason }, { data: existing }] = await Promise.all([
      supabase.rpc("booking_eligibility", { p_expert_id: id }),
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
    liveRequest = existing;
  }
  const shortName = expert.full_name.replace(/^(Dr\.?|Er\.?|CA|Prof\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, "").split(" ")[0];
  const needsStartup = eligibility === "no_startup" && roles.includes("founder");
  const blocked = user && eligibility && !needsStartup ? eligibility : null;
  const stages = needsStartup ? (await loadTaxonomy(supabase)).stages.map((s) => ({ value: String(s.id), label: s.name })) : [];

  return (
    <div className="has-book-bar">
      <p className="breadcrumbs">
        <Link href="/experts">
          <Icons.back /> All experts
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/centres/${centre.slug}`}>{centre.name}</Link>
      </p>

      <div className="booking-layout">
        <article>
          <div className="profile-hero">
            <span className="avatar avatar-xl" aria-hidden="true">
              {initials(expert.full_name)}
            </span>
            <div className="grow">
              <h1>{expert.full_name}</h1>
              <p className="muted" style={{ margin: 0 }}>
                {[expert.headline, expert.organization].filter(Boolean).join(" · ")}
              </p>
              <p className="meta-line" style={{ marginTop: 8 }}>
                <span>
                  <Icons.building /> <Link href={`/centres/${centre.slug}`}>{centre.name}</Link>
                </span>
                <span className={`badge ${expert.is_paid ? "badge-accent" : "badge-live"}`}>{expert.is_paid ? "Paid consulting" : "Free mentorship"}</span>
                <SampleBadge show={centre.is_sample} />
              </p>
            </div>
          </div>

          {!expert.is_active ? <p className="alert alert-info">This profile is inactive and isn&apos;t taking requests.</p> : null}

          <dl className="facts-row">
            <div className="fact">
              <Icons.rupee />
              <dt>Fee</dt>
              <dd>
                <Price expert={expert} />
              </dd>
            </div>
            <div className="fact">
              <Icons.video />
              <dt>Format</dt>
              <dd>{formatsLabel(expert)}</dd>
            </div>
            <div className="fact">
              <Icons.clock />
              <dt>Next open time</dt>
              <dd>{slots[0] ? formatSlotShort(slots[0].starts_at) : "None yet"}</dd>
            </div>
            <div className="fact">
              <Icons.users />
              <dt>Who can book</dt>
              <dd className="small">{policyExplanation(expert.engagement_policy)}</dd>
            </div>
          </dl>

          {expert.bio ? (
            <section aria-labelledby="about">
              <h2 id="about">About</h2>
              <p className="pre-line">{expert.bio}</p>
            </section>
          ) : null}
          {expert.expertise_tags.length ? (
            <section aria-labelledby="topics">
              <h2 id="topics">Can help with</h2>
              <ul className="tags plain">
                {expert.expertise_tags.map((tag) => (
                  <li key={tag}>
                    <Link href={`/experts?topic=${encodeURIComponent(tag)}`}>{tag}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {expert.offers_in_person && expert.in_person_location ? (
            <section aria-labelledby="where">
              <h2 id="where">Where in-person sessions happen</h2>
              <p className="meta-line">
                <span>
                  <Icons.pin /> {expert.in_person_location}
                </span>
              </p>
            </section>
          ) : null}
          <section aria-labelledby="what-next">
            <h2 id="what-next">What happens after you request</h2>
            <ul className="trust-list">
              <li>
                <Icons.check /> Your request is <strong>pending</strong> and that time is held for you.
              </li>
              <li>
                <Icons.check /> {shortName} confirms, or suggests another time. You&apos;re notified either way.
              </li>
              <li>
                <Icons.check />
                {expert.is_paid
                  ? " For paid sessions they send payment instructions. You pay them directly; UdyamSetu never handles money."
                  : " Free sessions need no payment."}
              </li>
              <li>
                <Icons.shield /> Your email and phone stay private unless you choose to share them.
              </li>
            </ul>
          </section>
        </article>

        <aside className="booking-panel" id="book" aria-labelledby="book-title">
          <div className="booking-summary">
            <h2 id="book-title">Book a session</h2>
            <Price expert={expert} />
          </div>
          {!expert.is_active ? (
            <p className="muted">This profile isn&apos;t taking requests.</p>
          ) : liveRequest ? (
            <div className="stack">
              <p className="alert alert-success" style={{ margin: 0 }}>
                You already have a request with {shortName}.
              </p>
              <Link href={`/bookings/${liveRequest.id}`} className="btn btn-primary btn-block">
                View your request
              </Link>
            </div>
          ) : blocked ? (
            <div className="stack">
              <p className="alert alert-info" style={{ margin: 0 }}>
                {messageForCode(blocked) ?? "You can't book this expert right now."}
              </p>
              <Link href="/experts" className="btn btn-secondary btn-block">
                Find another expert
              </Link>
            </div>
          ) : user && !roles.includes("founder") && eligibility === "no_startup" ? (
            <p className="alert alert-info">Sessions are booked by founder accounts. Your account is a staff or expert account.</p>
          ) : (
            <BookingPanel
              expertId={expert.id}
              slots={slots}
              offersOnline={expert.offers_online}
              offersInPerson={expert.offers_in_person}
              inPersonLocation={expert.in_person_location}
              isPaid={expert.is_paid}
              priceLabel={feeLabel(expert)}
              signedIn={Boolean(user)}
              needsStartup={needsStartup}
              stages={stages}
              initialSlotId={slot}
            />
          )}
        </aside>
      </div>

      {expert.is_active && !liveRequest && !blocked && slots.length ? (
        <div className="mobile-book-bar">
          <Price expert={expert} />
          <a href="#book" className="btn btn-primary">
            Choose a time
          </a>
        </div>
      ) : null}
    </div>
  );
}
