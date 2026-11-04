import type { Metadata } from "next";
import Link from "next/link";
import { requireCentreStaff } from "@/lib/auth";
import { TRACTION_LEVELS, labelFor } from "@/lib/options";
import { loadTaxonomy, nameById } from "@/lib/taxonomy";
import type { TractionLevel } from "@/lib/types";

export const metadata: Metadata = { title: "Find startups" };

const asId = (value: string | undefined) => (value && /^\d+$/.test(value) ? Number(value) : null);

export default async function FindStartupsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; stage?: string; sector?: string; support?: string; traction?: string; district?: string }>;
}) {
  const { slug } = await params;
  const filters = await searchParams;
  const base = `/manage/${slug}/startups`;
  const { supabase, centre } = await requireCentreStaff(slug, base);
  const taxonomy = await loadTaxonomy(supabase);

  const q = (filters.q ?? "").trim().slice(0, 80).replace(/[%_,()]/g, " ");
  const stage = asId(filters.stage);
  const sector = asId(filters.sector);
  const support = asId(filters.support);
  const traction = TRACTION_LEVELS.some((t) => t.value === filters.traction) ? (filters.traction as TractionLevel) : null;

  const select = [
    "id, name, description, district, city, traction_level, stage_id, updated_at",
    "startup_sectors(sector_id)",
    "startup_support_needs(support_need_id)",
    sector ? "sector_filter:startup_sectors!inner(sector_id)" : null,
    support ? "support_filter:startup_support_needs!inner(support_need_id)" : null,
  ]
    .filter(Boolean)
    .join(", ");

  let query = supabase.from("startups").select(select).order("updated_at", { ascending: false }).limit(60);
  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  if (stage) query = query.eq("stage_id", stage);
  if (traction) query = query.eq("traction_level", traction);
  if (sector) query = query.eq("sector_filter.sector_id", sector);
  if (support) query = query.eq("support_filter.support_need_id", support);
  const { data } = await query;
  const startups = (data ?? []) as unknown as {
    id: string;
    name: string;
    description: string | null;
    district: string | null;
    city: string | null;
    traction_level: TractionLevel | null;
    stage_id: number | null;
    startup_sectors: { sector_id: number }[];
    startup_support_needs: { support_need_id: number }[];
  }[];

  const stageNames = nameById(taxonomy.stages);
  const sectorNames = nameById(taxonomy.sectors);
  const needNames = nameById(taxonomy.needs);
  const filtered = Boolean(q || stage || sector || support || traction);

  return (
    <>
      <h2>Find startups</h2>
      <p className="muted">
        Every registered startup on UdyamSetu, whether or not it has applied to {centre.name}. Founders&apos; email and phone stay private
        unless they choose to share them. Start a conversation from a startup&apos;s page.
      </p>
      <form className="filters-inline" method="get" action={base}>
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={filters.q ?? ""} placeholder="Name or description" />
        </div>
        <div className="field">
          <label htmlFor="stage">Stage</label>
          <select id="stage" name="stage" defaultValue={stage ?? ""}>
            <option value="">Any stage</option>
            {taxonomy.stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sector">Sector</label>
          <select id="sector" name="sector" defaultValue={sector ?? ""}>
            <option value="">Any sector</option>
            {taxonomy.sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="support">Support need</label>
          <select id="support" name="support" defaultValue={support ?? ""}>
            <option value="">Any need</option>
            {taxonomy.needs.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="traction">Traction</label>
          <select id="traction" name="traction" defaultValue={traction ?? ""}>
            <option value="">Any traction</option>
            {TRACTION_LEVELS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">
          Search
        </button>
        {filtered ? <Link href={base}>Clear</Link> : null}
      </form>

      {startups.length ? (
        <ul className="card-grid">
          {startups.map((s) => (
            <li key={s.id} className="card">
              <h3>
                <Link href={`${base}/${s.id}`}>{s.name}</Link>
              </h3>
              {s.description ? <p className="small">{s.description}</p> : null}
              <ul className="mini-facts">
                {s.stage_id ? <li>{stageNames.get(s.stage_id)}</li> : null}
                {s.traction_level ? <li>{labelFor(TRACTION_LEVELS, s.traction_level)}</li> : null}
                {s.district ? <li>{[s.city, s.district].filter(Boolean).join(", ")}</li> : null}
              </ul>
              {s.startup_sectors.length ? (
                <p className="muted small">{s.startup_sectors.map((x) => sectorNames.get(x.sector_id)).filter(Boolean).join(" · ")}</p>
              ) : null}
              {s.startup_support_needs.length ? (
                <p className="small">
                  Needs: {s.startup_support_needs.map((x) => needNames.get(x.support_need_id)).filter(Boolean).join(", ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">{filtered ? "No startups match these filters. Try removing one." : "No startups have registered yet."}</p>
      )}
    </>
  );
}
