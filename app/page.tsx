"use client";

import { useNseData } from "@/hooks/use-nse-data";
import { SectorGrid } from "@/components/sector-grid";

export default function Home() {
  const {
    sectors,
    loading,
    error,
    selectedSector,
    setSelectedSector,
    lastUpdated,
    refresh,
  } = useNseData();

  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
          <h1 className="text-xl font-bold">NSE Sectorial Dashboard</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {lastUpdated && (
              <span>
                Last updated: {lastUpdated.toLocaleTimeString("en-IN")}
              </span>
            )}
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border hover:bg-accent transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        ) : (
          <SectorGrid
            sectors={sectors}
            onSectorClick={(s) =>
              setSelectedSector(selectedSector === s ? null : s)
            }
            selectedSector={selectedSector}
          />
        )}
      </main>
    </div>
  );
}
