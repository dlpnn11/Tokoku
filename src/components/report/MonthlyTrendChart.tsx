"use client";

import * as React from "react";
import { formatRupiah, calculateNiceScale } from "@/lib/utils";

interface MonthlyDataPoint {
  key: string;
  year: number;
  label: string;
  revenue: number;
  txCount: number;
}

interface MonthlyTrendChartProps {
  data: MonthlyDataPoint[];
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center text-[#6B7280] text-xs space-y-1">
        <p className="font-bold text-[#1A1A1A]">Belum Ada Data Historis</p>
        <p>Grafik tren bulanan akan muncul saat transaksi terakumulasi.</p>
      </div>
    );
  }

  const rawMax = Math.max(...data.map((d) => d.revenue), 0);
  const { niceMax, ticks } = calculateNiceScale(rawMax);

  return (
    <div className="space-y-4">
      {/* Legend & Hover Info */}
      <div className="flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#6FA084] inline-block" />
            <span className="text-[#6B7280] font-medium">Tahun 2026</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#9E9E9E] inline-block" />
            <span className="text-[#6B7280] font-medium">Tahun 2025 (Historis)</span>
          </div>
        </div>

        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="font-mono text-[11px] font-bold text-[#1A1A1A] bg-[#FAFBF9] border border-[#E5E5E0] px-2.5 py-1 rounded-md">
            {data[hoveredIndex].label}: {formatRupiah(data[hoveredIndex].revenue)} (
            {data[hoveredIndex].txCount} transaksi)
          </div>
        )}
      </div>

      {/* Pure Flat Bar Chart Area */}
      <div className="select-none overflow-x-auto pt-4 pb-2">
        <div className="min-w-[600px]">
          {/* Main Chart Graphic (Height: 190px) */}
          <div className="relative" style={{ height: "190px" }}>
            {/* Horizontal grid lines with rounded clean intervals */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
              {ticks.map((tickVal, idx) => (
                <div key={idx} className="border-b border-[#F0F0EB] w-full flex items-center justify-start h-0">
                  <span className="text-[10px] font-mono text-[#9E9E9E] -translate-y-2 pr-2.5 select-none w-26 text-right shrink-0 whitespace-nowrap">
                    {formatRupiah(tickVal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bars Container — Placed exactly above grid lines */}
            <div className="absolute inset-0 flex items-end justify-between gap-2.5 pl-30 pr-3">
              {data.map((item, idx) => {
                const isHovered = hoveredIndex === idx;
                const barHeightPx = Math.max(
                  Math.round((item.revenue / niceMax) * 190),
                  item.revenue > 0 ? 6 : 2
                );
                const is2025 = item.year === 2025;

                return (
                  <div
                    key={item.key}
                    className="flex-1 flex justify-center items-end h-full group relative cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Floating tooltip */}
                    {isHovered && (
                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white text-[10px] font-bold py-1 px-2.5 rounded-md shadow-md whitespace-nowrap z-30 pointer-events-none">
                        {item.label}: {formatRupiah(item.revenue)} ({item.txCount} tx)
                      </div>
                    )}

                    {/* Flat Solid Bar — ZERO GRADIENTS */}
                    <div
                      className="w-full max-w-[32px] rounded-t-sm transition-all duration-150"
                      style={{
                        height: `${barHeightPx}px`,
                        backgroundColor: is2025
                          ? isHovered
                            ? "#7D7D7D"
                            : "#9E9E9E"
                          : isHovered
                          ? "#58836B"
                          : "#6FA084",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis Baseline & Month Labels */}
          <div className="flex justify-between gap-2.5 pl-30 pr-3 pt-2 border-t border-[#E5E5E0]">
            {data.map((item, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <div key={item.key} className="flex-1 text-center">
                  <span
                    className={`text-[10px] font-mono truncate block ${
                      isHovered ? "font-bold text-[#1A1A1A]" : "text-[#6B7280]"
                    }`}
                    title={item.label}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
