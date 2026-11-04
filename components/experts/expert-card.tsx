import Link from "next/link";
import { formatInr } from "@/lib/format";
import { ENGAGEMENT_POLICIES, labelFor } from "@/lib/options";
import type { EngagementPolicy } from "@/lib/types";

export type ExpertSummary = {
  id: string;
  full_name: string;
  headline: string | null;
  organization: string | null;
  expertise_tags: string[];
  engagement_policy: EngagementPolicy;
  is_paid: boolean;
  fee_inr: number | null;
  session_minutes: number;
  offers_online: boolean;
  offers_in_person: boolean;
  is_active?: boolean;
};

export function formatsLabel(expert: Pick<ExpertSummary, "offers_online" | "offers_in_person">) {
  if (expert.offers_online && expert.offers_in_person) return "Online or in person";
  return expert.offers_online ? "Online" : "In person";
}

export function feeLabel(expert: Pick<ExpertSummary, "is_paid" | "fee_inr" | "session_minutes">) {
  return expert.is_paid ? `${formatInr(expert.fee_inr)} for ${expert.session_minutes} min` : `Free mentorship · ${expert.session_minutes} min`;
}

export function ExpertCard({ expert, href }: { expert: ExpertSummary; href?: string }) {
  return (
    <li className="card">
      <div className="card-head">
        <h3>
          <Link href={href ?? `/experts/${expert.id}`}>{expert.full_name}</Link>
        </h3>
        <span className={`badge ${expert.is_paid ? "badge-warn" : "badge-live"}`}>{expert.is_paid ? "Paid consulting" : "Free mentorship"}</span>
      </div>
      <p className="muted small">{[expert.headline, expert.organization].filter(Boolean).join(" · ")}</p>
      {expert.expertise_tags.length ? (
        <p className="tags">
          {expert.expertise_tags.map((tag) => (
            <span className="badge badge-quiet" key={tag}>
              {tag}
            </span>
          ))}
        </p>
      ) : null}
      <dl className="mini-facts">
        <div>
          <dt>Sessions</dt>
          <dd>
            {formatsLabel(expert)} · {feeLabel(expert)}
          </dd>
        </div>
        <div>
          <dt>Who can book</dt>
          <dd>{labelFor(ENGAGEMENT_POLICIES, expert.engagement_policy)}</dd>
        </div>
      </dl>
      {expert.is_active === false ? <p className="badge badge-quiet">Inactive</p> : null}
    </li>
  );
}
