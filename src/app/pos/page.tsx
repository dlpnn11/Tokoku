"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCatalog } from "@/components/pos/ProductCatalog";
import { CartPanel } from "@/components/pos/CartPanel";
import { ScannerPairingModal } from "@/components/pos/ScannerPairingModal";
import { ReceiptModal } from "@/components/pos/ReceiptModal";
import { Product, Category } from "@/types/database";
import { inventoryService } from "@/services/inventoryService";
import { transactionService } from "@/services/transactionService";
import { useCartStore, CartItem } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { playBeep, playErrorSound, playCashChime } from "@/lib/audio";
import { formatRupiah } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export default function PosPage() {
  const { currentUser } = useAuthStore();
  const {
    items,
    invoiceNumber,
    paymentMethod,
    cashReceived,
    customerPhone,
    addItem,
    clearCart,
    resetTransaction,
    getTotalAmount,
    getChangeAmount,
  } = useCartStore();

  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = React.useState(true);
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);

  // Filters
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  // Modals
  const [isScannerModalOpen, setIsScannerModalOpen] = React.useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = React.useState(false);
  const [completedTransaction, setCompletedTransaction] = React.useState<any>(null);

  // Toast / Status Message
  const [toastMessage, setToastMessage] = React.useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Fetch initial products & categories
  const loadCatalog = React.useCallback(async () => {
    try {
      setLoadingProducts(true);
      const [prods, cats] = await Promise.all([
        inventoryService.getProducts({
          search: search.trim() || undefined,
          categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
          status: "aktif",
        }),
        inventoryService.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err: any) {
      console.error("Gagal memuat katalog:", err);
    } finally {
      setLoadingProducts(false);
    }
  }, [search, selectedCategory]);

  React.useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // 2. Setup Supabase Realtime Listener for Mobile Scanner Pairing
  const ROOM_ID = "tokoku-main-pos";
  React.useEffect(() => {
    const channel = supabase.channel(`pos-room-${ROOM_ID}`);

    channel
      .on("broadcast", { event: "BARCODE_SCANNED" }, async ({ payload }) => {
        const scannedCode = (payload?.barcode || payload?.sku || "").trim();
        if (!scannedCode) return;

        // Look up product in current catalog (by physical barcode first, then by SKU) or fetch from database
        let matched = products.find(
          (p) =>
            (p.barcode && p.barcode.toLowerCase() === scannedCode.toLowerCase()) ||
            p.sku.toLowerCase() === scannedCode.toLowerCase()
        );

        if (!matched) {
          matched = await transactionService.getProductBySku(scannedCode);
        }

        if (matched) {
          if (matched.current_stock > 0) {
            const added = addItem(matched);
            if (added) {
              playBeep();
              showToast(`+ ${matched.name} dimasukkan ke keranjang`, "success");
            } else {
              playErrorSound();
              showToast(
                `Kuantitas ${matched.name} telah mencapai batas stok (${matched.current_stock})`,
                "error"
              );
            }
          } else {
            playErrorSound();
            showToast(`Stok "${matched.name}" habis!`, "error");
          }
        } else {
          playErrorSound();
          showToast(`Barcode / SKU "${scannedCode}" tidak terdaftar!`, "error");
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [products, addItem]);

  // 3. Handle Product Click from Left Catalog
  const handleSelectProduct = (product: Product) => {
    const added = addItem(product);
    if (!added) {
      playErrorSound();
      showToast(
        `Kuantitas telah mencapai batas stok (${product.current_stock})`,
        "error"
      );
    }
  };

  // 4. Handle Checkout Execution
  const handleCheckout = async () => {
    if (items.length === 0) return;
    const total = getTotalAmount();
    const change = getChangeAmount();

    if (paymentMethod === "Tunai" && cashReceived < total) {
      alert("Jumlah uang tunai diterima kurang dari total belanja!");
      return;
    }

    setCheckoutLoading(true);
    try {
      await transactionService.checkout({
        invoiceNumber,
        userId: currentUser.id,
        totalAmount: total,
        paymentMethod,
        cashReceived: paymentMethod === "QRIS" ? total : cashReceived,
        cashChange: paymentMethod === "QRIS" ? 0 : Math.max(0, change),
        customerPhone: customerPhone.trim() || undefined,
        items,
      });

      playCashChime();

      // Store transaction snapshot for receipt
      const now = new Date();
      const formattedDate = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(now);

      setCompletedTransaction({
        invoiceNumber,
        totalAmount: total,
        paymentMethod,
        cashReceived: paymentMethod === "QRIS" ? total : cashReceived,
        cashChange: paymentMethod === "QRIS" ? 0 : Math.max(0, change),
        customerPhone: customerPhone.trim() || undefined,
        items: [...items],
        cashierName: currentUser.full_name,
        date: formattedDate,
      });

      setIsReceiptModalOpen(true);
      resetTransaction();
      await loadCatalog(); // Refresh stocks
    } catch (err: any) {
      playErrorSound();
      alert("Gagal memproses transaksi: " + (err.message || "Error"));
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <AppShell
      title="TERMINAL KASIR (POS)"
      onOpenScannerPairing={() => setIsScannerModalOpen(true)}
    >
      <div className="relative h-auto lg:h-[calc(100vh-100px)] lg:min-h-[600px] flex flex-col pb-16 lg:pb-0">
        {/* Floating Scanner Toast Message */}
        {toastMessage && (
          <div
            className={`fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xl animate-in fade-in slide-in-from-top-4 ${
              toastMessage.type === "success"
                ? "bg-[#6FA084] text-white"
                : "bg-[#D64545] text-white"
            }`}
          >
            {toastMessage.text}
          </div>
        )}

        {/* 60 / 40 Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-full flex-1">
          {/* Left Column: 60% (7 cols on lg, 8 cols on xl) Catalog */}
          <div className="lg:col-span-7 xl:col-span-8 lg:h-full flex flex-col min-h-0">
            <ProductCatalog
              products={products}
              categories={categories}
              onSelectProduct={handleSelectProduct}
              onOpenScannerPairing={() => setIsScannerModalOpen(true)}
              search={search}
              setSearch={setSearch}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </div>

          {/* Right Column: 40% (5 cols on lg, 4 cols on xl) Virtual Cart & Checkout */}
          <div className="lg:col-span-5 xl:col-span-4 lg:h-full flex flex-col min-h-0">
            <CartPanel onCheckout={handleCheckout} loading={checkoutLoading} />
          </div>
        </div>

        {/* Mobile Floating Cart Summary Button */}
        {items.length > 0 && (
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-30 animate-in fade-in slide-in-from-bottom-2">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("cart-panel");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="w-full bg-[#2C2C2C] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-[#3D3D3D] active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-[#6FA084] text-white flex items-center justify-center font-bold text-xs">
                  {items.reduce((acc, i) => acc + i.quantity, 0)}
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-[#9E9E9E] block uppercase tracking-wider">
                    Keranjang
                  </span>
                  <span className="text-xs font-black text-white">
                    {formatRupiah(getTotalAmount())}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#6FA084]">
                <span>Menuju Pembayaran</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Modals */}
        <ScannerPairingModal
          isOpen={isScannerModalOpen}
          onClose={() => setIsScannerModalOpen(false)}
          roomId={ROOM_ID}
        />

        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          transactionData={completedTransaction}
        />
      </div>
    </AppShell>
  );
}
