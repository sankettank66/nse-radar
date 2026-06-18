"use client";

import { Signals } from "@/components/signals";
import { LiveTicker } from "@/components/live-ticker";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteNav } from "@/components/site-nav";

export default function SignalsPage() {
  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
          <h1 className="text-[18px] font-semibold tracking-tight shrink-0">
            NSE Sectorial Dashboard
          </h1>
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
          <h2 className="text-2xl font-semibold tracking-tight">Trading Signals</h2>
          <p className="text-[14px] text-muted-foreground mt-1">
            Stock futures with significant OI buildup and price breakout. Ranked by{" "}
            <code className="text-foreground text-[13px]">
              |OI change| × |% change| × log₁₀(volume)
            </code>
            . Data refreshes every 60 seconds.
          </p>
        </div>
        <Signals />
      </main>
    </div>
  );
}
