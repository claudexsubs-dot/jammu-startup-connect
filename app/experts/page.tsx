import type { Metadata } from "next";
import Link from "next/link";
import { ExpertCard } from "@/components/experts/expert-card";
import { Icons } from "@/components/icons";
import { getViewer } from "@/lib/auth";
import { filterExperts, filterHref, hasExpertFilters, loadExpertDirectory, parseExpertFilters, popularTopics, type DirectoryExpert } from "@/lib/experts";

export const metadata: Metadata = { title: "Book a mentor or expert" };

export default async function ExpertsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseExpertFilters(await searchParams);
  const { supabase } = await getViewer();

  let experts: DirectoryExpert[] = [];
  let failed = false;
  try {
    experts = await loadExpertDirectory(supabase);
  } catch {
    failed = true;
  }

  const shown = filterExperts(experts, filters);
  const topics = popularTopics(experts);
  const centres = [...new Map(experts.map((e) => [e.center_slug, e.center_name])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const filtering = hasExpertFilters(filters);

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">
          <Icons.calendar /> Consultations
        </p>
        <h1>Book a mentor or expert</h1>
        <p className="lead">
          Pick a person, tap a time that suits you, and send your request. Free mentors and paid college experts from
          incubation centres, online or in person.
        </p>
      </header>

      <form method="get" role="search" aria-label="Search experts">
        <div className="search-bar">
          <label className="search-input">
            <span className="visually-hidden">Search by name, topic or centre</span>
            <Icons.search />
            <input type="search" name="q" defaultValue={filters.q ?? ""} placeholder="Try “pricing”, “FSSAI”, “prototyping”…" />
          </label>
          {filters.topic ? <input type="hidden" name="topic" value={filters.topic} /> : null}
          <button type="submit" className="btn btn-primary btn-large">
            Search
          </button>
        </div>

        {topics.length ? (
          <nav className="pill-row" aria-label="Popular topics">
            <Link href={filterHref(filters, { topic: undefined })} className="pill" aria-current={!filters.topic ? "true" : undefined}>
              All topics
            </Link>
            {topics.map((t) => (
              <Link key={t} href={filterHref(filters, { topic: t })} className="pill" aria-current={filters.topic?.toLowerCase() === t.toLowerCase() ? "true" : undefined}>
                {t}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="filters">
          <label>
            Centre
            <select name="centre" defaultValue={filters.centre ?? ""}>
              <option value="">All centres</option>
              {centres.map(([slug, name]) => (
                <option key={slug} value={slug}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Price
            <select name="price" defaultValue={filters.price ?? ""}>
              <option value="">Free and paid</option>
              <option value="free">Free mentorship</option>
              <option value="paid">Paid consulting</option>
            </select>
          </label>
          <label>
            Format
            <select name="format" defaultValue={filters.format ?? ""}>
              <option value="">Online or in person</option>
              <option value="online">Online</option>
              <option value="in_person">In person</option>
            </select>
          </label>
          <div className="filter-checks" style={{ flex: "1 1 200px" }}>
            <label className="field-checkbox">
              <input type="checkbox" name="soon" value="1" defaultChecked={filters.soon} />
              Free in the next 7 days
            </label>
          </div>
          <div className="actions">
            <button type="submit" className="btn btn-secondary">
              Update results
            </button>
            {filtering ? <Link href="/experts">Clear all</Link> : null}
          </div>
        </div>
      </form>

      {failed ? (
        <p className="alert alert-error">We couldn&apos;t load experts right now. Please refresh the page.</p>
      ) : experts.length === 0 ? (
        <div className="empty">
          <p>
            <strong>No mentors or experts are listed yet.</strong>
          </p>
          <p>
            Incubation centres add their mentors and college experts here. Meanwhile you can browse centres and get
            your venture profile ready.
          </p>
          <Link href="/centres" className="btn btn-primary">
            Browse incubation centres
          </Link>
        </div>
      ) : (
        <>
          <div className="result-meta" role="status">
            <span>
              {shown.length === experts.length ? `${experts.length} mentors and experts` : `${shown.length} of ${experts.length} match your search`}
            </span>
            <span className="small">Soonest available first · times shown in India time</span>
          </div>
          {shown.length ? (
            <ul className="card-grid">
              {shown.map((e) => (
                <ExpertCard
                  key={e.id}
                  expert={e}
                  centre={{ name: e.center_name, slug: e.center_slug, isSample: e.center_is_sample }}
                  nextSlotAt={e.next_slot_at}
                  openCount={e.open_slots_14d}
                />
              ))}
            </ul>
          ) : (
            <div className="empty">
              <p>Nobody matches all of those filters.</p>
              <Link href="/experts" className="btn btn-secondary">
                Show everyone
              </Link>
            </div>
          )}
        </>
      )}

      <section className="callout callout-quiet" aria-labelledby="how-booking">
        <h2 id="how-booking">How booking works</h2>
        <ol className="steps" style={{ marginTop: 12 }}>
          <li>
            <h3>Pick a time</h3>
            <p>Open times are shown live. Tap one and add a line about what you&apos;d like to discuss.</p>
          </li>
          <li>
            <h3>The expert confirms</h3>
            <p>You get a notification when they confirm, suggest another time, or share the meeting link.</p>
          </li>
          <li>
            <h3>Pay them directly, if paid</h3>
            <p>UdyamSetu never takes payments. Paid experts send you their own payment instructions.</p>
          </li>
        </ol>
      </section>
    </>
  );
}
