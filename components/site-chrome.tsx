"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Icons } from "@/components/icons";

// A main-navigation link that shows when it is the current section.
export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const current = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}

// Closes open header menus after navigating or when clicking elsewhere.
export function MenuCloser() {
  const pathname = usePathname();
  useEffect(() => {
    document.querySelectorAll<HTMLDetailsElement>("details.menu[open]").forEach((d) => d.removeAttribute("open"));
  }, [pathname]);
  useEffect(() => {
    function onClick(event: MouseEvent) {
      document.querySelectorAll<HTMLDetailsElement>("details.menu[open]").forEach((d) => {
        if (!d.contains(event.target as Node)) d.removeAttribute("open");
      });
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      document.querySelectorAll<HTMLDetailsElement>("details.menu[open]").forEach((d) => {
        d.removeAttribute("open");
        d.querySelector("summary")?.focus();
      });
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  return null;
}

// Switches between light and dark. The choice is remembered on this device.
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("udyamsetu-theme", next);
    } catch {
      // Private browsing: the choice lasts for this page only.
    }
  }
  return (
    <button type="button" className="icon-button theme-toggle" onClick={toggle} aria-label="Switch between light and dark theme" title="Light or dark theme">
      <Icons.moon className="icon moon" />
      <Icons.sun className="icon sun" />
    </button>
  );
}

// Runs before the page paints so the chosen theme shows without a flash.
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("udyamsetu-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})();`;
