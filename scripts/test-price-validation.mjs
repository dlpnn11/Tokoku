/**
 * Automated Verification Test Suite: Server-Side Price & Subtotal Validation (Modul 14)
 *
 * Verifies:
 * 1. Legitimate transactions with genuine catalog prices succeed.
 * 2. Attack 1: Client-side unit price tampering (underpricing attack) is rejected by PostgreSQL RPC.
 * 3. Attack 2: Client-side subtotal manipulation is rejected by PostgreSQL RPC.
 * 4. Attack 3: Grand total underreporting attack is rejected by PostgreSQL RPC.
 * 5. Attack 4: Zero or negative quantity injection is rejected by PostgreSQL RPC.
 * 6. Service layer defense-in-depth catches tampering before network dispatch.
 * 7. Automatic rollback ensures zero phantom stock deductions or orphaned rows on failed attacks.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xgtkoclchscygrckhyya.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndGtvY2xjaHNjeWdyY2toeXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMTQyMzYsImV4cCI6MjEwNjc5MDIzNn0.TgfdIwdLr-8LQrZ5kCbrHt1WTV_m1mwiVoQ2rd1hYzU";

process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
  console.log("🛡️  TEST SUITE: Server-Side Price & Subtotal Validation (Modul 14)");
  console.log("==========================================================\n");

  // 1. Fetch a real product from database to test with
  console.log("[Setup] Fetching active catalog product for testing...");
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("id, name, sell_price, current_stock")
    .gt("current_stock", 5)
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
  const testQty = 2;
  const officialSubtotal = officialPrice * testQty;
  const officialTotal = officialSubtotal;

  console.log(`  Target Product: "${product.name}" (ID: ${product.id})`);
  console.log(`  Official Catalog Price: Rp ${officialPrice.toLocaleString("id-ID")}`);
  console.log(`  Initial Current Stock: ${product.current_stock}\n`);

  // 2. Legitimate Transaction Test
  console.log("[Test 1] Legitimate POS Checkout with Genuine Catalog Price");
  const validInvoice = `INV-TEST-VALID-${Date.now()}`;
  const { data: validData, error: validError } = await supabase.rpc(
    "create_pos_transaction",
    {
      p_invoice_number: validInvoice,
      p_user_id: user.id,
      p_total_amount: officialTotal,
      p_payment_method: "Tunai",
      p_cash_received: officialTotal,
      p_cash_change: 0,
      p_customer_phone: null,
      p_items: [
        {
          product_id: product.id,
          quantity: testQty,
          unit_price: officialPrice,
          subtotal: officialSubtotal,
        },
      ],
    }
  );

  assert(!validError, `Legitimate transaction must succeed without error (got: ${validError?.message})`);
  assert(validData?.success === true, "RPC response contains success: true");
  assert(Number(validData?.total_amount) === officialTotal, "Authoritative total amount matches calculation");

  // Clean up the created test transaction using cancel_pos_transaction (which atomically restores stock)
  if (validData?.transaction_id) {
    const { error: cancelErr } = await supabase.rpc("cancel_pos_transaction", {
      p_transaction_id: validData.transaction_id,
    });
    if (cancelErr) {
      console.warn("  (Warning: cancel_pos_transaction returned:", cancelErr.message, ")");
    }
  }

  // 3. ATTACK SCENARIO 1: Client Unit Price Tampering (Underpricing)
  console.log("\n[Test 2] Attack 1: Client Unit Price Tampering (Rp 500 exploit)");
  const fakePriceInvoice = `INV-ATTACK-PRICE-${Date.now()}`;
  const tamperedPrice = 500; // Attempting to buy item for Rp 500 instead of official price
  const { data: attack1Data, error: attack1Error } = await supabase.rpc(
    "create_pos_transaction",
    {
      p_invoice_number: fakePriceInvoice,
      p_user_id: user.id,
      p_total_amount: tamperedPrice * testQty,
      p_payment_method: "Tunai",
      p_cash_received: 10000,
      p_cash_change: 10000 - tamperedPrice * testQty,
      p_customer_phone: null,
      p_items: [
        {
          product_id: product.id,
          quantity: testQty,
          unit_price: tamperedPrice, // TAMPERED!
          subtotal: tamperedPrice * testQty,
        },
      ],
    }
  );

  assert(Boolean(attack1Error), "PostgreSQL must reject manipulated unit price");
  assert(
    attack1Error?.message.includes("Manipulasi harga terdeteksi"),
    `Error message indicates price tampering (got: "${attack1Error?.message}")`
  );
  assert(attack1Data === null, "No transaction is created upon price tampering");

  // 4. ATTACK SCENARIO 2: Client Subtotal Tampering
  console.log("\n[Test 3] Attack 2: Client Subtotal Tampering (Mismatch with Qty * Price)");
  const fakeSubtotalInvoice = `INV-ATTACK-SUBTOTAL-${Date.now()}`;
  const tamperedSubtotal = 1000; // Qty 2 * 3500 should be 7000, but client sends 1000
  const { data: attack2Data, error: attack2Error } = await supabase.rpc(
    "create_pos_transaction",
    {
      p_invoice_number: fakeSubtotalInvoice,
      p_user_id: user.id,
      p_total_amount: tamperedSubtotal,
      p_payment_method: "Tunai",
      p_cash_received: 10000,
      p_cash_change: 9000,
      p_customer_phone: null,
      p_items: [
        {
          product_id: product.id,
          quantity: testQty,
          unit_price: officialPrice,
          subtotal: tamperedSubtotal, // TAMPERED!
        },
      ],
    }
  );

  assert(Boolean(attack2Error), "PostgreSQL must reject manipulated subtotal");
  assert(
    attack2Error?.message.includes("Manipulasi subtotal terdeteksi"),
    `Error message indicates subtotal tampering (got: "${attack2Error?.message}")`
  );
  assert(attack2Data === null, "No transaction is created upon subtotal tampering");

  // 5. ATTACK SCENARIO 3: Grand Total Underreporting Attack
  console.log("\n[Test 4] Attack 3: Grand Total Underreporting Attack");
  const fakeTotalInvoice = `INV-ATTACK-TOTAL-${Date.now()}`;
  const tamperedGrandTotal = 2000; // Subtotals add up to 7000, but header says 2000
  const { data: attack3Data, error: attack3Error } = await supabase.rpc(
    "create_pos_transaction",
    {
      p_invoice_number: fakeTotalInvoice,
      p_user_id: user.id,
      p_total_amount: tamperedGrandTotal, // TAMPERED!
      p_payment_method: "Tunai",
      p_cash_received: 5000,
      p_cash_change: 3000,
      p_customer_phone: null,
      p_items: [
        {
          product_id: product.id,
          quantity: testQty,
          unit_price: officialPrice,
          subtotal: officialSubtotal,
        },
      ],
    }
  );

  assert(Boolean(attack3Error), "PostgreSQL must reject manipulated grand total");
  assert(
    attack3Error?.message.includes("Manipulasi total transaksi terdeteksi"),
    `Error message indicates grand total tampering (got: "${attack3Error?.message}")`
  );
  assert(attack3Data === null, "No transaction is created upon grand total tampering");

  // 6. ATTACK SCENARIO 4: Negative or Zero Quantity Injection
  console.log("\n[Test 5] Attack 4: Zero or Negative Quantity Injection");
  const fakeQtyInvoice = `INV-ATTACK-QTY-${Date.now()}`;
  const { data: attack4Data, error: attack4Error } = await supabase.rpc(
    "create_pos_transaction",
    {
      p_invoice_number: fakeQtyInvoice,
      p_user_id: user.id,
      p_total_amount: 0,
      p_payment_method: "Tunai",
      p_cash_received: 0,
      p_cash_change: 0,
      p_customer_phone: null,
      p_items: [
        {
          product_id: product.id,
          quantity: -3, // NEGATIVE QTY!
          unit_price: officialPrice,
          subtotal: -3 * officialPrice,
        },
      ],
    }
  );

  assert(Boolean(attack4Error), "PostgreSQL must reject zero or negative quantity");
  assert(
    attack4Error?.message.includes("Jumlah barang tidak valid"),
    `Error message indicates invalid quantity (got: "${attack4Error?.message}")`
  );

  // 7. Verify Stock Integrity: No Phantom Stock Leakage
  console.log("\n[Test 6] Atomicity & Stock Integrity Verification");
  const { data: finalProduct } = await supabase
    .from("products")
    .select("current_stock")
    .eq("id", product.id)
    .single();

  assert(
    finalProduct.current_stock === product.current_stock,
    `Stock remains completely intact across all rejected attack attempts (Expected: ${product.current_stock}, Got: ${finalProduct.current_stock})`
  );

  // 8. Service Layer Pre-Dispatch Verification
  console.log("\n[Test 7] Service Layer Defense-in-Depth: Subtotal Tampering Rejection");
  let caughtServiceSubtotalErr = false;
  try {
    await transactionService.checkout({
      invoiceNumber: "INV-SVC-TAMPER-1",
      userId: user.id,
      totalAmount: 1000,
      paymentMethod: "Tunai",
      cashReceived: 5000,
      cashChange: 4000,
      customerPhone: "",
      items: [
        {
          product: {
            id: product.id,
            name: product.name,
            sell_price: officialPrice,
            current_stock: 10,
          },
          quantity: 2,
          subtotal: 1000, // Tampered subtotal (should be 2 * officialPrice)
        },
      ],
    });
  } catch (err) {
    caughtServiceSubtotalErr = true;
    assert(
      err.message.includes("Manipulasi subtotal terdeteksi"),
      `Service throws subtotal tampering error (got: "${err.message}")`
    );
  }
  assert(caughtServiceSubtotalErr, "Service layer must block subtotal tampering before network call");

  console.log("\n[Test 8] Service Layer Defense-in-Depth: Grand Total Tampering Rejection");
  let caughtServiceTotalErr = false;
  try {
    await transactionService.checkout({
      invoiceNumber: "INV-SVC-TAMPER-2",
      userId: user.id,
      totalAmount: 9999, // Tampered grand total
      paymentMethod: "Tunai",
      cashReceived: 10000,
      cashChange: 1,
      customerPhone: "",
      items: [
        {
          product: {
            id: product.id,
            name: product.name,
            sell_price: officialPrice,
            current_stock: 10,
          },
          quantity: 2,
          subtotal: 2 * officialPrice,
        },
      ],
    });
  } catch (err) {
    caughtServiceTotalErr = true;
    assert(
      err.message.includes("Manipulasi total transaksi terdeteksi"),
      `Service throws grand total tampering error (got: "${err.message}")`
    );
  }
  assert(caughtServiceTotalErr, "Service layer must block grand total tampering before network call");

  console.log("\n==========================================================");
  console.log(`🎉 ALL ${passedCount} PRICE & SUBTOTAL TAMPERING TESTS PASSED!`);
  console.log("==========================================================\n");
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
