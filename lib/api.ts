import type { SectorIndex, SectorStocksData, OISpurtsData } from "@/lib/types";

const BASE_URL = "/api/nse";

async function fetchNse<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NSE API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export function fetchSectorialIndices(): Promise<SectorIndex[]> {
  return fetchNse<SectorIndex[]>(
    `${BASE_URL}/heatmap-index?type=Sectoral%20Indices`
  );
}

export function fetchSectorStocks(sector: string): Promise<SectorStocksData> {
  return fetchNse<SectorStocksData>(
    `${BASE_URL}/heatmap-symbols?type=Sectoral%20Indices&indices=${encodeURIComponent(sector)}`
  );
}

export function fetchOISpurts(): Promise<OISpurtsData> {
  return fetchNse<OISpurtsData>(
    `${BASE_URL}/live-analysis-oi-spurts-underlyings`
  );
}
