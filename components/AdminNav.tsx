"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/events", label: "Events" },
  { href: "/admin/leaderboard", label: "Leaderboard" },
];

/** Segmented pill nav for the admin panel with an active-state highlight. */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-white text-brand-dark shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
