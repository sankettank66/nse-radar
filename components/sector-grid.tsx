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
    if (sort.key !== columnKey) return <span className="ml-1 text-muted-foreground/40">↕</span>;
    return <span className="ml-1">{sort.direction === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort("indexLongName")}
            >
              Sector <SortIcon columnKey="indexLongName" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => toggleSort("current")}
            >
              Price <SortIcon columnKey="current" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => toggleSort("pChange")}
            >
              % Change <SortIcon columnKey="pChange" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => toggleSort("open")}
            >
              Open <SortIcon columnKey="open" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => toggleSort("high")}
            >
              High <SortIcon columnKey="high" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
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
                className={`cursor-pointer ${isSelected ? "bg-muted/50" : "hover:bg-muted/30"}`}
                onClick={() => onSectorClick(sector.index)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{sector.indexLongName}</span>
                    {isSelected && (
                      <Badge variant="outline" className="text-xs">selected</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPrice(sector.current)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={isPositive ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {formatPercent(sector.pChange)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatPrice(sector.open)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatPrice(sector.high)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
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
