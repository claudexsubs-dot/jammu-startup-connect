import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/forms";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <section className="auth-card">
      <h1>Welcome back</h1>
      <p className="muted">Log in to book sessions, track applications and read messages.</p>
      <LoginForm next={safeNext(next)} />
    </section>
  );
}
