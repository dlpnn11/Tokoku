import { supabase } from "@/lib/supabase";
import { AuditLog, AuditAction } from "@/types/database";
import { sanitizePostgrestFilter, getSafeErrorMessage } from "@/lib/security";

export interface AuditLogFilterOptions {
  action?: string;
  entity?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface RecordAuditParams {
  userId?: string | null;
  action: AuditAction | string;
  entity: "products" | "transactions" | "auth" | "system" | string;
  entityId?: string | null;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditStats {
  totalLogs: number;
  priceChangesCount: number;
  stockAdjustmentsCount: number;
  cancelledTransactionsCount: number;
  securityAlertsCount: number;
}

export const auditService = {
  /**
   * Fetch immutable audit logs with optional filtering, search, and pagination.
   */
  async getAuditLogs(options?: AuditLogFilterOptions) {
    let query = supabase
      .from("audit_logs")
      .select("*, user:users(id, username, full_name, role)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (options?.action && options.action !== "Semua") {
      query = query.eq("action", options.action);
    }

    if (options?.entity && options.entity !== "Semua") {
      query = query.eq("entity", options.entity);
    }

    if (options?.userId) {
      query = query.eq("user_id", options.userId);
    }

    if (options?.startDate) {
      query = query.gte("created_at", `${options.startDate}T00:00:00`);
    }

    if (options?.endDate) {
      query = query.lte("created_at", `${options.endDate}T23:59:59`);
    }

    if (options?.search && options.search.trim()) {
      const safeSearch = sanitizePostgrestFilter(options.search);
      if (safeSearch) {
        query = query.or(
          `action.ilike.%${safeSearch}%,entity.ilike.%${safeSearch}%,entity_id.ilike.%${safeSearch}%`
        );
      }
    }

    if (options?.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal memuat rekam jejak audit keamanan.",
          context: "getAuditLogs",
        })
      );
    }

    return {
      logs: (data || []) as AuditLog[],
      totalCount: count || 0,
    };
  },

  /**
   * Records a security or compliance event into the immutable audit trail.
   * Utilizes the server-side RPC stored function with automatic fallback.
   */
  async recordAuditEvent(params: RecordAuditParams): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc("log_security_audit_event", {
        p_user_id: params.userId || null,
        p_action: params.action,
        p_entity: params.entity,
        p_entity_id: params.entityId || null,
        p_old_values: params.oldValues || null,
        p_new_values: params.newValues || null,
        p_ip_address: params.ipAddress || null,
        p_user_agent:
          params.userAgent ||
          (typeof navigator !== "undefined" ? navigator.userAgent : null),
      });

      if (!error && data) {
        return data as string;
      }

      // Direct insert fallback if RPC is somehow unavailable
      const { data: insertData, error: insertError } = await supabase
        .from("audit_logs")
        .insert([
          {
            user_id: params.userId || null,
            action: params.action,
            entity: params.entity,
            entity_id: params.entityId || null,
            old_values: params.oldValues || null,
            new_values: params.newValues || null,
            ip_address: params.ipAddress || null,
            user_agent:
              params.userAgent ||
              (typeof navigator !== "undefined" ? navigator.userAgent : null),
          },
        ])
        .select("id")
        .single();

      if (!insertError && insertData?.id) {
        return insertData.id;
      }

      return null;
    } catch (err) {
      // Non-blocking: audit recording failures should never crash client UI
      if (process.env.NODE_ENV === "development") {
        console.warn("Audit log recording warning:", err);
      }
      return null;
    }
  },

  /**
   * Retrieves summary statistics for the audit trail dashboard / report.
   */
  async getAuditStats(): Promise<AuditStats> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("action");

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal memuat ringkasan audit keamanan.",
          context: "getAuditStats",
        })
      );
    }

    const logs = data || [];
    let priceChangesCount = 0;
    let stockAdjustmentsCount = 0;
    let cancelledTransactionsCount = 0;
    let securityAlertsCount = 0;

    for (const item of logs) {
      if (item.action === "HARGA_DIUBAH") {
        priceChangesCount++;
      } else if (item.action === "STOK_DISESUAIKAN") {
        stockAdjustmentsCount++;
      } else if (item.action === "TRANSAKSI_DIBATALKAN") {
        cancelledTransactionsCount++;
      } else if (
        item.action === "TAMPERING_DETECTED" ||
        item.action === "LOGIN_GAGAL" ||
        item.action === "RATE_LIMIT_EXCEEDED"
      ) {
        securityAlertsCount++;
      }
    }

    return {
      totalLogs: logs.length,
      priceChangesCount,
      stockAdjustmentsCount,
      cancelledTransactionsCount,
      securityAlertsCount,
    };
  },

  /**
   * Formats and exports audit logs to standard CSV string format.
   */
  exportLogsToCsv(logs: AuditLog[]): string {
    const headers = [
      "ID Log",
      "Waktu (ISO)",
      "Aksi",
      "Entitas",
      "ID Entitas",
      "Nama Operator",
      "Peran",
      "Alamat IP",
      "User Agent",
      "Nilai Lama (JSON)",
      "Nilai Baru (JSON)",
    ];

    const rows = logs.map((log) => [
      log.id,
      log.created_at,
      log.action,
      log.entity,
      log.entity_id || "-",
      log.user?.full_name || log.user?.username || "Sistem / Otomatis",
      log.user?.role || "-",
      log.ip_address || "Lokal",
      (log.user_agent || "-").replace(/"/g, '""'),
      log.old_values ? JSON.stringify(log.old_values).replace(/"/g, '""') : "-",
      log.new_values ? JSON.stringify(log.new_values).replace(/"/g, '""') : "-",
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row) => row.map((col) => `"${col}"`).join(",")),
    ].join("\r\n");

    return "\uFEFF" + csvContent; // Add UTF-8 BOM for Microsoft Excel compatibility
  },
};

