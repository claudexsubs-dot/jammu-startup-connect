import type { Metadata } from "next";
import Link from "next/link";
import { deleteStartup } from "@/app/actions/venture";
import { ConfirmButton } from "@/components/confirm-button";
import { Notice } from "@/components/notice";
import { Stepper } from "@/components/venture/stepper";
import { requireUser } from "@/lib/auth";
import { LEGAL_STATUSES, OFFERING_TYPES, TRACTION_LEVELS, labelFor } from "@/lib/options";
import { loadTaxonomy, nameById } from "@/lib/taxonomy";
import { loadVenture } from "@/lib/venture";
import { STEP_TITLES, STEPS } from "@/lib/venture-steps";

export const metadata: Metadata = { title: "Venture profile" };

export default async function VenturePage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { notice, error } = await searchParams;
  const { supabase, user } = await requireUser("/venture");
  const [{ profile, founder, startup, gaps, stepDone }, taxonomy] = await Promise.all([loadVenture(supabase, user.id), loadTaxonomy(supabase, { includeInactive: true })]);
  const sectorNames = nameById(taxonomy.sectors);
  const needNames = nameById(taxonomy.needs);
  const nextStep = STEPS.find((step) => !stepDone[step] && step !== "traction") ?? null;

  return (
    <>
      <Notice code={notice} error={error} />
      <div className="section-head">
        <h1>{startup ? startup.name : "Your venture profile"}</h1>
        {startup ? <span className={`badge ${gaps?.length ? "badge-draft" : "badge-live"}`}>{gaps?.length ? "Draft" : "Ready to apply"}</span> : null}
      </div>

      <Stepper done={stepDone} hasStartup={Boolean(startup)} />

      {!startup ? (
        <div className="empty">
          <p>
            Your venture profile is what centres see when you apply. Fill it in step by step; everything is saved as a draft
            until you&apos;re ready.
          </p>
          <Link href={stepDone.founder ? "/venture/edit/basics" : "/venture/edit/founder"} className="btn btn-primary">
            Start your profile
          </Link>
        </div>
      ) : gaps && gaps.length ? (
        <div className="alert alert-info">
          <p>
            <strong>Your profile is saved as a draft.</strong> Before you can formally apply to a centre, add:
          </p>
          <ul>
            {gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
          {nextStep ? (
            <Link href={`/venture/edit/${nextStep}`} className="btn btn-primary btn-small">
              Continue with &ldquo;{STEP_TITLES[nextStep]}&rdquo;
            </Link>
          ) : (
            <Link href="/venture/team" className="btn btn-primary btn-small">
              Add your team
            </Link>
          )}
        </div>
      ) : (
        <div className="alert alert-success">
          <p>Your profile has everything centres need. </p>
          <Link href="/centres" className="btn btn-primary btn-small">
            Find centres to apply to
          </Link>
        </div>
      )}

      <section aria-labelledby="summary">
        <h2 id="summary">Profile summary</h2>
        <dl className="details">
          <div>
            <dt>Founder</dt>
            <dd>{profile?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt>District</dt>
            <dd>{founder?.district ?? "—"}</dd>
          </div>
          <div>
            <dt>Jammu domicile</dt>
            <dd>{founder?.domicile_declared ? "Self-declared" : "Not declared yet"}</dd>
          </div>
          <div>
            <dt>Contact details</dt>
            <dd>{founder?.share_contact_with_centres ? "Shared with centres" : "Private"}</dd>
          </div>
          {startup ? (
            <>
              <div>
                <dt>Stage</dt>
                <dd>{startup.startup_stages?.name ?? "—"}</dd>
              </div>
              <div>
                <dt>Sectors</dt>
                <dd>{startup.startup_sectors.map((s) => sectorNames.get(s.sector_id)).join(", ") || "—"}</dd>
              </div>
              <div>
                <dt>Offering</dt>
                <dd>{labelFor(OFFERING_TYPES, startup.offering_type) || "—"}</dd>
              </div>
              <div>
                <dt>Legal status</dt>
                <dd>{labelFor(LEGAL_STATUSES, startup.legal_status)}</dd>
              </div>
              <div>
                <dt>Traction</dt>
                <dd>{labelFor(TRACTION_LEVELS, startup.traction_level) || "—"}</dd>
              </div>
              <div>
                <dt>Team</dt>
                <dd>{startup.startup_members.length} people</dd>
              </div>
              <div>
                <dt>Support needed</dt>
                <dd>{startup.startup_support_needs.map((s) => needNames.get(s.support_need_id)).join(", ") || "—"}</dd>
              </div>
            </>
          ) : null}
        </dl>
        {startup?.description ? <p className="pre-line">{startup.description}</p> : null}
      </section>

      {startup ? (
        <section className="danger-zone" aria-labelledby="danger">
          <h2 id="danger">Delete venture profile</h2>
          <p>
            This removes your startup profile, team list and financial figures. If you have applied to centres or booked
            sessions, the profile can&apos;t be deleted because those records are kept.
          </p>
          <form action={deleteStartup}>
            <ConfirmButton message="Delete your venture profile? This can't be undone.">Delete venture profile</ConfirmButton>
          </form>
        </section>
      ) : null}
    </>
  );
}
