import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setPublished } from "@/app/actions/startups";
import { SubmitButton } from "@/components/form";
import { Notice } from "@/components/notice";
import { ManageNav } from "@/components/startups/manage-nav";
import { isUuid } from "@/lib/ids";
import { labelFor, LEGAL_STATUSES, OFFERING_TYPES, STAGES } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> };

async function load(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("startups").select("*, sectors(name)").eq("id", id).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const startup = await load((await params).id);
  return { title: startup?.name ?? "Startup not found" };
}

export default async function StartupPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { notice } = await searchParams;
  // Row Level Security only returns this row if it's published or the viewer is on the team.
  const startup = await load(id);
  if (!startup) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = user
    ? await supabase.from("startup_members").select("access").eq("startup_id", id).eq("user_id", user.id).maybeSingle()
    : { data: null };
  const canEdit = membership?.access === "owner" || membership?.access === "editor";

  const location = [startup.city, startup.district, startup.state].filter(Boolean).join(", ");
  const details: [string, string | null][] = [
    ["Stage", labelFor(STAGES, startup.stage)],
    ["Sector", startup.sectors?.name ?? null],
    ["Domain", startup.domain],
    ["Founded", startup.founding_year ? String(startup.founding_year) : null],
    ["Location", location],
    ["Legal status", labelFor(LEGAL_STATUSES, startup.legal_status)],
    ["Registration number", startup.registration_number],
    ["DPIIT recognised", startup.dpiit_recognised ? "Yes" : "No"],
  ];

  return (
    <article>
      <Notice code={notice} />
      {canEdit ? <ManageNav startupId={id} current="profile" /> : null}
      <div className="section-head">
        <h1>{startup.name}</h1>
        {canEdit ? <span className={`badge ${startup.is_published ? "badge-live" : "badge-draft"}`}>{startup.is_published ? "Published" : "Draft"}</span> : null}
      </div>

      {canEdit ? (
        <form action={setPublished.bind(null, id, !startup.is_published)} className="publish-bar">
          <p>
            {startup.is_published
              ? "Anyone can see this profile in the startup directory. Financials always stay private."
              : "Only your team can see this profile. Publish it to list it in the startup directory."}
          </p>
          <SubmitButton variant={startup.is_published ? "secondary" : "primary"} pendingText="Updating…">
            {startup.is_published ? "Unpublish" : "Publish profile"}
          </SubmitButton>
        </form>
      ) : null}

      {startup.description ? <p className="lead">{startup.description}</p> : null}

      <dl className="details">
        {details
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>

      {startup.product_or_service || startup.offering_type ? (
        <section>
          <h2>{startup.offering_type ? labelFor(OFFERING_TYPES, startup.offering_type) : "Product or service"}</h2>
          {startup.product_or_service ? <p>{startup.product_or_service}</p> : null}
        </section>
      ) : null}
      {startup.target_customers ? (
        <section>
          <h2>Target customers</h2>
          <p>{startup.target_customers}</p>
        </section>
      ) : null}
      {startup.website ? (
        <p>
          <a href={startup.website} target="_blank" rel="noopener noreferrer nofollow">
            Visit website
          </a>
        </p>
      ) : null}
    </article>
  );
}
