import type { Metadata } from "next";
import { AccountForm } from "@/components/account-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const { supabase, user } = await requireUser("/account");
  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single();

  return (
    <section className="narrow">
      <h1>Your account</h1>
      <p className="muted">Signed in as {user.email}</p>
      <AccountForm fullName={profile?.full_name ?? null} phone={profile?.phone ?? null} />
    </section>
  );
}
