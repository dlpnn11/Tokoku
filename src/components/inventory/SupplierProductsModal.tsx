"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Supplier, Product } from "@/types/database";
import { inventoryService } from "@/services/inventoryService";
import { formatRupiah } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/select";
import {
  MessageSquare,
  MapPin,
  Phone,
  Package,
  Trash2,
  Plus,
  ExternalLink,
} from "lucide-react";

interface SupplierProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: (Supplier & { product_count?: number }) | null;
  allProducts: Product[];
  onRefresh: () => Promise<void>;
}

export function SupplierProductsModal({
  isOpen,
  onClose,
  supplier,
  allProducts,
  onRefresh,
}: SupplierProductsModalProps) {
  const [suppliedProducts, setSuppliedProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedAddProductId, setSelectedAddProductId] = React.useState("");
  const [addingProduct, setAddingProduct] = React.useState(false);

  const fetchSupplied = React.useCallback(async () => {
    if (!supplier) return;
    setLoading(true);
    try {
      const items = await inventoryService.getProductsBySupplier(supplier.id);
      setSuppliedProducts(items);
    } catch (err: any) {
      console.error("Gagal mengambil produk supplier:", err);
    } finally {
      setLoading(false);
    }
  }, [supplier]);

  React.useEffect(() => {
    if (isOpen && supplier) {
      fetchSupplied();
      setSelectedAddProductId("");
    }
  }, [isOpen, supplier, fetchSupplied]);

  if (!supplier) return null;

  // Products not currently supplied by this supplier
  const unassignedProducts = allProducts.filter(
    (p) => !suppliedProducts.some((sp) => sp.id === p.id)
  );

  const handleUnlink = async (productId: string, productName: string) => {
    if (
      confirm(`Lepas kaitan produk "${productName}" dari supplier "${supplier.name}"?`)
    ) {
      try {
        await inventoryService.removeProductFromSupplier(productId);
        await fetchSupplied();
        await onRefresh();
      } catch (err: any) {
        alert("Gagal melepaskan produk: " + (err.message || "Error"));
      }
    }
  };

  const handleAddProduct = async () => {
    if (!selectedAddProductId) return;
    setAddingProduct(true);
    try {
      await inventoryService.assignProductsToSupplier(supplier.id, [
        selectedAddProductId,
      ]);
      setSelectedAddProductId("");
      await fetchSupplied();
      await onRefresh();
    } catch (err: any) {
      alert("Gagal menambahkan produk: " + (err.message || "Error"));
    } finally {
      setAddingProduct(false);
    }
  };

  // WhatsApp link format
  const sanitizedPhone = supplier.phone
    ? supplier.phone.replace(/[^0-9]/g, "").replace(/^0/, "62")
    : null;

  const totalStockValue = suppliedProducts.reduce(
    (sum, p) => sum + Number(p.buy_price || 0) * Number(p.current_stock || 0),
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Produk Dipasok: ${supplier.name}`}
      description="Daftar seluruh barang dagangan yang dipasok oleh distributor ini."
      className="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Supplier Meta & Contact Card */}
        <div className="bg-[#FAFBF9] border border-[#E5E5E0] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1 text-xs">
            {supplier.phone && (
              <div className="flex items-center gap-2 text-[#1A1A1A]">
                <Phone className="w-3.5 h-3.5 text-[#6FA084]" />
                <span className="font-semibold">{supplier.phone}</span>
              </div>
            )}
            {supplier.address && (
              <div className="flex items-center gap-2 text-[#6B7280]">
                <MapPin className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>{supplier.address}</span>
              </div>
            )}
            <div className="text-[11px] text-[#6B7280] pt-1">
              Total Nilai Stok Kulakan:{" "}
              <strong className="text-[#1A1A1A]">{formatRupiah(totalStockValue)}</strong>
            </div>
          </div>

          {sanitizedPhone && (
            <a
              href={`https://wa.me/${sanitizedPhone}?text=Halo%20${encodeURIComponent(
                supplier.name
              )},%20saya%20dari%20TokoKu%20ingin%20kulakan%20barang`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba5a] transition-colors shrink-0 shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat WhatsApp
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Quick Add Product to Supplier Bar */}
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="text-xs font-bold text-[#1A1A1A] shrink-0">
            Tautkan Produk Lain:
          </div>
          <div className="flex-1">
            <CustomSelect
              value={selectedAddProductId}
              onChange={setSelectedAddProductId}
              placeholder="-- Pilih produk yang ingin ditautkan --"
              options={unassignedProducts.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.sku}) - Stok: ${p.current_stock}`,
              }))}
            />
          </div>
          <Button
            size="sm"
            onClick={handleAddProduct}
            disabled={!selectedAddProductId || addingProduct}
            className="gap-1.5 h-9 text-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {addingProduct ? "Menautkan..." : "Tautkan"}
          </Button>
        </div>

        {/* Product Table */}
        <div className="border border-[#E5E5E0] rounded-xl overflow-hidden bg-white">
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAFBF9] text-[#6B7280] font-bold border-b border-[#E5E5E0] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">NO</th>
                  <th className="py-2.5 px-3">PRODUK & SKU</th>
                  <th className="py-2.5 px-3 text-left">STOK</th>
                  <th className="py-2.5 px-3 text-left">HPP (KULAK)</th>
                  <th className="py-2.5 px-3 text-left">HARGA JUAL</th>
                  <th className="py-2.5 px-3 text-center w-14">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E0]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                      Memuat daftar produk...
                    </td>
                  </tr>
                ) : suppliedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                      <Package className="w-8 h-8 mx-auto text-[#D0D0CB] mb-1.5" />
                      Belum ada produk yang ditautkan ke supplier ini.
                    </td>
                  </tr>
                ) : (
                  suppliedProducts.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-[#FAFBF9] transition-colors">
                      <td className="py-2.5 px-3 text-center text-[#6B7280] font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[#1A1A1A] block">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-[#6B7280] font-mono">
                          {p.sku} • {p.category?.name || "-"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-left font-medium">
                        {p.current_stock === 0 ? (
                          <Badge variant="danger" className="text-[10px]">
                            Habis
                          </Badge>
                        ) : p.current_stock <= (p.minimum_stock || 5) ? (
                          <Badge variant="warning" className="text-[10px]">
                            {p.current_stock} {p.unit}
                          </Badge>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-[#1A1A1A] font-bold">
                              {p.current_stock}
                            </span>
                            <span className="text-[10px] text-[#6B7280]">
                              {p.unit}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-left font-medium text-[#1A1A1A]">
                        {formatRupiah(p.buy_price)}
                      </td>
                      <td className="py-2.5 px-3 text-left font-bold text-[#1A1A1A]">
                        {formatRupiah(p.sell_price)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleUnlink(p.id, p.name)}
                          className="p-1 text-[#6B7280] hover:text-[#D64545] hover:bg-[#FDEAEA] rounded transition-colors cursor-pointer"
                          title="Lepas dari supplier ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-[#E5E5E0]">
          <Button variant="ghost" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
