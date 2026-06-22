import type {
  SectorIndex,
  SectorStock,
  OISpurtsData,
  OiContractsResponse,
  SnapshotDerivativeEntry,
  SnapshotDerivativesResponse,
  MostActiveUnderlyingEntry,
} from "@/lib/types";

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

export function fetchSectorStocks(sector: string): Promise<SectorStock[]> {
  return fetchNse<SectorStock[]>(
    `${BASE_URL}/heatmap-symbols?type=Sectoral%20Indices&indices=${encodeURIComponent(sector)}`
  );
}

export function fetchOISpurts(): Promise<OISpurtsData> {
  return fetchNse<OISpurtsData>(
    `${BASE_URL}/live-analysis-oi-spurts-underlyings`
  );
}

export function fetchOiContracts(): Promise<OiContractsResponse> {
  return fetchNse<OiContractsResponse>(
    `${BASE_URL}/live-analysis-oi-spurts-contracts`
  );
}

export function fetchMostActiveUnderlying(): Promise<{ data: MostActiveUnderlyingEntry[] }> {
  return fetchNse<{ data: MostActiveUnderlyingEntry[] }>(
    `${BASE_URL}/live-analysis-most-active-underlying`,
  );
}

export function fetchFuturesSnapshot(): Promise<SnapshotDerivativesResponse> {
  return fetchSnapshotDerivatives("futures");
}

export function fetchSnapshotDerivatives(index: string): Promise<SnapshotDerivativesResponse> {
  return fetchNse<SnapshotDerivativesResponse>(
    `${BASE_URL}/snapshot-derivatives-equity?index=${encodeURIComponent(index)}`
  );
}

export function extractSnapshotEntries(res: SnapshotDerivativesResponse): SnapshotDerivativeEntry[] {
  const key = Object.keys(res)[0];
  const nested = key ? res[key] : undefined;
  if (nested?.data) return nested.data;
  return [];
}
