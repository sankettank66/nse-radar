"use client";

import type { OISpurtEntry } from "@/lib/types";
import { formatPercent, formatVolume, getChangeColor } from "@/lib/utils";
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

interface OISpurtsProps {
  data: OISpurtEntry[];
}

export function OISpurts({ data }: OISpurtsProps) {
  if (!data || data.length === 0) return null;

  const { sortedData, sort, toggleSort } = useSort(data);

  function SortIcon({ columnKey }: { columnKey: string }) {
    if (sort.key !== columnKey) return <span className="ml-1 text-muted-foreground/30">↕</span>;
    return <span className="ml-1 text-foreground">{sort.direction === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <Card className="rounded-xl border border-border shadow-none">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-[18px] font-semibold tracking-tight">
          OI Spurts
          <span className="text-muted-foreground font-normal text-sm ml-2">
            {data.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                  onClick={() => toggleSort("symbol")}
                >
                  Symbol <SortIcon columnKey="symbol" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                  onClick={() => toggleSort("latestOI")}
                >
                  OI <SortIcon columnKey="latestOI" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                  onClick={() => toggleSort("changeInOI")}
                >
                  Chg <SortIcon columnKey="changeInOI" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
                  onClick={() => toggleSort("avgInOI")}
                >
                  Chg% <SortIcon columnKey="avgInOI" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell"
                  onClick={() => toggleSort("volume")}
                >
                  Volume <SortIcon columnKey="volume" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((entry) => (
                <TableRow key={entry.symbol} className="border-t border-border hover:bg-muted/50">
                  <TableCell className="font-medium text-sm">
                    {entry.symbol}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {formatVolume(entry.latestOI)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    <span className={getChangeColor(entry.changeInOI)}>
                      {entry.changeInOI >= 0 ? "+" : ""}
                      {formatVolume(Math.abs(entry.changeInOI))}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    <span className={getChangeColor(entry.avgInOI)}>
                      {formatPercent(entry.avgInOI)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden sm:table-cell">
                    {formatVolume(entry.volume)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
