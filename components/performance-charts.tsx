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
      name: s.indexLongName.length > 15 ? s.indexLongName.slice(0, 15) + "..." : s.indexLongName,
      change: Number(s.pChange.toFixed(2)),
      fill: s.pChange >= 0 ? "var(--color-chart-1)" : "var(--color-chart-3)",
    }));
  }, [sectors]);

  const stockChartConfig = {
    change: {
      label: "% Change",
      color: "var(--color-chart-1)",
    },
  };

  const sectorChartConfig = {
    change: {
      label: "% Change",
      color: "var(--color-chart-1)",
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sector Performance (Top 15)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={sectorChartConfig} className="aspect-auto h-[300px]">
            <BarChart data={sectorChartData} layout="vertical" margin={{ left: 100, right: 20 }}>
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                cursor={false}
              />
              <Bar dataKey="change" radius={[0, 4, 4, 0]}>
                {sectorChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {selectedSector && stocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={stockChartConfig} className="aspect-auto h-[300px]">
              <BarChart
                data={stocks.map((s) => ({
                  name:
                    s.symbol.length > 8
                      ? s.symbol.slice(0, 8)
                      : s.symbol,
                  change: Number(s.pChange.toFixed(2)),
                  fill:
                    s.pChange >= 0
                      ? "var(--color-chart-1)"
                      : "var(--color-chart-3)",
                }))}
                layout="vertical"
                margin={{ left: 80, right: 20 }}
              >
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={false}
                />
                <Bar dataKey="change" radius={[0, 4, 4, 0]}>
                  {stocks.map((_, index) => (
                    <Cell
                      key={index}
                      fill={
                        stocks[index].pChange >= 0
                          ? "var(--color-chart-1)"
                          : "var(--color-chart-3)"
                      }
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
