"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SECTION_LINKS = [
  { href: "/#sectors", label: "Sectors" },
  { href: "/#analytics", label: "Overview" },
  { href: "/#charts", label: "Charts" },
  { href: "/#oi-spurts", label: "OI Spurts" },
];

const PAGE_LINKS = [
  { href: "/oi-contracts", label: "OI Contracts" },
  { href: "/signals", label: "Signals" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function isPageActive(href: string): boolean {
    if (href === "/oi-contracts") return pathname === "/oi-contracts";
    if (href === "/signals") return pathname === "/signals";
    return false;
  }

  return (
    <nav className="border-t border-border px-6 py-2 max-w-7xl mx-auto w-full overflow-visible">
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        {/* Sections dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              "inline-flex items-center gap-1 rounded-[100px] px-3 py-1 hover:bg-accent transition-all cursor-pointer",
              pathname === "/" && "text-foreground font-medium",
            )}
          >
            Sections
            <svg
              className={cn("size-3 transition-transform", open && "rotate-180")}
              viewBox="0 0 12 12"
              fill="none"
            >
              <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 w-44 rounded-xl border border-border bg-background shadow-lg py-1 z-20">
              {SECTION_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm text-foreground hover:bg-accent no-underline transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Separator */}
        <span className="text-border mx-0.5 select-none">|</span>

        {/* Page links */}
        {PAGE_LINKS.map((link) => {
          const active = isPageActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-[100px] no-underline transition-all",
                active
                  ? "text-muted-foreground/20 pointer-events-none mx-0.5"
                  : "px-3 py-1 hover:bg-accent",
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
