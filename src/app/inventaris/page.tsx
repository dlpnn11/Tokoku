"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Package, Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InventarisPage() {
  return (
    <AppShell title="INVENTARIS">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Manajemen Inventaris</h1>
            <p className="text-xs text-[#6B7280]">Kelola data produk, kategori, supplier, dan penyesuaian stok opname</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <ClipboardList className="w-4 h-4" />
              Stock Opname
            </Button>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Tambah Produk
            </Button>
          </div>
        </div>

        <div className="border border-dashed border-[#E5E5E0] bg-white rounded-xl p-10 text-center space-y-3">
          <Package className="w-12 h-12 text-[#6FA084] mx-auto" />
          <h3 className="font-bold text-base text-[#1A1A1A]">Tabel & Modul Inventaris</h3>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto">
            Halaman inventaris siap dikembangkan di <strong>Tahap 3</strong> dengan integrasi tabel Supabase, filter pencarian, dan modal stock opname.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
