"use client";

import { cn } from "@/lib/utils";
import { formatPercent, formatPrice, formatVolume } from "@/lib/utils";
import { formatTurnover } from "@/lib/nse-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSort } from "@/hooks/use-sort";
import { QUADRANT_LABEL } from "@/lib/scanner-engine";
import type { EnrichedEntry } from "@/lib/scanner-engine";

function confidenceDot(level: string) {
  if (level === "high") return "bg-semantic-up";
  if (level === "medium") return "bg-amber-500";
  return "bg-muted-foreground/30";
}

function quadrantBadgeColor(quadrant: string | null) {
  switch (quadrant) {
    case "long-buildup": return "bg-semantic-up/15 text-semantic-up border-semantic-up/30";
    case "short-buildup": return "bg-semantic-down/15 text-semantic-down border-semantic-down/30";
    case "short-covering": return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    case "long-unwinding": return "bg-orange-500/15 text-orange-500 border-orange-500/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function scoreColor(score: number): string {
  if (score >= 65) return "bg-semantic-up/15 text-semantic-up";
  if (score >= 45) return "bg-amber-500/15 text-amber-500";
  return "bg-muted text-muted-foreground";
}

function rFactorColor(r: number): string {
  if (r >= 6) return "bg-semantic-up/15 text-semantic-up";
  if (r >= 4.5) return "bg-amber-500/15 text-amber-500";
  return "bg-muted text-muted-foreground";
}

function SortIcon({
  sortKey,
  currentKey,
  direction,
}: {
  sortKey: string;
  currentKey: string | null;
  direction: "asc" | "desc";
}) {
  if (sortKey !== currentKey) {
    return <span className="ml-1 text-muted-foreground/30">↕</span>;
  }
  return (
    <span className="ml-1 text-foreground">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

export function ScannerTable({ data }: { data: EnrichedEntry[] }) {
  const { sortedData, sort, toggleSort } = useSort(data, "qualityScore");

  return (
    <div className="overflow-x-auto px-6 scrollbar-hide">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-4" />
            <TableHead
              className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              onClick={() => toggleSort("symbol")}
            >
              Symbol <SortIcon sortKey="symbol" currentKey={sort.key} direction={sort.direction} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              onClick={() => toggleSort("qualityScore")}
            >
              Score <SortIcon sortKey="qualityScore" currentKey={sort.key} direction={sort.direction} />
            </TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
              Quadrant
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              onClick={() => toggleSort("pChange")}
            >
              Chg% <SortIcon sortKey="pChange" currentKey={sort.key} direction={sort.direction} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell"
              onClick={() => toggleSort("volume")}
            >
              Vol <SortIcon sortKey="volume" currentKey={sort.key} direction={sort.direction} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell"
              onClick={() => toggleSort("turnover")}
            >
              Turnover <SortIcon sortKey="turnover" currentKey={sort.key} direction={sort.direction} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              onClick={() => toggleSort("rFactor")}
            >
              R <SortIcon sortKey="rFactor" currentKey={sort.key} direction={sort.direction} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell"
              onClick={() => toggleSort("changeInOI")}
            >
              OI Chg% <SortIcon sortKey="changeInOI" currentKey={sort.key} direction={sort.direction} />
            </TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
              Vol/OI
            </TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden xl:table-cell">
              %ile
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((s, i) => (
            <TableRow
              key={`${s.symbol}-${s.quadrant ?? "u"}-${i}`}
              className="border-t border-border hover:bg-muted/50"
            >
              <TableCell className="pr-0">
                <span
                  className={cn("inline-block size-[6px] rounded-full", confidenceDot(s.confidence))}
                  title={`Confidence: ${s.confidence}`}
                />
              </TableCell>

              <TableCell className="font-medium text-sm">
                <span className="flex items-center gap-1.5">
                  {s.symbol}
                  {s.hasSpurt && (
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 h-[16px] font-mono uppercase tracking-wider border-amber-500/30 text-amber-500"
                    >
                      OI
                    </Badge>
                  )}
                </span>
              </TableCell>

              <TableCell className="text-right">
                <span
                  className={cn(
                    "inline-block px-2 py-0.5 rounded text-[12px] font-mono font-semibold tabular-nums",
                    scoreColor(s.qualityScore),
                  )}
                >
                  {s.qualityScore.toFixed(0)}
                </span>
              </TableCell>

              <TableCell className="text-right hidden sm:table-cell">
                {s.quadrant ? (
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium border",
                      quadrantBadgeColor(s.quadrant),
                    )}
                  >
                    {QUADRANT_LABEL[s.quadrant]}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-[11px]">—</span>
                )}
              </TableCell>

              <TableCell className="text-right">
                <span
                  className={cn(
                    "font-mono text-sm tabular-nums font-medium",
                    s.pChange >= 0 ? "text-semantic-up" : "text-semantic-down",
                  )}
                >
                  {formatPercent(s.pChange)}
                </span>
              </TableCell>

              <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden sm:table-cell">
                {formatVolume(s.volume)}
              </TableCell>

              <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden md:table-cell">
                ₹{formatTurnover(s.turnover)}
              </TableCell>

              <TableCell className="text-right">
                <span
                  className={cn(
                    "inline-block px-2 py-0.5 rounded text-[12px] font-mono font-semibold tabular-nums cursor-help",
                    rFactorColor(s.rFactor),
                  )}
                  title={
                    "Confluence breakdown:\n" +
                    `• Long Buildup: ${s.confluence.isLongBuildup ? "✓" : "✗"}\n` +
                    `• High Volume: ${s.confluence.highVolume ? "✓" : "✗"}\n` +
                    `• High Turnover: ${s.confluence.highTurnover ? "✓" : "✗"}\n` +
                    `• High Options Vol: ${s.confluence.highOptVolume ? "✓" : "✗"}\n` +
                    `• High Premium: ${s.confluence.highPremium ? "✓" : "✗"}\n` +
                    `• Low Churn: ${s.confluence.lowChurn ? "✓" : "✗"}\n` +
                    `• OI Spurt: ${s.confluence.hasSpurtData ? "✓" : "✗"}`
                  }
                >
                  {s.rFactor.toFixed(1)}
                </span>
              </TableCell>

              <TableCell className="text-right hidden lg:table-cell">
                {s.changeInOI !== null ? (
                  <span
                    className={cn(
                      "font-mono text-sm tabular-nums",
                      s.changeInOI > 0 ? "text-semantic-up" : "text-semantic-down",
                    )}
                  >
                    {formatPercent(s.changeInOI)}
                  </span>
                ) : (
                  <span className="text-muted-foreground font-mono text-sm">—</span>
                )}
              </TableCell>

              <TableCell className="text-right hidden lg:table-cell">
                {s.volOiRatio !== null ? (
                  <span
                    className={cn(
                      "font-mono text-sm tabular-nums",
                      s.volOiRatio < 0.5
                        ? "text-semantic-up"
                        : s.volOiRatio > 3
                          ? "text-amber-500"
                          : "text-muted-foreground",
                    )}
                  >
                    {s.volOiRatio.toFixed(2)}
                    <span className="text-[9px] ml-0.5">
                      {s.volOiRatio < 0.5 ? "⛁" : s.volOiRatio > 3 ? "⇄" : ""}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground font-mono text-sm">—</span>
                )}
              </TableCell>

              <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground hidden xl:table-cell">
                {s.percentileRank}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
