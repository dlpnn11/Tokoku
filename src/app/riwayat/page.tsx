"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { History, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RiwayatPage() {
  return (
    <AppShell title="RIWAYAT TRANSAKSI">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Riwayat Transaksi</h1>
            <p className="text-xs text-[#6B7280]">Daftar faktur nota penjualan kasir dan cetak ulang struk</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Calendar className="w-4 h-4" />
              Filter Tanggal
            </Button>
          </div>
        </div>

        <div className="border border-dashed border-[#E5E5E0] bg-white rounded-xl p-10 text-center space-y-3">
          <History className="w-12 h-12 text-[#6FA084] mx-auto" />
          <h3 className="font-bold text-base text-[#1A1A1A]">Tabel Riwayat Transaksi</h3>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto">
            Halaman riwayat nota transaksi dapat diakses oleh Kasir dan Pemilik, siap dikembangkan di <strong>Tahap 5</strong> lengkap dengan cetak thermal dan struk WhatsApp.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
