import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/notice";
import { SampleBadge } from "@/components/status";
import { requireAdmin } from "@/lib/auth";
import { CENTER_STATUSES, labelFor } from "@/lib/options";

export const metadata: Metadata = { title: "Centres" };

export default async function AdminCentresPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const { supabase } = await requireAdmin("/admin/centres");
  const { data: centres } = await supabase
    .from("incubation_centers")
    .select("id, name, slug, district, status, is_sample, accepting_applications, center_staff_memberships(id, status), center_experts(id, is_active)")
    .order("status")
    .order("name");

  return (
    <>
      <Notice code={notice} />
      <div className="section-head">
        <h1>Centres and staff</h1>
        <Link href="/admin/centres/new" className="btn btn-primary">
          Add a centre
        </Link>
      </div>
      <p className="muted">Add as many centres as you need. Suspending a centre keeps its history but stops new applications, outreach and bookings.</p>
      <div className="table-wrap">
        <table className="list-table">
          <caption className="visually-hidden">All centres</caption>
          <thead>
            <tr>
              <th scope="col">Centre</th>
              <th scope="col">District</th>
              <th scope="col">Status</th>
              <th scope="col">Applications</th>
              <th scope="col">Staff</th>
              <th scope="col">Active experts</th>
            </tr>
          </thead>
          <tbody>
            {(centres ?? []).map((c) => (
              <tr key={c.id}>
                <th scope="row">
                  <Link href={`/admin/centres/${c.id}`}>{c.name}</Link> <SampleBadge show={c.is_sample} />
                </th>
                <td>{c.district ?? "—"}</td>
                <td>
                  <span className={`badge ${c.status === "active" ? "badge-live" : "badge-danger"}`}>{labelFor(CENTER_STATUSES, c.status)}</span>
                </td>
                <td>{c.accepting_applications ? "Open" : "Closed"}</td>
                <td>{c.center_staff_memberships.filter((m) => m.status === "active").length}</td>
                <td>{c.center_experts.filter((e) => e.is_active).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
