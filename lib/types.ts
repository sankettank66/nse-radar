export interface SectorIndex {
  index: string;
  indexLongName: string;
  current: number;
  pChange: number;
  open: number;
  high: number;
  low: number;
  close: number;
  yrHigh: number;
  yrLow: number;
  timeStamp?: string;
}

export interface SectorStock {
  symbol: string;
  series: string;
  lastPrice: number;
  change: string;
  pChange: string;
  totalTradedVolume: string;
  quantityTraded: string;
  VWAP: string;
  high: string;
  low: string;
  marketType: string;
  lastUpdatedTime: string;
}

export interface OISpurtEntry {
  symbol: string;
  latestOI: number;
  prevOI: number;
  changeInOI: number;
  avgInOI: number;
  volume: number;
  underlyingValue: number;
}

export interface OISpurtsData {
  data: OISpurtEntry[];
}

export interface IndexQuote {
  indexName: string;
  currentPrice: number;
  perChange: number;
  change: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  mktStatus: string;
}

export interface OiContract {
  changeInOI: number;
  expiryDate: string;
  instrument: string;
  latestOI: number;
  ltp: number;
  optionType: string;
  pChange: number;
  premTurnover: number;
  prevClose: number;
  prevOI: number;
  strikePrice: number;
  symbol: string;
  turnover: number;
  type: string;
  underlyingValue: number;
  volume: number;
  identifier: string;
  instrumentType: string;
  pChangeInOI: number;
}

export interface OiContractsResponse {
  data: Record<string, OiContract[]>[];
  timestamp: string;
  currTradingDate: string;
  prevTradingDate: string;
}

export interface SnapshotDerivativeEntry {
  identifier: string;
  instrumentType: string;
  instrument: string;
  underlying: string;
  expiryDate: string;
  optionType: string;
  strikePrice: number;
  lastPrice: number;
  numberOfContractsTraded: number;
  totalTurnover: number;
  premiumTurnover: number;
  openInterest: number;
  underlyingValue: number;
  pChange: number;
}

export interface SnapshotDerivativesResponse {
  [instrumentType: string]: {
    data: SnapshotDerivativeEntry[];
    timestamp: string;
  };
}

export interface OptionsActivity {
  callVolume: number;
  putVolume: number;
  callOIChg: number;
  putOIChg: number;
  callPremTurnover: number;
  putPremTurnover: number;
  callContracts: number;
  putContracts: number;
}

export interface SignalEntry {
  symbol: string;
  direction: "bullish" | "bearish";
  signalScore: number;
  changeInOI: number;
  pChange: number;
  volume: number;
  ltp: number;
  underlyingValue: number;
  prevClose: number;
  spurtsAvgInOI: number | null;
  spurtsOIChg: number | null;
  confluence: number;
  optionsPCR: number | null;
  optionsAlignment: "confirming" | "neutral" | "contradicting" | null;
}
