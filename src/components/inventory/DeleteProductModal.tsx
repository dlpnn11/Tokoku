"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Archive, Trash2, CheckCircle2, ShieldAlert } from "lucide-react";
import { Product } from "@/types/database";

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  transactionCount: number;
  onConfirmArchive: (id: string) => Promise<void>;
  onConfirmDeletePermanently: (id: string) => Promise<void>;
}

export function DeleteProductModal({
  isOpen,
  onClose,
  product,
  transactionCount,
  onConfirmArchive,
  onConfirmDeletePermanently,
}: DeleteProductModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!product) return null;

  const handleArchive = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await onConfirmArchive(product.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengarsipkan produk.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermanent = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await onConfirmDeletePermanently(product.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menghapus produk secara permanen.");
    } finally {
      setLoading(false);
    }
  };

  const hasHistory = transactionCount > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hasHistory ? "Opsi Penghapusan Produk" : "Hapus Produk"}
      description={`Pengelolaan penghapusan inventaris untuk "${product.name}".`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-[#FDEAEA] border border-[#F8BEBE] text-[#D64545] text-xs rounded-xl flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Product Summary Card */}
        <div className="p-3 bg-[#F4F4F0] border border-[#E5E5E0] rounded-xl flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#1A1A1A] truncate">
              {product.name}
            </p>
            <p className="text-[11px] font-mono text-[#6B7280]">
              SKU: {product.sku} {product.barcode ? `• Barcode: ${product.barcode}` : ""}
            </p>
          </div>
          <span className="text-[10px] font-semibold bg-white border border-[#E5E5E0] px-2 py-0.5 rounded-md shrink-0 text-[#1A1A1A]">
            Stok: {product.current_stock} {product.unit}
          </span>
        </div>

        {/* Case 1: Product HAS transaction history */}
        {hasHistory ? (
          <div className="space-y-3">
            <div className="p-3.5 bg-[#FFF9E6] border border-[#FFE58F] rounded-xl flex items-start gap-2.5 text-xs text-[#874D00]">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#D48806] mt-0.5" />
              <div>
                <p className="font-bold text-[#1A1A1A]">
                  Produk Terhubung dengan {transactionCount} Transaksi Penjualan
                </p>
                <p className="text-[11px] text-[#595959] mt-0.5 leading-relaxed">
                  Barang ini sudah pernah terjual di kasir. Silakan pilih opsi penanganan di bawah ini:
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {/* Option A: Archive (Recommended) */}
              <div className="p-3.5 border border-[#6FA084]/50 bg-[#EBF3EE] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Archive className="w-4 h-4 text-[#6FA084]" />
                    <p className="text-xs font-bold text-[#1A1A1A]">
                      Arsipkan / Nonaktifkan (Direkomendasikan)
                    </p>
                  </div>
                  <p className="text-[11px] text-[#4B5563] mt-1">
                    Sembunyikan barang dari katalog kasir POS dan inventaris aktif. Laporan transaksi masa lalu tetap utuh & akurat.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleArchive}
                  disabled={loading}
                  className="bg-[#6FA084] hover:bg-[#58836B] text-white font-bold text-xs h-9 px-3.5 rounded-xl shrink-0 cursor-pointer shadow-2xs"
                >
                  Arsipkan Produk
                </Button>
              </div>

              {/* Option B: Force Delete (Cascade for test data) */}
              <div className="p-3.5 border border-[#F8BEBE] bg-[#FFF8F8] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-[#D64545]" />
                    <p className="text-xs font-bold text-[#D64545]">
                      Hapus Total & Bersihkan Riwayat
                    </p>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    Hapus produk secara permanen dari database beserta baris transaksi terkait (cocok untuk membersihkan data uji coba).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDeletePermanent}
                  disabled={loading}
                  className="border-[#D64545] text-[#D64545] hover:bg-[#FDEAEA] font-bold text-xs h-9 px-3.5 rounded-xl shrink-0 cursor-pointer"
                >
                  Hapus Total
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Case 2: Product has NO transaction history -> Direct clean delete */
          <div className="space-y-3">
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Apakah Anda yakin ingin menghapus produk ini secara permanen dari inventaris toko? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E0]">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
                className="text-xs h-9 px-4 rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleDeletePermanent}
                disabled={loading}
                className="bg-[#D64545] hover:bg-[#B83232] text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {loading ? "Menghapus..." : "Hapus Permanen"}
              </Button>
            </div>
          </div>
        )}

        {hasHistory && (
          <div className="flex justify-end pt-2 border-t border-[#E5E5E0]">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="text-xs h-9 px-4 rounded-xl"
            >
              Batal
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
