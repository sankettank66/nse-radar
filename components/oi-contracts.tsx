"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { OiContract } from "@/lib/types";
import { fetchOiContracts } from "@/lib/api";
import { formatPercent, formatPrice, formatVolume } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSort } from "@/hooks/use-sort";

const CATEGORIES = [
  { key: "Rise-in-OI-Rise", label: "Rise OI + Rise Price", desc: "Bullish buildup" },
  { key: "Rise-in-OI-Slide", label: "Rise OI + Slide Price", desc: "Bearish buildup" },
  { key: "Slide-in-OI-Rise", label: "Slide OI + Rise Price", desc: "Short covering" },
  { key: "Slide-in-OI-Slide", label: "Slide OI + Slide Price", desc: "Long unwinding" },
];

const STOCK_TYPES = new Set(["FUTSTK", "OPTSTK"]);

function isStockContract(c: OiContract): boolean {
  return STOCK_TYPES.has(c.instrumentType);
}

function formatExpiry(date: string): string {
  const parts = date.split("-");
  if (parts.length === 3) {
    const months: Record<string, string> = {
      Jan: "Jan", Feb: "Feb", Mar: "Mar", Apr: "Apr",
      May: "May", Jun: "Jun", Jul: "Jul", Aug: "Aug",
      Sep: "Sep", Oct: "Oct", Nov: "Nov", Dec: "Dec",
    };
    return `${parts[0]} ${months[parts[1]] || parts[1]}`;
  }
  return date;
}

export function OiContracts() {
  const [data, setData] = useState<Record<string, OiContract[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetchOiContracts();
      setData(res.data);
    } catch {
      // non-critical
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData(true);
    intervalRef.current = setInterval(() => loadData(false), 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  if (loading) return null;

  const activeCategories = CATEGORIES.filter(
    (cat) => data?.[cat.key] && data[cat.key].some(isStockContract)
  );

  if (activeCategories.length === 0) return null;

  return (
    <Card className="rounded-xl border border-border shadow-none">
      <CardHeader className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[18px] font-semibold tracking-tight">
            OI Contracts Analysis
          </CardTitle>
          {refreshing && (
            <div className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <Tabs defaultValue={activeCategories[0].key}>
          <div className="px-6 mb-3 overflow-x-auto">
            <TabsList className="gap-0.5">
              {activeCategories.map((cat) => (
                <TabsTrigger
                  key={cat.key}
                  value={cat.key}
                  className="text-[12px] whitespace-nowrap px-3"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {activeCategories.map((cat) => {
            const contracts = (data?.[cat.key] ?? []).filter(isStockContract);
            return (
              <TabsContent key={cat.key} value={cat.key}>
                <ContractTable contracts={contracts} />
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ContractTable({ contracts }: { contracts: OiContract[] }) {
  const { sortedData, sort, toggleSort } = useSort(contracts, "changeInOI");

  function SortIcon({ columnKey }: { columnKey: string }) {
    if (sort.key !== columnKey) return <span className="ml-1 text-muted-foreground/30">↕</span>;
    return <span className="ml-1 text-foreground">{sort.direction === "asc" ? "↑" : "↓"}</span>;
  }

  const optionLabel = (c: OiContract) => {
    if (c.instrumentType === "OPTSTK") {
      return c.optionType === "Call" ? "CE" : c.optionType === "Put" ? "PE" : c.optionType;
    }
    return "";
  };

  return (
    <div className="overflow-x-auto px-6">
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
              onClick={() => toggleSort("ltp")}
            >
              LTP <SortIcon columnKey="ltp" />
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
          {sortedData.map((c) => {
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
                <TableCell className="font-medium text-sm">{c.symbol}</TableCell>
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
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatPrice(c.ltp)}
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
                  <span className={`font-mono text-sm tabular-nums ${oiChgColor}`}>
                    {c.changeInOI >= 0 ? "+" : ""}
                    {formatVolume(Math.abs(c.changeInOI))}
                  </span>
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  <span className={`font-mono text-sm tabular-nums ${oiChgColor}`}>
                    {formatPercent(c.pChangeInOI)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden lg:table-cell">
                  {formatVolume(c.volume)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
