import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CentreStatusBadge } from "@/components/status";
import { denyAccess, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "My centres" };

export default async function ManageIndexPage() {
  const { staffCentres } = await requireUser("/manage");
  if (!staffCentres.length) return denyAccess("/manage");
  if (staffCentres.length === 1) redirect(`/manage/${staffCentres[0].slug}`);
  return (
    <section className="narrow">
      <h1>Your centres</h1>
      <ul className="card-grid">
        {staffCentres.map((c) => (
          <li key={c.id} className="card">
            <h2 className="h3">
              <Link href={`/manage/${c.slug}`}>{c.name}</Link>
            </h2>
            <CentreStatusBadge status={c.status} />
          </li>
        ))}
      </ul>
    </section>
  );
}
