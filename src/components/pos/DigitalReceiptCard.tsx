"use client";

import * as React from "react";
import { formatRupiah, roundPrice500 } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { sanitizePlainText, maskPhoneNumber } from "@/lib/security";
import { TokoKuLogo } from "@/components/ui/TokoKuLogo";

export interface DigitalReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface DigitalReceiptProps {
  invoiceNumber: string;
  dateStr: string;
  cashierName: string;
  paymentMethod: string;
  totalAmount: number;
  cashReceived?: number | null;
  cashChange?: number | null;
  customerPhone?: string | null;
  maskCustomerPII?: boolean;
  items: DigitalReceiptItem[];
  storeName?: string;
  storeAddress?: string;
}

export const DigitalReceiptCard = React.forwardRef<HTMLDivElement, DigitalReceiptProps>(
  (
    {
      invoiceNumber,
      dateStr,
      cashierName,
      paymentMethod,
      totalAmount,
      cashReceived,
      cashChange,
      customerPhone,
      maskCustomerPII = true,
      items,
      storeName = "Toko Grosir Sumber Rejeki",
      storeAddress = "Pasar Induk Kramat Jati Blok A5",
    },
    ref
  ) => {
    // Defense-in-depth XSS sanitization of receipt labels
    const safeStoreName = sanitizePlainText(storeName, 100);
    const safeStoreAddress = sanitizePlainText(storeAddress, 150);
    const safeInvoiceNumber = sanitizePlainText(invoiceNumber, 50);
    const safeDateStr = sanitizePlainText(dateStr, 60);
    const safeCashierName = sanitizePlainText(cashierName, 100);
    const safePaymentMethod = sanitizePlainText(paymentMethod, 30);
    const safeCustomerPhone = customerPhone ? sanitizePlainText(customerPhone, 25) : null;
    const displayCustomerPhone = safeCustomerPhone
      ? maskCustomerPII
        ? maskPhoneNumber(safeCustomerPhone)
        : safeCustomerPhone
      : null;

    return (
      <div
        ref={ref}
        id="digital-receipt-image"
        className="w-[370px] max-w-full bg-white border border-[#E5E5E0] rounded-2xl px-6 py-6 shadow-sm mx-auto select-none font-sans text-[#1A1A1A]"
        style={{
          boxSizing: "border-box",
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E0]">
          <div className="flex items-center gap-2.5">
            <TokoKuLogo size={32} />
            <div>
              <h2 className="font-black text-sm tracking-wide text-[#1A1A1A]">
                TokoKu
              </h2>
              <p className="text-[10px] text-[#6B7280]">{safeStoreName}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#EAF3EC] text-[#6FA084] flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Sukses
          </span>
        </div>

        {/* Big Amount & Invoice */}
        <div className="py-4 text-center border-b border-dashed border-[#E5E5E0] space-y-1">
          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
            Total Pembayaran
          </span>
          <p className="text-3xl font-black text-[#1A1A1A] tracking-tight">
            {formatRupiah(totalAmount)}
          </p>
          <p className="text-[10px] text-[#6B7280] font-mono">
            {safeInvoiceNumber}
          </p>
        </div>

        {/* Transaction Meta Details */}
        <div className="py-3 text-[11px] space-y-2 border-b border-[#F0F0EB]">
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280]">Waktu Transaksi</span>
            <span className="font-semibold text-[#1A1A1A]">{safeDateStr}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280]">Kasir Bertugas</span>
            <span className="font-semibold text-[#1A1A1A]">{safeCashierName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280]">Metode Pembayaran</span>
            <span className="font-bold text-[#6FA084]">{safePaymentMethod}</span>
          </div>
          {displayCustomerPhone && (
            <div className="flex justify-between items-center">
              <span className="text-[#6B7280]">No. Pelanggan</span>
              <span className="font-medium text-[#1A1A1A] font-mono">{displayCustomerPhone}</span>
            </div>
          )}
        </div>

        {/* Purchased Items List */}
        <div className="py-3 space-y-2 border-b border-dashed border-[#E5E5E0]">
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
            Rincian Pembelian ({items.length} item)
          </span>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#1A1A1A] text-[11px] leading-snug break-words">
                    {sanitizePlainText(item.name, 150)}
                  </p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">
                    {item.quantity} × {formatRupiah(roundPrice500(item.unitPrice))}
                  </p>
                </div>
                <span className="font-bold text-[#1A1A1A] text-[11px] shrink-0 text-right whitespace-nowrap">
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="py-3 text-xs space-y-1 border-b border-[#E5E5E0]">
          <div className="flex justify-between text-[#6B7280] text-[11px]">
            <span>Subtotal</span>
            <span>{formatRupiah(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-[#6B7280] text-[11px]">
            <span>Diskon</span>
            <span>Rp 0</span>
          </div>
          {paymentMethod === "Tunai" && (
            <>
              <div className="flex justify-between text-[#6B7280] text-[11px] pt-1">
                <span>Tunai Diterima</span>
                <span>{formatRupiah(Number(cashReceived || totalAmount))}</span>
              </div>
              <div className="flex justify-between font-bold text-[#6FA084] text-xs">
                <span>Kembalian</span>
                <span>{formatRupiah(Number(cashChange || 0))}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-3 text-center space-y-0.5">
          <p className="text-[10px] font-bold text-[#1A1A1A]">
            Resi ini merupakan bukti transaksi sah TokoKu
          </p>
          <p className="text-[9px] text-[#9E9E9E]">{safeStoreAddress}</p>
        </div>
      </div>
    );
  }
);

DigitalReceiptCard.displayName = "DigitalReceiptCard";
