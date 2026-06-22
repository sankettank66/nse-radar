import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = { conn: null, promise: null };

interface SrvRecord { name: string; port: number; priority: number; weight: number }

async function dohQuery<T>(name: string, type: string): Promise<T[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`DoH ${type} lookup failed for ${name}`);
  const json = await res.json();
  if (json.Status !== 0 || !json.Answer) throw new Error(`DoH ${type} returned no answers for ${name}`);
  return json.Answer.map((a: { data: string }) => {
    if (type === "SRV") {
      const [p, w, port, ...hostParts] = a.data.split(/\s+/);
      return { name: hostParts.join("."), port: Number(port), priority: Number(p), weight: Number(w) } as unknown as T;
    }
    return a.data as unknown as T;
  });
}

async function resolveSrvUri(uri: string): Promise<string> {
  const match = uri.match(/^mongodb\+srv:\/\/(.+@)?([^/?]+)/);
  if (!match) return uri;

  const credentials = match[1] || "";
  const hostname = match[2];

  const [srvRecords, txtRecords] = await Promise.all([
    dohQuery<SrvRecord>(`_mongodb._tcp.${hostname}`, "SRV"),
    dohQuery<string>(hostname, "TXT").catch(() => []),
  ]);

  const hosts = srvRecords
    .sort((a, b) => a.priority - b.priority)
    .map((r) => `${r.name}:${r.port}`)
    .join(",");

  const txt = txtRecords.map((s) => s.replace(/^"|"$/g, "")).join("");
  const params = new URLSearchParams(txt);
  params.set("ssl", "true");
  if (!params.has("authSource")) params.set("authSource", "admin");

  return `mongodb://${credentials}${hosts}/?${params.toString()}`;
}

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!MONGODB_URI) throw new Error("MONGODB_URI not set");

  if (!cached.promise) {
    const uri = MONGODB_URI.startsWith("mongodb+srv://")
      ? await resolveSrvUri(MONGODB_URI)
      : MONGODB_URI;
    cached.promise = mongoose.connect(uri, { dbName: "nse-dashboard" });
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
