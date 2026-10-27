"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TokoKuLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Ukuran logo dalam pixel (contoh: 32, 40, 48, 64)
   * Default: 32
   */
  size?: number;
  /**
   * Jika true, hanya merender ikon keranjang putih tanpa background hijau
   */
  iconOnly?: boolean;
  /**
   * Jika true, merender tulisan "TokoKu" di sebelah kanan logo
   */
  showText?: boolean;
  /**
   * Custom styling untuk container background
   */
  className?: string;
  /**
   * Custom styling untuk text "TokoKu" jika showText aktif
   */
  textClassName?: string;
}

/**
 * TokoKu Shopping Cart Vector Icon
 * Merepresentasikan ikon keranjang belanja putih khas TokoKu
 */
export function TokoKuCartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* Handle & Spine & Base Frame */}
        <path
          d="M24 31c.7-2.2 2.7-3.8 5-3.8h2.8c1.8 0 3.3 1.2 3.8 3l6.8 27.2c.5 1.4 1.8 2.4 3.3 2.4h26.3"
          strokeWidth="6.5"
          fill="none"
        />
        {/* Top Speed Bar */}
        <line x1="43" y1="38" x2="74" y2="38" strokeWidth="6.5" />
        {/* Middle Speed Bar */}
        <line x1="46" y1="47" x2="70" y2="47" strokeWidth="6.5" />
      </g>
      {/* Two Wheels Underneath */}
      <circle cx="45" cy="71" r="5.5" fill="currentColor" />
      <circle cx="64" cy="71" r="5.5" fill="currentColor" />
    </svg>
  );
}

/**
 * TokoKu Brand Logo Component
 * Menampilkan logo resmi TokoKu: Keranjang putih dengan latar belakang hijau khas (#6FA084)
 */
export function TokoKuLogo({
  size = 32,
  iconOnly = false,
  showText = false,
  className,
  textClassName,
  ...props
}: TokoKuLogoProps) {
  // Hitung border radius proporsional berdasarkan size
  const borderRadius = Math.max(6, Math.round(size * 0.22));

  if (iconOnly) {
    return (
      <div
        style={{ width: size, height: size }}
        className={cn("text-white inline-flex items-center justify-center shrink-0", className)}
        {...props}
      >
        <TokoKuCartIcon />
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)} {...props}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: `${borderRadius}px`,
        }}
        className="bg-[#6FA084] text-white flex items-center justify-center shrink-0 shadow-2xs p-1"
        aria-label="TokoKu Logo"
      >
        <TokoKuCartIcon />
      </div>
      {showText && (
        <span
          className={cn(
            "font-black tracking-tight text-white",
            size >= 48 ? "text-2xl" : size >= 36 ? "text-xl" : "text-lg",
            textClassName
          )}
        >
          TokoKu
        </span>
      )}
    </div>
  );
}
