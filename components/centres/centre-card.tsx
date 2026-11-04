import Link from "next/link";
import { SampleBadge } from "@/components/status";
import type { CentreSummary } from "@/lib/directory";

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
  return (
    <li className="card centre-card">
      <div className="card-head">
        <h3>
          <Link href={`/centres/${centre.slug}`}>{centre.name}</Link>
        </h3>
        <SampleBadge show={centre.isSample} />
      </div>
      <p className="muted small">
        {[centre.city, centre.district && centre.district !== centre.city ? centre.district : null].filter(Boolean).join(", ") || "Location not listed"}
        {centre.hostInstitution ? ` · ${centre.hostInstitution}` : ""}
      </p>
      {explanation ? <p className="recommendation">{explanation}</p> : null}
      {caveats?.length ? <p className="muted small">{caveats.join(" ")}</p> : null}
      {centre.shortDescription && !explanation ? <p className="card-body">{centre.shortDescription}</p> : null}
      <dl className="mini-facts">
        <div>
          <dt>Stages</dt>
          <dd>{stages.length ? stages.join(", ") : "Not listed"}</dd>
        </div>
        <div>
          <dt>Sectors</dt>
          <dd>{sectors.length ? (sectors.length > 3 ? `${sectors.slice(0, 3).join(", ")} +${sectors.length - 3} more` : sectors.join(", ")) : "All sectors"}</dd>
        </div>
      </dl>
      <p className="tags">
        <span className={`badge ${centre.openForApplications ? "badge-live" : "badge-quiet"}`}>
          {centre.openForApplications ? "Accepting applications" : "Not accepting applications"}
        </span>
        <span className="badge badge-quiet">
          {centre.expertCount ? `${centre.expertCount} ${centre.expertCount === 1 ? "mentor or expert" : "mentors and experts"}` : "No mentors listed yet"}
        </span>
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
