"use client";

import * as React from "react";
import { formatRupiah } from "@/lib/utils";
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

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 100000);
  const chartHeight = 220;

  // Grid steps (4 horizontal guide lines)
  const gridSteps = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="space-y-4">
      {/* Legend & Hover Info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#6FA084] inline-block" />
            <span className="text-[#6B7280] font-medium">Pendapatan Harian</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#2C2C2C] inline-block" />
            <span className="text-[#6B7280] font-medium">Hari Ini / Puncak</span>
          </div>
        </div>

        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="font-mono text-[11px] font-bold text-[#1A1A1A] bg-[#FAFBF9] border border-[#E5E5E0] px-2.5 py-1 rounded-md">
            {data[hoveredIndex].dayLabel}: {formatRupiah(data[hoveredIndex].revenue)} (
            {data[hoveredIndex].transactionsCount} transaksi)
          </div>
        )}
      </div>

      {/* Pure Flat Bar Chart Area */}
      <div className="select-none overflow-x-auto pt-4 pb-2">
        <div className="min-w-[420px]">
          {/* Main Chart Graphic (Height: 190px) */}
          <div className="relative" style={{ height: "190px" }}>
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
              {gridSteps.map((step, idx) => (
                <div key={idx} className="border-b border-[#F0F0EB] w-full flex items-center justify-start h-0">
                  <span className="text-[10px] font-mono text-[#9E9E9E] -translate-y-2 pr-2 select-none w-16 text-right shrink-0">
                    {step === 0 ? "Rp 0" : formatRupiah(maxRevenue * step)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bars Container — Placed exactly above grid lines */}
            <div className="absolute inset-0 flex items-end justify-between gap-2 pl-20 pr-3">
              {data.map((item, idx) => {
                const isHovered = hoveredIndex === idx;
                const isHighest = item.revenue === maxRevenue && item.revenue > 0;
                const barHeightPx = Math.max(
                  Math.round((item.revenue / maxRevenue) * 190),
                  item.revenue > 0 ? 6 : 2
                );

                return (
                  <div
                    key={item.date}
                    className="flex-1 flex justify-center items-end h-full group relative cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Floating Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white text-[10px] font-bold py-1 px-2.5 rounded-md shadow-md whitespace-nowrap z-30 pointer-events-none">
                        {item.dayLabel}: {formatRupiah(item.revenue)} ({item.transactionsCount} tx)
                      </div>
                    )}

                    {/* Flat Solid Bar — ZERO GRADIENTS */}
                    <div
                      className="w-full max-w-[28px] rounded-t-sm transition-all duration-150"
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
          <div className="flex justify-between gap-2 pl-20 pr-3 pt-2 border-t border-[#E5E5E0]">
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
