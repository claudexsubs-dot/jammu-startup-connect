import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpertCard } from "@/components/experts/expert-card";
import { centreInitials } from "@/components/centres/centre-card";
import { ExternalLink } from "@/components/external-link";
import { Icons } from "@/components/icons";
import { ApplicationStatusBadge, CentreStatusBadge, SampleBadge } from "@/components/status";
import { getViewer } from "@/lib/auth";
import { isOpenForApplications } from "@/lib/directory";
import { formatDate } from "@/lib/format";
import { regionOf } from "@/lib/options";

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
  const { data: directory } = experts.length ? await supabase.rpc("expert_directory") : { data: [] };
  const nextSlots = new Map((directory ?? []).filter((d) => d.center_id === centre.id).map((d) => [d.id, d]));
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
        <Link href="/centres">
          <Icons.back /> All centres
        </Link>
      </p>
      <div className="profile-hero">
        <span className="centre-logo centre-logo-lg" aria-hidden="true">
          {centreInitials(centre.name)}
        </span>
        <div className="grow">
          <h1>{centre.name}</h1>
          <p className="meta-line">
            {centre.host_institution ? (
              <span>
                <Icons.building /> {centre.host_institution}
              </span>
            ) : null}
            <span>
              <Icons.pin /> {[centre.city, centre.district !== centre.city ? centre.district : null].filter(Boolean).join(", ") || "Location not listed"}
            </span>
            {regionOf(centre.district) ? <span className="badge badge-quiet">{regionOf(centre.district)}</span> : null}
            <SampleBadge show={centre.is_sample} />
            <CentreStatusBadge status={centre.status} />
          </p>
        </div>
        {experts.length ? (
          <a href="#experts" className="btn btn-secondary">
            <Icons.calendar /> Book an expert here
          </a>
        ) : null}
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
          {centre.source_label || centre.source_url ? (
            <p className="source-note">
              <Icons.link />
              <span>
                <strong>Listing source:</strong>{" "}
                {centre.source_url ? <ExternalLink href={centre.source_url}>{centre.source_label ?? "Public source"}</ExternalLink> : centre.source_label}. UdyamSetu is
                independent and lists this centre for founders&apos; convenience; it doesn&apos;t claim any partnership.
              </span>
            </p>
          ) : null}

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

          <h2 id="experts">Mentors and experts</h2>
          {experts.length ? (
            <ul className="card-grid">
              {experts.map((e) => (
                <ExpertCard key={e.id} expert={e} nextSlotAt={nextSlots.get(e.id)?.next_slot_at ?? null} openCount={nextSlots.get(e.id)?.open_slots_14d} />
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
              <>
                <p>
                  <strong>Applications aren&apos;t open on UdyamSetu yet.</strong>
                </p>
                <p className="muted small">
                  {centre.website ? "You can contact the centre through its website. " : ""}Get your venture profile ready so you can apply in one click once it opens.
                </p>
                <div className="stack-tight">
                  {centre.website ? (
                    <ExternalLink href={centre.website}>
                      <span className="btn btn-secondary btn-block">Visit the centre&apos;s website</span>
                    </ExternalLink>
                  ) : null}
                  <Link href={user ? "/venture" : `/register?next=/centres/${centre.slug}`} className="btn btn-primary btn-block">
                    {user ? "Prepare your venture profile" : "Create a free account"}
                  </Link>
                </div>
              </>
            )}
          </div>
          <dl className="details stacked">
            <div>
              <dt>Stages supported</dt>
              <dd>{stages.length ? stages.map((s) => s.name).join(", ") : "Not listed yet"}</dd>
            </div>
            <div>
              <dt>Sectors</dt>
              <dd>{sectors.length ? sectors.join(", ") : "Not listed yet"}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{[...new Set([centre.address, centre.city, centre.district].filter(Boolean))].join(", ") || "Not listed"}</dd>
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
