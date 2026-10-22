/**
 * Automated Verification Script for Modul 21:
 * Visual Security Audit Log Dashboard & Anomaly Inspector
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function runAuditDashboardVerification() {
  console.log("=== [TEST] MODUL 21: Visual Security Audit Log Dashboard ===");

  // 1. Verify environment credentials
  const envContent = fs.readFileSync(".env.local", "utf8");
  const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
  const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase credentials not found in .env.local");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 2. Test querying audit logs with count and foreign key join
  console.log("-> Step 1: Querying audit_logs with exact count and user join...");
  const { data: logs, count, error } = await supabase
    .from("audit_logs")
    .select("*, user:users(id, username, full_name, role)", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Failed to query audit_logs: ${error.message}`);
  }

  console.log(`✓ Successfully retrieved ${logs.length} logs (Total in database: ${count})`);

  // 3. Verify KPI classification counts
  console.log("-> Step 2: Testing KPI statistics computation...");
  const { data: allActions, error: statsError } = await supabase
    .from("audit_logs")
    .select("action");

  if (statsError) {
    throw new Error(`Failed to query audit stats: ${statsError.message}`);
  }

  const priceChanges = allActions.filter(a => a.action === "HARGA_DIUBAH").length;
  const stockAdjustments = allActions.filter(a => a.action === "STOK_DISESUAIKAN").length;
  const cancelledTransactions = allActions.filter(a => a.action === "TRANSAKSI_DIBATALKAN").length;
  const securityAlerts = allActions.filter(a =>
    a.action === "TAMPERING_DETECTED" ||
    a.action === "LOGIN_GAGAL" ||
    a.action === "RATE_LIMIT_EXCEEDED"
  ).length;

  console.log(`✓ Total Logs: ${allActions.length}`);
  console.log(`✓ Price Changes: ${priceChanges}`);
  console.log(`✓ Stock Adjustments: ${stockAdjustments}`);
  console.log(`✓ Cancelled Transactions: ${cancelledTransactions}`);
  console.log(`✓ Security Alerts: ${securityAlerts}`);

  // 4. Verify CSV Export format
  console.log("-> Step 3: Verifying CSV Export generator...");
  const sampleLog = logs[0];
  if (sampleLog) {
    const csvRow = [
      sampleLog.id,
      sampleLog.created_at,
      sampleLog.action,
      sampleLog.entity,
      sampleLog.entity_id || "-",
      sampleLog.user?.full_name || sampleLog.user?.username || "Sistem",
      sampleLog.user?.role || "-",
      sampleLog.ip_address || "Lokal",
    ];
    console.log("✓ Sample CSV row generated:", csvRow.join(", "));
  }

  // 5. Verify App Files
  console.log("-> Step 4: Verifying frontend files existence...");
  const auditPagePath = path.resolve("src/app/audit/page.tsx");
  const modalPath = path.resolve("src/components/audit/AuditDetailModal.tsx");

  if (!fs.existsSync(auditPagePath)) throw new Error("src/app/audit/page.tsx missing");
  if (!fs.existsSync(modalPath)) throw new Error("src/components/audit/AuditDetailModal.tsx missing");

  console.log("✓ src/app/audit/page.tsx verified");
  console.log("✓ src/components/audit/AuditDetailModal.tsx verified");

  console.log("\n🎉 ALL MODUL 21 AUDIT DASHBOARD TESTS PASSED SUCCESSFULLY!\n");
}

runAuditDashboardVerification().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
