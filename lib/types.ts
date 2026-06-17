export interface SectorIndex {
  indexName: string;
  indexSymbol: string;
  last: number;
  variation: number;
  percentChange: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  yearHigh: number;
  yearLow: number;
  indicativeClose: number;
}

export interface HeatmapData {
  data: SectorIndex[];
}

export interface SectorStock {
  symbol: string;
  identifier: string;
  companyName: string;
  lastPrice: number;
  change: number;
  pChange: number;
  totalTradedVolume: number;
  totalTurnover: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
}

export interface SectorStocksData {
  data: SectorStock[];
}

export interface OISpurtEntry {
  symbol: string;
  series: string;
  openInterest: number;
  changeInOI: number;
  changeInOIPercent: number;
  lastPrice: number;
  change: number;
  percentChange: number;
  totalTradedVolume: number;
  underlying: string;
  underlyingValue: number;
}

export interface OISpurtsData {
  data: OISpurtEntry[];
}
