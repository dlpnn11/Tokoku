"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/database";
import { ClipboardList, Plus, AlertCircle } from "lucide-react";

interface StockOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveOpname: (adjustments: { productId: string; newStock: number }[]) => Promise<void>;
}

export function StockOpnameModal({
  isOpen,
  onClose,
  products,
  onSaveOpname,
}: StockOpnameModalProps) {
  // Map of productId -> newStock
  const [stockMap, setStockMap] = React.useState<Record<string, number>>({});
  const [note, setNote] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      const initialMap: Record<string, number> = {};
      products.forEach((p) => {
        initialMap[p.id] = p.current_stock;
      });
      setStockMap(initialMap);
      setNote("");
      setSearch("");
    }
  }, [isOpen, products]);

  const handleStockChange = (productId: string, val: number) => {
    setStockMap((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleQuickAdd = (productId: string, delta: number) => {
    setStockMap((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + delta),
    }));
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  // Check changed products
  const changes = products.filter(
    (p) => stockMap[p.id] !== undefined && stockMap[p.id] !== p.current_stock
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changes.length === 0) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const adjustments = changes.map((p) => ({
        productId: p.id,
        newStock: stockMap[p.id],
      }));
      await onSaveOpname(adjustments);
      onClose();
    } catch (err: any) {
      alert("Gagal menyimpan opname: " + (err.message || "Error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Opname & Penyesuaian Stok"
      description="Sesuaikan stok fisik toko dengan pencatatan digital atau catat barang masuk kulakan."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner Info */}
        <div className="p-3 bg-[#FDF9F0] border border-[#F5D8A5] rounded-xl flex items-start gap-2.5 text-xs text-[#925C15]">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#C47D15] mt-0.5" />
          <div>
            <span className="font-bold">Tips Cepat:</span> Ketik jumlah fisik di rak, atau klik tombol <strong>+1 / +5</strong> jika ada barang kulakan baru datang untuk menambah stok secara instan.
          </div>
        </div>

        {/* Filter input */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Cari produk yang ingin diopname..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-xs"
          />
          {changes.length > 0 && (
            <span className="text-xs font-bold text-tokoku-primary shrink-0">
              {changes.length} produk diubah
            </span>
          )}
        </div>

        {/* Product Items Table */}
        <div className="max-h-[340px] overflow-y-auto border border-tokoku-border rounded-xl divide-y divide-tokoku-border">
          {filteredProducts.map((p) => {
            const currentSystem = p.current_stock;
            const currentPhysical = stockMap[p.id] ?? currentSystem;
            const diff = currentPhysical - currentSystem;

            return (
              <div
                key={p.id}
                className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-tokoku-row-hover transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-tokoku-text-primary block truncate">
                    {p.name}
                  </span>
                  <span className="text-[11px] text-tokoku-text-secondary">
                    SKU: {p.sku} • Stok Sistem: <strong>{currentSystem} {p.unit}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Quick Add Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(p.id, 1)}
                      className="px-2 py-1 text-[11px] bg-tokoku-bg hover:bg-tokoku-border rounded font-bold cursor-pointer transition-colors"
                      title="Tambah 1 barang datang"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(p.id, 5)}
                      className="px-2 py-1 text-[11px] bg-tokoku-bg hover:bg-tokoku-border rounded font-bold cursor-pointer transition-colors"
                      title="Tambah 5 barang datang"
                    >
                      +5
                    </button>
                  </div>

                  {/* Physical input */}
                  <div className="w-20">
                    <Input
                      type="number"
                      min="0"
                      value={currentPhysical}
                      onChange={(e) =>
                        handleStockChange(p.id, parseInt(e.target.value) || 0)
                      }
                      className="h-8 text-center text-xs font-bold px-1"
                    />
                  </div>

                  {/* Diff indicator */}
                  <div className="w-14 text-right">
                    {diff === 0 ? (
                      <span className="text-xs text-[#9E9E9E] font-medium">0</span>
                    ) : diff > 0 ? (
                      <span className="text-xs text-tokoku-primary font-bold">
                        +{diff}
                      </span>
                    ) : (
                      <span className="text-xs text-tokoku-danger font-bold">
                        {diff}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note input */}
        <div>
          <label className="text-xs font-semibold text-tokoku-text-primary block mb-1">
            Catatan Penyesuaian (Opsional)
          </label>
          <Input
            placeholder="Contoh: Audit fisik stok akhir bulan / Barang kulakan agen"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-tokoku-border">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" disabled={loading || changes.length === 0}>
            {loading ? "Menyimpan..." : `Simpan Opname (${changes.length})`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
