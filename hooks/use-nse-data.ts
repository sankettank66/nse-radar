"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchSectorialIndices,
  fetchSectorStocks,
  fetchOISpurts,
} from "@/lib/api";
import type { SectorIndex, SectorStock, OISpurtEntry } from "@/lib/types";

interface UseNseDataOptions {
  refreshInterval?: number;
}

interface UseNseDataReturn {
  sectors: SectorIndex[];
  stocks: SectorStock[];
  oiSpurts: OISpurtEntry[];
  selectedSector: string | null;
  setSelectedSector: (sector: string | null) => void;
  loading: boolean;
  refreshing: boolean;
  stocksLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useNseData(
  options: UseNseDataOptions = {}
): UseNseDataReturn {
  const { refreshInterval = 60_000 } = options;

  const [sectors, setSectors] = useState<SectorIndex[]>([]);
  const [stocks, setStocks] = useState<SectorStock[]>([]);
  const [oiSpurts, setOiSpurts] = useState<OISpurtEntry[]>([]);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSectors = useCallback(async () => {
    try {
      const data = await fetchSectorialIndices();
      setSectors(data.data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch sector data"
      );
    }
  }, []);

  const loadOiSpurts = useCallback(async () => {
    try {
      const data = await fetchOISpurts();
      setOiSpurts(data.data);
    } catch {
      // OI spurts failure is non-critical
    }
  }, []);

  const loadAll = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    await Promise.all([loadSectors(), loadOiSpurts()]);
    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, [loadSectors, loadOiSpurts]);

  const refresh = useCallback(() => {
    loadAll(false);
  }, [loadAll]);

  useEffect(() => {
    loadAll(true);

    intervalRef.current = setInterval(() => loadAll(false), refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadAll, refreshInterval]);

  useEffect(() => {
    if (!selectedSector) {
      setStocks([]);
      return;
    }

    setStocksLoading(true);
    fetchSectorStocks(selectedSector)
      .then((data) => setStocks(data.data))
      .catch(() => setStocks([]))
      .finally(() => setStocksLoading(false));
  }, [selectedSector]);

  return {
    sectors,
    stocks,
    oiSpurts,
    selectedSector,
    setSelectedSector,
    loading,
    refreshing,
    stocksLoading,
    error,
    lastUpdated,
    refresh,
  };
}
