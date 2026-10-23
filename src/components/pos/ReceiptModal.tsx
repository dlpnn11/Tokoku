"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Printer,
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  Download,
  Share2,
  FileText,
  Image as ImageIcon,
  Send,
  Laptop,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatRupiah, roundPrice500, cn } from "@/lib/utils";
import { CartItem } from "@/stores/cartStore";
import { toPng } from "html-to-image";
import { DigitalReceiptCard } from "./DigitalReceiptCard";
import {
  sanitizePlainText,
  sanitizeMultiLineText,
  sanitizePhoneNumber,
  buildSafeWhatsAppUrl,
  maskPhoneNumber,
} from "@/lib/security";

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
  const [viewMode, setViewMode] = React.useState<"thermal" | "digital">("digital");
  const [downloadingImage, setDownloadingImage] = React.useState(false);
  const [phoneInput, setPhoneInput] = React.useState("");
  const digitalReceiptRef = React.useRef<HTMLDivElement>(null);

  // Reset custom phone input when new transaction modal opens
  React.useEffect(() => {
    setPhoneInput("");
  }, [transactionData?.invoiceNumber, isOpen]);

  React.useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove("printing-thermal");
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  if (!transactionData) return null;

  const handlePrint = () => {
    setViewMode("thermal");
    document.body.classList.add("printing-thermal");
    setTimeout(() => {
      window.print();
    }, 80);
  };

  const getReceiptImage = async () => {
    if (!digitalReceiptRef.current) return null;
    return await toPng(digitalReceiptRef.current, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: "#FFFFFF",
      style: {
        margin: "0",
        transform: "none",
      },
    });
  };

  const handleDownloadImage = async () => {
    if (!digitalReceiptRef.current) return;
    setDownloadingImage(true);
    try {
      const dataUrl = await getReceiptImage();
      if (!dataUrl) return;

      const link = document.createElement("a");
      link.download = `Resi_TokoKu_${transactionData.invoiceNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal membuat gambar resi:", err);
      alert("Gagal mengunduh gambar resi.");
    } finally {
      setDownloadingImage(false);
    }
  };

  const getWaTextMessage = () => {
    const safeInvoice = sanitizePlainText(transactionData.invoiceNumber, 50);
    const safeDate = sanitizePlainText(transactionData.date, 60);
    const safeCashier = sanitizePlainText(transactionData.cashierName, 100);
    const safeMethod = sanitizePlainText(transactionData.paymentMethod, 30);

    return (
      `*BUKTI PEMBAYARAN TOKOKU*\n` +
      `Toko Grosir Sumber Rejeki\n` +
      `No. Invoice: ${safeInvoice}\n` +
      `Waktu: ${safeDate}\n` +
      `Kasir: ${safeCashier}\n` +
      `--------------------------------\n` +
      transactionData.items
        .map(
          (i) =>
            `• ${sanitizePlainText(i.product.name, 100)} (${i.quantity}x) = ${formatRupiah(i.subtotal)}`
        )
        .join("\n") +
      `\n--------------------------------\n` +
      `*Total: ${formatRupiah(transactionData.totalAmount)}*\n` +
      `Metode: ${safeMethod}\n\n` +
      `Terima kasih telah berbelanja di TokoKu!`
    );
  };

  const targetPhone = phoneInput.trim() || transactionData?.customerPhone || "";

  // Direct WA to specific number (New Customer)
  const handleDirectWa = async () => {
    if (!targetPhone) {
      alert("Silakan masukkan nomor WhatsApp yang valid (contoh: 08123456789 atau 628123456789).");
      return;
    }
    const rawMsg = getWaTextMessage();
    const safeUrl = buildSafeWhatsAppUrl(targetPhone, rawMsg);
    if (!safeUrl) {
      alert("Silakan masukkan nomor WhatsApp yang valid (contoh: 08123456789 atau 628123456789).");
      return;
    }

    // Auto-download receipt image so cashier can easily attach it
    handleDownloadImage();

    window.open(safeUrl, "_blank", "noopener,noreferrer");
  };

  // Native Share Menu (Shares file & text directly to WhatsApp app / contact picker)
  const handleNativeShare = async () => {
    setDownloadingImage(true);
    try {
      const dataUrl = await getReceiptImage();
      if (!dataUrl) return;

      const safeMsg = sanitizeMultiLineText(getWaTextMessage());
      const safeInvoice = sanitizePlainText(transactionData.invoiceNumber, 50);

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Resi_TokoKu_${safeInvoice}.png`, {
        type: "image/png",
      });

      // 1. Try Native Web Share with file attachment (Mobile / Windows Share Sheet)
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

      // 3. Fallback: Auto-download PNG and open WhatsApp application protocol
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
        console.error("Gagal membagikan:", err);
      }
    } finally {
      setDownloadingImage(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaksi Berhasil"
      description={`Invoice ${transactionData.invoiceNumber} berhasil dicatat.`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Success Banner */}
        <div className="p-3 bg-[#F4F8F5] border border-[#D5E5DC] rounded-xl flex items-center justify-between gap-2.5 text-xs text-[#6FA084] font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Pembayaran diterima & stok terpotong otomatis.</span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#FAFBF9] border border-[#E5E5E0] rounded-lg p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("digital")}
              className={cn(
                "px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
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
                "px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                viewMode === "thermal"
                  ? "bg-[#6FA084] text-white shadow-2xs"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              )}
            >
              <FileText className="w-3 h-3" />
              Kertas 58mm
            </button>
          </div>
        </div>

        {/* View Mode 1: Digital E-Receipt Card (Bank Jago / E-Wallet Style) */}
        {viewMode === "digital" && (
          <div className="py-1 flex justify-center">
            <DigitalReceiptCard
              ref={digitalReceiptRef}
              invoiceNumber={transactionData.invoiceNumber}
              dateStr={transactionData.date}
              cashierName={transactionData.cashierName}
              paymentMethod={transactionData.paymentMethod}
              totalAmount={transactionData.totalAmount}
              cashReceived={transactionData.cashReceived}
              cashChange={transactionData.cashChange}
              customerPhone={transactionData.customerPhone}
              items={transactionData.items.map((item) => ({
                name: item.product.name,
                quantity: item.quantity,
                unitPrice: roundPrice500(Number(item.product.sell_price)),
                subtotal: item.subtotal,
              }))}
            />
          </div>
        )}

        {/* View Mode 2: 58mm Virtual Thermal Receipt Paper Preview */}
        {viewMode === "thermal" && (
          <div
            id="receipt-print-area"
            className="bg-white border-2 border-dashed border-[#E5E5E0] rounded-xl p-5 font-mono text-xs text-[#1A1A1A] space-y-2 max-w-xs mx-auto shadow-2xs"
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
                  {sanitizePlainText(transactionData.invoiceNumber, 50)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{sanitizePlainText(transactionData.date, 60)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{sanitizePlainText(transactionData.cashierName, 100)}</span>
              </div>
              {transactionData.customerPhone && (
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-mono">{sanitizePlainText(maskPhoneNumber(transactionData.customerPhone), 25)}</span>
                </div>
              )}
            </div>

            {/* Itemized list */}
            <div className="pt-2 border-t border-[#E5E5E0] space-y-1.5 text-[11px]">
              {transactionData.items.map((item) => (
                <div key={item.product.id}>
                  <div className="font-bold truncate">{sanitizePlainText(item.product.name, 120)}</div>
                  <div className="flex justify-between text-[10px] text-[#6B7280]">
                    <span>
                      {item.quantity} x {formatRupiah(roundPrice500(Number(item.product.sell_price)))}
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
        )}

        {/* WhatsApp & Native Share Section */}
        <div className="p-3.5 bg-[#F9F9F6] border border-[#E5E5E0] rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#25D366]" />
              Bagikan Resi ke WhatsApp
            </span>
            <span className="text-[10px] text-[#6B7280]">Foto PNG + Teks Transaksi</span>
          </div>

          {/* Customer PII Contact Card with UU PDP Guard */}
          {transactionData.customerPhone && (
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
                    {maskPhoneNumber(transactionData.customerPhone)}
                  </p>
                </div>
              </div>

              <span
                className="text-[10px] text-[#9E9E9E] italic shrink-0 px-2 py-1 rounded bg-[#FAFBF9] border border-[#E5E5E0]"
                title="Nomor telepon pelanggan tersensor otomatis demi privasi sesuai UU PDP No. 27/2022"
              >
                Tersensor
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Input
                placeholder={
                  transactionData.customerPhone
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
                  : `Kirim ke (${maskPhoneNumber(transactionData.customerPhone)})`}
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
              variant="outline"
              onClick={handlePrint}
              className="gap-1.5 h-10 text-xs font-bold"
            >
              <Printer className="w-3.5 h-3.5 text-[#6FA084]" />
              Cetak Nota Kertas (58mm)
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={downloadingImage}
              onClick={handleDownloadImage}
              className="gap-1.5 h-10 text-xs font-bold border-[#6FA084] text-[#6FA084] hover:bg-[#F4F8F5]"
            >
              <Download className="w-3.5 h-3.5" />
              {downloadingImage ? "Memproses..." : "Unduh Foto Resi (PNG)"}
            </Button>
          </div>

          <Button
            type="button"
            onClick={onClose}
            className="w-full h-10 text-xs font-black uppercase tracking-wider bg-[#6FA084] hover:bg-[#58836B] text-white rounded-xl"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Selesai / Transaksi Baru
          </Button>
        </div>
      </div>
    </Modal>
  );
}
