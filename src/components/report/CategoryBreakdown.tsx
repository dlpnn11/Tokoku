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

  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <div key={cat.categoryId} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="font-bold text-[#1A1A1A]">{cat.categoryName}</span>
              <span className="text-[10px] text-[#6B7280]">
                ({cat.quantitySold} pcs)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-[#1A1A1A]">
                {formatRupiah(cat.totalRevenue)}
              </span>
              <span className="font-bold text-[10px] px-1.5 py-0.5 rounded-md bg-[#FAFBF9] border border-[#E5E5E0] text-[#6B7280]">
                {cat.percentage}%
              </span>
            </div>
          </div>

          {/* Flat Solid Bar — ZERO GRADIENTS */}
          <div className="w-full h-2 bg-[#F4F4F0] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${cat.percentage}%`,
                backgroundColor: cat.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
