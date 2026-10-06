# 🏪 TokoKu — Modern Grocery POS & Inventory Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Zustand](https://img.shields.io/badge/Zustand-State%20Management-4338CA?style=flat)](https://zustand-demo.pmnd.rs/)

TokoKu adalah sistem kasir (Point of Sale) dan manajemen inventaris modern yang dirancang khusus untuk toko kelontong dan grosir retail. Dibangun dengan performa tinggi, desain antarmuka datar (*flat aesthetic*) tanpa gradien yang bersih dan intuitif, serta terintegrasi penuh secara realtime dengan database cloud Supabase.

---

## ✨ Fitur Utama

- 💳 **Terminal Kasir POS Responsif:**
  - Desain split-screen ergonomis: katalog produk di kiri, keranjang belanja interaktif di kanan.
  - Pencarian instan dan filter kategori cepat.
  - Tombol nominal uang tunai cepat (Rp 5.000 s/d Rp 100.000 & Uang Pas).
  - Format angka ribuan otomatis (`250.000`) dan perhitungan kembalian instan.
- 📱 **Wireless Mobile Barcode Scanner (`/scan`):**
  - Ubah kamera smartphone apa saja menjadi pemindai barcode nirkabel secara instan.
  - Mengirim hasil scan produk ke terminal kasir desktop secara realtime tanpa kabel tambahan.
- 🧾 **Resi Digital Ala Bank Modern (PNG & WhatsApp):**
  - Struk digital bergaya perbankan modern (Bank Jago/E-Wallet) beresolusi tinggi.
  - Fitur **Unduh Foto Resi (PNG)** sekali klik.
  - Integrasi WhatsApp lengkap: **Direct Chat** (masukkan nomor pelanggan) dan **WhatsApp Desktop/Web** (pilih dari kontak tersimpan).
  - Dukungan cetak nota fisik kertas thermal standar 58mm.
- 📦 **Manajemen Inventaris Multi-Tab:**
  - Pengelolaan katalog Produk, Kategori, dan Supplier terintegrasi.
  - Tracking stok otomatis dengan peringatan stok kritis (< 10 unit).
  - Riwayat penyesuaian kulakan dan filter status barang.
- 📊 **Laporan Finansial & Riwayat Penjualan:**
  - Kartu KPI analitik: Omset kotor, laba bersih, total transaksi, rata-rata belanja.
  - Grafik tren penjualan bulanan dan breakdown kategori terlaris.
  - Ekspor seluruh laporan dan riwayat transaksi ke format **Excel (.xlsx)** dan **CSV**.
- 🔐 **Role-Based Access Control (RBAC):**
  - **Pemilik Toko:** Akses tak terbatas (Dashboard, Inventaris, Laporan, Kasir, Riwayat).
  - **Kasir:** Hak akses fokus transaksi operasional (Kasir POS dan Riwayat).
  - Halaman login aman dengan tombol Quick Demo.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router & Turbopack)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/) (Strict Flat Color Palette: Sage Green `#6FA084`, Cream `#F4F4F0`, Charcoal `#2C2C2C`)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) (Persisted Cart & Auth Stores)
- **Database & Realtime:** [Supabase](https://supabase.com/) (PostgreSQL, Realtime Broadcast, RLS Policies)
- **Export & Imaging:** `html-to-image`, `xlsx`

---

## 🚀 Panduan Menjalankan Proyek Secara Lokal

### 1. Kloning Repositori
```bash
git clone https://github.com/dlpnn11/Tokoku.git
cd Tokoku
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env.local` di root folder dan isi konfigurasi Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser dan akses [http://localhost:3000](http://localhost:3000).

---

## 📁 Struktur Direktori

```text
├── .agents/              # Aturan operasional & konfigurasi AI Assistant
├── docs/                 # Dokumentasi arsitektur, panduan teknis, dan alur kerja
│   ├── MASTER_PROJECT_CONTEXT.md
│   ├── WORKFLOW.md
│   ├── RANCANGAN_ARSITEKTUR_TOKOKU.md
│   ├── BREAKDOWN_TUGAS_DAN_TESTING.md
│   └── guides/
├── public/               # Asset statis & ikon
├── scripts/              # Script otomatisasi & seed data historis
├── src/
│   ├── app/              # Next.js App Router (Halaman: /login, /pos, /inventaris, dll.)
│   ├── components/       # Komponen UI modular (POS, Inventaris, Laporan, Layout)
│   ├── lib/              # Utilitas format mata uang, helper database & supabase client
│   ├── services/         # Data Access Layer & RPC calls ke Supabase
│   ├── stores/           # Zustand state (Cart Store & Auth Store)
│   └── types/            # Definisi TypeScript Database & Domain Models
└── supabase/             # Schema database PostgreSQL, trigger stok, & migrasi
```

---

## 📄 Lisensi
Hak Cipta © 2026 Dalvin Widya Purnama. Dibuat untuk pemenuhan tugas akademik Sistem Informasi.
