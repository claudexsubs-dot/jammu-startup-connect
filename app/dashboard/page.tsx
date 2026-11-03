import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/notice";
import { StartupCard } from "@/components/startups/startup-card";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "My startups" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const { supabase, user } = await requireUser("/dashboard");

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("startup_members")
      .select("access, startups(id, name, description, stage, district, is_published, sectors(name))")
      .eq("user_id", user.id)
      .not("access", "is", null),
  ]);

  const startups = (memberships ?? []).flatMap((m) => (m.startups ? [m.startups] : []));

  return (
    <>
      <Notice code={notice} />
      <div className="section-head">
        <h1>{profile?.full_name ? `Welcome, ${profile.full_name.split(" ")[0]}` : "My startups"}</h1>
        <Link href="/startups/new" className="btn btn-primary">
          Add a startup
        </Link>
      </div>
      {startups.length > 0 ? (
        <ul className="card-grid">
          {startups.map((startup) => (
            <StartupCard key={startup.id} startup={startup} showStatus />
          ))}
        </ul>
      ) : (
        <div className="empty">
          <p>You haven&apos;t added a startup yet.</p>
          <Link href="/startups/new" className="btn btn-primary">
            Create your startup profile
          </Link>
        </div>
      )}
    </>
  );
}
