import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCentre, inviteStaff, revokeStaff, setCentreStatus } from "@/app/actions/admin";
import { updateCentreProfile } from "@/app/actions/centres";
import { revokeInvitation } from "@/app/actions/experts";
import { CentreProfileForm } from "@/components/centres/centre-profile-form";
import { ConfirmButton } from "@/components/confirm-button";
import { ActionForm, Field, Select, SubmitButton, TextArea } from "@/components/form";
import { Notice } from "@/components/notice";
import { SampleBadge } from "@/components/status";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { CENTER_STATUSES, labelFor } from "@/lib/options";
import { loadTaxonomy } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Manage centre" };

export default async function AdminCentrePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { id } = await params;
  const { notice, error } = await searchParams;
  const path = `/admin/centres/${id}`;
  const { supabase } = await requireAdmin(path);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: centre }, taxonomy, { data: memberships }, { data: invitations }] = await Promise.all([
    supabase
      .from("incubation_centers")
      .select("*, center_stages(stage_id), center_sectors(sector_id), center_services(support_need_id)")
      .eq("id", id)
      .maybeSingle(),
    loadTaxonomy(supabase),
    supabase.from("center_staff_memberships").select("id, user_id, invited_email, status, created_at, revoked_at").eq("center_id", id).order("status").order("created_at"),
    supabase.from("invitations").select("id, email, kind, created_at, expires_at").eq("center_id", id).eq("status", "pending").gt("expires_at", new Date().toISOString()),
  ]);
  if (!centre) notFound();

  const userIds = (memberships ?? []).map((m) => m.user_id);
  const { data: people } = userIds.length ? await supabase.from("profiles").select("id, full_name, is_suspended").in("id", userIds) : { data: [] };
  const personById = new Map((people ?? []).map((p) => [p.id, p]));

  return (
    <>
      <p className="breadcrumbs">
        <Link href="/admin/centres">Centres and staff</Link>
      </p>
      <Notice code={notice} error={error} />
      <div className="section-head">
        <h1>
          {centre.name} <SampleBadge show={centre.is_sample} />
        </h1>
        <Link href={`/centres/${centre.slug}`}>Public page</Link>
      </div>

      <div className="layout-split">
        <div className="stack">
          <section className="card">
            <h2 className="h3">Staff access</h2>
            {memberships && memberships.length ? (
              <ul className="plain stack-tight">
                {memberships.map((m) => {
                  const person = personById.get(m.user_id);
                  return (
                    <li key={m.id} className="row-between">
                      <span>
                        <strong>{person?.full_name ?? "Staff member"}</strong> <span className="muted small">{m.invited_email}</span>{" "}
                        {m.status === "active" ? <span className="badge badge-live">Active</span> : <span className="badge badge-quiet">Removed {formatDate(m.revoked_at)}</span>}
                        {person?.is_suspended ? <span className="badge badge-danger">Account suspended</span> : null}
                      </span>
                      {m.status === "active" ? (
                        <form action={revokeStaff.bind(null, m.id, centre.id)}>
                          <ConfirmButton message="Remove this person's staff access?" className="link-button danger-link">
                            Remove access
                          </ConfirmButton>
                        </form>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted">No staff yet.</p>
            )}
            {invitations && invitations.length ? (
              <>
                <h3>Pending invitations</h3>
                <ul className="plain stack-tight">
                  {invitations.map((i) => (
                    <li key={i.id} className="row-between">
                      <span className="small">
                        {i.email} · {i.kind === "center_staff" ? "staff" : "expert"} · expires {formatDate(i.expires_at)}
                      </span>
                      <form action={revokeInvitation.bind(null, i.id, path)}>
                        <ConfirmButton message="Withdraw this invitation?" className="link-button danger-link">
                          Withdraw
                        </ConfirmButton>
                      </form>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {centre.status !== "archived" ? (
              <ActionForm action={inviteStaff.bind(null, centre.id)}>
                <Field name="email" label="Invite staff by email" type="email" required hint="You'll get a link to send them. It works for 14 days." />
                <SubmitButton variant="secondary" small pendingText="Creating…">
                  Create invitation link
                </SubmitButton>
              </ActionForm>
            ) : null}
          </section>

          <details className="card">
            <summary>Edit centre profile</summary>
            <CentreProfileForm
              action={updateCentreProfile.bind(null, centre.id, path)}
              centre={centre}
              taxonomy={taxonomy}
              selected={{
                stage_ids: centre.center_stages.map((s) => s.stage_id),
                sector_ids: centre.center_sectors.map((s) => s.sector_id),
                service_ids: centre.center_services.map((s) => s.support_need_id),
              }}
            />
          </details>
        </div>

        <aside className="side-panel stack">
          <section className="card">
            <h2 className="h3">Status</h2>
            <p>
              Currently <strong>{labelFor(CENTER_STATUSES, centre.status)}</strong>
              {centre.status_reason ? `: ${centre.status_reason}` : ""}
            </p>
            <ActionForm action={setCentreStatus.bind(null, centre.id)}>
              <Select name="status" label="Change status" placeholder={null} options={CENTER_STATUSES} defaultValue={centre.status} required />
              <TextArea name="reason" label="Reason" rows={2} hint="Required to suspend or remove. The centre's staff see it." />
              <SubmitButton variant="secondary" small pendingText="Saving…">
                Save status
              </SubmitButton>
            </ActionForm>
            <p className="muted small">
              Suspended: history is kept and staff can read it, but no new applications, conversations or bookings. Removed: hidden from
              everyone except people with existing history.
            </p>
          </section>
          <section className="card">
            <h2 className="h3">Delete</h2>
            <p className="small">Only possible for a centre with no applications, conversations or bookings. Otherwise remove it with the status above.</p>
            <form action={deleteCentre.bind(null, centre.id)}>
              <ConfirmButton message={`Delete ${centre.name}? This can't be undone.`}>Delete centre</ConfirmButton>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
