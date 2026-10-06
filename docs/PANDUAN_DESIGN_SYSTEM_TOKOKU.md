# 🎨 PANDUAN LENGKAP DESIGN SYSTEM & KONSEP UI/UX — TOKOKU

Dokumen ini merupakan panduan resmi (*Single Source of Truth*) perancangan antarmuka (UI) dan pengalaman pengguna (UX) untuk seluruh sistem **TokoKu**. Panduan ini wajib dipatuhi oleh seluruh pengembang, desainer, dan AI assistant tanpa pengecualian.

---

## 1. 🧠 DESIGN THINKING & FILOSOFI PENGEMBANGAN

### 1.1 Konteks Pengguna: Warung Kelontong Mikro Indonesia
Sistem POS TokoKu dirancang untuk melayani lingkungan warung kelontong modern dan toko grosir mikro di Indonesia:
- **Pengguna Primer:** 
  - **Pemilik Warung (Owner):** Membutuhkan visibilitas cepat atas perputaran stok, nilai modal/kulakan (HPP), keuntungan kotor harian, serta relasi distributor kulakan.
  - **Kasir / Pramuniaga:** Membutuhkan kecepatan transaksi ultra-cepat (< 5 detik per pelanggan), antarmuka yang tahan banting, minim klik, tombol besar yang mudah ditekan, dan kejelasan hitungan uang kembalian.
- **Kondisi Lingkungan Toko:**
  - Ruang meja kasir seringkali terbatas, monitor desktop standar (1366×768 atau 1920×1080).
  - Kasir sering melayani saat kondisi toko ramai (*rush hour* sore/malam), sehingga layar kasir tidak boleh memicu kelelahan mata (*visual fatigue*).
  - Penggunaan gawai ganda: Desktop PC untuk register kasir, dan *smartphone* pemilik/kasir untuk scanner barcode nirkabel via kamera HP.

### 1.2 Prinsip Desain Utama
1. **Zero Cognitive Overhead:** Tidak ada elemen dekoratif yang membingungkan. Setiap warna, teks, dan tombol memiliki makna operasional yang tegas.
2. **Fitts's Law Ergonomics:** Tombol-tombol penting (misal: "Bayar", nominal uang pas, tambah kuantitas) berukuran besar dan mudah dijangkau kursor mouse maupun layar sentuh.
3. **High Contrast Legibility:** Kontras teks di atas permukaan putih/krem sangat tinggi (rasio kontras WCAG AAA) agar kasir tidak salah membaca angka rupiah atau sisa stok.
4. **Aturan Emas: 100% Solid Flat Colors (Zero Gradients Rule):** Melarang penggunaan gradien warna atau efek *glassmorphism* tembus pandang yang mengaburkan teks dan memperlambat rendering komputer warung.

---

## 2. 🎨 PALET WARNA RESMI & TOKEN DESAIN (100% FLAT SOLID COLORS)

> [!IMPORTANT]
> **ATURAN MUTLAK (ZERO GRADIENT):**
> DILARANG KERAS menggunakan `linear-gradient`, `radial-gradient`, `backdrop-blur`, atau bayangan berlebihan. Seluruh latar belakang dan tombol wajib menggunakan warna datar murni (*solid color fill*).

### 2.1 Palet Utama (Brand Identity)
| Token Nama | Nilai HEX | Tailwind Token | Penggunaan & Arti Filosofis |
| :--- | :--- | :--- | :--- |
| **Sage Green (Primary)** | `#6FA084` | `bg-[#6FA084]` / `text-[#6FA084]` | Warna identitas utama TokoKu. Memberikan kesan tenang, segar, alami, dan ramah khas retail sembako. Digunakan untuk tombol utama, tab aktif, icon highlight, dan status normal. |
| **Sage Forest (Primary Hover)** | `#58836B` | `hover:bg-[#58836B]` | Warna keadaan hover untuk tombol utama guna memberikan feedback penekanan tegas. |
| **Sage Tint (Soft Highlight)** | `#F4F8F5` | `bg-[#F4F8F5]` / `border-[#D5E5DC]` | Latar belakang pill badge, item dropdown yang di-hover, baris tabel terpilih. |
| **Sage Soft Active** | `#EBF3EE` | `bg-[#EBF3EE]` | Keadaan aktif dropdown option, checkbox terpilih. |

### 2.2 Palet Netral (Surface & Neutral Background)
| Token Nama | Nilai HEX | Tailwind Token | Penggunaan & Arti Filosofis |
| :--- | :--- | :--- | :--- |
| **Light Warm Cream (App Canvas)** | `#F4F4F0` | `bg-[#F4F4F0]` | Latar belakang utama aplikasi di balik kartu. Warna krem hangat mengurangi silau putih tajam saat kasir berjaga berjam-jam. |
| **Card Surface (Pure White)** | `#FFFFFF` | `bg-white` | Latar belakang seluruh kartu komponen, modal pop-up, dan dropdown popover. |
| **Dark Charcoal (Sidebar)** | `#2C2C2C` | `bg-[#2C2C2C]` | Latar sidebar navigasi desktop. Memberikan kontras kokoh yang membedakan menu sistem dengan area kerja. |
| **Dark Charcoal Hover** | `#3D3D3D` | `hover:bg-[#3D3D3D]` | Keadaan hover untuk item navigasi sidebar. |
| **Border Neutral** | `#E5E5E0` | `border-[#E5E5E0]` | Garis batas (*border*) seluruh kartu, tabel, input, dan divider pemisah. |
| **Border Darker / Focus** | `#D0D0CB` | `border-[#D0D0CB]` | Garis batas elemen saat di-hover sebelum diklik. |

### 2.3 Palet Tipografi (Typography Text)
| Token Nama | Nilai HEX | Tailwind Token | Penggunaan |
| :--- | :--- | :--- | :--- |
| **Primary Text (Heading/Data)** | `#1A1A1A` | `text-[#1A1A1A]` | Teks utama, judul, angka nominal rupiah, nama barang. Kontras maksimal. |
| **Muted Text (Meta/Label)** | `#6B7280` | `text-[#6B7280]` | Label keterangan, SKU barang, tanggal/jam, satuan barang, nama kolom tabel. |
| **Light Muted (Placeholder)** | `#9E9E9E` | `text-[#9E9E9E]` | Teks placeholder input sebelum kasir mengetik. |

### 2.4 Palet Status & Semantik (Status Indicators)
| Status | Nilai HEX | Latar Lunak (Soft Fill) | Border | Penggunaan |
| :--- | :--- | :--- | :--- | :--- |
| **Peringatan / Stok Menipis** | `#E8A838` (Amber Gold) | `#FDF9F0` | `#F5D8A5` | Stok tersisa ≤ 5 unit, verifikasi pembayaran pending. |
| **Bahaya / Stok Habis / Hapus** | `#D64545` (Crimson Red) | `#FDEAEA` | `#F8BEBE` | Stok habis (0), transaksi dibatalkan, tombol hapus barang/supplier. |
| **Sukses / Lunas** | `#6FA084` (Sage Green) | `#F4F8F5` | `#D5E5DC` | Transaksi berhasil, stok melimpah (> 5), status aktif. |
| **QRIS & WhatsApp** | `#25D366` (Green Official) | `#EAFBF1` | `#B9F3D0` | Tombol kontak WhatsApp supplier, receipt WhatsApp kasir. |

---

## 3. ✍️ SISTEM TIPOGRAFI & ANGKA MONOTON (TABULAR NUMERALS)

1. **Font Family Primer:** `Inter`, disusul `system-ui, -apple-system, sans-serif`.
2. **Aturan Format Angka & Uang Rupiah:**
   - Seluruh nominal uang **wajib** menggunakan helper `formatRupiah()` (contoh: `Rp 15.000`).
   - Angka stok, SKU, dan harga **wajib** menggunakan varian angka tabular/monospaced (`font-mono` atau `tabular-nums`) agar posisi digit rata saat kasir membandingkan baris tabel secara vertikal.

### Hierarki Skala Tipografi:
- **Display Big Total (Total Bayar Kasir):** `text-2xl` sampai `text-3xl` (24px–30px), `font-black text-[#1A1A1A] tracking-tight`.
- **Page Title / Module Heading:** `text-sm md:text-base`, `font-bold uppercase tracking-wider text-[#1A1A1A]`.
- **Card KPI Number:** `text-2xl` (24px), `font-black text-[#1A1A1A] mt-1`.
- **Card KPI Label:** `text-xs` (12px), `font-semibold text-[#6B7280] tracking-wider uppercase`.
- **Tabel Header (TH):** `text-xs` (12px), `font-bold text-[#6B7280] uppercase tracking-wider`.
- **Tabel Cell Data (TD):** `text-xs md:text-sm` (12px–14px), `font-medium text-[#1A1A1A]`.
- **Pill Badge:** `text-xs` (12px), `font-bold`.

---

## 4. 🧩 SPESIFIKASI KOMPONEN UI TOKOKU

### 4.1 Tombol (Buttons)
- **Radius Sudut:** `rounded-xl` (12px) untuk kenyamanan sentuhan modern.
- **Tinggi Elemen:** `h-9` (36px kecil), `h-10` (40px standar), `h-11` (44px besar/checkout).
- **Varian Tombol:**
  - **Primary:** `bg-[#6FA084] text-white hover:bg-[#58836B] font-bold shadow-xs active:scale-[0.98] transition-all`
  - **Outline:** `border border-[#E5E5E0] bg-white text-[#1A1A1A] hover:border-[#6FA084] hover:bg-[#F4F8F5] hover:text-[#6FA084] font-semibold`
  - **Ghost:** `bg-transparent text-[#6B7280] hover:bg-[#F4F4F0] hover:text-[#1A1A1A]`
  - **Danger:** `bg-[#FDEAEA] text-[#D64545] border border-[#F8BEBE] hover:bg-[#D64545] hover:text-white font-bold`
  - **Quick Cash (Nominal Uang Kasir):** `h-10 border border-[#E5E5E0] bg-white text-xs font-bold text-[#1A1A1A] hover:border-[#6FA084] hover:bg-[#F4F8F5] active:bg-[#6FA084] active:text-white`

### 4.2 Dropdown / Select Kustom (Anti-Native)
- Dilarang memakai tag `<select>` HTML bawaan OS yang kaku dan bergaya biru Windows.
- Gunakan komponen `CustomSelect` (`src/components/ui/select.tsx`):
  - **Trigger:** Tombol dengan border `#E5E5E0`, sudut `rounded-xl`, chevron rotasi 180° saat terbuka.
  - **Menu Popover:** Sudut `rounded-xl`, border `#E5E5E0`, bayangan halus `shadow-xl`, background putih.
  - **Item Option:** Sudut `rounded-lg`, hover background `#F4F8F5` dengan warna teks hijau sage `#6FA084`.
  - **Option Aktif:** Background `#EBF3EE`, teks `#6FA084` tebal, disertai icon centang (*Checkmark*).
  - **Dismiss:** Menutup otomatis ketika kasir klik di luar elemen atau menekan tombol `Escape`.

### 4.3 Kartu & Kontainer (Cards)
- **Aturan Padding:** Konten kartu **wajib** memiliki padding seimbang pada keempat sisi (`p-5 sm:p-6`). Dilarang memotong padding atas (`pt-0`) tanpa alasan yang disengaja agar judul kartu tidak menempel mepet pada garis tepi atas.
- **Radius & Border:** `rounded-2xl` (16px), border datar `border border-[#E5E5E0] bg-white shadow-sm`.

### 4.4 Modal Pop-up (Dialogs)
- **Backdrop:** Latar datar solid `#000000` dengan opasitas 50% (`bg-[#000000] opacity-50`). Tanpa blur latar belakang.
- **Bodi Dialog:** `rounded-2xl border border-[#E5E5E0] bg-white shadow-2xl overflow-hidden`.
- **Header:** Judul tebal, deskripsi penjelas abu-abu, tombol silang `X` di sudut kanan atas.
- **Footer:** Tombol aksi aksi primer di kanan, tombol "Batal / Tutup" di sebelahnya, dipisahkan oleh garis pemisah tipis `border-t border-[#E5E5E0]`.

### 4.5 Tabel Data
- Baris tabel responsif dengan hover warna hangat: `hover:bg-[#F9F9F7] transition-colors`.
- Header tabel menempel tetap (*sticky header*) dengan background `#FAFBF9` dan border bawah `#E5E5E0`.
- Kolom angka (stok, harga) selalu diratakan ke kanan (*align right*).
- Kolom aksi (edit, hapus, detail) selalu diratakan ke kanan atau tengah dengan icon ringkas berukuran `w-4 h-4`.

### 4.6 Header Bar Atas (Top Header 64px)
- Tinggi tetap: `h-16` (64px), latar putih murni `bg-white`, border bawah `border-b border-[#E5E5E0]`.
- Jam Digital: Menampilkan hari, tanggal, dan waktu WIB dengan pembaruan interval setiap 60 detik (tanpa detik cepat yang membebani CPU).
- User Profile Pill: Avatar inisial dengan tombol dropdown interaktif yang memuat informasi toko, tombol ganti peran instan (Pemilik ↔ Kasir), dan tombol logout.

---

## 5. 📱 ERGONOMI LAYOUT & MULTI-SCREEN (DESKTOP & SCANNER HP)

### 5.1 Terminal Kasir Desktop (`/pos`)
- **Split Screen 60 : 40 Ratio:**
  - **60% Kiri:** Pencarian instan (nama/SKU), filter chip kategori horizontal yang bisa digeser, grid kartu produk (gambar, nama, stok, harga). Jika stok = 0, kartu menampilkan pita merah "STOK HABIS" dan tidak bisa diklik.
  - **40% Kanan (Struk Virtual):** Keranjang belanja kasir. Daftar item dengan kontrol kuantitas (`-` / `+`), pemilihan metode pembayaran (Tunai vs QRIS), tombol nominal cepat (`Rp 10.000`, `20.000`, `50.000`, `100.000`, `Uang Pas`), hitungan kembalian langsung, dan tombol utama `BAYAR`.

### 5.2 Pemindai Barcode HP (`/scan`)
- Tampilan layar penuh (*100vh*) pada browser smartphone kasir.
- Viewfinder kamera bersih dengan kotak penunjuk fokus hijau sage `#6FA084`.
- Tidak ada tombol navigasi yang mengganggu saat memindai barang berturut-turut.
- Kode QR Pairing ditampilkan di desktop agar HP kasir bisa terhubung ke sesi POS desktop tanpa perlu ketik link manual.

---

## 6. 🔊 FEEDBACK AUDIO & HAPTIK (TACTILE FEEDBACK)

1. **Beep Pemindai Barcode (Audio Synthesizer):**
   - Menggunakan Web Audio API bawaan browser (tanpa perlu mendownload file MP3 eksternal).
   - Nada sukses: Gelombang *sine* pada frekuensi `800Hz` selama `100ms`.
   - Nada gagal/stok habis: Gelombang *sawtooth* pada frekuensi `400Hz` selama `200ms`.
2. **Getaran Smartphone (Haptic):**
   - Pada pemindaian sukses: `navigator.vibrate(100)`.
   - Pada error: `navigator.vibrate([100, 50, 100])`.

---

## 7. ⌨️ PINTASAN PAPAN KETIK (KEYBOARD SHORTCUTS)

Untuk mempercepat operasional kasir tanpa menyentuh mouse:
- `F1` : Fokuskan kursor ke kotak pencarian produk / barcode.
- `F2` : Langsung buka konfirmasi pembayaran / input uang diterima.
- `F4` : Kosongkan keranjang belanja kasir.
- `Escape` : Tutup pop-up modal aktif atau batalkan pencarian.

---

## 8. 📋 CHECKLIST VERIFIKASI SEBELUM COMMIT / DEPLOY

Sebelum menandai suatu komponen atau fitur selesai:
- [ ] Apakah ada gradien warna? (Jika ya, ganti dengan warna solid).
- [ ] Apakah padding kartu seimbang di keempat sisinya? (Minimal 20px / `p-5`).
- [ ] Apakah dropdown menggunakan `CustomSelect` rounded dengan hover hijau sage?
- [ ] Apakah seluruh angka mata uang diformat menggunakan `formatRupiah`?
- [ ] Apakah badge jumlah produk terbaca jelas (bukan font mikro 10px)?
- [ ] Apakah `npm run build` berhasil tanpa satupun error TypeScript?
