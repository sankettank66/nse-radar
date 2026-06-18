import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatPrice(value: number): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatVolume(value: number): string {
  if (value >= 1_00_00_000) {
    return `${(value / 1_00_00_000).toFixed(2)}Cr`;
  }
  if (value >= 1_00_000) {
    return `${(value / 1_00_000).toFixed(2)}L`;
  }
  return value.toLocaleString("en-IN");
}

export function getChangeColor(value: number): string {
  if (value > 0) return "text-semantic-up";
  if (value < 0) return "text-semantic-down";
  return "text-muted-foreground";
}

export type MarketStatus = "pre-market" | "live" | "closed";

export function getMarketStatus(): MarketStatus {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const h = istTime.getUTCHours();
  const m = istTime.getUTCMinutes();
  const total = h * 60 + m;

  if (total >= 540 && total < 555) return "pre-market";
  if (total >= 555 && total < 930) return "live";
  return "closed";
}

export function isMarketOpen(): boolean {
  const status = getMarketStatus();
  return status === "live" || status === "pre-market";
}
