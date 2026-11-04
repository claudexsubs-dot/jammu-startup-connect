import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ThreadView } from "@/components/messages/thread";
import { Notice } from "@/components/notice";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Conversation" };

export default async function FounderThreadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { id } = await params;
  const { notice, error } = await searchParams;
  const { supabase, user } = await requireUser(`/messages/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: thread } = await supabase
    .from("message_threads")
    .select("id, subject, founder_archived_at, application_id, startups!inner(name, owner_id), incubation_centers(name, status)")
    .eq("id", id)
    .eq("startups.owner_id", user.id)
    .maybeSingle();
  if (!thread) notFound();

  const [{ data: messages }] = await Promise.all([
    supabase.from("messages").select("id, sender_side, body, created_at, hidden_at").eq("thread_id", id).order("created_at"),
    supabase.rpc("mark_thread_read", { p_thread_id: id }),
  ]);

  return (
    <section className="narrow">
      <p className="breadcrumbs">
        <Link href="/messages">Messages</Link>
        {thread.application_id ? (
          <>
            {" · "}
            <Link href={`/applications/${thread.application_id}`}>Related application</Link>
          </>
        ) : null}
      </p>
      <Notice code={notice} error={error} />
      <h1>{thread.subject}</h1>
      <p className="muted">Conversation with {thread.incubation_centers?.name ?? "a centre"}</p>
      <ThreadView
        threadId={id}
        side="founder"
        messages={messages ?? []}
        centreName={thread.incubation_centers?.name ?? "Centre"}
        startupName={thread.startups.name}
        archived={Boolean(thread.founder_archived_at)}
        canReply={thread.incubation_centers?.status === "active"}
        returnPath={`/messages/${id}`}
      />
    </section>
  );
}
