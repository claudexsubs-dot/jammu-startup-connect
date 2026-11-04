import { reportThread, sendMessage, setArchived } from "@/app/actions/messages";
import { ActionForm, SubmitButton, TextArea } from "@/components/form";
import { formatDateTime } from "@/lib/format";

type Message = { id: string; sender_side: string; body: string; created_at: string; hidden_at: string | null };

// One conversation between a startup and a centre, seen from either side.
export function ThreadView({
  threadId,
  side,
  messages,
  centreName,
  startupName,
  archived,
  canReply,
  returnPath,
}: {
  threadId: string;
  side: "founder" | "center";
  messages: Message[];
  centreName: string;
  startupName: string;
  archived: boolean;
  canReply: boolean;
  returnPath: string;
}) {
  const label = (sender: string) => (sender === side ? "You" : sender === "center" ? centreName : startupName);
  return (
    <>
      <ol className="messages" aria-label="Messages">
        {messages.map((m) => (
          <li key={m.id} className={m.sender_side === side ? "mine" : "theirs"}>
            <p className="message-meta">
              <strong>{label(m.sender_side)}</strong> · <time dateTime={m.created_at}>{formatDateTime(m.created_at)}</time>
            </p>
            {m.hidden_at ? <p className="muted">This message was removed by a moderator.</p> : <p className="pre-line">{m.body}</p>}
          </li>
        ))}
      </ol>

      {canReply ? (
        <ActionForm action={sendMessage.bind(null, threadId, returnPath)}>
          <TextArea name="body" label="Reply" required rows={4} hint={side === "founder" ? "Your email and phone aren't shown unless you type them." : undefined} />
          <SubmitButton pendingText="Sending…">Send</SubmitButton>
        </ActionForm>
      ) : (
        <p className="alert alert-info">This centre is suspended, so this conversation is read-only for now.</p>
      )}

      <div className="thread-tools">
        <form action={setArchived.bind(null, threadId, returnPath, !archived)}>
          <SubmitButton variant="secondary" small>
            {archived ? "Move back to inbox" : "Archive conversation"}
          </SubmitButton>
        </form>
        <details>
          <summary>{side === "founder" ? "Report unwanted contact" : "Report this conversation"}</summary>
          <ActionForm action={reportThread.bind(null, threadId, returnPath)}>
            <TextArea name="reason" label="What happened?" required rows={3} hint="The platform administrator will review this conversation." />
            <SubmitButton variant="danger" small pendingText="Sending…">
              Send report
            </SubmitButton>
          </ActionForm>
        </details>
      </div>
    </>
  );
}
