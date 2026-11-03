import Link from "next/link";

export default function NotFound() {
  return (
    <section className="narrow">
      <h1>Page not found</h1>
      <p>This page doesn&apos;t exist, or it&apos;s a startup profile that hasn&apos;t been published.</p>
      <p>
        <Link href="/startups">Browse startups</Link>
      </p>
    </section>
  );
}
