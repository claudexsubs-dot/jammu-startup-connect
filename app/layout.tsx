import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getViewer } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "UdyamSetu", template: "%s · UdyamSetu" },
  description:
    "UdyamSetu helps Jammu-domiciled founders discover and apply to incubation centres, get mentor support and request sessions with college experts.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const { user, roles, staffCentres, experts, supabase } = viewer;
  const isAdmin = roles.includes("platform_admin");

  let unread = 0;
  if (user) {
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
    unread = count ?? 0;
  }

  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              UdyamSetu
            </Link>
            <nav aria-label="Main">
              <Link href="/centres">Centres</Link>
              {user ? (
                <>
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/messages">Messages</Link>
                  {staffCentres.length ? <Link href="/manage">My centre</Link> : null}
                  {experts.length ? <Link href="/expert">Expert</Link> : null}
                  {isAdmin ? <Link href="/admin">Admin</Link> : null}
                  <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
                    Notifications{unread ? <span className="count-badge">{unread > 99 ? "99+" : unread}</span> : null}
                  </Link>
                  <Link href="/account">Account</Link>
                  <form action={logout}>
                    <button type="submit" className="link-button">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/about">About</Link>
                  <Link href="/login">Log in</Link>
                  <Link href="/register" className="btn btn-primary btn-small">
                    Register as a founder
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main id="main" className="container">
          {children}
        </main>
        <footer className="site-footer">
          <div className="container footer-inner">
            <p>
              <strong>UdyamSetu is an independent platform.</strong> It is not a government portal and is not run by any
              government programme. Using it does not promise funding, grants or admission: each incubation centre makes
              its own decisions.
            </p>
            <p>
              <Link href="/about">About UdyamSetu</Link> · <Link href="/centres">Browse centres</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
