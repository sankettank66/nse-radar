"use client";

import { useMemo, useState } from "react";
import { useNseData } from "@/hooks/use-nse-data";
import { SectorGrid } from "@/components/sector-grid";
import { SectorDrilldown } from "@/components/sector-drilldown";
import { PerformanceCharts } from "@/components/performance-charts";
import { OISpurts } from "@/components/oi-spurts";
import { Analytics } from "@/components/analytics";
import { FnoAnalysis } from "@/components/fno-analysis";
import { ThemeToggle } from "@/components/theme-toggle";
import { LiveTicker } from "@/components/live-ticker";
import { SiteNav } from "@/components/site-nav";

export default function Home() {
  const {
    sectors,
    stocks,
    oiSpurts,
    loading,
    refreshing,
    stocksLoading,
    error,
    selectedSector,
    setSelectedSector,
    lastUpdated,
    refresh,
  } = useNseData();

  const [fnoSide, setFnoSide] = useState<"CE" | "PE" | null>(null);

  const selectedSectorName = useMemo(() => {
    if (!selectedSector) return null;
    const sector = sectors.find((s) => s.index === selectedSector);
    return sector?.indexLongName ?? selectedSector;
  }, [selectedSector, sectors]);

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
            {lastUpdated && (
              <span className="hidden sm:inline text-muted-foreground text-[13px]">
                Updated {lastUpdated.toLocaleTimeString("en-IN")}
              </span>
            )}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setFnoSide("CE")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[100px] bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                CE
              </button>
              <button
                onClick={() => setFnoSide("PE")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[100px] border border-border bg-background text-foreground text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
              >
                PE
              </button>
            </div>
            {refreshing && (
              <div className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
            )}
            <button
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[100px] border border-border bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <ThemeToggle />
          </div>
        </div>
        <div className="md:hidden border-t border-border px-6 py-2 max-w-7xl mx-auto w-full">
          <LiveTicker />
        </div>
        <SiteNav />
      </header>

      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        <div className="flex sm:hidden items-center gap-2 mb-6">
          <button
            onClick={() => setFnoSide("CE")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[100px] bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            F&O CE
          </button>
          <button
            onClick={() => setFnoSide("PE")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[100px] border border-border bg-background text-foreground text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
          >
            F&O PE
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-muted text-destructive text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            <section id="sectors">
              <SectorGrid
                sectors={sectors}
                onSectorClick={(s) =>
                  setSelectedSector(selectedSector === s ? null : s)
                }
                selectedSector={selectedSector}
              />
            </section>

            <section id="analytics">
              <Analytics sectors={sectors} oiSpurts={oiSpurts} />
            </section>

            <section id="charts">
              <PerformanceCharts
                sectors={sectors}
                stocks={stocks}
                selectedSector={selectedSector}
              />
            </section>

            <section id="oi-spurts">
              <OISpurts data={oiSpurts} />
            </section>

          </div>
        )}
      </main>

      <SectorDrilldown
        sectorName={selectedSectorName}
        stocks={stocks}
        loading={stocksLoading}
        onClose={() => setSelectedSector(null)}
      />

      <FnoAnalysis
        side={fnoSide}
        onClose={() => setFnoSide(null)}
        stocks={selectedSector ? stocks : []}
        oiSpurts={oiSpurts}
      />
    </div>
  );
}
