"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Category, Product } from "@/types/database";
import { inventoryService } from "@/services/inventoryService";
import { formatRupiah } from "@/lib/utils";
import { Package, ExternalLink } from "lucide-react";

interface CategoryProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: (Category & { product_count?: number }) | null;
  onFilterCategory: (categoryId: string) => void;
}

export function CategoryProductsModal({
  isOpen,
  onClose,
  category,
  onFilterCategory,
}: CategoryProductsModalProps) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchCategoryProducts = React.useCallback(async () => {
    if (!category) return;
    setLoading(true);
    try {
      const items = await inventoryService.getProductsByCategory(category.id);
      setProducts(items);
    } catch (err: any) {
      console.error("Gagal mengambil produk kategori:", err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  React.useEffect(() => {
    if (isOpen && category) {
      fetchCategoryProducts();
    }
  }, [isOpen, category, fetchCategoryProducts]);

  if (!category) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Produk Kategori: ${category.name}`}
      description={`Daftar ${products.length} barang dagangan yang terdaftar dalam kategori ini.`}
      className="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Table of products */}
        <div className="border border-[#E5E5E0] rounded-xl overflow-hidden bg-white">
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAFBF9] text-[#6B7280] font-bold border-b border-[#E5E5E0] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">NO</th>
                  <th className="py-2.5 px-3">PRODUK & SKU</th>
                  <th className="py-2.5 px-3">SUPPLIER</th>
                  <th className="py-2.5 px-3 text-right">STOK</th>
                  <th className="py-2.5 px-3 text-right">HPP</th>
                  <th className="py-2.5 px-3 text-right">HARGA JUAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E0]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                      Memuat daftar produk...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                      <Package className="w-8 h-8 mx-auto text-[#D0D0CB] mb-1.5" />
                      Belum ada produk dalam kategori ini.
                    </td>
                  </tr>
                ) : (
                  products.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-[#FAFBF9] transition-colors">
                      <td className="py-2.5 px-3 text-center text-[#6B7280] font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[#1A1A1A] block">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-[#6B7280] font-mono">
                          {p.sku}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#6B7280]">
                        {p.supplier?.name || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {p.current_stock === 0 ? (
                          <Badge variant="danger" className="text-[10px]">
                            Habis
                          </Badge>
                        ) : p.current_stock <= (p.minimum_stock || 5) ? (
                          <Badge variant="warning" className="text-[10px]">
                            {p.current_stock} {p.unit}
                          </Badge>
                        ) : (
                          <span className="text-[#1A1A1A] font-bold">
                            {p.current_stock} {p.unit}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#1A1A1A]">
                        {formatRupiah(p.buy_price)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1A1A1A]">
                        {formatRupiah(p.sell_price)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E0]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onFilterCategory(category.id);
              onClose();
            }}
            className="gap-1.5 text-xs text-[#6FA084] border-[#6FA084] hover:bg-[#F4F8F5]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Filter di Tabel Produk Utama
          </Button>

          <Button variant="ghost" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
