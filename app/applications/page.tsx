import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/notice";
import { ApplicationStatusBadge, SampleBadge } from "@/components/status";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "My applications" };

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const { supabase, user } = await requireUser("/applications");
  const { data: applications } = await supabase
    .from("startup_applications")
    .select("id, status, submitted_at, last_status_at, created_at, incubation_centers(name, slug, is_sample, status)")
    .eq("founder_id", user.id)
    .order("last_status_at", { ascending: false });

  const actionNeeded = (applications ?? []).filter((a) => a.status === "more_information_needed" || a.status === "draft");

  return (
    <>
      <Notice code={notice} />
      <div className="section-head">
        <h1>My applications</h1>
        <Link href="/centres" className="btn btn-secondary">
          Find more centres
        </Link>
      </div>
      {actionNeeded.length ? (
        <p className="alert alert-info">
          {actionNeeded.length === 1 ? "1 application needs" : `${actionNeeded.length} applications need`} something from you: a draft to submit or a
          request for more information.
        </p>
      ) : null}
      {applications && applications.length ? (
        <div className="table-wrap">
          <table className="list-table">
            <caption className="visually-hidden">Your applications</caption>
            <thead>
              <tr>
                <th scope="col">Centre</th>
                <th scope="col">Status</th>
                <th scope="col">Submitted</th>
                <th scope="col">Last update</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id}>
                  <th scope="row">
                    <Link href={`/applications/${a.id}`}>{a.incubation_centers?.name ?? "Centre"}</Link> <SampleBadge show={Boolean(a.incubation_centers?.is_sample)} />
                    {a.incubation_centers?.status === "suspended" ? <span className="badge badge-danger">Centre suspended</span> : null}
                  </th>
                  <td>
                    <ApplicationStatusBadge status={a.status} />
                  </td>
                  <td>{a.submitted_at ? formatDate(a.submitted_at) : "Not yet"}</td>
                  <td>{formatDate(a.last_status_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <p>You haven&apos;t applied anywhere yet. You can apply to as many centres as you like, each with its own application.</p>
          <Link href="/centres" className="btn btn-primary">
            Browse centres
          </Link>
        </div>
      )}
    </>
  );
}
