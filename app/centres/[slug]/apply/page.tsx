import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { startApplication } from "@/app/actions/applications";
import { SubmitButton } from "@/components/form";
import { Notice } from "@/components/notice";
import { SampleBadge } from "@/components/status";
import { requireUser } from "@/lib/auth";
import { isOpenForApplications } from "@/lib/directory";

export const metadata: Metadata = { title: "Apply" };

export default async function ApplyPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  const { slug } = await params;
  const { error } = await searchParams;
  const { supabase, user } = await requireUser(`/centres/${slug}/apply`);

  const { data: centre } = await supabase
    .from("incubation_centers")
    .select("id, slug, name, status, is_sample, accepting_applications, applications_close_on, application_guidance")
    .eq("slug", slug)
    .maybeSingle();
  if (!centre || centre.status === "archived") notFound();

  // One application per centre: resume the existing one instead of starting another.
  const { data: existing } = await supabase.from("startup_applications").select("id").eq("center_id", centre.id).eq("founder_id", user.id).maybeSingle();
  if (existing) redirect(`/applications/${existing.id}`);

  const { data: startup } = await supabase.from("startups").select("id, name").eq("owner_id", user.id).maybeSingle();
  const gaps = startup ? ((await supabase.rpc("startup_profile_gaps", { p_startup_id: startup.id })).data ?? []) : [];
  const open = centre.status === "active" && isOpenForApplications(centre.accepting_applications, centre.applications_close_on);

  return (
    <section className="narrow">
      <p className="breadcrumbs">
        <Link href={`/centres/${centre.slug}`}>{centre.name}</Link>
      </p>
      <h1>
        Apply to {centre.name} <SampleBadge show={centre.is_sample} />
      </h1>
      <Notice error={error} />

      {centre.status === "suspended" ? (
        <p className="alert alert-error">This centre is suspended, so it can&apos;t take new applications right now.</p>
      ) : !open ? (
        <p className="alert alert-info">This centre isn&apos;t accepting applications at the moment. Check back later or browse other centres.</p>
      ) : !startup ? (
        <div className="empty">
          <p>Before you can apply, create your venture profile. It only takes a few minutes and you can save it as a draft.</p>
          <Link href="/venture" className="btn btn-primary">
            Create your venture profile
          </Link>
        </div>
      ) : (
        <>
          <p>
            You&apos;ll start a draft application for <strong>{startup.name}</strong>. You can add a note for the centre and
            submit when you&apos;re ready. When you submit, the centre receives a copy of your venture profile as it is at
            that moment.
          </p>
          {gaps.length ? (
            <div className="alert alert-info">
              <p>You can start the draft now, but you&apos;ll need to add these to your venture profile before you can submit:</p>
              <ul>
                {gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
              <p>
                <Link href="/venture">Complete your venture profile</Link>
              </p>
            </div>
          ) : (
            <p className="alert alert-success">Your venture profile has everything needed to apply.</p>
          )}
          {centre.application_guidance ? (
            <div className="card">
              <h2 className="h3">Guidance from the centre</h2>
              <p className="pre-line">{centre.application_guidance}</p>
            </div>
          ) : null}
          <form action={startApplication.bind(null, centre.id, centre.slug)} className="actions form-gap">
            <SubmitButton pendingText="Starting…">Start application</SubmitButton>
            <Link href={`/centres/${centre.slug}`}>Back to the centre</Link>
          </form>
        </>
      )}
    </section>
  );
}
