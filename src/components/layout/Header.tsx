"use client";

import * as React from "react";
import { Menu, QrCode, ChevronDown, UserCheck, LogOut, ShieldCheck } from "lucide-react";
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

        {/* User Profile Pill with Interactive Dropdown */}
        <UserProfileDropdown />
      </div>
    </header>
  );
}

function UserProfileDropdown() {
  const { currentUser, switchRole } = useAuthStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari sistem TokoKu?")) {
      // In POS context, default to Kasir role or prompt
      switchRole("kasir");
      setIsOpen(false);
      alert("Anda telah keluar. Hak akses dialihkan ke Kasir.");
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl transition-all cursor-pointer",
          "hover:bg-[#F4F4F0] border border-transparent",
          isOpen && "bg-[#F4F4F0] border-[#E5E5E0]"
        )}
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-[#6FA084] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
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
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ml-0.5",
            isOpen && "transform rotate-180 text-[#6FA084]"
          )}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-[#E5E5E0] shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95">
          {/* User summary header */}
          <div className="px-4 py-3 border-b border-[#E5E5E0] bg-[#FAFBF9] rounded-t-2xl -mt-2 mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#6FA084] text-white font-bold text-sm flex items-center justify-center shrink-0">
                {getInitials(currentUser.full_name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1A1A1A] truncate">
                  {currentUser.full_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                      currentUser.role === "pemilik"
                        ? "bg-[#EBF3EE] text-[#6FA084]"
                        : "bg-[#F4F4F0] text-[#6B7280]"
                    )}
                  >
                    {currentUser.role}
                  </span>
                  <span className="text-[10px] text-[#6B7280]">• TokoKu POS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Role Switcher Section */}
          <div className="px-3 py-2">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block px-2 mb-1.5">
              Beralih Akun (Demo Mode)
            </span>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  switchRole("pemilik");
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer text-left",
                  currentUser.role === "pemilik"
                    ? "bg-[#F4F8F5] text-[#6FA084] font-bold"
                    : "hover:bg-[#F4F4F0] text-[#1A1A1A]"
                )}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#6FA084]" />
                  <div>
                    <div className="font-bold">Firdaus Ubaidillah</div>
                    <div className="text-[10px] text-[#6B7280] font-normal">
                      Akses Pemilik (Semua Menu)
                    </div>
                  </div>
                </div>
                {currentUser.role === "pemilik" && (
                  <span className="text-xs text-[#6FA084] font-bold">Aktif</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  switchRole("kasir");
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer text-left",
                  currentUser.role === "kasir"
                    ? "bg-[#F4F8F5] text-[#6FA084] font-bold"
                    : "hover:bg-[#F4F4F0] text-[#1A1A1A]"
                )}
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#6FA084]" />
                  <div>
                    <div className="font-bold">Ani Rahayu</div>
                    <div className="text-[10px] text-[#6B7280] font-normal">
                      Akses Kasir (POS & Riwayat)
                    </div>
                  </div>
                </div>
                {currentUser.role === "kasir" && (
                  <span className="text-xs text-[#6FA084] font-bold">Aktif</span>
                )}
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-[#E5E5E0] my-1" />

          {/* Logout Action */}
          <div className="px-2 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-[#D64545] hover:bg-[#FDEAEA] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Keluar / Ganti Shift
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
