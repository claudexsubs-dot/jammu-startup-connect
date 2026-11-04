"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Section navigation for dashboards. The first item is the section's home page.
export function SubNav({ label, items }: { label: string; items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="tabs sub-nav" aria-label={label}>
      {items.map((item, index) => {
        const current = index === 0 ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
