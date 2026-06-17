"use client";

import { useMemo } from "react";
import type { SectorStock, OISpurtEntry } from "@/lib/types";
import { formatPercent, formatPrice, formatVolume } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AnalysisItem {
  symbol: string;
  pChange: number;
  lastPrice: number;
  volume: number;
  oiChangePct: number;
  score: number;
}

interface FnoAnalysisProps {
  side: "CE" | "PE" | null;
  onClose: () => void;
  stocks: SectorStock[];
  oiSpurts: OISpurtEntry[];
}

export function FnoAnalysis({
  side,
  onClose,
  stocks,
  oiSpurts,
}: FnoAnalysisProps) {
  const results = useMemo(() => {
    const isCall = side === "CE";
    const items: AnalysisItem[] = [];

    if (stocks.length > 0) {
      for (const s of stocks) {
        const pChange = parseFloat(s.pChange);
        const volume = parseFloat(s.totalTradedVolume);
        if (isCall ? pChange <= 0 : pChange >= 0) continue;
        items.push({
          symbol: s.symbol,
          pChange,
          lastPrice: s.lastPrice,
          volume,
          oiChangePct: 0,
          score: Math.abs(pChange) * Math.log10(volume + 1),
        });
      }
    } else if (oiSpurts.length > 0) {
      for (const s of oiSpurts) {
        if (isCall ? s.avgInOI <= 0 : s.avgInOI >= 0) continue;
        items.push({
          symbol: s.symbol,
          pChange: 0,
          lastPrice: s.underlyingValue,
          volume: s.volume,
          oiChangePct: s.avgInOI,
          score: Math.abs(s.avgInOI) * Math.log10(s.volume + 1),
        });
      }
    }

    return items.sort((a, b) => b.score - a.score).slice(0, 10);
  }, [side, stocks, oiSpurts]);

  const title = side === "CE" ? "Call Option (CE)" : "Put Option (PE)";
  const description =
    side === "CE"
      ? "Top 10 stocks with strongest bullish momentum \u2014 potential CE buying opportunities"
      : "Top 10 stocks with strongest bearish momentum \u2014 potential PE buying opportunities";

  const hasStockData = stocks.length > 0;

  return (
    <Dialog open={!!side} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full sm:max-w-xl md:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="px-2 pt-2 pb-1">
          <DialogTitle className="text-[18px] font-semibold tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 pb-2">
          {results.length === 0 ? (
            <p className="text-center text-[13px] text-muted-foreground py-12">
              No data available.{" "}
              {!hasStockData &&
                "Select a sector first to see stock-level analysis."}
            </p>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground w-8">
                      #
                    </TableHead>
                    <TableHead className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Symbol
                    </TableHead>
                    <TableHead className="text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {hasStockData ? "Chg%" : "OI Chg%"}
                    </TableHead>
                    <TableHead className="text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                      {hasStockData ? "Price" : "Underlying"}
                    </TableHead>
                    <TableHead className="text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                      Volume
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((entry, i) => (
                    <TableRow
                      key={entry.symbol}
                      className="border-t border-border hover:bg-muted/50"
                    >
                      <TableCell className="text-muted-foreground text-sm tabular-nums">
                        {i + 1}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {entry.symbol}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-mono text-sm tabular-nums ${
                            (hasStockData ? entry.pChange : entry.oiChangePct) >=
                            0
                              ? "text-semantic-up"
                              : "text-semantic-down"
                          }`}
                        >
                          {formatPercent(
                            hasStockData ? entry.pChange : entry.oiChangePct
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden sm:table-cell">
                        {formatPrice(entry.lastPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden sm:table-cell">
                        {formatVolume(entry.volume)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <p className="mt-4 text-[12px] text-muted-foreground leading-relaxed">
            {side === "CE"
              ? "Scored by: price change × log(volume). Higher values = stronger bullish momentum with volume confirmation."
              : "Scored by: |price change| × log(volume). High volume on down moves = strong selling pressure."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
