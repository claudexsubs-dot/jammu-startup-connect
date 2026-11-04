import type { Metadata } from "next";
import Link from "next/link";
import { SampleBadge } from "@/components/status";
import { getViewer } from "@/lib/auth";
import { loadActiveCentres } from "@/lib/directory";
import { formatDate } from "@/lib/format";
import { loadTaxonomy, nameById } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Compare centres" };

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ c?: string | string[] }> }) {
  const { c } = await searchParams;
  const slugs = (Array.isArray(c) ? c : c ? [c] : []).slice(0, 4);
  const { supabase } = await getViewer();
  const [taxonomy, centres] = await Promise.all([loadTaxonomy(supabase), loadActiveCentres(supabase).catch(() => [])]);
  const chosen = slugs.map((slug) => centres.find((centre) => centre.slug === slug)).filter((x) => x !== undefined);

  const stages = nameById(taxonomy.stages);
  const sectors = nameById(taxonomy.sectors);
  const needs = nameById(taxonomy.needs);
  const list = (ids: number[], names: Map<number, string>, empty: string) => (ids.length ? ids.map((id) => names.get(id)).filter(Boolean).join(", ") : empty);

  if (chosen.length < 2) {
    return (
      <section className="narrow">
        <h1>Compare centres</h1>
        <p className="empty">
          Tick at least two centres in the <Link href="/centres">directory</Link>, then choose &ldquo;Compare selected centres&rdquo;.
        </p>
      </section>
    );
  }

  const rows: { label: string; value: (centre: (typeof chosen)[number]) => React.ReactNode }[] = [
    { label: "Location", value: (x) => [x.city, x.district].filter(Boolean).join(", ") || "—" },
    { label: "Host institution", value: (x) => x.hostInstitution ?? "—" },
    { label: "Stages supported", value: (x) => list(x.stageIds, stages, "Not listed") },
    { label: "Sectors", value: (x) => list(x.sectorIds, sectors, "All sectors") },
    { label: "Support offered", value: (x) => list(x.serviceIds, needs, "Not listed") },
    {
      label: "Applications",
      value: (x) => (x.openForApplications ? `Open${x.applicationsCloseOn ? ` until ${formatDate(x.applicationsCloseOn)}` : ""}` : "Closed"),
    },
    { label: "Mentors and experts", value: (x) => (x.expertCount ? `${x.expertCount} (${x.paidExpertCount} paid)` : "None listed yet") },
  ];

  return (
    <section>
      <p className="breadcrumbs">
        <Link href="/centres">All centres</Link>
      </p>
      <h1>Compare centres</h1>
      <div className="table-wrap">
        <table className="compare-table">
          <caption className="visually-hidden">Side-by-side comparison of the selected centres</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Detail</span>
              </th>
              {chosen.map((x) => (
                <th scope="col" key={x.id}>
                  <Link href={`/centres/${x.slug}`}>{x.name}</Link> <SampleBadge show={x.isSample} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {chosen.map((x) => (
                  <td key={x.id}>{row.value(x)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">
                <span className="visually-hidden">Apply</span>
              </th>
              {chosen.map((x) => (
                <td key={x.id}>
                  {x.openForApplications ? (
                    <Link href={`/centres/${x.slug}/apply`} className="btn btn-primary btn-small">
                      Apply
                    </Link>
                  ) : (
                    <Link href={`/centres/${x.slug}`}>View centre</Link>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
