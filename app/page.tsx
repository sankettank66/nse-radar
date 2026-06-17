"use client";

import { useMemo } from "react";
import { useNseData } from "@/hooks/use-nse-data";
import { SectorGrid } from "@/components/sector-grid";
import { SectorDrilldown } from "@/components/sector-drilldown";
import { PerformanceCharts } from "@/components/performance-charts";
import { OISpurts } from "@/components/oi-spurts";
import { Analytics } from "@/components/analytics";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";

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

  const selectedSectorName = useMemo(() => {
    if (!selectedSector) return null;
    const sector = sectors.find((s) => s.index === selectedSector);
    return sector?.indexLongName ?? selectedSector;
  }, [selectedSector, sectors]);

  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
          <h1 className="text-[18px] font-semibold tracking-tight">
            NSE Sectorial Dashboard
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {lastUpdated && (
              <span className="hidden sm:inline text-muted-foreground text-[13px]">
                Updated {lastUpdated.toLocaleTimeString("en-IN")}
              </span>
            )}
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
      </header>

      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
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
            <section>
              <SectorGrid
                sectors={sectors}
                onSectorClick={(s) =>
                  setSelectedSector(selectedSector === s ? null : s)
                }
                selectedSector={selectedSector}
              />
            </section>

            <section>
              <Analytics sectors={sectors} oiSpurts={oiSpurts} />
            </section>

            <section>
              <PerformanceCharts
                sectors={sectors}
                stocks={stocks}
                selectedSector={selectedSector}
              />
            </section>

            <section>
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
    </div>
  );
}
