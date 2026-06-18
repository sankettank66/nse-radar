"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { OiContract, OISpurtEntry, SignalEntry } from "@/lib/types";
import { fetchOiContracts, fetchOISpurts } from "@/lib/api";
import { formatPercent, formatPrice, formatVolume } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSort } from "@/hooks/use-sort";

const STOCK_TYPES = new Set(["FUTSTK"]);

function computeSignals(
  contracts: Record<string, unknown[]> | null,
  spurtsMap: Map<string, OISpurtEntry>,
): SignalEntry[] {
  if (!contracts) return [];

  const results: SignalEntry[] = [];

  const bullishRaw = ((contracts["Rise-in-OI-Rise"] ?? []) as OiContract[]).filter(
    (c) => STOCK_TYPES.has(c.instrumentType),
  );
  const bearishRaw = ((contracts["Rise-in-OI-Slide"] ?? []) as OiContract[]).filter(
    (c) => STOCK_TYPES.has(c.instrumentType),
  );

  const allScores: number[] = [];

  function processContract(c: OiContract, direction: "bullish" | "bearish") {
    const score =
      Math.abs(c.changeInOI) * Math.abs(c.pChange) * Math.log10(c.volume + 1);
    if (score <= 0) return;
    const spurts = spurtsMap.get(c.symbol);
    const spurtsAvg = spurts?.avgInOI ?? null;
    const spurtsOIChg = spurts?.changeInOI ?? null;

    let confluence = 0;
    if (spurts) {
      confluence += 1;
      const sameDirection =
        direction === "bullish" ? spurts.avgInOI > 0 : spurts.avgInOI < 0;
      if (sameDirection) confluence += 1;
      if (Math.abs(spurts.avgInOI) > 5) confluence += 1;
    }

    results.push({
      symbol: c.symbol,
      direction,
      signalScore: score,
      changeInOI: c.changeInOI,
      pChange: c.pChange,
      volume: c.volume,
      ltp: c.ltp,
      underlyingValue: c.underlyingValue,
      prevClose: c.prevClose,
      spurtsAvgInOI: spurtsAvg,
      spurtsOIChg,
      confluence,
    });
    allScores.push(score);
  }

  for (const c of bullishRaw) processContract(c, "bullish");
  for (const c of bearishRaw) processContract(c, "bearish");

  results.sort((a, b) => b.signalScore - a.signalScore);
  return results;
}

function scoreColor(score: number, maxScore: number): string {
  if (maxScore === 0) return "bg-muted text-muted-foreground";
  const ratio = score / maxScore;
  if (ratio > 0.7) return "bg-semantic-up/15 text-semantic-up";
  if (ratio > 0.4) return "bg-semantic-up/10 text-semantic-up";
  return "bg-semantic-up/5 text-semantic-up/70";
}

export function Signals() {
  const [data, setData] = useState<Record<string, unknown[]> | null>(null);
  const [spurtsMap, setSpurtsMap] = useState<Map<string, OISpurtEntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [contractsRes, spurtsRes] = await Promise.all([
        fetchOiContracts(),
        fetchOISpurts(),
      ]);
      const raw = Array.isArray(contractsRes.data)
        ? contractsRes.data.reduce((acc, obj) => ({ ...acc, ...obj }), {})
        : contractsRes.data;
      setData(raw);

      const map = new Map<string, OISpurtEntry>();
      for (const entry of spurtsRes.data) {
        map.set(entry.symbol, entry);
      }
      setSpurtsMap(map);
    } catch {
      // non-critical
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  const signals = useMemo(() => computeSignals(data, spurtsMap), [data, spurtsMap]);
  const bullish = useMemo(
    () => signals.filter((s) => s.direction === "bullish").slice(0, 50),
    [signals],
  );
  const bearish = useMemo(
    () => signals.filter((s) => s.direction === "bearish").slice(0, 50),
    [signals],
  );

  const maxBullishScore = bullish.length > 0 ? bullish[0].signalScore : 0;
  const maxBearishScore = bearish.length > 0 ? bearish[0].signalScore : 0;

  if (loading)
    return (
      <div className="flex items-center justify-center py-32">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SignalCard
        title="Bullish Signals"
        description="OI buildup + price rise — long buildup"
        signals={bullish}
        maxScore={maxBullishScore}
        accent="semantic-up"
      />
      <SignalCard
        title="Bearish Signals"
        description="OI buildup + price fall — short buildup"
        signals={bearish}
        maxScore={maxBearishScore}
        accent="semantic-down"
      />
    </div>
  );
}

function ConfDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-[2px]">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "inline-block size-[6px] rounded-full",
            i <= level ? "bg-primary" : "bg-border",
          )}
        />
      ))}
    </span>
  );
}

function SignalCard({
  title,
  description,
  signals,
  maxScore,
  accent,
}: {
  title: string;
  description: string;
  signals: SignalEntry[];
  maxScore: number;
  accent: string;
}) {
  const { sortedData, sort, toggleSort } = useSort(signals, "signalScore");

  function SortIcon({ columnKey }: { columnKey: string }) {
    if (sort.key !== columnKey)
      return <span className="ml-1 text-muted-foreground/30">↕</span>;
    return (
      <span className="ml-1 text-foreground">
        {sort.direction === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  return (
    <Card className="rounded-xl border border-border shadow-none">
      <CardHeader className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[18px] font-semibold tracking-tight">
              {title}
            </CardTitle>
            <p className="text-[13px] text-muted-foreground mt-1">
              {description}
            </p>
          </div>
          <span className="text-[13px] text-muted-foreground tabular-nums font-mono">
            {signals.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        {sortedData.length === 0 ? (
          <p className="px-6 py-8 text-center text-[13px] text-muted-foreground">
            No signals found
          </p>
        ) : (
          <div className="overflow-x-auto px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-6" />
                  <TableHead
                    className="cursor-pointer select-none text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                    onClick={() => toggleSort("symbol")}
                  >
                    Symbol <SortIcon columnKey="symbol" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                    onClick={() => toggleSort("signalScore")}
                  >
                    Score <SortIcon columnKey="signalScore" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                    onClick={() => toggleSort("changeInOI")}
                  >
                    OI Chg <SortIcon columnKey="changeInOI" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell"
                    onClick={() => toggleSort("spurtsAvgInOI")}
                  >
                    Spurts% <SortIcon columnKey="spurtsAvgInOI" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                    onClick={() => toggleSort("pChange")}
                  >
                    Chg% <SortIcon columnKey="pChange" />
                  </TableHead>
                  <TableHead className="text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                    LTP
                  </TableHead>
                  <TableHead className="text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                    Prev
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell"
                    onClick={() => toggleSort("volume")}
                  >
                    Vol <SortIcon columnKey="volume" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((s, i) => (
                  <TableRow
                    key={`${s.symbol}-${i}`}
                    className="border-t border-border hover:bg-muted/50"
                  >
                    <TableCell className="pr-0">
                      <ConfDots level={s.confluence} />
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {s.symbol}
                      {s.spurtsAvgInOI !== null && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground font-mono">
                          ✓
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded text-[12px] font-mono font-semibold tabular-nums",
                          accent === "semantic-up"
                            ? scoreColor(s.signalScore, maxScore)
                            : scoreColor(s.signalScore, maxScore),
                        )}
                      >
                        {s.signalScore >= 1_000_000
                          ? `${(s.signalScore / 1_000_000).toFixed(1)}M`
                          : s.signalScore >= 1_000
                            ? `${(s.signalScore / 1_000).toFixed(1)}K`
                            : s.signalScore.toFixed(0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-mono text-sm tabular-nums ${
                          s.changeInOI >= 0
                            ? "text-semantic-up"
                            : "text-semantic-down"
                        }`}
                      >
                        {s.changeInOI >= 0 ? "+" : ""}
                        {formatVolume(Math.abs(s.changeInOI))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      <span
                        className={`font-mono text-sm tabular-nums ${
                          s.spurtsAvgInOI !== null && s.spurtsAvgInOI >= 0
                            ? "text-semantic-up"
                            : s.spurtsAvgInOI !== null && s.spurtsAvgInOI < 0
                              ? "text-semantic-down"
                              : "text-muted-foreground"
                        }`}
                      >
                        {s.spurtsAvgInOI !== null
                          ? formatPercent(s.spurtsAvgInOI)
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-mono text-sm tabular-nums ${
                          s.pChange >= 0
                            ? "text-semantic-up"
                            : "text-semantic-down"
                        }`}
                      >
                        {formatPercent(s.pChange)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden sm:table-cell">
                      {formatPrice(s.ltp)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden lg:table-cell">
                      {formatPrice(s.prevClose)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden md:table-cell">
                      {formatVolume(s.volume)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
