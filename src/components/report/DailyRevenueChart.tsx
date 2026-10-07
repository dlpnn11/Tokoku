"use client";

import * as React from "react";
import { formatRupiah, calculateNiceScale } from "@/lib/utils";
import { DailySalesData } from "@/services/reportService";

interface DailyRevenueChartProps {
  data: DailySalesData[];
}

export function DailyRevenueChart({ data }: DailyRevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center text-[#6B7280] text-xs space-y-1">
        <p className="font-bold text-[#1A1A1A]">Belum Ada Data Penjualan Harian</p>
        <p>Lakukan transaksi di kasir untuk melihat grafik pendapatan harian.</p>
      </div>
    );
  }

  const rawMax = Math.max(...data.map((d) => d.revenue), 0);
  const { niceMax, ticks } = calculateNiceScale(rawMax);

  return (
    <div className="space-y-4">
      {/* Legend & Hover Info */}
      <div className="flex items-center justify-between text-xs min-h-[32px] gap-2">
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#6FA084] inline-block" />
            <span className="text-[#6B7280] font-medium">Pendapatan Harian</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#2C2C2C] inline-block" />
            <span className="text-[#6B7280] font-medium">Hari Ini / Puncak</span>
          </div>
        </div>

        <div className="flex items-center justify-end min-h-[28px]">
          {hoveredIndex !== null && data[hoveredIndex] ? (
            <div className="font-mono text-[11px] font-bold text-[#1A1A1A] bg-[#FAFBF9] border border-[#E5E5E0] px-2.5 py-1 rounded-md shadow-2xs whitespace-nowrap animate-in fade-in duration-100">
              {data[hoveredIndex].dayLabel}: {formatRupiah(data[hoveredIndex].revenue)} (
              {data[hoveredIndex].transactionsCount} transaksi)
            </div>
          ) : (
            <span className="text-[11px] text-[#9E9E9E] italic hidden sm:inline whitespace-nowrap">
              Sorot batang untuk rincian
            </span>
          )}
        </div>
      </div>

      {/* Pure Flat Bar Chart Area */}
      <div className="select-none overflow-x-auto pt-4 pb-2 scrollbar-none">
        <div className="min-w-[440px]">
          {/* Main Chart Graphic (Height: 190px) */}
          <div className="relative" style={{ height: "190px" }}>
            {/* Horizontal grid lines with rounded clean intervals */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
              {ticks.map((tickVal, idx) => (
                <div key={idx} className="border-b border-[#F0F0EB] w-full flex items-center justify-start h-0">
                  <span className="text-[10px] font-mono text-[#9E9E9E] -translate-y-2 pr-2.5 select-none w-24 text-right shrink-0 whitespace-nowrap">
                    {formatRupiah(tickVal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bars Container — Placed exactly above grid lines */}
            <div className="absolute inset-0 flex items-end justify-between gap-2 pl-28 pr-3">
              {data.map((item, idx) => {
                const isHovered = hoveredIndex === idx;
                const isHighest = item.revenue === rawMax && item.revenue > 0;
                const barHeightPx = Math.max(
                  Math.round((item.revenue / niceMax) * 190),
                  item.revenue > 0 ? 6 : 2
                );

                return (
                  <div
                    key={item.date}
                    className="flex-1 flex justify-center items-end h-full group relative cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Flat Solid Bar — ZERO GRADIENTS */}
                    <div
                      className="w-full max-w-[28px] rounded-t-sm transition-colors duration-150"
                      style={{
                        height: `${barHeightPx}px`,
                        backgroundColor: isHighest
                          ? "#2C2C2C"
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

          {/* X-axis Baseline & Labels */}
          <div className="flex justify-between gap-2 pl-28 pr-3 pt-2 border-t border-[#E5E5E0]">
            {data.map((item, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <div key={item.date} className="flex-1 text-center">
                  <span
                    className={`text-[10px] font-mono truncate block ${
                      isHovered ? "font-bold text-[#1A1A1A]" : "text-[#6B7280]"
                    }`}
                    title={item.date}
                  >
                    {item.dayLabel.split(" ")[0]}
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
