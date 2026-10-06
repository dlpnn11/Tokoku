# 📘 PLAYBOOK: MEMBANGUN APLIKASI DARI NOL BERSAMA AI AGENT

> Disusun dari seluruh perjalanan membangun **TokoKu** (POS & Inventaris Warung Kelontong) — mulai dari prompt pertama ("aku ingin brainstorm dulu sebelum mengerjakan") sampai deploy, struk PNG, dan perbaikan grafik.
>
> Tujuan folder ini: supaya proyek berikutnya bisa dibangun **lebih cepat, lebih rapi, dan lebih sedikit bug**, dengan cara kerja yang sudah terbukti berhasil — plus pelajaran dari hal-hal yang ternyata salah.

---

## 🗂️ Isi Folder Playbook

| No | File | Isi | Kapan Dibaca |
|----|------|-----|--------------|
| 00 | `00_BACA_DULU.md` (file ini) | Peta isi + ringkasan 1 halaman (cheat sheet) | Paling awal, dan setiap mulai proyek baru |
| 01 | [`01_PLAYBOOK_MEMBANGUN_APLIKASI_DENGAN_AI.md`](./01_PLAYBOOK_MEMBANGUN_APLIKASI_DENGAN_AI.md) | Panduan lengkap fase demi fase (Fase 0 – 17), lengkap dengan alasan, checklist, dan contoh nyata dari TokoKu | Saat merencanakan & menjalankan proyek |
| 02 | [`02_TEMPLATE_PROMPT_DAN_FILE.md`](./02_TEMPLATE_PROMPT_DAN_FILE.md) | Kumpulan prompt siap copy-paste + template file (`AGENTS.md`, `MASTER_PROJECT_CONTEXT.md`, `WORKFLOW.md`, dll.) | Saat benar-benar mengetik prompt ke AI |
| 03 | [`03_PELAJARAN_DARI_TOKOKU.md`](./03_PELAJARAN_DARI_TOKOKU.md) | Daftar bug/masalah nyata yang terjadi, penyebabnya, solusinya, dan aturan pencegahannya + retrospektif jujur | Sebelum memulai tahap coding & sebelum deploy |
| 04 | [`04_PANDUAN_STEP_BY_STEP_PROYEK_BARU.md`](./04_PANDUAN_STEP_BY_STEP_PROYEK_BARU.md) | Panduan teknis langkah demi langkah memulai proyek baru dari menit ke-0 (apa yang disalin, apa yang dihapus, alur chat) | Saat membuka folder proyek baru pertama kali |

**Urutan baca yang disarankan:** 00 → 04 (agar tahu cara mulainya) → 01 (sekali baca penuh) → 03 (sebelum koding) → 02 (senjata copy-paste sambil jalan).

---

## ⚡ CHEAT SHEET 1 HALAMAN

Kalau kamu cuma punya waktu 3 menit, ini intinya.

### A. Urutan Besar (Jangan Dibalik)

```
 1. Tulis ide mentah            → MASTER_PROJECT_CONTEXT.md
 2. Brainstorm & di-interview AI → AI bertanya 30–50 pertanyaan + rekomendasi jawaban
 3. Putuskan tech stack          → dengan alasan tertulis, bukan ikut-ikutan
 4. Kumpulkan referensi desain   → gambar + design system (warna, font, komponen)
 5. Rancangan arsitektur         → database, alur data, peran user, struktur folder
 6. Workflow / Roadmap tahapan   → vertical slice per modul (Tahap 0 … N)
 7. Breakdown tugas kecil        → tiap tugas punya kriteria "selesai" + cara mengujinya
 8. Aturan operasional AI        → .agents/AGENTS.md (konteks, aturan, commit policy)
 9. Setup Git + GitHub + .env    → .gitignore DULU sebelum commit pertama
10. Eksekusi per tahap           → AI: rencana → tanya → koding → verifikasi → commit
11. Kamu menguji & memberi feedback bernomor (screenshot + info layar)
12. Data dummy realistis + pengujian menyeluruh
13. Auth & security review       → SEBELUM deploy, bukan sesudah
14. Deploy (Vercel) + uji di HP asli
15. Rapikan repo, README, dokumentasi, playbook untuk proyek berikutnya
```

### B. 12 Aturan Emas

1. **Brainstorm dulu, eksekusi belakangan.** Jangan biarkan AI langsung ngoding di prompt pertama. Tulis eksplisit: *"Jangan kerjakan apa pun sampai aku bilang mulai."*
2. **Suruh AI bertanya sebanyak-banyaknya, dengan rekomendasi jawaban.** Ini yang paling banyak menyelamatkan TokoKu dari salah arah (contoh: fitur diskon ternyata dihapus, QRIS cukup kertas statis, pajak 0%).
3. **Semua keputusan ditulis ke file `.md`.** Chat itu sementara; file itu permanen. AI di chat baru tidak ingat apa pun kecuali yang tertulis.
4. **Satu file aturan untuk AI (`.agents/AGENTS.md`) sebagai sumber kebenaran tunggal.** Jangan punya 3 salinan aturan yang isinya lama-lama berbeda.
5. **Kerjakan per "irisan vertikal".** Satu modul tuntas dari database → logika → tampilan → uji, baru pindah modul.
6. **Setiap tugas punya definisi selesai yang bisa diuji.** "Halaman inventaris jadi" itu bukan definisi; "bisa tambah produk, muncul di tabel, stok tersimpan di Supabase, build lolos" itu definisi.
7. **`npm run build` lolos ≠ fitur benar.** Grafik laporan TokoKu lolos build tapi batangnya tidak terlihat sama sekali. Wajib cek visual di browser.
8. **Auto commit + push dengan Conventional Commits (bahasa Inggris)** setiap satu unit kerja selesai. Riwayat Git = mesin waktu kalau AI merusak sesuatu.
9. **Rahasia tidak boleh masuk Git.** `.env.local`, recovery code, service key → masuk `.gitignore` sebelum commit pertama.
10. **Feedback ke AI harus spesifik:** nomor poin, screenshot, apa yang diharapkan vs yang terjadi, dan info perangkat (contoh: *1920×1080, scaling Windows 150%, zoom browser 90%*).
11. **Aturan desain berlaku global.** Kalau kamu suka satu komponen (contoh: dropdown di halaman produk), minta AI menjadikannya komponen standar dan dicatat di design system — supaya tidak cuma diperbaiki di satu halaman.
12. **Security review sebelum deploy.** Login yang "kelihatan jalan" belum tentu aman (lihat file 03, bagian Auth).

### C. Kalimat Ajaib yang Terbukti Berguna

| Situasi | Kalimat |
|---------|---------|
| Awal proyek | *"Jangan mengerjakan dulu. Aku ingin brainstorm sebanyak mungkin sebelum mulai."* |
| Minta di-interview | *"Tanyakan aku sebanyak-banyaknya, 30 atau 50 pertanyaan juga boleh, dan beri rekomendasi jawaban di setiap pertanyaan."* |
| Mencegah AI berimprovisasi | *"Jangan membuat fitur yang tidak aku minta. Kalau ragu, tanya dulu."* |
| Tapi tetap boleh kritis | *"Desainku hanya gambaran besar. Kalau ada tombol/fitur yang kurang supaya UX masuk akal, usulkan."* |
| Menyimpan keputusan | *"Masukkan hasil diskusi ini ke file .md supaya kamu dan aku tidak lupa."* |
| Mulai tahap | *"Oke, lanjut Tahap N — [nama tahap]."* |
| Minta bukti | *"Tunjukkan bukti: output build, screenshot browser, atau hasil tes."* |
| Menunda bug | *"Catat bug ini di backlog, kita perbaiki setelah tahap ini selesai."* |
| Chat tidak tampil | *"Responmu tidak tertampil, tolong jawab ulang secara lengkap."* |

### D. Struktur Folder Dokumentasi yang Direkomendasikan

```text
project-root/
├── .agents/
│   ├── AGENTS.md            ← aturan operasional AI (SATU sumber kebenaran)
│   └── rules/               ← (opsional) aturan tambahan yang spesifik
├── docs/
│   ├── MASTER_PROJECT_CONTEXT.md   ← apa & kenapa aplikasinya dibuat
│   ├── WORKFLOW.md                 ← tahapan / roadmap
│   ├── RANCANGAN_ARSITEKTUR.md     ← database, alur, peran, struktur
│   ├── BREAKDOWN_TUGAS_DAN_TESTING.md ← checklist tugas + cara uji
│   ├── PANDUAN_DESIGN_SYSTEM.md    ← token warna, font, komponen
│   ├── BACKLOG.md                  ← bug & ide yang ditunda
│   ├── guides/                     ← panduan sementara (Git, Supabase, deploy)
│   └── playbook/                   ← (folder ini) pelajaran lintas proyek
├── Design Reference/        ← gambar mockup & prompt desain
├── README.md                ← wajah repo untuk orang lain
└── src/ …
```

---

> 💡 **Catatan penting:** Playbook ini ditulis setelah proyek selesai, jadi isinya sudah mencakup *apa yang seharusnya dilakukan dari awal* — termasuk hal-hal yang di TokoKu baru disadari belakangan (misalnya test otomatis, security review login, dan satu sumber aturan AI). Ikuti versi di playbook, bukan sekadar mengulang urutan kejadian di TokoKu.
