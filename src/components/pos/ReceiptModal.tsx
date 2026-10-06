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
} from "lucide-react";
import { formatRupiah, roundPrice500, cn } from "@/lib/utils";
import { CartItem } from "@/stores/cartStore";
import { toPng } from "html-to-image";
import { DigitalReceiptCard } from "./DigitalReceiptCard";

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
  const digitalReceiptRef = React.useRef<HTMLDivElement>(null);

  if (!transactionData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!digitalReceiptRef.current) return;
    setDownloadingImage(true);
    try {
      const dataUrl = await toPng(digitalReceiptRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#FFFFFF",
      });

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

  const handleShareImage = async () => {
    if (!digitalReceiptRef.current) return;
    setDownloadingImage(true);
    try {
      const dataUrl = await toPng(digitalReceiptRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#FFFFFF",
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Resi_TokoKu_${transactionData.invoiceNumber}.png`, {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Resi Pembayaran TokoKu ${transactionData.invoiceNumber}`,
          text: `Bukti pembayaran TokoKu untuk faktur ${transactionData.invoiceNumber}`,
        });
      } else {
        // Fallback: download image and open WhatsApp web
        const link = document.createElement("a");
        link.download = `Resi_TokoKu_${transactionData.invoiceNumber}.png`;
        link.href = dataUrl;
        link.click();

        const phone = transactionData.customerPhone
          ? transactionData.customerPhone.replace(/[^0-9]/g, "").replace(/^0/, "62")
          : "";
        const waUrl = phone
          ? `https://wa.me/${phone}?text=${encodeURIComponent(
              `Halo! Berikut kami lampirkan gambar bukti pembayaran TokoKu untuk invoice ${transactionData.invoiceNumber}. Total: ${formatRupiah(
                transactionData.totalAmount
              )}.`
            )}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(
              `Bukti pembayaran TokoKu invoice ${transactionData.invoiceNumber}. Total: ${formatRupiah(
                transactionData.totalAmount
              )}.`
            )}`;
        window.open(waUrl, "_blank");
      }
    } catch (err) {
      console.error("Gagal membagikan resi gambar:", err);
    } finally {
      setDownloadingImage(false);
    }
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

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-[#E5E5E0]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="gap-1.5 h-10 text-xs font-bold"
            >
              <Printer className="w-3.5 h-3.5 text-[#6FA084]" />
              Cetak 58mm
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={downloadingImage}
              onClick={handleDownloadImage}
              className="gap-1.5 h-10 text-xs font-bold border-[#6FA084] text-[#6FA084] hover:bg-[#F4F8F5]"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Foto Resi
            </Button>

            <Button
              type="button"
              disabled={downloadingImage}
              onClick={handleShareImage}
              className="gap-1.5 h-10 text-xs font-bold bg-[#25D366] hover:bg-[#20ba5a] text-white"
            >
              <Share2 className="w-3.5 h-3.5" />
              Kirim ke WA
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
