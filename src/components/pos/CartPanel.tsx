"use client";

import * as React from "react";
import { useCartStore } from "@/stores/cartStore";
import { formatRupiah, cn } from "@/lib/utils";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  Banknote,
  QrCode,
  ArrowRight,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CartPanelProps {
  onCheckout: () => void;
  loading?: boolean;
}

const QUICK_CASH_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export function CartPanel({ onCheckout, loading = false }: CartPanelProps) {
  const {
    items,
    invoiceNumber,
    paymentMethod,
    cashReceived,
    customerPhone,
    updateQuantity,
    removeItem,
    clearCart,
    setPaymentMethod,
    setCashReceived,
    setCustomerPhone,
    getTotalAmount,
    getTotalItems,
    getChangeAmount,
  } = useCartStore();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const totalAmount = getTotalAmount();
  const totalItems = getTotalItems();
  const changeAmount = getChangeAmount();
  const isPaymentValid =
    items.length > 0 &&
    (paymentMethod === "QRIS" || cashReceived >= totalAmount);

  // Keyboard shortcut F2 (Bayar) & F4 (Kosongkan)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        if (isPaymentValid && !loading) {
          onCheckout();
        }
      } else if (e.key === "F4") {
        e.preventDefault();
        handleClearCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaymentValid, loading, onCheckout]);

  const handleClearCart = () => {
    if (items.length === 0) return;
    if (confirm("Kosongkan semua barang di keranjang belanja?")) {
      clearCart();
    }
  };

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount);
  };

  const handleUangPas = () => {
    setCashReceived(totalAmount);
  };

  return (
    <div
      id="cart-panel"
      className="bg-white border border-[#E5E5E0] rounded-2xl flex flex-col h-auto lg:h-full shadow-sm overflow-hidden select-none"
    >
      {/* Header Panel */}
      <div className="p-4 border-b border-[#E5E5E0] bg-[#FAFBF9] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F4F4F0] border border-[#E5E5E0] flex items-center justify-center text-[#6FA084]">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#1A1A1A] uppercase tracking-wider">
              Keranjang Kasir
            </h3>
            <span
              className="text-[10px] text-[#6B7280] font-mono block"
              suppressHydrationWarning
            >
              {mounted ? invoiceNumber : "TK-..."} • {totalItems} item
            </span>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClearCart}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#D64545] hover:bg-[#FDEAEA] px-2 py-1 rounded-lg transition-colors cursor-pointer"
            title="Kosongkan Keranjang (Tekan F4)"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset (F4)</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="max-h-[260px] lg:max-h-none lg:flex-1 overflow-y-auto p-3 divide-y divide-[#F0F0EB]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#6B7280] space-y-2">
            <ShoppingCart className="w-12 h-12 text-[#E5E5E0]" />
            <p className="text-xs font-bold text-[#1A1A1A]">
              Keranjang Masih Kosong
            </p>
            <p className="text-[11px] max-w-xs text-[#6B7280]">
              Pilih produk dari katalog di sebelah kiri atau gunakan pemindai barcode HP.
            </p>
          </div>
        ) : (
          items.map(({ product, quantity, subtotal }) => (
            <div key={product.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
              {/* Product meta */}
              <div className="min-w-0 flex-1">
                <span className="font-bold text-[#1A1A1A] block truncate leading-tight">
                  {product.name}
                </span>
                <span className="text-[10px] text-[#6B7280]">
                  {formatRupiah(product.sell_price)} / {product.unit}
                </span>
              </div>

              {/* Stepper Quantity */}
              <div className="flex items-center gap-1.5 shrink-0 bg-[#FAFBF9] border border-[#E5E5E0] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="w-6 h-6 rounded flex items-center justify-center text-[#1A1A1A] hover:bg-[#F4F4F0] cursor-pointer"
                  title="Kurangi kuantitas"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center font-bold text-xs text-[#1A1A1A] font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  disabled={quantity >= product.current_stock}
                  className={cn(
                    "w-6 h-6 rounded flex items-center justify-center cursor-pointer",
                    quantity >= product.current_stock
                      ? "opacity-30 cursor-not-allowed text-[#9E9E9E]"
                      : "text-[#1A1A1A] hover:bg-[#F4F4F0]"
                  )}
                  title="Tambah kuantitas"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Subtotal & Delete */}
              <div className="text-right shrink-0 w-24 flex items-center justify-end gap-2">
                <span className="font-black text-[#1A1A1A] font-mono">
                  {formatRupiah(subtotal)}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(product.id)}
                  className="text-[#9E9E9E] hover:text-[#D64545] hover:bg-[#FDEAEA] p-1 rounded transition-colors cursor-pointer"
                  title="Hapus item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment & Summary Footer Section */}
      <div className="p-4 border-t border-[#E5E5E0] bg-[#FAFBF9] space-y-3 shrink-0">
        {/* Total Grand Display */}
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
            Total Pembayaran
          </span>
          <span className="text-2xl font-black text-[#1A1A1A] tracking-tight">
            {formatRupiah(totalAmount)}
          </span>
        </div>

        {/* Payment Method Selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod("Tunai")}
            className={cn(
              "h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold border transition-all cursor-pointer",
              paymentMethod === "Tunai"
                ? "bg-[#6FA084] text-white border-[#6FA084] shadow-xs"
                : "bg-white text-[#1A1A1A] border-[#E5E5E0] hover:bg-[#F4F8F5]"
            )}
          >
            <Banknote className="w-4 h-4" />
            Tunai
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("QRIS")}
            className={cn(
              "h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold border transition-all cursor-pointer",
              paymentMethod === "QRIS"
                ? "bg-[#6FA084] text-white border-[#6FA084] shadow-xs"
                : "bg-white text-[#1A1A1A] border-[#E5E5E0] hover:bg-[#F4F8F5]"
            )}
          >
            <QrCode className="w-4 h-4" />
            QRIS
          </button>
        </div>

        {/* Cash Calculation Controls (Only if Tunai) */}
        {paymentMethod === "Tunai" && (
          <div className="space-y-2 pt-1 border-t border-[#E5E5E0]">
            {/* Quick Cash Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {QUICK_CASH_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickCash(amt)}
                  className="h-8 rounded-lg bg-white border border-[#E5E5E0] text-[11px] font-bold text-[#1A1A1A] hover:border-[#6FA084] hover:bg-[#F4F8F5] transition-all cursor-pointer"
                >
                  {formatRupiah(amt)}
                </button>
              ))}
              <button
                type="button"
                onClick={handleUangPas}
                className="h-8 rounded-lg bg-[#EBF3EE] border border-[#6FA084] text-[11px] font-black text-[#6FA084] hover:bg-[#6FA084] hover:text-white transition-all cursor-pointer"
              >
                Uang Pas
              </button>
            </div>

            {/* Manual Cash Input & Change Display */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-bold text-[#6B7280] block mb-1">
                  UANG DITERIMA (RP)
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={cashReceived ? new Intl.NumberFormat("id-ID").format(cashReceived) : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setCashReceived(raw ? parseInt(raw, 10) : 0);
                  }}
                  className="h-9 text-xs font-bold font-mono bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#6B7280] block mb-1">
                  KEMBALIAN
                </label>
                <div
                  className={cn(
                    "h-9 px-3 rounded-xl border flex items-center font-mono font-black text-xs",
                    changeAmount < 0
                      ? "bg-[#FDEAEA] border-[#F8BEBE] text-[#D64545]"
                      : "bg-[#F4F8F5] border-[#D5E5DC] text-[#6FA084]"
                  )}
                >
                  {changeAmount < 0
                    ? `Kurang ${formatRupiah(Math.abs(changeAmount))}`
                    : formatRupiah(changeAmount)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Customer Phone (Optional) */}
        <div className="pt-1">
          <Input
            placeholder="No. WhatsApp Pelanggan (Opsional: Struk Digital)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="h-8 text-[11px] bg-white border-[#E5E5E0]"
          />
        </div>

        {/* Primary Checkout Button */}
        <Button
          type="button"
          onClick={onCheckout}
          disabled={!isPaymentValid || loading}
          className={cn(
            "w-full h-12 text-sm font-black uppercase tracking-wider rounded-xl gap-2 transition-all cursor-pointer",
            isPaymentValid
              ? "bg-[#6FA084] hover:bg-[#58836B] text-white shadow-md active:scale-[0.99]"
              : "opacity-40 cursor-not-allowed bg-[#E5E5E0] text-[#6B7280]"
          )}
        >
          {loading ? (
            "Memproses Pembayaran..."
          ) : (
            <>
              <span>BAYAR SEKARANG (F2)</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
