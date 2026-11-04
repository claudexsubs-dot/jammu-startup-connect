import Link from "next/link";
import { Icons } from "@/components/icons";
import { SampleBadge } from "@/components/status";
import type { CentreSummary } from "@/lib/directory";

// Short letters for a centre's placeholder logo, e.g. "IIM", "SKUAST" or "CUJ".
export function centreInitials(name: string) {
  const words = name.replace(/,/g, " ").split(/\s+/).filter((w) => w && !/^(Incubation|Centre|Foundation|of|the|and)$/i.test(w));
  const acronym = words.find((w) => w.length >= 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
  if (acronym) return acronym.slice(0, 6);
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 3);
}

export function CentreCard({
  centre,
  stageNames,
  sectorNames,
  explanation,
  caveats,
  compare,
}: {
  centre: CentreSummary;
  stageNames: Map<number, string>;
  sectorNames: Map<number, string>;
  explanation?: string;
  caveats?: string[];
  compare?: boolean;
}) {
  const stages = centre.stageIds.map((id) => stageNames.get(id)).filter(Boolean) as string[];
  const sectors = centre.sectorIds.map((id) => sectorNames.get(id)).filter(Boolean) as string[];
  const place = [centre.city, centre.district && centre.district !== centre.city ? centre.district : null].filter(Boolean).join(", ");
  return (
    <li className="card card-hover centre-card">
      <div className="centre-top">
        <span className={`centre-logo${centreInitials(centre.name).length > 4 ? " long" : ""}`} aria-hidden="true">
          {centreInitials(centre.name)}
        </span>
        <div style={{ minWidth: 0 }}>
          <h3>
            <Link href={`/centres/${centre.slug}`} className="stretched">
              {centre.name}
            </Link>
          </h3>
          <p className="meta-line">
            <span>
              <Icons.pin /> {place || "Location not listed"}
            </span>
            <SampleBadge show={centre.isSample} />
          </p>
        </div>
      </div>
      {explanation ? <p className="recommendation">{explanation}</p> : null}
      {caveats?.length ? <p className="muted small">{caveats.join(" ")}</p> : null}
      {centre.shortDescription && !explanation ? <p className="card-body small">{centre.shortDescription}</p> : null}
      {stages.length || sectors.length ? (
        <dl className="mini-facts">
          {stages.length ? (
            <div>
              <dt>Stages</dt>
              <dd>{stages.join(", ")}</dd>
            </div>
          ) : null}
          {sectors.length ? (
            <div>
              <dt>Sectors</dt>
              <dd>{sectors.length > 3 ? `${sectors.slice(0, 3).join(", ")} +${sectors.length - 3} more` : sectors.join(", ")}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <p className="tags">
        <span className={`badge ${centre.openForApplications ? "badge-live" : "badge-quiet"}`}>
          {centre.openForApplications ? "Accepting applications" : "Applications not open here yet"}
        </span>
        {centre.expertCount ? (
          <span className="badge badge-info">
            {centre.expertCount} {centre.expertCount === 1 ? "expert" : "experts"} to book
          </span>
        ) : null}
      </p>
      {compare ? (
        <div className="field-checkbox compare-toggle">
          <input type="checkbox" id={`compare-${centre.slug}`} name="c" value={centre.slug} />
          <label htmlFor={`compare-${centre.slug}`}>Compare</label>
        </div>
      ) : null}
    </li>
  );
}
