"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Store,
  Package,
  History,
  BarChart3,
  ArrowLeftRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ("pemilik" | "kasir")[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
    roles: ["pemilik"],
  },
  {
    label: "POS / Kasir",
    href: "/pos",
    icon: Store,
    roles: ["pemilik", "kasir"],
  },
  {
    label: "Inventaris",
    href: "/inventaris",
    icon: Package,
    roles: ["pemilik"],
  },
  {
    label: "Riwayat",
    href: "/riwayat",
    icon: History,
    roles: ["pemilik", "kasir"],
  },
  {
    label: "Laporan",
    href: "/laporan",
    icon: BarChart3,
    roles: ["pemilik"],
  },
];

interface SidebarProps {
  onNavClick?: () => void;
  className?: string;
}

export function Sidebar({ onNavClick, className }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, switchRole } = useAuthStore();

  const allowedNavItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <aside
      className={cn(
        "w-[220px] h-screen bg-[#2C2C2C] flex flex-col justify-between shrink-0 select-none",
        className
      )}
    >
      {/* Top Section */}
      <div>
        {/* Brand Area */}
        <div className="h-16 px-5 border-b border-[#3D3D3D] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6FA084] flex items-center justify-center text-white">
            <Store className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-white tracking-wide">
            TokoKu
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {allowedNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                  isActive
                    ? "text-white bg-[#FFFFFF0F] font-semibold"
                    : "text-[#9E9E9E] hover:text-white hover:bg-[#FFFFFF0A]"
                )}
              >
                {/* Active Left Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#6FA084] rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive ? "text-[#6FA084]" : "text-[#9E9E9E]"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Role Switcher */}
      <div className="p-3 border-t border-[#3D3D3D] bg-[#262626]">
        <div className="p-2.5 rounded-lg bg-[#2F2F2F] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#3D4D43] text-[#6FA084] font-bold text-xs flex items-center justify-center shrink-0 border border-[#6FA084]/40">
              {getInitials(currentUser.full_name)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {currentUser.full_name}
              </p>
              <span
                className={cn(
                  "inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                  currentUser.role === "pemilik"
                    ? "bg-[#6FA084] text-white"
                    : "bg-[#6B7280] text-white"
                )}
              >
                {currentUser.role === "pemilik" ? "Pemilik" : "Kasir"}
              </span>
            </div>
          </div>

          {/* Quick Role Switcher Button */}
          <button
            onClick={() =>
              switchRole(currentUser.role === "pemilik" ? "kasir" : "pemilik")
            }
            title={`Ganti ke mode ${
              currentUser.role === "pemilik" ? "Kasir" : "Pemilik"
            }`}
            className="p-1.5 rounded-md hover:bg-[#3D3D3D] text-[#9E9E9E] hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
