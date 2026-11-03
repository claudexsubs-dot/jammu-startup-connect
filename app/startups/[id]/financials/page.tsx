import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteFinancials, saveFinancials } from "@/app/actions/startups";
import { ConfirmButton } from "@/components/confirm-button";
import { FinancialsForm } from "@/components/startups/financials-form";
import { ManageNav } from "@/components/startups/manage-nav";
import { formatDate, formatInr } from "@/lib/format";
import { isUuid } from "@/lib/ids";
import { loadEditableStartup } from "../load";

export const metadata: Metadata = { title: "Financials" };

export default async function FinancialsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase, startup } = await loadEditableStartup(id, `/startups/${id}/financials`);
  const { data: reports } = await supabase
    .from("startup_financials")
    .select("*")
    .eq("startup_id", id)
    .order("as_of_date", { ascending: false });

  return (
    <section className="narrow">
      <ManageNav startupId={id} current="financials" />
      <h1>{startup.name}: financials</h1>
      <p className="alert alert-info">
        These figures are optional and private. Only you and your startup&apos;s editors can see them, even when your
        profile is published.
      </p>

      {reports && reports.length > 0 ? (
        <div className="table-wrap">
          <table>
            <caption className="visually-hidden">Saved financial reports, newest first</caption>
            <thead>
              <tr>
                <th scope="col">As of</th>
                <th scope="col">Annual revenue</th>
                <th scope="col">Monthly expenses</th>
                <th scope="col">Cash balance</th>
                <th scope="col">Funding received</th>
                <th scope="col">Monthly burn</th>
                <th scope="col">Runway</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <th scope="row">{formatDate(report.as_of_date)}</th>
                  <td>{formatInr(report.annual_revenue)}</td>
                  <td>{formatInr(report.monthly_operating_expenses)}</td>
                  <td>{formatInr(report.cash_balance)}</td>
                  <td>{formatInr(report.total_funding_received)}</td>
                  <td>{formatInr(report.monthly_burn_rate)}</td>
                  <td>{report.cash_runway_months === null ? "—" : `${report.cash_runway_months} months`}</td>
                  <td>
                    <form action={deleteFinancials.bind(null, id, report.id)}>
                      <ConfirmButton message="Delete this report?" className="btn btn-secondary btn-small">
                        Delete
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">No figures saved yet.</p>
      )}

      <h2>Add figures</h2>
      <FinancialsForm action={saveFinancials.bind(null, id)} />
    </section>
  );
}
