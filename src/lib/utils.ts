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

export interface ChartNiceScale {
  niceMax: number;
  step: number;
  ticks: number[];
}

/**
 * Calculates clean, round tick intervals for chart Y-axes (e.g. 200rb, 500rb, 1jt intervals)
 */
export function calculateNiceScale(rawMax: number, targetIntervals = 5): ChartNiceScale {
  if (rawMax <= 0 || isNaN(rawMax)) {
    return {
      niceMax: 100000,
      step: 25000,
      ticks: [100000, 75000, 50000, 25000, 0],
    };
  }

  const roughStep = rawMax / targetIntervals;
  const exponent = Math.floor(Math.log10(roughStep));
  const magnitude = Math.pow(10, exponent);
  const fraction = roughStep / magnitude;

  // Pick nice step multiplier: 1, 2, 2.5, 5, or 10
  let niceMultiplier = 1;
  if (fraction <= 1.25) {
    niceMultiplier = 1;
  } else if (fraction <= 2.25) {
    niceMultiplier = 2;
  } else if (fraction <= 3.5) {
    niceMultiplier = 2.5;
  } else if (fraction <= 7.5) {
    niceMultiplier = 5;
  } else {
    niceMultiplier = 10;
  }

  const step = Math.max(1, Math.round(niceMultiplier * magnitude));
  const niceMax = Math.ceil(rawMax / step) * step;

  const ticks: number[] = [];
  for (let val = niceMax; val >= 0; val -= step) {
    ticks.push(Math.round(val));
  }

  if (ticks.length === 0 || ticks[ticks.length - 1] !== 0) {
    ticks.push(0);
  }

  return { niceMax, step, ticks };
}

