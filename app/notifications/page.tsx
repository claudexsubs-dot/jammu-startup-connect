import type { Metadata } from "next";
import { markNotificationsRead, openNotification } from "@/app/actions/account";
import { SubmitButton } from "@/components/form";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { supabase, user } = await requireUser("/notifications");
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, link, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const unread = (notifications ?? []).filter((n) => !n.read_at).length;

  return (
    <section className="narrow">
      <div className="section-head">
        <h1>Notifications</h1>
        {unread ? (
          <form action={markNotificationsRead}>
            <SubmitButton variant="secondary" small pendingText="Marking…">
              Mark all as read
            </SubmitButton>
          </form>
        ) : null}
      </div>
      {notifications && notifications.length ? (
        <ul className="thread-list">
          {notifications.map((n) => (
            <li key={n.id} className={n.read_at ? undefined : "unread"}>
              <form action={openNotification.bind(null, n.id, n.link)}>
                <button type="submit" className="link-button notification-button">
                  <strong>{n.title}</strong>
                  {n.read_at ? null : <span className="visually-hidden"> (unread)</span>}
                </button>
              </form>
              {n.body ? <p className="pre-line small">{n.body}</p> : null}
              <p className="muted small">{formatDateTime(n.created_at)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">No notifications yet. Updates on your applications, messages and sessions will appear here.</p>
      )}
    </section>
  );
}
