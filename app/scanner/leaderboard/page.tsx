"use client";

import { useState, useEffect, useCallback } from "react";
import { SiteNav } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { LiveTicker } from "@/components/live-ticker";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RankChange {
  symbol: string;
  currentRank: number;
  prevRank: number | null;
  rankChange: number | null;
  qualityScore: number;
  rFactor: number;
  quadrant: string | null;
  isNew: boolean;
  isDropped: boolean;
}

interface DroppedEntry {
  symbol: string;
  prevRank: number;
  currentRank: null;
  rankChange: null;
  isDropped: boolean;
}

interface LeaderboardResponse {
  date: string;
  current: string;
  previous: string;
  total: number;
  changes: RankChange[];
  dropped: DroppedEntry[];
}

interface HistoryResponse {
  date: string;
  count: number;
  snapshots: { timeSlot: string }[];
}

function makeDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function rankChangeColor(change: number | null): string {
  if (change === null) return "text-muted-foreground";
  if (change > 0) return "text-semantic-up";
  if (change < 0) return "text-semantic-down";
  return "text-muted-foreground";
}

function rankChangeArrow(change: number | null): string {
  if (change === null) return "—";
  if (change > 0) return `▲${change}`;
  if (change < 0) return `▼${Math.abs(change)}`;
  return "—";
}

const QUADRANT_SHORT: Record<string, string> = {
  "long-buildup": "LB",
  "short-buildup": "SB",
  "short-covering": "SC",
  "long-unwinding": "LU",
};

function quadrantBadgeColor(q: string | null) {
  switch (q) {
    case "long-buildup": return "bg-semantic-up/15 text-semantic-up border-semantic-up/30";
    case "short-buildup": return "bg-semantic-down/15 text-semantic-down border-semantic-down/30";
    case "short-covering": return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    case "long-unwinding": return "bg-orange-500/15 text-orange-500 border-orange-500/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

export default function ScannerLeaderboardPage() {
  const today = makeDateStr(new Date());
  const [dateStr, setDateStr] = useState(today);
  const [snapshots, setSnapshots] = useState<{ timeSlot: string }[]>([]);
  const [currentSlot, setCurrentSlot] = useState("");
  const [previousSlot, setPreviousSlot] = useState("");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);

  const fetchSnapshots = useCallback(async (d: string) => {
    setSnapshotsLoading(true);
    try {
      const res = await fetch(`/api/scanner/history?date=${d}`);
      if (!res.ok) { setSnapshots([]); return; }
      const json: HistoryResponse = await res.json();
      setSnapshots(json.snapshots);
      if (json.snapshots.length >= 2) {
        setCurrentSlot(json.snapshots[json.snapshots.length - 1].timeSlot);
        setPreviousSlot(json.snapshots[json.snapshots.length - 2].timeSlot);
      }
    } catch {
      setSnapshots([]);
    } finally {
      setSnapshotsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshots(dateStr);
  }, [dateStr, fetchSnapshots]);

  const fetchLeaderboard = useCallback(async () => {
    if (!currentSlot || !previousSlot) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/scanner/leaderboard?date=${dateStr}&current=${currentSlot}&previous=${previousSlot}`,
      );
      if (!res.ok) { setData(null); return; }
      const json: LeaderboardResponse = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateStr, currentSlot, previousSlot]);

  useEffect(() => {
    if (currentSlot && previousSlot) fetchLeaderboard();
  }, [currentSlot, previousSlot, fetchLeaderboard]);

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
            <h2 className="text-xl font-semibold tracking-tight">Scanner Leaderboard</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Rank changes between two time slots. Compare who moved up or down.
            </p>
          </div>
          <input
            type="date"
            value={`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`}
            onChange={(e) => setDateStr(e.target.value.replace(/-/g, ""))}
            className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
          />
        </div>

        {snapshotsLoading && (
          <div className="text-sm text-muted-foreground animate-pulse">Loading time slots…</div>
        )}

        {!snapshotsLoading && snapshots.length === 0 && (
          <p className="text-sm text-muted-foreground">No snapshots for this date.</p>
        )}

        {snapshots.length > 0 && (
          <>
            <div className="flex flex-wrap gap-4 items-center mb-6">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Previous</label>
                <select
                  value={previousSlot}
                  onChange={(e) => setPreviousSlot(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
                >
                  {snapshots.map((s) => (
                    <option key={s.timeSlot} value={s.timeSlot}>{s.timeSlot}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Current</label>
                <select
                  value={currentSlot}
                  onChange={(e) => setCurrentSlot(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
                >
                  {snapshots.map((s) => (
                    <option key={s.timeSlot} value={s.timeSlot}>{s.timeSlot}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading && (
              <div className="text-sm text-muted-foreground animate-pulse">Computing rank changes…</div>
            )}

            {data && !loading && (
              <div className="space-y-6">
                {/* Leaderboard table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="text-left py-2 pr-2">Symbol</th>
                        <th className="text-right py-2 pr-2">Prev Rank</th>
                        <th className="text-right py-2 pr-2">Cur Rank</th>
                        <th className="text-right py-2 pr-2">Change</th>
                        <th className="text-right py-2 pr-2">Score</th>
                        <th className="text-right py-2 pr-2">R</th>
                        <th className="text-right py-2 pr-2 hidden sm:table-cell">Quad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.changes.map((c) => (
                        <tr key={c.symbol} className="border-t border-border hover:bg-muted/50">
                          <td className="py-2 pr-2 font-medium">
                            {c.isNew && (
                              <span className="inline-block text-[9px] font-semibold uppercase tracking-wider text-semantic-up bg-semantic-up/15 px-1 py-0.5 rounded mr-1.5">NEW</span>
                            )}
                            {c.symbol}
                          </td>
                          <td className="py-2 pr-2 text-right font-mono tabular-nums text-muted-foreground">
                            {c.prevRank ?? "—"}
                          </td>
                          <td className="py-2 pr-2 text-right font-mono tabular-nums">
                            {c.currentRank}
                          </td>
                          <td className={cn("py-2 pr-2 text-right font-mono tabular-nums font-medium", rankChangeColor(c.rankChange))}>
                            {rankChangeArrow(c.rankChange)}
                          </td>
                          <td className="py-2 pr-2 text-right font-mono tabular-nums">
                            {c.qualityScore.toFixed(0)}
                          </td>
                          <td className="py-2 pr-2 text-right font-mono tabular-nums">
                            {c.rFactor.toFixed(1)}
                          </td>
                          <td className="py-2 pr-2 text-right hidden sm:table-cell">
                            {c.quadrant ? (
                              <span className={cn("inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border", quadrantBadgeColor(c.quadrant))}>
                                {QUADRANT_SHORT[c.quadrant] ?? c.quadrant}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {data.dropped.map((d) => (
                        <tr key={d.symbol} className="border-t border-border hover:bg-muted/50 opacity-60">
                          <td className="py-2 pr-2 font-medium">
                            <span className="inline-block text-[9px] font-semibold uppercase tracking-wider text-semantic-down bg-semantic-down/15 px-1 py-0.5 rounded mr-1.5">DROP</span>
                            {d.symbol}
                          </td>
                          <td className="py-2 pr-2 text-right font-mono tabular-nums text-muted-foreground">{d.prevRank}</td>
                          <td className="py-2 pr-2 text-right font-mono tabular-nums text-muted-foreground">—</td>
                          <td className="py-2 pr-2 text-right font-mono tabular-nums text-semantic-down">▼OUT</td>
                          <td className="py-2 pr-2 text-right font-mono tabular-nums text-muted-foreground">—</td>
                          <td className="py-2 pr-2 text-right font-mono tabular-nums text-muted-foreground">—</td>
                          <td className="py-2 pr-2 text-right hidden sm:table-cell text-muted-foreground">—</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
