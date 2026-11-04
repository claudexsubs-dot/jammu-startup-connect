import { ApplicationStatusBadge } from "@/components/status";
import { formatDateTime } from "@/lib/format";
import type { ApplicationStatus } from "@/lib/types";

export type HistoryEntry = {
  id: number;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  note: string | null;
  changed_by_side: string;
  created_at: string;
};

export function StatusTimeline({ history, centreName }: { history: HistoryEntry[]; centreName: string }) {
  if (!history.length) return <p className="muted">No status changes yet.</p>;
  return (
    <ol className="timeline">
      {history.map((entry) => (
        <li key={entry.id}>
          <div className="timeline-head">
            <ApplicationStatusBadge status={entry.to_status} />
            <span className="muted small">
              {formatDateTime(entry.created_at)} · {entry.changed_by_side === "founder" ? "Founder" : entry.changed_by_side === "center" ? centreName : "UdyamSetu"}
            </span>
          </div>
          {entry.note ? <p className="pre-line timeline-note">{entry.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}
