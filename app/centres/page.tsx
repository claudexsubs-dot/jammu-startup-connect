import type { Metadata } from "next";
import Link from "next/link";
import { CentreCard } from "@/components/centres/centre-card";
import { getViewer } from "@/lib/auth";
import { filterCentres, hasActiveFilters, loadActiveCentres, parseFilters, type CentreSummary } from "@/lib/directory";
import { Icons } from "@/components/icons";
import { CENTRE_DISTRICTS } from "@/lib/options";
import { recommendCentres, type Recommendation } from "@/lib/recommend";
import { loadTaxonomy, nameById } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Incubation centres" };

export default async function CentresPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const { supabase, user } = await getViewer();

  const taxonomy = await loadTaxonomy(supabase);
  let centres: CentreSummary[] = [];
  let loadFailed = false;
  try {
    centres = await loadActiveCentres(supabase);
  } catch {
    loadFailed = true;
  }

  const stageNames = nameById(taxonomy.stages);
  const sectorNames = nameById(taxonomy.sectors);

  // Recommendations for signed-in founders with a venture profile.
  let recommendations: Recommendation[] | null = null;
  let hasVenture = false;
  if (user) {
    const { data: startup } = await supabase
      .from("startups")
      .select("id, stage_id, district, startup_sectors(sector_id), startup_support_needs(support_need_id)")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (startup) {
      hasVenture = true;
      recommendations = recommendCentres(
        {
          stageId: startup.stage_id,
          sectorIds: startup.startup_sectors.map((s) => s.sector_id),
          supportNeedIds: startup.startup_support_needs.map((s) => s.support_need_id),
          district: startup.district,
        },
        centres,
        {
          stages: new Map(taxonomy.stages.map((s) => [s.id, { code: s.code, name: s.name }])),
          sectors: sectorNames,
          needs: nameById(taxonomy.needs),
        },
      );
    }
  }

  const filtered = filterCentres(centres, filters);
  const filtering = hasActiveFilters(filters);
  const noMatches = filtering && filtered.length === 0;
  const shown = noMatches ? centres : filtered;

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">
          <Icons.building /> Mission YUVA incubation network
        </p>
        <h1>Incubation centres in Jammu and Kashmir</h1>
        <p className="lead">
          The centres named in public reports as part of the Mission YUVA incubation network. Apply to as many as you like
          with one venture profile; each centre decides on its own applications.{" "}
          <Link href="/about#centres">Where this list comes from</Link>
        </p>
      </header>

      {user && hasVenture && recommendations ? (
        <section aria-labelledby="recommended" className="recommended">
          <h2 id="recommended">Recommended for your venture</h2>
          {recommendations.length ? (
            <>
              <p className="muted">Based on your stage, sectors and support needs. These are suggestions only: you choose where to apply.</p>
              <ul className="card-grid">
                {recommendations.map((r) => (
                  <CentreCard key={r.centre.id} centre={r.centre} stageNames={stageNames} sectorNames={sectorNames} explanation={r.explanation} caveats={r.caveats} />
                ))}
              </ul>
            </>
          ) : (
            <p className="empty">
              No centre is a strong match yet. Adding your stage, sectors and support needs to your{" "}
              <Link href="/venture">venture profile</Link> improves suggestions. You can still apply to any centre below.
            </p>
          )}
        </section>
      ) : user && !hasVenture ? (
        <p className="alert alert-info">
          <Link href="/venture">Create your venture profile</Link> to see centres recommended for your stage, sector and support needs.
        </p>
      ) : !user ? (
        <p className="alert alert-info">
          <Link href="/register?next=/centres">Create a free account</Link> to see which centres fit your startup, with reasons, and apply.
        </p>
      ) : null}

      <h2 id="all">All centres</h2>
      <form method="get" aria-label="Filter centres">
        <div className="search-bar">
          <label className="search-input">
            <span className="visually-hidden">Search centres</span>
            <Icons.search />
            <input type="search" name="q" defaultValue={filters.q ?? ""} placeholder="Search by centre, university or city" />
          </label>
          <button type="submit" className="btn btn-primary btn-large">
            Search
          </button>
        </div>
      <div className="filters">
        <label>
          Stage supported
          <select name="stage" defaultValue={filters.stage ?? ""}>
            <option value="">Any stage</option>
            {taxonomy.stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sector
          <select name="sector" defaultValue={filters.sector ?? ""}>
            <option value="">Any sector</option>
            {taxonomy.sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Support offered
          <select name="support" defaultValue={filters.support ?? ""}>
            <option value="">Any support</option>
            {taxonomy.needs.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Location
          <select name="district" defaultValue={filters.district ?? ""}>
            <option value="">Anywhere in J&amp;K</option>
            {CENTRE_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <div className="filter-checks">
          <div className="field-checkbox">
            <input type="checkbox" id="accepting" name="accepting" value="1" defaultChecked={filters.accepting} />
            <label htmlFor="accepting">Accepting applications</label>
          </div>
          <div className="field-checkbox">
            <input type="checkbox" id="experts" name="experts" value="1" defaultChecked={filters.experts} />
            <label htmlFor="experts">Has mentors or experts</label>
          </div>
        </div>
        <div className="actions">
          <button type="submit" className="btn btn-secondary">
            Apply filters
          </button>
          {filtering ? <Link href="/centres">Clear filters</Link> : null}
        </div>
      </div>
      </form>

      {loadFailed ? (
        <p className="alert alert-error">We couldn&apos;t load centres right now. Please refresh the page.</p>
      ) : centres.length === 0 ? (
        <p className="empty">No centres are listed yet. Please check back soon.</p>
      ) : (
        <>
          {noMatches ? (
            <p className="alert alert-info" role="status">
              No centres match all of these filters. Try removing one or two. Here are all {centres.length} centres instead.
            </p>
          ) : (
            <p className="result-meta" role="status">
              <span>
                Showing {shown.length} of {centres.length} centres
              </span>
            </p>
          )}
          <form method="get" action="/centres/compare" aria-label="Compare centres" className="compare-form">
            <ul className="card-grid">
              {shown.map((centre) => (
                <CentreCard key={centre.id} centre={centre} stageNames={stageNames} sectorNames={sectorNames} compare />
              ))}
            </ul>
            <div className="sticky-actions">
              <button type="submit" className="btn btn-secondary">
                Compare selected centres
              </button>
              <span className="muted small">Tick up to 4 centres to compare them side by side.</span>
            </div>
          </form>
        </>
      )}
    </>
  );
}
