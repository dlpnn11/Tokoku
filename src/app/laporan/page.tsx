"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BarChart3, TrendingUp, Trophy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LaporanPage() {
  return (
    <AppShell title="LAPORAN KEUANGAN">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Laporan & Analitik Keuangan</h1>
          <p className="text-xs text-[#6B7280]">Analisis arus pendapatan, volume penjualan, dan produk terlaris toko</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Chart Placeholder (2 cols) */}
          <div className="lg:col-span-2 border border-dashed border-[#E5E5E0] bg-white rounded-xl p-10 text-center flex flex-col items-center justify-center space-y-3">
            <TrendingUp className="w-12 h-12 text-[#6FA084]" />
            <h3 className="font-bold text-base text-[#1A1A1A]">Grafik Pendapatan Harian & Tren</h3>
            <p className="text-xs text-[#6B7280] max-w-sm">
              Visualisasi grafik flat solid tanpa gradien akan diimplementasikan pada <strong>Tahap 6</strong>.
            </p>
          </div>

          {/* Best Sellers Card (1 col) */}
          <Card>
            <CardHeader className="border-b border-[#E5E5E0] pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#E8A838]" />
                Barang Terlaris (Best Sellers)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs text-[#6B7280]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F4F4F0]">
                <span className="font-semibold text-[#1A1A1A]">1. Aqua 600ml</span>
                <span className="font-bold text-[#6FA084]">3 pcs</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F4F4F0]">
                <span className="font-semibold text-[#1A1A1A]">2. Teh Botol Sosro</span>
                <span className="font-bold text-[#6FA084]">2 pcs</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
