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

## 4. Tips Jika GitHub Meminta Autentikasi / Password
Saat pertama kali melakukan `git push`, Windows biasanya akan memunculkan popup jendela kecil login GitHub:
* Cukup pilih **"Sign in with your browser"** dan klik tombol hijau **Authorize**.
* Sekali login, komputer akan mengingat kredensial kamu selamanya melalui Windows Credential Manager.

---

> [!TIP]
> **Tenang saja!** Selama proses pengerjaan, kamu tidak perlu menghafal semua perintah ini. Kapan pun kita selesai mengerjakan satu modul, saya akan selalu mengingatkan dan memberikan perintah CLI yang tinggal kamu klik atau saya jalankan untukmu!
