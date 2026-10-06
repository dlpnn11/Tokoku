"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Printer, MessageSquare, CheckCircle2, RotateCcw } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { CartItem } from "@/stores/cartStore";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionData: {
    invoiceNumber: string;
    totalAmount: number;
    paymentMethod: "Tunai" | "QRIS";
    cashReceived: number;
    cashChange: number;
    customerPhone?: string;
    items: CartItem[];
    cashierName: string;
    date: string;
  } | null;
}

export function ReceiptModal({
  isOpen,
  onClose,
  transactionData,
}: ReceiptModalProps) {
  if (!transactionData) return null;

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppReceiptText = () => {
    let text = `*TOKOKU — SUMBER REJEKI*\n`;
    text += `Invoice: ${transactionData.invoiceNumber}\n`;
    text += `Waktu: ${transactionData.date}\n`;
    text += `Kasir: ${transactionData.cashierName}\n`;
    text += `--------------------------------\n`;
    transactionData.items.forEach((item) => {
      text += `${item.product.name}\n`;
      text += `  ${item.quantity} x ${formatRupiah(item.product.sell_price)} = ${formatRupiah(
        item.subtotal
      )}\n`;
    });
    text += `--------------------------------\n`;
    text += `*TOTAL: ${formatRupiah(transactionData.totalAmount)}*\n`;
    text += `Metode: ${transactionData.paymentMethod}\n`;
    text += `Bayar: ${formatRupiah(transactionData.cashReceived)}\n`;
    text += `Kembali: ${formatRupiah(transactionData.cashChange)}\n`;
    text += `--------------------------------\n`;
    text += `Terima kasih telah berbelanja di TokoKu!`;
    return encodeURIComponent(text);
  };

  const cleanPhone = transactionData.customerPhone
    ? transactionData.customerPhone.replace(/[^0-9]/g, "").replace(/^0/, "62")
    : "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaksi Berhasil"
      description={`Invoice ${transactionData.invoiceNumber} berhasil dicatat secara atomik.`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Success Banner */}
        <div className="p-3 bg-[#F4F8F5] border border-[#D5E5DC] rounded-xl flex items-center gap-2.5 text-xs text-[#6FA084] font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Pembayaran diterima dan stok barang telah dipotong otomatis.</span>
        </div>

        {/* 58mm Virtual Thermal Receipt Paper Preview */}
        <div
          id="receipt-print-area"
          className="bg-white border-2 border-dashed border-[#E5E5E0] rounded-xl p-5 font-mono text-xs text-[#1A1A1A] space-y-2 max-w-xs mx-auto shadow-sm"
        >
          <div className="text-center space-y-0.5 pb-2 border-b border-[#E5E5E0]">
            <h4 className="font-bold text-sm tracking-wider">TOKOKU</h4>
            <p className="text-[10px] text-[#6B7280]">Toko Grosir Sumber Rejeki</p>
            <p className="text-[10px] text-[#6B7280]">Pasar Induk Kramat Jati Blok A5</p>
          </div>

          <div className="text-[10px] space-y-0.5 pt-1 text-[#6B7280]">
            <div className="flex justify-between">
              <span>Invoice:</span>
              <span className="font-bold text-[#1A1A1A]">
                {transactionData.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{transactionData.date}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{transactionData.cashierName}</span>
            </div>
          </div>

          {/* Itemized list */}
          <div className="pt-2 border-t border-[#E5E5E0] space-y-1.5 text-[11px]">
            {transactionData.items.map((item) => (
              <div key={item.product.id}>
                <div className="font-bold truncate">{item.product.name}</div>
                <div className="flex justify-between text-[10px] text-[#6B7280]">
                  <span>
                    {item.quantity} x {formatRupiah(item.product.sell_price)}
                  </span>
                  <span className="font-bold text-[#1A1A1A]">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-2 border-t-2 border-[#1A1A1A] space-y-1 text-xs">
            <div className="flex justify-between font-black">
              <span>TOTAL</span>
              <span>{formatRupiah(transactionData.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#6B7280]">
              <span>Bayar ({transactionData.paymentMethod}):</span>
              <span>{formatRupiah(transactionData.cashReceived)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-[#6FA084]">
              <span>Kembalian:</span>
              <span>{formatRupiah(transactionData.cashChange)}</span>
            </div>
          </div>

          <div className="text-center pt-3 border-t border-[#E5E5E0] text-[10px] text-[#6B7280]">
            <p>Terima Kasih Telah Berbelanja!</p>
            <p>Barang yang dibeli tidak dapat ditukar.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-[#E5E5E0]">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="gap-2 h-10 text-xs font-bold"
            >
              <Printer className="w-4 h-4 text-[#6FA084]" />
              Cetak Struk (58mm)
            </Button>

            {cleanPhone ? (
              <a
                href={`https://wa.me/${cleanPhone}?text=${getWhatsAppReceiptText()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba5a] transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Kirim ke WA
              </a>
            ) : (
              <a
                href={`https://api.whatsapp.com/send?text=${getWhatsAppReceiptText()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-[#E5E5E0] text-[#1A1A1A] hover:bg-[#F4F8F5] text-xs font-bold transition-colors"
                title="Bagikan struk ke WhatsApp siapa saja"
              >
                <MessageSquare className="w-4 h-4 text-[#25D366]" />
                Share WhatsApp
              </a>
            )}
          </div>

          <Button
            type="button"
            onClick={onClose}
            className="w-full h-11 text-xs font-black uppercase tracking-wider bg-[#6FA084] hover:bg-[#58836B]"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Selesai / Transaksi Baru
          </Button>
        </div>
      </div>
    </Modal>
  );
}
