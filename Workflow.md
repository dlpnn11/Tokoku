# 🔄 WORKFLOW PENGEMBANGAN TOKOKU POS & INVENTARIS

Peta alur kerja pengembangan berbasis **Schema-First Foundation & Test-Driven Verification**:

```mermaid
graph TD
    A[Tahap 0: Setup Fondasi & Design System] --> B[Tahap 1: Supabase Database Schema & Seed Data]
    B --> C[Tahap 2: Auth & Navigasi Layout Responsif]
    C --> D[Tahap 3: Modul Inventaris / Produk]
    D --> E[Tahap 4: Modul POS Kasir & Scanner HP Realtime]
    E --> F[Tahap 5: Struk Cetak / WA & Riwayat Transaksi]
    F --> G[Tahap 6: Dashboard Owner & Laporan Analitik]
    G --> H[Tahap 7: Testing Responsif & Finishing]
```

---

## 📚 DOKUMENTASI TERKAIT (INTERLINKED CONTEXT)
- 🏗️ **Arsitektur Lengkap:** [RANCANGAN_ARSITEKTUR_TOKOKU.md](file:///c:/Users/dalvi/OneDrive/Desktop/Tugas%20Kuliah/Semester%203/Sistem%20Informasi/Tugas/TokoKu/docs/RANCANGAN_ARSITEKTUR_TOKOKU.md)
- 📋 **Daftar Tugas & Testing (TDD):** [BREAKDOWN_TUGAS_DAN_TESTING.md](file:///c:/Users/dalvi/OneDrive/Desktop/Tugas%20Kuliah/Semester%203/Sistem%20Informasi/Tugas/TokoKu/docs/BREAKDOWN_TUGAS_DAN_TESTING.md)
- 🐙 **Panduan Git & GitHub:** [PANDUAN_GIT_GITHUB.md](file:///c:/Users/dalvi/OneDrive/Desktop/Tugas%20Kuliah/Semester%203/Sistem%20Informasi/Tugas/TokoKu/docs/guides/PANDUAN_GIT_GITHUB.md)
- ⚡ **Panduan Setup Supabase:** [PANDUAN_SETUP_SUPABASE.md](file:///c:/Users/dalvi/OneDrive/Desktop/Tugas%20Kuliah/Semester%203/Sistem%20Informasi/Tugas/TokoKu/docs/guides/PANDUAN_SETUP_SUPABASE.md)
- 👑 **Prinsip Pengembangan AI:** [PRINSIP_PENGEMBANGAN_AI.md](file:///c:/Users/dalvi/OneDrive/Desktop/Tugas%20Kuliah/Semester%203/Sistem%20Informasi/Tugas/TokoKu/docs/guides/PRINSIP_PENGEMBANGAN_AI.md)
- 🎨 **Referensi Desain Visual:** [Design Reference Folder](file:///c:/Users/dalvi/OneDrive/Desktop/Tugas%20Kuliah/Semester%203/Sistem%20Informasi/Tugas/TokoKu/Design%20Reference)
- 📜 **Konteks Master:** [MASTER_PROJECT_CONTEXT.md](file:///c:/Users/dalvi/OneDrive/Desktop/Tugas%20Kuliah/Semester%203/Sistem%20Informasi/Tugas/TokoKu/MASTER_PROJECT_CONTEXT.md)

---

## RINGKASAN TAHAPAN:
* **Tahap 0 — Project Setup & Design System Tokens:** Inisialisasi Next.js TypeScript, Tailwind CSS, konfigurasi warna solid (Sage Green `#6FA084`, Soft Beige `#F4F4F0`, Dark Charcoal `#2C2C2C`, tanpa gradien), dan instalasi komponen Shadcn UI dasar.
* **Tahap 1 — Database Schema & Realistic Seed Data:** Menyiapkan script SQL migration Supabase untuk 6 tabel, relasi, RLS, dan RPC checkout atomik. Memasukkan data awal (seed) produk khas warung kelontong Indonesia (Indomie Goreng, Aqua, Kopi Kapal Api, Beras, dll.).
* **Tahap 2 — Auth & Shell Layout:** Login sederhana dengan Role (pemilik vs kasir). Sticky Sidebar untuk desktop, dan Collapsible Drawer/Sheet untuk mobile.
* **Tahap 3 — Modul Inventaris (`/inventaris`):** Dikerjakan sebelum POS karena POS membutuhkan katalog produk dan stok yang siap dijual. Fitur CRUD Produk, Kategori, Supplier, dan modal Stock Opname.
* **Tahap 4 — Modul POS (`/pos`) & Scanner Realtime (`/scan`):** Split-screen layout POS, pencarian cepat, keranjang Zustand, tombol uang pas, dan modal sukses bayar. Rute pemindai HP (`/scan`) dengan `html5-qrcode`, beep Web Audio API, dan pengiriman SKU realtime ke POS desktop.
* **Tahap 5 — Cetak Struk, Integrasi WhatsApp, & Riwayat (`/riwayat`):** CSS thermal print 58mm/80mm, direct link `wa.me`, dan tabel riwayat transaksi (bisa cetak ulang).
* **Tahap 6 — Dashboard Ringkasan & Laporan (`/dashboard` & `/laporan`):** Kartu KPI penjualan hari ini, peringatan stok menipis, dan grafik penjualan terbaik.
* **Tahap 7 — Testing & Polishing:** Uji coba responsivitas HP (360px–430px) dan desktop (1440x900px), penanganan error jaringan.
