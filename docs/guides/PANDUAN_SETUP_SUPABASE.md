# ⚡ PANDUAN 2 MENIT SETUP SUPABASE CLOUD (GRATIS) — TOKOKU

Panduan praktis untuk menghubungkan database PostgreSQL & Realtime Supabase ke aplikasi **TokoKu**.

---

## 1. Buat Proyek Baru di Supabase (1 Menit)
1. Buka browser dan kunjungi: **[https://supabase.com](https://supabase.com)**
2. Klik tombol **"Sign in"** atau **"Start your project"** (Bisa langsung login menggunakan akun **GitHub** kamu).
3. Di dashboard Supabase, klik tombol hijau **"New Project"**.
4. Isi form pembuatan proyek:
   - **Organization:** Pilih organisasi default (akun kamu).
   - **Name:** Ketik `tokoku`
   - **Database Password:** Masukkan password aman (atau klik *Generate a password*, lalu catat/simpan passwordnya).
   - **Region:** Pilih **Singapore (ap-southeast-1)** *(Penting: Ini lokasi server terdekat ke Indonesia agar koneksi kasir super cepat tanpa delay).*
   - **Pricing Plan:** Pilih **Free Plan**.
5. Klik tombol **"Create new project"**. Tunggu sekitar 1–2 menit sampai database selesai dibuat (*Setting up project*).

---

## 2. Jalankan Script Database Schema & Seed Data (30 Detik)
1. Di menu bilah samping kiri Supabase, klik ikon **"SQL Editor"** (ikon gambar terminal `>_` atau kertas kode).
2. Klik tombol **"+ New query"**.
3. Buka file [supabase/schema.sql](file:///c:/Users/dalvi/OneDrive/Desktop/Tugas%20Kuliah/Semester%203/Sistem%20Informasi/Tugas/TokoKu/supabase/schema.sql) di VS Code / Antigravity ini:
   - Tekan `Ctrl + A` lalu `Ctrl + C` untuk menyalin seluruh isinya.
4. Kembali ke browser Supabase, paste teks tersebut ke dalam kolom SQL Editor.
5. Klik tombol hijau **"Run"** (atau tekan `Ctrl + Enter`).
6. Akan muncul pesan hijau: **"Success. No rows returned"**.
   *(Selamat! 6 tabel, relasi, fungsi transaksi kasir atomik RPC, dan 20+ produk warung asli kini sudah aktif di databasemu).*

---

## 3. Ambil URL & API Key Supabase (30 Detik)
1. Di bilah samping kiri Supabase, klik ikon roda gigi **"Project Settings"** (di paling bawah kiri).
2. Pilih menu **"Data API"** (atau **"API"** di bawah Configuration).
3. Salin 2 nilai berikut:
   - **Project URL:** Contoh `https://abcdefghijklm.supabase.co`
   - **Project API Keys (anon / public):** Contoh deretan teks panjang `eyJhbGci...`

---

## 4. Pasang ke File `.env.local` di Proyek TokoKu
Buat file bernama `.env.local` di folder utama `TokoKu` (sejajar dengan `package.json`), lalu isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

*(Ganti dengan URL dan Anon Key asli dari proyek Supabase kamu).*

---

> [!NOTE]
> File `.env.local` ini sudah dimasukkan ke `.gitignore`, jadi kuncimu **100% aman dan tidak akan pernah ter-upload ke publik di GitHub**!
