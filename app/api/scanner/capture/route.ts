import { NextResponse } from "next/server";
import { connectDB, formatTimeSlot, formatDate } from "@/lib/mongodb";
import { ScannerSnapshot, ScannerEntry } from "@/lib/models/scanner-snapshot";
import { fetchFuturesSnapshot, fetchOISpurts, fetchMostActiveUnderlying, extractSnapshotEntries } from "@/lib/api";
import { consolidateFutures } from "@/lib/nse-data";
import { enrichScannerData, computeConfluence } from "@/lib/scanner-engine";
import type { OISpurtEntry } from "@/lib/types";
import type { EnrichedEntry } from "@/lib/scanner-engine";

function isMarketHours(): boolean {
  const now = new Date();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false;

  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const total = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return total >= 555 && total < 930;
}

function computeSummary(enriched: EnrichedEntry[]) {
  const longBuildup = enriched.filter((e) => e.quadrant === "long-buildup").length;
  const shortBuildup = enriched.filter((e) => e.quadrant === "short-buildup").length;
  const shortCovering = enriched.filter((e) => e.quadrant === "short-covering").length;
  const longUnwinding = enriched.filter((e) => e.quadrant === "long-unwinding").length;
  const rFactors = enriched.map((e) => e.rFactor);
  const avgR = rFactors.length > 0
    ? Math.round((rFactors.reduce((a, b) => a + b, 0) / rFactors.length) * 10) / 10
    : 0;
  const top5 = enriched.slice(0, 5).map((e) => e.symbol);

  return { totalStocks: enriched.length, longBuildup, shortBuildup, shortCovering, longUnwinding, avgRFactor: avgR, top5 };
}

function toEntryShape(e: EnrichedEntry, rank: number) {
  return {
    symbol: e.symbol,
    rank,
    qualityScore: e.qualityScore,
    rFactor: e.rFactor,
    quadrant: e.quadrant,
    confidence: e.confidence,
    pChange: e.pChange,
    volume: e.volume,
    turnover: e.turnover,
    openInterest: e.openInterest,
    changeInOI: e.changeInOI,
    volOiRatio: e.volOiRatio,
    hasSpurt: e.hasSpurt,
  };
}

export async function POST() {
  if (!isMarketHours()) {
    return NextResponse.json({ skipped: true, reason: "market closed" });
  }

  try {
    await connectDB();

    const [futuresRes, spurtsRes, underlyingRes] = await Promise.all([
      fetchFuturesSnapshot(),
      fetchOISpurts(),
      fetchMostActiveUnderlying(),
    ]);

    const stocks = consolidateFutures(extractSnapshotEntries(futuresRes));

    const spurtsMap = new Map<string, OISpurtEntry>();
    for (const entry of spurtsRes.data) {
      spurtsMap.set(entry.symbol, entry);
    }

    let enriched = enrichScannerData(stocks, spurtsMap);
    enriched = computeConfluence(enriched, underlyingRes.data);

    const now = new Date();
    const timeSlot = formatTimeSlot(now);
    const date = formatDate(now);
    const entries = enriched.map((e, i) => toEntryShape(e, i + 1));

    const snapshot = await ScannerSnapshot.create({
      timestamp: now,
      timeSlot,
      date,
      summary: computeSummary(enriched),
      entries,
    });

    const entryDocs = entries.map((e) => ({
      snapshotId: snapshot._id,
      timestamp: now,
      timeSlot,
      date,
      ...e,
    }));
    await ScannerEntry.insertMany(entryDocs);

    return NextResponse.json({ captured: true, count: enriched.length, timeSlot, date });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
