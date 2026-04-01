"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "Markets" },
  { href: "/ai-trades", label: "AI trades" },
  { href: "/accuracy/high", label: "High accuracy" },
  { href: "/accuracy/medium", label: "Medium accuracy" },
  { href: "/accuracy/low", label: "Low accuracy" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="site-nav" aria-label="Primary">
      <div className="site-nav__inner">
        <Link href="/" className="site-nav__brand">
          Polymarket Lab
        </Link>
        <div className="site-nav__links">
          {items.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "site-nav__link site-nav__link--active" : "site-nav__link"}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
