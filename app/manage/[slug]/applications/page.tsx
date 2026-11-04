import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationStatusBadge } from "@/components/status";
import { requireCentreStaff } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { APPLICATION_STATUSES } from "@/lib/options";
import type { ApplicationStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Applications" };

export default async function ManageApplicationsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ status?: string; q?: string }> }) {
  const { slug } = await params;
  const { status, q } = await searchParams;
  const { supabase, centre } = await requireCentreStaff(slug, `/manage/${slug}/applications`);
  const statusFilter = APPLICATION_STATUSES.some((o) => o.value === status && o.value !== "draft") ? (status as ApplicationStatus) : null;
  const search = (q ?? "").trim().slice(0, 80);

  let query = supabase
    .from("startup_applications")
    .select("id, status, submitted_at, last_status_at, startup_name:profile_snapshot->startup->>name, stage:profile_snapshot->startup->>stage")
    .eq("center_id", centre.id)
    .neq("status", "draft")
    .order("last_status_at", { ascending: false })
    .limit(200);
  if (statusFilter) query = query.eq("status", statusFilter);
  if (search) query = query.ilike("profile_snapshot->startup->>name", `%${search.replace(/[%_,()]/g, " ")}%`);
  const { data: applications } = await query;
  const base = `/manage/${slug}/applications`;

  return (
    <>
      <h2>Applications</h2>
      <p className="muted">
        Each application includes a copy of the startup&apos;s profile as it was when submitted. Your centre makes its own decision. You can
        ask for more information instead of rejecting.
      </p>
      <form className="filters-inline" method="get" action={base}>
        <div className="field">
          <label htmlFor="q">Startup name</label>
          <input id="q" name="q" defaultValue={search} />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={statusFilter ?? ""}>
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.filter((o) => o.value !== "draft").map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">
          Filter
        </button>
        {statusFilter || search ? <Link href={base}>Clear</Link> : null}
      </form>
      {applications && applications.length ? (
        <div className="table-wrap">
          <table className="list-table">
            <caption className="visually-hidden">Applications to {centre.name}</caption>
            <thead>
              <tr>
                <th scope="col">Startup</th>
                <th scope="col">Stage</th>
                <th scope="col">Status</th>
                <th scope="col">Submitted</th>
                <th scope="col">Last update</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id}>
                  <th scope="row">
                    <Link href={`${base}/${a.id}`}>{String(a.startup_name ?? "Startup")}</Link>
                  </th>
                  <td>{a.stage ? String(a.stage) : "—"}</td>
                  <td>
                    <ApplicationStatusBadge status={a.status} />
                  </td>
                  <td>{formatDate(a.submitted_at)}</td>
                  <td>{formatDate(a.last_status_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">{statusFilter || search ? "No applications match these filters." : "No applications yet."}</p>
      )}
    </>
  );
}
