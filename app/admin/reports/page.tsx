import type { Metadata } from "next";
import Link from "next/link";
import { resolveReport } from "@/app/actions/admin";
import { ActionForm, RadioGroup, SubmitButton, TextArea } from "@/components/form";
import { Notice } from "@/components/notice";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ view?: string; notice?: string }> }) {
  const { view, notice } = await searchParams;
  const closedView = view === "closed";
  const { supabase } = await requireAdmin("/admin/reports");
  let query = supabase
    .from("reports")
    .select("id, reason, status, reporter_side, created_at, resolution_note, reviewed_at, thread_id, message_id, message_threads(subject, incubation_centers(name), startups(name))")
    .order("created_at", { ascending: false })
    .limit(100);
  query = closedView ? query.neq("status", "open") : query.eq("status", "open");
  const { data: reports } = await query;

  return (
    <>
      <Notice code={notice} />
      <h1>Reports</h1>
      <nav className="tabs" aria-label="Report folders">
        <Link href="/admin/reports" aria-current={!closedView ? "page" : undefined}>
          Open
        </Link>
        <Link href="/admin/reports?view=closed" aria-current={closedView ? "page" : undefined}>
          Resolved and dismissed
        </Link>
      </nav>
      {reports && reports.length ? (
        <ul className="thread-list">
          {reports.map((r) => (
            <li key={r.id} className="stack-tight">
              <div className="row-between">
                <span>
                  <strong>{r.message_threads?.subject ?? "Conversation"}</strong>
                  <span className="muted small">
                    {" "}
                    · {r.message_threads?.incubation_centers?.name} and {r.message_threads?.startups?.name} · reported by the{" "}
                    {r.reporter_side === "founder" ? "founder" : "centre"}
                  </span>
                </span>
                <span className="muted small">{formatDateTime(r.created_at)}</span>
              </div>
              <p className="pre-line">{r.reason}</p>
              <p>
                <Link href={`/admin/threads/${r.thread_id}${r.message_id ? `#m-${r.message_id}` : ""}`}>Review the conversation</Link>
              </p>
              {r.status === "open" ? (
                <details>
                  <summary>Close this report</summary>
                  <ActionForm action={resolveReport.bind(null, r.id, "/admin/reports")}>
                    <RadioGroup
                      name="status"
                      legend="Outcome"
                      options={[
                        { value: "resolved", label: "Resolved", description: "Action was taken, for example a message was hidden or an account suspended." },
                        { value: "dismissed", label: "Dismissed", description: "No action needed." },
                      ]}
                    />
                    <TextArea name="note" label="Note to the person who reported it" rows={2} />
                    <SubmitButton small pendingText="Saving…">
                      Close report
                    </SubmitButton>
                  </ActionForm>
                </details>
              ) : (
                <p className="muted small">
                  {r.status === "resolved" ? "Resolved" : "Dismissed"} {formatDateTime(r.reviewed_at)}
                  {r.resolution_note ? `: ${r.resolution_note}` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">{closedView ? "No closed reports." : "No open reports."}</p>
      )}
    </>
  );
}
