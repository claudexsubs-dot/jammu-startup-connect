import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <section className="auth-card">
      <h1>That link didn&apos;t work</h1>
      <p>
        Email links work once and expire after a while. They also need to be opened in the same browser you used to
        sign up or ask for the reset.
      </p>
      <p>
        <Link href="/login">Log in</Link> · <Link href="/forgot-password">Reset your password</Link>
      </p>
    </section>
  );
}
