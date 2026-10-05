# 👑 ATURAN EMAS & PRINSIP PENGEMBANGAN APLIKASI DENGAN AI

Dokumen ini mencatat prinsip-prinsip penting, strategi arsitektur, dan cara kerja terbaik dalam kolaborasi antara Dalvin dan AI (Antigravity).

---

## 1. Prinsip "Single Vertical Slice" (Satu Irisan Vertikal Tuntas)
* **Aturan:** Jangan pernah membuat frontend secara keseluruhan tanpa backend, atau membuat seluruh database tanpa antarmuka yang terhubung.
* **Penerapan:** Kerjakan satu modul secara utuh dari hulu ke hilir:
  1. Skema Database / RPC -> 2. Fungsi Fetching / Server Action -> 3. Komponen Tampilan (List & Modal) -> 4. Pengujian Langsung.
* **Manfaat:** Memastikan setiap bagian langsung berfungsi nyata sebelum pindah ke modul lain.

---

## 2. Prinsip "Self-Verification Loop" (AI Memvalidasi Kodenya Sendiri)
* **Aturan:** Kode tidak dianggap selesai sebelum diverifikasi melalui alat uji nyata (`npm run build`, testing runner, atau validasi tipe TypeScript).
* **Penerapan:** Setiap kali fitur atau bug fix selesai ditulis, AI wajib menjalankan pengecekan build di latar belakang. Jika 0 error, barulah kode disimpan dan di-commit.
* **Manfaat:** Mencegah terjadinya error runtime atau penumpukan bug tersembunyi.

---

## 3. Prinsip "Endless Clarification & Zero Assumption"
* **Aturan:** AI dilarang keras berasumsi atau membuat fitur sendiri yang tidak diminta.
* **Penerapan:** Kapan pun ada keraguan, pilihan opsi alur kerja, atau detail teknis yang belum pasti, AI wajib menanyakan langsung kepada Dalvin sebanyak-banyaknya tanpa batas, dan **wajib menyertakan rekomendasi jawaban** terbaik agar Dalvin dapat mengambil keputusan dengan cepat.

---

## 4. Prinsip "Automated Conventional Commits"
* **Aturan:** Setiap kali satu modul atau perbaikan selesai, perubahan wajib langsung di-commit dan di-push ke GitHub menggunakan bahasa Inggris dan format standar industri (*Conventional Commits*):
  - `feat(...)`: Fitur baru
  - `fix(...)`: Perbaikan bug
  - `style(...)`: Perubahan tampilan antarmuka (100% solid flat, zero gradients)
  - `docs(...)`: Dokumentasi dan panduan
  - `refactor(...)`: Perapihan struktur kode
  - `chore(...)`: Penyesuaian konfigurasi atau dependensi

---

## 5. Prinsip "Context Retention via Interlinked Markdown"
* **Aturan:** Memori dan arsitektur sistem disimpan dalam file Markdown yang saling terhubung di folder `docs/` dan `AGENTS.md`.
* **Penerapan:** Siapa pun AI atau chat room baru yang dibuka, seluruh peta arsitektur, warna desain, dan database langsung terbaca secara instan.
