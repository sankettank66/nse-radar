"use client";

import { useMemo } from "react";
import type { SectorIndex, SectorStock } from "@/lib/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PerformanceChartsProps {
  sectors: SectorIndex[];
  stocks: SectorStock[];
  selectedSector: string | null;
}

export function PerformanceCharts({
  sectors,
  stocks,
  selectedSector,
}: PerformanceChartsProps) {
  const sectorChartData = useMemo(() => {
    const sorted = [...sectors]
      .sort((a, b) => b.pChange - a.pChange)
      .slice(0, 15);
    return sorted.map((s) => ({
      name: s.indexLongName.length > 18 ? s.indexLongName.slice(0, 18) + "..." : s.indexLongName,
      change: Number(s.pChange.toFixed(2)),
      up: s.pChange >= 0,
    }));
  }, [sectors]);

  const stockChartData = useMemo(() => {
    if (!stocks || stocks.length === 0) return [];
    return stocks.map((s) => {
      const pChange = parseFloat(s.pChange);
      return {
        name: s.symbol.length > 8 ? s.symbol.slice(0, 8) : s.symbol,
        change: Number(pChange.toFixed(2)),
        up: pChange >= 0,
      };
    });
  }, [stocks]);

  const chartConfig = {
    change: {
      label: "% Change",
      color: "var(--color-primary)",
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="rounded-xl border border-border shadow-none">
        <CardHeader className="px-6 pt-6 pb-2">
          <CardTitle className="text-[18px] font-semibold tracking-tight">
            Sector Performance
            <span className="text-muted-foreground font-normal text-sm ml-2">Top 15</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <ChartContainer config={chartConfig} className="aspect-auto h-[320px]">
            <BarChart data={sectorChartData} layout="vertical" margin={{ left: 110, right: 16, top: 8, bottom: 8 }}>
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fontFamily: "var(--font-mono)", fill: "currentColor" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={110}
                tick={{ fontSize: 12, fill: "currentColor" }}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                cursor={false}
              />
              <Bar dataKey="change" radius={[0, 4, 4, 0]}>
                {sectorChartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.up ? "var(--color-semantic-up)" : "var(--color-semantic-down)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {selectedSector && stockChartData.length > 0 && (
        <Card className="rounded-xl border border-border shadow-none">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="text-[18px] font-semibold tracking-tight">
              Stock Performance
              <span className="text-muted-foreground font-normal text-sm ml-2">{stockChartData.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ChartContainer config={chartConfig} className="aspect-auto h-[320px]">
              <BarChart
                data={stockChartData}
                layout="vertical"
                margin={{ left: 80, right: 16, top: 8, bottom: 8 }}
              >
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fontFamily: "var(--font-mono)", fill: "currentColor" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={false}
                />
                <Bar dataKey="change" radius={[0, 4, 4, 0]}>
                  {stockChartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.up ? "var(--color-semantic-up)" : "var(--color-semantic-down)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
