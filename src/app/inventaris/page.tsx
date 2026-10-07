"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Package,
  Plus,
  ClipboardList,
  Search,
  Box,
  AlertTriangle,
  RotateCcw,
  Wallet,
  Bookmark,
  Truck,
  Edit2,
  Trash2,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Barcode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Product, Category, Supplier } from "@/types/database";
import { inventoryService, InventoryStats } from "@/services/inventoryService";
import { formatRupiah } from "@/lib/utils";
import { ProductFormModal } from "@/components/inventory/ProductFormModal";
import { ProductDetailModal } from "@/components/inventory/ProductDetailModal";
import { StockOpnameModal } from "@/components/inventory/StockOpnameModal";
import { CategoryModal } from "@/components/inventory/CategoryModal";
import { SupplierModal } from "@/components/inventory/SupplierModal";
import { SupplierProductsModal } from "@/components/inventory/SupplierProductsModal";
import { CategoryProductsModal } from "@/components/inventory/CategoryProductsModal";
import { CustomSelect } from "@/components/ui/select";

type ActiveTab = "produk" | "kategori" | "supplier";

export default function InventarisPage() {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("produk");

  // Data states
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<(Category & { product_count: number })[]>([]);
  const [suppliers, setSuppliers] = React.useState<(Supplier & { product_count: number })[]>([]);
  const [stats, setStats] = React.useState<InventoryStats>({
    totalSku: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValuation: 0,
  });
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [selectedStatus, setSelectedStatus] = React.useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isProductFormOpen, setIsProductFormOpen] = React.useState(false);
  const [productToEdit, setProductToEdit] = React.useState<Product | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [productDetail, setProductDetail] = React.useState<Product | null>(null);

  const [isStockOpnameOpen, setIsStockOpnameOpen] = React.useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = React.useState(false);

  // Supplier & Category Products Detail Modals
  const [isSupplierProductsOpen, setIsSupplierProductsOpen] = React.useState(false);
  const [selectedSupplierForDetail, setSelectedSupplierForDetail] = React.useState<(Supplier & { product_count?: number }) | null>(null);

  const [isCategoryProductsOpen, setIsCategoryProductsOpen] = React.useState(false);
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = React.useState<(Category & { product_count?: number }) | null>(null);

  // Category & Supplier Edit States
  const [categoryToEdit, setCategoryToEdit] = React.useState<Category | null>(null);
  const [supplierToEdit, setSupplierToEdit] = React.useState<(Supplier & { product_count?: number }) | null>(null);

  // Initial load
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [prods, cats, sups, statData] = await Promise.all([
        inventoryService.getProducts({
          search: search.trim() || undefined,
          categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
        }),
        inventoryService.getCategories(),
        inventoryService.getSuppliers(),
        inventoryService.getStats(),
      ]);

      setProducts(prods);
      setCategories(cats);
      setSuppliers(sups);
      setStats(statData);
    } catch (err: any) {
      console.error("Gagal memuat data inventaris:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedStatus]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Product CRUD Handlers
  const handleSaveProduct = async (productData: any) => {
    if (productToEdit) {
      await inventoryService.updateProduct(productToEdit.id, productData);
    } else {
      await inventoryService.createProduct(productData);
    }
    await loadData();
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`Apakah kamu yakin ingin menghapus produk "${name}"?`)) {
      try {
        await inventoryService.deleteProduct(id);
        await loadData();
      } catch (err: any) {
        alert("Gagal menghapus produk: " + (err.message || "Error"));
      }
    }
  };

  // Stock Opname Handler
  const handleSaveOpname = async (adjustments: { productId: string; newStock: number }[]) => {
    for (const adj of adjustments) {
      await inventoryService.adjustStock(adj.productId, adj.newStock);
    }
    await loadData();
  };

  // Category Handlers
  const handleSaveCategory = async (name: string, id?: string) => {
    if (id) {
      await inventoryService.updateCategory(id, name);
    } else {
      await inventoryService.createCategory(name);
    }
    setCategoryToEdit(null);
    await loadData();
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm(`Hapus kategori "${name}"? Produk dengan kategori ini mungkin perlu disesuaikan.`)) {
      try {
        await inventoryService.deleteCategory(id);
        await loadData();
      } catch (err: any) {
        alert("Gagal menghapus kategori: " + (err.message || "Error"));
      }
    }
  };

  // Supplier Handlers
  const handleSaveSupplier = async (
    data: {
      name: string;
      phone?: string;
      address?: string;
      productIds?: string[];
    },
    id?: string
  ) => {
    if (id) {
      await inventoryService.updateSupplierWithProducts(
        id,
        { name: data.name, phone: data.phone, address: data.address },
        data.productIds || []
      );
    } else {
      if (data.productIds && data.productIds.length > 0) {
        await inventoryService.createSupplierWithProducts(
          { name: data.name, phone: data.phone, address: data.address },
          data.productIds
        );
      } else {
        await inventoryService.createSupplier({
          name: data.name,
          phone: data.phone,
          address: data.address,
        });
      }
    }
    setSupplierToEdit(null);
    await loadData();
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (confirm(`Hapus supplier "${name}"?`)) {
      try {
        await inventoryService.deleteSupplier(id);
        await loadData();
      } catch (err: any) {
        alert("Gagal menghapus supplier: " + (err.message || "Error"));
      }
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AppShell title="INVENTARIS">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* TOP SUMMARY KPI CARDS (Matches Inventaris.png) */}
        {activeTab === "produk" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280] font-semibold tracking-wider uppercase">
                    TOTAL SKU AKTIF
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#F4F4F0] border border-[#E5E5E0] flex items-center justify-center text-[#6FA084] shrink-0">
                    <Box className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#1A1A1A] tracking-tight whitespace-nowrap">
                    {stats.totalSku} Produk
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280] font-semibold tracking-wider uppercase">
                    STOK MENIPIS (≤5)
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#FDF9F0] border border-[#F5D8A5] flex items-center justify-center text-[#E8A838] shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#E8A838] tracking-tight whitespace-nowrap">
                    {stats.lowStockCount} Produk
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280] font-semibold tracking-wider uppercase">
                    STOK HABIS (0)
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#FDEAEA] border border-[#F8BEBE] flex items-center justify-center text-[#D64545] shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#D64545] tracking-tight whitespace-nowrap">
                    {stats.outOfStockCount} Produk
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280] font-semibold tracking-wider uppercase">
                    NILAI INVENTARIS (HPP)
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#F4F4F0] border border-[#E5E5E0] flex items-center justify-center text-[#6FA084] shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#1A1A1A] tracking-tight whitespace-nowrap">
                    {formatRupiah(stats.totalValuation)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB CONTROLS (Produk, Kategori, Supplier) */}
        <div className="border border-[#E5E5E0] bg-white rounded-2xl p-5 shadow-sm space-y-5">
          <div className="border-b border-[#E5E5E0] pb-3 flex items-center gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveTab("produk")}
              className={`flex items-center gap-2 pb-2 transition-colors cursor-pointer relative ${
                activeTab === "produk"
                  ? "text-[#6FA084] font-bold"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Produk ({products.length})</span>
              {activeTab === "produk" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6FA084]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("kategori")}
              className={`flex items-center gap-2 pb-2 transition-colors cursor-pointer relative ${
                activeTab === "kategori"
                  ? "text-[#6FA084] font-bold"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Kategori ({categories.length})</span>
              {activeTab === "kategori" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6FA084]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("supplier")}
              className={`flex items-center gap-2 pb-2 transition-colors cursor-pointer relative ${
                activeTab === "supplier"
                  ? "text-[#6FA084] font-bold"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Supplier ({suppliers.length})</span>
              {activeTab === "supplier" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6FA084]" />
              )}
            </button>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: PRODUK                                                 */}
          {/* ============================================================== */}
          {activeTab === "produk" && (
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
                <div className="flex flex-1 flex-wrap items-center gap-2.5">
                  {/* Search */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
                    <Input
                      placeholder="Cari produk atau SKU..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-10 text-xs"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="w-full sm:w-48">
                    <CustomSelect
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                      placeholder="Semua Kategori"
                      options={[
                        { value: "all", label: "Semua Kategori" },
                        ...categories.map((c) => ({
                          value: c.id,
                          label: c.name,
                        })),
                      ]}
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="w-full sm:w-44">
                    <CustomSelect
                      value={selectedStatus}
                      onChange={setSelectedStatus}
                      placeholder="Semua Status"
                      options={[
                        { value: "all", label: "Semua Status" },
                        { value: "aktif", label: "Aktif di POS" },
                        { value: "menipis", label: "Stok Menipis (≤5)" },
                        { value: "habis", label: "Stok Habis (0)" },
                        { value: "non-aktif", label: "Non-aktif" },
                      ]}
                    />
                  </div>
                </div>

                {/* Right Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    className="gap-2 h-10 text-xs shrink-0"
                    onClick={() => setIsStockOpnameOpen(true)}
                  >
                    <ClipboardList className="w-4 h-4 text-[#6FA084]" />
                    Stock Opname
                  </Button>
                  <Button
                    className="gap-2 h-10 text-xs shrink-0"
                    onClick={() => {
                      setProductToEdit(null);
                      setIsProductFormOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Produk
                  </Button>
                </div>
              </div>

              {/* Table Products (Desktop & Scrollable Mobile) */}
              <div className="overflow-x-auto border border-[#E5E5E0] rounded-xl">
                <table className="w-full text-left text-xs divide-y divide-[#E5E5E0]">
                  <thead className="bg-[#F9F9F7] text-[#6B7280] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">KODE / BARCODE</th>
                      <th className="py-3 px-4">NAMA PRODUK</th>
                      <th className="py-3 px-4">KATEGORI</th>
                      <th className="py-3 px-4 text-left">STOK</th>
                      <th className="py-3 px-4">HARGA BELI</th>
                      <th className="py-3 px-4">HARGA JUAL</th>
                      <th className="py-3 px-4 text-left">STATUS</th>
                      <th className="py-3 px-4 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E0] bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#6B7280]">
                          Memuat data produk...
                        </td>
                      </tr>
                    ) : paginatedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#6B7280]">
                          Tidak ada produk yang cocok dengan pencarian.
                        </td>
                      </tr>
                    ) : (
                      paginatedProducts.map((p) => {
                        const isLow = p.current_stock <= p.minimum_stock;
                        const isOut = p.current_stock === 0;

                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-[#F9F9F7] transition-colors"
                          >
                            <td className="py-3.5 px-4 font-mono font-semibold text-[#1A1A1A]">
                              <div>{p.sku}</div>
                              {p.barcode ? (
                                <div className="text-[10px] text-[#6FA084] font-medium flex items-center gap-1 mt-0.5">
                                  <Barcode className="w-3 h-3 inline shrink-0" />
                                  <span>{p.barcode}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-[#9E9E9E] font-normal italic">
                                  Tanpa barcode
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#1A1A1A]">
                              {p.name}
                            </td>
                            <td className="py-3.5 px-4 text-[#6B7280]">
                              {p.category?.name || "-"}
                            </td>
                            <td className="py-3.5 px-4 text-left">
                              <div className="flex items-baseline gap-1.5">
                                <span
                                  className={`font-black text-sm ${
                                    isOut
                                      ? "text-[#D64545]"
                                      : isLow
                                      ? "text-[#E8A838]"
                                      : "text-[#6FA084]"
                                  }`}
                                >
                                  {p.current_stock}
                                </span>
                                <span className="text-[10px] text-[#6B7280]">
                                  {p.unit}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-[#6B7280]">
                              {formatRupiah(Number(p.buy_price))}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#1A1A1A]">
                              {formatRupiah(Number(p.sell_price))}
                            </td>
                            <td className="py-3.5 px-4 text-left">
                              <Badge
                                variant={p.is_active ? "success" : "kasir"}
                                className="text-[10px]"
                              >
                                {p.is_active ? "Aktif" : "Non-aktif"}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setProductDetail(p);
                                    setIsDetailModalOpen(true);
                                  }}
                                  className="p-1.5 hover:bg-[#F4F4F0] rounded text-[#6B7280] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                                  title="Lihat Detail"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setProductToEdit(p);
                                    setIsProductFormOpen(true);
                                  }}
                                  className="p-1.5 hover:bg-[#F4F4F0] rounded text-[#6B7280] hover:text-[#6FA084] transition-colors cursor-pointer"
                                  title="Edit Produk"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id, p.name)}
                                  className="p-1.5 hover:bg-[#FDEAEA] rounded text-[#6B7280] hover:text-[#D64545] transition-colors cursor-pointer"
                                  title="Hapus Produk"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between text-xs text-[#6B7280] pt-2">
                <span>
                  Menampilkan {paginatedProducts.length} dari {products.length} produk
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-bold text-[#1A1A1A] px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: KATEGORI                                               */}
          {/* ============================================================== */}
          {activeTab === "kategori" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#6B7280]">
                  Kategori memudahkan kasir mengelompokkan barang di terminal POS.
                </p>
                <Button
                  className="gap-2 h-9 text-xs"
                  onClick={() => setIsCategoryModalOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Tambah Kategori
                </Button>
              </div>

              <div className="overflow-x-auto border border-[#E5E5E0] rounded-xl">
                <table className="w-full text-left text-xs divide-y divide-[#E5E5E0]">
                  <thead className="bg-[#F9F9F7] text-[#6B7280] font-bold uppercase">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">NO.</th>
                      <th className="py-3 px-4">NAMA KATEGORI</th>
                      <th className="py-3 px-4 text-left w-40">JUMLAH PRODUK</th>
                      <th className="py-3 px-4 text-right w-28">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E0] bg-white">
                    {categories.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-[#F9F9F7] transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[#6B7280] text-center">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#1A1A1A]">
                          {c.name}
                        </td>
                        <td className="py-3.5 px-4 text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategoryForDetail(c);
                              setIsCategoryProductsOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F4F8F5] text-[#6FA084] border border-[#D5E5DC] hover:bg-[#6FA084] hover:text-white transition-colors cursor-pointer shadow-xs"
                            title="Klik untuk melihat daftar produk kategori ini"
                          >
                            <Box className="w-3.5 h-3.5" />
                            <span>{c.product_count} Produk</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setCategoryToEdit(c);
                                setIsCategoryModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-[#F4F8F5] rounded text-[#6B7280] hover:text-[#6FA084] transition-colors cursor-pointer"
                              title="Edit Kategori"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id, c.name)}
                              className="p-1.5 hover:bg-[#FDEAEA] rounded text-[#6B7280] hover:text-[#D64545] transition-colors cursor-pointer"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: SUPPLIER                                               */}
          {/* ============================================================== */}
          {activeTab === "supplier" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#6B7280]">
                  Daftar agen kulakan dan distributor mitra warung kelontong.
                </p>
                <Button
                  className="gap-2 h-9 text-xs"
                  onClick={() => {
                    setSupplierToEdit(null);
                    setIsSupplierModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Tambah Supplier
                </Button>
              </div>

              <div className="overflow-x-auto border border-[#E5E5E0] rounded-xl">
                <table className="w-full table-fixed text-left text-xs divide-y divide-[#E5E5E0]">
                  <thead className="bg-[#F9F9F7] text-[#6B7280] font-bold uppercase">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">NO.</th>
                      <th className="py-3 px-4 w-48">NAMA SUPPLIER</th>
                      <th className="py-3 px-4 w-36">NO. KONTAK / WA</th>
                      <th className="py-3 px-4">ALAMAT</th>
                      <th className="py-3 px-4 w-36 text-left">PRODUK DIPASOK</th>
                      <th className="py-3 px-4 w-28 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E0] bg-white">
                    {suppliers.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-[#F9F9F7] transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[#6B7280] text-center">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div
                            className="font-bold text-[#1A1A1A] truncate"
                            title={s.name}
                          >
                            {s.name}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div
                            className="text-[#6B7280] font-mono truncate"
                            title={s.phone || "-"}
                          >
                            {s.phone || "-"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div
                            className="text-[#6B7280] truncate"
                            title={s.address || "-"}
                          >
                            {s.address || "-"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupplierForDetail(s);
                              setIsSupplierProductsOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F4F8F5] text-[#6FA084] border border-[#D5E5DC] hover:bg-[#6FA084] hover:text-white transition-colors cursor-pointer shadow-xs truncate"
                            title="Klik untuk melihat dan kelola produk yang dipasok"
                          >
                            <Truck className="w-3.5 h-3.5 shrink-0" />
                            <span>{s.product_count} Produk</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedSupplierForDetail(s);
                                setIsSupplierProductsOpen(true);
                              }}
                              className="p-1.5 hover:bg-[#F4F8F5] rounded text-[#6B7280] hover:text-[#6FA084] transition-colors cursor-pointer"
                              title="Lihat Detail Produk"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSupplierToEdit(s);
                                setIsSupplierModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-[#F4F8F5] rounded text-[#6B7280] hover:text-[#6FA084] transition-colors cursor-pointer"
                              title="Edit Supplier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSupplier(s.id, s.name)}
                              className="p-1.5 hover:bg-[#FDEAEA] rounded text-[#6B7280] hover:text-[#D64545] transition-colors cursor-pointer"
                              title="Hapus Supplier"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ALL MODALS */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        onSubmit={handleSaveProduct}
        productToEdit={productToEdit}
        categories={categories}
        suppliers={suppliers}
      />

      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        product={productDetail}
        onEdit={(p) => {
          setProductToEdit(p);
          setIsProductFormOpen(true);
        }}
      />

      <StockOpnameModal
        isOpen={isStockOpnameOpen}
        onClose={() => setIsStockOpnameOpen(false)}
        products={products}
        onSaveOpname={handleSaveOpname}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryToEdit(null);
        }}
        onSubmit={handleSaveCategory}
        categoryToEdit={categoryToEdit}
      />

      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setSupplierToEdit(null);
        }}
        onSubmit={handleSaveSupplier}
        availableProducts={products}
        supplierToEdit={supplierToEdit}
      />

      {/* Detail Modals for Supplier and Category */}
      <SupplierProductsModal
        isOpen={isSupplierProductsOpen}
        onClose={() => {
          setIsSupplierProductsOpen(false);
          setSelectedSupplierForDetail(null);
        }}
        supplier={selectedSupplierForDetail}
        allProducts={products}
        onRefresh={loadData}
      />

      <CategoryProductsModal
        isOpen={isCategoryProductsOpen}
        onClose={() => {
          setIsCategoryProductsOpen(false);
          setSelectedCategoryForDetail(null);
        }}
        category={selectedCategoryForDetail}
        onFilterCategory={(catId) => {
          setActiveTab("produk");
          setSelectedCategory(catId);
        }}
      />
    </AppShell>
  );
}
