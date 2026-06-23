import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable not set");
  process.exit(1);
}

async function resolveSrvUri(uri) {
  const match = uri.match(/^mongodb\+srv:\/\/(.+@)?([^/?]+)/);
  if (!match) return uri;

  const credentials = match[1] || "";
  const hostname = match[2];

  async function dohQuery(name, type) {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
    const res = await fetch(url, { headers: { accept: "application/dns-json" } });
    if (!res.ok) throw new Error(`DoH ${type} lookup failed for ${name}`);
    const json = await res.json();
    if (json.Status !== 0 || !json.Answer) throw new Error(`DoH ${type} returned no answers for ${name}`);
    return json.Answer.map((a) => {
      if (type === "SRV") {
        const [p, w, port, ...hostParts] = a.data.split(/\s+/);
        return { name: hostParts.join("."), port: Number(port), priority: Number(p), weight: Number(w) };
      }
      return a.data;
    });
  }

  const [srvRecords, txtRecords] = await Promise.all([
    dohQuery(`_mongodb._tcp.${hostname}`, "SRV"),
    dohQuery(hostname, "TXT").catch(() => []),
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

function correctTimeSlot(date) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(date.getTime() + istOffset);
  const h = ist.getUTCHours();
  const m = ist.getUTCMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

async function main() {
  const resolvedUri = MONGODB_URI.startsWith("mongodb+srv://")
    ? await resolveSrvUri(MONGODB_URI)
    : MONGODB_URI;

  console.log("Connecting…");
  await mongoose.connect(resolvedUri, { dbName: "nse-dashboard" });
  const db = mongoose.connection.db;

  const snapshotsCol = db.collection("scannersnapshots");
  const entriesCol = db.collection("scannerentries");

  // --- Migrate scannersnapshots ---
  const snapshots = await snapshotsCol.find({}).project({ timestamp: 1, timeSlot: 1, date: 1 }).toArray();
  let snapFixed = 0, snapDeleted = 0;

  for (const doc of snapshots) {
    if (!doc.timestamp) continue;
    const correct = correctTimeSlot(doc.timestamp);
    if (correct === doc.timeSlot) continue;

    // Check if a document with the correct (date, timeSlot) already exists
    const existing = await snapshotsCol.findOne({ date: doc.date, timeSlot: correct });
    if (existing) {
      // The correct slot is already taken — delete this wrong-slot document
      await snapshotsCol.deleteOne({ _id: doc._id });
      console.log(`  Snapshot ${doc.date}/${doc.timeSlot} → DUPLICATE of ${correct}, deleted`);
      snapDeleted++;
    } else {
      await snapshotsCol.updateOne({ _id: doc._id }, { $set: { timeSlot: correct } });
      console.log(`  Snapshot ${doc.date}/${doc.timeSlot} → ${correct}`);
      snapFixed++;
    }
  }

  // --- Migrate scannerentries ---
  const entries = await entriesCol.find({}).project({ timestamp: 1, timeSlot: 1, date: 1 }).toArray();
  let entFixed = 0;

  for (const doc of entries) {
    if (!doc.timestamp) continue;
    const correct = correctTimeSlot(doc.timestamp);
    if (correct !== doc.timeSlot) {
      await entriesCol.updateOne({ _id: doc._id }, { $set: { timeSlot: correct } });
      console.log(`  Entry ${doc.date}/${doc.timeSlot} → ${correct}`);
      entFixed++;
    }
  }

  console.log(`\nDone. Fixed ${snapFixed} snapshots, deleted ${snapDeleted} duplicates, fixed ${entFixed} entries.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
