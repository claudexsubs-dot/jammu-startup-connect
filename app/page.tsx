import Link from "next/link";
import { StartupCard } from "@/components/startups/startup-card";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: startups, error }, { count }] = await Promise.all([
    supabase
      .from("startups")
      .select("id, name, description, stage, district, sectors(name)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("startups").select("id", { count: "exact", head: true }).eq("is_published", true),
  ]);

  return (
    <>
      <section className="hero">
        <h1>Where Jammu&apos;s startups grow</h1>
        <p className="lead">
          Create your startup profile, track your progress, and get ready to connect with incubation centres and
          mentors across the Jammu division.
        </p>
        <div className="actions">
          <Link href="/register" className="btn btn-primary">
            Register your startup
          </Link>
          <Link href="/startups" className="btn btn-secondary">
            Browse startups
          </Link>
        </div>
      </section>

      <section aria-labelledby="recent">
        <div className="section-head">
          <h2 id="recent">Recently listed</h2>
          {count ? <Link href="/startups">See all {count}</Link> : null}
        </div>
        {error ? (
          <p className="alert alert-error">We couldn&apos;t load startups right now. Please refresh the page.</p>
        ) : startups && startups.length > 0 ? (
          <ul className="card-grid">
            {startups.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </ul>
        ) : (
          <p className="empty">No startups have published a profile yet. Be the first to register yours.</p>
        )}
      </section>
    </>
  );
}
