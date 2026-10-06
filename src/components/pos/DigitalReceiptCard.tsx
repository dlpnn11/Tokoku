"use client";

import * as React from "react";
import { formatRupiah, roundPrice500 } from "@/lib/utils";
import { Store, CheckCircle2 } from "lucide-react";

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
      items,
      storeName = "Toko Grosir Sumber Rejeki",
      storeAddress = "Pasar Induk Kramat Jati Blok A5",
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        id="digital-receipt-image"
        className="w-[360px] bg-white border border-[#E5E5E0] rounded-2xl p-6 shadow-sm mx-auto select-none font-sans text-[#1A1A1A]"
        style={{
          boxSizing: "border-box",
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#6FA084] flex items-center justify-center text-white">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm tracking-wide text-[#1A1A1A]">
                TokoKu
              </h2>
              <p className="text-[10px] text-[#6B7280]">{storeName}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF3EC] text-[#6FA084] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Sukses
          </span>
        </div>

        {/* Big Amount & Invoice */}
        <div className="py-4 text-center border-b border-dashed border-[#E5E5E0] space-y-1">
          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
            Total Pembayaran
          </span>
          <p className="text-3xl font-black text-[#1A1A1A]">
            {formatRupiah(totalAmount)}
          </p>
          <p className="text-[10px] text-[#6B7280] font-mono">
            {invoiceNumber}
          </p>
        </div>

        {/* Transaction Meta Details */}
        <div className="py-3 text-[11px] space-y-1.5 border-b border-[#F0F0EB]">
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Waktu Transaksi</span>
            <span className="font-semibold text-[#1A1A1A]">{dateStr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Kasir Bertugas</span>
            <span className="font-semibold text-[#1A1A1A]">{cashierName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Metode Pembayaran</span>
            <span className="font-bold text-[#6FA084]">{paymentMethod}</span>
          </div>
          {customerPhone && (
            <div className="flex justify-between">
              <span className="text-[#6B7280]">No. Pelanggan</span>
              <span className="font-medium text-[#1A1A1A]">{customerPhone}</span>
            </div>
          )}
        </div>

        {/* Purchased Items List */}
        <div className="py-3 space-y-2 border-b border-dashed border-[#E5E5E0]">
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
            Rincian Pembelian ({items.length} item)
          </span>
          <div className="space-y-1.5 max-h-56 overflow-hidden">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-[#1A1A1A] truncate text-[11px]">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-[#6B7280]">
                    {item.quantity} × {formatRupiah(roundPrice500(item.unitPrice))}
                  </p>
                </div>
                <span className="font-bold text-[#1A1A1A] text-[11px] shrink-0">
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
          <p className="text-[9px] text-[#9E9E9E]">{storeAddress}</p>
        </div>
      </div>
    );
  }
);

DigitalReceiptCard.displayName = "DigitalReceiptCard";
