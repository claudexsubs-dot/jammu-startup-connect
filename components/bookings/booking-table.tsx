import Link from "next/link";
import { BookingStatusBadge } from "@/components/status";
import { formatTimeRange } from "@/lib/format";
import { SESSION_FORMATS, labelFor } from "@/lib/options";
import type { BookingStatus, SessionFormat } from "@/lib/types";

export type BookingListItem = {
  id: string;
  status: BookingStatus;
  format: SessionFormat;
  starts_at: string;
  ends_at: string;
  is_paid: boolean;
  proposed_slot_id: string | null;
  center_experts: { id: string; full_name: string } | null;
  incubation_centers: { name: string; slug: string } | null;
  startups: { name: string } | null;
};

// A list of session requests. Founders see the expert; experts and centres see the startup.
export function BookingTable({ bookings, basePath, show, caption }: { bookings: BookingListItem[]; basePath: string; show: "expert" | "startup"; caption: string }) {
  return (
    <div className="table-wrap">
      <table className="list-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{show === "expert" ? "Mentor or expert" : "Startup"}</th>
            {show === "startup" ? <th scope="col">Expert</th> : <th scope="col">Centre</th>}
            <th scope="col">Time (India time)</th>
            <th scope="col">Format</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <th scope="row">
                <Link href={`${basePath}/${b.id}`}>{show === "expert" ? (b.center_experts?.full_name ?? "Expert") : (b.startups?.name ?? "Startup")}</Link>
                {b.proposed_slot_id ? <span className="badge badge-info">New time suggested</span> : null}
              </th>
              <td>{show === "startup" ? b.center_experts?.full_name : b.incubation_centers?.name}</td>
              <td>{formatTimeRange(b.starts_at, b.ends_at)}</td>
              <td>{labelFor(SESSION_FORMATS, b.format)}</td>
              <td>
                <BookingStatusBadge status={b.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Splits bookings into ones that still need attention or are coming up, and past ones.
export function splitBookings<T extends { status: BookingStatus; starts_at: string }>(bookings: T[]) {
  const now = Date.now();
  const current = bookings.filter(
    (b) => b.status === "pending" || b.status === "payment_instructions_sent" || (b.status === "confirmed" && new Date(b.starts_at).getTime() > now - 3_600_000 * 24),
  );
  const past = bookings.filter((b) => !current.includes(b));
  return { current, past };
}
