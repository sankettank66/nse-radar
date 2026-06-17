"use client";

import type { SectorIndex } from "@/lib/types";
import { formatPercent, formatPrice, getChangeColor } from "@/lib/utils";
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

interface SectorGridProps {
  sectors: SectorIndex[];
  onSectorClick: (sector: string) => void;
  selectedSector: string | null;
}

export function SectorGrid({
  sectors,
  onSectorClick,
  selectedSector,
}: SectorGridProps) {
  if (!sectors || sectors.length === 0) return null;

  const { sortedData, sort, toggleSort } = useSort(sectors);

  function SortIcon({ columnKey }: { columnKey: string }) {
    if (sort.key !== columnKey) return <span className="ml-1 text-muted-foreground/30">↕</span>;
    return <span className="ml-1 text-foreground">{sort.direction === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer select-none text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
              onClick={() => toggleSort("indexLongName")}
            >
              Sector <SortIcon columnKey="indexLongName" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
              onClick={() => toggleSort("current")}
            >
              Price <SortIcon columnKey="current" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
              onClick={() => toggleSort("pChange")}
            >
              Chg% <SortIcon columnKey="pChange" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
              onClick={() => toggleSort("open")}
            >
              Open <SortIcon columnKey="open" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell"
              onClick={() => toggleSort("high")}
            >
              High <SortIcon columnKey="high" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right text-[13px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell"
              onClick={() => toggleSort("low")}
            >
              Low <SortIcon columnKey="low" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((sector) => {
            const variation = sector.current - sector.close;
            const isPositive = sector.pChange >= 0;
            const isSelected = selectedSector === sector.index;

            return (
              <TableRow
                key={sector.index}
                className={`cursor-pointer border-t border-border ${
                  isSelected
                    ? "bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onSectorClick(sector.index)}
              >
                <TableCell className="font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <span>{sector.indexLongName}</span>
                    <span className={getChangeColor(variation)}>
                      {variation >= 0 ? "↑" : "↓"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatPrice(sector.current)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`font-mono text-sm tabular-nums ${
                      isPositive ? "text-semantic-up" : "text-semantic-down"
                    }`}
                  >
                    {formatPercent(sector.pChange)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground">
                  {formatPrice(sector.open)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden md:table-cell">
                  {formatPrice(sector.high)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden md:table-cell">
                  {formatPrice(sector.low)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
