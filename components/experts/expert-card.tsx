import Link from "next/link";
import { Icons } from "@/components/icons";
import { SampleBadge } from "@/components/status";
import { formatInr, formatSlotShort, initials } from "@/lib/format";
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

export function Price({ expert }: { expert: Pick<ExpertSummary, "is_paid" | "fee_inr" | "session_minutes"> }) {
  return (
    <span>
      <span className={`price${expert.is_paid ? "" : " price-free"}`}>{expert.is_paid ? formatInr(expert.fee_inr) : "Free"}</span>
      <span className="muted small"> / {expert.session_minutes} min</span>
    </span>
  );
}

export function NextSlot({ at, count }: { at: string | null; count?: number }) {
  if (!at) {
    return (
      <p className="next-slot none">
        <Icons.clock /> No open times yet
      </p>
    );
  }
  return (
    <p className="next-slot">
      <span className="pulse" aria-hidden="true" />
      <span>
        Next: {formatSlotShort(at)}
        {count ? <span className="muted small"> · {count} open in 2 weeks</span> : null}
      </span>
    </p>
  );
}

// One expert in a list. With `centre` and `nextSlotAt` it becomes the directory card.
export function ExpertCard({
  expert,
  href,
  centre,
  nextSlotAt,
  openCount,
}: {
  expert: ExpertSummary;
  href?: string;
  centre?: { name: string; slug: string; isSample?: boolean };
  nextSlotAt?: string | null;
  openCount?: number;
}) {
  const link = href ?? `/experts/${expert.id}`;
  return (
    <li className="card card-hover expert-card">
      <div className="expert-top">
        <span className="avatar avatar-lg" aria-hidden="true">
          {initials(expert.full_name)}
        </span>
        <div className="grow">
          <h3>
            <Link href={link} className="stretched">
              {expert.full_name}
            </Link>
          </h3>
          <p className="muted small">{[expert.headline, expert.organization].filter(Boolean).join(" · ")}</p>
          {centre ? (
            <p className="meta-line" style={{ marginTop: 4 }}>
              <span>
                <Icons.building /> {centre.name}
              </span>
              <SampleBadge show={Boolean(centre.isSample)} />
            </p>
          ) : null}
        </div>
      </div>
      {expert.expertise_tags.length ? (
        <p className="tags">
          {expert.expertise_tags.slice(0, 4).map((tag) => (
            <span className="badge badge-quiet" key={tag}>
              {tag}
            </span>
          ))}
          {expert.expertise_tags.length > 4 ? <span className="badge badge-quiet">+{expert.expertise_tags.length - 4}</span> : null}
        </p>
      ) : null}
      <p className="meta-line">
        <span>{expert.offers_online ? <Icons.video /> : <Icons.pin />} {formatsLabel(expert)}</span>
        {expert.engagement_policy !== "both" ? <span>{labelFor(ENGAGEMENT_POLICIES, expert.engagement_policy)}</span> : null}
      </p>
      {nextSlotAt !== undefined ? <NextSlot at={nextSlotAt} count={openCount} /> : null}
      <div className="card-footer">
        <Price expert={expert} />
        {expert.is_active === false ? (
          <span className="badge badge-quiet">Inactive</span>
        ) : (
          <span className="card-actions">
            <Link href={link} className="btn btn-primary btn-small">
              {nextSlotAt ? "Book a time" : nextSlotAt === undefined ? "See times" : "View profile"}
            </Link>
          </span>
        )}
      </div>
    </li>
  );
}
