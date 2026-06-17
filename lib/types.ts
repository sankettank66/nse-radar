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
