"use client";

import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string | null;
  direction: SortDirection;
}

export function useSort<T>(data: T[], defaultKey?: string) {
  const [sort, setSort] = useState<SortState>({
    key: defaultKey ?? null,
    direction: "desc",
  });

  const sortedData = useMemo(() => {
    if (!sort.key) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sort.key!];
      const bVal = (b as Record<string, unknown>)[sort.key!];

      let cmp = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }

      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [data, sort]);

  function toggleSort(key: string) {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  }

  return { sortedData, sort, toggleSort };
}
