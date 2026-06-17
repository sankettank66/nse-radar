import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OI Contracts Analysis — NSE Sectorial Dashboard",
  description: "Live OI contracts analysis with 4-category breakdown for stock futures and options",
};

export default function OiContractsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
