"use client";

import * as React from "react";
import { BestSellerProduct } from "@/services/reportService";
import { formatRupiah } from "@/lib/utils";
import { Trophy, Package } from "lucide-react";

interface BestSellersListProps {
  products: BestSellerProduct[];
}

export function BestSellersList({ products }: BestSellersListProps) {
  if (!products || products.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center text-[#6B7280] text-xs space-y-1">
        <Package className="w-8 h-8 text-[#D0D0CB]" />
        <p className="font-bold text-[#1A1A1A]">Belum Ada Data Penjualan</p>
        <p>Produk terlaris akan otomatis terakumulasi di sini.</p>
      </div>
    );
  }

  const maxQty = Math.max(...products.map((p) => p.quantitySold), 1);

  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-[#E8A838] text-white"; // Gold
      case 2:
        return "bg-[#9E9E9E] text-white"; // Silver
      case 3:
        return "bg-[#CD7F32] text-white"; // Bronze
      default:
        return "bg-[#F4F4F0] text-[#6B7280]";
    }
  };

  return (
    <div className="space-y-3">
      {products.map((product, idx) => {
        const rank = idx + 1;
        const progressPercent = Math.min((product.quantitySold / maxQty) * 100, 100);

        return (
          <div
            key={product.productId}
            className="p-3 bg-[#FAFBF9] border border-[#E5E5E0] rounded-xl space-y-2 hover:bg-[#F4F8F5] transition-colors"
          >
            {/* Top Row: Rank, Name, Category & Units */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${getRankBadgeStyle(
                    rank
                  )}`}
                >
                  {rank}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#1A1A1A] truncate" title={product.name}>
                    {product.name}
                  </p>
                  <p className="text-[10px] text-[#6B7280] truncate">
                    {product.categoryName}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-black text-xs text-[#1A1A1A] block">
                  {product.quantitySold} <span className="text-[10px] font-normal text-[#6B7280]">pcs</span>
                </span>
                <span className="text-[10px] font-bold text-[#6FA084]">
                  {formatRupiah(product.totalRevenue)}
                </span>
              </div>
            </div>

            {/* Flat Solid Progress Bar — ZERO GRADIENTS */}
            <div className="w-full h-1.5 bg-[#E5E5E0] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: rank === 1 ? "#E8A838" : "#6FA084",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
