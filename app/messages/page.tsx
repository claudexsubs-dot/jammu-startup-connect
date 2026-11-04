import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const archivedView = view === "archived";
  const { supabase, user, staffCentres } = await requireUser("/messages");
  const { data: startup } = await supabase.from("startups").select("id, name").eq("owner_id", user.id).maybeSingle();

  let threads: { id: string; subject: string; last_message_at: string; founder_last_read_at: string | null; founder_archived_at: string | null; incubation_centers: { name: string } | null }[] = [];
  if (startup) {
    let query = supabase
      .from("message_threads")
      .select("id, subject, last_message_at, founder_last_read_at, founder_archived_at, incubation_centers(name)")
      .eq("startup_id", startup.id)
      .order("last_message_at", { ascending: false });
    query = archivedView ? query.not("founder_archived_at", "is", null) : query.is("founder_archived_at", null);
    threads = (await query).data ?? [];
  }

  return (
    <>
      <h1>Messages</h1>
      {staffCentres.length ? (
        <p className="alert alert-info">
          Centre conversations are in your centre dashboard:{" "}
          {staffCentres.map((c, i) => (
            <span key={c.id}>
              {i ? ", " : ""}
              <Link href={`/manage/${c.slug}/messages`}>{c.name}</Link>
            </span>
          ))}
          .
        </p>
      ) : null}
      {!startup ? (
        <p className="empty">Messages from centres appear here once you have a <Link href="/venture">venture profile</Link>.</p>
      ) : (
        <>
          <nav className="tabs" aria-label="Message folders">
            <Link href="/messages" aria-current={!archivedView ? "page" : undefined}>
              Inbox
            </Link>
            <Link href="/messages?view=archived" aria-current={archivedView ? "page" : undefined}>
              Archived
            </Link>
          </nav>
          <p className="muted">Centres can start a conversation with any registered startup. Your email and phone are never shown unless you share them.</p>
          {threads.length ? (
            <ul className="thread-list">
              {threads.map((t) => {
                const unread = !t.founder_last_read_at || t.founder_last_read_at < t.last_message_at;
                return (
                  <li key={t.id} className={unread ? "unread" : undefined}>
                    <Link href={`/messages/${t.id}`}>
                      <strong>{t.incubation_centers?.name ?? "Centre"}</strong> · {t.subject}
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
            <p className="empty">{archivedView ? "No archived conversations." : "No messages yet. When a centre writes to you, it will appear here."}</p>
          )}
        </>
      )}
    </>
  );
}
