import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Register as a founder" };

export default function RegisterPage() {
  return (
    <section className="auth-card auth-card-wide">
      <h1>Register as a founder</h1>
      <p className="muted">
        For startup founders domiciled in Jammu. After registering you&apos;ll build your venture profile step by step,
        then browse and apply to incubation centres.
      </p>
      <RegisterForm />
    </section>
  );
}
