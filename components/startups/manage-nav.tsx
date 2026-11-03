import Link from "next/link";

export function ManageNav({ startupId, current }: { startupId: string; current: "profile" | "edit" | "team" | "financials" }) {
  const items = [
    { key: "profile", href: `/startups/${startupId}`, label: "Profile" },
    { key: "edit", href: `/startups/${startupId}/edit`, label: "Edit details" },
    { key: "team", href: `/startups/${startupId}/team`, label: "Team" },
    { key: "financials", href: `/startups/${startupId}/financials`, label: "Financials (private)" },
  ];
  return (
    <nav className="tabs" aria-label="Manage startup">
      {items.map((item) => (
        <Link key={item.key} href={item.href} aria-current={item.key === current ? "page" : undefined}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
