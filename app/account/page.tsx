import type { Metadata } from "next";
import Link from "next/link";
import { AccountForm } from "@/components/account-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const { supabase, user, roles } = await requireUser("/account");
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const isFounder = roles.includes("founder");

  return (
    <section className="narrow">
      <h1>Your account</h1>
      <p className="muted">Signed in as {user.email}</p>
      <AccountForm fullName={profile?.full_name ?? null} />
      {isFounder ? (
        <p>
          Your phone number, location, domicile declaration and contact-sharing choice are part of your{" "}
          <Link href="/venture/edit/founder">founder details</Link>.
        </p>
      ) : null}
      <p>
        <Link href="/forgot-password">Change your password</Link>
      </p>
    </section>
  );
}
