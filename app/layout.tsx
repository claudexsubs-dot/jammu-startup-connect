import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { Icons, LogoMark } from "@/components/icons";
import { MenuCloser, NavLink, THEME_SCRIPT, ThemeToggle } from "@/components/site-chrome";
import { getViewer } from "@/lib/auth";
import { initials } from "@/lib/format";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "UdyamSetu: incubation centres and expert sessions for Jammu founders", template: "%s · UdyamSetu" },
  description:
    "UdyamSetu helps Jammu-domiciled founders find incubation centres, apply in a few clicks, and book sessions with mentors and college experts.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const { user, roles, staffCentres, experts, supabase, profile } = viewer;
  const isAdmin = roles.includes("platform_admin");
  const isFounder = roles.includes("founder");

  let unread = 0;
  if (user) {
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
    unread = count ?? 0;
  }
  const name = profile?.full_name || user?.email || "";

  const workspaceLinks = (
    <>
      {staffCentres.length ? (
        <Link href="/manage">
          <Icons.building /> My centre
        </Link>
      ) : null}
      {experts.length ? (
        <Link href="/expert">
          <Icons.calendar /> Expert workspace
        </Link>
      ) : null}
      {isAdmin ? (
        <Link href="/admin">
          <Icons.shield /> Master admin
        </Link>
      ) : null}
    </>
  );

  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <MenuCloser />
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand" aria-label="UdyamSetu home">
              <span className="brand-mark">
                <LogoMark />
              </span>
              <span>
                UdyamSetu
                <small>Jammu founders&apos; bridge</small>
              </span>
            </Link>

            <nav className="main-nav" aria-label="Main">
              <NavLink href="/experts">Book an expert</NavLink>
              <NavLink href="/centres">Incubation centres</NavLink>
              {user ? (
                <>
                  <NavLink href="/dashboard">Dashboard</NavLink>
                  {isFounder ? <NavLink href="/bookings">My sessions</NavLink> : null}
                  <NavLink href="/messages">Messages</NavLink>
                </>
              ) : (
                <NavLink href="/about">How it works</NavLink>
              )}
            </nav>

            <div className="header-actions">
              <ThemeToggle />
              {user ? (
                <>
                  <Link href="/notifications" className="icon-button" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
                    <Icons.bell />
                    {unread ? <span className="dot-count">{unread > 99 ? "99+" : unread}</span> : null}
                  </Link>
                  <details className="menu desktop-only">
                    <summary className="avatar-button" aria-label="Your account menu">
                      <span className="avatar">{initials(name)}</span>
                      <span>{profile?.full_name?.split(" ")[0] ?? "Account"}</span>
                    </summary>
                    <div className="menu-panel">
                      <Link href="/dashboard">
                        <Icons.rocket /> Dashboard
                      </Link>
                      {isFounder ? (
                        <>
                          <Link href="/venture">
                            <Icons.briefcase /> Venture profile
                          </Link>
                          <Link href="/applications">
                            <Icons.file /> Applications
                          </Link>
                        </>
                      ) : null}
                      {workspaceLinks}
                      <hr />
                      <Link href="/account">
                        <Icons.settings /> Account settings
                      </Link>
                      <form action={logout}>
                        <button type="submit">
                          <Icons.logout /> Log out
                        </button>
                      </form>
                    </div>
                  </details>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-ghost btn-small desktop-only">
                    Log in
                  </Link>
                  <Link href="/register" className="btn btn-primary btn-small desktop-only">
                    Join free
                  </Link>
                </>
              )}
              <details className="menu mobile-menu">
                <summary className="icon-button" aria-label="Open menu">
                  <Icons.menu />
                </summary>
                <div className="menu-panel">
                  <Link href="/experts">
                    <Icons.calendar /> Book an expert
                  </Link>
                  <Link href="/centres">
                    <Icons.building /> Incubation centres
                  </Link>
                  {user ? (
                    <>
                      <Link href="/dashboard">
                        <Icons.rocket /> Dashboard
                      </Link>
                      {isFounder ? (
                        <>
                          <Link href="/bookings">
                            <Icons.clock /> My sessions
                          </Link>
                          <Link href="/applications">
                            <Icons.file /> Applications
                          </Link>
                          <Link href="/venture">
                            <Icons.briefcase /> Venture profile
                          </Link>
                        </>
                      ) : null}
                      <Link href="/messages">
                        <Icons.chat /> Messages
                      </Link>
                      {workspaceLinks}
                      <hr />
                      <Link href="/account">
                        <Icons.settings /> Account settings
                      </Link>
                      <form action={logout}>
                        <button type="submit">
                          <Icons.logout /> Log out
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <Link href="/about">
                        <Icons.shield /> How it works
                      </Link>
                      <hr />
                      <Link href="/login">
                        <Icons.user /> Log in
                      </Link>
                      <Link href="/register">
                        <Icons.rocket /> Join free as a founder
                      </Link>
                    </>
                  )}
                </div>
              </details>
            </div>
          </div>
        </header>
        <main id="main" className="container">
          {children}
        </main>
        <footer className="site-footer">
          <div className="container">
            <div className="footer-grid">
              <div className="footer-inner">
                <Link href="/" className="brand" aria-label="UdyamSetu home">
                  <span className="brand-mark">
                    <LogoMark />
                  </span>
                  UdyamSetu
                </Link>
                <p style={{ marginTop: 12 }}>
                  One place for Jammu founders to find incubation centres, apply, and book time with mentors and
                  college experts.
                </p>
              </div>
              <div>
                <h2>Founders</h2>
                <ul>
                  <li>
                    <Link href="/experts">Book an expert</Link>
                  </li>
                  <li>
                    <Link href="/centres">Incubation centres</Link>
                  </li>
                  <li>
                    <Link href="/register">Create a free account</Link>
                  </li>
                </ul>
              </div>
              <div>
                <h2>Your account</h2>
                <ul>
                  <li>
                    <Link href="/dashboard">Dashboard</Link>
                  </li>
                  <li>
                    <Link href="/bookings">My sessions</Link>
                  </li>
                  <li>
                    <Link href="/applications">Applications</Link>
                  </li>
                </ul>
              </div>
              <div>
                <h2>About</h2>
                <ul>
                  <li>
                    <Link href="/about">How UdyamSetu works</Link>
                  </li>
                  <li>
                    <Link href="/about#privacy">Privacy and payments</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <strong>UdyamSetu is an independent platform.</strong> It is not a government portal and is not run by any
              government programme. Using it does not promise funding, grants or admission: each incubation centre makes
              its own decisions.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
