"use client";

import * as React from "react";
import { CategorySalesData } from "@/services/reportService";
import { formatRupiah } from "@/lib/utils";
import { Layers } from "lucide-react";

interface CategoryBreakdownProps {
  categories: CategorySalesData[];
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-center text-[#6B7280] text-xs space-y-1">
        <Layers className="w-8 h-8 text-[#D0D0CB]" />
        <p className="font-bold text-[#1A1A1A]">Belum Ada Data Kategori</p>
        <p>Laporan penjualan per kategori akan muncul di sini.</p>
      </div>
    );
  }

  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-[#6FA084] text-white";
      case 2:
        return "bg-[#6FA084]/85 text-white";
      case 3:
        return "bg-[#6FA084]/70 text-white";
      default:
        return "bg-[#F4F4F0] text-[#6B7280] border border-[#E5E5E0]";
    }
  };

  return (
    <div className="space-y-3">
      {categories.map((cat, idx) => {
        const rank = idx + 1;

        return (
          <div key={cat.categoryId} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {/* Number Badge replacing rainbow bullet point */}
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${getRankBadgeStyle(
                    rank
                  )}`}
                >
                  {rank}
                </span>
                <span
                  className="font-bold text-[#1A1A1A] truncate"
                  title={cat.categoryName}
                >
                  {cat.categoryName}
                </span>
                <span className="text-[10px] text-[#6B7280] shrink-0">
                  ({cat.quantitySold} pcs)
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs font-black text-[#1A1A1A]">
                  {formatRupiah(cat.totalRevenue)}
                </span>
                <span className="font-bold text-[10px] px-1.5 py-0.5 rounded-md bg-[#F4F8F5] border border-[#D5E5DC] text-[#6FA084]">
                  {cat.percentage}%
                </span>
              </div>
            </div>

            {/* Flat Solid Bar — ZERO GRADIENTS, Solid TokoKu Sage Green */}
            <div className="w-full h-2 bg-[#F4F4F0] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 bg-[#6FA084]"
                style={{
                  width: `${cat.percentage}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
