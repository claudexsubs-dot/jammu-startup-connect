import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/forms";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <section className="auth-card">
      <h1>Choose a new password</h1>
      {user ? (
        <ResetPasswordForm />
      ) : (
        <p className="alert alert-error" role="alert">
          This page only works from the link in your reset email, and the link may have expired.{" "}
          <Link href="/forgot-password">Ask for a new link</Link>.
        </p>
      )}
    </section>
  );
}
