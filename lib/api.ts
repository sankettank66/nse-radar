import type { HeatmapData, SectorStocksData, OISpurtsData } from "@/lib/types";

const BASE_URL = "https://www.nseindia.com/api";

async function fetchNse<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
      Referer: "https://www.nseindia.com/",
    },
  });
  if (!response.ok) {
    throw new Error(`NSE API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export function fetchSectorialIndices(): Promise<HeatmapData> {
  return fetchNse<HeatmapData>(
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
