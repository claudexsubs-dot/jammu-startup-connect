import { ExternalLink } from "@/components/external-link";
import { formatDate, formatDateTime, formatInr } from "@/lib/format";
import { LEGAL_STATUSES, OFFERING_TYPES, TRACTION_LEVELS, labelFor } from "@/lib/options";
import type { Enum, ProfileSnapshot } from "@/lib/types";

// The venture profile exactly as it was when the founder applied.
export function SnapshotView({ snapshot, takenAt }: { snapshot: ProfileSnapshot; takenAt: string | null }) {
  const s = snapshot.startup;
  const f = snapshot.financials;
  return (
    <div className="snapshot">
      <p className="muted small">Copy of the venture profile taken {formatDateTime(takenAt)}.</p>
      <dl className="details">
        <div>
          <dt>Startup</dt>
          <dd>{s.name}</dd>
        </div>
        <div>
          <dt>Stage</dt>
          <dd>{s.stage ?? "—"}</dd>
        </div>
        <div>
          <dt>Sectors</dt>
          <dd>{snapshot.sectors.join(", ") || "—"}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{[s.city, s.district].filter(Boolean).join(", ") || "—"}</dd>
        </div>
        <div>
          <dt>Founded</dt>
          <dd>{s.founding_year ?? "—"}</dd>
        </div>
        <div>
          <dt>Legal status</dt>
          <dd>
            {labelFor(LEGAL_STATUSES, s.legal_status as Enum<"legal_status">) || "—"}
            {s.dpiit_recognised ? " · DPIIT recognised" : ""}
          </dd>
        </div>
        <div>
          <dt>Offering</dt>
          <dd>{labelFor(OFFERING_TYPES, s.offering_type as Enum<"offering_type">) || "—"}</dd>
        </div>
        <div>
          <dt>Traction</dt>
          <dd>{labelFor(TRACTION_LEVELS, s.traction_level) || "—"}</dd>
        </div>
      </dl>
      {s.description ? (
        <>
          <h3>Short description</h3>
          <p className="pre-line">{s.description}</p>
        </>
      ) : null}
      <h3>Problem</h3>
      <p className="pre-line">{s.problem ?? "—"}</p>
      <h3>Solution</h3>
      <p className="pre-line">{s.solution ?? "—"}</p>
      <h3>Target customers</h3>
      <p className="pre-line">{s.target_customers ?? "—"}</p>
      {s.traction_summary ? (
        <>
          <h3>Traction so far</h3>
          <p className="pre-line">{s.traction_summary}</p>
        </>
      ) : null}
      <h3>Support needed</h3>
      <p>{snapshot.support_needs.join(", ") || "—"}</p>
      <h3>Team</h3>
      <ul>
        {snapshot.team.map((m, i) => (
          <li key={`${m.full_name}-${i}`}>
            {m.full_name}
            {m.role_title ? `, ${m.role_title}` : ""}
            {m.is_founder ? " (founder)" : ""}
            {m.linkedin_url ? (
              <>
                {" · "}
                <ExternalLink href={m.linkedin_url}>LinkedIn</ExternalLink>
              </>
            ) : null}
          </li>
        ))}
      </ul>
      <h3>Links</h3>
      <ul>
        <li>
          Website: <ExternalLink href={s.website} />
        </li>
        <li>
          Pitch deck: <ExternalLink href={s.pitch_deck_url} />
        </li>
        <li>
          Demo: <ExternalLink href={s.demo_url} />
        </li>
      </ul>
      <h3>Founder</h3>
      <p>
        {snapshot.founder.full_name ?? "—"} · {[snapshot.founder.city, snapshot.founder.district].filter(Boolean).join(", ") || "—"} ·{" "}
        {snapshot.founder.domicile_self_declared ? "Jammu domicile self-declared" : "Domicile not declared"}
      </p>
      <p>
        {snapshot.founder.contact ? (
          <>
            Contact shared by the founder: {snapshot.founder.contact.email ?? "—"}
            {snapshot.founder.contact.phone ? ` · ${snapshot.founder.contact.phone}` : ""}
          </>
        ) : (
          <span className="muted">The founder hasn&apos;t shared their email or phone. Use UdyamSetu messages to reach them.</span>
        )}
      </p>
      {f ? (
        <>
          <h3>Financial figures shared with this application</h3>
          <dl className="details">
            <div>
              <dt>As of</dt>
              <dd>{formatDate(f.as_of_date)}</dd>
            </div>
            <div>
              <dt>Annual revenue</dt>
              <dd>{formatInr(f.annual_revenue)}</dd>
            </div>
            <div>
              <dt>Monthly expenses</dt>
              <dd>{formatInr(f.monthly_operating_expenses)}</dd>
            </div>
            <div>
              <dt>Cash</dt>
              <dd>{formatInr(f.cash_balance)}</dd>
            </div>
            <div>
              <dt>Funding received</dt>
              <dd>{formatInr(f.total_funding_received)}</dd>
            </div>
            <div>
              <dt>Runway</dt>
              <dd>{f.cash_runway_months === null ? "—" : `${f.cash_runway_months} months`}</dd>
            </div>
          </dl>
        </>
      ) : null}
    </div>
  );
}
