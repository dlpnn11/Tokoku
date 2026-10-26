import { supabase } from "@/lib/supabase";
import {
  PosShift,
  ShiftReconciliationStatus,
  ShiftSummaryCalculation,
} from "@/types/database";
import { auditService } from "./auditService";
import { getSafeErrorMessage } from "@/lib/security";

const LOCAL_ACTIVE_SHIFT_KEY = "tokoku_active_shift";
const LOCAL_SHIFT_HISTORY_KEY = "tokoku_shift_history";

export interface OpenShiftParams {
  userId: string;
  cashierName: string;
  startingCash: number;
  notes?: string;
}

export interface CloseShiftParams {
  shiftId: string;
  actualCash: number;
  notes?: string;
  denominationCounts?: Record<number, number>;
}

export interface CloseShiftResult {
  shift: PosShift;
  discrepancy: number;
  status: ShiftReconciliationStatus;
  summary: ShiftSummaryCalculation;
}

/**
 * Standard Indonesian Cash Denominations (Banknotes & Coins)
 */
export const CASH_DENOMINATIONS = [
  { value: 100000, label: "Rp 100.000", type: "paper" },
  { value: 50000, label: "Rp 50.000", type: "paper" },
  { value: 20000, label: "Rp 20.000", type: "paper" },
  { value: 10000, label: "Rp 10.000", type: "paper" },
  { value: 5000, label: "Rp 5.000", type: "paper" },
  { value: 2000, label: "Rp 2.000", type: "paper" },
  { value: 1000, label: "Rp 1.000", type: "paper" },
  { value: 1000, label: "Rp 1.000 (Koin)", type: "coin" },
  { value: 500, label: "Rp 500 (Koin)", type: "coin" },
  { value: 200, label: "Rp 200 (Koin)", type: "coin" },
  { value: 100, label: "Rp 100 (Koin)", type: "coin" },
] as const;

/**
 * Helper to calculate total from denomination map
 */
export function calculateDenominationTotal(counts: Record<number, number>): number {
  return Object.entries(counts).reduce((sum, [nominalStr, count]) => {
    const nominal = Number(nominalStr);
    const qty = Number(count) || 0;
    return sum + (nominal * qty);
  }, 0);
}

/**
 * Helper to read from localStorage safely in browser environment
 */
function getLocalActiveShift(): PosShift | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVE_SHIFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalActiveShift(shift: PosShift | null): void {
  if (typeof window === "undefined") return;
  try {
    if (shift) {
      localStorage.setItem(LOCAL_ACTIVE_SHIFT_KEY, JSON.stringify(shift));
      // Also append to local history
      const history = getLocalShiftHistory();
      const existingIdx = history.findIndex((s) => s.id === shift.id);
      if (existingIdx >= 0) {
        history[existingIdx] = shift;
      } else {
        history.unshift(shift);
      }
      localStorage.setItem(LOCAL_SHIFT_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
    } else {
      localStorage.removeItem(LOCAL_ACTIVE_SHIFT_KEY);
    }
  } catch {
    // Non-blocking in private browsing
  }
}

function getLocalShiftHistory(): PosShift[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_SHIFT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const shiftService = {
  /**
   * Retrieves the currently open shift for this terminal or cashier.
   */
  async getCurrentShift(userId?: string): Promise<PosShift | null> {
    try {
      let query = supabase
        .from("pos_shifts")
        .select("*, user:users(id, username, full_name, role)")
        .eq("status", "open")
        .order("start_time", { ascending: false })
        .limit(1);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const active = data[0] as PosShift;
        setLocalActiveShift(active);
        return active;
      }

      // If no remote open shift found, fallback to local storage
      return getLocalActiveShift();
    } catch {
      return getLocalActiveShift();
    }
  },

  /**
   * Opens a new cashier shift with an initial starting float (Modal Awal).
   */
  async openShift(params: OpenShiftParams): Promise<PosShift> {
    const startingCash = Math.max(0, Number(params.startingCash) || 0);

    // 1. Check if user already has an open shift
    const existing = await this.getCurrentShift(params.userId);
    if (existing && existing.status === "open") {
      return existing;
    }

    const shiftId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `shift-${Date.now()}`;

    const newShift: PosShift = {
      id: shiftId,
      user_id: params.userId,
      cashier_name: params.cashierName,
      start_time: new Date().toISOString(),
      end_time: null,
      starting_cash: startingCash,
      expected_cash: null,
      actual_cash: null,
      discrepancy: null,
      total_cash_sales: 0,
      total_qris_sales: 0,
      total_sales: 0,
      transactions_count: 0,
      status: "open",
      notes: params.notes || null,
      created_at: new Date().toISOString(),
    };

    // 2. Persist to Supabase with local fallback
    try {
      const { data, error } = await supabase
        .from("pos_shifts")
        .insert([
          {
            id: newShift.id,
            user_id: newShift.user_id,
            cashier_name: newShift.cashier_name,
            start_time: newShift.start_time,
            starting_cash: newShift.starting_cash,
            status: "open",
            notes: newShift.notes,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        const savedShift = data as PosShift;
        setLocalActiveShift(savedShift);
      } else {
        setLocalActiveShift(newShift);
      }
    } catch {
      setLocalActiveShift(newShift);
    }

    // 3. Record immutable audit log
    await auditService.recordAuditEvent({
      userId: params.userId,
      action: "SHIFT_OPENED",
      entity: "shifts",
      entityId: newShift.id,
      newValues: {
        shift_id: newShift.id,
        cashier_name: params.cashierName,
        starting_cash: startingCash,
        start_time: newShift.start_time,
        notes: params.notes || null,
      },
    });

    return newShift;
  },

  /**
   * Calculates actual theoretical sales from completed transactions in the shift window.
   * NOTE: This is evaluated only server-side / upon reconciliation submission
   * to strictly preserve the Blind Balancing integrity.
   */
  async calculateShiftMetrics(shift: PosShift): Promise<ShiftSummaryCalculation> {
    try {
      let query = supabase
        .from("transactions")
        .select("total_amount, payment_method, status, created_at")
        .gte("created_at", shift.start_time)
        .eq("status", "Selesai");

      if (shift.end_time) {
        query = query.lte("created_at", shift.end_time);
      }

      const { data, error } = await query;

      let totalCashSales = 0;
      let totalQrisSales = 0;
      let transactionsCount = 0;

      if (!error && data) {
        for (const tx of data) {
          const amt = Number(tx.total_amount) || 0;
          if (tx.payment_method === "Tunai") {
            totalCashSales += amt;
          } else if (tx.payment_method === "QRIS") {
            totalQrisSales += amt;
          }
          transactionsCount++;
        }
      }

      const totalSales = totalCashSales + totalQrisSales;
      const expectedCash = Number(shift.starting_cash) + totalCashSales;

      return {
        shiftId: shift.id,
        startingCash: Number(shift.starting_cash),
        totalCashSales,
        totalQrisSales,
        totalSales,
        transactionsCount,
        expectedCash,
      };
    } catch {
      const expectedCash = Number(shift.starting_cash);
      return {
        shiftId: shift.id,
        startingCash: Number(shift.starting_cash),
        totalCashSales: 0,
        totalQrisSales: 0,
        totalSales: 0,
        transactionsCount: 0,
        expectedCash,
      };
    }
  },

  /**
   * Closes the active shift using Blind Cash Balancing.
   * Cashier enters the physically counted cash amount without seeing the expected system figure.
   * The system then computes discrepancy:
   *   discrepancy = actualCash - expectedCash
   *   status = BALANCED (0), OVER (> 0), or SHORT (< 0).
   */
  async closeShift(params: CloseShiftParams): Promise<CloseShiftResult> {
    const active = await this.getCurrentShift();
    if (!active) {
      throw new Error("Tidak ada shift kasir yang sedang aktif untuk ditutup.");
    }

    if (active.id !== params.shiftId && params.shiftId !== "active") {
      // Use active shift if matching or fallback
    }

    const actualCash = Math.max(0, Number(params.actualCash) || 0);

    // 1. Calculate theoretical sales from database
    const metrics = await this.calculateShiftMetrics(active);
    const expectedCash = metrics.expectedCash;
    const discrepancy = actualCash - expectedCash;

    let reconStatus: ShiftReconciliationStatus = "BALANCED";
    if (discrepancy > 0) {
      reconStatus = "OVER";
    } else if (discrepancy < 0) {
      reconStatus = "SHORT";
    }

    const endTime = new Date().toISOString();

    const closedShift: PosShift = {
      ...active,
      end_time: endTime,
      status: "closed",
      expected_cash: expectedCash,
      actual_cash: actualCash,
      discrepancy,
      total_cash_sales: metrics.totalCashSales,
      total_qris_sales: metrics.totalQrisSales,
      total_sales: metrics.totalSales,
      transactions_count: metrics.transactionsCount,
      notes: params.notes || active.notes || null,
    };

    // 2. Persist update to Supabase
    try {
      await supabase
        .from("pos_shifts")
        .update({
          end_time: endTime,
          status: "closed",
          expected_cash: expectedCash,
          actual_cash: actualCash,
          discrepancy,
          total_cash_sales: metrics.totalCashSales,
          total_qris_sales: metrics.totalQrisSales,
          total_sales: metrics.totalSales,
          transactions_count: metrics.transactionsCount,
          notes: closedShift.notes,
        })
        .eq("id", active.id);
    } catch {
      // Non-blocking fallback
    }

    // 3. Clear active shift from local storage and update history
    setLocalActiveShift(null);
    const history = getLocalShiftHistory();
    const idx = history.findIndex((s) => s.id === closedShift.id);
    if (idx >= 0) {
      history[idx] = closedShift;
    } else {
      history.unshift(closedShift);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_SHIFT_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
    }

    // 4. Record permanent immutable audit trail
    await auditService.recordAuditEvent({
      userId: active.user_id,
      action: "SHIFT_CLOSED_RECONCILIATION",
      entity: "shifts",
      entityId: active.id,
      newValues: {
        shift_id: active.id,
        cashier_name: active.cashier_name,
        start_time: active.start_time,
        end_time: endTime,
        starting_cash: active.starting_cash,
        expected_cash: expectedCash,
        actual_cash: actualCash,
        discrepancy,
        reconciliation_status: reconStatus,
        total_cash_sales: metrics.totalCashSales,
        total_qris_sales: metrics.totalQrisSales,
        total_sales: metrics.totalSales,
        transactions_count: metrics.transactionsCount,
        notes: params.notes || null,
        denomination_breakdown: params.denominationCounts || null,
      },
    });

    return {
      shift: closedShift,
      discrepancy,
      status: reconStatus,
      summary: metrics,
    };
  },

  /**
   * Fetches past shifts history for audit and owner reporting.
   */
  async getShiftHistory(limit: number = 20): Promise<PosShift[]> {
    try {
      const { data, error } = await supabase
        .from("pos_shifts")
        .select("*, user:users(id, username, full_name, role)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as PosShift[];
      }
      return getLocalShiftHistory().slice(0, limit);
    } catch {
      return getLocalShiftHistory().slice(0, limit);
    }
  },
};
