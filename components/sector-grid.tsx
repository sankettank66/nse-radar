"use client";

import type { SectorIndex } from "@/lib/types";
import { formatPercent, formatPrice, getChangeColor } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  if (sectors.length === 0) return null;

  const sorted = [...sectors].sort(
    (a, b) => b.percentChange - a.percentChange
  );

  const maxAbsChange = Math.max(
    ...sorted.map((s) => Math.abs(s.percentChange)),
    0.01
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sorted.map((sector) => {
        const intensity = Math.abs(sector.percentChange) / maxAbsChange;
        const isPositive = sector.percentChange >= 0;
        const isSelected = selectedSector === sector.indexSymbol;

        return (
          <Card
            key={sector.indexSymbol}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected
                ? "ring-2 ring-primary"
                : ""
            }`}
            onClick={() => onSectorClick(sector.indexSymbol)}
          >
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">
                  {sector.indexName}
                </span>
                <Badge
                  variant={isPositive ? "default" : "destructive"}
                  className="shrink-0"
                >
                  {formatPercent(sector.percentChange)}
                </Badge>
              </div>
              <div className="text-2xl font-semibold">
                {formatPrice(sector.last)}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={getChangeColor(sector.variation)}
                >
                  {isPositive ? "▲" : "▼"} {formatPrice(Math.abs(sector.variation))}
                </span>
                <span className="text-muted-foreground">O: {formatPrice(sector.open)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isPositive
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (Math.abs(sector.percentChange) / Math.max(...sorted.map((s) => Math.abs(s.percentChange)))) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
