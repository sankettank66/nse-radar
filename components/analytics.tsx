"use client";

import { useMemo } from "react";
import type { SectorIndex, OISpurtEntry } from "@/lib/types";
import { formatPercent, getChangeColor } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnalyticsProps {
  sectors: SectorIndex[];
  oiSpurts: OISpurtEntry[];
}

export function Analytics({ sectors, oiSpurts }: AnalyticsProps) {
  const topGainers = useMemo(() => {
    return [...sectors]
      .filter((s) => s.pChange > 0)
      .sort((a, b) => b.pChange - a.pChange)
      .slice(0, 5);
  }, [sectors]);

  const topLosers = useMemo(() => {
    return [...sectors]
      .filter((s) => s.pChange < 0)
      .sort((a, b) => a.pChange - b.pChange)
      .slice(0, 5);
  }, [sectors]);

  const avgPerformance = useMemo(() => {
    if (sectors.length === 0) return 0;
    return sectors.reduce((sum, s) => sum + s.pChange, 0) / sectors.length;
  }, [sectors]);

  const advancing = useMemo(() => sectors.filter((s) => s.pChange > 0).length, [sectors]);
  const declining = useMemo(() => sectors.filter((s) => s.pChange < 0).length, [sectors]);

  const topOiInterest = useMemo(() => {
    return [...oiSpurts]
      .sort((a, b) => Math.abs(b.avgInOI) - Math.abs(a.avgInOI))
      .slice(0, 5);
  }, [oiSpurts]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-medium">
            Market Breadth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{advancing}</div>
              <div className="text-xs text-muted-foreground">Advancing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{declining}</div>
              <div className="text-xs text-muted-foreground">Declining</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Avg: <span className={getChangeColor(avgPerformance)}>
              {formatPercent(avgPerformance)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-medium">
            Top Gainers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topGainers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No gainers</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {topGainers.map((s) => (
                <div key={s.index} className="flex justify-between text-xs">
                  <span className="truncate max-w-[140px]">{s.indexLongName}</span>
                  <Badge variant="default" className="text-xs shrink-0">
                    {formatPercent(s.pChange)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-medium">
            Top Losers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topLosers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No losers</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {topLosers.map((s) => (
                <div key={s.index} className="flex justify-between text-xs">
                  <span className="truncate max-w-[140px]">{s.indexLongName}</span>
                  <Badge variant="destructive" className="text-xs shrink-0">
                    {formatPercent(s.pChange)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-medium">
            Top OI Spurts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topOiInterest.length === 0 ? (
            <p className="text-xs text-muted-foreground">No data</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {topOiInterest.map((entry) => (
                <div key={entry.symbol} className="flex justify-between text-xs">
                  <span className="font-medium">{entry.symbol}</span>
                  <span className={getChangeColor(entry.avgInOI)}>
                    {formatPercent(entry.avgInOI)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
