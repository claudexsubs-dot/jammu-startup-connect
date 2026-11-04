import Link from "next/link";
import { centreInitials } from "@/components/centres/centre-card";
import { Icons } from "@/components/icons";
import { getViewer } from "@/lib/auth";
import { loadActiveCentres, type CentreSummary } from "@/lib/directory";
import { loadExpertDirectory, popularTopics, type DirectoryExpert } from "@/lib/experts";
import { formatInr, formatSlotShort, initials } from "@/lib/format";

export default async function HomePage() {
  const { supabase, user } = await getViewer();
  const [centres, experts] = await Promise.all([
    loadActiveCentres(supabase).catch(() => [] as CentreSummary[]),
    loadExpertDirectory(supabase).catch(() => [] as DirectoryExpert[]),
  ]);
  const openSlots = experts.reduce((sum, e) => sum + e.open_slots_14d, 0);
  const soonest = experts.filter((e) => e.next_slot_at).slice(0, 3);
  const topics = popularTopics(experts, 5);
  const featured = [...centres].sort((a, b) => Number(b.openForApplications) - Number(a.openForApplications) || b.expertCount - a.expertCount).slice(0, 6);

  return (
    <>
      <section className="home-hero">
        <div className="container">
          <div>
            <p className="eyebrow">
              <Icons.rocket /> For startup founders from Jammu
            </p>
            <h1>
              Expert advice and the right <span className="hl">incubation centre</span>, without the runaround
            </h1>
            <p className="lead">
              Book a session with a mentor or college expert in two taps, and find the incubation centres that fit your
              startup. Free for founders.
            </p>
            <form action="/experts" method="get" className="hero-search" role="search">
              <label>
                <Icons.search />
                <span className="visually-hidden">What do you need help with?</span>
                <input type="search" name="q" placeholder="What do you need help with? e.g. pricing, FSSAI" />
              </label>
              <button type="submit" className="btn btn-primary">
                Find an expert
              </button>
            </form>
            <div className="hero-chips">
              {topics.length ? <span>Popular:</span> : null}
              {topics.map((t) => (
                <Link key={t} href={`/experts?topic=${encodeURIComponent(t)}`} className="chip-link">
                  {t}
                </Link>
              ))}
              <Link href="/centres" className="chip-link">
                <Icons.building /> Browse incubation centres
              </Link>
            </div>
          </div>

          <aside className="hero-panel" aria-label="Experts available soon">
            <div className="row-between">
              <h2>Available soon</h2>
              <Link href="/experts" className="small">
                See all
              </Link>
            </div>
            {soonest.length ? (
              soonest.map((e) => (
                <Link key={e.id} href={`/experts/${e.id}`} className="mini-expert" style={{ textDecoration: "none", color: "inherit" }}>
                  <span className="avatar" aria-hidden="true">
                    {initials(e.full_name)}
                  </span>
                  <span className="grow">
                    <strong>{e.full_name}</strong>
                    <span className="muted small">{e.center_name}</span>
                  </span>
                  <span className="small" style={{ textAlign: "right" }}>
                    <strong className={e.is_paid ? "" : "price-free"}>{e.is_paid ? formatInr(e.fee_inr) : "Free"}</strong>
                    <span className="next-slot" style={{ fontSize: "0.78rem" }}>
                      {e.next_slot_at ? formatSlotShort(e.next_slot_at) : ""}
                    </span>
                  </span>
                </Link>
              ))
            ) : (
              <p className="muted small" style={{ margin: 0 }}>
                Centres are adding their mentors and experts. Open times will appear here.
              </p>
            )}
            <Link href="/experts" className="btn btn-primary btn-block">
              <Icons.calendar /> Book a session
            </Link>
          </aside>
        </div>
      </section>

      <ul className="stats-strip" aria-label="UdyamSetu at a glance">
        <li>
          <strong>{centres.length}</strong>
          <span>incubation centres listed</span>
        </li>
        <li>
          <strong>{experts.length}</strong>
          <span>mentors and experts</span>
        </li>
        <li>
          <strong>{openSlots}</strong>
          <span>open session times, next 2 weeks</span>
        </li>
        <li>
          <strong>₹0</strong>
          <span>platform fee for founders</span>
        </li>
      </ul>

      <section aria-labelledby="paths" className="steps-section" style={{ marginTop: 32 }}>
        <h2 id="paths" className="visually-hidden">
          What would you like to do?
        </h2>
        <div className="paths">
          <Link href="/experts" className="path-card">
            <span className="path-icon">
              <Icons.calendar />
            </span>
            <h3>Talk to an expert</h3>
            <p>Pick a free mentor or a paid college expert, tap an open time, and send your request. Online or in person.</p>
            <span className="go">
              Find a time <Icons.arrow />
            </span>
          </Link>
          <Link href="/centres" className="path-card">
            <span className="path-icon warm">
              <Icons.building />
            </span>
            <h3>Join an incubation centre</h3>
            <p>See centres from IIM Jammu and IIT Jammu to SMVDU and SKUAST, compare them, and apply with one profile.</p>
            <span className="go">
              Browse centres <Icons.arrow />
            </span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="how" className="steps-section">
        <div className="section-head">
          <h2 id="how">How it works</h2>
        </div>
        <ol className="steps">
          <li>
            <h3>Create a free account</h3>
            <p>Name, email, district and one tick. Under a minute, no documents.</p>
          </li>
          <li>
            <h3>Book or browse</h3>
            <p>Book an expert straight away, or let us suggest centres that fit your stage and sector.</p>
          </li>
          <li>
            <h3>Apply with one profile</h3>
            <p>Your venture profile saves as you go. Reuse it for every centre you apply to.</p>
          </li>
          <li>
            <h3>Track everything</h3>
            <p>Sessions, applications and messages live on one dashboard, with a notification when anything changes.</p>
          </li>
        </ol>
      </section>

      {featured.length ? (
        <section aria-labelledby="centres" className="steps-section">
          <div className="section-head">
            <h2 id="centres">Incubation centres</h2>
            <Link href="/centres" className="more">
              All {centres.length} centres <Icons.arrow />
            </Link>
          </div>
          <ul className="card-grid">
            {featured.map((c) => (
              <li key={c.id} className="card card-hover centre-card">
                <div className="centre-top">
                  <span className={`centre-logo${centreInitials(c.name).length > 4 ? " long" : ""}`} aria-hidden="true">
                    {centreInitials(c.name)}
                  </span>
                  <div>
                    <h3>
                      <Link href={`/centres/${c.slug}`} className="stretched">
                        {c.name}
                      </Link>
                    </h3>
                    <p className="meta-line">
                      <span>
                        <Icons.pin /> {[c.city, c.district !== c.city ? c.district : null].filter(Boolean).join(", ")}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="tags">
                  <span className={`badge ${c.openForApplications ? "badge-live" : "badge-quiet"}`}>{c.openForApplications ? "Accepting applications" : "Applications not open yet"}</span>
                  {c.expertCount ? <span className="badge badge-info">{c.expertCount} {c.expertCount === 1 ? "expert" : "experts"} to book</span> : null}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="callout" aria-labelledby="independent">
        <h2 id="independent">Independent and private by design</h2>
        <p style={{ margin: 0 }}>
          UdyamSetu is not a government portal. It doesn&apos;t decide admissions or funding, and it never takes payments.
          Your email, phone and financial figures stay private unless you choose to share them.{" "}
          <Link href="/about">How UdyamSetu works</Link>
        </p>
        {!user ? (
          <p className="actions" style={{ marginTop: 16, marginBottom: 0 }}>
            <Link href="/register" className="btn btn-primary">
              Create a free account
            </Link>
          </p>
        ) : null}
      </section>
    </>
  );
}
