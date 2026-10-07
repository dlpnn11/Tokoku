"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Wallet,
  Receipt,
  AlertTriangle,
  Package,
  Truck,
  Tags,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah, cn } from "@/lib/utils";
import { inventoryService } from "@/services/inventoryService";
import { reportService } from "@/services/reportService";
import { Product } from "@/types/database";

export default function DashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [todayRevenue, setTodayRevenue] = React.useState(0);
  const [todayTransactions, setTodayTransactions] = React.useState(0);
  const [activeProductsCount, setActiveProductsCount] = React.useState(0);
  const [suppliersCount, setSuppliersCount] = React.useState(0);
  const [categoriesCount, setCategoriesCount] = React.useState(0);
  const [lowStockProducts, setLowStockProducts] = React.useState<Product[]>([]);
  const [updateTime, setUpdateTime] = React.useState("");

  const loadDashboardData = React.useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      setUpdateTime(
        now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
      );

      // 1. Report for today
      const todayReport = await reportService.getFinancialReport(todayStr, todayStr);
      setTodayRevenue(todayReport.totalRevenue);
      setTodayTransactions(todayReport.totalTransactions);

      // 2. Inventory stats & low stock
      const allProducts = await inventoryService.getProducts();
      setActiveProductsCount(allProducts.filter((p) => p.is_active).length);

      // Filter products needing attention (stok <= min_stock or stok <= 5)
      const lowStock = allProducts.filter(
        (p) => p.current_stock <= (p.minimum_stock || 5)
      );
      setLowStockProducts(lowStock.slice(0, 8));

      // 3. Suppliers & Categories
      const suppliers = await inventoryService.getSuppliers();
      setSuppliersCount(suppliers.length);

      const categories = await inventoryService.getCategories();
      setCategoriesCount(categories.length);
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <AppShell title="DASHBOARD">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Dashboard TokoKu</h1>
            <p className="text-xs text-[#6B7280]">
              Ringkasan performa penjualan dan inventaris toko hari ini
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/pos">
              <Button size="sm" className="gap-2 bg-[#6FA084] hover:bg-[#58836B] text-white text-xs font-bold">
                <ShoppingBag className="w-4 h-4" />
                Buka Kasir POS
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* SECTION 1: TOP 2 SUMMARY CARDS (Matching StitchAI Screen 1) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CARD A: Total Pendapatan Hari Ini */}
          <div className="bg-white border border-[#E5E5E0] rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAFBF9] border border-[#E5E5E0] flex items-center justify-center text-[#6FA084]">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#6B7280] block">
                    Total Pendapatan Hari Ini
                  </span>
                  <span className="text-[11px] text-[#9E9E9E]">
                    Update: {updateTime || "Hari ini"}
                  </span>
                </div>
              </div>

              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EAF3EC] text-[#6FA084]">
                Hari Ini
              </span>
            </div>

            <p className="text-3xl font-black text-[#1A1A1A]">
              {formatRupiah(todayRevenue)}
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-[#F0F0EB] text-xs text-[#6FA084] font-semibold">
              <TrendingUp className="w-4 h-4" />
              <span>Pendapatan dari transaksi kasir selesai</span>
            </div>
          </div>

          {/* CARD B: Total Transaksi Hari Ini */}
          <div className="bg-white border border-[#E5E5E0] rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAFBF9] border border-[#E5E5E0] flex items-center justify-center text-[#6FA084]">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#6B7280] block">
                    Total Transaksi Hari Ini
                  </span>
                  <span className="text-[11px] text-[#9E9E9E]">
                    Update: {updateTime || "Hari ini"}
                  </span>
                </div>
              </div>

              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FAFBF9] border border-[#E5E5E0] text-[#1A1A1A]">
                Kasir Aktif
              </span>
            </div>

            <p className="text-3xl font-black text-[#1A1A1A]">
              {todayTransactions}{" "}
              <span className="text-sm font-normal text-[#6B7280]">transaksi selesai</span>
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-[#F0F0EB] text-xs text-[#6B7280]">
              <span>Pelanggan terlayani di terminal kasir</span>
              <Link
                href="/riwayat"
                className="text-[#6FA084] hover:underline font-bold flex items-center gap-1"
              >
                Lihat Riwayat <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* SECTION 2: LOW STOCK ALERT TABLE (Matching StitchAI Screen 1) */}
        <div className="bg-white border border-[#E5E5E0] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FFF9ED] border border-[#F5D8A5] flex items-center justify-center text-[#E8A838]">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#1A1A1A]">
                  Peringatan Stok Menipis
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Barang dengan stok di bawah batas minimum yang perlu segera di-restock
                </p>
              </div>
            </div>

            <Link href="/inventaris">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold border-[#6FA084] text-[#6FA084] hover:bg-[#F4F8F5] gap-1.5"
              >
                Lihat Semua Stok
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto border border-[#E5E5E0] rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFBF9] border-b border-[#E5E5E0] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider h-10">
                  <th className="py-2.5 px-4">Kode Barang</th>
                  <th className="py-2.5 px-4">Nama Produk</th>
                  <th className="py-2.5 px-4">Kategori</th>
                  <th className="py-2.5 px-4 text-left">Stok Saat Ini</th>
                  <th className="py-2.5 px-4 text-left">Batas Minimum</th>
                  <th className="py-2.5 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E0]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-[#6FA084]" />
                      Memeriksa stok gudang...
                    </td>
                  </tr>
                ) : lowStockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6FA084]">
                      <span className="font-bold">Semua stok produk dalam kondisi aman!</span>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        Tidak ada barang yang berada di bawah stok minimum saat ini.
                      </p>
                    </td>
                  </tr>
                ) : (
                  lowStockProducts.map((p) => {
                    const isCritical = p.current_stock <= 0 || p.current_stock <= 2;
                    return (
                      <tr key={p.id} className="hover:bg-[#F9F9F7] transition-colors h-12">
                        <td className="py-2.5 px-4 font-mono font-bold text-[#1A1A1A]">
                          {p.sku}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-[#1A1A1A]">
                          {p.name}
                        </td>
                        <td className="py-2.5 px-4 text-[#6B7280]">
                          {(p as any).category?.name || "Kategori"}
                        </td>
                        <td className="py-2.5 px-4 text-left">
                          <div className="flex items-baseline gap-1 font-black text-[#1A1A1A]">
                            <span>{p.current_stock}</span>
                            <span className="text-[10px] font-normal text-[#6B7280]">{p.unit}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-left">
                          <div className="flex items-baseline gap-1 text-[#6B7280]">
                            <span className="font-medium text-[#1A1A1A]">{p.minimum_stock || 5}</span>
                            <span className="text-[10px]">{p.unit}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-left">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-black inline-block",
                              isCritical
                                ? "bg-[#D64545] text-white"
                                : "bg-[#E8A838] text-white"
                            )}
                          >
                            {isCritical ? "Kritis" : "Menipis"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: QUICK STATS ROW (Matching StitchAI Screen 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-4 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#6B7280] block">
                Produk Aktif
              </span>
              <p className="text-2xl font-black text-[#1A1A1A]">
                {activeProductsCount} <span className="text-xs font-normal text-[#6B7280]">SKU</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FAFBF9] border border-[#E5E5E0] flex items-center justify-center text-[#6FA084]">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-[#E5E5E0] rounded-xl p-4 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#6B7280] block">
                Supplier Aktif
              </span>
              <p className="text-2xl font-black text-[#1A1A1A]">
                {suppliersCount}{" "}
                <span className="text-xs font-normal text-[#6B7280]">mitra</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FAFBF9] border border-[#E5E5E0] flex items-center justify-center text-[#6FA084]">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-[#E5E5E0] rounded-xl p-4 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#6B7280] block">
                Kategori Produk
              </span>
              <p className="text-2xl font-black text-[#1A1A1A]">
                {categoriesCount}{" "}
                <span className="text-xs font-normal text-[#6B7280]">kategori</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FAFBF9] border border-[#E5E5E0] flex items-center justify-center text-[#6FA084]">
              <Tags className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
