import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/forms";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <section className="auth-card">
      <h1>Log in</h1>
      <LoginForm next={safeNext(next)} />
    </section>
  );
}
