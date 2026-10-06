import { createClient } from "@supabase/supabase-js";
import { roundPrice500, formatRupiah } from "../src/lib/utils";

const SUPABASE_URL = "https://xgtkoclchscygrckhyya.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndGtvY2xjaHNjeWdyY2toeXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMTQyMzYsImV4cCI6MjEwNjc5MDIzNn0.TgfdIwdLr-8LQrZ5kCbrHt1WTV_m1mwiVoQ2rd1hYzU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runVerification() {
  console.log("=================================================");
  console.log("🧪 TOKOKU END-TO-END AUTOMATED VERIFICATION SUITE");
  console.log("=================================================\n");

  let allPassed = true;

  // 1. Check Table Row Counts
  console.log("1. MEMERIKSA JUMLAH DATA DALAM DATABASE:");
  const tables = ["users", "categories", "suppliers", "products", "transactions", "transaction_details"];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
    if (error) {
      console.error(`   ❌ Gagal menghitung ${t}:`, error.message);
      allPassed = false;
    } else {
      console.log(`   ✓ Tabel '${t}': ${count} baris data`);
    }
  }

  // 2. Check 2025 vs 2026 Transactions Distribution
  console.log("\n2. MEMERIKSA DISTRIBUSI TRANSAKSI HISTORIS (2025 vs 2026):");
  const { data: txList, error: txErr } = await supabase
    .from("transactions")
    .select("created_at, total_amount, status");

  if (txErr || !txList) {
    console.error("   ❌ Gagal mengambil transaksi:", txErr?.message);
    allPassed = false;
  } else {
    let tx2025 = 0;
    let tx2026 = 0;
    let rev2025 = 0;
    let rev2026 = 0;
    let cancelled = 0;

    txList.forEach((tx) => {
      const year = new Date(tx.created_at).getFullYear();
      if (year === 2025) {
        tx2025++;
        if (tx.status === "Selesai") rev2025 += Number(tx.total_amount);
      } else if (year === 2026) {
        tx2026++;
        if (tx.status === "Selesai") rev2026 += Number(tx.total_amount);
      }
      if (tx.status === "Dibatalkan") cancelled++;
    });

    console.log(`   ✓ Transaksi Tahun 2025: ${tx2025} nota (Omzet: ${formatRupiah(rev2025)})`);
    console.log(`   ✓ Transaksi Tahun 2026: ${tx2026} nota (Omzet: ${formatRupiah(rev2026)})`);
    console.log(`   ✓ Transaksi Dibatalkan (Validasi Status): ${cancelled} nota`);
  }

  // 3. Test Pricing Rounding Rules (.000 / .500)
  console.log("\n3. MENGUJI ATURAN PEMBULATAN HARGA KELIPATAN 500:");
  const testPrices = [
    { input: 3200, expected: 3500 },
    { input: 3500, expected: 3500 },
    { input: 3600, expected: 4000 },
    { input: 12100, expected: 12500 },
    { input: 74900, expected: 75000 },
  ];

  let roundPassed = true;
  for (const tp of testPrices) {
    const actual = roundPrice500(tp.input);
    if (actual !== tp.expected) {
      console.error(`   ❌ roundPrice500(${tp.input}) = ${actual}, expected ${tp.expected}`);
      roundPassed = false;
      allPassed = false;
    }
  }
  if (roundPassed) {
    console.log("   ✓ Seluruh uji coba pembulatan harga kelipatan 500 (.000 / .500) BERHASIL!");
  }

  // 4. Test Products Integrity & Barcodes
  console.log("\n4. MEMERIKSA INTEGRITAS PRODUK & STOK:");
  const { data: prods, error: pErr } = await supabase
    .from("products")
    .select("sku, name, current_stock, minimum_stock, sell_price");

  if (pErr || !prods) {
    console.error("   ❌ Gagal memuat produk:", pErr?.message);
    allPassed = false;
  } else {
    const criticalStock = prods.filter((p) => p.current_stock <= (p.minimum_stock || 5));
    console.log(`   ✓ Total produk aktif: ${prods.length} SKU`);
    console.log(`   ✓ Produk butuh restock (Peringatan Dashboard): ${criticalStock.length} SKU`);
  }

  console.log("\n=================================================");
  if (allPassed) {
    console.log("🎉 HASIL PENGUJIAN: SEMUA KOMPONEN BERJALAN 100% SUKSES!");
  } else {
    console.log("⚠️ ADA BEBERAPA KOMPONEN YANG PERLU DIPERIKSA KEMBALI.");
  }
  console.log("=================================================\n");
}

runVerification();
