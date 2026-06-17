"use client";

import type { SectorStock } from "@/lib/types";
import {
  formatPercent,
  formatPrice,
  formatVolume,
  getChangeColor,
} from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
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
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{sectorName ? `${sectorName} Stocks` : "Sector Stocks"}</SheetTitle>
          <SheetDescription>
            Individual stock performance within this sector
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock) => (
                  <TableRow key={stock.symbol}>
                    <TableCell className="font-medium">
                      {stock.symbol}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(stock.lastPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          stock.pChange >= 0 ? "default" : "destructive"
                        }
                        className="text-xs"
                      >
                        {formatPercent(stock.pChange)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatVolume(stock.totalTradedVolume)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && stocks.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No stock data available for this sector.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
