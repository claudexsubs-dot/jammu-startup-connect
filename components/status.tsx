import { APPLICATION_STATUSES, BOOKING_STATUSES, CENTER_STATUSES, labelFor } from "@/lib/options";
import type { ApplicationStatus, BookingStatus, CenterStatus } from "@/lib/types";

const APPLICATION_TONE: Record<ApplicationStatus, string> = {
  draft: "badge-quiet",
  submitted: "badge-info",
  under_review: "badge-info",
  more_information_needed: "badge-warn",
  accepted: "badge-live",
  rejected: "badge-quiet",
  waitlisted: "badge-warn",
};

const BOOKING_TONE: Record<BookingStatus, string> = {
  pending: "badge-warn",
  payment_instructions_sent: "badge-info",
  confirmed: "badge-live",
  declined: "badge-quiet",
  cancelled: "badge-quiet",
  completed: "badge-live",
  no_show: "badge-quiet",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`badge ${APPLICATION_TONE[status]}`}>{labelFor(APPLICATION_STATUSES, status)}</span>;
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`badge ${BOOKING_TONE[status]}`}>{labelFor(BOOKING_STATUSES, status)}</span>;
}

export function CentreStatusBadge({ status }: { status: CenterStatus }) {
  if (status === "active") return null;
  return <span className="badge badge-danger">{labelFor(CENTER_STATUSES, status)}</span>;
}

export function SampleBadge({ show }: { show: boolean }) {
  return show ? (
    <span className="badge badge-sample" title="A fictional listing used to demonstrate UdyamSetu">
      Sample listing
    </span>
  ) : null;
}
