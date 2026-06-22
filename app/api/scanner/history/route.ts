import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ScannerSnapshot } from "@/lib/models/scanner-snapshot";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "date param required (YYYYMMDD)" }, { status: 400 });
    }

    const snapshots = await ScannerSnapshot
      .find({ date })
      .select("timestamp timeSlot date summary entries.symbol entries.rank entries.qualityScore entries.rFactor entries.quadrant entries.confidence entries.pChange entries.volume entries.turnover")
      .sort({ timeSlot: 1 })
      .lean();

    return NextResponse.json({ date, count: snapshots.length, snapshots });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
