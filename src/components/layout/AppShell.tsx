"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileDrawer } from "./MobileDrawer";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { QrCode, Smartphone, ExternalLink, Copy, Check } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // RBAC Enforcement: Kasir only allowed to access /pos and /riwayat
  React.useEffect(() => {
    const ownerOnlyRoutes = ["/dashboard", "/inventaris", "/laporan"];
    const isOwnerRoute = ownerOnlyRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (currentUser.role === "kasir" && isOwnerRoute) {
      router.replace("/pos");
    }
  }, [currentUser.role, pathname, router]);

  // Scanner pairing URL
  const scannerUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/scan?room=tokoku-main-pos`
      : "/scan?room=tokoku-main-pos";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(scannerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F4F0] text-[#1A1A1A]">
      {/* Desktop Sticky Sidebar (Visible on md and up) */}
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer (Collapsible) */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Persistent Top Header Bar */}
        <Header
          title={title}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenScannerPairing={() => setIsScannerModalOpen(true)}
        />

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7">
          {children}
        </main>
      </div>

      {/* Scanner Pairing Modal */}
      <Modal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        title="Hubungkan Pemindai Barcode HP"
        description="Gunakan kamera ponsel untuk memindai barcode barang secara nirkabel ke terminal kasir ini."
        maxWidth="md"
      >
        <div className="space-y-5 text-center">
          {/* QR Code Container */}
          <div className="p-4 bg-white border border-[#E5E5E0] rounded-xl inline-block mx-auto shadow-sm">
            <div className="w-48 h-48 bg-[#F4F4F0] rounded-lg flex flex-col items-center justify-center border border-dashed border-[#6FA084] p-4 mx-auto">
              <QrCode className="w-24 h-24 text-[#6FA084] mb-2" />
              <span className="text-[11px] font-semibold text-[#6FA084]">
                ROOM: tokoku-main-pos
              </span>
            </div>
          </div>

          <div className="text-left space-y-2 text-xs text-[#6B7280]">
            <p className="flex items-center gap-2 text-[#1A1A1A] font-semibold text-sm">
              <Smartphone className="w-4 h-4 text-[#6FA084]" />
              Cara Penggunaan:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs pl-1">
              <li>Buka kamera di HP kamu atau browser HP.</li>
              <li>Akses tautan scanner di bawah ini.</li>
              <li>Arahkan kamera HP ke barcode kemasan barang (misal: Indomie / Aqua).</li>
              <li>HP akan berbunyi "Beep" dan barang langsung masuk ke kasir!</li>
            </ol>
          </div>

          {/* Direct URL copy field */}
          <div className="flex items-center gap-2 p-2 bg-[#F4F4F0] rounded-lg border border-[#E5E5E0]">
            <input
              type="text"
              readOnly
              value={scannerUrl}
              className="bg-transparent text-xs text-[#1A1A1A] font-mono flex-1 outline-none px-2 select-all"
            />
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 h-8 text-xs"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#6FA084]" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Salin
                </>
              )}
            </Button>
          </div>

          <div className="flex justify-between items-center pt-2">
            <a
              href={scannerUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#6FA084] hover:underline flex items-center gap-1 font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka di Tab Baru untuk Test
            </a>
            <Button onClick={() => setIsScannerModalOpen(false)}>Selesai</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
