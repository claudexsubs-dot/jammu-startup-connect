import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteExpert, inviteExpert, revokeInvitation, setExpertActive, updateExpert } from "@/app/actions/experts";
import { BookingTable } from "@/components/bookings/booking-table";
import { ConfirmButton } from "@/components/confirm-button";
import { ExpertForm } from "@/components/experts/expert-form";
import { SlotManager } from "@/components/experts/slot-manager";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Notice } from "@/components/notice";
import { requireCentreStaff } from "@/lib/auth";
import { BOOKING_LIST_SELECT } from "@/lib/bookings";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Mentor or expert" };

export default async function ManageExpertPage({ params, searchParams }: { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { slug, id } = await params;
  const { notice, error } = await searchParams;
  const path = `/manage/${slug}/experts/${id}`;
  const { supabase, centre } = await requireCentreStaff(slug, path);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: expert } = await supabase.from("center_experts").select("*").eq("id", id).eq("center_id", centre.id).maybeSingle();
  if (!expert) notFound();

  const now = new Date().toISOString();
  const [{ data: slots }, { data: invitations }, { data: bookings }] = await Promise.all([
    supabase
      .from("availability_slots")
      .select("id, starts_at, ends_at, is_cancelled, consultation_bookings!consultation_bookings_slot_id_fkey(id, status)")
      .eq("expert_id", id)
      .eq("is_cancelled", false)
      .gt("starts_at", now)
      .order("starts_at")
      .limit(100),
    supabase.from("invitations").select("id, email, created_at, expires_at").eq("expert_id", id).eq("status", "pending").gt("expires_at", now),
    supabase
      .from("consultation_bookings")
      .select(BOOKING_LIST_SELECT)
      .eq("expert_id", id)
      .in("status", ["pending", "payment_instructions_sent", "confirmed"])
      .order("starts_at"),
  ]);
  const active = centre.status === "active";

  return (
    <>
      <p className="breadcrumbs">
        <Link href={`/manage/${slug}/experts`}>Mentors and experts</Link>
      </p>
      <Notice code={notice} error={error} />
      <div className="section-head">
        <h2>{expert.full_name}</h2>
        {expert.is_active ? <span className="badge badge-live">Active</span> : <span className="badge badge-quiet">Inactive</span>}
      </div>
      <p>
        <Link href={`/experts/${expert.id}`}>View public profile</Link>
      </p>

      <div className="layout-split">
        <div className="stack">
          <section className="stack">
            <h3>Open requests and upcoming sessions</h3>
            {bookings && bookings.length ? (
              <BookingTable bookings={bookings} basePath={`/manage/${slug}/bookings`} show="startup" caption={`Bookings for ${expert.full_name}`} />
            ) : (
              <p className="muted">None right now.</p>
            )}
          </section>
          <SlotManager expertId={expert.id} returnPath={path} slots={slots ?? []} sessionMinutes={expert.session_minutes} bookingBasePath={`/manage/${slug}/bookings`} />
          <details className="card">
            <summary>Edit profile, policy and fee</summary>
            <ExpertForm action={updateExpert.bind(null, expert.id, path)} expert={expert} />
          </details>
        </div>

        <aside className="side-panel stack">
          <section className="card">
            <h3>Visibility</h3>
            <p className="small">
              {expert.is_active
                ? "Founders can see this profile and send requests."
                : "Hidden from founders. Existing bookings are kept."}
            </p>
            {active || expert.is_active ? (
              <form action={setExpertActive.bind(null, expert.id, path, !expert.is_active)}>
                <SubmitButton variant="secondary" small>
                  {expert.is_active ? "Deactivate" : "Activate"}
                </SubmitButton>
              </form>
            ) : null}
          </section>

          <section className="card">
            <h3>Their own account</h3>
            {expert.user_id ? (
              <p className="small">This profile is linked to the expert&apos;s account. They can manage availability and answer requests themselves.</p>
            ) : (
              <>
                <p className="small">Invite the expert to link their account so they can answer requests themselves. Until then, your staff manage them.</p>
                {invitations && invitations.length ? (
                  <ul className="plain stack-tight">
                    {invitations.map((i) => (
                      <li key={i.id}>
                        <span className="small">
                          Invited {i.email} · expires {formatDate(i.expires_at)}
                        </span>
                        <form action={revokeInvitation.bind(null, i.id, path)}>
                          <ConfirmButton message="Withdraw this invitation?" className="link-button danger-link">
                            Withdraw
                          </ConfirmButton>
                        </form>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {active ? (
                  <ActionForm action={inviteExpert.bind(null, expert.id, path)}>
                    <Field name="email" label="Expert's email" type="email" required />
                    <SubmitButton variant="secondary" small pendingText="Creating…">
                      Create invitation link
                    </SubmitButton>
                  </ActionForm>
                ) : null}
              </>
            )}
          </section>

          <section className="card">
            <h3>Delete</h3>
            <p className="small">Only possible when there are no bookings on record. Otherwise deactivate the profile.</p>
            <form action={deleteExpert.bind(null, expert.id, slug)}>
              <ConfirmButton message={`Delete ${expert.full_name}'s profile? This can't be undone.`}>Delete profile</ConfirmButton>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
