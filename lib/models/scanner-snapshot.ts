import mongoose from "mongoose";

const EntrySchema = new mongoose.Schema({
  symbol: String,
  rank: Number,
  qualityScore: Number,
  rFactor: Number,
  quadrant: { type: String, default: null },
  confidence: String,
  pChange: Number,
  volume: Number,
  turnover: Number,
  openInterest: Number,
  changeInOI: { type: Number, default: null },
  volOiRatio: { type: Number, default: null },
  hasSpurt: Boolean,
}, { _id: false });

const SnapshotSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  date: { type: String, required: true },
  summary: {
    totalStocks: Number,
    longBuildup: Number,
    shortBuildup: Number,
    shortCovering: Number,
    longUnwinding: Number,
    avgRFactor: Number,
    top5: [String],
  },
  entries: [EntrySchema],
}, { timestamps: true });

SnapshotSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

export const ScannerSnapshot = mongoose.models.ScannerSnapshot
  || mongoose.model("ScannerSnapshot", SnapshotSchema);

const EntryDocSchema = new mongoose.Schema({
  snapshotId: { type: mongoose.Schema.Types.ObjectId, ref: "ScannerSnapshot" },
  timestamp: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  date: { type: String, required: true },
  symbol: { type: String, required: true },
  rank: Number,
  qualityScore: Number,
  rFactor: Number,
  quadrant: { type: String, default: null },
  confidence: String,
  pChange: Number,
  volume: Number,
  turnover: Number,
  openInterest: Number,
  changeInOI: { type: Number, default: null },
  volOiRatio: { type: Number, default: null },
  hasSpurt: Boolean,
}, { timestamps: true });

EntryDocSchema.index({ date: 1, timeSlot: 1 });
EntryDocSchema.index({ symbol: 1, date: 1 });

export const ScannerEntry = mongoose.models.ScannerEntry
  || mongoose.model("ScannerEntry", EntryDocSchema);
