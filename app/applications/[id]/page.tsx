import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteDraft, respondToRequest, saveDraft } from "@/app/actions/applications";
import { startThread } from "@/app/actions/messages";
import { SnapshotView } from "@/components/applications/snapshot";
import { StatusTimeline } from "@/components/applications/timeline";
import { ConfirmButton } from "@/components/confirm-button";
import { ActionForm, Checkbox, Field, SubmitButton, TextArea } from "@/components/form";
import { Notice } from "@/components/notice";
import { ApplicationStatusBadge, SampleBadge } from "@/components/status";
import { requireUser } from "@/lib/auth";
import { isOpenForApplications } from "@/lib/directory";
import { formatDateTime } from "@/lib/format";
import type { ProfileSnapshot } from "@/lib/types";

export const metadata: Metadata = { title: "Application" };

export default async function ApplicationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { id } = await params;
  const { notice, error } = await searchParams;
  const { supabase, user } = await requireUser(`/applications/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: app } = await supabase
    .from("startup_applications")
    .select("*, incubation_centers(id, name, slug, is_sample, status, accepting_applications, applications_close_on, application_guidance)")
    .eq("id", id)
    .eq("founder_id", user.id)
    .maybeSingle();
  if (!app || !app.incubation_centers) notFound();
  const centre = app.incubation_centers;

  const [{ data: history }, { data: threads }, { count: financialCount }] = await Promise.all([
    supabase.from("application_status_history").select("*").eq("application_id", id).order("created_at"),
    supabase.from("message_threads").select("id, subject, last_message_at").eq("application_id", id).order("last_message_at", { ascending: false }),
    supabase.from("startup_financials").select("id", { count: "exact", head: true }).eq("startup_id", app.startup_id),
  ]);

  const gaps = app.status === "draft" ? ((await supabase.rpc("startup_profile_gaps", { p_startup_id: app.startup_id })).data ?? []) : [];
  const open = centre.status === "active" && isOpenForApplications(centre.accepting_applications, centre.applications_close_on);
  const lastRequest = [...(history ?? [])].reverse().find((h) => h.to_status === "more_information_needed");

  return (
    <>
      <p className="breadcrumbs">
        <Link href="/applications">My applications</Link>
      </p>
      <Notice code={notice} error={error} />
      <div className="section-head">
        <h1>
          {centre.name} <SampleBadge show={centre.is_sample} />
        </h1>
        <ApplicationStatusBadge status={app.status} />
      </div>
      <p className="muted">
        Started {formatDateTime(app.created_at)}
        {app.submitted_at ? ` · Submitted ${formatDateTime(app.submitted_at)}` : ""} · Last update {formatDateTime(app.last_status_at)}
      </p>
      {centre.status === "suspended" ? (
        <p className="alert alert-error">This centre is currently suspended. Your application is kept, but the centre can&apos;t take new applications or send messages for now.</p>
      ) : null}

      {app.status === "draft" ? (
        <section className="narrow" aria-labelledby="draft">
          <h2 id="draft">Finish your application</h2>
          {!open ? <p className="alert alert-info">This centre isn&apos;t accepting applications right now, so the draft can&apos;t be submitted yet.</p> : null}
          {gaps.length ? (
            <div className="alert alert-info">
              <p>Add these to your venture profile before submitting:</p>
              <ul>
                {gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
              <Link href="/venture">Go to your venture profile</Link>
            </div>
          ) : null}
          {centre.application_guidance ? (
            <details className="card">
              <summary>Guidance from {centre.name}</summary>
              <p className="pre-line">{centre.application_guidance}</p>
            </details>
          ) : null}
          <ActionForm action={saveDraft.bind(null, app.id)}>
            <TextArea name="cover_note" label={`Why ${centre.name}?`} rows={5} hint="What you hope to get from this centre. Up to 3000 characters." defaultValue={app.cover_note} />
            {financialCount ? (
              <Checkbox
                name="share_financials"
                label="Include my latest financial figures in this application"
                hint="Only this centre sees them, and only as part of this application."
                defaultChecked={app.share_financials}
              />
            ) : (
              <p className="muted small">
                You haven&apos;t added financial figures. They&apos;re optional; <Link href="/venture/financials">add them</Link> if you&apos;d like to share them.
              </p>
            )}
            <p className="muted small">When you submit, {centre.name} receives a copy of your venture profile as it is now. Your email and phone are included only if you chose to share them.</p>
            <div className="actions">
              <SubmitButton name="intent" value="submit" pendingText="Submitting…">
                Submit application
              </SubmitButton>
              <SubmitButton name="intent" value="save" variant="secondary">
                Save draft
              </SubmitButton>
            </div>
          </ActionForm>
          <form action={deleteDraft.bind(null, app.id)} className="form-gap">
            <ConfirmButton message="Delete this draft application?" className="btn btn-secondary btn-small">
              Delete draft
            </ConfirmButton>
          </form>
        </section>
      ) : (
        <div className="layout-split">
          <div>
            {app.status === "more_information_needed" ? (
              <section className="card highlight" aria-labelledby="request">
                <h2 id="request" className="h3">
                  {centre.name} needs more information
                </h2>
                {lastRequest?.note ? <p className="pre-line">{lastRequest.note}</p> : null}
                <ActionForm action={respondToRequest.bind(null, app.id)}>
                  <TextArea name="response" label="Your reply" required rows={5} hint="If they asked for profile changes, update your venture profile first: the centre gets a fresh copy when you reply." />
                  <SubmitButton pendingText="Sending…">Send reply</SubmitButton>
                </ActionForm>
              </section>
            ) : null}
            {app.status === "accepted" ? (
              <p className="alert alert-success">
                {centre.name} accepted your application. They&apos;ll contact you through UdyamSetu messages about next steps. Mentors at this centre who work
                only with admitted startups are now available to you.
              </p>
            ) : null}

            <h2>Status history</h2>
            <StatusTimeline history={history ?? []} centreName={centre.name} />

            <h2>Messages about this application</h2>
            {threads && threads.length ? (
              <ul className="thread-list">
                {threads.map((t) => (
                  <li key={t.id}>
                    <Link href={`/messages/${t.id}`}>{t.subject}</Link> <span className="muted small">{formatDateTime(t.last_message_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No messages yet.</p>
            )}
            {centre.status === "active" ? (
              <details className="card">
                <summary>Message {centre.name}</summary>
                <ActionForm action={startThread.bind(null, { centreId: centre.id, startupId: app.startup_id, applicationId: app.id, side: "founder", slug: centre.slug })}>
                  <Field name="subject" label="Subject" required />
                  <TextArea name="body" label="Message" required rows={4} />
                  <SubmitButton pendingText="Sending…">Send message</SubmitButton>
                </ActionForm>
              </details>
            ) : null}
          </div>
          <aside className="side-panel">
            <details className="card" open={false}>
              <summary>What {centre.name} received</summary>
              {app.profile_snapshot ? <SnapshotView snapshot={app.profile_snapshot as unknown as ProfileSnapshot} takenAt={app.snapshot_taken_at} /> : null}
              {app.cover_note ? (
                <>
                  <h3>Your note</h3>
                  <p className="pre-line">{app.cover_note}</p>
                </>
              ) : null}
            </details>
          </aside>
        </div>
      )}
    </>
  );
}
