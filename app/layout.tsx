import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Jammu Startup Connect", template: "%s · Jammu Startup Connect" },
  description: "The startup incubation ecosystem for Jammu: register your startup and connect with incubators and mentors.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              Jammu Startup Connect
            </Link>
            <nav aria-label="Main">
              <Link href="/startups">Startups</Link>
              {user ? (
                <>
                  <Link href="/dashboard">My startups</Link>
                  <Link href="/account">Account</Link>
                  <form action={logout}>
                    <button type="submit" className="link-button">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login">Log in</Link>
                  <Link href="/register" className="btn btn-primary btn-small">
                    Register
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
          <div className="container">Jammu Startup Connect · Supporting founders across the Jammu division</div>
        </footer>
      </body>
    </html>
  );
}
