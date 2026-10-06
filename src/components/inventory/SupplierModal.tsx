"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/database";
import { Search, Check, PackagePlus } from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    phone?: string;
    address?: string;
    productIds: string[];
  }) => Promise<void>;
  availableProducts?: Product[];
}

export function SupplierModal({
  isOpen,
  onClose,
  onSubmit,
  availableProducts = [],
}: SupplierModalProps) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [selectedProductIds, setSelectedProductIds] = React.useState<string[]>([]);
  const [productSearch, setProductSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Reset form when modal closes/opens
  React.useEffect(() => {
    if (!isOpen) {
      setName("");
      setPhone("");
      setAddress("");
      setSelectedProductIds([]);
      setProductSearch("");
    }
  }, [isOpen]);

  const filteredProducts = React.useMemo(() => {
    if (!productSearch.trim()) return availableProducts;
    const q = productSearch.toLowerCase();
    return availableProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [availableProducts, productSearch]);

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredProducts.map((p) => p.id);
    setSelectedProductIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleClearSelected = () => {
    setSelectedProductIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        productIds: selectedProductIds,
      });
      onClose();
    } catch (err: any) {
      alert("Gagal menambah supplier: " + (err.message || "Error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Supplier Baru"
      description="Catat kontak distributor mitra dan pilih produk yang dipasok oleh supplier ini."
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
            Nama Supplier / Toko Grosir <span className="text-[#D64545]">*</span>
          </label>
          <Input
            placeholder="Contoh: UD Minuman Nusantara"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
              Nomor Telepon / WhatsApp
            </label>
            <Input
              placeholder="Contoh: 081234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
              Alamat Gudang / Toko
            </label>
            <Input
              placeholder="Contoh: Jl. Pasar Induk No. 12"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        {/* Section: Tautkan Produk yang Dipasok */}
        <div className="pt-2 border-t border-[#E5E5E0]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <PackagePlus className="w-3.5 h-3.5 text-[#6FA084]" />
                Pilih Produk yang Dipasok (Opsional)
              </label>
              <p className="text-[11px] text-[#6B7280]">
                Tandai barang dagangan yang biasa dikulak dari supplier ini.
              </p>
            </div>
            <div className="text-[11px] font-bold text-[#6FA084] bg-[#F4F8F5] px-2 py-0.5 rounded-full border border-[#D5E5DC]">
              {selectedProductIds.length} dipilih
            </div>
          </div>

          {/* Search box for products */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Cari produk berdasarkan nama atau SKU..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          {/* Quick toggle buttons */}
          <div className="flex items-center justify-between text-[11px] text-[#6B7280] mb-2 px-1">
            <span>Ditemukan {filteredProducts.length} produk</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-[#6FA084] hover:underline cursor-pointer font-medium"
              >
                Pilih Semua
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleClearSelected}
                className="text-[#D64545] hover:underline cursor-pointer font-medium"
              >
                Reset Pilihan
              </button>
            </div>
          </div>

          {/* Product checklist scroll area */}
          <div className="border border-[#E5E5E0] rounded-xl max-h-44 overflow-y-auto divide-y divide-[#E5E5E0] bg-[#FAFBF9]">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#6B7280]">
                Tidak ada produk yang cocok dengan pencarian
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isChecked = selectedProductIds.includes(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={cn(
                      "p-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs",
                      isChecked ? "bg-[#EBF3EE]" : "hover:bg-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                          isChecked
                            ? "bg-[#6FA084] border-[#6FA084] text-white"
                            : "border-[#D0D0CB] bg-white"
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-[#1A1A1A] block truncate">
                          {product.name}
                        </span>
                        <span className="text-[10px] text-[#6B7280] font-mono">
                          {product.sku} • Stok: {product.current_stock} {product.unit}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-[#1A1A1A] block">
                        {formatRupiah(product.sell_price)}
                      </span>
                      <span className="text-[10px] text-[#6B7280]">
                        HPP: {formatRupiah(product.buy_price)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E5E0]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? "Menyimpan..." : "Tambah Supplier"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
