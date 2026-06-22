"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { OISpurtEntry } from "@/lib/types";
import { fetchFuturesSnapshot, fetchOISpurts, fetchMostActiveUnderlying, extractSnapshotEntries } from "@/lib/api";
import { isMarketOpen, getMarketStatus } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { consolidateFutures } from "@/lib/nse-data";
import { enrichScannerData, computeConfluence, filterByTab, QUADRANT_LABEL, QUADRANT_DESC } from "@/lib/scanner-engine";
import type { EnrichedEntry, TabFilter } from "@/lib/scanner-engine";
import { ScannerSkeleton } from "@/components/scanner-skeleton";
import { ScannerTable } from "@/components/scanner-table";

const TABS: { key: TabFilter; label: string; color: string }[] = [
  { key: "all", label: "All Stocks", color: "" },
  { key: "long-buildup", label: "Long Buildup", color: "text-semantic-up" },
  { key: "short-buildup", label: "Short Buildup", color: "text-semantic-down" },
  { key: "short-covering", label: "Short Covering", color: "text-amber-500" },
  { key: "long-unwinding", label: "Long Unwinding", color: "text-orange-500" },
];

export function MomentumScanner() {
  const [enriched, setEnriched] = useState<EnrichedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>("long-buildup");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [futuresRes, spurtsRes, underlyingRes] = await Promise.all([
        fetchFuturesSnapshot(),
        fetchOISpurts(),
        fetchMostActiveUnderlying(),
      ]);

      const raw = extractSnapshotEntries(futuresRes);
      const stocks = consolidateFutures(raw);

      const spurtsMap = new Map<string, OISpurtEntry>();
      for (const entry of spurtsRes.data) {
        spurtsMap.set(entry.symbol, entry);
      }

      let enrichedData = enrichScannerData(stocks, spurtsMap);
      enrichedData = computeConfluence(enrichedData, underlyingRes.data);
      setEnriched(enrichedData);
    } catch {
      // non-critical
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    if (isMarketOpen()) {
      intervalRef.current = setInterval(loadData, 60_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  const filtered = useMemo(() => filterByTab(enriched, tab, 0, 0), [enriched, tab]);

  const quadrantCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of enriched) {
      const q = e.quadrant ?? "unclassified";
      counts[q] = (counts[q] || 0) + 1;
    }
    return counts;
  }, [enriched]);

  const marketStatus = getMarketStatus();

  if (loading) return <ScannerSkeleton />;

  return (
    <div className="space-y-4">
      {/* Market Sentiment Banner */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border bg-muted/30">
        <span
          className={cn(
            "inline-block size-2 rounded-full shrink-0",
            marketStatus === "live"
              ? "bg-semantic-up"
              : marketStatus === "pre-market"
                ? "bg-amber-500"
                : "bg-muted-foreground/40",
          )}
        />
        <span className="text-[13px] text-muted-foreground">
          Market{" "}
          <span className="font-medium text-foreground">
            {marketStatus === "live"
              ? "Open"
              : marketStatus === "pre-market"
                ? "Pre-market"
                : "Closed"}
          </span>
          {" — "}
          <span className="text-semantic-up font-medium">{quadrantCounts["long-buildup"] ?? 0} Long Buildup</span>
          {" / "}
          <span className="text-semantic-down font-medium">{quadrantCounts["short-buildup"] ?? 0} Short Buildup</span>
          {" / "}
          <span className="text-amber-500 font-medium">{quadrantCounts["short-covering"] ?? 0} Short Covering</span>
        </span>
      </div>

      {/* Quadrant Legend */}
      <div className="hidden sm:flex items-center gap-4 px-5 py-2 rounded-xl border border-border bg-muted/20 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">OI-Price Quadrants:</span>
        <span className="text-semantic-up">Long Buildup</span>
        <span className="text-muted-foreground/40">|</span>
        <span className="text-semantic-down">Short Buildup</span>
        <span className="text-muted-foreground/40">|</span>
        <span className="text-amber-500">Short Covering</span>
        <span className="text-muted-foreground/40">|</span>
        <span className="text-orange-500">Long Unwinding</span>
        <span className="text-muted-foreground/40">|</span>
        <span>R = confluence score (1.0–8.0). Higher = more signals aligned</span>
        <span className="text-muted-foreground/40">|</span>
        <span>Vol/OI {'<'} 0.5 = Accumulation (institutional holding)</span>
      </div>

      {/* Scanner Table */}
      <Card className="rounded-xl border border-border shadow-none">
        <CardHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-[18px] font-semibold tracking-tight">
              {tab === "all"
                ? "All Stock Futures"
                : `${QUADRANT_LABEL[tab] ?? "Stocks"}`}
              <span className="ml-2 text-[14px] font-normal text-muted-foreground">
                ({filtered.length})
              </span>
            </CardTitle>
            <div className="flex items-center gap-1.5 bg-muted rounded-full p-0.5 flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap",
                    tab === t.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                    tab === t.key && t.color ? t.color : "",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[13px] text-muted-foreground mt-1">
            {tab !== "all" && QUADRANT_DESC[tab]
              ? QUADRANT_DESC[tab]
              : "All stock futures ranked by a composite quality score combining price change, turnover, volume, OI, and OI change. Stocks with OI Spurts data are classified into OI-Price quadrants."}
            {" "}Data refreshes every 60 seconds.
          </p>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {filtered.length === 0 ? (
            <p className="px-6 py-8 text-center text-[13px] text-muted-foreground">
              No stocks match the current filter
            </p>
          ) : (
            <ScannerTable data={filtered} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
