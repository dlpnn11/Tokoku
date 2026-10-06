# 🚀 04 — PANDUAN LANGKAH DEMI LANGKAH: MEMULAI PROYEK BARU DARI MENIT KE-0

> Panduan praktis khusus untuk **Dalvin** tentang cara menggunakan seluruh isi playbook ini saat membangun aplikasi baru dari nol.
> Menjelaskan secara gamblang: file apa yang harus disalin, file apa yang harus dihapus, perbedaan file di disk vs konteks chat, serta urutan prompt yang dikirim ke AI.

---

## DAFTAR ISI

1. [Konsep Krusial: "File di Disk" vs "Konteks Chat AI"](#1-konsep-krusial-file-di-disk-vs-konteks-chat-ai)
2. [Bedah Folder: Apa yang Disalin & Apa yang Dihapus?](#2-bedah-folder-apa-yang-disalin--apa-yang-dihapus)
   - [Apakah folder `.agents/rules/tokoku_rules.md` disalin atau dihapus?](#apakah-folder-agentsrulestokoku_rulesmd-disalin-atau-dihapus)
   - [Isi folder starter kit proyek baru](#isi-folder-starter-kit-proyek-baru)
3. [Alur Operasional: Langkah demi Langkah (Menit 0 s/d Selesai)](#3-alur-operasional-langkah-demi-langkah-menit-0-sd-selesai)
   - [Langkah 1: Setup Folder Proyek Baru di Komputer (Menit 0–5)](#langkah-1-setup-folder-proyek-baru-di-komputer-menit-05)
   - [Langkah 2: Menyesuaikan `.agents/AGENTS.md` untuk Proyek Baru (Menit 5–10)](#langkah-2-menyesuaikan-agentsagentsmd-untuk-proyek-baru-menit-510)
   - [Langkah 3: Buka Chat Baru & Mulai Interview (Menit 10–30)](#langkah-3-buka-chat-baru--mulai-interview-menit-1030)
   - [Langkah 4: Pembuatan Dokumen Blueprint oleh AI (Menit 30–45)](#langkah-4-pembuatan-dokumen-blueprint-oleh-ai-menit-3045)
   - [Langkah 5: Kunci Design System & Aturan Coding](#langkah-5-kunci-design-system--aturan-coding)
   - [Langkah 6: Eksekusi Coding Bertahap & Kapan Menyebutkan File 03](#langkah-6-eksekusi-coding-bertahap--kapan-menyebutkan-file-03)
   - [Langkah 7: Finalisasi, Sanitasi Repo, & Deploy](#langkah-7-finalisasi-sanitasi-repo--deploy)
4. [Matriks Panduan: File Mana yang Diberikan ke AI & Kapan?](#4-matriks-panduan-file-mana-yang-diberikan-ke-ai--kapan)
5. [Tanya Jawab Cepat (FAQ)](#5-tanya-jawab-cepat-faq)

---

## 1. KONSEP KRUSIAL: "FILE DI DISK" VS "KONTEKS CHAT AI"

Pertanyaan terpenting yang sering membingungkan:
> *"Kalau aku salin folder beserta seluruh file-nya ke proyek baru, apakah itu berarti semua isi file langsung masuk ke chat AI dan menghabiskan token?"*

### Jawabannya: **TIDAK SAMA SEKALI!**

Mari pahami cara kerja asisten AI (Antigravity / IDE agen modern):

1. **File di Disk (Penyimpanan Lokal Komputer):**
   - Menaruh 10 file atau 100 file markdown di folder proyekmu **TIDAK MENGHABISKAN TOKEN APAPUN**.
   - Komputer kamu hanya menyimpannya sebagai file teks biasa di harddisk.
2. **Konteks Chat AI (Token yang Dihitung):**
   - AI hanya menghitung token dari teks yang **kamu ketik di chat**, teks **respons AI**, dan file yang **AI baca lewat tool** (seperti `view_file` atau `@nama_file`).
   - Satu-satunya file yang otomatis dibaca AI di latar belakang saat sesi dimulai adalah file konfigurasi operasional di direktori `.agents/` (khususnya `.agents/AGENTS.md`).
3. **Kesimpulan:**
   - **TIDAK MASALAH** jika kamu menyalin folder `docs/playbook/` secara lengkap ke proyek baru. File-file tersebut hanya menjadi "buku perpustakaan" yang siap dibaca kapan pun dibutuhkan, tanpa membebani kuota chat kamu di awal!

---

## 2. BEDAH FOLDER: APA YANG DISALIN & APA YANG DIHAPUS?

### Apakah folder `.agents/rules/tokoku_rules.md` disalin atau dihapus?

👉 **HAPUS SAJA! JANGAN DISALIN KE PROYEK BARU.**

**Alasannya:**
- File `tokoku_rules.md` berisi detail yang sangat spesifik untuk TokoKu (nama warung, warna sage green khusus TokoKu, alur struk 58mm). Jika disalin ke proyek baru (misalnya kamu membuat aplikasi laundry, reservasi klinik, atau rental mobil), AI bisa bingung dan mengira proyek barumu masih berhubungan dengan TokoKu.
- Sesuai prinsip **Single Source of Truth (Satu Sumber Kebenaran)** di Fase 8 Playbook:
  - Cukup miliki **SATU** file aturan utama, yaitu: `.agents/AGENTS.md` (dan `.agents/GEMINI.md` jika memakai Gemini).
  - Folder `rules/` kosongkan atau hapus saja di proyek baru.

---

### Isi Folder Starter Kit Proyek Baru (Hari Pertama)

Ketika kamu membuat folder proyek baru di komputer (misal: `D:\ProyekKu\AplikasiBaru\`), struktur awal yang kamu siapkan adalah seperti ini:

```text
AplikasiBaru/
├── .agents/
│   ├── AGENTS.md                  ← [DISALIN DARI TEMPLATE A] Disesuaikan nama proyeknya
│   └── GEMINI.md                  ← [DISALIN] Mirror dari AGENTS.md
│   (❌ folder rules/ DIHAPUS)
│
├── docs/
│   └── playbook/                  ← [DISALIN UTUH] Berisi 00, 01, 02, 03, 04
│       ├── 00_BACA_DULU.md
│       ├── 01_PLAYBOOK_MEMBANGUN_APLIKASI_DENGAN_AI.md
│       ├── 02_TEMPLATE_PROMPT_DAN_FILE.md
│       ├── 03_PELAJARAN_DARI_TOKOKU.md
│       └── 04_PANDUAN_STEP_BY_STEP_PROYEK_BARU.md (file ini)
│
└── .gitignore                     ← [DISALIN DARI TEMPLATE H]
```

> ⚠️ **Perhatikan:** Folder `src/`, file `MASTER_PROJECT_CONTEXT.md`, `WORKFLOW.md`, dan `RANCANGAN_ARSITEKTUR.md` **BELUM ADA** di hari pertama. File-file tersebut nanti akan **dibuat oleh AI** saat proses brainstorming berjalan!

---

## 3. ALUR OPERASIONAL: LANGKAH DEMI LANGKAH (MENIT 0 S/D SELESAI)

Ikuti urutan waktu berikut agar proyek barumu berjalan mulus:

### Langkah 1: Setup Folder Proyek Baru di Komputer (Menit 0–5)
1. Buat folder baru untuk aplikasimu (misal: `mkdir TravelKu`).
2. Masuk ke folder tersebut dan inisialisasi Git:
   ```powershell
   git init
   git branch -M main
   ```
3. Buat folder `.agents/` dan `docs/playbook/`.
4. Salin seluruh isi folder `docs/playbook/` dari TokoKu ke `docs/playbook/` proyek barumu.
5. Buat file `.gitignore` di root proyek menggunakan **Template H** dari file `02_TEMPLATE_PROMPT_DAN_FILE.md`.

---

### Langkah 2: Menyesuaikan `.agents/AGENTS.md` untuk Proyek Baru (Menit 5–10)
1. Buat file `.agents/AGENTS.md` menggunakan **Template A** dari file `02_TEMPLATE_PROMPT_DAN_FILE.md`.
2. Buka file tersebut dan ganti 3 hal kecil:
   - Ganti `[NAMA_PROYEK]` menjadi nama aplikasi barumu (misal: `TravelKu`).
   - Pastikan nama pengguna tetap: `Dalvin`.
   - Pastikan greeting rule tetap: wajib menyapa dengan `"Dalvin,"`.
3. Buat salinannya sebagai `.agents/GEMINI.md`.

---

### Langkah 3: Buka Chat Baru & Mulai Interview (Menit 10–30)
1. Buka antarmuka chat AI (Antigravity).
2. Periksa sapaan pertama AI: Apakah AI menyapa dengan `"Dalvin,"`?
   - Jika YA: Selamat! AI sudah otomatis membaca `.agents/AGENTS.md`.
   - Jika BELUM: Sebutkan file-nya: *"Tolong baca .agents/AGENTS.md dulu ya."*
3. Buka file [`02_TEMPLATE_PROMPT_DAN_FILE.md`](file:///c:/Users/dalvi/OneDrive/Desktop/Tugas%20Kuliah/Semester%203/Sistem%20Informasi/Tugas/TokoKu/docs/playbook/02_TEMPLATE_PROMPT_DAN_FILE.md), cari **Prompt 1 (Brainstorming & Interview Awal)**, lalu salin dan kirim ke AI:

```markdown
Halo! Aku punya ide untuk membangun sebuah aplikasi baru bernama [NAMA_APLIKASI].
Aplikasi ini bertujuan untuk [JELASKAN_TUJUAN_SINGKAT].
Calon penggunanya adalah [JELASKAN_TARGET_PENGGUNA].

ATURAN UTAMA SEKARANG:
1. JANGAN MENULIS KODE ATAU MEMBUAT FILE IMPLEMENTASI APAPUN DULU.
2. Aku ingin kita melakukan sesi BRAINSTORMING dan INTERVIEW mendalam terlebih dahulu agar kamu benar-benar paham seluruh konteks, aturan bisnis, dan batasan teknis.
3. Silakan ajukan minimal 20 sampai 30 pertanyaan detail kepadaku.
4. WAJIB: Pada SETIAP nomor pertanyaan, kamu WAJIB menyertakan "Rekomendasi Jawaban" menurut best practice industri beserta alasannya.
5. Setelah aku menjawab semua pertanyaan, kamu akan merangkum seluruh keputusan ke dalam file `docs/MASTER_PROJECT_CONTEXT.md`.
```

4. Jawab pertanyaan AI satu per satu. Untuk hal teknis yang kamu serahkan ke AI, cukup jawab: *"Ikuti rekomendasimu."*

---

### Langkah 4: Pembuatan Dokumen Blueprint oleh AI (Menit 30–45)
Setelah sesi interview selesai:
1. Perintahkan AI membuat dokumen konteks:
   > *"Tolong rangkum semua jawaban kita ke file `docs/MASTER_PROJECT_CONTEXT.md` sesuai format standar."*
2. Kirim **Prompt 2 (Evaluasi Tech Stack)** dari File 02. AI akan menganalisis teknologi terbaik dan membuat `docs/RANCANGAN_ARSITEKTUR.md`.
3. Kirim **Prompt 5 (Pembuatan Roadmap)** dari File 02. AI akan membuat `docs/WORKFLOW.md`.
4. Kirim **Prompt 6 (Breakdown Tugas Kecil)** dari File 02. AI akan membuat `docs/BREAKDOWN_TUGAS_DAN_TESTING.md`.

---

### Langkah 5: Kunci Design System & Aturan Coding
1. Kirim **Prompt 3 (Perumusan Design System)** dari File 02.
2. Tegaskan kembali aturan: **Zero Gradients Rule**, font minimal 11px, palet warna solid terdefinisi, modal dengan `max-h-[85vh]` + scroll.
3. AI akan membuat file `docs/PANDUAN_DESIGN_SYSTEM.md`.

---

### Langkah 6: Eksekusi Coding Bertahap & Kapan Menyebutkan File 03
Ini titik di mana koding aplikasi baru dimulai!

1. Sebelum masuk ke kode React/Next.js/Database pertama, berikan instruksi pencegahan bug:
   > *"Sebelum kita mulai koding Tahap 0 dan Tahap 1, tolong baca `docs/playbook/03_PELAJARAN_DARI_TOKOKU.md` agar kamu memahami katalog bug nyata yang pernah terjadi di TokoKu (seperti React Hook #310, error build router/logout, layout modal terpotong pada laptop scaling 150%, dan container grafik tinggi 0px). Terapkan aturan pencegahannya sejak hari pertama!"*
2. Kerjakan fitur **per tahap vertikal (Vertical Slice)** sesuai `docs/WORKFLOW.md`.
3. Gunakan **Prompt 8 (Eksekusi Modul / Tahap Tertentu)** dari File 02.
4. Setiap satu sub-tugas selesai:
   - Pastikan AI menjalankan `npm run build` dan memeriksa visual.
   - AI otomatis melakukan auto-commit dan push (`git add .`, `git commit`, `git push`).
   - Checkbox di `docs/BREAKDOWN_TUGAS_DAN_TESTING.md` otomatis dicentang.
5. Jika kamu menemukan bug saat menguji di browser:
   - Gunakan **Prompt 9 (Pelaporan Bug Presisi)** dari File 02.

---

### Langkah 7: Finalisasi, Sanitasi Repo, & Deploy
1. Isi database dengan data dummy realistis (Gunakan **Prompt 11**).
2. Lakukan audit keamanan & RBAC (Gunakan **Prompt 12**).
3. Deploy ke Vercel dan uji di HP fisik (Ikuti panduan di Fase 15).
4. Rapikan repositori dan buat `README.md` memukau (Gunakan **Prompt 13**).

---

## 4. MATRIKS PANDUAN: FILE MANA YANG DIBERIKAN KE AI & KAPAN?

Gunakan tabel ini sebagai acuan praktis agar kamu tidak bingung kapan harus menyebut file apa di dalam chat:

| Nama File di Playbook | Kapan Kamu Menyebutkannya ke AI di Chat? | Cara Menyebutkannya di Chat |
|---|---|---|
| **`.agents/AGENTS.md`** | **Otomatis** (Tidak perlu disebut jika canary sapaan "Dalvin," muncul). | Jika AI lupa menyapa namamu: *"Baca .agents/AGENTS.md"* |
| **`docs/playbook/00_BACA_DULU.md`** | **Tidak perlu diberikan ke AI.** | File ini adalah panduan pribadi kamu untuk dibaca sendiri. |
| **`docs/playbook/01_PLAYBOOK...`** | Saat menyusun roadmap/arsitektur awal jika AI tampak ragu membagi tahap. | *"Rujuk format tahapan di docs/playbook/01_PLAYBOOK..."* |
| **`docs/playbook/02_TEMPLATE...`** | **Tidak perlu diberikan ke AI.** | Ini file contekanmu. Kamu cukup buka file ini di layar, copy prompt yang kamu perlukan, lalu paste ke chat. |
| **`docs/playbook/03_PELAJARAN...`** | **Wajib disebut tepat sebelum coding dimulai** (di awal Tahap 0 atau Tahap 1). | *"Sebelum koding, baca docs/playbook/03_PELAJARAN_DARI_TOKOKU.md agar tidak mengulangi bug hook dan layout."* |
| **`docs/playbook/04_PANDUAN...`** | **Tidak perlu diberikan ke AI.** | Ini adalah manual book kamu yang sedang kamu baca sekarang. |

---

## 5. TANYA JAWAB CEPAT (FAQ)

### Q1: Apakah saya harus membuat semua dokumen `docs/` sendiri sebelum chat dengan AI?
**Tidak!** Kamu tidak perlu menulis dokumen arsitektur atau breakdown sendiri. Biarkan AI yang mengetik dan menyusun file-file tersebut berdasarkan jawaban wawancara kamu. Tugas kamu hanya menjawab pertanyaan interview dan mengecek hasilnya.

### Q2: Bagaimana jika di tengah jalan kuota chat AI saya habis atau chat terputus?
Buka chat room baru, lalu kirim **Prompt 14 (Handover Sesi Chat Baru)** dari file 02:
> *"Halo! Kita melanjutkan proyek [Nama Proyek]. Ini sesi chat baru. Tolong baca `.agents/AGENTS.md`, `docs/MASTER_PROJECT_CONTEXT.md`, dan `docs/BREAKDOWN_TUGAS_DAN_TESTING.md`. Terakhir kita sudah menyelesaikan sub-tugas X, sekarang kita lanjutkan sub-tugas Y!"*
AI akan langsung menyambung tanpa hilang ingatan!

### Q3: Kenapa kita tidak memakai Tailwind gradient atau warna warni bebas?
Aplikasi bisnis/operasional yang memiliki gradien warna-warni biasanya terlihat amatir dan cepat membuat mata kasir/staf lelah. Warna solid (flat design) dengan token terpusat membuat aplikasi terlihat bersih, elegan, cepat dimuat, dan berstandar SaaS enterprise.

### Q4: Apakah cara kerja ini bisa dipakai untuk framework selain Next.js?
**100% Bisa!** Metodologi ini bersifat universal. Baik kamu membangun aplikasi web dengan React + Vite, mobile app dengan React Native / Flutter, backend dengan Golang / Express, atau Python FastAPI — alur interview → master context → arsitektur → breakdown checklist → auto commit → verifikasi visual tetap sama persis!
