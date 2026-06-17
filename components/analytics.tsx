"use client";

import { useMemo } from "react";
import type { SectorIndex, OISpurtEntry } from "@/lib/types";
import { formatPercent, formatVolume, getChangeColor } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="rounded-xl border border-border shadow-none">
        <CardHeader className="px-5 pt-5 pb-2">
          <CardTitle className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Market Breadth
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex items-center gap-5">
            <div>
              <div className="text-[32px] font-light tracking-tight text-semantic-up">
                {advancing}
              </div>
              <div className="text-[13px] text-muted-foreground">Advancing</div>
            </div>
            <div>
              <div className="text-[32px] font-light tracking-tight text-semantic-down">
                {declining}
              </div>
              <div className="text-[13px] text-muted-foreground">Declining</div>
            </div>
          </div>
          <div className="mt-3 text-[13px] text-muted-foreground">
            Avg <span className={getChangeColor(avgPerformance)}>
              {formatPercent(avgPerformance)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-border shadow-none">
        <CardHeader className="px-5 pt-5 pb-2">
          <CardTitle className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Top Gainers
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex flex-col gap-2">
            {topGainers.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No gainers</p>
            ) : (
              topGainers.map((s) => (
                <div key={s.index} className="flex justify-between items-center">
                  <span className="text-sm truncate max-w-[130px]">{s.indexLongName}</span>
                  <span className="font-mono text-sm tabular-nums text-semantic-up">
                    {formatPercent(s.pChange)}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-border shadow-none">
        <CardHeader className="px-5 pt-5 pb-2">
          <CardTitle className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Top Losers
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex flex-col gap-2">
            {topLosers.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No losers</p>
            ) : (
              topLosers.map((s) => (
                <div key={s.index} className="flex justify-between items-center">
                  <span className="text-sm truncate max-w-[130px]">{s.indexLongName}</span>
                  <span className="font-mono text-sm tabular-nums text-semantic-down">
                    {formatPercent(s.pChange)}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-border shadow-none">
        <CardHeader className="px-5 pt-5 pb-2">
          <CardTitle className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Top OI Spurts
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex flex-col gap-2">
            {topOiInterest.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No data</p>
            ) : (
              topOiInterest.map((entry) => (
                <div key={entry.symbol} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{entry.symbol}</span>
                  <span className={`font-mono text-sm tabular-nums ${getChangeColor(entry.avgInOI)}`}>
                    {formatPercent(entry.avgInOI)}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
