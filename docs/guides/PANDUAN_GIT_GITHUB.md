# 🐙 PANDUAN LENGKAP GIT & GITHUB UNTUK PEMULA (TOKOKU)

Dokumen ini dibuat khusus untuk memandu kamu (Dalvin) langkah demi langkah menghubungkan proyek **TokoKu** ke akun GitHub kamu, serta cara melakukan commit dan push secara mudah.

---

## 1. Persiapan Awal (Hanya Perlu Dilakukan Sekali)

### A. Pastikan Akun GitHub Siap
1. Buka browser dan login ke akun kamu di [github.com](https://github.com).
2. Buat repository baru di GitHub:
   - Klik tombol **"+"** di pojok kanan atas -> pilih **"New repository"**.
   - Beri nama repository: `tokoku` atau `TokoKu-POS`.
   - Pilih visibilitas: **Private** (atau Public jika ingin dipamerkan di portofolio).
   - **PENTING:** Jangan centang *"Add a README file"*, *"Add .gitignore"*, atau *"Choose a license"*, biarkan repositori benar-benar kosong agar tidak bentrok dengan file yang sudah kita miliki.
   - Klik **"Create repository"**.
   - Salin URL repository yang muncul (contoh: `https://github.com/username-kamu/tokoku.git`).

---

### B. Konfigurasi Identitas Git di Komputer Kamu
Buka Terminal / Command Prompt di VS Code / Antigravity IDE, lalu jalankan dua perintah berikut (ganti dengan nama dan email GitHub kamu):

```bash
git config --global user.name "Dalvin"
git config --global user.email "dalvin1409@gmail.com"
```

---

## 2. Menghubungkan Folder Lokal ke GitHub

Jalankan perintah berikut secara berurutan di terminal (di dalam folder proyek `TokoKu`):

```bash
# 1. Inisialisasi Git di folder lokal (jika belum)
git init

# 2. Buat branch utama bernama 'main'
git branch -M main

# 3. Hubungkan folder lokal ke repositori GitHub yang tadi kamu buat
# (Ganti URL di bawah dengan URL repositori kamu)
git remote add origin https://github.com/username-kamu/tokoku.git

# 4. Tambahkan file .gitignore agar node_modules & file rahasia tidak ikut ter-upload
# (Ini akan disiapkan otomatis oleh Antigravity)

# 5. Cek status koneksi remote
git remote -v
```

---

## 3. Alur Kerja Sehari-hari (Add, Commit, Push)

Setiap kali saya (Antigravity) selesai mengerjakan sebuah fitur atau modul, kita akan menyimpannya ke GitHub dengan 3 langkah sederhana:

### Langkah 1: Melihat file apa saja yang berubah
```bash
git status
```

### Langkah 2: Menandai semua perubahan untuk disimpan
```bash
git add .
```

### Langkah 3: Membuat catatan commit (apa yang sudah dikerjakan)
Gunakan pesan yang jelas dan deskriptif:
```bash
git commit -m "feat: inisialisasi arsitektur database dan layout pos"
```

### Langkah 4: Mengirim perubahan ke GitHub
```bash
git push -u origin main
```
*(Untuk push berikutnya, cukup ketik `git push` saja).*

---

## 4. Mengatasi Error "Authentication Failed / Password authentication is not supported"

Jika saat menjalankan `git push -u origin main` kamu melihat pesan error seperti ini:
```text
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/dlpnn11/Tokoku.git/'
```

Ini adalah hal yang **sangat wajar bagi pemula**. Sejak 2021, GitHub sudah melarang penggunaan password akun biasa di terminal demi keamanan. Ada 2 cara mudah mengatasinya:

### Solusi 1: Menggunakan Personal Access Token (PAT) — Sangat Direkomendasikan (2 Menit)
1. Buka browser dan buka link ini: **[https://github.com/settings/tokens](https://github.com/settings/tokens)**
2. Klik tombol **"Generate new token"** (pojok kanan atas) -> pilih **"Generate new token (classic)"**.
3. Di bagian **Note**, ketik: `TokoKu Token`.
4. Di bagian **Expiration**, pilih `90 days` atau `No expiration`.
5. Di bagian **Select scopes**, centang kotak paling atas:
   - ✅ **`repo`** (Memberikan akses penuh untuk push/pull repository).
6. Gulir ke bawah dan klik tombol hijau **"Generate token"**.
7. **PENTING:** Salin deretan kode token yang muncul (formatnya diawali `ghp_...`). Token ini hanya muncul sekali!
8. Buka Terminal di laptopmu dan jalankan perintah ini (ganti tulisan `ghp_TOKEN_KAMU_DISINI` dengan kode yang kamu salin):
   ```bash
   git remote set-url origin https://ghp_TOKEN_KAMU_DISINI@github.com/dlpnn11/Tokoku.git
   ```
9. Sekarang jalankan push kembali:
   ```bash
   git push -u origin main
   ```
   *Selesai! Push akan langsung sukses dan kamu tidak perlu login lagi untuk push-push berikutnya.*

---

### Solusi 2: Menggunakan GitHub CLI Resmi (Browser Login)
1. Buka terminal dan jalankan:
   ```powershell
   winget install --id GitHub.cli
   ```
2. Setelah selesai, jalankan:
   ```bash
   gh auth login
   ```
3. Pilih `GitHub.com` -> `HTTPS` -> `Yes` -> `Login with a web browser`. Masukkan kode yang tertera di terminal ke browser.
4. Lalu jalankan `git push -u origin main`.

---

## 5. Strategi 3-Tier Kontribusi GitHub (Alami & Profesional Seperti Senior Engineer)

Untuk membuat riwayat dan grafik kontribusi di profil GitHub kamu terlihat **100% natural, elegan, dan mencerminkan senior production engineer**, seluruh aktivitas pengembangan dibagi ke dalam 3 hierarki (*tiers*):

### Rasio Aktivitas Ideal:
- 📊 **Commits (Dominan ~75–85%):** Aktivitas harian menulis kode, styling, perbaikan bug, dan penyempurnaan fitur.
- 🔀 **Pull Requests & Code Reviews (~10–15%):** Rilis milestone besar atau halaman baru.
- 📌 **Issues (~5–10%):** Perencanaan roadmap backlog dan pelaporan bug.

---

### A. Tier 1: Major Epics / Halaman Baru (~15% tugas)
* **Kapan Digunakan:**
  - Membuat **Halaman / Route Baru** (misal: `/promo`, `/laporan`).
  - **Migrasi Database Baru** (tabel baru Supabase, RPC baru).
  - **Arsitektur Baru** (integrasi payment gateway, sistem otentikasi baru).
* **Cara Eksekusi (Otomatis 4 Metrik):**
  ```bash
  node scripts/github-workflow.mjs auto-flow "<Judul>" "<Deskripsi>" "<CommitMsg>" "<NamaBranch>"
  ```
* **Hasil:** Membuat Issue, Branch, Commit, PR, Peer Review, dan Squash Merge ke `main`.

---

### B. Tier 2: Sub-features, Perbaikan Bug, & Polish UI (DOMINAN ~75–85% tugas)
* **Kapan Digunakan:**
  - Penambahan sub-fitur / gesture pada halaman yang sudah ada (misal: Swipe gesture sidebar, shortcut F1-F4).
  - Perbaikan bug fungsional & responsif (misal: scroll keranjang HP, warning aksesibilitas `aria-hidden`).
  - Penyesuaian tampilan, CSS, margin, typography, dan refactor kode.
* **Cara Eksekusi (Direct Commit - Paling Sering Digunakan):**
  ```bash
  git add .
  git commit -m "<type>(<scope>): <pesan dalam bahasa Inggris>"
  git push
  ```
* **Hasil:** Langsung menambah angka Commits di `main` tanpa mengotori riwayat PR. Menjaga profil GitHub kamu tetap aktif secara alami setiap hari.

---

### C. Tier 3: Catatan Backlog & Bug Reporting (~5–10% tugas)
* **Kapan Digunakan:**
  - Mencatat ide fitur masa depan yang belum akan dikerjakan di sesi aktif.
* **Cara Eksekusi (Issue Only):**
  ```bash
  node scripts/github-workflow.mjs create-issue "<Judul>" "<Deskripsi>"
  ```
* **Hasil:** Menambah metrik Issues di GitHub tanpa membuat PR kosong.

---

> [!TIP]
> **Tenang saja!** Selama proses pengerjaan, kamu tidak perlu menghafal semua perintah ini. Antigravity akan otomatis mengidentifikasi apakah pekerjaan masuk Tier 1 atau Tier 2 dan menjalankannya secara tepat untukmu!
