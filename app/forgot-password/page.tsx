import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <section className="auth-card">
      <h1>Reset your password</h1>
      <p className="muted">Enter the email you registered with and we&apos;ll send you a link to choose a new password.</p>
      <ForgotPasswordForm />
    </section>
  );
}
