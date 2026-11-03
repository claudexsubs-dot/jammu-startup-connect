import type { Metadata } from "next";
import Link from "next/link";
import { StartupCard } from "@/components/startups/startup-card";
import { createClient } from "@/lib/supabase/server";
import { STAGES } from "@/lib/options";
import type { Enums } from "@/lib/database.types";

export const metadata: Metadata = { title: "Startups" };

export default async function StartupsPage({ searchParams }: { searchParams: Promise<{ stage?: string; sector?: string }> }) {
  const { stage, sector } = await searchParams;
  const stageFilter = STAGES.find((s) => s.value === stage)?.value;
  const supabase = await createClient();

  const { data: sectors } = await supabase.from("sectors").select("id, name, slug").order("name");
  const sectorFilter = sectors?.find((s) => s.slug === sector);

  let query = supabase
    .from("startups")
    .select("id, name, description, stage, district, sectors(name)")
    .eq("is_published", true)
    .order("name");
  if (stageFilter) query = query.eq("stage", stageFilter as Enums<"startup_stage">);
  if (sectorFilter) query = query.eq("sector_id", sectorFilter.id);
  const { data: startups, error } = await query;

  return (
    <>
      <h1>Startups in Jammu</h1>
      <form className="filters" method="get">
        <label>
          Stage
          <select name="stage" defaultValue={stageFilter ?? ""}>
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sector
          <select name="sector" defaultValue={sectorFilter?.slug ?? ""}>
            <option value="">All sectors</option>
            {sectors?.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-secondary">
          Filter
        </button>
        {stageFilter || sectorFilter ? <Link href="/startups">Clear</Link> : null}
      </form>

      {error ? (
        <p className="alert alert-error">We couldn&apos;t load startups right now. Please refresh the page.</p>
      ) : startups && startups.length > 0 ? (
        <ul className="card-grid">
          {startups.map((startup) => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
        </ul>
      ) : (
        <p className="empty">No published startups match these filters yet.</p>
      )}
    </>
  );
}
