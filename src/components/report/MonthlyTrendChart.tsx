"use client";

import * as React from "react";
import { formatRupiah } from "@/lib/utils";

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

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1000000);
  const chartHeight = 220;
  const gridSteps = [1, 0.75, 0.5, 0.25, 0];

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

      {/* SVG / Pure Flat Bar Chart Area */}
      <div className="relative border-b border-[#E5E5E0] pt-6 pb-2 select-none overflow-x-auto">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-6">
          {gridSteps.map((step, idx) => (
            <div key={idx} className="border-b border-[#F0F0EB] w-full flex items-center justify-start">
              <span className="text-[10px] font-mono text-[#9E9E9E] -mt-3.5 pr-2">
                {step === 0 ? "Rp 0" : formatRupiah(maxRevenue * step)}
              </span>
            </div>
          ))}
        </div>

        {/* Bars Container */}
        <div
          className="relative flex items-end justify-between gap-2.5 min-w-[500px] pl-20 pr-3"
          style={{ height: `${chartHeight}px` }}
        >
          {data.map((item, idx) => {
            const isHovered = hoveredIndex === idx;
            const barHeightPercent = Math.max((item.revenue / maxRevenue) * 100, 3);
            const is2025 = item.year === 2025;

            return (
              <div
                key={item.key}
                className="flex-1 flex flex-col items-center group relative cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Floating tooltip */}
                {isHovered && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white text-[10px] font-bold py-1 px-2.5 rounded-md shadow-md whitespace-nowrap z-20 pointer-events-none">
                    {formatRupiah(item.revenue)} ({item.txCount} tx)
                  </div>
                )}

                {/* Flat Solid Bar — ZERO GRADIENTS */}
                <div
                  className="w-full max-w-[32px] rounded-t-md transition-all duration-200"
                  style={{
                    height: `${barHeightPercent}%`,
                    backgroundColor: is2025
                      ? isHovered
                        ? "#7D7D7D"
                        : "#9E9E9E"
                      : isHovered
                      ? "#58836B"
                      : "#6FA084",
                  }}
                />

                {/* X-axis Month Label */}
                <span
                  className={`text-[10px] font-mono mt-2 truncate max-w-[48px] text-center ${
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
  );
}
