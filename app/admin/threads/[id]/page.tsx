import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hideMessage } from "@/app/actions/admin";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Notice } from "@/components/notice";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Review conversation" };

export default async function AdminThreadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  const { id } = await params;
  const { notice } = await searchParams;
  const path = `/admin/threads/${id}`;
  const { supabase } = await requireAdmin(path);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: thread }, { data: messages }] = await Promise.all([
    supabase.from("message_threads").select("id, subject, created_at, incubation_centers(name), startups(name)").eq("id", id).maybeSingle(),
    supabase.from("messages").select("id, sender_side, body, created_at, hidden_at, hidden_reason").eq("thread_id", id).order("created_at"),
  ]);
  if (!thread) notFound();
  const centreName = thread.incubation_centers?.name ?? "Centre";
  const startupName = thread.startups?.name ?? "Startup";

  return (
    <section className="narrow">
      <p className="breadcrumbs">
        <Link href="/admin/reports">Reports</Link>
      </p>
      <Notice code={notice} />
      <h1>{thread.subject}</h1>
      <p className="muted">
        Between {centreName} and {startupName}. You&apos;re viewing this as the platform administrator for moderation.
      </p>
      <ol className="messages">
        {(messages ?? []).map((m) => (
          <li key={m.id} id={`m-${m.id}`} className={m.sender_side === "center" ? "theirs" : "mine"}>
            <p className="message-meta">
              {m.sender_side === "center" ? centreName : startupName} · {formatDateTime(m.created_at)}
            </p>
            <p className="pre-line">{m.body}</p>
            {m.hidden_at ? (
              <p className="badge badge-danger">Hidden {formatDateTime(m.hidden_at)}{m.hidden_reason ? `: ${m.hidden_reason}` : ""}</p>
            ) : (
              <details>
                <summary>Hide this message</summary>
                <ActionForm action={hideMessage.bind(null, m.id, path)}>
                  <Field name="reason" label="Reason" required />
                  <SubmitButton variant="danger" small pendingText="Hiding…">
                    Hide from both sides
                  </SubmitButton>
                </ActionForm>
              </details>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
