import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { acceptInvitation } from "@/app/actions/account";
import { InviteeRegisterForm } from "@/components/auth/forms";
import { SubmitButton } from "@/components/form";
import { Notice } from "@/components/notice";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Invitation" };

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const { error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const { supabase, user, profile } = await getViewer();
  const next = `/invite/${token}`;

  if (!user) {
    return (
      <section className="auth-card auth-card-wide">
        <h1>You&apos;ve been invited to UdyamSetu</h1>
        <p>
          A centre or the platform administrator invited you to join as centre staff or as a mentor or expert. Use the same
          email address the invitation was sent to.
        </p>
        <p>
          Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`}>Log in to accept</Link>
        </p>
        <h2 className="h3">New here? Create your account</h2>
        <InviteeRegisterForm token={token} />
      </section>
    );
  }

  const { data } = await supabase.rpc("invitation_details", { p_token: token });
  const invite = data?.[0];
  if (!invite) notFound();
  const role = invite.kind === "center_staff" ? `staff at ${invite.center_name}` : `${invite.expert_name ?? "a mentor or expert"} at ${invite.center_name}`;

  return (
    <section className="auth-card auth-card-wide">
      <Notice error={error} />
      <h1>Invitation to {invite.center_name}</h1>
      {!invite.is_valid ? (
        <p className="alert alert-error">This invitation has expired or was withdrawn. Ask the person who invited you for a new link.</p>
      ) : profile?.is_suspended ? (
        <p className="alert alert-error">Your account is suspended, so you can&apos;t accept invitations.</p>
      ) : !invite.email_matches ? (
        <p className="alert alert-error">
          This invitation was sent to a different email address. You&apos;re signed in as {user.email}. Log out and sign in with the invited
          address.
        </p>
      ) : (
        <form action={acceptInvitation.bind(null, token)} className="stack">
          <p>
            You&apos;ve been invited to join UdyamSetu as <strong>{role}</strong>.
            {invite.kind === "center_staff"
              ? " You'll be able to manage the centre's profile, review applications, message startups and manage its mentors."
              : " You'll be able to manage your availability and respond to session requests."}
          </p>
          <div className="actions">
            <SubmitButton pendingText="Accepting…">Accept invitation</SubmitButton>
          </div>
        </form>
      )}
    </section>
  );
}
