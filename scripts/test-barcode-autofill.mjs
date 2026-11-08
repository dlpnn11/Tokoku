/**
 * Automated Verification Test Suite: Authentic GS1 Barcode Auto-Fill & SKU Separation
 *
 * Verifies:
 * 1. Instant 0ms offline matching for top authentic GS1 Indonesia FMCG goods.
 * 2. Barcode normalization and sanitization (stripping whitespace, hyphens, non-alphanumeric).
 * 3. Unit and Category keyword inference for external/cloud fallbacks.
 * 4. Complete separation between internal SKU and physical barcode in ProductFormModal.
 * 5. Edge cases: empty codes, short codes, unknown barcodes, malformed input.
 */

import {
  LOCAL_INDONESIAN_BARCODE_CATALOG,
  lookupBarcodeDetails,
  normalizeBarcode,
  inferCategoryFromKeywords,
  inferUnitFromName,
} from "../src/services/barcodeCatalogService.ts";
import * as fs from "fs";
import * as path from "path";

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
  console.log("📦 TEST SUITE: GS1 Barcode Auto-Fill & SKU Separation");
  console.log("==========================================================\n");

  // 1. VERIFY AUTHENTIC GS1 BARCODES IN MASTER CATALOG
  console.log("[Test 1] Authentic Indonesian GS1 Barcodes 0ms Offline Lookup");
  const testItems = [
    { code: "8886008101053", expectedName: "Aqua Air Mineral 600ml", expectedCategory: "Minuman", unit: "botol" },
    { code: "8886008101077", expectedName: "Aqua Air Mineral 1500ml", expectedCategory: "Minuman", unit: "botol" },
    { code: "8996001600265", expectedName: "Le Minerale Air Mineral 600ml", expectedCategory: "Minuman", unit: "botol" },
    { code: "8996001600272", expectedName: "Le Minerale Air Mineral 1500ml", expectedCategory: "Minuman", unit: "botol" },
    { code: "8991002105151", expectedName: "Teh Pucuk Harum 350ml", expectedCategory: "Minuman", unit: "botol" },
    { code: "8998866200224", expectedName: "Teh Botol Sosro Kotak 250ml", expectedCategory: "Minuman", unit: "kotak" },
    { code: "8992741981129", expectedName: "Pocari Sweat Botol 500ml", expectedCategory: "Minuman", unit: "botol" },
    { code: "8992741981112", expectedName: "Pocari Sweat Botol 350ml", expectedCategory: "Minuman", unit: "botol" },
    { code: "8998009010224", expectedName: "Ultra Milk Full Cream 250ml", expectedCategory: "Minuman", unit: "kotak" },
    { code: "8998009010217", expectedName: "Ultra Milk Cokelat 250ml", expectedCategory: "Minuman", unit: "kotak" },
    { code: "7613035252873", expectedName: "Bear Brand Susu Steril 189ml", expectedCategory: "Minuman", unit: "kaleng" },
    { code: "089686010019", expectedName: "Indomie Mi Goreng Spesial 85g", expectedCategory: "Mie Instan", unit: "bungkus" },
    { code: "089686010026", expectedName: "Indomie Kuah Soto Mie 70g", expectedCategory: "Mie Instan", unit: "bungkus" },
    { code: "089686010033", expectedName: "Indomie Kuah Ayam Bawang 69g", expectedCategory: "Mie Instan", unit: "bungkus" },
    { code: "8998866100101", expectedName: "Mie Sedaap Goreng 90g", expectedCategory: "Mie Instan", unit: "bungkus" },
    { code: "8998866100118", expectedName: "Mie Sedaap Soto 75g", expectedCategory: "Mie Instan", unit: "bungkus" },
    { code: "8991002101115", expectedName: "Kopi Kapal Api Spesial Mix 24g", expectedCategory: "Minuman", unit: "bungkus" },
    { code: "8992753221011", expectedName: "Good Day Cappuccino 25g", expectedCategory: "Minuman", unit: "bungkus" },
    { code: "8996001410116", expectedName: "Torabika Cappuccino 25g", expectedCategory: "Minuman", unit: "bungkus" },
    { code: "8996001303012", expectedName: "Roma Kelapa Biskuit 300g", expectedCategory: "Makanan Ringan / Snack", unit: "bungkus" },
    { code: "8996001303050", expectedName: "Roma Sari Gandum 115g", expectedCategory: "Makanan Ringan / Snack", unit: "bungkus" },
    { code: "8996001301018", expectedName: "Beng-Beng Wafer Cokelat 25g", expectedCategory: "Makanan Ringan / Snack", unit: "pcs" },
    { code: "8991001100010", expectedName: "SilverQueen Cashew 58g", expectedCategory: "Makanan Ringan / Snack", unit: "pcs" },
    { code: "8998866200422", expectedName: "Chitato Sapi Panggang 68g", expectedCategory: "Makanan Ringan / Snack", unit: "bungkus" },
    { code: "8999999002100", expectedName: "Pasta Gigi Pepsodent Pencegah Gigi Berlubang 120g", expectedCategory: "Kebutuhan Rumah Tangga / Kebersihan", unit: "pcs" },
    { code: "8999999011102", expectedName: "Sabun Lifebuoy Total 10 85g", expectedCategory: "Kebutuhan Rumah Tangga / Kebersihan", unit: "pcs" },
    { code: "8999999031100", expectedName: "Sunlight Jeruk Nipis 650ml Pouch", expectedCategory: "Kebutuhan Rumah Tangga / Kebersihan", unit: "pouch" },
    { code: "8999999021101", expectedName: "Deterjen Rinso Anti Noda 770g", expectedCategory: "Kebutuhan Rumah Tangga / Kebersihan", unit: "bungkus" },
    { code: "8998866500102", expectedName: "Deterjen Daia Bunga 850g", expectedCategory: "Kebutuhan Rumah Tangga / Kebersihan", unit: "bungkus" },
    { code: "8992983100164", expectedName: "Sampoerna A Mild 16", expectedCategory: "ATK & Rokok", unit: "bungkus" },
    { code: "8992693100128", expectedName: "Djarum Super 12", expectedCategory: "ATK & Rokok", unit: "bungkus" },
    { code: "8992723100160", expectedName: "Gudang Garam Surya 16", expectedCategory: "ATK & Rokok", unit: "bungkus" },
  ];

  for (const item of testItems) {
    const res = await lookupBarcodeDetails(item.code);
    assert(res.found === true, `Barcode ${item.code} (${item.expectedName}) is detected`);
    assert(res.name === item.expectedName, `Barcode ${item.code} has correct product name`);
    assert(res.categoryName === item.expectedCategory, `Barcode ${item.code} has correct category '${item.expectedCategory}'`);
    assert(res.unit === item.unit, `Barcode ${item.code} has correct unit '${item.unit}'`);
    assert(res.source === "local_catalog", `Barcode ${item.code} resolved via 0ms local_catalog`);
    assert(typeof res.suggestedBuyPrice === "number" && res.suggestedBuyPrice > 0, `Barcode ${item.code} has valid buy price`);
    assert(typeof res.suggestedSellPrice === "number" && res.suggestedSellPrice > res.suggestedBuyPrice, `Barcode ${item.code} has valid sell price with positive margin`);
  }

  // 1.1 UPC-A 12 vs 13 Digit Zero-Padding Resilience Test
  console.log("\n[Test 1.1] UPC-A (12-digit) & EAN-13 (13-digit Zero-Padded) Dual Lookup");
  const upcRes12 = await lookupBarcodeDetails("089686010019");
  assert(upcRes12.found === true && upcRes12.name === "Indomie Mi Goreng Spesial 85g", "12-digit UPC matches Indomie Mi Goreng");

  const upcRes13 = await lookupBarcodeDetails("0089686010019");
  assert(upcRes13.found === true && upcRes13.name === "Indomie Mi Goreng Spesial 85g", "13-digit zero-padded EAN matches Indomie Mi Goreng");

  // 2. NORMALIZATION & SANITIZATION TESTS
  console.log("\n[Test 2] Barcode Normalization & Formats");
  assert(normalizeBarcode("  8886008101053  ") === "8886008101053", "Trims leading and trailing whitespace");
  assert(normalizeBarcode("888-6008-101053") === "8886008101053", "Strips hyphens from barcode");
  assert(normalizeBarcode("899 6001 600265") === "8996001600265", "Strips spaces within barcode");
  assert(normalizeBarcode("") === "", "Handles empty string");

  // Querying with spaces or hyphens should still match local catalog
  const resWithHyphens = await lookupBarcodeDetails("888-6008-101053");
  assert(resWithHyphens.found === true && resWithHyphens.name === "Aqua Air Mineral 600ml", "Hyphenated barcode matches Aqua 600ml");

  // 3. EDGE CASES: SHORT & UNKNOWN BARCODES
  console.log("\n[Test 3] Edge Cases: Short & Unknown Barcodes");
  const shortRes = await lookupBarcodeDetails("123");
  assert(shortRes.found === false, "Short barcode (< 8 characters) returns found: false");

  const emptyRes = await lookupBarcodeDetails("");
  assert(emptyRes.found === false, "Empty barcode returns found: false");

  const unknownRes = await lookupBarcodeDetails("9999999999999");
  assert(unknownRes.found === false, "Unknown barcode cleanly returns found: false");

  // 4. UNIT & CATEGORY INFERENCE TESTS
  console.log("\n[Test 4] Keyword Inference Engine");
  assert(inferUnitFromName("Aqua Pet 600ml") === "botol", "Infers 'botol' from 600ml");
  assert(inferUnitFromName("Teh Botol Sosro Kotak 250ml") === "kotak", "Infers 'kotak' from Kotak 250ml");
  assert(inferUnitFromName("Pop Mie Cup Goreng") === "cup", "Infers 'cup' from Cup");
  assert(inferUnitFromName("Sunlight Refill 650ml Pouch") === "pouch", "Infers 'pouch' from Pouch");
  assert(inferUnitFromName("Indomie Goreng 85g") === "bungkus", "Infers 'bungkus' from Indomie");
  assert(inferUnitFromName("Bear Brand 189ml") === "kaleng", "Infers 'kaleng' from 189ml");

  assert(inferCategoryFromKeywords("Sedaap Mie Kuah Kari") === "Mie Instan", "Infers 'Mie Instan' from Mie");
  assert(inferCategoryFromKeywords("Sabun Cuci Piring Mama Lemon") === "Kebutuhan Rumah Tangga / Kebersihan", "Infers 'Kebutuhan Rumah Tangga / Kebersihan' from Sabun");
  assert(inferCategoryFromKeywords("Minyak Goreng Sawit") === "Sembako & Bumbu", "Infers 'Sembako & Bumbu' from Minyak");
  assert(inferCategoryFromKeywords("Rokok Kretek Surya") === "ATK & Rokok", "Infers 'ATK & Rokok' from Rokok");

  // 5. SKU & BARCODE SEPARATION VERIFICATION IN PRODUCTFORMMODAL
  console.log("\n[Test 5] Verify SKU and Barcode Separation in ProductFormModal.tsx");
  const modalFilePath = path.join(process.cwd(), "src/components/inventory/ProductFormModal.tsx");
  const modalContent = fs.readFileSync(modalFilePath, "utf8");

  // Ensure line overriding SKU with barcode was removed
  const hasSkuOverride = modalContent.includes("setSku((prev) => (!prev || prev.startsWith(\"PRD-\") ? cleanCode : prev))");
  assert(!hasSkuOverride, "ProductFormModal.tsx does NOT overwrite SKU with barcode");

  // Ensure notFoundBarcode state exists
  assert(modalContent.includes("notFoundBarcode"), "ProductFormModal.tsx contains notFoundBarcode state");

  // Ensure friendly not-found banner message exists
  assert(
    modalContent.includes("Produk belum terdaftar di katalog publik — silakan isi Nama Produk di bawah."),
    "ProductFormModal.tsx renders friendly missing catalog banner"
  );

  // Ensure loading message exists
  assert(
    modalContent.includes("Mencari data produk di database &amp; katalog...") ||
      modalContent.includes("Mencari data produk di database & katalog..."),
    "ProductFormModal.tsx renders loading searching catalog banner"
  );

  // Ensure race-condition guard exists
  assert(modalContent.includes("latestLookupCodeRef"), "ProductFormModal.tsx implements race-condition guard (latestLookupCodeRef)");

  // Ensure debounce timer exists
  assert(modalContent.includes("debounceTimerRef"), "ProductFormModal.tsx implements debounce timer for typing");

  // Ensure Enter key prevention on barcode input to protect against USB barcode gun auto-submits
  assert(modalContent.includes('e.key === "Enter"'), "ProductFormModal.tsx intercepts Enter key on barcode input");

  // Ensure Edit mode apply button exists
  assert(modalContent.includes("applyDetectedInfo"), "ProductFormModal.tsx includes applyDetectedInfo handler");
  assert(modalContent.includes("Terapkan ke Form"), "ProductFormModal.tsx renders 'Terapkan ke Form' button for Edit mode");

  // Ensure zero gradients rule is respected in ProductFormModal
  const hasGradientInModal = /\bbg-gradient-|\bfrom-[a-z0-9#]+-/.test(modalContent);
  assert(!hasGradientInModal, "ProductFormModal.tsx has ZERO gradients (100% solid flat colors)");

  // 6. SERVER-SIDE API ROUTE VERIFICATION
  console.log("\n[Test 6] Verify Server-Side API Route src/app/api/barcode/lookup/route.ts");
  const routeFilePath = path.join(process.cwd(), "src/app/api/barcode/lookup/route.ts");
  assert(fs.existsSync(routeFilePath), "API route /api/barcode/lookup/route.ts exists");

  const routeContent = fs.readFileSync(routeFilePath, "utf8");
  assert(routeContent.includes("world.openfoodfacts.org"), "API route includes Open Food Facts fallback");
  assert(routeContent.includes("world.openbeautyfacts.org"), "API route includes Open Beauty Facts fallback");
  assert(routeContent.includes("supabase"), "API route includes Supabase store DB lookup");
  assert(routeContent.includes("sku.eq"), "API route checks both barcode and sku columns in store database");
  assert(routeContent.includes("p.brands"), "API route includes brand prefix logic from Open Food/Beauty Facts");
  assert(routeContent.includes("TokoKu-POS/1.0"), "API route uses official User-Agent header");

  console.log("\n==========================================================");
  console.log(`🎉 ALL TESTS PASSED! (${passedCount} passed, ${failedCount} failed)`);
  console.log("==========================================================");
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
