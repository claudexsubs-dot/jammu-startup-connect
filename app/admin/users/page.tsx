import type { Metadata } from "next";
import Link from "next/link";
import { setUserSuspension } from "@/app/actions/admin";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Notice } from "@/components/notice";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Users" };

const ROLE_LABELS: Record<string, string> = { founder: "Founder", center_staff: "Centre staff", expert: "Expert", platform_admin: "Master admin" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; notice?: string }> }) {
  const { q, page, notice } = await searchParams;
  const { supabase, user } = await requireAdmin("/admin/users");
  const pageNumber = Math.max(Number(page) || 1, 1);
  const search = (q ?? "").trim().slice(0, 120);
  const { data: users, error } = await supabase.rpc("admin_list_users", { p_search: search || undefined, p_limit: 50, p_offset: (pageNumber - 1) * 50 });
  const returnPath = `/admin/users${search ? `?q=${encodeURIComponent(search)}` : ""}`;

  return (
    <>
      <Notice code={notice} />
      <h1>Users</h1>
      <p className="muted">
        Search by name, or by a full email address. Emails are partly hidden. Suspending an account blocks all changes from it but keeps its
        history.
      </p>
      <form className="filters-inline" method="get" action="/admin/users">
        <div className="field">
          <label htmlFor="q">Name or exact email</label>
          <input id="q" name="q" defaultValue={search} />
        </div>
        <button type="submit" className="btn btn-secondary">
          Search
        </button>
        {search ? <Link href="/admin/users">Clear</Link> : null}
      </form>
      {error ? <p className="alert alert-error">Couldn&apos;t load users.</p> : null}
      {users && users.length ? (
        <ul className="thread-list">
          {users.map((u) => (
            <li key={u.id}>
              <div className="row-between">
                <span>
                  <strong>{u.full_name || "No name"}</strong> <span className="muted small">{u.masked_email}</span>{" "}
                  {u.roles.map((r) => (
                    <span key={r} className="badge badge-quiet">
                      {ROLE_LABELS[r] ?? r}
                    </span>
                  ))}{" "}
                  {u.is_suspended ? <span className="badge badge-danger">Suspended</span> : null}
                </span>
                <span className="muted small">Joined {formatDate(u.created_at)}</span>
              </div>
              {u.is_suspended && u.suspension_reason ? <p className="small">Reason: {u.suspension_reason}</p> : null}
              {u.id === user.id ? null : u.is_suspended ? (
                <ActionForm action={setUserSuspension.bind(null, u.id, false, returnPath)} className="actions">
                  <SubmitButton variant="secondary" small pendingText="Reinstating…">
                    Reinstate
                  </SubmitButton>
                </ActionForm>
              ) : (
                <details>
                  <summary>Suspend</summary>
                  <ActionForm action={setUserSuspension.bind(null, u.id, true, returnPath)}>
                    <Field name="reason" label="Reason" required />
                    <SubmitButton variant="danger" small pendingText="Suspending…">
                      Suspend account
                    </SubmitButton>
                  </ActionForm>
                </details>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">No users found.</p>
      )}
      <nav className="pager" aria-label="Pages">
        {pageNumber > 1 ? <Link href={`/admin/users?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(pageNumber - 1) })}`}>Previous</Link> : null}
        {users && users.length === 50 ? <Link href={`/admin/users?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(pageNumber + 1) })}`}>Next</Link> : null}
      </nav>
    </>
  );
}
