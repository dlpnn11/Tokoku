import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace("Rp", "Rp ");
}

/**
 * Rounds retail selling prices up to the nearest 500 (e.g. ends in .000 or .500)
 * standard for Indonesian micro-retail cash transactions.
 */
export function roundPrice500(amount: number): number {
  if (!amount || isNaN(amount)) return 0;
  return Math.ceil(amount / 500) * 500;
}

