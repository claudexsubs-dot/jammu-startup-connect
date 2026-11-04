import type { Metadata } from "next";
import Link from "next/link";
import { feeLabel, formatsLabel } from "@/components/experts/expert-card";
import { Notice } from "@/components/notice";
import { requireCentreStaff } from "@/lib/auth";
import { ENGAGEMENT_POLICIES, labelFor } from "@/lib/options";

export const metadata: Metadata = { title: "Mentors and experts" };

export default async function ManageExpertsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ notice?: string }> }) {
  const { slug } = await params;
  const { notice } = await searchParams;
  const base = `/manage/${slug}/experts`;
  const { supabase, centre } = await requireCentreStaff(slug, base);
  const { data: experts } = await supabase
    .from("center_experts")
    .select("id, full_name, headline, is_active, is_paid, fee_inr, session_minutes, offers_online, offers_in_person, engagement_policy, user_id")
    .eq("center_id", centre.id)
    .order("is_active", { ascending: false })
    .order("full_name");

  return (
    <>
      <Notice code={notice} />
      <div className="section-head">
        <h2>Mentors and experts</h2>
        {centre.status === "active" ? (
          <Link href={`${base}/new`} className="btn btn-primary">
            Add a mentor or expert
          </Link>
        ) : null}
      </div>
      <p className="muted">
        Free mentors and paid college experts at {centre.name}. You manage their profiles and availability. You can also invite each person to
        link their own account so they can answer requests themselves.
      </p>
      {experts && experts.length ? (
        <div className="table-wrap">
          <table className="list-table">
            <caption className="visually-hidden">Mentors and experts</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Sessions</th>
                <th scope="col">Format</th>
                <th scope="col">Who can book</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {experts.map((e) => (
                <tr key={e.id}>
                  <th scope="row">
                    <Link href={`${base}/${e.id}`}>{e.full_name}</Link>
                    {e.headline ? <span className="muted small"> · {e.headline}</span> : null}
                  </th>
                  <td>{feeLabel(e)}</td>
                  <td>{formatsLabel(e)}</td>
                  <td>{labelFor(ENGAGEMENT_POLICIES, e.engagement_policy)}</td>
                  <td>
                    {e.is_active ? <span className="badge badge-live">Active</span> : <span className="badge badge-quiet">Inactive</span>}{" "}
                    {e.user_id ? <span className="badge badge-info">Account linked</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">
          No mentors or experts yet. Founders can still apply to {centre.name}; the public page will say that no mentors are listed yet.
        </p>
      )}
    </>
  );
}
