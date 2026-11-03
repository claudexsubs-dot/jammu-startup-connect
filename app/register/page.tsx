import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <section className="auth-card">
      <h1>Create your account</h1>
      <p className="muted">Register your startup and connect with Jammu&apos;s startup ecosystem.</p>
      <RegisterForm />
    </section>
  );
}
