"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { OiContract, SnapshotDerivativeEntry } from "@/lib/types";
import {
  fetchOiContracts,
  fetchSnapshotDerivatives,
  extractSnapshotEntries,
} from "@/lib/api";
import {
  formatPercent,
  formatPrice,
  formatVolume,
  isMarketOpen,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const CATEGORIES = [
  {
    key: "Rise-in-OI-Rise",
    label: "Rise OI + Rise Price",
    desc: "Bullish buildup – price rises with rising open interest",
    short: "Bullish",
  },
  {
    key: "Rise-in-OI-Slide",
    label: "Rise OI + Slide Price",
    desc: "Bearish buildup – price falls with rising open interest",
    short: "Bearish",
  },
  {
    key: "Slide-in-OI-Rise",
    label: "Slide OI + Rise Price",
    desc: "Short covering – price rises as open interest declines",
    short: "Short Cover",
  },
  {
    key: "Slide-in-OI-Slide",
    label: "Slide OI + Slide Price",
    desc: "Long unwinding – price falls as open interest declines",
    short: "Long Unwind",
  },
];

const STOCK_TYPES = new Set(["FUTSTK", "OPTSTK"]);

function isStockContract(c: OiContract): boolean {
  return STOCK_TYPES.has(c.instrumentType);
}

function formatExpiry(date: string): string {
  const parts = date.split("-");
  if (parts.length === 3) {
    const months: Record<string, string> = {
      Jan: "Jan",
      Feb: "Feb",
      Mar: "Mar",
      Apr: "Apr",
      May: "May",
      Jun: "Jun",
      Jul: "Jul",
      Aug: "Aug",
      Sep: "Sep",
      Oct: "Oct",
      Nov: "Nov",
      Dec: "Dec",
    };
    return `${parts[0]} ${months[parts[1]] || parts[1]}`;
  }
  return date;
}

export function OiContracts() {
  const [data, setData] = useState<Record<string, OiContract[]> | null>(null);
  const [callsData, setCallsData] = useState<SnapshotDerivativeEntry[]>([]);
  const [putsData, setPutsData] = useState<SnapshotDerivativeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(CATEGORIES[0].key);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialSelectionRef = useRef(false);

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    try {
      const [oiRes, callsRes, putsRes] = await Promise.all([
        fetchOiContracts(),
        fetchSnapshotDerivatives("calls-stocks-vol"),
        fetchSnapshotDerivatives("puts-stocks-vol"),
      ]);
      const raw = Array.isArray(oiRes.data)
        ? oiRes.data.reduce((acc, obj) => ({ ...acc, ...obj }), {})
        : oiRes.data;
      setData(raw);
      setCallsData(extractSnapshotEntries(callsRes));
      setPutsData(extractSnapshotEntries(putsRes));
    } catch {
      // non-critical
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData(true);
    if (isMarketOpen()) {
      intervalRef.current = setInterval(() => loadData(false), 60_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  useEffect(() => {
    if (data && !initialSelectionRef.current) {
      const availableCats = CATEGORIES.filter((cat) =>
        (data[cat.key] ?? []).some(isStockContract),
      );
      console.log(
        "Available categories with stock contracts:",
        availableCats.map((c) => c.key),
        data,
      );
      if (availableCats.length > 0) {
        setActiveTab(availableCats[0].key);
      }
      initialSelectionRef.current = true;
    }
  }, [data]);

  if (loading)
    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <OiSnapshotSkeleton />
          <OiSnapshotSkeleton />
        </div>
        <OIContractsSkeleton />
      </>
    );

  const activeCat =
    CATEGORIES.find((c) => c.key === activeTab) ?? CATEGORIES[0];

  const contractCounts = Object.fromEntries(
    CATEGORIES.map((cat) => [
      cat.key,
      (data?.[cat.key] ?? []).filter(isStockContract).length,
    ]),
  );

  return (
    <>
      <Card className="rounded-xl border border-border shadow-none">
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[18px] font-semibold tracking-tight">
                OI Contracts Analysis
              </CardTitle>
              <p className="text-[13px] text-muted-foreground mt-1">
                Open Interest and price action breakdown across stock F&O
                contracts
              </p>
            </div>
            {refreshing && (
              <div className="size-4 animate-spin rounded-full border-2 border-border border-t-primary shrink-0" />
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 pb-4">
          {/* Desktop: pill tab buttons */}
          <div className="hidden sm:block px-6 mb-4">
            <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-[3px]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveTab(cat.key)}
                  className={cn(
                    "relative inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-all",
                    activeTab === cat.key
                      ? "bg-background text-foreground shadow-sm dark:bg-input/30"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {cat.label}
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {contractCounts[cat.key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: native dropdown */}
          <div className="sm:hidden px-6 mb-4">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.short} — {cat.label} ({contractCounts[cat.key]})
                </option>
              ))}
            </select>
          </div>

          {/* Category description */}
          <div className="px-6 mb-4">
            <p className="text-[13px] text-muted-foreground italic border-l-2 border-primary/30 pl-3">
              {activeCat.desc}
            </p>
          </div>

          {/* Table */}
          <ContractTable
            contracts={(data?.[activeTab] ?? []).filter(isStockContract)}
          />
        </CardContent>
      </Card>

      {/* Snapshot: most active Call / Put options by volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <SnapshotCard
          title="Active Call Options (CE)"
          data={callsData}
          accent="text-semantic-up"
        />
        <SnapshotCard
          title="Active Put Options (PE)"
          data={putsData}
          accent="text-semantic-down"
        />
      </div>
    </>
  );
}

function OiSnapshotSkeleton() {
  const widths = [
    ["w-20", "w-14", "w-16", "w-12", "w-16", "w-14", "w-14"],
    ["w-24", "w-12", "w-20", "w-14", "w-18", "w-12", "w-16"],
    ["w-16", "w-16", "w-14", "w-10", "w-20", "w-16", "w-12"],
    ["w-22", "w-14", "w-18", "w-12", "w-14", "w-18", "w-14"],
    ["w-18", "w-18", "w-12", "w-16", "w-16", "w-10", "w-18"],
    ["w-20", "w-10", "w-16", "w-14", "w-20", "w-14", "w-12"],
  ];
  return (
    <Card className="rounded-xl border border-border shadow-none">
      <CardHeader className="px-6 pt-6 pb-4">
        <Skeleton className="h-6 w-44" />
      </CardHeader>
      <CardContent className="px-6 pb-4">
        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border">
          <Skeleton className="h-4 w-11" />
          <Skeleton className="h-4 w-8 ml-auto hidden md:block" />
          <Skeleton className="h-4 w-12 ml-auto" />
          <Skeleton className="h-4 w-10 ml-auto" />
          <Skeleton className="h-4 w-10 ml-auto" />
          <Skeleton className="h-4 w-8 ml-auto" />
          <Skeleton className="h-4 w-8 ml-auto hidden sm:block" />
          <Skeleton className="h-4 w-12 ml-auto hidden lg:block" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
          >
            <Skeleton className={`h-4 ${widths[i][0]}`} />
            <Skeleton
              className={`h-4 ${widths[i][1]} ml-auto hidden md:block`}
            />
            <Skeleton className={`h-4 ${widths[i][2]} ml-auto`} />
            <Skeleton className={`h-4 ${widths[i][3]} ml-auto`} />
            <Skeleton className={`h-4 ${widths[i][4]} ml-auto`} />
            <Skeleton className={`h-4 ${widths[i][5]} ml-auto`} />
            <Skeleton
              className={`h-4 ${widths[i][6]} ml-auto hidden sm:block`}
            />
            <Skeleton className={`h-4 w-12 ml-auto hidden lg:block`} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function OIContractsSkeleton() {
  const widths = [
    [
      "w-20",
      "w-14",
      "w-8",
      "w-16",
      "w-12",
      "w-16",
      "w-14",
      "w-14",
      "w-12",
      "w-12",
    ],
    [
      "w-24",
      "w-12",
      "w-8",
      "w-20",
      "w-14",
      "w-18",
      "w-12",
      "w-16",
      "w-14",
      "w-10",
    ],
    [
      "w-16",
      "w-16",
      "w-8",
      "w-14",
      "w-10",
      "w-20",
      "w-16",
      "w-12",
      "w-10",
      "w-14",
    ],
    [
      "w-22",
      "w-14",
      "w-8",
      "w-18",
      "w-12",
      "w-14",
      "w-18",
      "w-14",
      "w-16",
      "w-12",
    ],
    [
      "w-18",
      "w-18",
      "w-8",
      "w-12",
      "w-16",
      "w-16",
      "w-10",
      "w-18",
      "w-12",
      "w-16",
    ],
    [
      "w-20",
      "w-10",
      "w-8",
      "w-16",
      "w-14",
      "w-20",
      "w-14",
      "w-12",
      "w-14",
      "w-18",
    ],
  ];
  const pillW = ["w-24", "w-28", "w-20", "w-26"];
  return (
    <Card className="rounded-xl border border-border shadow-none">
      <CardHeader className="px-6 pt-6 pb-4">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-72 mt-2" />
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div className="px-6 mb-4">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-[3px] w-fit">
            {pillW.map((w, i) => (
              <Skeleton key={i} className={`h-8 ${w} rounded-md`} />
            ))}
          </div>
        </div>
        <div className="px-6 mb-4">
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="px-6">
          <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border">
            <Skeleton className="h-4 w-11" />
            <Skeleton className="h-4 w-8 ml-auto hidden md:block" />
            <Skeleton className="h-4 w-7" />
            <Skeleton className="h-4 w-12 ml-auto" />
            <Skeleton className="h-4 w-10 ml-auto" />
            <Skeleton className="h-4 w-14 ml-auto hidden sm:block" />
            <Skeleton className="h-4 w-10 ml-auto" />
            <Skeleton className="h-4 w-8 ml-auto hidden sm:block" />
            <Skeleton className="h-4 w-12 ml-auto" />
            <Skeleton className="h-4 w-12 ml-auto hidden sm:block" />
            <Skeleton className="h-4 w-8 ml-auto hidden lg:block" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
            >
              <Skeleton className={`h-4 ${widths[i][0]}`} />
              <Skeleton
                className={`h-4 ${widths[i][1]} ml-auto hidden md:block`}
              />
              <Skeleton className={`h-4 ${widths[i][2]}`} />
              <Skeleton className={`h-4 ${widths[i][3]} ml-auto`} />
              <Skeleton className={`h-4 ${widths[i][4]} ml-auto`} />
              <Skeleton
                className={`h-4 ${widths[i][5]} ml-auto hidden sm:block`}
              />
              <Skeleton className={`h-4 ${widths[i][6]} ml-auto`} />
              <Skeleton
                className={`h-4 ${widths[i][7]} ml-auto hidden sm:block`}
              />
              <Skeleton className={`h-4 ${widths[i][8]} ml-auto`} />
              <Skeleton
                className={`h-4 ${widths[i][9]} ml-auto hidden sm:block`}
              />
              <Skeleton className={`h-4 w-12 ml-auto hidden lg:block`} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SnapshotCard({
  title,
  data,
  accent,
}: {
  title: string;
  data: SnapshotDerivativeEntry[];
  accent: string;
}) {
  const { sortedData, sort, toggleSort } = useSort(
    data,
    "numberOfContractsTraded",
  );

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
          <CardTitle className="text-[18px] font-semibold tracking-tight">
            {title}
          </CardTitle>
          <span className="text-[13px] text-muted-foreground tabular-nums font-mono">
            {data.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div className="overflow-x-auto px-6 scrollbar-hide">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                  onClick={() => toggleSort("underlying")}
                >
                  Symbol <SortIcon columnKey="underlying" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell"
                  onClick={() => toggleSort("expiryDate")}
                >
                  Exp <SortIcon columnKey="expiryDate" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                  onClick={() => toggleSort("strikePrice")}
                >
                  Strike <SortIcon columnKey="strikePrice" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                  onClick={() => toggleSort("lastPrice")}
                >
                  LTP <SortIcon columnKey="lastPrice" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                  onClick={() => toggleSort("pChange")}
                >
                  Chg% <SortIcon columnKey="pChange" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                  onClick={() => toggleSort("numberOfContractsTraded")}
                >
                  Vol <SortIcon columnKey="numberOfContractsTraded" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell"
                  onClick={() => toggleSort("openInterest")}
                >
                  OI <SortIcon columnKey="openInterest" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell"
                  onClick={() => toggleSort("premiumTurnover")}
                >
                  Premium <SortIcon columnKey="premiumTurnover" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((entry, i) => (
                  <TableRow
                    key={`${entry.identifier}-${i}`}
                    className="border-t border-border hover:bg-muted/50"
                  >
                    <TableCell className="font-medium text-sm">
                      {entry.underlying}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden md:table-cell">
                      {formatExpiry(entry.expiryDate)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground">
                      {entry.strikePrice}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {formatPrice(entry.lastPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-mono text-sm tabular-nums ${
                          entry.pChange >= 0
                            ? "text-semantic-up"
                            : "text-semantic-down"
                        }`}
                      >
                        {formatPercent(entry.pChange)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {formatVolume(entry.numberOfContractsTraded)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden sm:table-cell">
                      {formatVolume(entry.openInterest)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden lg:table-cell">
                      {formatPrice(entry.premiumTurnover)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ContractTable({ contracts }: { contracts: OiContract[] }) {
  const { sortedData, sort, toggleSort } = useSort(contracts, "changeInOI");

  const totalOI = contracts.reduce((sum, c) => sum + c.latestOI, 0);
  const avgChg = contracts.length
    ? contracts.reduce((sum, c) => sum + c.pChange, 0) / contracts.length
    : 0;

  function SortIcon({ columnKey }: { columnKey: string }) {
    if (sort.key !== columnKey)
      return <span className="ml-1 text-muted-foreground/30">↕</span>;
    return (
      <span className="ml-1 text-foreground">
        {sort.direction === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  const optionLabel = (c: OiContract) => {
    if (c.instrumentType === "OPTSTK") {
      return c.optionType === "Call"
        ? "CE"
        : c.optionType === "Put"
          ? "PE"
          : c.optionType;
    }
    return "";
  };

  return (
    <div>
      {/* Stats bar */}
      <div className="flex items-center gap-4 px-6 mb-3 text-[12px] text-muted-foreground">
        <span>
          Contracts:{" "}
          <strong className="text-foreground">{contracts.length}</strong>
        </span>
        <span className="hidden sm:inline">
          Total OI:{" "}
          <strong className="text-foreground font-mono">
            {formatVolume(totalOI)}
          </strong>
        </span>
        <span className="hidden sm:inline">
          Avg Chg:{" "}
          <strong
            className={`font-mono ${avgChg >= 0 ? "text-semantic-up" : "text-semantic-down"}`}
          >
            {formatPercent(avgChg)}
          </strong>
        </span>
      </div>

      <div className="overflow-x-auto px-6 scrollbar-hide">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                onClick={() => toggleSort("symbol")}
              >
                Symbol <SortIcon columnKey="symbol" />
              </TableHead>
              <TableHead className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                Exp
              </TableHead>
              <TableHead className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                Type
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                onClick={() => toggleSort("strikePrice")}
              >
                Strike <SortIcon columnKey="strikePrice" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                onClick={() => toggleSort("ltp")}
              >
                LTP <SortIcon columnKey="ltp" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell"
                onClick={() => toggleSort("underlyingValue")}
              >
                Underlying <SortIcon columnKey="underlyingValue" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                onClick={() => toggleSort("pChange")}
              >
                Chg% <SortIcon columnKey="pChange" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell"
                onClick={() => toggleSort("latestOI")}
              >
                OI <SortIcon columnKey="latestOI" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                onClick={() => toggleSort("changeInOI")}
              >
                OI Chg <SortIcon columnKey="changeInOI" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell"
                onClick={() => toggleSort("pChangeInOI")}
              >
                OI Chg% <SortIcon columnKey="pChangeInOI" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell"
                onClick={() => toggleSort("volume")}
              >
                Vol <SortIcon columnKey="volume" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No contracts found for this category
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((c) => {
                const instLabel = c.instrumentType === "FUTSTK" ? "Fut" : "Opt";
                const chgPctColor =
                  c.pChange >= 0 ? "text-semantic-up" : "text-semantic-down";
                const oiChgColor =
                  c.changeInOI >= 0 ? "text-semantic-up" : "text-semantic-down";
                return (
                  <TableRow
                    key={c.identifier}
                    className="border-t border-border hover:bg-muted/50"
                  >
                    <TableCell className="font-medium text-sm">
                      {c.symbol}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums hidden md:table-cell">
                      {formatExpiry(c.expiryDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {instLabel}
                      {optionLabel(c) && (
                        <span
                          className={`ml-1 font-mono text-[11px] ${
                            c.optionType === "Call"
                              ? "text-semantic-up"
                              : "text-semantic-down"
                          }`}
                        >
                          {optionLabel(c)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground">
                      {c.instrumentType === "OPTSTK"
                        ? formatPrice(c.strikePrice)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {formatPrice(c.ltp)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden sm:table-cell">
                      {formatPrice(c.underlyingValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-mono text-sm tabular-nums ${chgPctColor}`}
                      >
                        {formatPercent(c.pChange)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden sm:table-cell">
                      {formatVolume(c.latestOI)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-mono text-sm tabular-nums ${oiChgColor}`}
                      >
                        {c.changeInOI >= 0 ? "+" : ""}
                        {formatVolume(Math.abs(c.changeInOI))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      <span
                        className={`font-mono text-sm tabular-nums ${oiChgColor}`}
                      >
                        {formatPercent(c.pChangeInOI)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden lg:table-cell">
                      {formatVolume(c.volume)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
