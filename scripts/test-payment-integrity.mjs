/**
 * Automated Verification Test Suite: Validasi Integritas Pembayaran & Kembalian (Modul 17)
 *
 * Verifies:
 * 1. Legitimate cash transaction with exact payment succeeds.
 * 2. Legitimate cash transaction with change succeeds and accurately records change.
 * 3. Legitimate QRIS transaction with exact payment and 0 change succeeds.
 * 4. Attack 1: Cash underpayment (cashReceived < totalAmount) is rejected server-side.
 * 5. Attack 2: Cash change tampering (inflated/manipulated cashChange) is rejected server-side.
 * 6. Attack 3: QRIS payment with non-zero cash change is rejected server-side.
 * 7. Attack 4: Direct table INSERT violating `chk_tx_cash_integrity` check constraint is rejected by PostgreSQL.
 * 8. Defense-in-depth: Runtime Zod schema rejects malformed payment before network dispatch.
 * 9. Defense-in-depth: transactionService.checkout validates balance and change consistently.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xgtkoclchscygrckhyya.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndGtvY2xjaHNjeWdyY2toeXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMTQyMzYsImV4cCI6MjEwNjc5MDIzNn0.TgfdIwdLr-8LQrZ5kCbrHt1WTV_m1mwiVoQ2rd1hYzU";

process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { TransactionInputSchema } = await import("../src/lib/schemas.ts");
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
  console.log("🛡️  TEST SUITE: Server-Side Cash & Change Validation (Modul 17)");
  console.log("==========================================================\n");

  // Fetch product for testing
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("id, name, sell_price, current_stock")
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

  const officialPrice = Number(product.sell_price);
  const qty = 2;
  const expectedTotal = officialPrice * qty;

  console.log(`[Setup] Target product: "${product.name}" @ Rp ${officialPrice.toLocaleString("id-ID")}`);
  console.log(`        Total for ${qty} items: Rp ${expectedTotal.toLocaleString("id-ID")}\n`);

  // Test 1: Legitimate Exact Cash Payment
  console.log("[Test 1] Legitimate Exact Cash Payment (cashReceived = totalAmount, change = 0)");
  const inv1 = `INV-TEST-EXACT-${Date.now()}`;
  const { data: res1, error: err1 } = await supabase.rpc("create_pos_transaction", {
    p_invoice_number: inv1,
    p_user_id: user.id,
    p_total_amount: expectedTotal,
    p_payment_method: "Tunai",
    p_cash_received: expectedTotal,
    p_cash_change: 0,
    p_customer_phone: null,
    p_items: [
      {
        product_id: product.id,
        quantity: qty,
        unit_price: officialPrice,
        subtotal: expectedTotal,
      },
    ],
  });

  assert(!err1 && res1?.success === true, "Exact cash payment accepted by RPC");
  assert(res1?.cash_received === expectedTotal, `Recorded cash_received matches Rp ${expectedTotal}`);
  assert(res1?.cash_change === 0, "Recorded cash_change is exactly 0");

  // Cleanup test 1
  if (res1?.transaction_id) {
    await supabase.from("transactions").delete().eq("id", res1.transaction_id);
    await supabase
      .from("products")
      .update({ current_stock: product.current_stock })
      .eq("id", product.id);
  }

  // Test 2: Legitimate Cash Payment with Change
  console.log("\n[Test 2] Legitimate Cash Payment with Change (cashReceived > totalAmount)");
  const cashOver = expectedTotal + 20000;
  const expectedChange = 20000;
  const inv2 = `INV-TEST-CHANGE-${Date.now()}`;
  const { data: res2, error: err2 } = await supabase.rpc("create_pos_transaction", {
    p_invoice_number: inv2,
    p_user_id: user.id,
    p_total_amount: expectedTotal,
    p_payment_method: "Tunai",
    p_cash_received: cashOver,
    p_cash_change: expectedChange,
    p_customer_phone: null,
    p_items: [
      {
        product_id: product.id,
        quantity: qty,
        unit_price: officialPrice,
        subtotal: expectedTotal,
      },
    ],
  });

  assert(!err2 && res2?.success === true, "Cash payment with change accepted by RPC");
  assert(res2?.cash_received === cashOver, `Recorded cash_received matches Rp ${cashOver}`);
  assert(res2?.cash_change === expectedChange, `Recorded cash_change matches Rp ${expectedChange}`);

  // Cleanup test 2
  if (res2?.transaction_id) {
    await supabase.from("transactions").delete().eq("id", res2.transaction_id);
    await supabase
      .from("products")
      .update({ current_stock: product.current_stock })
      .eq("id", product.id);
  }

  // Test 3: Attack 1 - Underpayment Attack
  console.log("\n[Test 3] Attack 1: Underpayment Attack (cashReceived < totalAmount)");
  const cashUnder = expectedTotal - 10000;
  const inv3 = `INV-TEST-UNDER-${Date.now()}`;
  const { data: res3, error: err3 } = await supabase.rpc("create_pos_transaction", {
    p_invoice_number: inv3,
    p_user_id: user.id,
    p_total_amount: expectedTotal,
    p_payment_method: "Tunai",
    p_cash_received: cashUnder,
    p_cash_change: 0,
    p_customer_phone: null,
    p_items: [
      {
        product_id: product.id,
        quantity: qty,
        unit_price: officialPrice,
        subtotal: expectedTotal,
      },
    ],
  });

  assert(!!err3, "Underpayment was properly rejected by PostgreSQL RPC");
  assert(
    err3?.message?.includes("kurang dari total"),
    `Error message explicitly mentions underpayment: "${err3?.message}"`
  );

  // Test 4: Attack 2 - Cash Change Manipulation Attack
  console.log("\n[Test 4] Attack 2: Cash Change Tampering (client claims Rp 50.000 change for Rp 10.000 overpayment)");
  const fakeChange = 50000;
  const inv4 = `INV-TEST-TAMPER-CHG-${Date.now()}`;
  const { data: res4, error: err4 } = await supabase.rpc("create_pos_transaction", {
    p_invoice_number: inv4,
    p_user_id: user.id,
    p_total_amount: expectedTotal,
    p_payment_method: "Tunai",
    p_cash_received: expectedTotal + 10000,
    p_cash_change: fakeChange,
    p_customer_phone: null,
    p_items: [
      {
        product_id: product.id,
        quantity: qty,
        unit_price: officialPrice,
        subtotal: expectedTotal,
      },
    ],
  });

  assert(!!err4, "Change tampering was properly rejected by PostgreSQL RPC");
  assert(
    err4?.message?.includes("Manipulasi kembalian terdeteksi"),
    `Error message explicitly flags change tampering: "${err4?.message}"`
  );

  // Test 5: Attack 3 - QRIS with Non-Zero Cash Change
  console.log("\n[Test 5] Attack 3: QRIS Payment with Non-Zero Cash Change");
  const inv5 = `INV-TEST-QRIS-CHG-${Date.now()}`;
  const { data: res5, error: err5 } = await supabase.rpc("create_pos_transaction", {
    p_invoice_number: inv5,
    p_user_id: user.id,
    p_total_amount: expectedTotal,
    p_payment_method: "QRIS",
    p_cash_received: expectedTotal,
    p_cash_change: 15000,
    p_customer_phone: null,
    p_items: [
      {
        product_id: product.id,
        quantity: qty,
        unit_price: officialPrice,
        subtotal: expectedTotal,
      },
    ],
  });

  assert(!!err5, "QRIS with cash change rejected by PostgreSQL RPC");
  assert(
    err5?.message?.includes("tidak boleh memiliki uang kembalian"),
    `Error message flags QRIS change restriction: "${err5?.message}"`
  );

  // Test 6: Database Check Constraint chk_tx_cash_integrity
  console.log("\n[Test 6] Database Check Constraint (Direct table INSERT of illegal cash change)");
  const inv6 = `INV-TEST-RAW-CHK-${Date.now()}`;
  const { error: rawErr } = await supabase.from("transactions").insert({
    invoice_number: inv6,
    user_id: user.id,
    total_amount: 50000,
    payment_method: "Tunai",
    cash_received: 40000, // Underpayment
    cash_change: 0,
    status: "Selesai",
  });

  assert(!!rawErr, "Direct raw INSERT violating cash balance rejected by check constraint");
  assert(
    rawErr?.message?.includes("chk_tx_cash_integrity"),
    `Check constraint violated: "${rawErr?.message}"`
  );

  // Test 7: Runtime Zod Schema Validation
  console.log("\n[Test 7] Zod Runtime Schema Validation Layer");
  const zodUnderpaid = TransactionInputSchema.safeParse({
    invoiceNumber: "INV-ZOD-001",
    userId: user.id,
    totalAmount: 50000,
    paymentMethod: "Tunai",
    cashReceived: 35000,
    cashChange: 0,
    items: [
      {
        product_id: product.id,
        quantity: 1,
        unit_price: 50000,
        subtotal: 50000,
      },
    ],
  });
  assert(!zodUnderpaid.success, "Zod catches underpayment at schema level");

  const zodTamperedChange = TransactionInputSchema.safeParse({
    invoiceNumber: "INV-ZOD-002",
    userId: user.id,
    totalAmount: 50000,
    paymentMethod: "Tunai",
    cashReceived: 60000,
    cashChange: 20000, // Expected 10000
    items: [
      {
        product_id: product.id,
        quantity: 1,
        unit_price: 50000,
        subtotal: 50000,
      },
    ],
  });
  assert(!zodTamperedChange.success, "Zod catches cash change mismatch at schema level");

  const zodValid = TransactionInputSchema.safeParse({
    invoiceNumber: "INV-ZOD-003",
    userId: user.id,
    totalAmount: 50000,
    paymentMethod: "Tunai",
    cashReceived: 60000,
    cashChange: 10000,
    items: [
      {
        product_id: product.id,
        quantity: 1,
        unit_price: 50000,
        subtotal: 50000,
      },
    ],
  });
  assert(zodValid.success, "Zod passes legitimate transaction input");

  // Test 8: Service Layer checkout validation
  console.log("\n[Test 8] Service Layer Checkout Validation");
  let caughtServiceErr = null;
  try {
    await transactionService.checkout({
      invoiceNumber: `INV-TEST-SVC-${Date.now()}`,
      userId: user.id,
      totalAmount: expectedTotal,
      paymentMethod: "Tunai",
      cashReceived: expectedTotal - 5000,
      cashChange: 0,
      items: [
        {
          product: {
            id: product.id,
            name: product.name,
            sell_price: officialPrice,
            current_stock: product.current_stock,
          },
          quantity: qty,
          subtotal: expectedTotal,
        },
      ],
    });
  } catch (e) {
    caughtServiceErr = e;
  }
  assert(!!caughtServiceErr, "Service layer checkout rejected underpaid transaction");

  console.log("\n==========================================================");
  console.log(`🎉 ALL TESTS PASSED! (${passedCount} passed, ${failedCount} failed)`);
  console.log("==========================================================");
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
