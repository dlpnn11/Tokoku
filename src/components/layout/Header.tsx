"use client";

import * as React from "react";
import { Menu, QrCode } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  onOpenMobileMenu?: () => void;
  onOpenScannerPairing?: () => void;
}

export function Header({
  title,
  onOpenMobileMenu,
  onOpenScannerPairing,
}: HeaderProps) {
  const { currentUser } = useAuthStore();
  const [currentDateTime, setCurrentDateTime] = React.useState<string>("");

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      };
      // Format: Senin, 28 September 2026 | 16:02 WIB
      const formatted = new Intl.DateTimeFormat("id-ID", options).format(now);
      setCurrentDateTime(formatted.replace("pukul ", "| "));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <header className="h-16 border-b border-[#E5E5E0] bg-white px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 select-none">
      {/* Left Area */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-[#1A1A1A] hover:bg-[#F4F4F0] transition-colors cursor-pointer"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Status Dot & Title */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6FA084] shrink-0 animate-pulse" />
          <h2 className="text-xs md:text-sm font-bold tracking-wider text-[#1A1A1A] uppercase">
            {title || "TERMINAL POS & INVENTORY"}
          </h2>
        </div>
      </div>

      {/* Right Area */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Live Date-Time WIB (Desktop only) */}
        {currentDateTime && (
          <div className="hidden lg:flex items-center text-xs font-medium text-[#6B7280]">
            <span>{currentDateTime}</span>
          </div>
        )}

        {/* Pairing Scanner Shortcut (Desktop) */}
        {onOpenScannerPairing && (
          <button
            onClick={onOpenScannerPairing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#6FA084] text-[#6FA084] bg-white hover:bg-[#F4F8F5] text-xs font-semibold transition-colors cursor-pointer"
            title="Hubungkan Pemindai Kamera HP"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Scanner HP</span>
          </button>
        )}

        {/* Divider */}
        <div className="hidden lg:block h-6 w-[1px] bg-[#E5E5E0]" />

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-[#6FA084] text-white font-bold text-xs flex items-center justify-center shrink-0">
            {getInitials(currentUser.full_name)}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[#1A1A1A] leading-tight">
              {currentUser.full_name}
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold",
                currentUser.role === "pemilik"
                  ? "text-[#6FA084]"
                  : "text-[#6B7280]"
              )}
            >
              {currentUser.role === "pemilik" ? "Pemilik" : "Kasir"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
