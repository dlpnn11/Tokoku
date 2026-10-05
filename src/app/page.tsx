"use client";

import * as React from "react";
import { Store, ShoppingCart, Package, History, BarChart3, QrCode, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatRupiah } from "@/lib/utils";

export default function HomePage() {
  const [isTestModalOpen, setIsTestModalOpen] = React.useState(false);
  const [testNominal, setTestNominal] = React.useState<number>(50000);

  return (
    <div className="min-h-screen bg-[#F4F4F0] text-[#1A1A1A]">
      {/* Top Bar Preview */}
      <header className="h-16 border-b border-[#E5E5E0] bg-white px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#6FA084] flex items-center justify-center text-white font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-[#1A1A1A]">TokoKu</h1>
            <p className="text-xs text-[#6B7280]">Terminal POS & Inventaris Warung</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-[#6B7280] hidden sm:inline">
            Status Sistem: <strong className="text-[#6FA084]">Fondasi Aktif (Tahap 0 Selesai)</strong>
          </span>
          <Badge variant="default">Pemilik</Badge>
          <Badge variant="kasir">Kasir</Badge>
        </div>
      </header>

      {/* Main Content Showcase */}
      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
        <div className="border border-[#E5E5E0] bg-white p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-[#6FA084]" />
            <h2 className="text-xl font-bold text-[#1A1A1A]">Tahap 0: Fondasi & Design System Selesai</h2>
          </div>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Semua konfigurasi awal proyek Next.js TypeScript, dependensi inti (Zustand, Lucide, Supabase, Html5Qrcode),
            dan palet warna <strong>Flat Minimalist (Zero Gradient)</strong> telah berhasil terpasang dan lolos uji kompilasi.
          </p>
        </div>

        {/* Design System Tokens Showcase */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-[#1A1A1A]">Palet Warna & Token Komponen</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Sage Green (#6FA084)</CardTitle>
                <CardDescription>Aksen Utama & Status In-Stock</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-10 rounded-lg bg-[#6FA084] flex items-center justify-center text-white text-xs font-semibold">
                  Aksen Utama Solid
                </div>
                <Button className="w-full" size="sm">Tombol Primary</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Dark Charcoal (#2C2C2C)</CardTitle>
                <CardDescription>Bilah Samping (Sidebar Desktop)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-10 rounded-lg bg-[#2C2C2C] flex items-center justify-center text-white text-xs font-semibold">
                  Sidebar Background
                </div>
                <Button variant="charcoal" className="w-full" size="sm">Tombol Charcoal</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Status & Badge</CardTitle>
                <CardDescription>Peringatan Stok & Peran</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="success">Stok: 24</Badge>
                  <Badge variant="warning">Menipis (Sisa 3)</Badge>
                  <Badge variant="danger">Habis</Badge>
                </div>
                <Button variant="danger" className="w-full" size="sm">Tombol Danger</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Interaktivitas & Modal</CardTitle>
                <CardDescription>Verifikasi UI Flat Pop-up</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs text-[#6B7280]">
                  Nilai Test: <strong>{formatRupiah(testNominal)}</strong>
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  size="sm"
                  onClick={() => setIsTestModalOpen(true)}
                >
                  Buka Modal Test
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Modul Roadmap Cards */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-[#1A1A1A]">Peta Modul Sistem TokoKu (Siap Dikerjakan)</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-[#E5E5E0] rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-[#6FA084]">
                <Package className="w-5 h-5" />
                <h4 className="font-bold text-sm text-[#1A1A1A]">Tahap 1 & 3: Database & Inventaris</h4>
              </div>
              <p className="text-xs text-[#6B7280]">
                Skema 6 tabel Supabase, data seed warung Indonesia, modal tambah produk, dan stock opname.
              </p>
            </div>

            <div className="p-5 bg-white border border-[#E5E5E0] rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-[#6FA084]">
                <ShoppingCart className="w-5 h-5" />
                <h4 className="font-bold text-sm text-[#1A1A1A]">Tahap 4: Terminal POS Kasir</h4>
              </div>
              <p className="text-xs text-[#6B7280]">
                Split-screen katalog, keranjang Zustand, uang pas, tombol QRIS, dan atomic checkout RPC.
              </p>
            </div>

            <div className="p-5 bg-white border border-[#E5E5E0] rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-[#6FA084]">
                <QrCode className="w-5 h-5" />
                <h4 className="font-bold text-sm text-[#1A1A1A]">Tahap 4b: Mobile Barcode Scanner</h4>
              </div>
              <p className="text-xs text-[#6B7280]">
                Rute /scan di HP, audio beep instan, getar haptik, dan broadcast realtime Supabase ke desktop.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Test Modal Component */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Uji Coba Komponen Modal Flat"
        description="Komponen dialog modal 100% solid tanpa efek blur kaca atau gradien."
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#1A1A1A] block mb-1">
              Ubah Nominal Uji Coba:
            </label>
            <Input
              type="number"
              value={testNominal}
              onChange={(e) => setTestNominal(Number(e.target.value))}
              placeholder="Masukkan nominal..."
            />
          </div>

          <div className="p-3 bg-[#F4F4F0] rounded-lg text-xs space-y-1">
            <p className="text-[#6B7280]">Format Mata Uang Terformat:</p>
            <p className="text-base font-bold text-[#6FA084]">{formatRupiah(testNominal)}</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsTestModalOpen(false)}>
              Tutup
            </Button>
            <Button onClick={() => setIsTestModalOpen(false)}>
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
