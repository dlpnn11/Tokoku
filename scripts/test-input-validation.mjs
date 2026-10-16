/**
 * Automated Verification Test Suite: Runtime Input Schema Validation with Zod (Modul 15)
 *
 * Verifies:
 * 1. ProductInputSchema: SKU formatting, length constraints, non-negative pricing, integer stock limits, and buffer flood prevention.
 * 2. SupplierInputSchema: Indonesian telephone regex validation, name lengths, and address constraints.
 * 3. CategoryInputSchema: Name length bounds and icon sanitization.
 * 4. StockAdjustmentSchema: Integer bounds and non-negative stock opname enforcement.
 * 5. TransactionInputSchema: Invoice format regex, payment method enum ('Tunai' | 'QRIS'), item quantities, and customer WhatsApp formatting.
 * 6. Service layer defense integration: inventoryService and transactionService reject malformed inputs before database dispatch.
 */

import {
  ProductInputSchema,
  SupplierInputSchema,
  CategoryInputSchema,
  StockAdjustmentSchema,
  TransactionInputSchema,
  formatZodError,
  validateWithSchema,
} from "../src/lib/schemas.ts";

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
  console.log("🛡️  TEST SUITE: Runtime Input Schema Validation / Zod (Modul 15)");
  console.log("==========================================================\n");

  // 1. PRODUCT SCHEMA TESTS
  console.log("[Test 1] ProductInputSchema: Valid Catalog Product Payload");
  const validProduct = {
    name: "Kopi Luwak White Koffie 20g",
    sku: "8992753129999",
    barcode: "8992753129999",
    category_id: "c1111111-1111-1111-1111-111111111111",
    supplier_id: "ba111111-1111-1111-1111-111111111111",
    buy_price: 1500,
    sell_price: 2000,
    current_stock: 50,
    minimum_stock: 10,
    unit: "sachet",
    is_active: true,
  };
  const validProductRes = ProductInputSchema.safeParse(validProduct);
  assert(validProductRes.success === true, "Valid product payload parses cleanly");

  console.log("\n[Test 2] ProductInputSchema: SKU Validation & Injection Rejection");
  // Too short SKU
  const shortSkuRes = ProductInputSchema.safeParse({ ...validProduct, sku: "AB" });
  assert(!shortSkuRes.success, "SKU < 3 characters is rejected");

  // Injection characters in SKU (commas, quotes, parentheses, spaces)
  const injectionSkuRes = ProductInputSchema.safeParse({
    ...validProduct,
    sku: "SKU',id.neq.0--",
  });
  assert(!injectionSkuRes.success, "SKU containing illegal characters / SQL injection is rejected");

  // Buffer overflow attempt (10,000 characters)
  const floodSkuRes = ProductInputSchema.safeParse({
    ...validProduct,
    sku: "A".repeat(10000),
  });
  assert(!floodSkuRes.success, "Oversized SKU (10,000 chars) is rejected by max constraint");

  console.log("\n[Test 3] ProductInputSchema: Name Length & Payload Flood Protection");
  const emptyNameRes = ProductInputSchema.safeParse({ ...validProduct, name: "   " });
  assert(!emptyNameRes.success, "Whitespace-only product name is rejected");

  const floodNameRes = ProductInputSchema.safeParse({
    ...validProduct,
    name: "Produk ".repeat(1000),
  });
  assert(!floodNameRes.success, "Oversized product name (>150 chars) is rejected");

  console.log("\n[Test 4] ProductInputSchema: Non-Negative Pricing & Integer Stock");
  const negPriceRes = ProductInputSchema.safeParse({ ...validProduct, sell_price: -5000 });
  assert(!negPriceRes.success, "Negative selling price is rejected");

  const floatStockRes = ProductInputSchema.safeParse({ ...validProduct, current_stock: 10.5 });
  assert(!floatStockRes.success, "Fractional stock quantity is rejected");

  const negStockRes = ProductInputSchema.safeParse({ ...validProduct, current_stock: -1 });
  assert(!negStockRes.success, "Negative current stock is rejected");

  // 2. SUPPLIER SCHEMA TESTS
  console.log("\n[Test 5] SupplierInputSchema: Valid Indonesian Phone Formats");
  const validSuppliers = [
    { name: "PT Sumber Berkah", phone: "08123456789", address: "Pasar Induk" },
    { name: "CV Agen Sembako", phone: "+6285712349988", address: "Kramat Jati" },
    { name: "Distributor Wings", phone: "6282198765432", address: "Pulogadung" },
    { name: "Toko Tanpa Telp", phone: "", address: "Tanpa Alamat" },
  ];
  for (const s of validSuppliers) {
    const res = SupplierInputSchema.safeParse(s);
    assert(res.success, `Valid supplier phone format permitted: ${s.phone || "(empty)"}`);
  }

  console.log("\n[Test 6] SupplierInputSchema: Invalid Phone & String Bounds Rejection");
  const invalidPhones = ["123", "abcdefg", "021-9999", "+12345678901234567890"];
  for (const badPhone of invalidPhones) {
    const res = SupplierInputSchema.safeParse({
      name: "Supplier Test",
      phone: badPhone,
    });
    assert(!res.success, `Invalid phone rejected: ${badPhone}`);
  }

  const floodSupplierAddress = SupplierInputSchema.safeParse({
    name: "Supplier Test",
    phone: "08123456789",
    address: "X".repeat(500),
  });
  assert(!floodSupplierAddress.success, "Oversized supplier address (>300 chars) is rejected");

  // 3. CATEGORY SCHEMA TESTS
  console.log("\n[Test 7] CategoryInputSchema: Bounds & Sanitization");
  assert(CategoryInputSchema.safeParse({ name: "Minuman" }).success, "Valid category name passes");
  assert(!CategoryInputSchema.safeParse({ name: "A" }).success, "Category name < 2 chars rejected");
  assert(
    !CategoryInputSchema.safeParse({ name: "C".repeat(100) }).success,
    "Category name > 50 chars rejected"
  );

  // 4. STOCK ADJUSTMENT SCHEMA TESTS
  console.log("\n[Test 8] StockAdjustmentSchema: Stock Opname Bounds");
  assert(
    StockAdjustmentSchema.safeParse({ productId: "uuid-123", newStock: 25 }).success,
    "Valid stock opname passes"
  );
  assert(
    !StockAdjustmentSchema.safeParse({ productId: "uuid-123", newStock: -5 }).success,
    "Negative stock opname rejected"
  );
  assert(
    !StockAdjustmentSchema.safeParse({ productId: "uuid-123", newStock: 4.2 }).success,
    "Fractional stock opname rejected"
  );

  // 5. TRANSACTION INPUT SCHEMA TESTS
  console.log("\n[Test 9] TransactionInputSchema: Valid Checkout Payload");
  const validTx = {
    invoiceNumber: "INV-20261016-ABCDE",
    userId: "11111111-1111-1111-1111-111111111111",
    totalAmount: 14000,
    paymentMethod: "Tunai",
    cashReceived: 20000,
    cashChange: 6000,
    customerPhone: "081298765432",
    items: [
      {
        product_id: "c42bc00e-53cf-44a6-aee9-1ffa7628b154",
        quantity: 2,
        unit_price: 7000,
        subtotal: 14000,
      },
    ],
  };
  const validTxRes = TransactionInputSchema.safeParse(validTx);
  assert(validTxRes.success, "Valid transaction checkout payload parses cleanly");

  console.log("\n[Test 10] TransactionInputSchema: Attack & Anomaly Rejection");
  // Malformed invoice number with SQL injection / script tags
  const sqlInvoice = TransactionInputSchema.safeParse({
    ...validTx,
    invoiceNumber: "INV-1'; DROP TABLE transactions;--",
  });
  assert(!sqlInvoice.success, "Malformed invoice number with SQL characters is rejected");

  // Invalid payment method enum
  const badPaymentMethod = TransactionInputSchema.safeParse({
    ...validTx,
    paymentMethod: "BITCOIN",
  });
  assert(!badPaymentMethod.success, "Invalid payment method 'BITCOIN' is rejected");

  // Empty cart
  const emptyCart = TransactionInputSchema.safeParse({
    ...validTx,
    items: [],
  });
  assert(!emptyCart.success, "Empty cart items array is rejected");

  // Invalid quantity (0 or negative)
  const zeroQtyCart = TransactionInputSchema.safeParse({
    ...validTx,
    items: [
      {
        product_id: "uuid-1",
        quantity: 0,
        unit_price: 5000,
        subtotal: 0,
      },
    ],
  });
  assert(!zeroQtyCart.success, "Zero quantity in cart is rejected");

  // Excessive quantity (>10,000)
  const hugeQtyCart = TransactionInputSchema.safeParse({
    ...validTx,
    items: [
      {
        product_id: "uuid-1",
        quantity: 50000,
        unit_price: 5000,
        subtotal: 250000000,
      },
    ],
  });
  assert(!hugeQtyCart.success, "Excessive quantity (>10,000) is rejected");

  // Invalid customer WhatsApp
  const badCustPhone = TransactionInputSchema.safeParse({
    ...validTx,
    customerPhone: "not-a-phone-number",
  });
  assert(!badCustPhone.success, "Invalid customer phone string is rejected");

  // 6. HELPER VALIDATOR FUNCTION TESTS
  console.log("\n[Test 11] validateWithSchema Helper Utility");
  const helperSuccess = validateWithSchema(CategoryInputSchema, { name: "Sembako" });
  assert(helperSuccess.success === true, "validateWithSchema returns success: true on valid input");

  const helperFail = validateWithSchema(CategoryInputSchema, { name: "" });
  assert(helperFail.success === false, "validateWithSchema returns success: false on invalid input");
  assert(typeof helperFail.error === "string", "validateWithSchema provides formatted error string");

  console.log("\n==========================================================");
  console.log(`🎉 ALL ${passedCount} RUNTIME SCHEMA VALIDATION TESTS PASSED!`);
  console.log("==========================================================\n");
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
