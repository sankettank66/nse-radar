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
  if (!sectors || sectors.length === 0) return null;

  const sorted = [...sectors].sort(
    (a, b) => b.pChange - a.pChange
  );

  const maxAbsChange = Math.max(
    ...sorted.map((s) => Math.abs(s.pChange)),
    0.01
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sorted.map((sector) => {
        const variation = sector.current - sector.close;
        const isPositive = sector.pChange >= 0;
        const isSelected = selectedSector === sector.index;

        return (
          <Card
            key={sector.index}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected
                ? "ring-2 ring-primary"
                : ""
            }`}
            onClick={() => onSectorClick(sector.index)}
          >
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">
                  {sector.indexLongName}
                </span>
                <Badge
                  variant={isPositive ? "default" : "destructive"}
                  className="shrink-0"
                >
                  {formatPercent(sector.pChange)}
                </Badge>
              </div>
              <div className="text-2xl font-semibold">
                {formatPrice(sector.current)}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={getChangeColor(variation)}
                >
                  {isPositive ? "▲" : "▼"} {formatPrice(Math.abs(variation))}
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
                      (Math.abs(sector.pChange) / maxAbsChange) * 100,
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
