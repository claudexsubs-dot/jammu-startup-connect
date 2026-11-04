import type { Metadata } from "next";
import Link from "next/link";
import { requireCentreStaff } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Centre messages" };

export default async function CentreMessagesPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ view?: string }> }) {
  const { slug } = await params;
  const { view } = await searchParams;
  const archivedView = view === "archived";
  const base = `/manage/${slug}/messages`;
  const { supabase, centre } = await requireCentreStaff(slug, base);

  let query = supabase
    .from("message_threads")
    .select("id, subject, last_message_at, center_last_read_at, startups(name)")
    .eq("center_id", centre.id)
    .order("last_message_at", { ascending: false })
    .limit(200);
  query = archivedView ? query.not("center_archived_at", "is", null) : query.is("center_archived_at", null);
  const { data: threads } = await query;

  return (
    <>
      <h2>Messages</h2>
      <nav className="tabs" aria-label="Message folders">
        <Link href={base} aria-current={!archivedView ? "page" : undefined}>
          Inbox
        </Link>
        <Link href={`${base}?view=archived`} aria-current={archivedView ? "page" : undefined}>
          Archived
        </Link>
      </nav>
      <p className="muted">
        Conversations are shared by everyone on {centre.name}&apos;s staff. To write to a new startup, open it from{" "}
        <Link href={`/manage/${slug}/startups`}>Find startups</Link> or from an application.
      </p>
      {threads && threads.length ? (
        <ul className="thread-list">
          {threads.map((t) => {
            const unread = !t.center_last_read_at || t.center_last_read_at < t.last_message_at;
            return (
              <li key={t.id} className={unread ? "unread" : undefined}>
                <Link href={`${base}/${t.id}`}>
                  <strong>{t.startups?.name ?? "Startup"}</strong> · {t.subject}
                </Link>
                <span className="muted small">
                  {unread ? "New · " : ""}
                  {formatDateTime(t.last_message_at)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="empty">{archivedView ? "No archived conversations." : "No conversations yet."}</p>
      )}
    </>
  );
}
