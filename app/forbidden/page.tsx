import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "No access" };

export default function ForbiddenPage() {
  return (
    <section className="narrow">
      <h1>You don&apos;t have access to that page</h1>
      <p>
        That page belongs to a different role, such as another centre&apos;s staff or the platform administrator. The
        attempt has been recorded.
      </p>
      <p>
        <Link href="/dashboard" className="btn btn-primary">
          Go to your dashboard
        </Link>
      </p>
    </section>
  );
}
