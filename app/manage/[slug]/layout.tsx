import Link from "next/link";
import { SubNav } from "@/components/sub-nav";
import { CentreStatusBadge } from "@/components/status";
import { requireCentreStaff } from "@/lib/auth";

// Every page under /manage/<centre> is for that centre's staff only.
export default async function ManageCentreLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { centre } = await requireCentreStaff(slug, `/manage/${slug}`);
  const base = `/manage/${slug}`;
  return (
    <>
      <div className="dashboard-head">
        <p className="eyebrow">Centre dashboard</p>
        <h1 className="dashboard-title">
          {centre.name} <CentreStatusBadge status={centre.status} />
        </h1>
        <p className="muted small">
          <Link href={`/centres/${slug}`}>View public page</Link>
        </p>
      </div>
      {centre.status !== "active" ? (
        <p className="alert alert-error">
          This centre is suspended by the platform administrator. Its history is kept and you can still read it, but it can&apos;t take
          new applications, start conversations or receive session requests.
        </p>
      ) : null}
      <SubNav
        label="Centre sections"
        items={[
          { href: base, label: "Overview" },
          { href: `${base}/applications`, label: "Applications" },
          { href: `${base}/startups`, label: "Find startups" },
          { href: `${base}/messages`, label: "Messages" },
          { href: `${base}/experts`, label: "Mentors and experts" },
          { href: `${base}/bookings`, label: "Bookings" },
          { href: `${base}/profile`, label: "Centre profile" },
        ]}
      />
      <div className="dashboard-body">{children}</div>
    </>
  );
}
