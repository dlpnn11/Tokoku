"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product, Category, Supplier } from "@/types/database";
import { formatRupiah, roundPrice500 } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/select";
import { Barcode, Camera, Sparkles, Smartphone, CheckCircle2 } from "lucide-react";
import { ProductInputSchema, formatZodError } from "@/lib/schemas";
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { ProductBarcodeScannerModal } from "./ProductBarcodeScannerModal";
import {
  lookupBarcodeDetails,
  BarcodeLookupResult,
} from "@/services/barcodeCatalogService";
import { playBeep } from "@/lib/audio";
import { supabase } from "@/lib/supabase";
import { SCANNER_SYNC_CHANNEL } from "@/lib/scannerSecurity";

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
  const [barcode, setBarcode] = React.useState("");
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

  // Barcode Scanning & Auto-Lookup States
  const [isScannerModalOpen, setIsScannerModalOpen] = React.useState(false);
  const [detectedProductInfo, setDetectedProductInfo] =
    React.useState<BarcodeLookupResult | null>(null);
  const [isSearchingCatalog, setIsSearchingCatalog] = React.useState(false);

  // Core function to process scanned or typed barcode and query master catalog
  const processBarcodeValue = React.useCallback(
    async (rawCode: string, isFromScanner = false) => {
      const cleanCode = rawCode.trim();
      setBarcode(cleanCode);

      // Auto-update SKU if empty or still on default auto-generated prefix
      setSku((prev) => (!prev || prev.startsWith("PRD-") ? cleanCode : prev));

      if (cleanCode.length >= 8) {
        setIsSearchingCatalog(true);
        try {
          const result = await lookupBarcodeDetails(cleanCode);
          if (result.found && result.name) {
            setDetectedProductInfo(result);

            // Auto-fill product name if empty or creating new product
            setName((prev) =>
              !prev || prev.startsWith("PRD-") || !productToEdit ? result.name! : prev
            );

            // Auto-select matched category
            if (result.categoryName) {
              const matchedCategory = categories.find(
                (c) =>
                  c.name.toLowerCase() === result.categoryName!.toLowerCase()
              );
              if (matchedCategory) {
                setCategoryId(matchedCategory.id);
              }
            }

            // Auto-select unit
            if (result.unit) {
              setUnit(result.unit);
            }

            // Auto-populate suggested prices for new items
            if (!productToEdit) {
              if (result.suggestedBuyPrice) {
                setBuyPrice((prev) => (prev === 0 ? result.suggestedBuyPrice! : prev));
              }
              if (result.suggestedSellPrice) {
                setSellPrice((prev) => (prev === 0 ? result.suggestedSellPrice! : prev));
              }
            }
          } else {
            setDetectedProductInfo(null);
          }
        } catch (err) {
          console.warn("Catalog lookup error:", err);
        } finally {
          setIsSearchingCatalog(false);
        }
      } else {
        setDetectedProductInfo(null);
      }
    },
    [categories, productToEdit]
  );

  // Realtime Supabase Sync: Catch barcodes scanned on HP while this modal is open
  React.useEffect(() => {
    if (!isOpen) return;

    const channel = supabase.channel(SCANNER_SYNC_CHANNEL);
    channel
      .on("broadcast", { event: "BARCODE_SCANNED" }, ({ payload }) => {
        const code = (payload?.barcode || payload?.sku || "").trim();
        if (code) {
          playBeep();
          processBarcodeValue(code, true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, processBarcodeValue]);

  React.useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || "");
      setSku(productToEdit.sku || "");
      setBarcode(productToEdit.barcode || "");
      setCategoryId(productToEdit.category_id || "");
      setSupplierId(productToEdit.supplier_id || "");
      setBuyPrice(Number(productToEdit.buy_price) || 0);
      setSellPrice(Number(productToEdit.sell_price) || 0);
      setCurrentStock(Number(productToEdit.current_stock) || 0);
      setMinimumStock(Number(productToEdit.minimum_stock) || 5);
      setUnit(productToEdit.unit || "pcs");
      setIsActive(productToEdit.is_active ?? true);
      setDetectedProductInfo(null);
    } else {
      setName("");
      // Generate unique default SKU if empty
      setSku(`PRD-${Math.floor(100 + Math.random() * 900)}`);
      setBarcode("");
      setCategoryId(categories[0]?.id || "");
      setSupplierId(suppliers[0]?.id || "");
      setBuyPrice(0);
      setSellPrice(0);
      setCurrentStock(10);
      setMinimumStock(5);
      setUnit("pcs");
      setIsActive(true);
      setDetectedProductInfo(null);
    }
    setErrorMsg("");
  }, [productToEdit, categories, suppliers, isOpen]);

  // Live calculation of margin
  const marginAmount = sellPrice - buyPrice;
  const marginPercent =
    buyPrice > 0 ? Math.round((marginAmount / buyPrice) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const payload = {
      name: name.trim(),
      sku: sku.trim(),
      barcode: barcode.trim() ? barcode.trim() : null,
      category_id: categoryId,
      supplier_id: supplierId || null,
      buy_price: Number(buyPrice) || 0,
      sell_price: roundPrice500(Number(sellPrice) || 0),
      current_stock: Number(currentStock) || 0,
      minimum_stock: Number(minimumStock) || 5,
      unit,
      is_active: isActive,
    };

    const validation = ProductInputSchema.safeParse(payload);
    if (!validation.success) {
      setErrorMsg(formatZodError(validation.error));
      return;
    }

    setLoading(true);

    try {
      await onSubmit(validation.data);
      onClose();
    } catch (err: any) {
      setErrorMsg(
        getSafeErrorMessage(err, {
          fallbackMessage: "Gagal menyimpan data produk.",
          context: "ProductFormModal",
        })
      );
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

        {/* Detected Product Auto-fill Notification Banner */}
        {detectedProductInfo && (
          <div className="p-3 bg-[#EBF3EE] border border-[#6FA084] rounded-xl flex items-start gap-2.5 text-xs text-[#2C6E49] animate-in fade-in">
            <Sparkles className="w-4 h-4 shrink-0 text-[#6FA084] mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-[#1A1A1A]">
                  ✨ Data Produk Terdeteksi Otomatis:
                </p>
                <span className="text-[10px] bg-white text-[#6FA084] font-bold px-2 py-0.5 rounded-full border border-[#6FA084]/40 shrink-0">
                  {detectedProductInfo.source === "local_catalog"
                    ? "Katalog Resmi Indonesia (Offline)"
                    : "Open Food Facts (Cloud)"}
                </span>
              </div>
              <p className="font-bold text-sm text-[#1A1A1A] mt-0.5">
                {detectedProductInfo.name}
              </p>
              <p className="text-[11px] text-[#4B5563] mt-0.5">
                Kategori: <b className="text-[#1A1A1A]">{detectedProductInfo.categoryName}</b> • Satuan:{" "}
                <b className="text-[#1A1A1A]">{detectedProductInfo.unit}</b>
                {detectedProductInfo.suggestedSellPrice
                  ? ` • Rekomendasi Jual: Rp ${detectedProductInfo.suggestedSellPrice.toLocaleString("id-ID")}`
                  : ""}
              </p>
              <p className="text-[10px] text-[#6B7280] mt-1 italic">
                *Nama dan kategori di atas telah diisi otomatis. Anda dapat mengubah harga, stok, atau nama jika diinginkan.
              </p>
            </div>
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

        {/* Kode SKU (Wajib) & Nomor Barcode (Opsional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
              Kode SKU (Internal) <span className="text-[#D64545]">*</span>
            </label>
            <Input
              placeholder="Contoh: PRD-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
            <p className="text-[10px] text-[#6B7280] mt-0.5">
              Kode unik toko untuk pencatatan internal & opname.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-[#6FA084]" />
                Nomor Barcode Fisik
              </label>
              <button
                type="button"
                onClick={() => setIsScannerModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6FA084] hover:text-[#58836B] hover:underline cursor-pointer bg-[#EBF3EE] px-2 py-0.5 rounded-md transition-colors"
                title="Buka kamera laptop atau HP untuk scan barcode otomatis"
              >
                <Camera className="w-3 h-3" />
                Scan Barcode
              </button>
            </div>
            <div className="relative">
              <Input
                placeholder="Contoh: 8999999500245 (scan/ketik)"
                value={barcode}
                onChange={(e) => processBarcodeValue(e.target.value)}
                className="pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setIsScannerModalOpen(true)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6FA084] hover:text-[#58836B] p-1 cursor-pointer"
                title="Pindai barcode via kamera"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-[#6B7280] mt-0.5 flex items-center justify-between">
              <span>Bisa scan via kamera laptop atau scanner HP.</span>
              {isSearchingCatalog && (
                <span className="text-[#6FA084] font-semibold animate-pulse">
                  Mencari katalog...
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Kategori & Satuan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
              Kategori <span className="text-[#D64545]">*</span>
            </label>
            <CustomSelect
              value={categoryId}
              onChange={setCategoryId}
              placeholder="Pilih Kategori"
              options={categories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              }))}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
              Satuan
            </label>
            <CustomSelect
              value={unit}
              onChange={setUnit}
              options={[
                { value: "pcs", label: "pcs (buah / biji)" },
                { value: "botol", label: "botol" },
                { value: "bungkus", label: "bungkus" },
                { value: "renteng", label: "renteng" },
                { value: "kotak", label: "kotak" },
                { value: "kg", label: "kg (kilogram)" },
                { value: "liter", label: "liter" },
                { value: "dus", label: "dus / karton" },
                { value: "kaleng", label: "kaleng" },
              ]}
            />
          </div>
        </div>

        {/* Supplier (Pemasok) */}
        <div>
          <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
            Supplier (Pemasok)
          </label>
          <CustomSelect
            value={supplierId}
            onChange={setSupplierId}
            placeholder="Pilih Supplier"
            options={[
              { value: "", label: "Tidak Ada / Beli Eceran" },
              ...suppliers.map((sup) => ({
                value: sup.id,
                label: sup.name,
              })),
            ]}
          />
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#1A1A1A]">
                Harga Jual (Kasir) <span className="text-[#D64545]">*</span>
              </label>
              {sellPrice > 0 && sellPrice % 500 !== 0 && (
                <button
                  type="button"
                  onClick={() => setSellPrice(roundPrice500(sellPrice))}
                  className="text-[10px] font-bold text-[#6FA084] hover:text-[#58836B] underline"
                >
                  Bulatkan: {formatRupiah(roundPrice500(sellPrice))}
                </button>
              )}
            </div>
            <Input
              type="number"
              step="500"
              min="0"
              value={sellPrice}
              onChange={(e) => setSellPrice(Number(e.target.value))}
              onBlur={() => {
                if (sellPrice > 0) setSellPrice(roundPrice500(sellPrice));
              }}
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

      {/* Embedded Barcode Camera Scanner Modal */}
      <ProductBarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScan={(code) => processBarcodeValue(code, true)}
      />
    </Modal>
  );
}
