import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = "https://xgtkoclchscygrckhyya.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndGtvY2xjaHNjeWdyY2toeXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMTQyMzYsImV4cCI6MjEwNjc5MDIzNn0.TgfdIwdLr-8LQrZ5kCbrHt1WTV_m1mwiVoQ2rd1hYzU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const USERS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    username: "pemilik",
    password_hash: "pemilik123",
    full_name: "Firdaus Ubaidillah",
    role: "pemilik",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    username: "kasir",
    password_hash: "kasir123",
    full_name: "Ani Rahayu",
    role: "kasir",
  },
];

const CATEGORIES = [
  { id: "c1111111-1111-1111-1111-111111111111", name: "Minuman", icon_name: "Coffee" },
  { id: "c2222222-2222-2222-2222-222222222222", name: "Mie Instan", icon_name: "Soup" },
  { id: "c3333333-3333-3333-3333-333333333333", name: "Makanan Ringan / Snack", icon_name: "Cookie" },
  { id: "c4444444-4444-4444-4444-444444444444", name: "Sembako & Bumbu", icon_name: "Wheat" },
  { id: "c5555555-5555-5555-5555-555555555555", name: "Kebutuhan Rumah Tangga / Kebersihan", icon_name: "Sparkles" },
  { id: "c6666666-6666-6666-6666-666666666666", name: "ATK & Rokok", icon_name: "PenTool" },
  { id: "c7777777-7777-7777-7777-777777777777", name: "Obat-obatan & P3K", icon_name: "Pill" },
  { id: "c8888888-8888-8888-8888-888888888888", name: "Susu & Olahan Susu", icon_name: "Milk" },
];

const SUPPLIERS = [
  {
    id: "ba111111-1111-1111-1111-111111111111",
    name: "Toko Grosir Sumber Rejeki",
    phone: "081234567890",
    address: "Pasar Induk Kramat Jati Blok A5",
  },
  {
    id: "ba222222-2222-2222-2222-222222222222",
    name: "Agen Sembako Barokah Jaya",
    phone: "085712349988",
    address: "Jl. Raya Kebon Jeruk No. 14",
  },
  {
    id: "ba333333-3333-3333-3333-333333333333",
    name: "Distributor Wings & Unilever",
    phone: "082198765432",
    address: "Kawasan Industri Pulogadung",
  },
  {
    id: "ba444444-4444-4444-4444-444444444444",
    name: "CV Mayora & Indofood Distributor",
    phone: "081388992211",
    address: "Jl. Daan Mogot KM 12",
  },
  {
    id: "ba555555-5555-5555-5555-555555555555",
    name: "Grosir Rokok & ATK Sentosa",
    phone: "085211223344",
    address: "Pasar Senen Blok 3 No. 45",
  },
  {
    id: "ba666666-6666-6666-6666-666666666666",
    name: "Agen Minuman Segar Nusantara",
    phone: "081809876543",
    address: "Jl. Raya Pasar Minggu No. 88",
  },
];

const PRODUCTS_SEED = [
  // Minuman
  { sku: "8992753123456", name: "Aqua 600ml", cat: "c1", sup: "ba1", buy: 2500, sell: 3500, stock: 48, min: 10, unit: "botol" },
  { sku: "8998866200234", name: "Teh Botol Sosro 350ml", cat: "c1", sup: "ba1", buy: 3000, sell: 4000, stock: 32, min: 8, unit: "botol" },
  { sku: "8992741910013", name: "Pocari Sweat 350ml", cat: "c1", sup: "ba6", buy: 5000, sell: 6500, stock: 24, min: 6, unit: "botol" },
  { sku: "8996001600269", name: "Le Minerale 600ml", cat: "c1", sup: "ba1", buy: 2500, sell: 3500, stock: 36, min: 10, unit: "botol" },
  { sku: "8991001101234", name: "Good Day Cappuccino Botol 250ml", cat: "c1", sup: "ba6", buy: 5500, sell: 7000, stock: 20, min: 6, unit: "botol" },
  { sku: "8992753711110", name: "Floridina Orange 350ml", cat: "c1", sup: "ba6", buy: 2500, sell: 3500, stock: 3, min: 8, unit: "botol" }, // Low stock!
  { sku: "8998866200555", name: "Teh Pucuk Harum 350ml", cat: "c1", sup: "ba1", buy: 3000, sell: 4000, stock: 40, min: 10, unit: "botol" },
  { sku: "8992753888222", name: "Coca Cola 390ml", cat: "c1", sup: "ba6", buy: 4000, sell: 5500, stock: 18, min: 6, unit: "botol" },
  { sku: "8992753888333", name: "Sprite 390ml", cat: "c1", sup: "ba6", buy: 4000, sell: 5500, stock: 15, min: 6, unit: "botol" },
  { sku: "8991001222444", name: "Kopiko 78C Coffee Latte 240ml", cat: "c1", sup: "ba6", buy: 6000, sell: 7500, stock: 2, min: 6, unit: "botol" }, // Critical!

  // Mie Instan
  { sku: "8998866200111", name: "Indomie Goreng Spesial 85g", cat: "c2", sup: "ba4", buy: 2700, sell: 3500, stock: 96, min: 20, unit: "bungkus" },
  { sku: "8998866200128", name: "Indomie Kuah Ayam Bawang 69g", cat: "c2", sup: "ba4", buy: 2700, sell: 3500, stock: 60, min: 15, unit: "bungkus" },
  { sku: "8998866200135", name: "Indomie Kuah Soto Mie 70g", cat: "c2", sup: "ba4", buy: 2700, sell: 3500, stock: 72, min: 15, unit: "bungkus" },
  { sku: "8998866200142", name: "Indomie Kari Ayam 72g", cat: "c2", sup: "ba4", buy: 3000, sell: 4000, stock: 54, min: 12, unit: "bungkus" },
  { sku: "8992753200010", name: "Mie Sedaap Goreng 90g", cat: "c2", sup: "ba3", buy: 2700, sell: 3500, stock: 45, min: 15, unit: "bungkus" },
  { sku: "8992753200027", name: "Mie Sedaap Soto Madura 75g", cat: "c2", sup: "ba3", buy: 2700, sell: 3500, stock: 40, min: 15, unit: "bungkus" },
  { sku: "8998866201019", name: "Pop Mie Rasa Ayam Bawang 75g", cat: "c2", sup: "ba4", buy: 4200, sell: 5500, stock: 24, min: 8, unit: "cup" },
  { sku: "8998866201026", name: "Pop Mie Goreng Pedas Gledek 75g", cat: "c2", sup: "ba4", buy: 4500, sell: 6000, stock: 1, min: 8, unit: "cup" }, // Critical!

  // Snack / Makanan Ringan
  { sku: "8998866300118", name: "Chitato Sapi Panggang 68g", cat: "c3", sup: "ba4", buy: 9200, sell: 11500, stock: 22, min: 6, unit: "bungkus" },
  { sku: "8992753300116", name: "Taro Net Seaweed 65g", cat: "c3", sup: "ba4", buy: 6800, sell: 8500, stock: 18, min: 6, unit: "bungkus" },
  { sku: "8998866300224", name: "Qtela Singkong Balado 60g", cat: "c3", sup: "ba4", buy: 5500, sell: 7000, stock: 25, min: 6, unit: "bungkus" },
  { sku: "8991001300111", name: "Roma Kelapa Biskuit 300g", cat: "c3", sup: "ba4", buy: 8500, sell: 10500, stock: 15, min: 5, unit: "bungkus" },
  { sku: "8992753333444", name: "Oreo Vanilla Roll 133g", cat: "c3", sup: "ba4", buy: 7500, sell: 9500, stock: 20, min: 5, unit: "bungkus" },
  { sku: "8991001300227", name: "Beng Beng Wafer Cokelat 25g", cat: "c3", sup: "ba4", buy: 1800, sell: 2500, stock: 50, min: 10, unit: "pcs" },
  { sku: "8991001300333", name: "SilverQueen Chunky Bar 58g", cat: "c3", sup: "ba4", buy: 13000, sell: 16500, stock: 14, min: 4, unit: "pcs" },
  { sku: "8991001300444", name: "Choki Choki Cashew 11g", cat: "c3", sup: "ba4", buy: 1000, sell: 1500, stock: 80, min: 20, unit: "pcs" },

  // Sembako & Bumbu
  { sku: "8999999100010", name: "Beras Ramos Setra Super 5kg", cat: "c4", sup: "ba2", buy: 64000, sell: 72500, stock: 12, min: 3, unit: "karung" },
  { sku: "8998866400016", name: "Minyak Goreng Bimoli Klasik 1L", cat: "c4", sup: "ba2", buy: 16500, sell: 19500, stock: 20, min: 5, unit: "pouch" },
  { sku: "8998866400023", name: "Minyak Goreng Filma 2L", cat: "c4", sup: "ba2", buy: 31500, sell: 36500, stock: 10, min: 3, unit: "pouch" },
  { sku: "8992753400014", name: "Gulaku Premium Putih 1kg", cat: "c4", sup: "ba2", buy: 15000, sell: 17500, stock: 25, min: 5, unit: "bungkus" },
  { sku: "8998866400030", name: "Tepung Terigu Segitiga Biru 1kg", cat: "c4", sup: "ba2", buy: 11000, sell: 13000, stock: 18, min: 5, unit: "bungkus" },
  { sku: "8999999200017", name: "Royco Bumbu Kaldu Ayam 100g", cat: "c4", sup: "ba2", buy: 3500, sell: 4500, stock: 35, min: 8, unit: "bungkus" },
  { sku: "8999999200024", name: "Masako Kaldu Rasa Sapi 100g", cat: "c4", sup: "ba2", buy: 3500, sell: 4500, stock: 30, min: 8, unit: "bungkus" },
  { sku: "8999999200031", name: "Kecap Manis Bango 135ml", cat: "c4", sup: "ba2", buy: 7500, sell: 9500, stock: 22, min: 5, unit: "pouch" },
  { sku: "8999999200048", name: "Garam Dapur Cap Kapal 250g", cat: "c4", sup: "ba2", buy: 2000, sell: 3000, stock: 40, min: 10, unit: "bungkus" },

  // Kebersihan & Rumah Tangga
  { sku: "8999999300014", name: "Sunlight Pencuci Piring Jeruk Nipis 750ml", cat: "c5", sup: "ba3", buy: 12500, sell: 15500, stock: 20, min: 5, unit: "pouch" },
  { sku: "8992753500011", name: "Mama Lemon Jeruk Nipis 680ml", cat: "c5", sup: "ba3", buy: 10500, sell: 13500, stock: 15, min: 5, unit: "pouch" },
  { sku: "8992753500028", name: "Daia Deterjen Bubuk Putih 850g", cat: "c5", sup: "ba3", buy: 15000, sell: 18500, stock: 16, min: 4, unit: "bungkus" },
  { sku: "8999999300021", name: "Rinso Anti Noda Deterjen 770g", cat: "c5", sup: "ba3", buy: 17500, sell: 21000, stock: 14, min: 4, unit: "bungkus" },
  { sku: "8999999300038", name: "Sabun Mandi Lifebuoy Total 10 85g", cat: "c5", sup: "ba3", buy: 3500, sell: 4500, stock: 30, min: 8, unit: "batang" },
  { sku: "8999999300045", name: "Pasta Gigi Pepsodent Pencegah Gigi Berlubang 190g", cat: "c5", sup: "ba3", buy: 10000, sell: 12500, stock: 18, min: 5, unit: "kotak" },
  { sku: "8999999300052", name: "Shampoo Sunsilk Black Shine 160ml", cat: "c5", sup: "ba3", buy: 15500, sell: 19000, stock: 12, min: 4, unit: "botol" },

  // Susu
  { sku: "8998009010203", name: "Ultra Milk Rasa Cokelat 250ml", cat: "c8", sup: "ba6", buy: 5000, sell: 6500, stock: 32, min: 8, unit: "kotak" },
  { sku: "8998009010210", name: "Ultra Milk Rasa Full Cream 250ml", cat: "c8", sup: "ba6", buy: 5000, sell: 6500, stock: 28, min: 8, unit: "kotak" },
  { sku: "8992753600018", name: "Susu Kental Manis Frisian Flag Cokelat 370g", cat: "c8", sup: "ba1", buy: 11000, sell: 13500, stock: 20, min: 5, unit: "kaleng" },

  // Obat & P3K
  { sku: "8999999400011", name: "Panadol Biru Paracetamol 500mg 10 Kaplet", cat: "c7", sup: "ba1", buy: 11000, sell: 13500, stock: 24, min: 5, unit: "strip" },
  { sku: "8999999400028", name: "Tolak Angin Cair Herbal Sidomuncul", cat: "c7", sup: "ba1", buy: 3500, sell: 4500, stock: 45, min: 10, unit: "sachet" },
  { sku: "8999999400035", name: "Bodrex Sakit Kepala & Demam 1 Strip", cat: "c7", sup: "ba1", buy: 4800, sell: 6000, stock: 30, min: 8, unit: "strip" },

  // ATK & Rokok
  { sku: "8999999500018", name: "Buku Tulis Sinar Dunia 38 Lembar", cat: "c6", sup: "ba5", buy: 3200, sell: 4500, stock: 35, min: 10, unit: "buku" },
  { sku: "8999999500025", name: "Pulpen Pilot G2 Gel 0.5mm Hitam", cat: "c6", sup: "ba5", buy: 15000, sell: 18500, stock: 18, min: 5, unit: "pcs" },
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function runSeed() {
  console.log("🚀 Memulai penanaman data dummy komprehensif TokoKu (2025 - 2026)...");

  // 1. Seed Users
  console.log("1. Memasukkan Users...");
  const { error: userErr } = await supabase.from("users").upsert(USERS);
  if (userErr) console.warn("Users warning:", userErr.message);

  // 2. Seed Categories
  console.log("2. Memasukkan Kategori...");
  const { error: catErr } = await supabase.from("categories").upsert(CATEGORIES);
  if (catErr) console.warn("Categories warning:", catErr.message);

  // 3. Seed Suppliers
  console.log("3. Memasukkan Suppliers...");
  const { error: supErr } = await supabase.from("suppliers").upsert(SUPPLIERS);
  if (supErr) console.warn("Suppliers warning:", supErr.message);

  // 4. Seed Products
  console.log("4. Memasukkan 48 Produk...");
  const productsToInsert = PRODUCTS_SEED.map((p) => ({
    sku: p.sku,
    name: p.name,
    category_id: CATEGORIES.find((c) => c.id.startsWith(p.cat))?.id || CATEGORIES[0].id,
    supplier_id: SUPPLIERS.find((s) => s.id.startsWith(p.sup))?.id || SUPPLIERS[0].id,
    buy_price: p.buy,
    sell_price: p.sell,
    current_stock: p.stock,
    minimum_stock: p.min,
    unit: p.unit,
    is_active: true,
  }));

  const { data: insertedProducts, error: prodErr } = await supabase
    .from("products")
    .upsert(productsToInsert, { onConflict: "sku" })
    .select("id, sku, name, buy_price, sell_price");

  if (prodErr || !insertedProducts || insertedProducts.length === 0) {
    console.error("Gagal menanam produk:", prodErr);
    return;
  }
  console.log(`✓ Berhasil memasukkan ${insertedProducts.length} produk!`);

  // 5. Generate Historical Transactions from late 2025 to Oct 2026
  console.log("5. Menghasilkan riwayat transaksi (Oktober 2025 s/d Oktober 2026)...");

  const months = [
    // 2025
    { year: 2025, month: 9, count: 18 },  // Okt 2025
    { year: 2025, month: 10, count: 22 }, // Nov 2025
    { year: 2025, month: 11, count: 28 }, // Des 2025
    // 2026
    { year: 2026, month: 0, count: 25 },  // Jan 2026
    { year: 2026, month: 1, count: 28 },  // Feb 2026
    { year: 2026, month: 2, count: 32 },  // Mar 2026
    { year: 2026, month: 3, count: 35 },  // Apr 2026
    { year: 2026, month: 4, count: 38 },  // Mei 2026
    { year: 2026, month: 5, count: 36 },  // Jun 2026
    { year: 2026, month: 6, count: 42 },  // Jul 2026
    { year: 2026, month: 7, count: 45 },  // Agu 2026
    { year: 2026, month: 8, count: 48 },  // Sep 2026
    { year: 2026, month: 9, count: 25 },  // Okt 2026 (termasuk hari ini)
  ];

  let totalTxGenerated = 0;
  const userIds = [USERS[0].id, USERS[1].id];

  for (const m of months) {
    const transactionsBatch: any[] = [];
    const detailsBatch: any[] = [];

    for (let i = 0; i < m.count; i++) {
      // Pick random day in that month
      const maxDays = m.year === 2026 && m.month === 9 ? 6 : 28; // Up to Oct 6 for current month
      const day = getRandomInt(1, Math.max(1, maxDays));
      const hour = getRandomInt(8, 21);
      const minute = getRandomInt(0, 59);
      const second = getRandomInt(0, 59);

      const txDate = new Date(m.year, m.month, day, hour, minute, second);
      const dateStr = txDate.toISOString().slice(0, 10).replace(/-/g, "");
      const invoiceNumber = `TK-${dateStr}-${getRandomInt(1000, 9999)}`;

      // Status: 94% Selesai, 6% Dibatalkan
      const status = Math.random() < 0.06 ? "Dibatalkan" : "Selesai";
      const paymentMethod = Math.random() < 0.35 ? "QRIS" : "Tunai";
      const userId = getRandomItem(userIds);

      // Pick 1 to 5 random products for this transaction
      const itemCount = getRandomInt(1, 4);
      const pickedProducts = new Set<string>();
      let txTotal = 0;
      const txItems: any[] = [];

      for (let j = 0; j < itemCount; j++) {
        const prod = getRandomItem(insertedProducts);
        if (pickedProducts.has(prod.id)) continue;
        pickedProducts.add(prod.id);

        const qty = getRandomInt(1, 3);
        const subtotal = qty * Number(prod.sell_price);
        txTotal += subtotal;

        txItems.push({
          product_id: prod.id,
          quantity: qty,
          unit_price: Number(prod.sell_price),
          subtotal,
        });
      }

      if (txItems.length === 0) continue;

      let cashReceived = txTotal;
      let cashChange = 0;
      if (paymentMethod === "Tunai") {
        const roundBills = [10000, 20000, 50000, 100000];
        const higherBill = roundBills.find((b) => b >= txTotal) || txTotal + 10000;
        cashReceived = Math.random() < 0.5 ? txTotal : higherBill;
        cashChange = Math.max(0, cashReceived - txTotal);
      }

      const txRecord = {
        invoice_number: invoiceNumber,
        user_id: userId,
        total_amount: txTotal,
        payment_method: paymentMethod,
        cash_received: paymentMethod === "Tunai" ? cashReceived : null,
        cash_change: paymentMethod === "Tunai" ? cashChange : 0,
        customer_phone: Math.random() < 0.3 ? `0812${getRandomInt(10000000, 99999999)}` : null,
        status,
        created_at: txDate.toISOString(),
      };

      // Insert transaction directly
      const { data: insertedTx, error: txErr } = await supabase
        .from("transactions")
        .insert(txRecord)
        .select("id")
        .single();

      if (txErr || !insertedTx) {
        continue;
      }

      // Insert transaction details
      const detailsWithTxId = txItems.map((item) => ({
        ...item,
        transaction_id: insertedTx.id,
      }));

      await supabase.from("transaction_details").insert(detailsWithTxId);
      totalTxGenerated++;
    }

    console.log(
      `✓ Data bulan ${m.month + 1}/${m.year} selesai dimasukkan (${m.count} transaksi)`
    );
  }

  console.log(`\n🎉 SEED DATA SELESAI! Total ${totalTxGenerated} transaksi berhasil ditanam.`);
  console.log("Grafik bulanan 2025 - 2026, penjualan harian, inventaris, dan produk terlaris kini penuh dengan data realistis!");
}

runSeed().catch((err) => {
  console.error("Fatal seed error:", err);
});
