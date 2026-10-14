# 🛡️ MASTER ROADMAP KEAMANAN & PENGUATAN SISTEM (SECURITY HARDENING) — TOKOKU POS

Dokumen ini memuat blueprint komprehensif mengenai **20 lapisan pertahanan keamanan (Cybersecurity Defense in Depth)** untuk sistem kasir ritel **TokoKu POS & Inventory Management System** (Next.js 16 App Router, Supabase PostgreSQL, Zustand).

Dokumen ini dirancang modular agar setiap item dapat dieksekusi secara terpisah satu per satu sesuai instruksi Dalvin, menghasilkan riwayat commit git yang bersih, teruji, dan berstandar industri.

---

## 📊 TABEL MATRIKS 20 LAPISAN KEAMANAN TOKOKU

| No | Modul Keamanan | Lapisan / Kategori | Tingkat Ancaman | Target Commit | Status |
|:---:|:---|:---|:---:|:---|:---:|
| **01** | PostgREST Filter Injection Sanitization | API & Query Layer | 🔴 Kritis | `fix(security): sanitize postgrest query filters against injection` | `[x] Selesai` |
| **02** | PostgreSQL Row Level Security (RLS) Hardening | Database Layer | 🔴 Kritis | `fix(security): enforce strict postgresql row level security policies` | `[x] Selesai` |
| **03** | Database Integrity Constraints (Anti-Minus) | Database Layer | 🟠 Tinggi | `fix(security): add database check constraints for non-negative values` | `[x] Selesai` |
| **04** | Anti-Race Condition Atomic Concurrency | Concurrency Layer | 🟠 Tinggi | `fix(security): prevent race condition in stock adjustments via atomic queries` | `[x] Selesai` |
| **05** | Server-Side Password Hashing & Verification | Auth Layer | 🔴 Kritis | `feat(security): implement server-side credential verification with safe hashing` | `[x] Selesai` |
| **06** | Anti-Tampering Session & Secure Storage | Auth / Session | 🔴 Kritis | `feat(security): harden auth session storage against client-side tampering` | `[x] Selesai` |
| **07** | Timing Attack Mitigation pada Kredensial | Cryptographic Layer| 🟡 Sedang | `fix(security): protect authentication verification against timing attacks` | `[x] Selesai` |
| **08** | Cashier Terminal Idle Auto-Lockout | Session & POS UX | 🟠 Tinggi | `feat(security): implement cashier terminal idle lockout mechanism` | `[x] Selesai` |
| **09** | Rate Limiting & Brute Force Protection | Auth & Network | 🟠 Tinggi | `feat(security): add rate limiting and brute force protection on login` | `[ ] Antrean` |
| **10** | Next.js Edge Middleware Route Guard | Network / Routing | 🔴 Kritis | `feat(security): implement edge middleware route protection and rbac` | `[ ] Antrean` |
| **11** | Strict HTTP Security Response Headers | Network & Browser | 🟠 Tinggi | `feat(security): configure strict http security headers in next config` | `[ ] Antrean` |
| **12** | Content Security Policy (CSP) Optimization | Browser Defense | 🟠 Tinggi | `feat(security): define strict content security policy rules` | `[ ] Antrean` |
| **13** | Request Origin & CSRF Header Validation | Network Defense | 🟡 Sedang | `fix(security): validate request origin and headers against csrf` | `[ ] Antrean` |
| **14** | Server-Side Price & Subtotal Validation | Business Logic | 🔴 Kritis | `fix(security): recalculate and verify product prices server-side during checkout` | `[ ] Antrean` |
| **15** | Runtime Input Schema Validation (Zod) | Data Validation | 🟠 Tinggi | `feat(security): enforce runtime input schema validation for data mutations` | `[ ] Antrean` |
| **16** | XSS Sanitization & Safe WhatsApp URL Encoding | Client & Output | 🟠 Tinggi | `fix(security): sanitize user input and escape receipt outputs against xss` | `[ ] Antrean` |
| **17** | Validasi Integritas Pembayaran & Kembalian | Business Logic | 🟠 Tinggi | `fix(security): validate cash payment balance and change server-side` | `[ ] Antrean` |
| **18** | Secure Expiring Tokens for Mobile Scanner | Realtime Layer | 🟠 Tinggi | `feat(security): secure mobile barcode scanner realtime channel with expiring tokens` | `[ ] Antrean` |
| **19** | Sanitasi Pesan Error (Anti-Information Disclosure)| Error Handling | 🟡 Sedang | `fix(security): sanitize database error messages to prevent information disclosure` | `[ ] Antrean` |
| **20** | Immutable Security Audit Trail Logging | Audit & Compliance | 🟠 Tinggi | `feat(security): add immutable security audit trail logging` | `[ ] Antrean` |

---

## 🔍 DEEP DIVE 20 MODUL KEAMANAN SECARA MENYELURUH

---

### MODUL 01: PostgREST Filter Injection & Query Sanitization
* **Tingkat Ancaman:** 🔴 Kritis (High CVSS Score: 8.5)
* **Kategori:** API & Query Layer
* **Celah & Skenario Serangan:**
  Di file `src/services/inventoryService.ts` (baris 24–26) dan `src/services/transactionService.ts` (baris 122–124), string pencarian pengguna dimasukkan langsung ke kueri PostgREST:
  ```typescript
  query.or(`name.ilike.%${filter.search}%,sku.ilike.%${filter.search}%`);
  ```
  Jika pengguna memasukkan input seperti `,id.neq.00000000-0000-0000-0000-000000000000`, tanda koma dan titik diartikan sebagai operator filter PostgREST baru. Penyerang dapat memodifikasi logika query boolean, membocorkan data produk tersembunyi/non-aktif, atau memicu error syntax yang merusak fungsionalitas pencarian.
* **Solusi Teknis:**
  1. Membuat fungsi utilitas `sanitizePostgrestFilter(term: string): string` di `src/lib/security.ts`.
  2. Menghilangkan atau meng-escape karakter reserved PostgREST (seperti `,`, `:`, `(`, `)`, `.`, `"`, `'`, `%`, `\`).
  3. Membatasi panjang maksimal string pencarian (misal maksimal 50 karakter).
  4. Menerapkan sanitasi ini secara konsisten di `inventoryService.ts` dan `transactionService.ts`.
* **Target Commit:** `fix(security): sanitize postgrest query filters against injection`
* **Verifikasi & Pengujian:**
  Input karakter reserved `,name.eq.test(),:` pada search bar inventaris dan transaksi kasir harus diolah sebagai string pencarian literal yang aman tanpa merusak kueri PostgREST.

---

### MODUL 02: PostgreSQL Row Level Security (RLS) Hardening
* **Tingkat Ancaman:** 🔴 Kritis (High CVSS Score: 9.1)
* **Kategori:** Database Layer (Supabase PostgreSQL)
* **Celah & Skenario Serangan:**
  Pada `supabase/schema.sql` (baris 110–115), seluruh tabel memiliki kebijakan RLS longgar:
  ```sql
  CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
  ```
  Karena `NEXT_PUBLIC_SUPABASE_ANON_KEY` berada di bundle JavaScript publik browser, siapa saja dapat membuka console DevTools dan mengeksekusi:
  ```javascript
  await supabase.from('users').select('*'); // Mencuri semua kredensial
  await supabase.from('products').update({ sell_price: 1 }).neq('id', ''); // Mengubah harga barang jadi Rp 1
  ```
* **Solusi Teknis:**
  1. Tabel `users`: Batasi `SELECT` publik agar tidak dapat membaca `password_hash`, larang mutasi langsung dari anonim.
  2. Tabel `products`, `categories`, `suppliers`: Izinkan `SELECT` untuk operasional kasir, tetapi mutasi `INSERT`, `UPDATE`, `DELETE` hanya diizinkan melalui fungsi terverifikasi atau peran pemilik.
  3. Tabel `transactions`: Larang `UPDATE` dan `DELETE` dari klien langsung; transaksi baru hanya boleh dibuat via stored procedure `create_pos_transaction`.
* **Target Commit:** `fix(security): enforce strict postgresql row level security policies`
* **Verifikasi & Pengujian:**
  Mengeksekusi perintah penghapusan atau update harga via client anonim diuji dan dipastikan menghasilkan respon PostgreSQL `403 Forbidden` / `new row violates row-level security policy`.

---

### MODUL 03: Database Integrity Constraints (Anti-Data Corruption)
* **Tingkat Ancaman:** 🟠 Tinggi
* **Kategori:** Database Schema Hardening
* **Celah & Skenario Serangan:**
  Pada skema saat ini, kolom numerik seperti `sell_price`, `buy_price`, `current_stock`, dan `minimum_stock` bertipe `NUMERIC` / `INTEGER` tanpa klausul `CHECK`. Seseorang dapat memasukkan nilai minus seperti stok `-50` atau harga `-15000`, yang akan mengacaukan perhitungan laba bersih toko pada laporan keuangan.
* **Solusi Teknis:**
  1. Menambahkan constraint integritas di PostgreSQL:
     ```sql
     ALTER TABLE products ADD CONSTRAINT chk_products_sell_price CHECK (sell_price >= 0);
     ALTER TABLE products ADD CONSTRAINT chk_products_buy_price CHECK (buy_price >= 0);
     ALTER TABLE products ADD CONSTRAINT chk_products_current_stock CHECK (current_stock >= 0);
     ALTER TABLE products ADD CONSTRAINT chk_products_min_stock CHECK (minimum_stock >= 0);
     ALTER TABLE transactions ADD CONSTRAINT chk_tx_total_amount CHECK (total_amount >= 0);
     ALTER TABLE transaction_details ADD CONSTRAINT chk_txd_quantity CHECK (quantity > 0);
     ALTER TABLE transaction_details ADD CONSTRAINT chk_txd_unit_price CHECK (unit_price >= 0);
     ```
* **Target Commit:** `fix(security): add database check constraints for non-negative values`
* **Verifikasi & Pengujian:**
  Mencoba menyisipkan produk dengan harga negatif atau stok minus akan ditolak secara mutlak oleh engine PostgreSQL.

---

### MODUL 04: Anti-Race Condition & Atomic Concurrency Locking
* **Tingkat Ancaman:** 🟠 Tinggi
* **Kategori:** Concurrency & Transaction Safety
* **Celah & Skenario Serangan:**
  Pada `src/services/inventoryService.ts`, penyesuaian stok manual membaca stok terlebih dahulu (`SELECT`) lalu mengirimkan nilai baru via (`UPDATE products SET current_stock = newStock`). Jika dua staf memperbarui stok secara bersamaan, terjadi masalah *Lost Update* (stok terakhir menimpa stok sebelumnya tanpa memperhitungkan selisih riil).
* **Solusi Teknis:**
  1. Membangun stored function PostgreSQL atomik `adjust_product_stock_delta(p_product_id UUID, p_delta INT)`.
  2. Mengeksekusi penyesuaian berbasis delta atomik:
     ```sql
     UPDATE products SET current_stock = current_stock + p_delta WHERE id = p_product_id;
     ```
  3. Memastikan penguncian baris `FOR UPDATE` jika terjadi pengecekan batas stok.
* **Target Commit:** `fix(security): prevent race condition in stock adjustments via atomic queries`
* **Verifikasi & Pengujian:**
  Simulasi request penyesuaian stok bersamaan secara paralel menghasilkan nilai akhir stok yang akurat dan konsisten.

---

### MODUL 05: Server-Side Password Hashing & Safe Verification
* **Tingkat Ancaman:** 🔴 Kritis
* **Kategori:** Authentication & Cryptography
* **Celah & Skenario Serangan:**
  Di `src/stores/authStore.ts` (baris 48–63):
  ```typescript
  const { data } = await supabase.from("users").select("*").eq("username", cleanUser).single();
  if (data.password_hash === cleanPass) { ... }
  ```
  Kata sandi disimpan polos/MD5 dan diverifikasi di browser kasir. Kredensial akun pemilik (`pemilik123`) diunduh secara transparan ke network browser pengguna.
* **Solusi Teknis:**
  1. Membangun RPC PostgreSQL terenkripsi `authenticate_user(p_username, p_password)` menggunakan ekstensi `pgcrypto` dengan algoritma `crypt(password, gen_salt('bf'))` (Bcrypt).
  2. Kueri mengembalikan data user (id, username, full_name, role) HANYA jika hash cocok, dan kolom `password_hash` tidak pernah dikembalikan ke klien peramban.
* **Target Commit:** `feat(security): implement server-side credential verification with safe hashing`
* **Verifikasi & Pengujian:**
  Pemeriksaan network tab di browser membuktikan bahwa tidak ada data hash atau password mentah yang terkirim di response payload.

---

### MODUL 06: Anti-Tampering Session & Secure HttpOnly Storage
* **Tingkat Ancaman:** 🔴 Kritis
* **Kategori:** Session & Client RBAC
* **Celah & Skenario Serangan:**
  Sesi login kasir disimpan di `localStorage` melalui Zustand persist (`tokoku-auth-storage`). Siapa saja dapat membuka console browser dan mengubah payload JSON menjadi:
  ```javascript
  localStorage.setItem('tokoku-auth-storage', JSON.stringify({
    state: { currentUser: { role: 'pemilik' }, isAuthenticated: true }
  }));
  ```
  Setelah halaman di-refresh, kasir berhasil melakukan *Privilege Escalation* dan memiliki akses ke menu laporan laba rugi.
* **Solusi Teknis:**
  1. Mengimplementasikan token session terverifikasi berbasis signature (HMAC SHA-256) atau cookie `httpOnly` yang tidak dapat dimanipulasi melalui script JavaScript peramban.
  2. Menambahkan validasi integritas sesi pada setiap siklus inisialisasi aplikasi.
* **Target Commit:** `feat(security): harden auth session storage against client-side tampering`
* **Verifikasi & Pengujian:**
  Mengubah nilai peran di `localStorage` secara manual akan memicu deteksi pemalsuan (*signature mismatch*) dan aplikasi otomatis memaksa logout ke `/login`.

---

### MODUL 07: Timing Attack Mitigation pada Kredensial
* **Tingkat Ancaman:** 🟡 Sedang
* **Kategori:** Cryptographic Defense
* **Celah & Skenario Serangan:**
  Operator perbandingan standar JavaScript (`===`) melakukan perbandingan karakter demi karakter dan langsung keluar (*early return*) saat menemukan karakter pertama yang berbeda. Penyerang dengan script analisis latensi tinggi dapat mengukur selisih nanodetik untuk memecahkan karakter kata sandi.
* **Solusi Teknis:**
  1. Menggunakan fungsi perbandingan waktu konstan (*constant-time equality check*) seperti `crypto.timingSafeEqual` pada setiap pengecekan token atau verifikasi string kredensial.
* **Target Commit:** `fix(security): protect authentication verification against timing attacks`
* **Verifikasi & Pengujian:**
  Durasi eksekusi verifikasi kredensial memiliki waktu respons yang konsisten terlepas dari berapa banyak karakter yang benar di awal string.

---

### MODUL 08: Cashier Terminal Idle Auto-Lockout
* **Tingkat Ancaman:** 🟠 Tinggi
* **Kategori:** Physical POS Security & UX
* **Celah & Skenario Serangan:**
  Kasir atau pemilik sering kali meninggalkan terminal meja kasir dalam kondisi terbuka untuk melayani pelanggan di lorong toko. Siapa pun dapat menyentuh layar sentuh kasir dan mengubah transaksi atau melihat data omzet toko.
* **Solusi Teknis:**
  1. Membuat hook `useIdleTimer` yang memantau interaksi DOM (`mousemove`, `keydown`, `touchstart`, `scroll`).
  2. Jika tidak ada aktivitas selama batas waktu tertentu (misal 15 menit), sistem otomatis beralih ke modal terkunci (*Locked Terminal Overlay*).
  3. Membuka kunci terminal memerlukan input ulang PIN atau kata sandi pengguna aktif.
* **Target Commit:** `feat(security): implement cashier terminal idle lockout mechanism`
* **Verifikasi & Pengujian:**
  Membiarkan layar tidak tersentuh selama batas waktu memicu tampilan pengunci terminal tanpa menghilangkan data keranjang belanja yang sedang aktif.

---

### MODUL 09: Rate Limiting & Brute Force Protection pada Login
* **Tingkat Ancaman:** 🟠 Tinggi
* **Kategori:** Authentication & Network Defense
* **Celah & Skenario Serangan:**
  Form login di `src/app/login/page.tsx` tidak memiliki penghalang terhadap ribuan permintaan login per menit. Bot dapat melakukan serangan kamus (*dictionary brute force*) untuk menebak password akun kasir atau pemilik.
* **Solusi Teknis:**
  1. Membuat sistem proteksi *sliding window rate limiter*.
  2. Menerapkan *progressive delay penalty* (jeda 2 detik setelah 3 kali gagal).
  3. Mengunci akun/IP sementara selama 5 menit jika terjadi 5 kali kegagalan berturut-turut.
  4. Menampilkan indikator countdown waktu tunggu penguncian di antarmuka login.
* **Target Commit:** `feat(security): add rate limiting and brute force protection on login`
* **Verifikasi & Pengujian:**
  Percobaan login salah sebanyak 5 kali berturut-turut memunculkan pesan penguncian akun dan menonaktifkan tombol login hingga masa penalti berakhir.

---

### MODUL 10: Next.js Edge Middleware Route Guard
* **Tingkat Ancaman:** 🔴 Kritis
* **Kategori:** Network & Server Routing
* **Celah & Skenario Serangan:**
  Saat ini belum ada file `middleware.ts`. Pengecekan otorisasi hanya berjalan di sisi *client* di `AppShell.tsx` melalui `React.useEffect`. Akibatnya, saat kasir mengetik URL `/dashboard`, aset halaman dashboard dan data sempat termuat di browser (*client UI flicker*) sebelum script redirect dijalankan.
* **Solusi Teknis:**
  1. Membuat `src/middleware.ts` yang dieksekusi di Edge Runtime sebelum halaman dirender.
  2. Memeriksa cookie otentikasi.
  3. Menolak dan me-redirect pengguna tanpa hak akses ke `/login` atau `/pos` secara instan dari sisi server.
* **Target Commit:** `feat(security): implement edge middleware route protection and rbac`
* **Verifikasi & Pengujian:**
  Akses langsung ke URL `/laporan` tanpa sesi yang valid segera diblokir di tingkat server HTTP dengan status redirect `307 Temporary Redirect` tanpa sempat mengunduh komponen halaman.

---

### MODUL 11: Penguatan HTTP Security Response Headers
* **Tingkat Ancaman:** 🟠 Tinggi
* **Kategori:** Browser Security Headers
* **Celah & Skenario Serangan:**
  Konfigurasi `next.config.ts` masih default tanpa header keamanan. Aplikasi rentan terhadap serangan:
  - *Clickjacking*: Halaman kasir disematkan dalam `<iframe>` tak terlihat oleh situs pihak ketiga.
  - *MIME Sniffing*: Peramban salah mengeksekusi file teks sebagai skrip executable.
* **Solusi Teknis:**
  Menambahkan header standar keamanan tingkat enterprise di `next.config.ts`:
  ```typescript
  headers: [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }
  ]
  ```
* **Target Commit:** `feat(security): configure strict http security headers in next config`
* **Verifikasi & Pengujian:**
  Inspeksi response header via Curl / DevTools Network memastikan seluruh header keamanan di atas terpasang dengan benar.

---

### MODUL 12: Content Security Policy (CSP) Khusus Next.js & Supabase
* **Tingkat Ancaman:** 🟠 Tinggi
* **Kategori:** Browser Defense & Anti-XSS
* **Celah & Skenario Serangan:**
  Skrip berbahaya yang disisipkan melalui ekstensi peramban atau pustaka pihak ketiga dapat mengirimkan data kartu atau sesi kasir ke server penyerang.
* **Solusi Teknis:**
  1. Mengonfigurasi CSP ketat di `next.config.ts`:
     - `default-src 'self'`
     - `script-src 'self' 'unsafe-inline'` (disesuaikan dengan hidrasi Next.js)
     - `connect-src 'self' https://*.supabase.co wss://*.supabase.co` (hanya mengizinkan koneksi API dan Realtime ke Supabase)
     - `img-src 'self' data: blob: https:`
     - `object-src 'none'`
* **Target Commit:** `feat(security): define strict content security policy rules`
* **Verifikasi & Pengujian:**
  Mencoba memuat koneksi fetch ke domain liar yang tidak terdaftar akan otomatis diblokir oleh mesin peramban dengan pesan error CSP.

---

### MODUL 13: Request Origin & CSRF Header Validation
* **Tingkat Ancaman:** 🟡 Sedang
* **Kategori:** Network Defense
* **Celah & Skenario Serangan:**
  Serangan Cross-Site Request Forgery (CSRF) memanfaatkan sesi aktif pengguna di peramban untuk mengeksekusi aksi mutasi data tak diinginkan saat pengguna membuka tab lain di perambannya.
* **Solusi Teknis:**
  1. Memvalidasi header `Origin`, `Host`, dan `Sec-Fetch-Site` pada setiap request API mutasi.
  2. Menolak request jika nilai `Sec-Fetch-Site` bernilai `cross-site` untuk rute-rute mutasi data kasir.
* **Target Commit:** `fix(security): validate request origin and headers against csrf`
* **Verifikasi & Pengujian:**
  Request POST/PUT yang dikirim dengan header Origin eksternal akan ditolak dengan respons status `403 Forbidden`.

---

### MODUL 14: Server-Side Price & Subtotal Validation (Anti-Price Tampering)
* **Tingkat Ancaman:** 🔴 Kritis
* **Kategori:** Financial & Business Logic Integrity
* **Celah & Skenario Serangan:**
  Pada fungsi `checkout` di `src/services/transactionService.ts`, klien mengirim array item yang memuat `unit_price` dan `subtotal` hasil hitungan JavaScript frontend. Fungsi stored procedure `create_pos_transaction` saat ini langsung mempercayai `v_item.unit_price` yang dikirim dari klien.
  Jika seseorang memodifikasi memori keranjang via console, ia dapat membeli minyak goreng Rp 35.000 dengan harga Rp 500.
* **Solusi Teknis:**
  1. Memodifikasi fungsi `create_pos_transaction` di PostgreSQL agar selalu mengambil `sell_price` resmi langsung dari tabel `products`:
     ```sql
     SELECT sell_price INTO v_official_price FROM products WHERE id = v_item.product_id;
     v_item_subtotal := v_official_price * v_item.quantity;
     ```
  2. Menghitung total keseluruhan transaksi secara independen di dalam transaksi database dan membandingkannya dengan `p_total_amount`. Jika ada selisih, gagalkan transaksi dengan pesan `Manipulasi harga terdeteksi`.
* **Target Commit:** `fix(security): recalculate and verify product prices server-side during checkout`
* **Verifikasi & Pengujian:**
  Percobaan pengiriman request transaksi dengan harga buatan yang lebih murah dari katalog produk akan digagalkan oleh database engine.

---

### MODUL 15: Runtime Input Schema Validation (Zod)
* **Tingkat Ancaman:** 🟠 Tinggi
* **Kategori:** Data Integrity & Validation
* **Celah & Skenario Serangan:**
  Pembuatan produk, pengeditan supplier, atau pencatatan nomor handphone pelanggan menerima objek tanpa validasi tipe runtime yang ketat. Input seperti teks 10.000 karakter atau format angka tidak lazim dapat menyebabkan crash atau buffer issue.
* **Solusi Teknis:**
  1. Membangun skema validasi runtime menggunakan Zod untuk semua data masukan:
     - `ProductInputSchema`: SKU alfanumerik (3–30 karakter), harga bilangan positif, stok bilangan bulat non-negatif.
     - `SupplierInputSchema`: Nama valid, nomor telepon format Indonesia.
     - `TransactionInputSchema`: Validasi format nomor struk, metode pembayaran yang diizinkan (`Tunai` | `QRIS`).
* **Target Commit:** `feat(security): enforce runtime input schema validation for data mutations`
* **Verifikasi & Pengujian:**
  Formulir menolak secara instan data yang melebihi batas panjang karakter atau format angka yang tidak valid sebelum dikirimkan ke jaringan.

---

### MODUL 16: XSS Sanitization & Safe WhatsApp URL Encoding
* **Tingkat Ancaman:** 🟠 Tinggi
* **Kategori:** Output Encoding & Anti-XSS
* **Celah & Skenario Serangan:**
  Nama produk, nama toko, dan nomor telepon pelanggan dicetak pada struk thermal peramban dan di-encode ke tautan WhatsApp API `https://wa.me/{phone}?text={encoded}`. Karakter spesial seperti tanda petik, tag `<script>`, atau karakter kontrol newline dapat merusak URL WhatsApp atau memicu injeksi skrip saat struk dipratinjau.
* **Solusi Teknis:**
  1. Menerapkan fungsi `sanitizeHtmlText()` untuk membersihkan karakter berbahaya sebelum dirender ke HTML.
  2. Menerapkan fungsi pembentukan URL WhatsApp yang aman menggunakan `encodeURIComponent` ketat dengan sanitasi karakter nomor telepon (hanya digit `0-9`).
* **Target Commit:** `fix(security): sanitize user input and escape receipt outputs against xss`
* **Verifikasi & Pengujian:**
  Nama produk yang mengandung karakter `<img src=x onerror=alert(1)>` dirender sebagai teks biasa yang aman dan tidak mengeksekusi skrip JavaScript.

---

### MODUL 17: Validasi Integritas Pembayaran & Kembalian Server-Side
* **Tingkat Ancaman:** 🟠 Tinggi
* **Kategori:** Business Logic Integrity
* **Celah & Skenario Serangan:**
  Kasir dapat tidak sengaja atau sengaja mencatat transaksi tunai di mana `cash_received` (uang tunai diterima) lebih sedikit dari total belanjaan, tetapi status transaksi tetap tersimpan sebagai `Selesai`, menyebabkan ketidakcocokan fisik kas laci uang.
* **Solusi Teknis:**
  1. Menambahkan validasi ketat di RPC database:
     ```sql
     IF p_payment_method = 'Tunai' AND p_cash_received < p_total_amount THEN
         RAISE EXCEPTION 'Uang tunai yang diterima (Rp %) kurang dari total transaksi (Rp %)', p_cash_received, p_total_amount;
     END IF;
     ```
  2. Menghitung nilai kembalian secara otomatis: `cash_change := p_cash_received - p_total_amount`.
* **Target Commit:** `fix(security): validate cash payment balance and change server-side`
* **Verifikasi & Pengujian:**
  Transaksi kasir tunai dengan uang bayar yang kurang dari total tagihan ditolak secara otomatis oleh sistem.

---

### MODUL 18: Secure Expiring Tokens for Mobile Scanner
* **Tingkat Ancaman:** 🟠 Tinggi
* **Kategori:** Realtime Channel Security
* **Celah & Skenario Serangan:**
  Fitur pemindai kamera HP di `/scan` menggunakan channel Realtime Supabase untuk mengirimkan hasil scan ke kasir desktop. Jika channel hanya menggunakan ID statis atau publik tanpa autentikasi, pihak lain di jaringan yang sama dapat mengirimkan event `barcode-scanned` palsu dan memasukkan barang siluman ke keranjang kasir.
* **Solusi Teknis:**
  1. Menghasilkan token pairing kriptografis acak (UUID v4) dengan masa berlaku (TTL) 10 menit setiap kali modal pairing dibuka di desktop kasir.
  2. Perangkat HP pemindai wajib menyertakan token pairing yang valid saat mengirimkan broadcast scan.
  3. Kasir desktop menolak broadcast yang membawa token kadaluarsa atau tidak cocok.
* **Target Commit:** `feat(security): secure mobile barcode scanner realtime channel with expiring tokens`
* **Verifikasi & Pengujian:**
  Event scan dengan token pairing yang salah atau sudah kadaluarsa ditolak oleh kasir desktop dan tidak dimasukkan ke keranjang belanja.

---

### MODUL 19: Sanitasi Pesan Error (Anti-Information Disclosure)
* **Tingkat Ancaman:** 🟡 Sedang
* **Kategori:** Error Handling & Reconnaissance Defense
* **Celah & Skenario Serangan:**
  Blok `catch (error)` pada kode saat ini menampilkan `error.message` mentah langsung ke notifikasi UI. Pesan error database seperti `relation "products" does not exist` atau detail *PostgreSQL foreign key constraint* memberikan informasi berharga bagi penyerang untuk memetakan arsitektur database.
* **Solusi Teknis:**
  1. Membuat fungsi utilitas `getSafeErrorMessage(error: unknown): string`.
  2. Detail teknis hanya dicatat di `console.error` saat `process.env.NODE_ENV === 'development'`.
  3. Di lingkungan produksi, kembalikan pesan yang ramah pengguna dan terstandarisasi (misal: `"Gagal memproses transaksi kasir. Silakan coba kembali."`).
* **Target Commit:** `fix(security): sanitize database error messages to prevent information disclosure`
* **Verifikasi & Pengujian:**
  Simulasi error koneksi atau constraint database menampilkan pesan toast yang bersih tanpa membeberkan nama tabel atau sintaks SQL internal.

---

### MODUL 20: Immutable Security Audit Trail Logging
* **Tingkat Ancaman:** 🟠 Tinggi
* **Kategori:** Compliance, Audit & Non-Repudiation
* **Celah & Skenario Serangan:**
  Jika terjadi kehilangan inventaris atau selisih uang, pemilik toko tidak dapat melacak staf mana yang mengubah harga produk, siapa yang melakukan pembatalan transaksi, atau kapan penyesuaian stok dilakukan.
* **Solusi Teknis:**
  1. Membuat tabel PostgreSQL `audit_logs` yang bersifat *append-only* (hanya bisa diisi, tidak bisa diubah atau dihapus oleh kasir):
     - `id` (UUID)
     - `user_id` (UUID)
     - `action` (Text: `'HARGA_DIUBAH'`, `'STOK_DISESUAIKAN'`, `'TRANSAKSI_DIBATALKAN'`, `'LOGIN'`)
     - `entity` (Text: `'products'`, `'transactions'`)
     - `old_values` (JSONB)
     - `new_values` (JSONB)
     - `ip_address` / `user_agent` (Text)
     - `created_at` (TIMESTAMPTZ)
  2. Memasang trigger database otomatis untuk mendokumentasikan setiap modifikasi penting.
* **Target Commit:** `feat(security): add immutable security audit trail logging`
* **Verifikasi & Pengujian:**
  Setiap kali ada harga produk yang diperbarui atau transaksi dibatalkan, baris log baru otomatis tercatat pada tabel `audit_logs`.

---

## 🚀 PANDUAN EKSEKUSI BAGI DALVIN

Setiap kali Dalvin ingin menjalankan perbaikan keamanan, Dalvin cukup mengirimkan pesan singkat, contohnya:
> *"Lanjut eksekusi nomor 1"* atau *"Kerjakan nomor 5"*

AI Assistant akan:
1. Memverifikasi kode terdampak.
2. Mengimplementasikan proteksi keamanan secara menyeluruh tanpa merusak fungsionalitas aplikasi yang sudah berjalan.
3. Melakukan pengujian/verifikasi.
4. Melakukan Git Commit mandiri dengan format Conventional Commit yang sudah ditetapkan.
5. Memperbarui status checklist di dokumen ini dari `[ ] Antrean` menjadi `[x] Selesai`.
