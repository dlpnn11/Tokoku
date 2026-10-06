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
  Download,
  Share2,
  FileText,
  Image as ImageIcon,
  Send,
  Laptop,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatRupiah, roundPrice500, cn } from "@/lib/utils";
import { TransactionWithDetails } from "@/services/transactionService";
import { toPng } from "html-to-image";
import { DigitalReceiptCard } from "@/components/pos/DigitalReceiptCard";

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
  const [viewMode, setViewMode] = React.useState<"digital" | "thermal">("digital");
  const [cancelling, setCancelling] = React.useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = React.useState(false);
  const [copiedInvoice, setCopiedInvoice] = React.useState(false);
  const [downloadingImage, setDownloadingImage] = React.useState(false);
  const digitalReceiptRef = React.useRef<HTMLDivElement>(null);

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

  const [phoneInput, setPhoneInput] = React.useState(transaction.customer_phone || "");

  React.useEffect(() => {
    setPhoneInput(transaction.customer_phone || "");
  }, [transaction.customer_phone]);

  const handleDownloadImage = async () => {
    if (!digitalReceiptRef.current) return;
    setDownloadingImage(true);
    try {
      const dataUrl = await toPng(digitalReceiptRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#FFFFFF",
        style: {
          margin: "0",
          transform: "none",
        },
      });

      const link = document.createElement("a");
      link.download = `Resi_TokoKu_${transaction.invoice_number}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mengunduh gambar resi:", err);
      alert("Gagal mengunduh gambar resi.");
    } finally {
      setDownloadingImage(false);
    }
  };

  const getWaTextMessage = () => {
    return (
      `*BUKTI PEMBAYARAN TOKOKU*\n` +
      `Toko Grosir Sumber Rejeki\n` +
      `No. Invoice: ${transaction.invoice_number}\n` +
      `Waktu: ${formattedDate}\n` +
      `Kasir: ${transaction.user?.full_name || "Kasir TokoKu"}\n` +
      `--------------------------------\n` +
      (transaction.details || [])
        .map(
          (d) =>
            `• ${d.product?.name || "Produk"} (${d.quantity}x) = ${formatRupiah(Number(d.subtotal))}`
        )
        .join("\n") +
      `\n--------------------------------\n` +
      `*Total: ${formatRupiah(Number(transaction.total_amount))}*\n` +
      `Metode: ${transaction.payment_method}\n\n` +
      `Terima kasih telah berbelanja di TokoKu!`
    );
  };

  const handleDirectWa = async () => {
    let clean = phoneInput.replace(/[^0-9]/g, "");
    if (!clean) {
      alert("Silakan masukkan nomor WhatsApp tujuan terlebih dahulu.");
      return;
    }
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1);
    }

    // Auto-download receipt image so user can attach it
    handleDownloadImage();

    const text = encodeURIComponent(getWaTextMessage());
    const url = `https://wa.me/${clean}?text=${text}`;
    window.open(url, "_blank");
  };

  const handleDesktopWa = async () => {
    // Auto-download receipt image
    handleDownloadImage();

    const text = encodeURIComponent(getWaTextMessage());
    const url = `https://web.whatsapp.com/send?text=${text}`;
    window.open(url, "_blank");
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
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Status Header Badge & View Toggle */}
        <div className="flex items-center justify-between p-3 bg-[#FAFBF9] border border-[#E5E5E0] rounded-xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#1A1A1A]">
              {transaction.invoice_number}
            </span>
            <button
              onClick={handleCopyInvoice}
              className="text-[#6B7280] hover:text-[#1A1A1A] p-1 cursor-pointer"
              title="Salin No. Faktur"
            >
              {copiedInvoice ? (
                <Check className="w-3.5 h-3.5 text-[#6FA084]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle View Mode */}
            <div className="flex items-center bg-white border border-[#E5E5E0] rounded-lg p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("digital")}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                  viewMode === "digital"
                    ? "bg-[#6FA084] text-white shadow-2xs"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                )}
              >
                <ImageIcon className="w-3 h-3" />
                Resi Foto
              </button>
              <button
                type="button"
                onClick={() => setViewMode("thermal")}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                  viewMode === "thermal"
                    ? "bg-[#6FA084] text-white shadow-2xs"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                )}
              >
                <FileText className="w-3 h-3" />
                58mm
              </button>
            </div>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isCancelled
                  ? "bg-[#FFF0F0] text-[#D64545]"
                  : "bg-[#EAF3EC] text-[#6FA084]"
              }`}
            >
              {transaction.status}
            </span>
          </div>
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

        {/* VIEW MODE 1: DIGITAL RECEIPT CARD (Bank Jago Style) */}
        {viewMode === "digital" && (
          <div className="py-1 flex justify-center">
            <DigitalReceiptCard
              ref={digitalReceiptRef}
              invoiceNumber={transaction.invoice_number}
              dateStr={formattedDate}
              cashierName={transaction.user?.full_name || "Kasir Toko"}
              paymentMethod={transaction.payment_method}
              totalAmount={Number(transaction.total_amount)}
              cashReceived={Number(transaction.cash_received || transaction.total_amount)}
              cashChange={Number(transaction.cash_change || 0)}
              customerPhone={transaction.customer_phone}
              items={(transaction.details || []).map((d) => ({
                name: d.product?.name || "Produk",
                quantity: d.quantity,
                unitPrice: roundPrice500(Number(d.unit_price)),
                subtotal: Number(d.subtotal),
              }))}
            />
          </div>
        )}

        {/* VIEW MODE 2: 58mm Thermal Print Receipt Paper Preview */}
        {viewMode === "thermal" && (
          <div
            id="receipt-print-area"
            className="bg-white border-2 border-dashed border-[#E5E5E0] rounded-xl p-5 font-mono text-xs text-[#1A1A1A] space-y-2 max-w-xs mx-auto shadow-2xs"
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
        )}

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

        {/* WhatsApp Sharing Section */}
        <div className="p-3 bg-[#F9F9F6] border border-[#E5E5E0] rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
              Kirim Bukti Pembayaran ke WhatsApp
            </span>
            <span className="text-[10px] text-[#6B7280]">Foto PNG + Teks Ringkasan</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Input
                placeholder="Nomor WA Pelanggan (contoh: 081234567890)"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="h-9 text-xs bg-white border-[#E5E5E0]"
              />
            </div>
            <Button
              type="button"
              onClick={handleDirectWa}
              disabled={downloadingImage}
              className="h-9 px-3 text-xs font-bold bg-[#25D366] hover:bg-[#20ba5a] text-white shrink-0 cursor-pointer"
              title="Buka Chat WhatsApp ke Nomor Ini"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Kirim ke No. Ini
            </Button>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-[#EAEAE5] text-[11px]">
            <span className="text-[10px] text-[#6B7280]">
              Sudah simpan kontak pelanggan?
            </span>
            <button
              type="button"
              onClick={handleDesktopWa}
              disabled={downloadingImage}
              className="text-[11px] font-bold text-[#6FA084] hover:text-[#58836B] hover:underline flex items-center gap-1 cursor-pointer"
              title="Buka WhatsApp Web / Desktop lalu pilih kontak langsung"
            >
              <Laptop className="w-3.5 h-3.5" />
              Buka WA Desktop (Pilih Kontak)
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-[#E5E5E0]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={handlePrint}
              variant="outline"
              className="w-full gap-1.5 border-[#6FA084] text-[#6FA084] hover:bg-[#F4F8F5] font-bold text-xs h-10 rounded-xl"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Nota Kertas (58mm)
            </Button>

            <Button
              type="button"
              disabled={downloadingImage}
              onClick={handleDownloadImage}
              variant="outline"
              className="w-full gap-1.5 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F4F4F0] font-bold text-xs h-10 rounded-xl"
            >
              <Download className="w-3.5 h-3.5" />
              {downloadingImage ? "Memproses..." : "Unduh Foto Resi (PNG)"}
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
      </div>
    </Modal>
  );
}
