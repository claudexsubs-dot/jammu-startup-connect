import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/notice";
import { ApplicationStatusBadge } from "@/components/status";
import { requireCentreStaff } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { APPLICATION_STATUSES } from "@/lib/options";

export const metadata: Metadata = { title: "Centre dashboard" };

type CentreStats = { applications: Record<string, number>; active_experts: number; pending_bookings: number; upcoming_sessions: number };

export default async function ManageOverviewPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ notice?: string }> }) {
  const { slug } = await params;
  const { notice } = await searchParams;
  const { supabase, centre } = await requireCentreStaff(slug, `/manage/${slug}`);
  const [{ data: stats }, { data: recent }, { data: centreRow }] = await Promise.all([
    supabase.rpc("center_stats", { p_center_id: centre.id }),
    supabase
      .from("startup_applications")
      .select("id, status, submitted_at, last_status_at, startup_name:profile_snapshot->startup->>name")
      .eq("center_id", centre.id)
      .in("status", ["submitted", "under_review", "more_information_needed"])
      .order("submitted_at", { ascending: true })
      .limit(8),
    supabase.from("incubation_centers").select("accepting_applications, applications_close_on").eq("id", centre.id).single(),
  ]);
  const s = (stats ?? { applications: {}, active_experts: 0, pending_bookings: 0, upcoming_sessions: 0 }) as unknown as CentreStats;
  const total = Object.values(s.applications).reduce((a, b) => a + b, 0);
  const base = `/manage/${slug}`;

  return (
    <>
      <Notice code={notice} />
      {centreRow && !centreRow.accepting_applications ? (
        <p className="alert alert-info">
          Applications are switched off. <Link href={`${base}/profile`}>Open applications</Link> when you&apos;re ready for a new intake.
        </p>
      ) : null}
      <ul className="stat-grid" aria-label="Counts">
        <li className="stat">
          <span className="stat-value">{total}</span>
          <span className="stat-label">Applications received</span>
        </li>
        <li className="stat">
          <span className="stat-value">{(s.applications.submitted ?? 0) + (s.applications.under_review ?? 0)}</span>
          <span className="stat-label">Waiting for review</span>
        </li>
        <li className="stat">
          <span className="stat-value">{s.applications.accepted ?? 0}</span>
          <span className="stat-label">Accepted</span>
        </li>
        <li className="stat">
          <span className="stat-value">{s.active_experts}</span>
          <span className="stat-label">Active mentors and experts</span>
        </li>
        <li className="stat">
          <span className="stat-value">{s.pending_bookings}</span>
          <span className="stat-label">Session requests to answer</span>
        </li>
        <li className="stat">
          <span className="stat-value">{s.upcoming_sessions}</span>
          <span className="stat-label">Upcoming sessions</span>
        </li>
      </ul>

      <section aria-labelledby="by-status">
        <h2 id="by-status" className="h3">
          Applications by status
        </h2>
        <ul className="tags plain">
          {APPLICATION_STATUSES.filter((o) => o.value !== "draft").map((o) => (
            <li key={o.value}>
              <Link href={`${base}/applications?status=${o.value}`}>
                {o.label}: {s.applications[o.value] ?? 0}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="queue">
        <h2 id="queue" className="h3">
          Oldest open applications
        </h2>
        {recent && recent.length ? (
          <ul className="thread-list">
            {recent.map((a) => (
              <li key={a.id}>
                <Link href={`${base}/applications/${a.id}`}>{String(a.startup_name ?? "Startup")}</Link> <ApplicationStatusBadge status={a.status} />
                <span className="muted small"> submitted {formatDate(a.submitted_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">
            No open applications. You can also <Link href={`${base}/startups`}>search all startups</Link> on UdyamSetu and start a conversation.
          </p>
        )}
      </section>
    </>
  );
}
