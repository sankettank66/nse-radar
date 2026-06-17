"use client";

import type { OISpurtEntry } from "@/lib/types";
import { formatPercent, formatPrice, formatVolume, getChangeColor } from "@/lib/utils";
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

interface OISpurtsProps {
  data: OISpurtEntry[];
}

export function OISpurts({ data }: OISpurtsProps) {
  if (data.length === 0) return null;

  const sorted = [...data].sort(
    (a, b) => Math.abs(b.changeInOIPercent) - Math.abs(a.changeInOIPercent)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">OI Spurts</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">OI</TableHead>
              <TableHead className="text-right">OI Change</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">% Change</TableHead>
              <TableHead className="text-right">Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.slice(0, 15).map((entry) => (
              <TableRow key={entry.symbol}>
                <TableCell className="font-medium">
                  {entry.symbol}
                </TableCell>
                <TableCell className="text-right">
                  {formatVolume(entry.openInterest)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={
                      entry.changeInOIPercent >= 0
                        ? "default"
                        : "destructive"
                    }
                    className="text-xs"
                  >
                    {formatPercent(entry.changeInOIPercent)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatPrice(entry.lastPrice)}
                </TableCell>
                <TableCell className={`text-right ${getChangeColor(entry.percentChange)}`}>
                  {formatPercent(entry.percentChange)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatVolume(entry.totalTradedVolume)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
