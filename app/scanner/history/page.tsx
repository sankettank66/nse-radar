"use client";

import { useState, useEffect, useCallback } from "react";
import { SiteNav } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { LiveTicker } from "@/components/live-ticker";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HistoryEntry {
  symbol: string;
  rank: number;
  qualityScore: number;
  rFactor: number;
  quadrant: string | null;
  confidence: string;
  pChange: number;
  volume: number;
  turnover: number;
}

interface SnapshotSummary {
  _id: string;
  timestamp: string;
  timeSlot: string;
  date: string;
  summary: {
    totalStocks: number;
    longBuildup: number;
    shortBuildup: number;
    shortCovering: number;
    longUnwinding: number;
    avgRFactor: number;
    top5: string[];
  };
  entries: HistoryEntry[];
}

interface HistoryResponse {
  date: string;
  count: number;
  snapshots: SnapshotSummary[];
}

function makeDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function quadrantBadgeColor(q: string | null) {
  switch (q) {
    case "long-buildup": return "bg-semantic-up/15 text-semantic-up border-semantic-up/30";
    case "short-buildup": return "bg-semantic-down/15 text-semantic-down border-semantic-down/30";
    case "short-covering": return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    case "long-unwinding": return "bg-orange-500/15 text-orange-500 border-orange-500/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function confidenceDot(level: string) {
  if (level === "high") return "bg-semantic-up";
  if (level === "medium") return "bg-amber-500";
  return "bg-muted-foreground/30";
}

const QUADRANT_SHORT: Record<string, string> = {
  "long-buildup": "LB",
  "short-buildup": "SB",
  "short-covering": "SC",
  "long-unwinding": "LU",
};

export default function ScannerHistoryPage() {
  const today = makeDateStr(new Date());
  const [dateStr, setDateStr] = useState(today);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async (d: string) => {
    setLoading(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/scanner/history?date=${d}`);
      if (!res.ok) { setData(null); return; }
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(dateStr);
  }, [dateStr, fetchHistory]);

  const selected = data?.snapshots.find((s) => s.timeSlot === selectedSlot) ?? null;
  const entries = selected?.entries ?? [];

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Scanner History</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Browse historical scanner snapshots by date and time slot.
            </p>
          </div>
          <input
            type="date"
            value={`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`}
            onChange={(e) => setDateStr(e.target.value.replace(/-/g, ""))}
            className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
          />
        </div>

        {loading && (
          <div className="text-sm text-muted-foreground animate-pulse">Loading snapshots…</div>
        )}

        {data && data.count === 0 && !loading && (
          <p className="text-sm text-muted-foreground">No snapshots for this date.</p>
        )}

        {data && data.count > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Time slot list */}
            <div className="lg:col-span-1 space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Time Slots ({data.count})
              </h3>
              {data.snapshots.map((s) => (
                <button
                  key={s.timeSlot}
                  onClick={() => setSelectedSlot(s.timeSlot)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedSlot === s.timeSlot
                      ? "bg-accent text-foreground font-medium"
                      : "hover:bg-accent/50 text-muted-foreground",
                  )}
                >
                  <span className="font-mono">{s.timeSlot}</span>
                  <span className="ml-2 text-[11px] text-muted-foreground">
                    {s.summary.totalStocks} stocks
                  </span>
                </button>
              ))}
            </div>

            {/* Entry table */}
            <div className="lg:col-span-3">
              {selected ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                      Avg R: {selected.summary.avgRFactor.toFixed(1)}
                    </span>
                    <span className="px-2 py-1 rounded bg-semantic-up/15 text-semantic-up">
                      LB: {selected.summary.longBuildup}
                    </span>
                    <span className="px-2 py-1 rounded bg-semantic-down/15 text-semantic-down">
                      SB: {selected.summary.shortBuildup}
                    </span>
                    <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-500">
                      SC: {selected.summary.shortCovering}
                    </span>
                    <span className="px-2 py-1 rounded bg-orange-500/15 text-orange-500">
                      LU: {selected.summary.longUnwinding}
                    </span>
                    <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                      Top: {selected.summary.top5.join(", ")}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <th className="text-left py-2 pr-2">#</th>
                          <th className="text-left py-2 pr-2">Symbol</th>
                          <th className="text-right py-2 pr-2">Score</th>
                          <th className="text-right py-2 pr-2">R</th>
                          <th className="text-right py-2 pr-2 hidden sm:table-cell">Quad</th>
                          <th className="text-right py-2 pr-2">Chg%</th>
                          <th className="text-right py-2 pr-2 hidden sm:table-cell">Vol</th>
                          <th className="text-right py-2 pr-2 hidden md:table-cell">Turnover</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((e, i) => (
                          <tr key={`${e.symbol}-${i}`} className="border-t border-border hover:bg-muted/50">
                            <td className="py-2 pr-2 text-muted-foreground font-mono text-xs">{e.rank}</td>
                            <td className="py-2 pr-2 font-medium">
                              <span className="flex items-center gap-1.5">
                                <span className={cn("inline-block size-[6px] rounded-full", confidenceDot(e.confidence))} />
                                {e.symbol}
                              </span>
                            </td>
                            <td className="py-2 pr-2 text-right font-mono tabular-nums">{e.qualityScore.toFixed(0)}</td>
                            <td className="py-2 pr-2 text-right font-mono tabular-nums">{e.rFactor.toFixed(1)}</td>
                            <td className="py-2 pr-2 text-right hidden sm:table-cell">
                              {e.quadrant ? (
                                <span className={cn("inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border", quadrantBadgeColor(e.quadrant))}>
                                  {QUADRANT_SHORT[e.quadrant] ?? e.quadrant}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className={cn("py-2 pr-2 text-right font-mono tabular-nums", e.pChange >= 0 ? "text-semantic-up" : "text-semantic-down")}>
                              {e.pChange.toFixed(1)}%
                            </td>
                            <td className="py-2 pr-2 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">
                              {e.volume.toLocaleString()}
                            </td>
                            <td className="py-2 pr-2 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
                              ₹{(e.turnover / 1e7).toFixed(1)}Cr
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a time slot to view entries.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
