import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { loadActiveCentres } from "@/lib/directory";

export default async function HomePage() {
  const { supabase, user } = await getViewer();
  let centreCount = 0;
  try {
    centreCount = (await loadActiveCentres(supabase)).length;
  } catch {
    centreCount = 0;
  }

  return (
    <>
      <section className="hero">
        <p className="eyebrow">For startup founders domiciled in Jammu</p>
        <h1>Find the right incubation centre for your startup</h1>
        <p className="lead">
          Build one venture profile, see which centres fit your stage and sector, apply to as many as you like, and
          book time with mentors and college experts.
        </p>
        <div className="actions">
          {user ? (
            <Link href="/dashboard" className="btn btn-primary">
              Go to your dashboard
            </Link>
          ) : (
            <Link href="/register" className="btn btn-primary">
              Register as a founder
            </Link>
          )}
          <Link href="/centres" className="btn btn-secondary">
            Browse {centreCount ? `${centreCount} ` : ""}centres
          </Link>
        </div>
      </section>

      <section aria-labelledby="how" className="steps-section">
        <h2 id="how">How it works</h2>
        <ol className="steps">
          <li>
            <h3>Build your venture profile</h3>
            <p>Save it as a draft and come back any time. We tell you exactly what&apos;s missing before you apply.</p>
          </li>
          <li>
            <h3>See your best-fit centres</h3>
            <p>Recommendations explain why each centre fits. You can still browse, compare and apply to any centre.</p>
          </li>
          <li>
            <h3>Apply and track</h3>
            <p>Each application has its own status and history. Centres can ask for more information instead of saying no.</p>
          </li>
          <li>
            <h3>Talk to mentors and experts</h3>
            <p>Request a session online or in person. Paid experts confirm once you&apos;ve paid them directly.</p>
          </li>
        </ol>
      </section>

      <section className="callout" aria-labelledby="independent">
        <h2 id="independent">An independent platform</h2>
        <p>
          UdyamSetu is not a government portal. It doesn&apos;t decide admissions or funding, and it never takes payments.
          Your email and phone stay private unless you choose to share them. <Link href="/about">Read more</Link>
        </p>
      </section>
    </>
  );
}
