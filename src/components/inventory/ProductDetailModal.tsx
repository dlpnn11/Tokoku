"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import { Package, Edit2 } from "lucide-react";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (product: Product) => void;
}

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onEdit,
}: ProductDetailModalProps) {
  if (!product) return null;

  const margin = Number(product.sell_price) - Number(product.buy_price);
  const marginPercent =
    Number(product.buy_price) > 0
      ? Math.round((margin / Number(product.buy_price)) * 100)
      : 0;

  const isLowStock = product.current_stock <= product.minimum_stock;
  const isOutOfStock = product.current_stock === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Produk"
      description={
        product.barcode
          ? `Kode SKU: ${product.sku} • Barcode: ${product.barcode}`
          : `Kode SKU: ${product.sku}`
      }
      maxWidth="lg"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          {/* Left Column (4 cols): Product Icon Badge */}
          <div className="md:col-span-4 bg-[#F4F4F0] rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-3 border border-[#E5E5E0]">
            <div className="w-20 h-20 rounded-2xl bg-white border border-[#E5E5E0] flex items-center justify-center text-[#6FA084] shadow-sm">
              <span className="text-3xl font-extrabold">
                {product.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#1A1A1A] line-clamp-2">
                {product.name}
              </h4>
              <p className="text-[11px] text-[#6B7280]">{product.category?.name || "Kategori"}</p>
            </div>
            <Badge variant={product.is_active ? "success" : "kasir"}>
              {product.is_active ? "Aktif di POS" : "Non-Aktif"}
            </Badge>
          </div>

          {/* Right Column (8 cols): Specifications Table */}
          <div className="md:col-span-8 space-y-3">
            {/* Box 1: Info Dasar & Barcode */}
            <div className="p-3.5 bg-white border border-[#E5E5E0] rounded-xl grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-[#6B7280] block">Kode SKU (Internal)</span>
                <span className="font-bold text-[#1A1A1A] font-mono">
                  {product.sku}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B7280] block">Nomor Barcode Fisik</span>
                <span className="font-bold text-[#1A1A1A] font-mono">
                  {product.barcode || (
                    <span className="text-[#9E9E9E] font-normal italic">
                      Tidak ada barcode
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B7280] block">Kategori</span>
                <span className="font-bold text-[#1A1A1A]">
                  {product.category?.name || "-"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B7280] block">Supplier</span>
                <span className="font-bold text-[#1A1A1A]">
                  {product.supplier?.name || "Beli Eceran"}
                </span>
              </div>
            </div>

            {/* Box 2: Harga & Margin */}
            <div className="p-3.5 bg-white border border-[#E5E5E0] rounded-xl grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-[#6B7280] block">Harga Beli</span>
                <span className="font-bold text-[#1A1A1A]">
                  {formatRupiah(Number(product.buy_price))}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B7280] block">Harga Jual</span>
                <span className="font-bold text-[#6FA084]">
                  {formatRupiah(Number(product.sell_price))}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B7280] block">Keuntungan (Margin)</span>
                <span className="font-bold text-[#6FA084]">
                  {formatRupiah(margin)} ({marginPercent}%)
                </span>
              </div>
            </div>

            {/* Box 3: Stok */}
            <div className="p-3.5 bg-white border border-[#E5E5E0] rounded-xl grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-[#6B7280] block">Stok Fisik</span>
                <span
                  className={`font-bold text-sm ${
                    isOutOfStock
                      ? "text-[#D64545]"
                      : isLowStock
                      ? "text-[#E8A838]"
                      : "text-[#1A1A1A]"
                  }`}
                >
                  {product.current_stock} {product.unit}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B7280] block">Batas Min</span>
                <span className="font-semibold text-[#1A1A1A]">
                  {product.minimum_stock} {product.unit}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B7280] block">Status Stok</span>
                {isOutOfStock ? (
                  <Badge variant="danger">Habis</Badge>
                ) : isLowStock ? (
                  <Badge variant="warning">Menipis</Badge>
                ) : (
                  <Badge variant="success">Aman</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-3 border-t border-[#E5E5E0]">
          <Button variant="ghost" onClick={onClose}>
            Tutup
          </Button>
          <Button
            className="gap-1.5"
            onClick={() => {
              onClose();
              onEdit(product);
            }}
          >
            <Edit2 className="w-4 h-4" />
            Edit Produk Ini
          </Button>
        </div>
      </div>
    </Modal>
  );
}
