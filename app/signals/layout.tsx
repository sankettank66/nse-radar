import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trading Signals — NSE Sectorial Dashboard",
  description: "OI buildup and price breakout signals for stock futures, ranked by combined OI change, price movement, and volume",
};

export default function SignalsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
