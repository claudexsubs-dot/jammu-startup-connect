import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ThreadView } from "@/components/messages/thread";
import { Notice } from "@/components/notice";
import { requireCentreStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Conversation" };

export default async function CentreThreadPage({ params, searchParams }: { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { slug, id } = await params;
  const { notice, error } = await searchParams;
  const path = `/manage/${slug}/messages/${id}`;
  const { supabase, centre } = await requireCentreStaff(slug, path);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: thread } = await supabase
    .from("message_threads")
    .select("id, subject, center_archived_at, application_id, startup_id, startups(name)")
    .eq("id", id)
    .eq("center_id", centre.id)
    .maybeSingle();
  if (!thread) notFound();

  const [{ data: messages }] = await Promise.all([
    supabase.from("messages").select("id, sender_side, body, created_at, hidden_at").eq("thread_id", id).order("created_at"),
    supabase.rpc("mark_thread_read", { p_thread_id: id }),
  ]);
  const startupName = thread.startups?.name ?? "Startup";

  return (
    <section className="narrow">
      <p className="breadcrumbs">
        <Link href={`/manage/${slug}/messages`}>Messages</Link>
        {" · "}
        <Link href={`/manage/${slug}/startups/${thread.startup_id}`}>{startupName}</Link>
        {thread.application_id ? (
          <>
            {" · "}
            <Link href={`/manage/${slug}/applications/${thread.application_id}`}>Application</Link>
          </>
        ) : null}
      </p>
      <Notice code={notice} error={error} />
      <h2>{thread.subject}</h2>
      <ThreadView
        threadId={id}
        side="center"
        messages={messages ?? []}
        centreName={centre.name}
        startupName={startupName}
        archived={Boolean(thread.center_archived_at)}
        canReply={centre.status === "active"}
        returnPath={path}
      />
    </section>
  );
}
