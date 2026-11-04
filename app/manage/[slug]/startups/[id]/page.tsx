import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { startThread } from "@/app/actions/messages";
import { ExternalLink } from "@/components/external-link";
import { ActionForm, Field, SubmitButton, TextArea } from "@/components/form";
import { ApplicationStatusBadge } from "@/components/status";
import { requireCentreStaff } from "@/lib/auth";
import { LEGAL_STATUSES, OFFERING_TYPES, TRACTION_LEVELS, labelFor } from "@/lib/options";
import { loadTaxonomy, nameById } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Startup" };

export default async function StaffStartupPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const path = `/manage/${slug}/startups/${id}`;
  const { supabase, centre } = await requireCentreStaff(slug, path);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: startup }, taxonomy] = await Promise.all([
    supabase
      .from("startups")
      .select(
        "id, name, description, founding_year, problem, solution, target_customers, offering_type, domain, district, city, legal_status, dpiit_recognised, traction_level, traction_summary, website, pitch_deck_url, demo_url, stage_id, startup_sectors(sector_id), startup_support_needs(support_need_id), startup_members(id, full_name, role_title, is_founder)",
      )
      .eq("id", id)
      .maybeSingle(),
    loadTaxonomy(supabase, { includeInactive: true }),
  ]);
  if (!startup) notFound();

  const [{ data: contact }, { data: applications }, { data: threads }] = await Promise.all([
    supabase.rpc("startup_contact", { p_startup_id: id }),
    supabase.from("startup_applications").select("id, status").eq("center_id", centre.id).eq("startup_id", id).neq("status", "draft"),
    supabase.from("message_threads").select("id, subject").eq("center_id", centre.id).eq("startup_id", id).order("last_message_at", { ascending: false }),
  ]);
  const shared = contact?.[0];
  const stageNames = nameById(taxonomy.stages);
  const sectorNames = nameById(taxonomy.sectors);
  const needNames = nameById(taxonomy.needs);
  const active = centre.status === "active";

  return (
    <>
      <p className="breadcrumbs">
        <Link href={`/manage/${slug}/startups`}>Find startups</Link>
      </p>
      <h2>{startup.name}</h2>
      {startup.description ? <p className="lead">{startup.description}</p> : null}
      <div className="layout-split">
        <div className="stack">
          <dl className="details">
            <div>
              <dt>Stage</dt>
              <dd>{startup.stage_id ? stageNames.get(startup.stage_id) : "—"}</dd>
            </div>
            <div>
              <dt>Sectors</dt>
              <dd>{startup.startup_sectors.map((s) => sectorNames.get(s.sector_id)).join(", ") || "—"}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{[startup.city, startup.district].filter(Boolean).join(", ") || "—"}</dd>
            </div>
            <div>
              <dt>Founded</dt>
              <dd>{startup.founding_year ?? "—"}</dd>
            </div>
            <div>
              <dt>Offering</dt>
              <dd>{labelFor(OFFERING_TYPES, startup.offering_type) || "—"}</dd>
            </div>
            <div>
              <dt>Legal status</dt>
              <dd>
                {labelFor(LEGAL_STATUSES, startup.legal_status) || "—"}
                {startup.dpiit_recognised ? " · DPIIT recognised (self-reported)" : ""}
              </dd>
            </div>
            <div>
              <dt>Traction</dt>
              <dd>{labelFor(TRACTION_LEVELS, startup.traction_level) || "—"}</dd>
            </div>
          </dl>
          {startup.problem ? (
            <section>
              <h3>Problem</h3>
              <p className="pre-line">{startup.problem}</p>
            </section>
          ) : null}
          {startup.solution ? (
            <section>
              <h3>Solution</h3>
              <p className="pre-line">{startup.solution}</p>
            </section>
          ) : null}
          {startup.target_customers ? (
            <section>
              <h3>Target customers</h3>
              <p className="pre-line">{startup.target_customers}</p>
            </section>
          ) : null}
          {startup.traction_summary ? (
            <section>
              <h3>Traction so far</h3>
              <p className="pre-line">{startup.traction_summary}</p>
            </section>
          ) : null}
          <section>
            <h3>Support they are looking for</h3>
            <p>{startup.startup_support_needs.map((n) => needNames.get(n.support_need_id)).join(", ") || "Not specified yet"}</p>
          </section>
          <section>
            <h3>Team</h3>
            {startup.startup_members.length ? (
              <ul>
                {startup.startup_members.map((m) => (
                  <li key={m.id}>
                    {m.full_name}
                    {m.role_title ? `, ${m.role_title}` : ""}
                    {m.is_founder ? " (founder)" : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No team members listed.</p>
            )}
          </section>
          <section>
            <h3>Links</h3>
            <ul className="plain stack-tight">
              <li>Website: <ExternalLink href={startup.website} /></li>
              <li>Pitch deck: <ExternalLink href={startup.pitch_deck_url} /></li>
              <li>Demo: <ExternalLink href={startup.demo_url} /></li>
            </ul>
          </section>
          <p className="muted small">Financial details are private. A founder can choose to share them with a centre when applying.</p>
        </div>

        <aside className="side-panel stack">
          <section className="card">
            <h3>Contact</h3>
            {shared?.shared ? (
              <ul className="plain stack-tight">
                <li>Email: {shared.email}</li>
                {shared.phone ? <li>Phone: {shared.phone}</li> : null}
              </ul>
            ) : (
              <p className="muted small">The founder hasn&apos;t shared contact details. Use UdyamSetu messages to reach them.</p>
            )}
          </section>
          {applications && applications.length ? (
            <section className="card">
              <h3>Application to {centre.name}</h3>
              {applications.map((a) => (
                <p key={a.id}>
                  <Link href={`/manage/${slug}/applications/${a.id}`}>Open application</Link> <ApplicationStatusBadge status={a.status} />
                </p>
              ))}
            </section>
          ) : null}
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
            ) : null}
            {active ? (
              <ActionForm action={startThread.bind(null, { centreId: centre.id, startupId: startup.id, side: "center", slug })}>
                <Field name="subject" label="Subject" required defaultValue={`Hello from ${centre.name}`} />
                <TextArea name="body" label="Message" required rows={4} hint="The founder gets a notification and can reply, archive or report the conversation." />
                <SubmitButton pendingText="Sending…">Start conversation</SubmitButton>
              </ActionForm>
            ) : (
              <p className="muted small">The centre is suspended, so it can&apos;t start new conversations.</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
