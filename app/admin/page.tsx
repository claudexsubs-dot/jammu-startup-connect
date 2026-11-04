import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { APPLICATION_STATUSES, BOOKING_STATUSES, CENTER_STATUSES } from "@/lib/options";

export const metadata: Metadata = { title: "Master admin" };

type Stats = {
  users: number;
  suspended_users: number;
  founders: number;
  startups: number;
  centres: Record<string, number>;
  staff: number;
  active_experts: number;
  applications: Record<string, number>;
  bookings: Record<string, number>;
  threads: number;
  open_reports: number;
};

function Breakdown({ title, counts, options }: { title: string; counts: Record<string, number>; options: { value: string; label: string }[] }) {
  return (
    <section className="card">
      <h2 className="h3">{title}</h2>
      <dl className="mini-dl">
        {options.map((o) => (
          <div key={o.value}>
            <dt>{o.label}</dt>
            <dd>{counts[o.value] ?? 0}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin("/admin");
  const { data } = await supabase.rpc("admin_platform_stats");
  const s = data as unknown as Stats | null;
  if (!s) return <p className="alert alert-error">Couldn&apos;t load the counts.</p>;
  const centreTotal = Object.values(s.centres).reduce((a, b) => a + b, 0);

  return (
    <>
      <h1>Platform overview</h1>
      <p className="muted">Counts only. Personal details stay with the people and centres they belong to.</p>
      {s.open_reports ? (
        <p className="alert alert-info">
          {s.open_reports} open report{s.open_reports === 1 ? "" : "s"} to review. <Link href="/admin/reports">Open reports</Link>
        </p>
      ) : null}
      <ul className="stat-grid" aria-label="Counts">
        {[
          ["Accounts", s.users],
          ["Founders", s.founders],
          ["Startups", s.startups],
          ["Centres", centreTotal],
          ["Centre staff", s.staff],
          ["Active mentors and experts", s.active_experts],
          ["Conversations", s.threads],
          ["Suspended accounts", s.suspended_users],
        ].map(([label, value]) => (
          <li key={label} className="stat">
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
          </li>
        ))}
      </ul>
      <div className="card-grid">
        <Breakdown title="Centres by status" counts={s.centres} options={CENTER_STATUSES} />
        <Breakdown title="Applications by status" counts={s.applications} options={APPLICATION_STATUSES.filter((o) => o.value !== "draft")} />
        <Breakdown title="Bookings by status" counts={s.bookings} options={BOOKING_STATUSES} />
      </div>
    </>
  );
}
