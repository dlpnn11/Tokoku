/**
 * Automated Verification Test Suite: Sanitasi Pesan Error / Anti-Information Disclosure (Modul 19)
 *
 * Verifies:
 * 1. Sensitive database pattern detector accurately flags SQL syntax, table names, and PostgREST codes.
 * 2. Unique constraint violations (code 23505) are transformed into friendly Indonesian guidance without leaking index names.
 * 3. Foreign key constraint violations (code 23503) are masked to prevent reconnaissance of database relations.
 * 4. Check constraint violations (code 23514) are sanitized to prevent disclosure of internal check expressions.
 * 5. Undefined table/column errors (code 42P01, 42703) completely conceal internal schema & column names.
 * 6. Permission / RLS denial errors (code 42501) prevent reconnaissance of table access policies.
 * 7. Syntax / PostgREST filter injection errors conceal query syntax and internal parser traces.
 * 8. Network and offline connection failures return friendly connection advice.
 * 9. Custom application business exceptions & Zod validation messages are cleanly preserved.
 * 10. Live Supabase simulation: intentional duplicate SKU / bad query produces sanitized error with ZERO technical leakage.
 */

import { createClient } from "@supabase/supabase-js";
import {
  getSafeErrorMessage,
  containsSensitiveDatabaseDetails,
} from "../src/lib/errorHandler.ts";

const SUPABASE_URL = "https://xgtkoclchscygrckhyya.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndGtvY2xjaHNjeWdyY2toeXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMTQyMzYsImV4cCI6MjEwNjc5MDIzNn0.TgfdIwdLr-8LQrZ5kCbrHt1WTV_m1mwiVoQ2rd1hYzU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  console.log("🛡️  TEST SUITE: Error Sanitization & Anti-Reconnaissance (Modul 19)");
  console.log("==========================================================\n");

  // Test 1: Detection of Sensitive Technical Details
  console.log("[Test 1] Detector: Flagging Sensitive Database Keywords & Signatures");
  assert(
    containsSensitiveDatabaseDetails('relation "products" does not exist'),
    "Detects table relation leakage"
  );
  assert(
    containsSensitiveDatabaseDetails('column "secret_col" does not exist'),
    "Detects column leakage"
  );
  assert(
    containsSensitiveDatabaseDetails('duplicate key value violates unique constraint "products_sku_key"'),
    "Detects unique constraint leakage"
  );
  assert(
    containsSensitiveDatabaseDetails('violates foreign key constraint "products_category_id_fkey"'),
    "Detects foreign key constraint leakage"
  );
  assert(
    containsSensitiveDatabaseDetails('new row violates check constraint "chk_tx_cash_integrity"'),
    "Detects check constraint name leakage"
  );
  assert(
    containsSensitiveDatabaseDetails("permission denied for table users"),
    "Detects permission/table leakage"
  );
  assert(
    containsSensitiveDatabaseDetails('syntax error at or near "SELECT"'),
    "Detects SQL syntax error leakage"
  );
  assert(
    containsSensitiveDatabaseDetails("PL/pgSQL function create_pos_transaction line 45 at SQL statement"),
    "Detects PL/pgSQL internal stack trace leakage"
  );
  assert(
    !containsSensitiveDatabaseDetails("Stok produk tidak mencukupi"),
    "Safe business message is not flagged as sensitive"
  );
  assert(
    !containsSensitiveDatabaseDetails("Username atau password salah"),
    "Safe auth message is not flagged as sensitive"
  );

  // Test 2: Unique Constraint Violations (23505)
  console.log("\n[Test 2] Sanitizing Unique Constraint Violations (Code 23505)");
  const skuError = {
    code: "23505",
    message: 'duplicate key value violates unique constraint "products_sku_key"',
    details: 'Key (sku)=(8992753129999) already exists.',
  };
  const safeSkuMsg = getSafeErrorMessage(skuError);
  assert(
    safeSkuMsg.includes("SKU") && safeSkuMsg.includes("sudah terdaftar"),
    `SKU error converted to friendly message: "${safeSkuMsg}"`
  );
  assert(!containsSensitiveDatabaseDetails(safeSkuMsg), "Sanitized SKU message has zero leakage");

  const barcodeError = {
    code: "23505",
    message: 'duplicate key value violates unique constraint "idx_products_barcode_unique"',
    details: 'Key (barcode)=(123456789) already exists.',
  };
  const safeBarcodeMsg = getSafeErrorMessage(barcodeError);
  assert(
    safeBarcodeMsg.includes("Barcode") && safeBarcodeMsg.includes("sudah digunakan"),
    `Barcode error converted to friendly message: "${safeBarcodeMsg}"`
  );
  assert(!containsSensitiveDatabaseDetails(safeBarcodeMsg), "Sanitized Barcode message has zero leakage");

  // Test 3: Foreign Key Constraint Violations (23503)
  console.log("\n[Test 3] Sanitizing Foreign Key Constraint Violations (Code 23503)");
  const categoryFkError = {
    code: "23503",
    message: 'update or delete on table "categories" violates foreign key constraint "products_category_id_fkey" on table "products"',
    details: 'Key (id)=(c1111111-1111-1111-1111-111111111111) is still referenced from table "products".',
  };
  const safeCategoryFk = getSafeErrorMessage(categoryFkError);
  assert(
    safeCategoryFk.includes("Kategori tidak dapat dihapus karena masih digunakan"),
    `Category FK converted to friendly message: "${safeCategoryFk}"`
  );
  assert(!containsSensitiveDatabaseDetails(safeCategoryFk), "Sanitized Category FK has zero schema leakage");

  const supplierFkError = {
    code: "23503",
    message: 'update or delete on table "suppliers" violates foreign key constraint "products_supplier_id_fkey" on table "products"',
  };
  const safeSupplierFk = getSafeErrorMessage(supplierFkError);
  assert(
    safeSupplierFk.includes("Supplier tidak dapat dihapus"),
    `Supplier FK converted to friendly message: "${safeSupplierFk}"`
  );
  assert(!containsSensitiveDatabaseDetails(safeSupplierFk), "Sanitized Supplier FK has zero schema leakage");

  // Test 4: Check Constraint Violations (23514)
  console.log("\n[Test 4] Sanitizing Check Constraint Violations (Code 23514)");
  const cashCheckError = {
    code: "23514",
    message: 'new row for relation "transactions" violates check constraint "chk_tx_cash_integrity"',
  };
  const safeCashCheck = getSafeErrorMessage(cashCheckError);
  assert(
    safeCashCheck.includes("Integritas pembayaran tidak valid"),
    `Cash check constraint converted to: "${safeCashCheck}"`
  );
  assert(!containsSensitiveDatabaseDetails(safeCashCheck), "Sanitized Cash check has zero schema leakage");

  const stockCheckError = {
    code: "23514",
    message: 'new row for relation "products" violates check constraint "chk_stock_non_negative"',
    details: 'Failing row contains (current_stock = -5).',
  };
  const safeStockCheck = getSafeErrorMessage(stockCheckError);
  assert(
    safeStockCheck.includes("stok tidak boleh negatif"),
    `Stock check constraint converted to: "${safeStockCheck}"`
  );
  assert(!containsSensitiveDatabaseDetails(safeStockCheck), "Sanitized Stock check has zero schema leakage");

  // Test 5: Undefined Table / Column Concealment (42P01, 42703)
  console.log("\n[Test 5] Concealing Undefined Table & Column Schemas (Code 42P01, 42703)");
  const tableError = {
    code: "42P01",
    message: 'relation "tokoku_internal_secret_table" does not exist',
  };
  const safeTableMsg = getSafeErrorMessage(tableError);
  assert(
    !safeTableMsg.includes("tokoku_internal_secret_table") &&
      !safeTableMsg.includes("relation"),
    `Table name completely hidden: "${safeTableMsg}"`
  );
  assert(!containsSensitiveDatabaseDetails(safeTableMsg), "Sanitized Table error has zero leakage");

  const colError = {
    code: "42703",
    message: 'column "password_hash_salt_v2" of relation "users" does not exist',
  };
  const safeColMsg = getSafeErrorMessage(colError);
  assert(
    !safeColMsg.includes("password_hash_salt_v2") && !safeColMsg.includes("users"),
    `Column name completely hidden: "${safeColMsg}"`
  );
  assert(!containsSensitiveDatabaseDetails(safeColMsg), "Sanitized Column error has zero leakage");

  // Test 6: Permission Denied & RLS Concealment (42501)
  console.log("\n[Test 6] Concealing Permission & RLS Violation (Code 42501)");
  const rlsError = {
    code: "42501",
    message: 'permission denied for table "audit_logs"',
  };
  const safeRlsMsg = getSafeErrorMessage(rlsError);
  assert(
    safeRlsMsg.includes("Akses ditolak") && !safeRlsMsg.includes("audit_logs"),
    `RLS error safely masked: "${safeRlsMsg}"`
  );
  assert(!containsSensitiveDatabaseDetails(safeRlsMsg), "Sanitized RLS error has zero leakage");

  // Test 7: PostgREST Filter Syntax / Injection Attack Errors
  console.log("\n[Test 7] Concealing PostgREST Injection & Syntax Errors (Code 42601, PGRST100)");
  const syntaxError = {
    code: "42601",
    message: 'syntax error at or near "\'," at character 45',
  };
  const safeSyntaxMsg = getSafeErrorMessage(syntaxError);
  assert(
    safeSyntaxMsg.includes("tidak valid") && !safeSyntaxMsg.includes("character"),
    `Syntax error safely sanitized: "${safeSyntaxMsg}"`
  );
  assert(!containsSensitiveDatabaseDetails(safeSyntaxMsg), "Sanitized Syntax error has zero leakage");

  // Test 8: Network Failures
  console.log("\n[Test 8] Sanitizing Network & Offline Failures");
  const netError = new TypeError("Failed to fetch");
  const safeNetMsg = getSafeErrorMessage(netError);
  assert(
    safeNetMsg.includes("Gagal terhubung ke server"),
    `Network error sanitized to: "${safeNetMsg}"`
  );
  assert(!containsSensitiveDatabaseDetails(safeNetMsg), "Sanitized Network error has zero leakage");

  // Test 9: Obscure Raw SQL Leakage Concealment
  console.log("\n[Test 9] Concealing Obscure Raw SQL Statements");
  const obscureSqlError = new Error(
    'SELECT id, password_hash FROM public.users WHERE role = \'pemilik\' AND deleted_at IS NULL'
  );
  const safeObscureMsg = getSafeErrorMessage(obscureSqlError, "Gagal memproses data.");
  assert(
    !safeObscureMsg.includes("SELECT") &&
      !safeObscureMsg.includes("password_hash") &&
      !safeObscureMsg.includes("public.users"),
    `Raw SQL query suppressed: "${safeObscureMsg}"`
  );
  assert(!containsSensitiveDatabaseDetails(safeObscureMsg), "Suppressed SQL error has zero leakage");

  // Test 10: Preservation of Legitimate Business Messages
  console.log("\n[Test 10] Preserving Intentional User Validation Messages");
  const businessMsg1 = "Validasi produk gagal: Nama supplier minimal 2 karakter";
  assert(getSafeErrorMessage(businessMsg1) === businessMsg1, "Zod validation message is preserved");

  const businessMsg2 = "Stok produk \"Indomie Goreng\" tidak mencukupi (Tersisa: 2, Diminta: 5)";
  assert(getSafeErrorMessage(businessMsg2) === businessMsg2, "Stock sufficiency message is preserved");

  const businessMsg3 = "Uang tunai yang diterima (Rp 10.000) kurang dari total transaksi (Rp 25.000)";
  assert(getSafeErrorMessage(businessMsg3) === businessMsg3, "Payment cash balance message is preserved");

  // Test 11: Live Supabase Database Query Error Sanitization
  console.log("\n[Test 11] Live Supabase Database Error Sanitization Simulation");
  // Deliberately query non-existent column to produce raw PostgreSQL/PostgREST error
  const { error: liveDbError } = await supabase
    .from("products")
    .select("this_column_definitely_does_not_exist_secret_test")
    .limit(1);

  assert(Boolean(liveDbError), "Raw Supabase query produces intentional error");
  assert(
    containsSensitiveDatabaseDetails(liveDbError.message),
    "Raw live database error contains internal schema details"
  );

  const safeLiveMsg = getSafeErrorMessage(liveDbError);
  assert(
    !containsSensitiveDatabaseDetails(safeLiveMsg),
    `Sanitized live error has zero technical leakage: "${safeLiveMsg}"`
  );
  assert(
    !safeLiveMsg.includes("this_column_definitely_does_not_exist_secret_test"),
    "Internal column name completely omitted from user-facing message"
  );

  console.log("\n==========================================================");
  console.log(`🎉 ALL TESTS PASSED! (${passedCount} passed, ${failedCount} failed)`);
  console.log("==========================================================");
  process.exitCode = 0;
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
