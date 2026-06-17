"use client";

import type { OISpurtEntry } from "@/lib/types";
import { formatPercent, formatVolume } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    if (sort.key !== columnKey) return <span className="ml-1 text-muted-foreground/40">↕</span>;
    return <span className="ml-1">{sort.direction === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">OI Spurts ({data.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("symbol")}
                >
                  Symbol <SortIcon columnKey="symbol" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => toggleSort("latestOI")}
                >
                  OI <SortIcon columnKey="latestOI" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => toggleSort("changeInOI")}
                >
                  OI Change <SortIcon columnKey="changeInOI" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => toggleSort("avgInOI")}
                >
                  OI Change % <SortIcon columnKey="avgInOI" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => toggleSort("volume")}
                >
                  Volume <SortIcon columnKey="volume" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((entry) => (
                <TableRow key={entry.symbol}>
                  <TableCell className="font-medium">
                    {entry.symbol}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatVolume(entry.latestOI)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {entry.changeInOI >= 0 ? "+" : ""}
                    {formatVolume(Math.abs(entry.changeInOI))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={entry.avgInOI >= 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {formatPercent(entry.avgInOI)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
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
