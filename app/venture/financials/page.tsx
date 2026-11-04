import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteFinancials, saveFinancials } from "@/app/actions/venture";
import { ConfirmButton } from "@/components/confirm-button";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Notice } from "@/components/notice";
import { Stepper } from "@/components/venture/stepper";
import { requireUser } from "@/lib/auth";
import { formatDate, formatInr } from "@/lib/format";
import { loadVenture } from "@/lib/venture";

export const metadata: Metadata = { title: "Financials" };

export default async function FinancialsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const { supabase, user } = await requireUser("/venture/financials");
  const { startup, stepDone } = await loadVenture(supabase, user.id);
  if (!startup) redirect("/venture/edit/basics");

  const { data: reports } = await supabase.from("startup_financials").select("*").eq("startup_id", startup.id).order("as_of_date", { ascending: false });
  const today = new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);

  return (
    <>
      <p className="breadcrumbs">
        <Link href="/venture">Venture profile</Link>
      </p>
      <h1>Financials</h1>
      <Stepper current="financials" done={stepDone} hasStartup />
      <div className="narrow">
        <Notice code={notice} />
        <p className="alert alert-info">
          These figures are private. Centres and administrators can&apos;t see them. When you apply to a centre you can
          choose to include your latest figures in that one application.
        </p>
        {reports && reports.length ? (
          <div className="table-wrap">
            <table>
              <caption className="visually-hidden">Saved financial figures</caption>
              <thead>
                <tr>
                  <th scope="col">As of</th>
                  <th scope="col">Annual revenue</th>
                  <th scope="col">Monthly expenses</th>
                  <th scope="col">Cash</th>
                  <th scope="col">Funding received</th>
                  <th scope="col">Monthly burn</th>
                  <th scope="col">Runway</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">{formatDate(r.as_of_date)}</th>
                    <td>{formatInr(r.annual_revenue)}</td>
                    <td>{formatInr(r.monthly_operating_expenses)}</td>
                    <td>{formatInr(r.cash_balance)}</td>
                    <td>{formatInr(r.total_funding_received)}</td>
                    <td>{formatInr(r.monthly_burn_rate)}</td>
                    <td>{r.cash_runway_months === null ? "—" : `${r.cash_runway_months} months`}</td>
                    <td>
                      <form action={deleteFinancials.bind(null, r.id)}>
                        <ConfirmButton message="Delete these figures?" className="link-button danger-link">
                          Delete
                        </ConfirmButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <h2>Add figures</h2>
        <ActionForm action={saveFinancials}>
          <Field name="as_of_date" label="As of date" type="date" required max={today} defaultValue={today} hint="Saving the same date again replaces those figures." />
          <div className="grid-2">
            <Field name="annual_revenue" label="Annual revenue (₹)" inputMode="decimal" hint="Revenue over the last 12 months." />
            <Field name="monthly_operating_expenses" label="Monthly operating expenses (₹)" inputMode="decimal" />
            <Field name="cash_balance" label="Cash in the bank (₹)" inputMode="decimal" />
            <Field name="total_funding_received" label="Total funding received (₹)" inputMode="decimal" hint="Grants, loans and investment to date." />
            <Field name="monthly_burn_rate" label="Monthly burn rate (₹)" inputMode="decimal" hint="How much more you spend than you earn each month." />
          </div>
          <SubmitButton>Save figures</SubmitButton>
        </ActionForm>
      </div>
    </>
  );
}
