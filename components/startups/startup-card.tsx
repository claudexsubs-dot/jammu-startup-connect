import Link from "next/link";
import { labelFor, STAGES } from "@/lib/options";
import type { Enums } from "@/lib/database.types";

type CardStartup = {
  id: string;
  name: string;
  description: string | null;
  stage: Enums<"startup_stage">;
  district: string | null;
  is_published?: boolean;
  sectors: { name: string } | null;
};

export function StartupCard({ startup, showStatus = false }: { startup: CardStartup; showStatus?: boolean }) {
  return (
    <li className="card">
      <div className="card-head">
        <h3>
          <Link href={`/startups/${startup.id}`}>{startup.name}</Link>
        </h3>
        {showStatus ? (
          <span className={`badge ${startup.is_published ? "badge-live" : "badge-draft"}`}>{startup.is_published ? "Published" : "Draft"}</span>
        ) : null}
      </div>
      <p className="tags">
        <span className="badge">{labelFor(STAGES, startup.stage)}</span>
        {startup.sectors ? <span className="badge badge-quiet">{startup.sectors.name}</span> : null}
        {startup.district ? <span className="badge badge-quiet">{startup.district}</span> : null}
      </p>
      {startup.description ? <p className="card-body">{truncate(startup.description, 180)}</p> : null}
    </li>
  );
}

function truncate(text: string, length: number) {
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}
