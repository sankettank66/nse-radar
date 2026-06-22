import type { OISpurtEntry, MostActiveUnderlyingEntry } from "@/lib/types";
import type { ScannerEntry } from "@/lib/types";

const WEIGHTS_WITH_SPURT = {
  pChange: 0.25,
  turnover: 0.25,
  volume: 0.20,
  openInterest: 0.15,
  changeInOI: 0.15,
};

const WEIGHTS_WITHOUT_SPURT = {
  pChange: 0.30,
  turnover: 0.30,
  volume: 0.25,
  openInterest: 0.15,
};

export type Quadrant =
  | "long-buildup"
  | "short-buildup"
  | "short-covering"
  | "long-unwinding"
  | null;

export type ConfidenceLabel = "high" | "medium" | "low";

export type TabFilter =
  | "all"
  | "long-buildup"
  | "short-buildup"
  | "short-covering"
  | "long-unwinding";

export interface ConfluenceBreakdown {
  isLongBuildup: boolean;
  highVolume: boolean;
  highTurnover: boolean;
  highOptVolume: boolean;
  highPremium: boolean;
  lowChurn: boolean;
  hasSpurtData: boolean;
}

export interface EnrichedEntry {
  symbol: string;
  lastPrice: number;
  pChange: number;
  volume: number;
  turnover: number;
  openInterest: number;
  underlyingValue: number;
  changeInOI: number | null;
  avgInOI: number | null;
  prevOI: number | null;
  quadrant: Quadrant;
  qualityScore: number;
  confidence: ConfidenceLabel;
  volOiRatio: number | null;
  percentileRank: number;
  pChangeRank: number;
  volumeRank: number;
  turnoverRank: number;
  oiRank: number;
  changeInOIRank: number | null;
  hasSpurt: boolean;
  rFactor: number;
  confluence: ConfluenceBreakdown;
}

export const QUADRANT_LABEL: Record<string, string> = {
  "long-buildup": "Long Buildup",
  "short-buildup": "Short Buildup",
  "short-covering": "Short Covering",
  "long-unwinding": "Long Unwinding",
};

export const QUADRANT_DESC: Record<string, string> = {
  "long-buildup": "Price ↑ + OI ↑ — Institutions adding long positions (bullish)",
  "short-buildup": "Price ↓ + OI ↑ — Institutions adding short positions (bearish)",
  "short-covering": "Price ↑ + OI ↓ — Short sellers closing (potentially bullish but weaker)",
  "long-unwinding": "Price ↓ + OI ↓ — Institutions exiting long positions (bearish)",
};

function classifyQuadrant(
  pChange: number,
  changeInOI: number | null,
): Quadrant {
  if (changeInOI === null) return null;
  if (pChange > 0 && changeInOI > 0) return "long-buildup";
  if (pChange > 0 && changeInOI < 0) return "short-covering";
  if (pChange < 0 && changeInOI > 0) return "short-buildup";
  if (pChange < 0 && changeInOI < 0) return "long-unwinding";
  return null;
}

function computeConfidence(
  quadrant: Quadrant,
  score: number,
): ConfidenceLabel {
  if (quadrant === "long-buildup" && score >= 65) return "high";
  if (quadrant === "long-buildup" || score >= 45) return "medium";
  return "low";
}

function computePercentiles(values: number[]): number[] {
  const n = values.length;
  if (n === 0) return [];
  if (n === 1) return [100];

  const indexed = values.map((v, i) => ({ value: v, index: i }));
  indexed.sort((a, b) => a.value - b.value);

  const percentile = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    percentile[indexed[i].index] = n > 1 ? (i / (n - 1)) * 100 : 100;
  }

  return percentile;
}

export function enrichScannerData(
  futures: ScannerEntry[],
  spurtsMap: Map<string, OISpurtEntry>,
): EnrichedEntry[] {
  if (futures.length === 0) return [];

  const withSpurt: ScannerEntry[] = [];
  const withoutSpurt: ScannerEntry[] = [];

  for (const f of futures) {
    if (spurtsMap.has(f.symbol)) {
      withSpurt.push(f);
    } else {
      withoutSpurt.push(f);
    }
  }

  function compute(enriched: ScannerEntry[]): EnrichedEntry[] {
    if (enriched.length === 0) return [];

    const pChanges = enriched.map((e) => e.pChange);
    const volumes = enriched.map((e) => e.volume);
    const turnovers = enriched.map((e) => e.turnover);
    const ois = enriched.map((e) => e.openInterest);

    const pChangePct = computePercentiles(pChanges);
    const volumePct = computePercentiles(volumes);
    const turnoverPct = computePercentiles(turnovers);
    const oiPct = computePercentiles(ois);

    return enriched.map((e, i) => {
      const spurt = spurtsMap.get(e.symbol);
      const changeInOI = spurt?.changeInOI ?? null;
      const hasSpurt = spurt !== undefined;

      const W = hasSpurt ? WEIGHTS_WITH_SPURT : WEIGHTS_WITHOUT_SPURT;

      let score =
        pChangePct[i] * W.pChange +
        turnoverPct[i] * W.turnover +
        volumePct[i] * W.volume +
        oiPct[i] * W.openInterest;

      const changeInOIPct = computePercentiles(
        enriched.map((x) => spurtsMap.get(x.symbol)?.changeInOI ?? 0),
      );
      const cOI = changeInOIPct[i];

      if (hasSpurt) {
        score += cOI * WEIGHTS_WITH_SPURT.changeInOI;
      }

      const quadrant = classifyQuadrant(e.pChange, changeInOI);

      const vol = e.volume;
      const oi = e.openInterest;
      const volOiRatio = oi > 0 && vol > 0 ? Math.round((vol / oi) * 100) / 100 : null;

      return {
        symbol: e.symbol,
        lastPrice: e.lastPrice,
        pChange: e.pChange,
        volume: e.volume,
        turnover: e.turnover,
        openInterest: e.openInterest,
        underlyingValue: e.underlyingValue,
        changeInOI,
        avgInOI: spurt?.avgInOI ?? null,
        prevOI: spurt ? spurt.prevOI : null,
        quadrant,
        qualityScore: Math.round(score * 10) / 10,
        confidence: computeConfidence(quadrant, score),
        volOiRatio,
        percentileRank: Math.round(pChangePct[i]),
        pChangeRank: Math.round(pChangePct[i]),
        volumeRank: Math.round(volumePct[i]),
        turnoverRank: Math.round(turnoverPct[i]),
        oiRank: Math.round(oiPct[i]),
        changeInOIRank: hasSpurt ? Math.round(cOI) : null,
        hasSpurt,
        rFactor: 0,
        confluence: {
          isLongBuildup: quadrant === "long-buildup",
          highVolume: volumePct[i] > 70,
          highTurnover: turnoverPct[i] > 70,
          highOptVolume: false,
          highPremium: false,
          lowChurn: volOiRatio !== null && volOiRatio < 0.5,
          hasSpurtData: hasSpurt,
        },
      };
    });
  }

  const result = [...compute(withSpurt), ...compute(withoutSpurt)];
  result.sort((a, b) => b.qualityScore - a.qualityScore);

  return result;
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function computeConfluence(
  enriched: EnrichedEntry[],
  underlying: MostActiveUnderlyingEntry[],
): EnrichedEntry[] {
  const stockSymbols = new Set(enriched.map((e) => e.symbol));
  const stockUnderlying = underlying.filter((u) => stockSymbols.has(u.symbol));

  const optVolumes = stockUnderlying.map((u) => u.optVolume);
  const premTurnovers = stockUnderlying.map((u) => u.preTurnover);
  const optMedian = computeMedian(optVolumes);
  const premMedian = computeMedian(premTurnovers);

  const underlyingMap = new Map<string, MostActiveUnderlyingEntry>();
  for (const u of stockUnderlying) {
    underlyingMap.set(u.symbol, u);
  }

  return enriched.map((e) => {
    const u = underlyingMap.get(e.symbol);

    let isLongBuildup = e.quadrant === "long-buildup";
    let highVolume = e.volumeRank > 70;
    let highTurnover = e.turnoverRank > 70;
    let highOptVolume = u !== undefined && u.optVolume > optMedian;
    let highPremium = u !== undefined && u.preTurnover > premMedian;
    let lowChurn = e.volOiRatio !== null && e.volOiRatio < 0.5;
    let hasSpurtData = e.hasSpurt;

    let r = 1.0;
    if (isLongBuildup) r += 2.0;
    if (highVolume) r += 1.0;
    if (highTurnover) r += 1.0;
    if (highOptVolume) r += 1.0;
    if (highPremium) r += 1.0;
    if (lowChurn) r += 0.5;
    if (hasSpurtData) r += 0.5;

    return {
      ...e,
      rFactor: Math.round(r * 10) / 10,
      confluence: {
        isLongBuildup,
        highVolume,
        highTurnover,
        highOptVolume,
        highPremium,
        lowChurn,
        hasSpurtData,
      },
    };
  });
}

export function filterByTab(
  data: EnrichedEntry[],
  tab: TabFilter,
  minPChange: number,
  minVolume: number,
): EnrichedEntry[] {
  return data.filter((e) => {
    if (tab !== "all" && e.quadrant !== tab) return false;
    if (Math.abs(e.pChange) < minPChange) return false;
    if (e.volume < minVolume) return false;
    return true;
  });
}
