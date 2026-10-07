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
          onOpenScannerPairing={
            onOpenScannerPairing || (() => setIsScannerModalOpen(true))
          }
        />

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7">
          {children}
        </main>
      </div>

      {/* Real Barcode / QR Scanner Pairing Modal */}
      <ScannerPairingModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        roomId="tokoku-main-pos"
      />
    </div>
  );
}
