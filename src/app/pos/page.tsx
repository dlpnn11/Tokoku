"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Store, ShoppingCart, Search, QrCode } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PosPage() {
  return (
    <AppShell title="TERMINAL POS & INVENTORY">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
        {/* Left Column: 60% (7 cols on lg) Catalog Grid */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Search Bar + Scan Shortcut */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
              <Input
                placeholder="Cari produk atau scan barcode..."
                className="pl-10"
              />
            </div>
            <Button className="shrink-0 gap-1.5">
              <QrCode className="w-4 h-4" />
              Scan
            </Button>
          </div>

          {/* Placeholder Grid */}
          <div className="border border-dashed border-[#E5E5E0] bg-white rounded-xl p-8 text-center flex-1 flex flex-col items-center justify-center space-y-3">
            <Store className="w-12 h-12 text-[#6FA084]" />
            <h3 className="font-bold text-base text-[#1A1A1A]">Katalog Produk POS Kasir</h3>
            <p className="text-xs text-[#6B7280] max-w-sm">
              Navigasi layout dan rute kasir telah aktif. Di tahap berikutnya katalog produk interaktif dari Supabase akan ditampilkan di sini.
            </p>
          </div>
        </div>

        {/* Right Column: 40% (5 cols on lg) Cart */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="border-b border-[#E5E5E0] pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#6FA084]" />
                  Keranjang Belanja
                </CardTitle>
                <span className="text-xs text-[#6B7280]">0 item</span>
              </div>
            </CardHeader>
            <CardContent className="p-6 text-center text-xs text-[#6B7280] flex-1 flex items-center justify-center">
              Keranjang masih kosong
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
