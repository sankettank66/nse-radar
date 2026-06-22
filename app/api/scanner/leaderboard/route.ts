import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ScannerSnapshot } from "@/lib/models/scanner-snapshot";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const current = searchParams.get("current");
    const previous = searchParams.get("previous");

    if (!date || !current || !previous) {
      return NextResponse.json(
        { error: "date, current, and previous params required" },
        { status: 400 },
      );
    }

    const [currentSnap, prevSnap] = await Promise.all([
      ScannerSnapshot.findOne({ date, timeSlot: current }).lean(),
      ScannerSnapshot.findOne({ date, timeSlot: previous }).lean(),
    ]);

    if (!currentSnap) {
      return NextResponse.json({ error: `Snapshot ${current} not found` }, { status: 404 });
    }

    const prevRankMap = new Map<string, number>();
    if (prevSnap) {
      prevSnap.entries.forEach((e: Record<string, unknown>, i: number) => {
        prevRankMap.set(e.symbol as string, i + 1);
      });
    }

    const currentSymbols = new Set<string>();
    const changes: {
      symbol: string;
      currentRank: number;
      prevRank: number | null;
      rankChange: number | null;
      qualityScore: number;
      rFactor: number;
      quadrant: string | null;
      isNew: boolean;
      isDropped: boolean;
    }[] = [];

    currentSnap.entries.forEach((e: Record<string, unknown>, i: number) => {
      const sym = e.symbol as string;
      currentSymbols.add(sym);
      const prevRank = prevRankMap.get(sym) ?? null;
      const rankChange = prevRank !== null ? prevRank - (i + 1) : null;

      changes.push({
        symbol: sym,
        currentRank: i + 1,
        prevRank,
        rankChange,
        qualityScore: e.qualityScore as number,
        rFactor: e.rFactor as number,
        quadrant: (e.quadrant as string) ?? null,
        isNew: prevRank === null,
        isDropped: false,
      });
    });

    const dropped: {
      symbol: string;
      prevRank: number;
      currentRank: null;
      rankChange: null;
      isDropped: boolean;
    }[] = [];

    if (prevSnap) {
      prevSnap.entries.forEach((e: Record<string, unknown>, i: number) => {
        if (!currentSymbols.has(e.symbol as string)) {
          dropped.push({
            symbol: e.symbol as string,
            prevRank: i + 1,
            currentRank: null,
            rankChange: null,
            isDropped: true,
          });
        }
      });
    }

    changes.sort((a, b) => {
      const aAbs = a.rankChange !== null ? Math.abs(a.rankChange) : 999;
      const bAbs = b.rankChange !== null ? Math.abs(b.rankChange) : 999;
      return bAbs - aAbs;
    });

    return NextResponse.json({
      date,
      current,
      previous,
      total: changes.length,
      changes,
      dropped,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
