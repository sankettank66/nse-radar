"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { OiContract, OISpurtEntry, SignalEntry, OptionsActivity, SnapshotDerivativeEntry } from "@/lib/types";
import { fetchOiContracts, fetchOISpurts, fetchSnapshotDerivatives, extractSnapshotEntries } from "@/lib/api";
import { formatPercent, formatPrice, formatVolume, isMarketOpen } from "@/lib/utils";
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
import { Skeleton } from "@/components/ui/skeleton";

const STOCK_TYPES = new Set(["FUTSTK"]);

function computeOptionsMultiplier(
  direction: "bullish" | "bearish",
  activity: OptionsActivity | undefined,
): { multiplier: number; pcr: number | null; alignment: "confirming" | "neutral" | "contradicting" | null } {
  if (!activity || (activity.callVolume === 0 && activity.putVolume === 0)) {
    return { multiplier: 1, pcr: null, alignment: null };
  }

  const pcr = activity.putVolume / (activity.callVolume || 1);
  let multiplier = 1;
  let alignment: "confirming" | "neutral" | "contradicting" | null = "neutral";

  if (direction === "bullish") {
    if (pcr < 0.7) { alignment = "confirming"; multiplier = 1.5; }
    else if (pcr < 0.9) { alignment = "confirming"; multiplier = 1.25; }
    else if (pcr <= 1.1) { alignment = "neutral"; multiplier = 1; }
    else if (pcr <= 1.5) { alignment = "contradicting"; multiplier = 0.75; }
    else { alignment = "contradicting"; multiplier = 0.5; }
  } else {
    if (pcr > 1.5) { alignment = "confirming"; multiplier = 1.5; }
    else if (pcr > 1.1) { alignment = "confirming"; multiplier = 1.25; }
    else if (pcr >= 0.9) { alignment = "neutral"; multiplier = 1; }
    else if (pcr >= 0.7) { alignment = "contradicting"; multiplier = 0.75; }
    else { alignment = "contradicting"; multiplier = 0.5; }
  }

  return { multiplier, pcr, alignment };
}

function buildOptionsActivityMap(
  calls: SnapshotDerivativeEntry[],
  puts: SnapshotDerivativeEntry[],
): Map<string, OptionsActivity> {
  const map = new Map<string, OptionsActivity>();

  for (const c of calls) {
    const existing = map.get(c.underlying) ?? {
      callVolume: 0, putVolume: 0,
      callOIChg: 0, putOIChg: 0,
      callPremTurnover: 0, putPremTurnover: 0,
      callContracts: 0, putContracts: 0,
    };
    existing.callVolume += c.numberOfContractsTraded;
    existing.callPremTurnover += c.premiumTurnover;
    existing.callContracts += 1;
    map.set(c.underlying, existing);
  }

  for (const p of puts) {
    const existing = map.get(p.underlying) ?? {
      callVolume: 0, putVolume: 0,
      callOIChg: 0, putOIChg: 0,
      callPremTurnover: 0, putPremTurnover: 0,
      callContracts: 0, putContracts: 0,
    };
    existing.putVolume += p.numberOfContractsTraded;
    existing.putPremTurnover += p.premiumTurnover;
    existing.putContracts += 1;
    map.set(p.underlying, existing);
  }

  return map;
}

function computeSignals(
  contracts: Record<string, unknown[]> | null,
  spurtsMap: Map<string, OISpurtEntry>,
  optionsActivity: Map<string, OptionsActivity>,
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
    const opts = optionsActivity.get(c.symbol);
    const { multiplier, pcr, alignment } = computeOptionsMultiplier(direction, opts);
    const score =
      Math.abs(c.changeInOI) * Math.abs(c.pChange) * Math.log10(c.volume + 1) * multiplier;
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
      optionsPCR: pcr,
      optionsAlignment: alignment,
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
  const [optionsActivity, setOptionsActivity] = useState<Map<string, OptionsActivity>>(new Map());
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [contractsRes, spurtsRes, callsData, putsData] = await Promise.all([
        fetchOiContracts(),
        fetchOISpurts(),
        fetchSnapshotDerivatives("calls-stocks-vol"),
        fetchSnapshotDerivatives("puts-stocks-vol"),
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

      setOptionsActivity(buildOptionsActivityMap(extractSnapshotEntries(callsData), extractSnapshotEntries(putsData)));
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

  const signals = useMemo(() => computeSignals(data, spurtsMap, optionsActivity), [data, spurtsMap, optionsActivity]);
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SignalsSkeleton />
        <SignalsSkeleton />
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

function SignalsSkeleton() {
  const widths = [
    ["w-20", "w-14", "w-16", "w-12", "w-16", "w-14", "w-14", "w-16"],
    ["w-24", "w-12", "w-20", "w-14", "w-18", "w-12", "w-16", "w-14"],
    ["w-16", "w-16", "w-14", "w-10", "w-20", "w-16", "w-12", "w-18"],
    ["w-22", "w-14", "w-18", "w-12", "w-14", "w-18", "w-14", "w-12"],
    ["w-18", "w-18", "w-12", "w-16", "w-16", "w-10", "w-18", "w-16"],
    ["w-20", "w-10", "w-16", "w-14", "w-20", "w-14", "w-12", "w-14"],
    ["w-14", "w-16", "w-20", "w-10", "w-16", "w-20", "w-16", "w-12"],
    ["w-24", "w-12", "w-14", "w-18", "w-12", "w-12", "w-20", "w-16"],
  ];
  return (
    <Card className="rounded-xl border border-border shadow-none">
      <CardHeader className="px-6 pt-6 pb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-56 mt-2" />
      </CardHeader>
      <CardContent className="px-6 pb-4">
        {/* header row */}
        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border">
          <div className="flex gap-[2px] w-[18px] shrink-0">
            <Skeleton className="h-[6px] w-[6px] rounded-full" />
            <Skeleton className="h-[6px] w-[6px] rounded-full" />
            <Skeleton className="h-[6px] w-[6px] rounded-full" />
          </div>
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-10 ml-auto" />
          <Skeleton className="h-4 w-12 ml-auto" />
          <Skeleton className="h-4 w-12 ml-auto hidden sm:block" />
          <Skeleton className="h-4 w-10 ml-auto" />
          <Skeleton className="h-4 w-12 ml-auto hidden sm:block" />
          <Skeleton className="h-4 w-12 ml-auto hidden lg:block" />
          <Skeleton className="h-4 w-10 ml-auto hidden md:block" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
            <div className="flex gap-[2px] w-[18px] shrink-0">
              {[0, 1, 2].map((d) => (
                <Skeleton key={d} className={`${["h-[6px] w-[6px]", "h-[4px] w-[4px]", "h-[8px] w-[8px]"][(i + d) % 3]} rounded-full`} />
              ))}
            </div>
            <Skeleton className={`h-4 ${widths[i][0]}`} />
            <Skeleton className={`h-5 ${widths[i][1]} ml-auto`} />
            <Skeleton className={`h-4 ${widths[i][2]} ml-auto`} />
            <Skeleton className={`h-4 ${widths[i][3]} ml-auto hidden sm:block`} />
            <Skeleton className={`h-4 ${widths[i][4]} ml-auto`} />
            <Skeleton className={`h-4 ${widths[i][5]} ml-auto hidden sm:block`} />
            <Skeleton className={`h-4 ${widths[i][6]} ml-auto hidden lg:block`} />
            <Skeleton className={`h-4 ${widths[i][7]} ml-auto hidden md:block`} />
          </div>
        ))}
      </CardContent>
    </Card>
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
          <div className="overflow-x-auto px-6 scrollbar-hide">
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
                  <TableHead
                    className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell"
                    onClick={() => toggleSort("optionsPCR")}
                  >
                    PCR <SortIcon columnKey="optionsPCR" />
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
                    <TableCell className="text-right hidden sm:table-cell">
                      {s.optionsPCR !== null ? (
                        <span
                          className={`font-mono text-sm tabular-nums ${
                            s.optionsAlignment === "confirming"
                              ? "text-semantic-up"
                              : s.optionsAlignment === "contradicting"
                                ? "text-semantic-down"
                                : "text-muted-foreground"
                          }`}
                        >
                          {s.optionsPCR.toFixed(2)}
                          <span className="ml-0.5 text-[10px]">
                            {s.optionsPCR < 1 ? "C" : "P"}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
