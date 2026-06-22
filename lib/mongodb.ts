import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!MONGODB_URI) throw new Error("MONGODB_URI not set");

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { dbName: "nse-dashboard" });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export function formatTimeSlot(date: Date): string {
  const h = date.getUTCHours() + 5;
  const m = date.getUTCMinutes();
  const hh = h > 23 ? h - 24 : h;
  return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}
