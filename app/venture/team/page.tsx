import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { addMember, removeMember } from "@/app/actions/venture";
import { ConfirmButton } from "@/components/confirm-button";
import { ExternalLink } from "@/components/external-link";
import { ActionForm, Checkbox, Field, SubmitButton } from "@/components/form";
import { Notice } from "@/components/notice";
import { Stepper } from "@/components/venture/stepper";
import { requireUser } from "@/lib/auth";
import { loadVenture } from "@/lib/venture";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const { supabase, user } = await requireUser("/venture/team");
  const { startup, stepDone } = await loadVenture(supabase, user.id);
  if (!startup) redirect("/venture/edit/basics");

  const { data: contacts } = await supabase.from("startup_member_contacts").select("member_id, email");
  const emailFor = new Map((contacts ?? []).map((c) => [c.member_id, c.email]));
  const members = [...startup.startup_members].sort((a, b) => Number(b.is_founder) - Number(a.is_founder) || a.created_at.localeCompare(b.created_at));

  return (
    <>
      <p className="breadcrumbs">
        <Link href="/venture">Venture profile</Link>
      </p>
      <h1>Team</h1>
      <Stepper current="team" done={stepDone} hasStartup />
      <div className="narrow">
        <Notice code={notice} />
        <p className="muted">Centres see names, roles and LinkedIn links. Email addresses you add here are visible only to you.</p>
        <ul className="member-list">
          {members.map((m) => (
            <li key={m.id}>
              <div>
                <strong>{m.full_name}</strong> {m.is_founder ? <span className="badge">Founder</span> : null}
                <div className="muted small">
                  {[m.role_title, emailFor.get(m.id)].filter(Boolean).join(" · ")}
                  {m.linkedin_url ? (
                    <>
                      {" · "}
                      <ExternalLink href={m.linkedin_url}>LinkedIn</ExternalLink>
                    </>
                  ) : null}
                </div>
              </div>
              <form action={removeMember.bind(null, m.id)}>
                <ConfirmButton message={`Remove ${m.full_name} from the team?`} className="btn btn-secondary btn-small">
                  Remove
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
        <h2>Add a team member</h2>
        <ActionForm action={addMember}>
          <div className="grid-2">
            <Field name="full_name" label="Name" required />
            <Field name="role_title" label="Role" placeholder="For example: CTO" />
          </div>
          <div className="grid-2">
            <Field name="email" label="Email" type="email" hint="Only you can see this." />
            <Field name="linkedin_url" label="LinkedIn profile" type="url" placeholder="https://" />
          </div>
          <Checkbox name="is_founder" label="This person is a co-founder" />
          <SubmitButton pendingText="Adding…">Add to team</SubmitButton>
        </ActionForm>
      </div>
    </>
  );
}
