# 🧭 01 — PLAYBOOK LENGKAP: MEMBANGUN APLIKASI DENGAN AI AGENT (FASE 0 – 17)

> Setiap fase berisi: **Tujuan → Kenapa penting → Langkah → Output (file yang harus ada) → Checklist → Contoh nyata dari TokoKu → Jebakan yang perlu dihindari.**
>
> Prompt siap pakai untuk tiap fase ada di [`02_TEMPLATE_PROMPT_DAN_FILE.md`](./02_TEMPLATE_PROMPT_DAN_FILE.md).

---

## Daftar Isi

- [Fase 0 — Mindset & Pembagian Peran](#fase-0--mindset--pembagian-peran)
- [Fase 1 — Ide Mentah → Master Project Context](#fase-1--ide-mentah--master-project-context)
- [Fase 2 — Brainstorm & Interview oleh AI](#fase-2--brainstorm--interview-oleh-ai)
- [Fase 3 — Memilih Tech Stack dengan Alasan](#fase-3--memilih-tech-stack-dengan-alasan)
- [Fase 4 — Referensi Desain & Design System](#fase-4--referensi-desain--design-system)
- [Fase 5 — Rancangan Arsitektur](#fase-5--rancangan-arsitektur)
- [Fase 6 — Workflow / Roadmap Tahapan](#fase-6--workflow--roadmap-tahapan)
- [Fase 7 — Breakdown Tugas Kecil + Kriteria Uji](#fase-7--breakdown-tugas-kecil--kriteria-uji)
- [Fase 8 — Aturan Operasional AI (AGENTS.md)](#fase-8--aturan-operasional-ai-agentsmd)
- [Fase 9 — Setup Git, GitHub & Kebijakan Commit](#fase-9--setup-git-github--kebijakan-commit)
- [Fase 10 — Setup Environment & Backend](#fase-10--setup-environment--backend)
- [Fase 11 — Siklus Eksekusi per Tahap](#fase-11--siklus-eksekusi-per-tahap)
- [Fase 12 — Menguji & Memberi Feedback ke AI](#fase-12--menguji--memberi-feedback-ke-ai)
- [Fase 13 — Data Dummy Realistis & Pengujian Menyeluruh](#fase-13--data-dummy-realistis--pengujian-menyeluruh)
- [Fase 14 — Autentikasi & Security Review](#fase-14--autentikasi--security-review)
- [Fase 15 — Deploy & Uji di Perangkat Asli](#fase-15--deploy--uji-di-perangkat-asli)
- [Fase 16 — Kebersihan Repo & Dokumentasi Akhir](#fase-16--kebersihan-repo--dokumentasi-akhir)
- [Fase 17 — Perawatan, Sesi Chat Baru & Proyek Berikutnya](#fase-17--perawatan-sesi-chat-baru--proyek-berikutnya)
- [Lampiran A — Definition of Done (DoD) Universal](#lampiran-a--definition-of-done-dod-universal)
- [Lampiran B — Matriks Verifikasi](#lampiran-b--matriks-verifikasi)
- [Lampiran C — Standar Ukuran Font, Spasi & Responsif](#lampiran-c--standar-ukuran-font-spasi--responsif)

---

## Fase 0 — Mindset & Pembagian Peran

### Tujuan
Menyepakati siapa melakukan apa, supaya kamu tidak kelelahan dan AI tidak berjalan liar.

### Kenapa Penting
Membangun aplikasi "full AI" bukan berarti kamu pasif. Di TokoKu, kualitas terbaik muncul justru ketika kamu aktif: menjawab pertanyaan, mengoreksi jam yang berdetik tiap detik ("terlalu berat, per menit saja"), menolak dropdown yang kuno, dan meminta harga dibulatkan ke `.000`/`.500`. AI cepat menulis kode, tapi **kamu yang tahu dunia nyata penggunanya**.

### Pembagian Peran yang Ideal

| Peran | Kamu (Product Owner + Reviewer) | AI Agent (Engineer + Dokumentator) |
|-------|-------------------------------|-------------------------------------|
| Visi & prioritas | ✅ Menentukan | Memberi opsi + rekomendasi |
| Aturan bisnis | ✅ Menentukan (contoh: stok habis tidak bisa dijual) | Menerjemahkan ke kode & database |
| Desain | ✅ Memberi referensi & selera | Membuat design system, konsisten di semua halaman |
| Tech stack | Menyetujui | ✅ Mengusulkan dengan alasan |
| Koding | — | ✅ Menulis, menguji, memperbaiki |
| Verifikasi | ✅ Uji manual sebagai pengguna | ✅ Build, lint, test, cek browser |
| Dokumentasi | Membaca & mengoreksi | ✅ Menulis & memperbarui |
| Git | Setup awal akun | ✅ Commit & push otomatis |
| Keputusan berisiko (hapus data, deploy, keamanan) | ✅ Wajib menyetujui | Wajib bertanya dulu |

### Prinsip Mental
- **AI itu sangat percaya diri, bahkan ketika salah.** Kalimat seperti "100% tuntas" bukan bukti. Minta bukti.
- **Konteks AI hilang di setiap chat baru** (dan bahkan bisa terpotong di chat yang sangat panjang). Semua yang penting harus hidup di file.
- **Kamu boleh tidak paham kode, tapi harus paham perilaku aplikasi.** Uji seperti pemilik warung yang sibuk, bukan seperti programmer.

### Checklist
- [ ] Saya paham bahwa saya adalah penentu keputusan, AI adalah pelaksana + penasihat.
- [ ] Saya siap menjawab banyak pertanyaan di awal (ini investasi, bukan buang waktu).
- [ ] Saya siap menguji setiap tahap sendiri di browser.

---

## Fase 1 — Ide Mentah → Master Project Context

### Tujuan
Menuangkan ide ke satu dokumen pusat yang menjelaskan **apa, untuk siapa, kenapa, dan batasannya**.

### Kenapa Penting
Di TokoKu, prompt pertama dimulai dengan `@MASTER_PROJECT_CONTEXT.md` — artinya kamu sudah menyiapkan ide tertulis sebelum ngobrol dengan AI. Ini membuat diskusi langsung fokus, bukan menebak-nebak.

### Isi Minimum `MASTER_PROJECT_CONTEXT.md`
1. **Nama & satu kalimat deskripsi** — "TokoKu: sistem kasir & inventaris untuk warung kelontong."
2. **Masalah yang diselesaikan** — pencatatan manual, stok tidak terpantau, nota hilang.
3. **Pengguna & peran** — Pemilik (akses penuh), Kasir (transaksi & riwayat).
4. **Fitur utama (MoSCoW):**
   - *Must:* POS, inventaris, riwayat nota.
   - *Should:* scan barcode via HP, laporan, ekspor.
   - *Could:* struk digital via WhatsApp.
   - *Won't (untuk sekarang):* diskon, pajak, multi-cabang.
5. **Aturan bisnis penting** — barang tanpa barcode cukup dicari manual; pembulatan harga; stok tidak boleh minus.
6. **Batasan** — gratis (free tier), dikerjakan AI, perangkat yang dipakai (laptop kasir + HP).
7. **Referensi desain** — lokasi folder gambar.
8. **Ukuran sukses** — contoh: transaksi selesai < 10 detik, tidak ada stok minus.

### Checklist
- [ ] Ada daftar fitur yang jelas dibagi Must/Should/Could/Won't.
- [ ] Ada daftar peran pengguna dan hak aksesnya.
- [ ] Ada aturan bisnis yang tidak boleh dilanggar.
- [ ] Ada bagian "Won't" — ini mencegah AI menambah fitur sendiri.

### Jebakan
- ❌ Menulis ide terlalu umum ("aplikasi kasir modern"). AI akan mengisi kekosongan dengan asumsinya sendiri.
- ❌ Tidak menulis yang *tidak* diinginkan. Di TokoKu, fitur diskon sempat masuk desain lalu harus dihapus.

---

## Fase 2 — Brainstorm & Interview oleh AI

### Tujuan
Membuat AI memahami konteks **sedalam mungkin** sebelum satu baris kode ditulis.

### Kenapa Penting
Ini fase dengan ROI (hasil vs usaha) tertinggi di seluruh proyek. Setiap jawaban di sini menghemat berjam-jam revisi nanti. Di TokoKu kamu menulis: *"aku ingin kamu benar-benar menanyakan aku sebanyak-banyaknya… 30 pertanyaan juga silakan, 50 pertanyaan juga ayo, nanti kasih rekomendasi jawabannya juga."* — dan hasilnya terlihat jelas.

### Langkah
1. Beri AI file Master Context + folder desain.
2. Tegaskan: **jangan mengerjakan apa pun dulu.**
3. Minta AI mengevaluasi ide & tech stack dengan alasan.
4. Minta AI bertanya dalam bentuk daftar bernomor, **setiap pertanyaan disertai rekomendasi jawaban**.
5. Jawab dengan nomor yang sama. Boleh menjawab "ikuti rekomendasimu" untuk yang kamu tidak paham.
6. Ulangi putaran tanya-jawab sampai AI tidak punya pertanyaan penting lagi (biasanya 2–4 putaran).
7. Minta AI **merangkum semua keputusan ke file** (Master Context / Arsitektur).

### Contoh Keputusan Nyata dari Interview TokoKu

| Pertanyaan AI | Jawaban Dalvin | Dampak ke Sistem |
|---------------|----------------|------------------|
| Barang tanpa barcode bagaimana? | Cukup dicari manual di kasir, jangan dibuat ribet | Tidak perlu generator barcode untuk semua barang; fokus ke pencarian cepat |
| Ada fitur diskon? | Belum, hapus dulu | Kolom & UI diskon dihapus → scope lebih kecil |
| Tombol nominal uang? | Jalan pintas, tapi input tetap bisa diketik manual | Quick cash buttons + input manual |
| QRIS bagaimana? | Kertas QRIS tercetak, tombol bayar = konfirmasi | Tidak perlu integrasi payment gateway |
| Tombol bayar saat uang kurang? | Wajib nonaktif | Validasi `isPaymentValid` |
| Barcode rusak? | Kasir cari manual | Tidak perlu fitur khusus |
| Suara beep? | Web Audio API (tanpa file MP3) | Ringan, tanpa aset |
| Foto produk? | Opsional, fallback ikon kategori | Tidak perlu storage gambar wajib |
| Satuan? | Dropdown: pcs, botol, bungkus, renteng, kg, liter, dus, kaleng… | Enum satuan |
| Barang datang (kulakan)? | Input jumlah akhir, tampil selisih `+4` | Desain Stock Opname dengan indikator selisih & tombol +1/+5 |
| Pembatalan transaksi? | Hanya Pemilik, stok otomatis kembali | RPC pembatalan + RBAC |
| Pajak? | 0% | Tidak ada perhitungan pajak |
| Lebar struk? | 58mm (tetap rapi di 80mm) | CSS print 58mm |
| Stok habis? | Kartu tidak bisa diklik, scan HP muncul peringatan | Proteksi stok minus di UI + database |
| Kategori awal? | Minuman, Mie Instan, Snack, Sembako & Bumbu, Rumah Tangga, ATK & Rokok | Seed kategori |

### Checklist
- [ ] AI sudah bertanya minimal satu putaran besar (≥ 15 pertanyaan).
- [ ] Setiap pertanyaan punya rekomendasi jawaban.
- [ ] Semua jawaban sudah dirangkum ke file, bukan hanya di chat.
- [ ] Ada daftar "fitur yang dihapus/ditunda" yang tertulis.

### Jebakan
- ❌ Langsung bilang "kerjakan saja" karena tidak sabar.
- ❌ Menjawab di chat tapi tidak meminta AI menyimpan ke file → hilang di chat berikutnya.
- ❌ Menerima semua rekomendasi AI tanpa membaca. Rekomendasi itu titik awal, bukan keputusan.

---

## Fase 3 — Memilih Tech Stack dengan Alasan

### Tujuan
Memilih teknologi yang **cocok untuk masalahnya** dan **dikuasai baik oleh AI**, bukan yang sedang tren.

### Kriteria Penilaian

| Kriteria | Pertanyaan | Kenapa Penting untuk Proyek AI |
|----------|-----------|-------------------------------|
| Kecocokan masalah | Apakah butuh realtime? transaksi atomik? offline? | Menentukan database & arsitektur |
| Popularitas | Apakah banyak contoh & dokumentasi? | AI lebih akurat di teknologi populer |
| Biaya | Ada free tier yang cukup? | Proyek kuliah/UMKM |
| Kemudahan deploy | Bisa 1-klik ke Vercel/Netlify? | Mengurangi pekerjaan DevOps |
| Type safety | TypeScript? | Error tertangkap saat build, bukan saat dipakai |
| Stabilitas versi | Apakah versi terbaru punya breaking changes? | AI sering menulis kode untuk versi lama |
| Ekosistem UI | Ada library komponen siap pakai? | Mempercepat UI konsisten |

### Stack TokoKu & Alasannya

| Lapisan | Pilihan | Alasan |
|---------|---------|--------|
| Framework | **Next.js (App Router) + TypeScript** | Satu proyek untuk halaman & logika; deploy mudah ke Vercel; TypeScript menangkap error lebih awal |
| Styling | **Tailwind CSS (v4, token via `@theme`)** | Cepat, konsisten, token warna terpusat |
| Komponen | **Shadcn-style UI** (komponen di dalam repo) | Bisa dimodifikasi bebas, bukan library tertutup |
| State | **Zustand** (+ `persist`) | Ringan untuk keranjang kasir & sesi |
| Database | **Supabase (PostgreSQL)** | SQL sungguhan, gratis, ada dashboard |
| Transaksi atomik | **PostgreSQL RPC (stored function)** | Checkout + potong stok dalam satu transaksi → tidak ada stok minus walau dua kasir bersamaan |
| Realtime | **Supabase Realtime Channels** | Scanner HP mengirim barcode ke laptop kasir secara langsung (QR pairing) |
| Ekspor gambar | **html-to-image** | Struk digital PNG ala bank |
| Hosting | **Vercel** | Gratis, auto-deploy setiap `git push` |

### Langkah
1. Minta AI menilai stack yang kamu usulkan + memberi alternatif dengan tabel pro/kontra.
2. Putuskan, lalu tulis keputusannya + alasannya di dokumen arsitektur.
3. Minta AI **langsung menginstal** dependency lewat CLI (kamu sempat meminta ini, dan itu tepat).
4. Catat versi penting (contoh: Next.js 16.x) — **versi baru sering berbeda dari yang diingat AI.**

### Jebakan
- ❌ "Pakai yang paling canggih walau tidak beginner friendly karena AI yang mengerjakan." Sebagian benar — tapi saat ada bug aneh, kamu tetap perlu membaca pesan error. Pilih yang canggih **dan** populer.
- ❌ Tidak menulis versi. Di TokoKu, `AGENTS.md` memuat catatan bahwa Next.js versi ini punya perubahan besar dan AI harus membaca dokumentasi di `node_modules/next/dist/docs/` — ini kebiasaan bagus untuk semua framework yang cepat berubah.
- ❌ Ide "pakai alat X agar AI selalu tahu konteks" (contoh: plugin graph/Obsidian) tanpa memastikan alat itu benar-benar dibaca oleh agent yang kamu pakai. Yang **pasti** dibaca adalah file aturan di lokasi resmi (`.agents/`, `AGENTS.md`) dan file yang ditautkan dari sana.

---

## Fase 4 — Referensi Desain & Design System

### Tujuan
Membuat semua halaman terlihat seperti satu aplikasi yang sama, dan memberi AI "kamus visual" yang tidak bisa disalahartikan.

### Kenapa Penting
Banyak feedback di TokoKu adalah soal desain: kartu yang teksnya mepet ke atas, dropdown kuno tanpa radius, teks "2 produk" terlalu kecil, ikon kartu yang tidak sejajar dengan judul, dropdown bagus di satu halaman tapi tidak dipakai di halaman lain. Hampir semua itu bisa dicegah dengan design system yang lengkap **sebelum** koding.

### Isi `PANDUAN_DESIGN_SYSTEM.md` yang Lengkap
1. **Filosofi desain** — contoh TokoKu: flat, bersih, tanpa gradien sama sekali.
2. **Token warna** (nama + hex + kegunaan):
   - Primary Sage Green `#6FA084` (aksi utama, hover teks dropdown)
   - Background Cream `#F4F4F0`
   - Surface `#FFFFFF`
   - Sidebar Charcoal `#2C2C2C`
   - Teks utama `#1A1A1A`, teks sekunder `#6B7280`, border `#E5E5E0`, danger `#D64545`, warning `#E8A838`
3. **Tipografi** — font (Inter), skala ukuran per peran (lihat Lampiran C).
4. **Spasi & radius** — kelipatan 4px, radius kartu `rounded-2xl`, tombol `rounded-xl`.
5. **Komponen standar** — Button (primary/outline/ghost/danger), Input, **Select/Dropdown standar**, Modal, Card KPI, Tabel, Badge status, Toast, Empty state.
6. **State setiap komponen** — default, hover, focus, disabled, loading, error, empty.
7. **Pola layout** — sidebar, header 64px, grid kartu, tabel dengan kolom aksi (lihat/edit/hapus).
8. **Aturan responsif** — breakpoint, perilaku tabel di layar kecil, tinggi modal maksimum.
9. **Larangan** — contoh: *ZERO GRADIENTS*, jangan pakai warna hex langsung kalau sudah ada token.

### Langkah
1. Kumpulkan referensi gambar (mockup buatan sendiri, Stitch AI, Dribbble) di folder `Design Reference/`.
2. Tanyakan AI: *"Apakah kamu bisa melihat gambar-gambar ini?"* — pastikan benar terbaca.
3. Minta AI membuat design system **lengkap** (kamu memintanya di TokoKu: "aku benar-benar ingin selengkap itu").
4. Daftarkan token di konfigurasi Tailwind/CSS dan **wajibkan pemakaian token** di kode.
5. Tegaskan: *"Desainku gambaran besar. Kalau ada fitur/tombol yang kurang agar UX masuk akal, tambahkan dan beri tahu aku."*

### Jebakan
- ❌ Token didefinisikan tapi kode tetap memakai `text-[#6B7280]`. Akibatnya muncul ratusan peringatan kuning "can be written as `text-tokoku-text-secondary`" di editor. Lebih baik pakai token dari awal daripada mematikan peringatannya.
- ❌ Memperbaiki komponen di satu halaman saja. Minta selalu: *"Terapkan ke semua halaman dan catat di design system."*
- ❌ Lupa menguji di skala tampilan Windows 125–150%. Modal TokoKu terpotong di laptop 1920×1080 scaling 150%.

---

## Fase 5 — Rancangan Arsitektur

### Tujuan
Menulis "cetak biru" teknis: data apa yang disimpan, bagaimana alirannya, siapa boleh apa.

### Isi `RANCANGAN_ARSITEKTUR.md`
1. **Diagram entitas (ERD)** — contoh TokoKu: `users`, `categories`, `suppliers`, `products`, `transactions`, `transaction_details`, (riwayat stok).
2. **Relasi** — produk ↔ kategori, produk ↔ supplier. *(Pelajaran: relasi supplier–produk awalnya tidak bisa diisi dari form supplier — pikirkan relasi dari sisi UX: "bagaimana pemilik tahu supplier ini memasok apa?")*
3. **Fungsi database / RPC** — kontrak input-output, contoh `checkout` atomik & `cancel_transaction` yang mengembalikan stok.
4. **Aturan keamanan (RLS)** — siapa boleh baca/tulis tabel apa.
5. **Peran & hak akses (RBAC)** — tabel halaman × peran.
6. **Alur utama (sequence)** — checkout, scan HP → laptop, pembatalan.
7. **Struktur folder kode** — `app/`, `components/`, `services/`, `stores/`, `lib/`, `types/`.
8. **Aturan bisnis terpusat** — contoh fungsi `roundPrice500()` dipakai di semua tempat, bukan dihitung ulang di tiap halaman.
9. **Keputusan & alasannya (ADR singkat)** — kenapa RPC, kenapa Realtime, dsb.

### Contoh Alur yang Patut Ditiru (Scanner HP TokoKu)
```mermaid
sequenceDiagram
    participant L as Laptop Kasir (/pos)
    participant S as Supabase Realtime
    participant H as HP (/scan)
    L->>L: Tampilkan QR berisi URL /scan?room=...
    H->>H: Buka URL, izinkan kamera
    H->>S: broadcast barcode ke room
    S->>L: event barcode
    L->>L: cari produk → masuk keranjang (atau peringatan stok habis)
```

### Checklist
- [ ] Setiap fitur Must punya tabel/kolom yang mendukungnya.
- [ ] Operasi yang mengubah banyak tabel sekaligus dibuat atomik (RPC/transaction).
- [ ] Ada tabel hak akses per peran.
- [ ] Aturan bisnis numerik (pembulatan, pajak, kembalian) punya satu fungsi pusat.

---

## Fase 6 — Workflow / Roadmap Tahapan

### Tujuan
Menentukan urutan pengerjaan yang meminimalkan bongkar-pasang.

### Backend Dulu atau Frontend Dulu?
**Jawaban terbaik: bukan keduanya — tapi *vertical slice*.** Kerjakan per modul dari database sampai tampilan, lalu uji. Dengan begitu setiap tahap menghasilkan sesuatu yang benar-benar bisa dipakai.

### Roadmap TokoKu (Bisa Dijadikan Pola)

| Tahap | Isi | Hasil yang Bisa Diuji |
|-------|-----|----------------------|
| 0 | Fondasi: init proyek, design token, komponen dasar, Git | Halaman kosong bergaya benar, build lolos |
| 1 | Database: schema, seed, RPC, koneksi `.env` | Data terbaca dari Supabase |
| 2 | Layout & peran: sidebar, header, RBAC | Navigasi jalan, kasir tidak bisa buka halaman pemilik |
| 3 | Inventaris: produk, kategori, supplier, stock opname | CRUD lengkap |
| 4 | POS kasir + scanner HP | Transaksi tersimpan, stok terpotong |
| 5 | Riwayat transaksi + pembatalan | Cari, filter, lihat detail, batal → stok kembali |
| 6 | Laporan + ekspor | Grafik, KPI, unduh file |
| 7 | Pengujian menyeluruh & polishing | Semua alur lolos, data dummy realistis |
| 8 *(seharusnya ada)* | Auth sungguhan & security review | Login aman, RLS ketat |
| 9 *(seharusnya ada)* | Deploy & uji perangkat | URL publik, HP bisa scan |

> 💡 Di TokoKu, login baru dibuat setelah Tahap 7 dan deploy dibahas belakangan. Untuk proyek berikutnya, **taruh auth di awal (setelah layout)** dan **security review sebelum deploy** sebagai tahap resmi.

### Checklist
- [ ] Setiap tahap menghasilkan fitur yang bisa diklik dan diuji.
- [ ] Ada tahap khusus untuk auth/keamanan dan deploy.
- [ ] Ada tahap pengujian menyeluruh di akhir.

---

## Fase 7 — Breakdown Tugas Kecil + Kriteria Uji

### Tujuan
Memecah tiap tahap menjadi tugas kecil yang masing-masing punya **cara membuktikan bahwa ia selesai**.

### Format Tugas yang Baik
```markdown
- [ ] **4.3 Validasi Pembayaran Tunai**
  - Deskripsi: Tombol Bayar nonaktif jika uang diterima < total.
  - Kriteria selesai:
    1. Total 38.500, uang 20.000 → tombol abu-abu, teks "Kurang Rp 18.500".
    2. Klik "Uang Pas" → tombol aktif, kembalian Rp 0.
    3. Input menampilkan pemisah ribuan (250.000).
  - Cara uji: manual di /pos + `npm run build` + (ideal) unit test fungsi hitung kembalian.
```

### Prinsip
- **Kecil** — selesai dalam satu sesi kerja AI.
- **Bisa diuji** — ada langkah konkret dan hasil yang diharapkan.
- **Berurutan** — tugas yang jadi fondasi dikerjakan dulu.
- **Dicentang** — AI wajib memperbarui checkbox setelah benar-benar terverifikasi.

### Tentang "Tes Dulu Baru Koding" (TDD)
Kamu meminta ini sejak awal — dan itu benar. Namun di TokoKu, verifikasi yang paling banyak dipakai adalah `npm run build` (cek tipe/kompilasi) dan satu skrip verifikasi data. **Itu belum TDD.** Untuk proyek berikutnya, minta di Tahap 0:
- **Vitest** untuk fungsi logika (hitung total, kembalian, pembulatan, validasi stok).
- **Playwright** untuk alur end-to-end (login → tambah ke keranjang → bayar → riwayat muncul).
- Perintah `npm test` wajib hijau sebelum commit.

---

## Fase 8 — Aturan Operasional AI (AGENTS.md)

### Tujuan
Satu file yang otomatis dibaca AI di setiap chat baru, berisi siapa kamu, aturan kerja, dan peta dokumen.

### Kenapa Penting
Kamu bertanya: *"Kalau aku mulai chat di room baru, apakah harus mention file tertentu?"* Jawabannya: tidak, **asalkan** aturan ada di lokasi yang otomatis dibaca agent (untuk Antigravity: folder `.agents/` di root proyek, atau `AGENTS.md`/`GEMINI.md`). Dari sana, AI mengikuti tautan ke dokumen lain.

### Isi Wajib `.agents/AGENTS.md`
1. **Identitas pengguna & sapaan** — "Mulai setiap respons dengan `Dalvin,`".
   - 🎯 *Trik cerdas:* sapaan ini berfungsi sebagai **"canary"** (indikator). Kalau AI di chat baru tidak menyapa namamu, berarti file aturan **tidak terbaca** — segera mention file-nya secara manual.
2. **Peta dokumentasi** — tautan ke Master Context, Workflow, Arsitektur, Breakdown, Design System, Guides.
3. **Kebijakan commit & push otomatis** — format Conventional Commits berbahasa Inggris.
4. **Batasan desain & arsitektur** — contoh: zero gradients, stack yang dipakai.
5. **Aturan klarifikasi** — "Selalu tanya jika ragu, sebanyak apa pun, dengan rekomendasi jawaban. Jangan membuat fitur yang tidak diminta."
6. **Aturan verifikasi** — build + lint + test + cek browser sebelum menyatakan selesai.
7. **Catatan versi framework** — contoh catatan Next.js di TokoKu.

### Satu Sumber Kebenaran
Di TokoKu sempat ada `AGENTS.md`, `GEMINI.md`, dan `.agents/rules/TOKOKU_RULES.md` yang isinya hampir sama. Salinan seperti ini **pasti lama-lama berbeda** (dan memang sudah terjadi: salah satunya masih berisi tautan lama). Rekomendasi:
- Simpan aturan lengkap **hanya** di `.agents/AGENTS.md`.
- Jika butuh `GEMINI.md`, isinya cukup satu baris: "Lihat `.agents/AGENTS.md`."

### Checklist
- [ ] File aturan ada di lokasi resmi yang dibaca agent.
- [ ] Tautan dokumen relatif dan valid setelah file dipindah.
- [ ] Tidak ada salinan aturan ganda.
- [ ] Uji di chat baru: apakah AI menyapa dengan namamu?

---

## Fase 9 — Setup Git, GitHub & Kebijakan Commit

### Langkah Awal (Sekali Saja)
```powershell
git config --global user.name "NamaKamu"
git config --global user.email "email@kamu.com"
git init
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
```

### Sebelum Commit Pertama — WAJIB
Buat `.gitignore` berisi minimal:
```gitignore
node_modules/
.next/
.env
.env*.local
*.pem
recovery-codes.txt
.vercel
```
> Di TokoKu, file `recovery-codes.txt` sempat berada di root proyek tanpa di-ignore. Untung tertangkap sebelum ter-commit. **Kode pemulihan akun tidak boleh pernah ada di folder proyek** — simpan di password manager.

### Masalah Login Saat Push
Pesan `remote: Invalid username or token` muncul karena GitHub **tidak lagi menerima password akun** untuk push lewat HTTPS. Solusi:
- Login lewat **Git Credential Manager** (jendela browser muncul otomatis di Windows), atau
- Pakai **Personal Access Token (PAT)** sebagai pengganti password, atau
- Install **GitHub CLI** lalu `gh auth login`.

### Kebijakan Commit Otomatis (Conventional Commits, Bahasa Inggris)
| Tipe | Kapan | Contoh |
|------|-------|--------|
| `feat(scope)` | Fitur baru | `feat(pos): add thousand separator to cash input` |
| `fix(scope)` | Perbaikan bug | `fix(history): resolve react hook ordering error #310` |
| `style(scope)` | Tampilan saja | `style(inventory): use canonical color tokens` |
| `refactor(scope)` | Rapikan kode tanpa ubah perilaku | `refactor(cart): extract payment validation` |
| `docs(scope)` | Dokumentasi | `docs(playbook): add AI app-building guide` |
| `test(scope)` | Tes | `test(pos): add checkout e2e test` |
| `chore(scope)` | Konfigurasi/dependency | `chore(deps): add html-to-image` |

### Rekomendasi Tambahan (Level Berikutnya)
- **Satu commit = satu perubahan logis.** Jangan menggabungkan "fitur login + struk PNG + fix modal" dalam satu commit — sulit di-revert kalau salah satunya bermasalah.
- **Tag milestone:** `git tag v0.4-pos-done` setelah tiap tahap besar → mudah kembali ke versi stabil.
- **Branch untuk eksperimen berisiko:** `git checkout -b feat/digital-receipt`, merge ke `main` setelah lolos uji.

---

## Fase 10 — Setup Environment & Backend

### Supabase (atau BaaS Sejenis)
1. Buat project gratis → simpan password database di password manager.
2. Ambil dari **Project Settings → API**:
   - **Project URL** → `https://<ref>.supabase.co` *(tanpa `/rest/v1/` — di TokoKu sempat salah di sini)*
   - **anon / publishable key** → aman dipakai di frontend **hanya jika RLS benar**.
   - **service_role key** → ❌ tidak pernah ditaruh di frontend, tidak pernah di-commit.
3. Isi `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```
4. Jalankan `schema.sql` di SQL Editor. Jika muncul peringatan "destructive operation", baca dulu — itu berarti skrip akan menghapus/menimpa tabel.

### Aturan Skrip SQL yang Baik
- **Idempotent:** bisa dijalankan ulang (`create table if not exists`, `on conflict do nothing`).
- **UUID valid:** hanya karakter hex `0-9a-f`. Di TokoKu, seed `s1111111-…` gagal karena `s` bukan hex.
- **Seed terpisah dari schema** agar data contoh tidak menimpa data asli.
- **RLS diaktifkan di semua tabel** dengan kebijakan eksplisit.

### Menjalankan Aplikasi Lokal
```powershell
npm install
npm run dev        # buka http://localhost:3000
npm run build      # cek kompilasi produksi
```

---

## Fase 11 — Siklus Eksekusi per Tahap

### Siklus Ideal (yang harus dilakukan AI setiap tahap)
```
1. BACA      → AGENTS.md + dokumen tahap terkait + kode yang akan disentuh
2. RENCANA   → daftar file yang akan dibuat/diubah + pendekatan
3. TANYA     → hal yang ambigu (dengan rekomendasi), tunggu jawaban
4. TES DULU  → tulis tes/kriteria uji untuk perilaku yang diharapkan
5. KODING    → implementasi kecil-kecil
6. VERIFIKASI→ typecheck/build + lint + test + cek visual di browser
7. DOKUMEN   → centang breakdown, perbarui arsitektur/design system jika berubah
8. COMMIT    → conventional commit + push
9. LAPOR     → ringkas: apa yang berubah, bukti verifikasi, apa yang belum/berisiko
```

### Peranmu di Setiap Tahap
1. Beri perintah: *"Lanjut Tahap N — [nama]."*
2. Jawab pertanyaan AI.
3. Jalankan `npm run dev`, uji sebagai pengguna.
4. Beri feedback bernomor (Fase 12).
5. Putuskan: perbaiki sekarang atau masuk backlog ("bug fix nanti saja, selesaikan tahap dulu" — keputusan yang sah, asal dicatat).

### Laporan AI yang Baik Harus Memuat
- Daftar file yang diubah (dengan tautan).
- Bukti: output build/test, screenshot.
- **Hal yang belum diverifikasi atau berisiko** — laporan yang semuanya "100% sempurna" patut dicurigai.

---

## Fase 12 — Menguji & Memberi Feedback ke AI

### Template Feedback yang Efektif
```markdown
1. [Halaman Inventaris > Kartu KPI] Teks terlalu mepet ke atas.
   Harapan: padding atas-bawah seimbang. Berlaku untuk SEMUA kartu KPI.
2. [Dropdown] Terlalu polos. Harapan: radius, hover teks hijau sage.
   Jadikan komponen standar & catat di design system.
3. [Modal Nota] Tombol X dan Selesai tidak terlihat.
   Perangkat: 1920×1080, scaling Windows 150%, zoom browser 90%.
   Screenshot: (lampirkan)
```

### Kebiasaan Baik yang Sudah Kamu Lakukan di TokoKu
- ✅ Memberi nomor pada setiap poin.
- ✅ Melampirkan screenshot.
- ✅ Menyebutkan spesifikasi layar & zoom.
- ✅ Meminta perbaikan berlaku global ("berlaku juga untuk lainnya", "selalu terapkan style dropdown itu ke depannya").
- ✅ Memberi contoh dunia nyata (struk bank Jago → resi PNG).
- ✅ Menolak solusi yang tidak praktis di lapangan (WhatsApp Web perlu scan QR → minta Share bawaan).

### Kebiasaan yang Bisa Ditambah
- Tulis **"Harapan"** secara eksplisit, bukan hanya masalahnya.
- Bedakan **bug** (salah) vs **selera** (kurang suka) vs **ide baru** (scope bertambah).
- Simpan ide baru ke `BACKLOG.md` dulu jika sedang di tengah tahap.

---

## Fase 13 — Data Dummy Realistis & Pengujian Menyeluruh

### Kenapa Penting
Aplikasi kosong menyembunyikan bug: grafik, paginasi, filter tanggal, performa — semuanya baru teruji dengan data banyak. Kamu meminta data yang "terlihat seperti sudah berjalan 1–2 tahun", dan itu tepat.

### Resep Data Dummy yang Baik
- **Skrip seed yang bisa diulang** (contoh TokoKu: `scripts/seed_rich_data.ts` → 427 transaksi Okt 2025–Okt 2026, 70 produk, 8 kategori, 7 supplier).
- **Distribusi realistis:** hari ramai/sepi, tren naik, produk laris vs jarang laku, beberapa transaksi dibatalkan, beberapa stok kritis.
- **Patuh aturan bisnis:** harga sudah dibulatkan, stok tidak minus.
- **Skrip verifikasi** setelah seed (contoh: `scripts/verify_all_modules.ts` → cek jumlah baris, distribusi tahun, pembulatan, peringatan stok).

### Pengujian Menyeluruh (Checklist Akhir)
- [ ] Setiap halaman dibuka sebagai **Pemilik** dan sebagai **Kasir**.
- [ ] Alur utama end-to-end: tambah produk → jual → riwayat → batal → stok kembali → laporan berubah.
- [ ] Layar: 1366×768, 1920×1080 @150%, tablet, HP.
- [ ] Data kosong (empty state) dan data banyak.
- [ ] Console browser bersih dari error merah.
- [ ] Ekspor/unduh file benar-benar dibuka dan dicek isinya (bukan hanya "terunduh").

---

## Fase 14 — Autentikasi & Security Review

### Prinsip
- **Tidak ada pendaftaran publik** jika pengguna hanya staf (keputusanmu di TokoKu sudah tepat).
- **Gunakan sistem auth sungguhan** (Supabase Auth / NextAuth), bukan membandingkan password di browser.
- **Password tidak pernah disimpan polos**; tidak pernah bisa dibaca lewat API publik.
- **Default = tidak login.** Pengunjung baru harus diarahkan ke `/login`.
- **Peran dicek di server/database (RLS)**, bukan hanya disembunyikan di UI.
- **Fitur "ganti peran cepat" untuk demo** harus dimatikan di produksi.

### Checklist Security Review Sebelum Deploy
- [ ] Buka aplikasi di jendela Incognito → apakah langsung diarahkan ke login?
- [ ] Bisakah tabel `users` dibaca dengan anon key? (Seharusnya tidak, terutama kolom password.)
- [ ] Bisakah kasir memanggil fungsi pembatalan lewat console browser? (Seharusnya ditolak database.)
- [ ] Apakah ada password/kredensial demo tertulis di kode frontend?
- [ ] Apakah RLS aktif di semua tabel?
- [ ] Apakah `.env`, key rahasia, recovery code tidak ada di Git history?

> ⚠️ Lihat file 03 bagian "Auth TokoKu" — login TokoKu saat ini masih level demo dan **belum layak dipakai publik** sebelum diperbaiki.

---

## Fase 15 — Deploy & Uji di Perangkat Asli

### Vercel (Cara Paling Mudah)
1. Login [vercel.com](https://vercel.com) dengan akun GitHub.
2. **Add New → Project → Import** repositori.
3. Isi **Environment Variables** (sama dengan `.env.local`).
4. Jika muncul tawaran integrasi Supabase: pilih **Link Existing Account** atau lewati. ❌ Jangan "Create New Supabase Account" — itu membuat database baru yang kosong.
5. **Deploy.** Setelahnya, setiap `git push` ke `main` otomatis memperbarui situs.

### Uji Setelah Deploy
- [ ] Buka di HP lewat URL HTTPS (kamera HP hanya bisa diakses di HTTPS atau localhost).
- [ ] Coba scanner HP → barcode masuk ke keranjang laptop.
- [ ] Coba tombol Share/WhatsApp di HP asli (perilaku Web Share berbeda di desktop vs HP).
- [ ] Coba cetak struk 58mm.

---

## Fase 16 — Kebersihan Repo & Dokumentasi Akhir

- **README.md** profesional: deskripsi, fitur, stack, cara menjalankan, struktur folder.
- **Root folder bersih:** dokumen ke `docs/`, aturan AI ke `.agents/`, panduan sementara ke `docs/guides/` (keputusanmu membuat folder "guide" sudah tepat).
- **Konfigurasi editor tim** di `.vscode/settings.json` jika perlu.
- **Hapus file sementara/eksperimen** dan skrip yang tidak dipakai.
- **Perbarui semua tautan** setelah memindahkan file (cari tautan rusak).
- **CHANGELOG** singkat per tahap (opsional tapi membantu laporan tugas).

---

## Fase 17 — Perawatan, Sesi Chat Baru & Proyek Berikutnya

### Saat Membuka Chat Baru
1. Pastikan AI menyapa sesuai aturan (canary).
2. Beri konteks singkat: *"Kita di Tahap X, terakhir mengerjakan Y, masalah yang tersisa Z."*
3. Minta AI membaca `BACKLOG.md` dan breakdown sebelum mulai.

### Saat Chat Sangat Panjang
Chat panjang bisa diringkas otomatis oleh sistem dan detail kecil bisa hilang. Di TokoKu sempat terjadi respons tidak tampil dan error yang lolos karena konteks terpotong. Solusi:
- Pecah pekerjaan besar ke beberapa chat per tahap.
- Di akhir tiap tahap, minta AI menulis **ringkasan serah-terima** ke `docs/`.

### Untuk Proyek Berikutnya
- Salin folder `docs/playbook/` dan template di file 02.
- Mulai dari Fase 1 dengan Master Context.
- Terapkan pelajaran di file 03 sejak Tahap 0 (test otomatis, auth di awal, satu sumber aturan).

---

## Lampiran A — Definition of Done (DoD) Universal

Sebuah tugas **baru boleh disebut selesai** jika semua ini benar:

- [ ] Perilaku sesuai kriteria di breakdown.
- [ ] `npm run build` lolos tanpa error.
- [ ] Lint tidak ada error baru.
- [ ] Tes terkait hijau (jika ada).
- [ ] Dicek visual di browser (minimal satu ukuran desktop + satu ukuran kecil).
- [ ] Tidak ada error merah di console browser.
- [ ] Mengikuti design system (token, komponen standar).
- [ ] Dokumen terkait diperbarui.
- [ ] Commit dengan pesan yang benar & ter-push.
- [ ] Laporan menyebut hal yang belum diverifikasi.

---

## Lampiran B — Matriks Verifikasi

| Jenis Masalah | Tertangkap oleh `build`? | Tertangkap oleh lint? | Tertangkap oleh test? | Tertangkap oleh cek visual? | Contoh di TokoKu |
|---------------|:---:|:---:|:---:|:---:|------|
| Variabel tidak didefinisikan | ✅ | ✅ | ✅ | — | `router` hilang di AppShell |
| Salah urutan React Hook | ❌ | ✅ (react-hooks) | ✅ | ✅ (crash) | Error #310 di modal riwayat |
| Hydration mismatch | ❌ | ❌ | sebagian | ✅ | Nomor invoice acak server vs client |
| Layout/CSS rusak | ❌ | ❌ | ❌ (kecuali visual test) | ✅ | Batang grafik tinggi 0px; modal terpotong |
| Gambar ekspor terpotong | ❌ | ❌ | ❌ | ✅ (buka file-nya) | Struk PNG terpotong kanan |
| Celah keamanan | ❌ | ❌ | ✅ (jika ditulis) | ❌ | Default sudah login |
| Aturan bisnis salah | ❌ | ❌ | ✅ | sebagian | Pembulatan harga |

**Kesimpulan:** build saja menangkap sebagian kecil masalah. Kombinasikan keempatnya.

---

## Lampiran C — Standar Ukuran Font, Spasi & Responsif

### Skala Tipografi (Aplikasi Kasir, Jarak Pandang 50–70 cm)
| Peran | Ukuran | Tailwind |
|-------|--------|----------|
| Angka total transaksi | 28–32px | `text-2xl`–`text-3xl font-extrabold` |
| Judul halaman | 18–20px | `text-lg`–`text-xl font-bold` |
| Judul kartu / modal | 16px | `text-base font-bold` |
| Isi tabel, nama produk | 14px | `text-sm` |
| Label form, keterangan | 12px | `text-xs` |
| Badge kecil | 11–12px | `text-[11px]`–`text-xs` |
| **Minimum mutlak** | **11px** | Jangan di bawah ini untuk info yang perlu dibaca (pelajaran "2 produk terlalu kecil") |

### Target Sentuh & Spasi
- Tombol yang sering diklik kasir: tinggi ≥ 40px (ideal 44–48px).
- Spasi dasar kelipatan 4px; jarak antar kartu 16–24px.

### Responsif & Skala Tampilan
- Uji di: **1366×768**, **1920×1080 @ scaling 125% dan 150%**, tablet 768px, HP 375–414px.
- Laptop 1920×1080 @150% setara ±1280×720 ruang efektif — sangat sempit secara vertikal.
- **Modal:** `max-h-[90vh]` + header & footer tetap + isi yang bisa di-scroll.
- **Tabel:** kolom panjang dipotong (`truncate`) + tombol aksi (lihat detail/edit) daripada memaksa semua teks tampil.
- **Grafik:** gunakan tinggi piksel/viewport yang pasti, bukan persentase di dalam flex tanpa tinggi.
