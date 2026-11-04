import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Audit history" };

const GROUPS: Record<string, { label: string; prefix: string }> = {
  centre: { label: "Centre changes", prefix: "center." },
  staff: { label: "Staff and invitations", prefix: "staff." },
  application: { label: "Application status", prefix: "application." },
  user: { label: "Account suspensions", prefix: "user." },
  access: { label: "Blocked access", prefix: "access." },
};

const ACTION_LABELS: Record<string, string> = {
  "center.created": "Centre created",
  "center.activated": "Centre activated",
  "center.suspended": "Centre suspended",
  "center.archived": "Centre removed",
  "center.deleted": "Centre deleted",
  "staff.invited": "Staff invited",
  "staff.joined": "Staff joined",
  "staff.revoked": "Staff access removed",
  "expert.invited": "Expert invited",
  "expert.linked": "Expert linked their account",
  "invitation.revoked": "Invitation withdrawn",
  "application.status_changed": "Application status changed",
  "application.submitted": "Application submitted",
  "user.suspended": "Account suspended",
  "user.reinstated": "Account reinstated",
  "message.hidden": "Message hidden",
  "report.created": "Conversation reported",
  "report.resolved": "Report resolved",
  "report.dismissed": "Report dismissed",
  "access.denied": "Blocked access attempt",
};

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const { group } = await searchParams;
  const { supabase } = await requireAdmin("/admin/audit");
  const filter = group ? GROUPS[group] : undefined;
  let query = supabase.from("audit_logs").select("id, action, entity_type, entity_id, center_id, actor_id, details, created_at").order("created_at", { ascending: false }).limit(200);
  if (filter) query = query.like("action", `${filter.prefix}%`);
  const { data: logs } = await query;

  const actorIds = [...new Set((logs ?? []).map((l) => l.actor_id).filter((v): v is string => Boolean(v)))];
  const centreIds = [...new Set((logs ?? []).map((l) => l.center_id).filter((v): v is string => Boolean(v)))];
  const [{ data: actors }, { data: centres }] = await Promise.all([
    actorIds.length ? supabase.from("profiles").select("id, full_name").in("id", actorIds) : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    centreIds.length ? supabase.from("incubation_centers").select("id, name").in("id", centreIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  const actorName = new Map((actors ?? []).map((a) => [a.id, a.full_name]));
  const centreName = new Map((centres ?? []).map((c) => [c.id, c.name]));

  return (
    <>
      <h1>Audit history</h1>
      <p className="muted">The latest 200 recorded actions. Entries can&apos;t be edited or deleted from the app.</p>
      <nav className="tabs" aria-label="Filter">
        <Link href="/admin/audit" aria-current={!filter ? "page" : undefined}>
          Everything
        </Link>
        {Object.entries(GROUPS).map(([key, g]) => (
          <Link key={key} href={`/admin/audit?group=${key}`} aria-current={group === key ? "page" : undefined}>
            {g.label}
          </Link>
        ))}
      </nav>
      {logs && logs.length ? (
        <div className="table-wrap">
          <table className="list-table">
            <caption className="visually-hidden">Audit history</caption>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">What</th>
                <th scope="col">Who</th>
                <th scope="col">Centre</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => {
                const details = l.details && typeof l.details === "object" && !Array.isArray(l.details) ? Object.entries(l.details).filter(([, v]) => v !== null && v !== "") : [];
                return (
                  <tr key={l.id}>
                    <td>{formatDateTime(l.created_at)}</td>
                    <th scope="row">{ACTION_LABELS[l.action] ?? l.action}</th>
                    <td>{l.actor_id ? (actorName.get(l.actor_id) ?? "A user") : "System"}</td>
                    <td>{l.center_id ? (centreName.get(l.center_id) ?? "—") : "—"}</td>
                    <td className="small">
                      {l.action === "access.denied" ? `Page: ${l.entity_id}` : details.map(([k, v]) => `${k.replace(/_/g, " ")}: ${String(v)}`).join(" · ") || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">Nothing recorded yet.</p>
      )}
    </>
  );
}
