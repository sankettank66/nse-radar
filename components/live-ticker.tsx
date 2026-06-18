"use client";

import { useIndexWs } from "@/hooks/use-index-ws";
import { cn, getMarketStatus, type MarketStatus } from "@/lib/utils";

const INDICES = [
  {
    key: "nifty50",
    label: "NIFTY 50",
    url: "wss://streamer.nseindia.com/streams/indices/high/nifty50?index=nifty%2050",
  },
];

const statusConfig: Record<MarketStatus, { label: string; className: string }> = {
  "pre-market": { label: "Pre Market", className: "bg-amber-500/15 text-amber-500" },
  live: { label: "Live", className: "bg-semantic-up/15 text-semantic-up" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground" },
};

export function LiveTicker() {
  const { quotes, connected } = useIndexWs({ indices: INDICES });
  const status = getMarketStatus();
  const cfg = statusConfig[status];

  return (
    <div className="flex items-center divide-x divide-border">
      {INDICES.map((idx) => {
        const q = quotes[idx.key];
        return (
          <div
            key={idx.key}
            className="flex items-center gap-2.5 px-3 first:pl-0 last:pr-0"
          >
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {idx.label}
            </span>
            <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider", cfg.className)}>
              {cfg.label}
            </span>
            {q && status !== "closed" ? (
              <>
                <span className="font-mono text-[14px] font-semibold tabular-nums text-foreground">
                  {q.currentPrice.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  className={cn(
                    "font-mono text-[12px] tabular-nums",
                    q.change >= 0 ? "text-semantic-up" : "text-semantic-down"
                  )}
                >
                  {q.change >= 0 ? "+" : ""}
                  {q.change.toFixed(2)}
                </span>
                <span
                  className={cn(
                    "font-mono text-[11px] tabular-nums",
                    q.perChange >= 0
                      ? "text-semantic-up"
                      : "text-semantic-down"
                  )}
                >
                  ({q.perChange >= 0 ? "+" : ""}
                  {q.perChange.toFixed(2)}%)
                </span>
              </>
            ) : status === "closed" ? null : (
              <span className="font-mono text-[12px] text-muted-foreground">
                {connected ? "..." : "-"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
