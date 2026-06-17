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
