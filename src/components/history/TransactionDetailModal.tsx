"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Printer,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import { formatRupiah, roundPrice500 } from "@/lib/utils";
import { TransactionWithDetails } from "@/services/transactionService";

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionWithDetails | null;
  isOwner: boolean;
  onCancelTransaction: (id: string) => Promise<void>;
}

export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  isOwner,
  onCancelTransaction,
}: TransactionDetailModalProps) {
  const [cancelling, setCancelling] = React.useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = React.useState(false);
  const [copiedInvoice, setCopiedInvoice] = React.useState(false);

  if (!transaction) return null;

  const isCancelled = transaction.status === "Dibatalkan";

  const handlePrint = () => {
    window.print();
  };

  const handleCopyInvoice = () => {
    navigator.clipboard.writeText(transaction.invoice_number);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  const formattedDate = new Date(transaction.created_at).toLocaleString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getWhatsAppReceiptText = () => {
    let text = `*TOKOKU — SUMBER REJEKI*\n`;
    text += `Invoice: ${transaction.invoice_number}\n`;
    text += `Waktu: ${formattedDate} WIB\n`;
    text += `Kasir: ${transaction.user?.full_name || "Kasir"}\n`;
    text += `Status: ${transaction.status}\n`;
    text += `--------------------------------\n`;
    (transaction.details || []).forEach((d) => {
      const price = roundPrice500(Number(d.unit_price));
      text += `${d.product?.name || "Barang"}\n`;
      text += `  ${d.quantity} x ${formatRupiah(price)} = ${formatRupiah(
        Number(d.subtotal)
      )}\n`;
    });
    text += `--------------------------------\n`;
    text += `*TOTAL: ${formatRupiah(Number(transaction.total_amount))}*\n`;
    text += `Metode: ${transaction.payment_method}\n`;
    if (transaction.cash_received && Number(transaction.cash_received) > 0) {
      text += `Bayar: ${formatRupiah(Number(transaction.cash_received))}\n`;
      text += `Kembali: ${formatRupiah(Number(transaction.cash_change || 0))}\n`;
    }
    text += `--------------------------------\n`;
    text += `Terima kasih telah berbelanja di TokoKu!`;
    return encodeURIComponent(text);
  };

  const handleSendWhatsApp = () => {
    let phone = transaction.customer_phone || "";
    if (!phone) {
      const input = window.prompt(
        "Masukkan nomor WhatsApp pelanggan (contoh: 08123456789):"
      );
      if (!input) return;
      phone = input;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
    window.open(
      `https://wa.me/${cleanPhone}?text=${getWhatsAppReceiptText()}`,
      "_blank"
    );
  };

  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      await onCancelTransaction(transaction.id);
      setShowConfirmCancel(false);
      onClose();
    } catch (err: any) {
      alert(err.message || "Gagal membatalkan transaksi.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Faktur Penjualan"
      description={`Rincian nota transaksi nomor ${transaction.invoice_number}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Status Header Badge */}
        <div className="flex items-center justify-between p-3 bg-[#FAFBF9] border border-[#E5E5E0] rounded-xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#1A1A1A]">
              {transaction.invoice_number}
            </span>
            <button
              onClick={handleCopyInvoice}
              className="text-[#6B7280] hover:text-[#1A1A1A] p-1"
              title="Salin No. Faktur"
            >
              {copiedInvoice ? (
                <Check className="w-3.5 h-3.5 text-[#6FA084]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <span
            className={`text-[11px] font-bold px-3 py-1 rounded-full ${
              isCancelled
                ? "bg-[#FFF0F0] text-[#D64545]"
                : "bg-[#EAF3EC] text-[#6FA084]"
            }`}
          >
            {transaction.status}
          </span>
        </div>

        {/* Cancelled Alert Banner */}
        {isCancelled && (
          <div className="p-3 bg-[#FFF0F0] border border-[#F8BEBE] rounded-xl flex items-center gap-2 text-xs text-[#D64545] font-semibold">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>
              Transaksi ini telah dibatalkan dan seluruh stok produk telah
              dikembalikan ke inventaris.
            </span>
          </div>
        )}

        {/* 58mm Virtual Thermal Receipt Paper Preview */}
        <div
          id="receipt-print-area"
          className="bg-white border-2 border-dashed border-[#E5E5E0] rounded-xl p-5 font-mono text-xs text-[#1A1A1A] space-y-2 max-w-xs mx-auto shadow-sm"
        >
          <div className="text-center space-y-0.5 pb-2 border-b border-[#E5E5E0]">
            <h4 className="font-bold text-sm tracking-wider">TOKOKU</h4>
            <p className="text-[10px] text-[#6B7280]">Toko Grosir Sumber Rejeki</p>
            <p className="text-[10px] text-[#6B7280]">
              Pasar Induk Kramat Jati Blok A5
            </p>
          </div>

          <div className="text-[10px] space-y-0.5 pt-1 text-[#6B7280]">
            <div className="flex justify-between">
              <span>Invoice:</span>
              <span className="font-bold text-[#1A1A1A]">
                {transaction.invoice_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span className="font-medium text-[#1A1A1A]">
                {transaction.user?.full_name || "Kasir"}
              </span>
            </div>
            {transaction.customer_phone && (
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{transaction.customer_phone}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-[#E5E5E0] my-2 pt-2 space-y-1.5">
            {(transaction.details || []).map((detail, idx) => {
              const unitPrice = roundPrice500(Number(detail.unit_price));
              return (
                <div key={idx} className="text-xs">
                  <p className="font-bold text-[#1A1A1A]">
                    {detail.product?.name || "Produk"}
                  </p>
                  <div className="flex justify-between text-[#6B7280] text-[11px]">
                    <span>
                      {detail.quantity} x {formatRupiah(unitPrice)}
                    </span>
                    <span className="font-semibold text-[#1A1A1A]">
                      {formatRupiah(Number(detail.subtotal))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-dashed border-[#E5E5E0] pt-2 space-y-1 text-xs">
            <div className="flex justify-between text-[#6B7280]">
              <span>Subtotal</span>
              <span>{formatRupiah(Number(transaction.total_amount))}</span>
            </div>
            <div className="flex justify-between text-[#6B7280]">
              <span>Diskon</span>
              <span>Rp 0</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#1A1A1A] pt-1 border-t border-[#E5E5E0]">
              <span>TOTAL</span>
              <span>{formatRupiah(Number(transaction.total_amount))}</span>
            </div>
            <div className="flex justify-between text-[#6B7280] pt-1">
              <span>Metode</span>
              <span className="font-semibold text-[#1A1A1A]">
                {transaction.payment_method}
              </span>
            </div>
            {transaction.payment_method === "Tunai" && (
              <>
                <div className="flex justify-between text-[#6B7280]">
                  <span>Bayar</span>
                  <span>{formatRupiah(Number(transaction.cash_received || 0))}</span>
                </div>
                <div className="flex justify-between font-bold text-[#6FA084]">
                  <span>Kembalian</span>
                  <span>{formatRupiah(Number(transaction.cash_change || 0))}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center pt-3 border-t border-dashed border-[#E5E5E0] text-[10px] text-[#9E9E9E]">
            <p>Terima Kasih Atas Kunjungan Anda!</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar</p>
          </div>
        </div>

        {/* Cancellation Box for Owner */}
        {isOwner && !isCancelled && (
          <div className="p-3 bg-[#FFF9F9] border border-[#F8BEBE] rounded-xl space-y-2">
            {!showConfirmCancel ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#D64545] font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Ingin membatalkan transaksi ini?</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfirmCancel(true)}
                  className="h-8 text-xs text-[#D64545] border-[#F8BEBE] hover:bg-[#FDEAEA]"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Batalkan Transaksi
                </Button>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <p className="text-[#D64545] font-bold">
                  Konfirmasi Pembatalan: Stok {transaction.details?.length || 0} barang
                  akan otomatis dikembalikan ke inventaris toko. Tindakan ini tidak dapat
                  dibatalkan!
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={cancelling}
                    onClick={handleConfirmCancel}
                    className="flex-1 bg-[#D64545] hover:bg-[#B83232] text-white font-bold h-8 text-xs"
                  >
                    {cancelling ? "Membatalkan..." : "Ya, Batalkan & Kembalikan Stok"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={cancelling}
                    onClick={() => setShowConfirmCancel(false)}
                    className="h-8 text-xs"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            type="button"
            onClick={handlePrint}
            variant="outline"
            className="w-full gap-2 border-[#6FA084] text-[#6FA084] hover:bg-[#F4F8F5] font-bold text-xs h-10 rounded-xl"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk (58mm)
          </Button>

          <Button
            type="button"
            onClick={handleSendWhatsApp}
            variant="outline"
            className="w-full gap-2 border-[#25D366] text-[#25D366] hover:bg-[#E8F8EE] font-bold text-xs h-10 rounded-xl"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Struk
          </Button>
        </div>

        <Button
          type="button"
          onClick={onClose}
          className="w-full bg-[#6FA084] hover:bg-[#58836B] text-white font-bold text-xs h-10 rounded-xl"
        >
          Tutup
        </Button>
      </div>
    </Modal>
  );
}
