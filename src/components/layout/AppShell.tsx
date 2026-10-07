"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileDrawer } from "./MobileDrawer";
import { ScannerPairingModal } from "@/components/pos/ScannerPairingModal";
import { useAuthStore } from "@/stores/authStore";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  onOpenScannerPairing?: () => void;
}

export function AppShell({
  children,
  title,
  onOpenScannerPairing,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isAuthenticated } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = React.useState(false);

  // Auth & RBAC Enforcement
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const ownerOnlyRoutes = ["/dashboard", "/inventaris", "/laporan"];
    const isOwnerRoute = ownerOnlyRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (currentUser?.role === "kasir" && isOwnerRoute) {
      router.replace("/pos");
    }
  }, [isAuthenticated, currentUser?.role, pathname, router]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F4F0] text-[#1A1A1A] print:h-auto print:w-auto print:overflow-visible print:bg-white print:block">
      {/* Desktop Sticky Sidebar (Visible on md and up) */}
      <div className="hidden md:block shrink-0 print:hidden">
        <Sidebar />
      </div>

      {/* Mobile Drawer (Collapsible) */}
      <div className="print:hidden">
        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden print:h-auto print:overflow-visible print:block">
        {/* Persistent Top Header Bar */}
        <div className="print:hidden">
          <Header
            title={title}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenScannerPairing={
              onOpenScannerPairing || (() => setIsScannerModalOpen(true))
            }
          />
        </div>

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 print:h-auto print:overflow-visible print:p-0 print:m-0">
          {children}
        </main>
      </div>

      {/* Real Barcode / QR Scanner Pairing Modal */}
      <div className="print:hidden">
        <ScannerPairingModal
          isOpen={isScannerModalOpen}
          onClose={() => setIsScannerModalOpen(false)}
          roomId="tokoku-main-pos"
        />
      </div>
    </div>
  );
}
