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
