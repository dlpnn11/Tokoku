# 📋 BREAKDOWN TUGAS KECIL & STRATEGI TESTING (TDD) — TOKOKU

Dokumen ini memecah seluruh proyek menjadi modul-modul kecil bertahap. Setiap tugas wajib memiliki verifikasi/testing sebelum dinyatakan selesai.

---

## DAFTAR MODUL & TUGAS KERJA

### 🏁 FASE 0: Inisialisasi Proyek & Design System (SELESAI ✅)
- [x] **0.1 Setup Next.js TypeScript & Dependencies**
  - Menginstal Next.js App Router, Tailwind CSS, Lucide React, Zustand, `@supabase/supabase-js`, `html5-qrcode`.
  - Mengonfigurasi Tailwind CSS sesuai warna solid (Sage Green `#6FA084`, Beige `#F4F4F0`, Charcoal `#2C2C2C`).
  - *Testing/Verifikasi:* Menjalankan `npm run dev` dan `npm run build` lolos kompilasi 0 error.
- [x] **0.2 Setup Komponen Dasar & Token Flat Minimalist**
  - Menyiapkan Button, Input, Modal/Dialog, Card, Badge, formatRupiah helper.
  - Memastikan seluruh komponen mengikuti aturan 100% flat tanpa gradien.
  - *Testing/Verifikasi:* Render halaman komponen test di `/` dengan verifikasi type safety TypeScript dan responsif.

---

### 🗄️ FASE 1: Database Supabase, SQL Migration & Seed Data (SELESAI ✅)
- [x] **1.1 Pembuatan Skema Database SQL**
  - Membuat script SQL untuk 6 tabel: `users`, `categories`, `suppliers`, `products`, `transactions`, `transaction_details`.
  - Mengonfigurasi foreign key, indexes, dan constraint unik serta RLS policies.
- [x] **1.2 Fungsi Stored Procedure (RPC) Atomic Checkout**
  - Membuat fungsi `create_pos_transaction` dan `cancel_pos_transaction` dengan ACID transaction dan row locking.
- [x] **1.3 Data Awal (Seed Data Warung Kelontong Indonesia)**
  - Menyiapkan data realistis: Kategori (Minuman, Mie Instan, Sembako, Kebersihan, Rokok), Supplier, dan puluhan Produk lengkap dengan barcode pabrik asli & produk lokal tanpa barcode (Telur, Kerupuk).
  - *Testing/Verifikasi:* Berhasil terhubung dari Next.js ke Supabase Cloud dan memvalidasi data produk Aqua, Teh Botol, Pocari via API.

---

### 🔐 FASE 2: Layout Navigasi & Role-Based Access Control (RBAC) (SELESAI ✅)
- [x] **2.1 Global Layout & Persistent Sidebar**
  - Implementasi sidebar 220px desktop dengan warna Charcoal `#2C2C2C` dan active indicator Sage Green `#6FA084`.
  - Top header bar 64px dengan jam realtime WIB, info akun, modal scanner HP, dan badge role.
  - Collapsible Mobile Drawer untuk layar HP (<768px).
- [x] **2.2 Autentikasi Sederhana & Pembatasan Rute**
  - Zustand auth store dengan tombol quick switch Pemilik vs Kasir.
  - Validasi rute di AppShell: Kasir hanya bisa membuka `/pos` dan `/riwayat`. Rute lain otomatis terlempar ke `/pos`.
  - *Testing/Verifikasi:* Next.js build sukses untuk 7 rute (`/`, `/pos`, `/dashboard`, `/inventaris`, `/riwayat`, `/laporan`).

---

### 📦 FASE 3: Modul Inventaris (`/inventaris`) (SELESAI ✅)
- [x] **3.1 Tampilan Tab & Filter Produk**
  - Tab Produk, Kategori, Supplier.
  - Filter pencarian teks nama/SKU, dropdown kategori, status stok (Semua, Aktif, Menipis, Habis).
  - 4 KPI card ringkasan inventaris (Total SKU, Stok Menipis, Stok Habis, Total HPP).
- [x] **3.2 CRUD Produk & Modal Tambah/Edit**
  - Form input nama, barcode/SKU, kategori, supplier, harga beli, harga jual, perhitungan margin otomatis, stok, stok minimum, satuan.
  - Modal detail produk dengan visualisasi data spesifikasi.
  - CRUD Kategori dan Supplier modal terhubung langsung ke Supabase.
- [x] **3.3 Modal Stock Opname**
  - Penyesuaian stok fisik langsung ke sistem dengan pencatatan selisih (+/-) serta tombol cepat penambahan barang kulakan (+1, +5).
  - *Testing/Verifikasi:* Next.js build sukses 100% dan teruji koneksi ke Supabase Cloud.

---

### 💳 FASE 4: Modul POS Kasir & Scanner HP Realtime (`/pos` & `/scan`)
- [ ] **4.1 Split-Screen Terminal Kasir**
  - Sisi kiri: Katalog produk kartu (sesuai `Kasir.png`) + pencarian instan + filter chips kategori.
  - Sisi kanan: Keranjang belanja Zustand dengan penyesuaian jumlah (+ / -), hapus item, subtotal, diskon, total.
  - Tombol nominal cepat uang pas, Rp 5.000, 10.000, 20.000, 50.000, 100.000, hitung kembalian otomatis.
  - Pilihan metode Tunai vs QRIS.
- [ ] **4.2 Halaman Scanner HP (`/scan`) & Supabase Realtime**
  - Tampilan kamera responsif dengan `html5-qrcode`.
  - Web Audio API "beep" saat scan sukses.
  - Broadcast event ke room POS desktop.
  - Modal QR Code Pairing di desktop POS agar HP mudah terhubung.
- [ ] **4.3 Checkout Atomik & Pengurangan Stok**
  - Memanggil RPC Supabase saat kasir menekan tombol "BAYAR".
  - *Testing/Verifikasi:* Tambahkan barang ke keranjang -> Bayar -> Pastikan stok di database berkurang, transaksi tercatat, dan keranjang kembali kosong.

---

### 🧾 FASE 5: Struk Pembayaran & Riwayat Transaksi (`/riwayat`)
- [ ] **5.1 Modal Sukses & Cetak Struk / WhatsApp**
  - Modal selesai transaksi menampilkan detail nota.
  - Tombol "Cetak Struk": `@media print` format thermal 58mm/80mm bersih tanpa elemen UI yang bocor.
  - Tombol "Kirim via WhatsApp": membuka URL `wa.me` dengan teks nota rapi.
- [ ] **5.2 Halaman Riwayat Transaksi**
  - Filter rentang tanggal, filter metode bayar, filter status (Selesai/Dibatalkan).
  - Modal detail transaksi (sesuai `Riwayat Pop Up.png`).
  - Fitur cetak ulang struk.
  - *Testing/Verifikasi:* Lakukan cetak struk via preview browser, pastikan layout kertas thermal presisi.

---

### 📊 FASE 6: Dashboard Pemilik & Laporan (`/dashboard` & `/laporan`)
- [ ] **6.1 Dashboard Owner**
  - Kartu KPI: Total Pendapatan Hari Ini, Total Transaksi, Produk Aktif, Supplier, Kategori.
  - Tabel Peringatan Stok Menipis (`current_stock <= minimum_stock`).
- [ ] **6.2 Laporan Keuangan & Analitik**
  - Grafik pendapatan harian dan tren bulanan (menggunakan Recharts / Chart.js flat solid).
  - Peringkat barang terlaris (*Best Sellers*).
  - Kontribusi pendapatan per kategori.
  - *Testing/Verifikasi:* Masukkan beberapa transaksi simulasi, pastikan grafik dan perhitungan laba/omzet akurat.

---

### 📱 FASE 7: Verifikasi Responsif & Polish Akhir
- [ ] Uji coba tampilan pada berbagai ukuran layar (Desktop 1440px, Tablet 768px, HP 360-430px).
- [ ] Pengecekan penanganan error (saat offline, koneksi terputus, atau kamera tidak diizinkan).
- [ ] Final checklist dan persiapan deployment ke Vercel.
