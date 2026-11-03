import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { addMember, removeMember } from "@/app/actions/startups";
import { ConfirmButton } from "@/components/confirm-button";
import { ManageNav } from "@/components/startups/manage-nav";
import { MemberForm } from "@/components/startups/member-form";
import { isUuid } from "@/lib/ids";
import { loadEditableStartup } from "../load";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase, startup, isOwner } = await loadEditableStartup(id, `/startups/${id}/team`);
  const { data: members } = await supabase
    .from("startup_members")
    .select("id, full_name, email, role_title, is_founder, linkedin_url, access")
    .eq("startup_id", id)
    .order("is_founder", { ascending: false })
    .order("created_at");

  return (
    <section className="narrow">
      <ManageNav startupId={id} current="team" />
      <h1>{startup.name}: founders and team</h1>
      <p className="muted">The team list is visible only to people who manage this startup.</p>

      <ul className="member-list">
        {(members ?? []).map((member) => (
          <li key={member.id}>
            <div>
              <strong>{member.full_name}</strong>
              {member.is_founder ? <span className="badge">Founder</span> : null}
              {member.access === "owner" ? <span className="badge badge-quiet">Account owner</span> : null}
              <div className="muted">
                {[member.role_title, member.email].filter(Boolean).join(" · ")}
                {member.linkedin_url ? (
                  <>
                    {" · "}
                    <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer nofollow">
                      LinkedIn
                    </a>
                  </>
                ) : null}
              </div>
            </div>
            {isOwner && member.access === null ? (
              <form action={removeMember.bind(null, id, member.id)}>
                <ConfirmButton message={`Remove ${member.full_name} from the team?`} className="btn btn-secondary btn-small">
                  Remove
                </ConfirmButton>
              </form>
            ) : null}
          </li>
        ))}
      </ul>

      {isOwner ? (
        <>
          <h2>Add a team member</h2>
          <p className="muted">They don&apos;t need an account. Inviting them to log in and help manage the profile comes in a later update.</p>
          <MemberForm action={addMember.bind(null, id)} />
        </>
      ) : null}
    </section>
  );
}
