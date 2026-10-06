"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product, Category, Supplier } from "@/types/database";
import { formatRupiah } from "@/lib/utils";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: any) => Promise<void>;
  productToEdit?: Product | null;
  categories: Category[];
  suppliers: Supplier[];
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  productToEdit,
  categories,
  suppliers,
}: ProductFormModalProps) {
  const [name, setName] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [supplierId, setSupplierId] = React.useState("");
  const [buyPrice, setBuyPrice] = React.useState<number>(0);
  const [sellPrice, setSellPrice] = React.useState<number>(0);
  const [currentStock, setCurrentStock] = React.useState<number>(10);
  const [minimumStock, setMinimumStock] = React.useState<number>(5);
  const [unit, setUnit] = React.useState("pcs");
  const [isActive, setIsActive] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || "");
      setSku(productToEdit.sku || "");
      setCategoryId(productToEdit.category_id || "");
      setSupplierId(productToEdit.supplier_id || "");
      setBuyPrice(Number(productToEdit.buy_price) || 0);
      setSellPrice(Number(productToEdit.sell_price) || 0);
      setCurrentStock(Number(productToEdit.current_stock) || 0);
      setMinimumStock(Number(productToEdit.minimum_stock) || 5);
      setUnit(productToEdit.unit || "pcs");
      setIsActive(productToEdit.is_active ?? true);
    } else {
      setName("");
      // Generate unique default SKU if empty
      setSku(`PRD-${Math.floor(100 + Math.random() * 900)}`);
      setCategoryId(categories[0]?.id || "");
      setSupplierId(suppliers[0]?.id || "");
      setBuyPrice(0);
      setSellPrice(0);
      setCurrentStock(10);
      setMinimumStock(5);
      setUnit("pcs");
      setIsActive(true);
    }
    setErrorMsg("");
  }, [productToEdit, categories, suppliers, isOpen]);

  // Live calculation of margin
  const marginAmount = sellPrice - buyPrice;
  const marginPercent =
    buyPrice > 0 ? Math.round((marginAmount / buyPrice) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Nama produk wajib diisi");
      return;
    }
    if (!sku.trim()) {
      setErrorMsg("Kode SKU / Barcode wajib diisi");
      return;
    }
    if (!categoryId) {
      setErrorMsg("Kategori wajib dipilih");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await onSubmit({
        name: name.trim(),
        sku: sku.trim(),
        category_id: categoryId,
        supplier_id: supplierId || null,
        buy_price: Number(buyPrice) || 0,
        sell_price: Number(sellPrice) || 0,
        current_stock: Number(currentStock) || 0,
        minimum_stock: Number(minimumStock) || 5,
        unit,
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan produk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? `Edit Produk — ${productToEdit.name}` : "Tambah Produk Baru"}
      description="Lengkapi detail informasi barang untuk katalog POS dan inventaris toko."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-[#FDEAEA] border border-[#F8BEBE] text-[#D64545] text-xs rounded-lg font-medium">
            {errorMsg}
          </div>
        )}

        {/* Nama Produk */}
        <div>
          <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
            Nama Produk <span className="text-[#D64545]">*</span>
          </label>
          <Input
            placeholder="Contoh: Aqua 600ml / Indomie Goreng"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Kode SKU / Barcode & Satuan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
              Kode Barcode / SKU <span className="text-[#D64545]">*</span>
            </label>
            <Input
              placeholder="Barcode atau kode internal"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
              Satuan
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-[#E5E5E0] bg-white px-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#6FA084]"
            >
              <option value="pcs">pcs (buah / biji)</option>
              <option value="botol">botol</option>
              <option value="bungkus">bungkus</option>
              <option value="renteng">renteng</option>
              <option value="kotak">kotak</option>
              <option value="kg">kg (kilogram)</option>
              <option value="liter">liter</option>
              <option value="dus">dus / karton</option>
              <option value="kaleng">kaleng</option>
            </select>
          </div>
        </div>

        {/* Kategori & Supplier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
              Kategori <span className="text-[#D64545]">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-[#E5E5E0] bg-white px-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#6FA084]"
              required
            >
              <option value="" disabled>Pilih Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
              Supplier (Pemasok)
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-[#E5E5E0] bg-white px-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#6FA084]"
            >
              <option value="">Tidak Ada / Beli Eceran</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Harga Beli & Harga Jual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
              Harga Beli (Modal / HPP) <span className="text-[#D64545]">*</span>
            </label>
            <Input
              type="number"
              min="0"
              value={buyPrice}
              onChange={(e) => setBuyPrice(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
              Harga Jual (Kasir) <span className="text-[#D64545]">*</span>
            </label>
            <Input
              type="number"
              min="0"
              value={sellPrice}
              onChange={(e) => setSellPrice(Number(e.target.value))}
              required
            />
            {sellPrice > 0 && (
              <p
                className={`text-[11px] mt-1 font-semibold ${
                  marginAmount >= 0 ? "text-[#6FA084]" : "text-[#D64545]"
                }`}
              >
                Margin: {formatRupiah(marginAmount)} ({marginPercent}%)
              </p>
            )}
          </div>
        </div>

        {/* Stok Awal & Stok Minimum */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
              Stok Saat Ini
            </label>
            <Input
              type="number"
              min="0"
              value={currentStock}
              onChange={(e) => setCurrentStock(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
              Stok Minimum (Peringatan)
            </label>
            <Input
              type="number"
              min="1"
              value={minimumStock}
              onChange={(e) => setMinimumStock(Number(e.target.value))}
            />
            <p className="text-[10px] text-[#6B7280] mt-0.5">
              Peringatan menipis muncul jika stok ≤ angka ini.
            </p>
          </div>
        </div>

        {/* Status Aktif Switch */}
        <div className="flex items-center justify-between p-3 bg-[#F4F4F0] rounded-xl">
          <div>
            <span className="text-xs font-bold text-[#1A1A1A] block">
              Status Produk Aktif
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Produk aktif akan tampil di katalog terminal kasir POS
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              isActive ? "bg-[#6FA084]" : "bg-[#D1D5DB]"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                isActive ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E5E0]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Produk"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
