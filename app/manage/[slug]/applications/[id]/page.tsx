import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { changeStatus } from "@/app/actions/applications";
import { startThread } from "@/app/actions/messages";
import { SnapshotView } from "@/components/applications/snapshot";
import { StatusTimeline } from "@/components/applications/timeline";
import { ActionForm, Field, Select, SubmitButton, TextArea } from "@/components/form";
import { Notice } from "@/components/notice";
import { ApplicationStatusBadge } from "@/components/status";
import { requireCentreStaff } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { APPLICATION_STATUSES, NEXT_APPLICATION_STATUSES, labelFor } from "@/lib/options";
import type { ProfileSnapshot } from "@/lib/types";

export const metadata: Metadata = { title: "Review application" };

export default async function ReviewApplicationPage({ params, searchParams }: { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { slug, id } = await params;
  const { notice, error } = await searchParams;
  const path = `/manage/${slug}/applications/${id}`;
  const { supabase, centre } = await requireCentreStaff(slug, path);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: app } = await supabase
    .from("startup_applications")
    .select("id, status, startup_id, cover_note, founder_response, share_financials, profile_snapshot, snapshot_taken_at, submitted_at, last_status_at")
    .eq("id", id)
    .eq("center_id", centre.id)
    .maybeSingle();
  if (!app) notFound();

  const [{ data: history }, { data: threads }] = await Promise.all([
    supabase.from("application_status_history").select("id, from_status, to_status, note, changed_by_side, created_at").eq("application_id", id).order("created_at"),
    supabase.from("message_threads").select("id, subject, last_message_at").eq("center_id", centre.id).eq("startup_id", app.startup_id).order("last_message_at", { ascending: false }),
  ]);

  const snapshot = app.profile_snapshot as unknown as ProfileSnapshot | null;
  const startupName = snapshot?.startup.name ?? "This startup";
  const next = NEXT_APPLICATION_STATUSES[app.status];
  const active = centre.status === "active";

  return (
    <>
      <p className="breadcrumbs">
        <Link href={`/manage/${slug}/applications`}>Applications</Link>
      </p>
      <Notice code={notice} error={error} />
      <div className="section-head">
        <h2>{startupName}</h2>
        <ApplicationStatusBadge status={app.status} />
      </div>
      <p className="muted small">
        Submitted {formatDateTime(app.submitted_at)} · last update {formatDateTime(app.last_status_at)}
      </p>

      <div className="layout-split">
        <div className="stack">
          {app.cover_note ? (
            <section className="card">
              <h3>Note from the founder</h3>
              <p className="pre-line">{app.cover_note}</p>
            </section>
          ) : null}
          {app.founder_response ? (
            <section className="card highlight">
              <h3>Founder&apos;s reply to your information request</h3>
              <p className="pre-line">{app.founder_response}</p>
            </section>
          ) : null}
          {snapshot ? <SnapshotView snapshot={snapshot} takenAt={app.snapshot_taken_at} /> : null}
        </div>

        <aside className="side-panel stack">
          <section className="card">
            <h3>Decision</h3>
            {!active ? (
              <p className="muted">The centre is suspended, so statuses can&apos;t be changed.</p>
            ) : next.length ? (
              <ActionForm action={changeStatus.bind(null, slug, app.id)}>
                <Select name="status" label="Change status to" options={next.map((s) => ({ value: s, label: labelFor(APPLICATION_STATUSES, s) }))} required />
                <TextArea
                  name="note"
                  label="Note to the founder"
                  rows={4}
                  hint="Required when you ask for more information. The founder sees this note."
                />
                <SubmitButton pendingText="Updating…">Update status</SubmitButton>
              </ActionForm>
            ) : (
              <p className="muted">This application is closed with the status &quot;{labelFor(APPLICATION_STATUSES, app.status)}&quot;.</p>
            )}
          </section>

          <section className="card">
            <h3>Conversations</h3>
            {threads && threads.length ? (
              <ul className="plain stack-tight">
                {threads.map((t) => (
                  <li key={t.id}>
                    <Link href={`/manage/${slug}/messages/${t.id}`}>{t.subject}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">No conversations with this startup yet.</p>
            )}
            {active ? (
              <details>
                <summary>Message {startupName}</summary>
                <ActionForm action={startThread.bind(null, { centreId: centre.id, startupId: app.startup_id, applicationId: app.id, side: "center", slug })}>
                  <Field name="subject" label="Subject" required defaultValue={`Your application to ${centre.name}`} />
                  <TextArea name="body" label="Message" required rows={4} />
                  <SubmitButton pendingText="Sending…">Send message</SubmitButton>
                </ActionForm>
              </details>
            ) : null}
          </section>

          <section className="card">
            <h3>History</h3>
            <StatusTimeline history={history ?? []} centreName={centre.name} />
          </section>
        </aside>
      </div>
    </>
  );
}
