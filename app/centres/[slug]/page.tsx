import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpertCard } from "@/components/experts/expert-card";
import { ExternalLink } from "@/components/external-link";
import { ApplicationStatusBadge, CentreStatusBadge, SampleBadge } from "@/components/status";
import { getViewer } from "@/lib/auth";
import { isOpenForApplications } from "@/lib/directory";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { supabase } = await getViewer();
  const { data } = await supabase.from("incubation_centers").select("name").eq("slug", slug).maybeSingle();
  return { title: data?.name ?? "Centre" };
}

export default async function CentrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, user } = await getViewer();

  const { data: centre } = await supabase
    .from("incubation_centers")
    .select(
      "*, center_stages(startup_stages(name, sort_order)), center_sectors(sectors(name)), center_services(support_needs(name, sort_order)), center_experts(id, full_name, headline, organization, expertise_tags, engagement_policy, is_paid, fee_inr, session_minutes, offers_online, offers_in_person, is_active)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!centre || centre.status === "archived") notFound();

  const experts = centre.center_experts.filter((e) => e.is_active);
  const stages = centre.center_stages.flatMap((s) => (s.startup_stages ? [s.startup_stages] : [])).sort((a, b) => a.sort_order - b.sort_order);
  const sectors = centre.center_sectors.flatMap((s) => (s.sectors ? [s.sectors.name] : [])).sort();
  const services = centre.center_services.flatMap((s) => (s.support_needs ? [s.support_needs] : [])).sort((a, b) => a.sort_order - b.sort_order);
  const open = centre.status === "active" && isOpenForApplications(centre.accepting_applications, centre.applications_close_on);

  let application: { id: string; status: Parameters<typeof ApplicationStatusBadge>[0]["status"] } | null = null;
  if (user) {
    const { data } = await supabase.from("startup_applications").select("id, status").eq("center_id", centre.id).eq("founder_id", user.id).maybeSingle();
    application = data;
  }

  return (
    <article>
      <p className="breadcrumbs">
        <Link href="/centres">All centres</Link>
      </p>
      <div className="section-head">
        <h1>{centre.name}</h1>
        <p className="tags">
          <SampleBadge show={centre.is_sample} />
          <CentreStatusBadge status={centre.status} />
        </p>
      </div>
      {centre.is_sample ? (
        <p className="alert alert-info">This is a fictional sample listing used to demonstrate UdyamSetu. It is not a real organisation.</p>
      ) : null}
      {centre.status === "suspended" ? (
        <p className="alert alert-error">This centre is suspended. It can&apos;t take new applications or start conversations right now. Existing applications are kept.</p>
      ) : null}

      <div className="layout-split">
        <div>
          {centre.short_description ? <p className="lead">{centre.short_description}</p> : null}
          {centre.description ? <p className="pre-line">{centre.description}</p> : null}

          <h2>Support offered</h2>
          {services.length ? (
            <ul className="tags plain">
              {services.map((s) => (
                <li key={s.name} className="badge">
                  {s.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Not listed.</p>
          )}

          <h2>How to apply</h2>
          <p className="pre-line">{centre.application_guidance ?? "The centre hasn't added guidance yet. Complete your venture profile and tell them why you'd like to join."}</p>

          <h2>Mentors and experts</h2>
          {experts.length ? (
            <ul className="card-grid">
              {experts.map((e) => (
                <ExpertCard key={e.id} expert={e} />
              ))}
            </ul>
          ) : (
            <p className="empty">This centre hasn&apos;t listed any mentors or experts yet. That doesn&apos;t affect your application: you can still apply.</p>
          )}
        </div>

        <aside className="side-panel" aria-label="Centre details">
          <div className="card">
            {application ? (
              <>
                <p>
                  Your application: <ApplicationStatusBadge status={application.status} />
                </p>
                <Link href={`/applications/${application.id}`} className="btn btn-primary">
                  {application.status === "draft" ? "Continue your application" : "View your application"}
                </Link>
              </>
            ) : open ? (
              <>
                <p>
                  <strong>Accepting applications</strong>
                  {centre.applications_close_on ? ` until ${formatDate(centre.applications_close_on)}` : ""}
                </p>
                <Link href={`/centres/${centre.slug}/apply`} className="btn btn-primary">
                  Apply to this centre
                </Link>
              </>
            ) : (
              <p>
                <strong>Not accepting applications right now.</strong> You can still browse its mentors.
              </p>
            )}
          </div>
          <dl className="details stacked">
            <div>
              <dt>Stages supported</dt>
              <dd>{stages.length ? stages.map((s) => s.name).join(", ") : "Not listed"}</dd>
            </div>
            <div>
              <dt>Sectors</dt>
              <dd>{sectors.length ? sectors.join(", ") : "All sectors"}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{[centre.address, centre.city, centre.district].filter(Boolean).join(", ") || "Not listed"}</dd>
            </div>
            {centre.host_institution ? (
              <div>
                <dt>Host institution</dt>
                <dd>{centre.host_institution}</dd>
              </div>
            ) : null}
            {centre.website ? (
              <div>
                <dt>Website</dt>
                <dd>
                  <ExternalLink href={centre.website} />
                </dd>
              </div>
            ) : null}
            {centre.public_email ? (
              <div>
                <dt>Public contact</dt>
                <dd>{centre.public_email}</dd>
              </div>
            ) : null}
          </dl>
        </aside>
      </div>
    </article>
  );
}
