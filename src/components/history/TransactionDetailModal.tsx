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
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatRupiah, roundPrice500, cn } from "@/lib/utils";
import { TransactionWithDetails } from "@/services/transactionService";
import { toPng } from "html-to-image";
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { DigitalReceiptCard } from "@/components/pos/DigitalReceiptCard";
import {
  sanitizePlainText,
  sanitizeMultiLineText,
  sanitizePhoneNumber,
  buildSafeWhatsAppUrl,
  maskPhoneNumber,
  auditService,
} from "@/lib/security";
import { SupervisorOverrideModal } from "@/components/security/SupervisorOverrideModal";

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
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = React.useState(false);
  const [copiedInvoice, setCopiedInvoice] = React.useState(false);
  const [downloadingImage, setDownloadingImage] = React.useState(false);
  const [phoneInput, setPhoneInput] = React.useState("");
  const [isPhoneRevealed, setIsPhoneRevealed] = React.useState(false);
  const digitalReceiptRef = React.useRef<HTMLDivElement>(null);

  // Reset reveal and custom phone input whenever modal opens or transaction changes
  React.useEffect(() => {
    setIsPhoneRevealed(false);
    setPhoneInput("");
  }, [transaction?.id, isOpen]);

  React.useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove("printing-thermal");
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  if (!transaction) return null;

  const isCancelled = transaction.status === "Dibatalkan";

  const handlePrint = () => {
    setViewMode("thermal");
    document.body.classList.add("printing-thermal");
    setTimeout(() => {
      window.print();
    }, 80);
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
    const safeInvoice = sanitizePlainText(transaction.invoice_number, 50);
    const safeDate = sanitizePlainText(formattedDate, 60);
    const safeCashier = sanitizePlainText(transaction.user?.full_name || "Kasir TokoKu", 100);
    const safeMethod = sanitizePlainText(transaction.payment_method, 30);

    return (
      `*BUKTI PEMBAYARAN TOKOKU*\n` +
      `Toko Grosir Sumber Rejeki\n` +
      `No. Invoice: ${safeInvoice}\n` +
      `Waktu: ${safeDate}\n` +
      `Kasir: ${safeCashier}\n` +
      `--------------------------------\n` +
      (transaction.details || [])
        .map(
          (d) =>
            `• ${sanitizePlainText(d.product?.name || "Produk", 100)} (${d.quantity}x) = ${formatRupiah(Number(d.subtotal))}`
        )
        .join("\n") +
      `\n--------------------------------\n` +
      `*Total: ${formatRupiah(Number(transaction.total_amount))}*\n` +
      `Metode: ${safeMethod}\n\n` +
      `Terima kasih telah berbelanja di TokoKu!`
    );
  };

  const targetPhone = phoneInput.trim() || transaction.customer_phone || "";

  const handleToggleRevealPhone = async () => {
    if (!isOwner) return;
    const nextState = !isPhoneRevealed;
    setIsPhoneRevealed(nextState);

    // If unmasking customer PII, record in immutable audit log (UU PDP compliance)
    if (nextState && transaction) {
      try {
        await auditService.recordAuditEvent({
          action: "CUSTOMER_PII_REVEALED",
          entity: "transactions",
          entityId: transaction.id,
          newValues: {
            invoice_number: transaction.invoice_number,
            audit_note: "Pemilik membuka sensor nomor WhatsApp pelanggan (UU PDP No. 27/2022)",
          },
        });
      } catch (err) {
        console.error("Gagal mencatat audit log pembukaan PII:", err);
      }
    }
  };

  const handleDirectWa = async () => {
    if (!targetPhone) {
      alert("Silakan masukkan nomor WhatsApp yang valid (contoh: 08123456789 atau 628123456789).");
      return;
    }
    const rawMsg = getWaTextMessage();
    const safeUrl = buildSafeWhatsAppUrl(targetPhone, rawMsg);
    if (!safeUrl) {
      alert("Format nomor WhatsApp tidak valid. Pastikan nomor diawali 08 atau 62.");
      return;
    }

    // Auto-download receipt image so user can attach it
    handleDownloadImage();

    window.open(safeUrl, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    setDownloadingImage(true);
    try {
      if (!digitalReceiptRef.current) return;
      const dataUrl = await toPng(digitalReceiptRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#FFFFFF",
        style: {
          margin: "0",
          transform: "none",
        },
      });

      const safeMsg = sanitizeMultiLineText(getWaTextMessage());
      const safeInvoice = sanitizePlainText(transaction.invoice_number, 50);

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Resi_TokoKu_${safeInvoice}.png`, {
        type: "image/png",
      });

      // 1. Try Native Web Share with file (Mobile / Windows Share Sheet)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Resi Pembayaran TokoKu ${safeInvoice}`,
          text: safeMsg,
        });
        return;
      }

      // 2. Try Native Web Share with text
      if (navigator.share) {
        const link = document.createElement("a");
        link.download = `Resi_TokoKu_${safeInvoice}.png`;
        link.href = dataUrl;
        link.click();

        await navigator.share({
          title: `Resi Pembayaran TokoKu ${safeInvoice}`,
          text: safeMsg,
        });
        return;
      }

      // 3. Fallback: Auto download PNG and launch WhatsApp protocol
      const link = document.createElement("a");
      link.download = `Resi_TokoKu_${safeInvoice}.png`;
      link.href = dataUrl;
      link.click();

      const safeUrl = buildSafeWhatsAppUrl(targetPhone, safeMsg);
      if (safeUrl) {
        window.open(safeUrl, "_blank", "noopener,noreferrer");
      } else {
        const encodedText = encodeURIComponent(safeMsg);
        window.location.href = `whatsapp://send?text=${encodedText}`;
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Gagal membagikan resi:", err);
      }
    } finally {
      setDownloadingImage(false);
    }
  };

  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      await onCancelTransaction(transaction.id);
      setShowConfirmCancel(false);
      onClose();
    } catch (err: any) {
      alert(
        getSafeErrorMessage(err, {
          fallbackMessage: "Gagal membatalkan transaksi.",
          context: "TransactionDetailModal.cancel",
        })
      );
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
              maskCustomerPII={!isPhoneRevealed}
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
                  {sanitizePlainText(transaction.invoice_number, 50)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{sanitizePlainText(formattedDate, 60)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span className="font-medium text-[#1A1A1A]">
                  {sanitizePlainText(transaction.user?.full_name || "Kasir", 100)}
                </span>
              </div>
              {transaction.customer_phone && (
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-mono">
                    {sanitizePlainText(
                      isPhoneRevealed
                        ? transaction.customer_phone
                        : maskPhoneNumber(transaction.customer_phone),
                      25
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-[#E5E5E0] my-2 pt-2 space-y-1.5">
              {(transaction.details || []).map((detail, idx) => {
                const unitPrice = roundPrice500(Number(detail.unit_price));
                return (
                  <div key={idx} className="text-xs">
                    <p className="font-bold text-[#1A1A1A]">
                      {sanitizePlainText(detail.product?.name || "Produk", 120)}
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

        {/* Cancellation Box (Direct for Owner, Supervisor PIN for Cashier) */}
        {!isCancelled && (
          <div className="p-3 bg-[#FFF9F9] border border-[#F8BEBE] rounded-xl space-y-2">
            {!showConfirmCancel ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-[#D64545] font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    {isOwner
                      ? "Ingin membatalkan transaksi ini?"
                      : "Batalkan transaksi kasir? Memerlukan izin PIN Supervisor."}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (isOwner) {
                      setShowConfirmCancel(true);
                    } else {
                      setIsSupervisorModalOpen(true);
                    }
                  }}
                  className="h-8 text-xs text-[#D64545] border-[#F8BEBE] hover:bg-[#FDEAEA] shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  {isOwner ? "Batalkan Transaksi" : "Batalkan (PIN Supervisor)"}
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

        {/* WhatsApp & Native Share Section */}
        <div className="p-3.5 bg-[#F9F9F6] border border-[#E5E5E0] rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#25D366]" />
              Bagikan Resi ke WhatsApp
            </span>
            <span className="text-[10px] text-[#6B7280]">Foto PNG + Teks Ringkasan</span>
          </div>

          {/* Customer PII Contact Card with UU PDP Guard */}
          {transaction.customer_phone && (
            <div className="p-2.5 bg-white border border-[#E5E5E0] rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#EAF3EC] border border-[#D5E5DC] flex items-center justify-center text-[#6FA084] shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                      Nomor Pelanggan
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#F4F4F0] border border-[#E5E5E0] text-[#1A1A1A]">
                      UU PDP
                    </span>
                  </div>
                  <p className="font-mono text-xs font-bold text-[#1A1A1A] truncate">
                    {isPhoneRevealed
                      ? transaction.customer_phone
                      : maskPhoneNumber(transaction.customer_phone)}
                  </p>
                </div>
              </div>

              {isOwner ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleToggleRevealPhone}
                  className="h-7 px-2.5 text-[11px] gap-1.5 border-[#E5E5E0] hover:bg-[#F4F4F0] text-[#1A1A1A] shrink-0"
                  title={
                    isPhoneRevealed
                      ? "Tutup sensor nomor telepon"
                      : "Buka sensor nomor telepon (Dicatat di Audit Trail)"
                  }
                >
                  {isPhoneRevealed ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-[#6B7280]" />
                      <span>Sensor</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-[#6FA084]" />
                      <span>Buka Sensor</span>
                    </>
                  )}
                </Button>
              ) : (
                <span
                  className="text-[10px] text-[#9E9E9E] italic shrink-0 px-2 py-1 rounded bg-[#FAFBF9] border border-[#E5E5E0]"
                  title="Hanya Pemilik Toko yang berwenang membuka sensor data pribadi pelanggan sesuai UU PDP"
                >
                  Tersensor
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Input
                placeholder={
                  transaction.customer_phone
                    ? "Kirim ke nomor lain? Ketik nomor WA di sini..."
                    : "Nomor WA pelanggan (contoh: 08123456789)"
                }
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="h-9 text-xs bg-white border-[#E5E5E0]"
              />
            </div>

            {targetPhone && (
              <Button
                type="button"
                onClick={handleDirectWa}
                disabled={downloadingImage}
                className="h-9 px-3 text-xs font-bold bg-[#25D366] hover:bg-[#20ba5a] text-white shrink-0 cursor-pointer"
                title="Kirim Langsung ke Nomor WA Ini"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {phoneInput.trim()
                  ? "Kirim ke No. Ini"
                  : `Kirim ke (${isPhoneRevealed ? transaction.customer_phone : maskPhoneNumber(transaction.customer_phone)})`}
              </Button>
            )}

            <Button
              type="button"
              onClick={handleNativeShare}
              disabled={downloadingImage}
              className="h-9 px-3.5 text-xs font-bold bg-[#25D366] hover:bg-[#20ba5a] text-white shrink-0 cursor-pointer"
              title="Buka menu Share untuk memilih WhatsApp / Kontak langsung tanpa scan web barcode"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              {downloadingImage ? "Menyiapkan..." : "Bagikan / Share WA"}
            </Button>
          </div>

          <p className="text-[10px] text-[#6B7280] leading-tight">
            💡 Klik <strong>Bagikan / Share WA</strong> untuk langsung membuka menu share & kontak WhatsApp (tanpa perlu scan barcode browser). Foto resi PNG juga otomatis terunduh!
          </p>
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

      {/* Supervisor PIN Override Modal for Void Transaction */}
      <SupervisorOverrideModal
        isOpen={isSupervisorModalOpen}
        onClose={() => setIsSupervisorModalOpen(false)}
        actionTitle={`Pembatalan Faktur #${transaction.invoice_number}`}
        actionDescription={`Kasir mengajukan pembatalan transaksi senilai ${formatRupiah(transaction.total_amount)} dan pengembalian stok ${transaction.details?.length || 0} barang.`}
        entity="transactions"
        entityId={transaction.id}
        metadata={{
          invoice_number: transaction.invoice_number,
          total_amount: transaction.total_amount,
          item_count: transaction.details?.length || 0,
        }}
        onApproved={handleConfirmCancel}
      />
    </Modal>
  );
}

