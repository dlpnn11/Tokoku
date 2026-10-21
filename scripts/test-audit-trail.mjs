/**
 * Automated Verification Test Suite: Immutable Security Audit Trail Logging (Modul 20)
 *
 * Verifies:
 * 1. Strict database-enforced immutability: UPDATE on audit_logs is rejected (trigger & RLS).
 * 2. Strict database-enforced immutability: DELETE on audit_logs is rejected (trigger & RLS).
 * 3. Explicit audit event logging: log_security_audit_event RPC succeeds and records faithfully.
 * 4. Automated DB Trigger: Product price modifications automatically log HARGA_DIUBAH with diff.
 * 5. Automated DB Trigger: Product stock adjustments automatically log STOK_DISESUAIKAN with delta.
 * 6. Automated DB Trigger: Transaction checkouts automatically log TRANSAKSI_DIBUAT.
 * 7. Automated DB Trigger: Transaction cancellations automatically log TRANSAKSI_DIBATALKAN.
 * 8. Audit log query & filter layer: correctly filters by action, entity, and pagination.
 * 9. PostgREST filter injection protection: sanitized search queries on audit trail.
 * 10. Audit stats calculation: aggregates totalLogs, priceChanges, stockAdjustments, etc.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xgtkoclchscygrckhyya.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndGtvY2xjaHNjeWdyY2toeXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMTQyMzYsImV4cCI6MjEwNjc5MDIzNn0.TgfdIwdLr-8LQrZ5kCbrHt1WTV_m1mwiVoQ2rd1hYzU";

process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { auditService } = await import("../src/services/auditService.ts");
const { transactionService } = await import("../src/services/transactionService.ts");

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASSED: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failedCount++;
    process.exit(1);
  }
}

async function runTestSuite() {
  console.log("==========================================================");
  console.log("🛡️  TEST SUITE: Immutable Security Audit Trail Logging (Modul 20)");
  console.log("==========================================================\n");

  // 0. Fetch initial test product and cashier user
  console.log("[Setup] Fetching test catalog product and active user...");
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("id, name, sku, buy_price, sell_price, current_stock")
    .gt("current_stock", 10)
    .limit(1)
    .single();

  if (prodErr || !product) {
    throw new Error(`Failed to fetch test product: ${prodErr?.message}`);
  }

  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, username")
    .limit(1)
    .single();

  if (userErr || !user) {
    throw new Error(`Failed to fetch test user: ${userErr?.message}`);
  }

  console.log(`  Target product: "${product.name}" (${product.sku})`);
  console.log(`  Current sell_price: Rp ${product.sell_price}, stock: ${product.current_stock}`);
  console.log(`  Acting user: "${user.username}" (${user.id})\n`);

  // ==========================================================
  // TEST 1: Explicit Audit Event Logging (log_security_audit_event RPC)
  // ==========================================================
  console.log("[Test 1] Explicit Audit Event Logging via auditService");
  const testReason = `Automated verification run at ${new Date().toISOString()}`;
  const logId = await auditService.recordAuditEvent({
    userId: user.id,
    action: "LOGIN_SUKSES",
    entity: "auth",
    entityId: user.id,
    newValues: { username: user.username, note: testReason },
  });

  assert(!!logId, "auditService.recordAuditEvent successfully returned a log UUID");

  // Verify the log row exists in audit_logs
  const { data: loggedRow, error: fetchErr } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("id", logId)
    .single();

  assert(!fetchErr && loggedRow, "Log row persisted faithfully in database");
  assert(loggedRow?.action === "LOGIN_SUKSES", "Logged action matches 'LOGIN_SUKSES'");
  assert(loggedRow?.entity === "auth", "Logged entity matches 'auth'");
  assert(loggedRow?.new_values?.note === testReason, "Logged new_values payload verified\n");

  // ==========================================================
  // TEST 2: Strict Database-Enforced Immutability (Anti-Tampering UPDATE)
  // ==========================================================
  console.log("[Test 2] Immutability: Attempting UPDATE on audit_logs");
  const { data: updateData, error: updateErr } = await supabase
    .from("audit_logs")
    .update({ action: "ACTION_TAMPERED" })
    .eq("id", logId)
    .select();

  // Either RLS policy prevents update (0 rows affected or error) or trigger raises exception
  const updateBlocked =
    !!updateErr || !updateData || updateData.length === 0;
  assert(
    updateBlocked,
    "UPDATE operation on audit_logs was rejected by database security"
  );

  // Confirm row content was NOT modified
  const { data: verifyRow } = await supabase
    .from("audit_logs")
    .select("action")
    .eq("id", logId)
    .single();

  assert(
    verifyRow?.action === "LOGIN_SUKSES",
    "Integrity check passed: action remains 'LOGIN_SUKSES' despite update attempt\n"
  );

  // ==========================================================
  // TEST 3: Strict Database-Enforced Immutability (Anti-Tampering DELETE)
  // ==========================================================
  console.log("[Test 3] Immutability: Attempting DELETE on audit_logs");
  const { data: deleteData, error: deleteErr } = await supabase
    .from("audit_logs")
    .delete()
    .eq("id", logId)
    .select();

  const deleteBlocked =
    !!deleteErr || !deleteData || deleteData.length === 0;
  assert(
    deleteBlocked,
    "DELETE operation on audit_logs was rejected by database security"
  );

  // Confirm row still exists
  const { data: verifyStillExists } = await supabase
    .from("audit_logs")
    .select("id")
    .eq("id", logId)
    .single();

  assert(
    verifyStillExists?.id === logId,
    "Integrity check passed: audit row was NOT deleted\n"
  );

  // ==========================================================
  // TEST 4: Automated Trigger on Price Change (HARGA_DIUBAH)
  // ==========================================================
  console.log("[Test 4] Automated Trigger: Product price change (HARGA_DIUBAH)");
  const originalSellPrice = Number(product.sell_price);
  const tempSellPrice = originalSellPrice + 500;

  // Update sell price
  const { error: priceChangeErr } = await supabase
    .from("products")
    .update({ sell_price: tempSellPrice })
    .eq("id", product.id);

  assert(!priceChangeErr, "Product sell price updated to temporary price");

  // Verify HARGA_DIUBAH log was automatically generated by database trigger
  const { data: priceAuditLogs, error: priceAuditErr } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("action", "HARGA_DIUBAH")
    .eq("entity_id", product.id)
    .order("created_at", { ascending: false })
    .limit(1);

  assert(!priceAuditErr && priceAuditLogs?.length > 0, "Database trigger automatically recorded HARGA_DIUBAH");
  const latestPriceLog = priceAuditLogs[0];
  assert(
    Number(latestPriceLog.old_values?.sell_price) === originalSellPrice,
    `Audit old_values recorded original price Rp ${originalSellPrice}`
  );
  assert(
    Number(latestPriceLog.new_values?.sell_price) === tempSellPrice,
    `Audit new_values recorded updated price Rp ${tempSellPrice}`
  );

  // Revert price back to original
  await supabase
    .from("products")
    .update({ sell_price: originalSellPrice })
    .eq("id", product.id);
  console.log("  Reverted product sell price back to original\n");

  // ==========================================================
  // TEST 5: Automated Trigger on Stock Adjustment (STOK_DISESUAIKAN)
  // ==========================================================
  console.log("[Test 5] Automated Trigger: Product stock adjustment (STOK_DISESUAIKAN)");
  const originalStock = Number(product.current_stock);
  const tempStock = originalStock + 1;

  // Update stock
  const { error: stockChangeErr } = await supabase
    .from("products")
    .update({ current_stock: tempStock })
    .eq("id", product.id);

  assert(!stockChangeErr, "Product stock updated by +1");

  // Verify STOK_DISESUAIKAN log was automatically generated
  const { data: stockAuditLogs, error: stockAuditErr } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("action", "STOK_DISESUAIKAN")
    .eq("entity_id", product.id)
    .order("created_at", { ascending: false })
    .limit(1);

  assert(!stockAuditErr && stockAuditLogs?.length > 0, "Database trigger automatically recorded STOK_DISESUAIKAN");
  const latestStockLog = stockAuditLogs[0];
  assert(
    Number(latestStockLog.old_values?.current_stock) === originalStock,
    `Audit old_values recorded original stock ${originalStock}`
  );
  assert(
    Number(latestStockLog.new_values?.current_stock) === tempStock,
    `Audit new_values recorded new stock ${tempStock}`
  );
  assert(
    Number(latestStockLog.new_values?.delta) === 1,
    "Audit new_values calculated delta +1 accurately"
  );

  // Revert stock back
  await supabase
    .from("products")
    .update({ current_stock: originalStock })
    .eq("id", product.id);
  console.log("  Reverted product stock back to original\n");

  // ==========================================================
  // TEST 6: Automated Trigger on Transaction Creation (TRANSAKSI_DIBUAT)
  // ==========================================================
  console.log("[Test 6] Automated Trigger: Transaction checkout (TRANSAKSI_DIBUAT)");
  const testInvoice = `TEST-AUDIT-${Date.now()}`;
  const checkoutRes = await transactionService.checkout({
    invoiceNumber: testInvoice,
    userId: user.id,
    totalAmount: originalSellPrice,
    paymentMethod: "Tunai",
    cashReceived: originalSellPrice,
    cashChange: 0,
    items: [
      {
        product: {
          ...product,
          sell_price: originalSellPrice,
        },
        quantity: 1,
        subtotal: originalSellPrice,
      },
    ],
  });

  assert(checkoutRes.success, `Transaction checkout succeeded (${testInvoice})`);

  // Verify TRANSAKSI_DIBUAT audit log
  const { data: txAuditLogs, error: txAuditErr } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("action", "TRANSAKSI_DIBUAT")
    .order("created_at", { ascending: false })
    .limit(1);

  assert(!txAuditErr && txAuditLogs?.length > 0, "Database trigger automatically recorded TRANSAKSI_DIBUAT");
  assert(
    txAuditLogs[0]?.new_values?.invoice_number === testInvoice,
    `Audit record matches invoice ${testInvoice}`
  );
  assert(
    Number(txAuditLogs[0]?.new_values?.total_amount) === originalSellPrice,
    `Audit record matches total amount Rp ${originalSellPrice}\n`
  );

  // ==========================================================
  // TEST 7: Automated Trigger on Transaction Cancellation (TRANSAKSI_DIBATALKAN)
  // ==========================================================
  console.log("[Test 7] Automated Trigger: Transaction cancellation (TRANSAKSI_DIBATALKAN)");
  const cancelRes = await transactionService.cancelTransaction(checkoutRes.transaction_id);
  assert(cancelRes.success, "Transaction cancelled and items restocked");

  // Verify TRANSAKSI_DIBATALKAN audit log
  const { data: cancelAuditLogs, error: cancelAuditErr } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("action", "TRANSAKSI_DIBATALKAN")
    .eq("entity_id", checkoutRes.transaction_id)
    .single();

  assert(!cancelAuditErr && cancelAuditLogs, "Database trigger automatically recorded TRANSAKSI_DIBATALKAN");
  assert(
    cancelAuditLogs?.old_values?.status === "Selesai",
    "Audit record captured old status 'Selesai'"
  );
  assert(
    cancelAuditLogs?.new_values?.status === "Dibatalkan",
    "Audit record captured new status 'Dibatalkan'\n"
  );

  // ==========================================================
  // TEST 8: Query & Filter Capabilities (auditService.getAuditLogs)
  // ==========================================================
  console.log("[Test 8] Service Query & Filter Capabilities");
  const filtered = await auditService.getAuditLogs({
    action: "HARGA_DIUBAH",
    limit: 5,
  });

  assert(Array.isArray(filtered.logs), "auditService.getAuditLogs returns logs array");
  assert(
    filtered.logs.every((l) => l.action === "HARGA_DIUBAH"),
    "Filter by action strictly returned only 'HARGA_DIUBAH' logs"
  );
  assert(filtered.totalCount > 0, `Total matching logs count returned (${filtered.totalCount})\n`);

  // ==========================================================
  // TEST 9: PostgREST Filter Injection Sanitization on Search
  // ==========================================================
  console.log("[Test 9] PostgREST Filter Injection Defense on Audit Search");
  const injectionSearch = ",action.eq.TEST(),:;\"'--";
  const sanitizedSearchResult = await auditService.getAuditLogs({
    search: injectionSearch,
    limit: 5,
  });

  assert(
    Array.isArray(sanitizedSearchResult.logs),
    "Malicious injection search term safely handled without query error\n"
  );

  // ==========================================================
  // TEST 10: Audit Statistics Aggregation (auditService.getAuditStats)
  // ==========================================================
  console.log("[Test 10] Audit Statistics Aggregation");
  const stats = await auditService.getAuditStats();
  assert(typeof stats.totalLogs === "number" && stats.totalLogs > 0, `Total audit logs: ${stats.totalLogs}`);
  assert(stats.priceChangesCount > 0, `Price changes logged: ${stats.priceChangesCount}`);
  assert(stats.stockAdjustmentsCount > 0, `Stock adjustments logged: ${stats.stockAdjustmentsCount}`);
  assert(stats.cancelledTransactionsCount > 0, `Cancelled transactions logged: ${stats.cancelledTransactionsCount}`);

  console.log("\n==========================================================");
  console.log(`🎉 ALL TESTS PASSED! (${passedCount} passed, ${failedCount} failed)`);
  console.log("==========================================================");
}

runTestSuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
