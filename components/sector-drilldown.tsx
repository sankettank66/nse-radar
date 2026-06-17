"use client";

import type { SectorStock } from "@/lib/types";
import {
  formatPercent,
  formatPrice,
  formatVolume,
} from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SectorDrilldownProps {
  sectorName: string | null;
  stocks: SectorStock[];
  loading: boolean;
  onClose: () => void;
}

export function SectorDrilldown({
  sectorName,
  stocks,
  loading,
  onClose,
}: SectorDrilldownProps) {
  return (
    <Sheet open={!!sectorName} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto border-l border-border">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-[18px] font-semibold tracking-tight">
            {sectorName ? `${sectorName}` : "Sector Stocks"}
          </SheetTitle>
          <SheetDescription className="text-[13px] text-muted-foreground">
            Individual stock performance within this sector
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-6 mt-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Symbol</TableHead>
                    <TableHead className="text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Price</TableHead>
                    <TableHead className="text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Chg%</TableHead>
                    <TableHead className="text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stocks?.map((stock) => {
                    const pChange = parseFloat(stock.pChange);
                    return (
                      <TableRow key={stock.symbol} className="border-t border-border hover:bg-muted/50">
                        <TableCell className="font-medium text-sm">
                          {stock.symbol}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums">
                          {formatPrice(stock.lastPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-mono text-sm tabular-nums ${
                              pChange >= 0 ? "text-semantic-up" : "text-semantic-down"
                            }`}
                          >
                            {formatPercent(pChange)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden sm:table-cell">
                          {formatVolume(parseFloat(stock.totalTradedVolume))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && (!stocks || stocks.length === 0) && (
            <p className="text-center text-[13px] text-muted-foreground py-12">
              No stock data available for this sector.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
