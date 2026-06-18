"use client";

import { OiContracts } from "@/components/oi-contracts";
import { LiveTicker } from "@/components/live-ticker";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteNav } from "@/components/site-nav";
import Link from "next/link";

export default function OiContractsPage() {
  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
          <Link href="/" className="shrink-0">
            <h1 className="text-[18px] font-semibold tracking-tight">
              NSE Sectorial Dashboard
            </h1>
          </Link>
          <div className="hidden md:flex items-center flex-1 justify-center px-4 overflow-hidden">
            <LiveTicker />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-sm text-muted-foreground">
            <ThemeToggle />
          </div>
        </div>
        <div className="md:hidden border-t border-border px-6 py-2 max-w-7xl mx-auto w-full">
          <LiveTicker />
        </div>
        <SiteNav />
      </header>

      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">OI Contracts</h2>
          <p className="text-[14px] text-muted-foreground mt-1">
            Most active Call & Put options by volume, and OI-price action breakdown for stock F&O contracts. Data refreshes every 60 seconds.
          </p>
        </div>
        <OiContracts />
      </main>
    </div>
  );
}
