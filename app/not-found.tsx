import Link from "next/link";

export default function NotFound() {
  return (
    <section className="narrow">
      <h1>Page not found</h1>
      <p>This page doesn&apos;t exist, or you don&apos;t have access to it.</p>
      <p>
        <Link href="/centres">Browse incubation centres</Link> · <Link href="/dashboard">Go to your dashboard</Link>
      </p>
    </section>
  );
}
