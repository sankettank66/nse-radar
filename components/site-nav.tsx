"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#sectors", label: "Sectors" },
  { href: "/#analytics", label: "Overview" },
  { href: "/#charts", label: "Charts" },
  { href: "/#oi-spurts", label: "OI Spurts" },
  { href: "/oi-contracts", label: "OI Contracts" },
];

export function SiteNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/oi-contracts") return pathname === "/oi-contracts";
    return pathname === "/";
  }

  return (
    <nav className="border-t border-border px-6 py-2 max-w-7xl mx-auto w-full overflow-x-auto">
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        {LINKS.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-[100px] no-underline transition-all",
                active
                  ? "text-muted-foreground/20 pointer-events-none mx-0.5"
                  : "px-3 py-1 hover:bg-accent"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
