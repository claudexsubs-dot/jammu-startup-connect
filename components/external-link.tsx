import { safeHref } from "@/lib/safe-url";

// Renders a link only when it is a real http(s) address; otherwise shows the text.
export function ExternalLink({ href, children }: { href: string | null | undefined; children?: React.ReactNode }) {
  const safe = safeHref(href);
  if (!safe) return href ? <span>{href}</span> : <span className="muted">—</span>;
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer nofollow">
      {children ?? safe}
    </a>
  );
}
