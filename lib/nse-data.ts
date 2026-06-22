import type { ScannerEntry, SnapshotDerivativeEntry } from "@/lib/types";

export const INDICES_FILTER = new Set(["NIFTY", "BANKNIFTY", "FINNIFTY", "NIFTY NEXT 50", "MIDCAP NIFTY", "SENSEX"]);

export function consolidateFutures(entries: SnapshotDerivativeEntry[]): ScannerEntry[] {
  const map = new Map<string, SnapshotDerivativeEntry[]>();
  for (const e of entries) {
    if (e.instrumentType !== "FUTSTK" || INDICES_FILTER.has(e.underlying)) continue;
    const arr = map.get(e.underlying);
    if (arr) arr.push(e);
    else map.set(e.underlying, [e]);
  }

  const result: ScannerEntry[] = [];
  for (const [symbol, contracts] of map) {
    contracts.sort((a, b) => b.numberOfContractsTraded - a.numberOfContractsTraded);
    const top = contracts[0];
    result.push({
      symbol,
      lastPrice: top.lastPrice,
      pChange: top.pChange,
      volume: contracts.reduce((s, c) => s + c.numberOfContractsTraded, 0),
      turnover: contracts.reduce((s, c) => s + c.totalTurnover, 0),
      openInterest: contracts.reduce((s, c) => s + c.openInterest, 0),
      underlyingValue: top.underlyingValue,
    });
  }
  return result;
}

export function formatTurnover(value: number): string {
  if (value >= 1_00_00_00_000) {
    return `${(value / 1_00_00_00_000).toFixed(2)}Cr`;
  }
  if (value >= 1_00_00_000) {
    return `${(value / 1_00_00_000).toFixed(2)}L`;
  }
  return value.toLocaleString("en-IN");
}
