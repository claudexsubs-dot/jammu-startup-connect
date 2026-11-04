import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/notice";
import { ApplicationStatusBadge, BookingStatusBadge } from "@/components/status";
import { requireUser } from "@/lib/auth";
import { formatDate, formatTimeRange, timeUntil } from "@/lib/format";
import { loadVenture } from "@/lib/venture";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const viewer = await requireUser("/dashboard");
  const { supabase, user, roles, staffCentres, experts } = viewer;
  const isFounder = roles.includes("founder");
  const isAdmin = roles.includes("platform_admin");
  const email = (user.email ?? "").toLowerCase();

  const [venture, { data: invitations }] = await Promise.all([
    isFounder ? loadVenture(supabase, user.id) : Promise.resolve(null),
    supabase
      .from("invitations")
      .select("id, token, kind, incubation_centers(name), center_experts(full_name)")
      .eq("status", "pending")
      .eq("email", email)
      .gt("expires_at", new Date().toISOString()),
  ]);
  const startup = venture?.startup ?? null;

  const [{ data: applications }, { data: bookings }, { data: threads }] = startup
    ? await Promise.all([
        supabase
          .from("startup_applications")
          .select("id, status, last_status_at, incubation_centers(name)")
          .eq("founder_id", user.id)
          .order("last_status_at", { ascending: false }),
        supabase
          .from("consultation_bookings")
          .select("id, status, starts_at, ends_at, format, proposed_slot_id, center_experts(full_name)")
          .eq("founder_id", user.id)
          .in("status", ["pending", "payment_instructions_sent", "confirmed"])
          .gt("ends_at", new Date().toISOString())
          .order("starts_at"),
        supabase
          .from("message_threads")
          .select("id, subject, last_message_at, founder_last_read_at, incubation_centers(name)")
          .eq("startup_id", startup.id)
          .is("founder_archived_at", null)
          .order("last_message_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const needsAction = (applications ?? []).filter((a) => a.status === "more_information_needed" || a.status === "draft");
  const upcoming = (bookings ?? []).filter((b) => b.status === "confirmed");
  const waiting = (bookings ?? []).filter((b) => b.status !== "confirmed");
  const unreadThreads = (threads ?? []).filter((t) => !t.founder_last_read_at || t.founder_last_read_at < t.last_message_at);
  const gaps = venture?.gaps ?? [];
  const firstName = viewer.profile?.full_name?.split(" ")[0];

  return (
    <>
      <Notice code={notice} />
      <h1>{firstName ? `Welcome, ${firstName}` : "Your dashboard"}</h1>

      {invitations && invitations.length ? (
        <section className="card highlight" aria-labelledby="invites">
          <h2 id="invites" className="h3">
            Invitations waiting for you
          </h2>
          <ul>
            {invitations.map((i) => (
              <li key={i.id}>
                <Link href={`/invite/${i.token}`}>
                  {i.kind === "center_staff" ? `Join ${i.incubation_centers?.name ?? "a centre"} as staff` : `Link your account to ${i.center_experts?.full_name ?? "an expert profile"} at ${i.incubation_centers?.name ?? "a centre"}`}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {staffCentres.length || experts.length || isAdmin ? (
        <section aria-labelledby="workspaces">
          <h2 id="workspaces">Your workspaces</h2>
          <ul className="card-grid">
            {staffCentres.map((c) => (
              <li key={c.id} className="card">
                <h3>
                  <Link href={`/manage/${c.slug}`}>{c.name}</Link>
                </h3>
                <p className="muted small">Centre dashboard: applications, startups, messages, mentors and bookings.</p>
                {c.status !== "active" ? <span className="badge badge-danger">Centre suspended</span> : null}
              </li>
            ))}
            {experts.length ? (
              <li className="card">
                <h3>
                  <Link href="/expert">Mentor and expert workspace</Link>
                </h3>
                <p className="muted small">Your availability and session requests.</p>
              </li>
            ) : null}
            {isAdmin ? (
              <li className="card">
                <h3>
                  <Link href="/admin">Master admin</Link>
                </h3>
                <p className="muted small">Centres, staff access, users, reports, tags and audit history.</p>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {isFounder ? (
        <>
          <section aria-labelledby="venture" className="card">
            <h2 id="venture" className="h3">
              Your venture profile
            </h2>
            {!startup ? (
              <>
                <p>Start your venture profile. It saves as a draft, so you can finish it in several sittings.</p>
                <Link href="/venture" className="btn btn-primary">
                  Start your profile
                </Link>
              </>
            ) : gaps.length ? (
              <>
                <p>
                  <strong>{startup.name}</strong> is saved as a draft. Before you can apply, add: {gaps.join(", ")}.
                </p>
                <Link href="/venture" className="btn btn-primary">
                  Complete your profile
                </Link>
              </>
            ) : (
              <>
                <p>
                  <strong>{startup.name}</strong> is complete and ready for applications.
                </p>
                <div className="actions">
                  <Link href="/centres" className="btn btn-primary">
                    See recommended centres
                  </Link>
                  <Link href="/venture" className="btn btn-secondary">
                    View profile
                  </Link>
                </div>
              </>
            )}
          </section>

          {startup ? (
            <div className="card-grid">
              <section aria-labelledby="apps" className="card">
                <h2 id="apps" className="h3">
                  Applications
                </h2>
                {needsAction.length ? (
                  <ul className="plain stack-tight">
                    {needsAction.map((a) => (
                      <li key={a.id}>
                        <Link href={`/applications/${a.id}`}>{a.incubation_centers?.name ?? "Centre"}</Link> <ApplicationStatusBadge status={a.status} />
                        <span className="muted small"> {a.status === "draft" ? "Submit when ready" : "The centre asked you for more information"}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">{applications?.length ? "Nothing needs your attention right now." : "You haven't applied to any centre yet."}</p>
                )}
                <p>
                  <Link href="/applications">All applications ({applications?.length ?? 0})</Link>
                </p>
              </section>

              <section aria-labelledby="sessions" className="card">
                <h2 id="sessions" className="h3">
                  Mentor and expert sessions
                </h2>
                {upcoming.length ? (
                  <ul className="plain stack-tight">
                    {upcoming.map((b) => (
                      <li key={b.id}>
                        <Link href={`/bookings/${b.id}`}>{b.center_experts?.full_name ?? "Session"}</Link>{" "}
                        <span className="badge badge-live">{timeUntil(b.starts_at)}</span>
                        <br />
                        <span className="muted small">{formatTimeRange(b.starts_at, b.ends_at)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No confirmed sessions coming up.</p>
                )}
                {waiting.length ? (
                  <ul className="plain stack-tight">
                    {waiting.map((b) => (
                      <li key={b.id}>
                        <Link href={`/bookings/${b.id}`}>{b.center_experts?.full_name ?? "Request"}</Link> <BookingStatusBadge status={b.status} />
                        {b.proposed_slot_id ? <span className="badge badge-info">New time suggested</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p>
                  <Link href="/bookings">All sessions</Link>
                </p>
              </section>

              <section aria-labelledby="msgs" className="card">
                <h2 id="msgs" className="h3">
                  Messages
                </h2>
                {unreadThreads.length ? (
                  <ul className="plain stack-tight">
                    {unreadThreads.slice(0, 5).map((t) => (
                      <li key={t.id}>
                        <Link href={`/messages/${t.id}`}>
                          <strong>{t.incubation_centers?.name ?? "Centre"}</strong> · {t.subject}
                        </Link>
                        <span className="muted small"> {formatDate(t.last_message_at)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No unread messages.</p>
                )}
                <p>
                  <Link href="/messages">Inbox ({threads?.length ?? 0})</Link>
                </p>
              </section>
            </div>
          ) : null}
        </>
      ) : !staffCentres.length && !experts.length && !isAdmin ? (
        <p className="empty">
          Your account isn&apos;t linked to a centre yet. If you were invited, open the invitation link you received while signed in as {user.email}.
        </p>
      ) : null}
    </>
  );
}
