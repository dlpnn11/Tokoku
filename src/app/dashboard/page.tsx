"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DollarSign, ShoppingCart, Package, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <AppShell title="DASHBOARD">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Dashboard TokoKu</h1>
          <p className="text-xs text-[#6B7280]">Ringkasan performa penjualan dan inventaris toko hari ini</p>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <span className="text-xs text-[#6B7280]">Total Pendapatan Hari Ini</span>
              <DollarSign className="w-4 h-4 text-[#6FA084]" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-[#1A1A1A]">Rp 61.500</div>
              <p className="text-[11px] text-[#6FA084] mt-1 font-semibold">2 transaksi selesai</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <span className="text-xs text-[#6B7280]">Total Transaksi</span>
              <ShoppingCart className="w-4 h-4 text-[#6FA084]" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-[#1A1A1A]">2 Transaksi</div>
              <p className="text-[11px] text-[#6B7280] mt-1">Shift 1 & 2 Aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <span className="text-xs text-[#6B7280]">Produk Aktif</span>
              <Package className="w-4 h-4 text-[#6FA084]" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-[#1A1A1A]">22 SKU</div>
              <p className="text-[11px] text-[#6B7280] mt-1">Siap dijual di POS</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <span className="text-xs text-[#6B7280]">Stok Menipis</span>
              <AlertTriangle className="w-4 h-4 text-[#E8A838]" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-[#E8A838]">2 Produk</div>
              <p className="text-[11px] text-[#D64545] mt-1 font-semibold">Perlu restock segera</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
