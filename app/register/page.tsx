import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/forms";
import { Icons } from "@/components/icons";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Create your free founder account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = next ? safeNext(next, "") : "";
  const booking = target.startsWith("/experts/");
  return (
    <div className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">
          <Icons.rocket /> Free for founders
        </p>
        <h1>{booking ? "Create an account to book" : "Create your founder account"}</h1>
        <p className="muted">
          {booking ? "Takes under a minute. We'll take you straight back to the time you picked." : "Takes under a minute. You can fill in your venture profile later, at your own pace."}
        </p>
        <RegisterForm next={target || undefined} />
      </section>
      <aside className="auth-aside" aria-label="What you get">
        <h2 style={{ marginTop: 0 }}>With one account you can</h2>
        <ul>
          <li>
            <Icons.check /> Book free mentors and paid college experts in a couple of taps
          </li>
          <li>
            <Icons.check /> See which incubation centres fit your stage and sector, with reasons
          </li>
          <li>
            <Icons.check /> Apply to any number of centres with one venture profile, and track every application
          </li>
          <li>
            <Icons.check /> Message centres you&apos;ve applied to, all in one inbox
          </li>
          <li>
            <Icons.shield /> Keep your contact details and financials private unless you choose to share them
          </li>
        </ul>
      </aside>
    </div>
  );
}
