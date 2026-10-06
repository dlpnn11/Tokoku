# 💡 03 — PELAJARAN NYATA DARI PROYEK TOKOKU: RETROSPEKTIF, KATALOG BUG & SOLUSI

> Dokumen ini adalah catatan "rekam medis" teknis dari seluruh proses pembuatan **TokoKu**.
> Setiap bug, jebakan layout, kegagalan render, hingga kesalahpahaman arsitektur yang pernah terjadi didokumentasikan di sini secara jujur bersama akar masalah, solusi definitif, dan aturan pencegahannya.
>
> **Baca dokumen ini sebelum mulai ngoding proyek baru agar kamu tidak mengulang kesalahan yang sama!**

---

## DAFTAR ISI

1. [Katalog Masalah Nyata & Solusi Definitif](#1-katalog-masalah-nyata--solusi-definitif)
   - [Bug 1: Pelanggaran Urutan React Hook (Minified React Error #310)](#bug-1-pelanggaran-urutan-react-hook-minified-react-error-310)
   - [Bug 2: Variabel Undefined pada Layout / Header (`router` & `logout`)](#bug-2-variabel-undefined-pada-layout--header-router--logout)
   - [Bug 3: Struk Gambar PNG Terpotong Kanan & Buram (html2canvas)](#bug-3-struk-gambar-png-terpotong-kanan--buram-html2canvas)
   - [Bug 4: Modal Terpotong Vertikal pada Layar Laptop (Scaling 125% - 150%)](#bug-4-modal-terpotong-vertikal-pada-layar-laptop-scaling-125---150)
   - [Bug 5: Grafik Penjualan Tidak Muncul / Tinggi 0px (Recharts Flex Bug)](#bug-5-grafik-penjualan-tidak-muncul--tinggi-0px-recharts-flex-bug)
   - [Bug 6: Dilema WhatsApp Share (Web Share API vs wa.me vs Desktop WhatsApp)](#bug-6-dilema-whatsapp-share-web-share-api-vs-wame-vs-desktop-whatsapp)
   - [Bug 7: Suara Beep Scanner (Audio MP3 Aset vs Web Audio API Sintesis)](#bug-7-suara-beep-scanner-audio-mp3-aset-vs-web-audio-api-sintesis)
   - [Bug 8: Inkonsistensi Gaya Komponen Antar Modul (Dropdown Lama vs Baru)](#bug-8-inkonsistensi-gaya-komponen-antar-modul-dropdown-lama-vs-baru)
   - [Bug 9: Repositori Kotor & Penempatan Aturan AI (.agents/ vs Root)](#bug-9-repositori-kotor--penempatan-aturan-ai-agents-vs-root)
   - [Bug 10: Respons AI Terpotong / Kuota Habis di Tengah Eksekusi](#bug-10-respons-ai-terpotong--kuota-habis-di-tengah-eksekusi)
2. [Pelajaran Arsitektur & Rekayasa Software](#2-pelajaran-arsitektur--rekayasa-software)
   - [A. Keberhasilan Interview Awal: Kenapa Ini Menghemat 80% Waktu](#a-keberhasilan-interview-awal-kenapa-ini-menghemat-80-waktu)
   - [B. Dual-Mode Store (Mock LocalStorage vs Supabase Live)](#b-dual-mode-store-mock-localstorage-vs-supabase-live)
   - [C. Realtime Barcode Scanner Handphone: Batasan HTTPS & Kamera](#c-realtime-barcode-scanner-handphone-batasan-https--kamera)
   - [D. Mengapa Build Hijau Bukan Jaminan Tampilan Benar](#d-mengapa-build-hijau-bukan-jaminan-tampilan-benar)
3. [10 Aturan Emas untuk Proyek Berikutnya](#3-10-aturan-emas-untuk-proyek-berikutnya)

---

## 1. KATALOG MASALAH NYATA & SOLUSI DEFINITIF

### Bug 1: Pelanggaran Urutan React Hook (Minified React Error #310)

#### Gejala yang Dialami
Saat Dalvin mengklik tombol "Lihat Detail" pada salah satu transaksi di halaman Riwayat Struk, aplikasi tiba-tiba crash dengan layar putih dan konsol browser mencatat:
```text
Uncaught Error: Minified React error #310; visit https://react.dev/errors/310 for the full message...
at Object.useState ...
```

#### Akar Masalah (Root Cause)
Pesan error React `#310` berarti: *"Rendered more hooks than during the previous render"*.
Pada komponen modal detail riwayat (`ReceiptDetailModal.tsx`), terdapat deklarasi `useState` atau hook lain yang ditaruh **setelah** conditional return atau di dalam blok percabangan:
```tsx
// ❌ KODE RUSAK (Melanggar Rules of Hooks)
function ReceiptDetailModal({ transaction, isOpen, onClose }) {
  if (!isOpen || !transaction) {
    return null; // <-- EARLY RETURN DI SINI
  }

  // Hook ini baru dieksekusi HANYA jika isOpen bernilai true!
  const [selectedFormat, setSelectedFormat] = useState('digital'); 
  // Saat modal ditutup, jumlah hook berkurang -> REACT CRASH #310!
}
```

#### Solusi Definitif
Seluruh hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) **WAJIB** dideklarasikan di baris-baris paling atas komponen, sebelum ada `if` statement atau `return` apa pun:
```tsx
// ✅ KODE BENAR & AMAN
function ReceiptDetailModal({ transaction, isOpen, onClose }) {
  // Seluruh hooks dipanggil tanpa syarat di atas
  const [selectedFormat, setSelectedFormat] = useState('digital');
  const [isCopied, setIsCopied] = useState(false);

  // Early return HANYA boleh ditaruh setelah seluruh hooks selesai dipanggil
  if (!isOpen || !transaction) {
    return null;
  }

  return (/* JSX Modal */);
}
```

#### Aturan Pencegahan
- Pasang ESLint rule `"react-hooks/rules-of-hooks": "error"` dan `"react-hooks/exhaustive-deps": "warn"`.
- Jangan pernah membungkus React hook di dalam `if`, loop, atau setelah baris `if (...) return`.

---

### Bug 2: Variabel Undefined pada Layout / Header (`router` & `logout`)

#### Gejala yang Dialami
Saat melakukan kompilasi produksi via `npm run build`, terminal melempar error:
```text
src/components/layout/AppShell.tsx(33,7): error TS2304: Cannot find name 'router'.
src/components/layout/Header.tsx(144,7): error TS2552: Cannot find name 'logout'. Did you mean 'LogOut'?
```

#### Akar Masalah
Saat menambahkan fitur proteksi rute (auth guard) ke `AppShell` dan menambahkan dropdown profil user ke `Header`, AI memanggil `router.push('/login')` dan `logout()`, namun lupa menginisialisasi `const router = useRouter()` serta lupa mengekstrak fungsi `logout` dari hook `useAuthStore()`.
Perlu dicatat bahwa error ini **sering lolos di server dev Turbopack/Vite** karena file yang belum dibuka di browser tidak selalu dikompilasi secara menyeluruh, tetapi langsung **meledak saat build produksi**.

#### Solusi Definitif
Selalu pastikan hook router diinisialisasi dan fungsi store diekstrak lengkap:
```tsx
// Di AppShell.tsx
import { useRouter } from 'next/navigation';
// ...
export function AppShell({ children }: AppShellProps) {
  const router = useRouter(); // <-- Pastikan ini dideklarasikan!
  // ...
}

// Di Header.tsx
function UserProfileDropdown() {
  const router = useRouter();
  const { currentUser, switchRole, logout } = useAuthStore(); // <-- logout diekstrak dari store
  // ...
}
```

#### Aturan Pencegahan
- **Wajib `npm run build` sebelum push!** Jangan pernah menganggap kode bebas bug hanya karena di layar preview dev berjalan. Kompiler TypeScript adalah jaring pengaman terbaik.

---

### Bug 3: Struk Gambar PNG Terpotong Kanan & Buram (html2canvas)

#### Gejala yang Dialami
Dalvin melaporkan: *"kenapa kepotong ya yang kanan, ketika aku download atau aku kirim ke wa juga kepotong gitu kayak mepet banget"*. Selain itu, teks struk terlihat agak buram/pecah saat dizoom di layar ponsel.

#### Akar Masalah
1. **Windows Display Scaling (125% - 150%):** Pada laptop modern, Windows memperbesar skala display (DPI scaling). Saat library `html2canvas` melakukan kalkulasi posisi koordinat DOM, nilai floating-point (misal lebar 349.667px) dibulatkan secara tidak tepat sehingga sisi kanan kanvas terpotong beberapa piksel.
2. **Width Dinamis / Flex Container:** Elemen struk berada di dalam container flexbox yang lebarnya mengikuti parent modal (`w-full` dengan padding), sehingga saat di-render ke kanvas virtual, lebarnya berubah tergantung ukuran scrollbar.
3. **Scale Factor Rendah:** Default `scale: 1` pada html2canvas menghasilkan gambar dengan resolusi setara 72-96 DPI, yang terlihat pecah di layar retina smartphone modern.

#### Solusi Definitif
1. Kunci elemen struk ke container **fixed width** yang pasti (misal: `w-[360px]` atau `w-[380px]`).
2. Sediakan padding kanan yang aman (minimal `pr-6` atau `24px`).
3. Pada opsi `html2canvas`, set `scale: 2` atau `scale: 3`, tentukan `windowWidth`, dan gunakan `backgroundColor: '#FFFFFF'`:

```tsx
const canvas = await html2canvas(receiptElement, {
  scale: 2.5, // Menghasilkan gambar ultra-tajam
  useCORS: true,
  allowTaint: true,
  backgroundColor: '#FFFFFF',
  width: receiptElement.offsetWidth,
  height: receiptElement.offsetHeight,
  windowWidth: receiptElement.scrollWidth,
  onclone: (clonedDoc) => {
    // Pastikan clone DOM tidak memiliki scrollbar dan tidak overflow
    const el = clonedDoc.getElementById('digital-receipt-canvas');
    if (el) {
      el.style.width = '380px';
      el.style.maxWidth = '380px';
      el.style.margin = '0';
      el.style.padding = '24px';
    }
  }
});
```

#### Aturan Pencegahan
- Elemen apa pun yang akan diekspor menjadi gambar/PDF tidak boleh menggunakan lebar dinamis `w-full` tanpa batasan piksel.
- Selalu uji hasil unduhan gambar dengan membuka file gambarnya secara langsung di galeri foto atau image viewer, bukan sekadar melihat tampilan pratinjaunya di browser.

---

### Bug 4: Modal Terpotong Vertikal pada Layar Laptop (Scaling 125% - 150%)

#### Gejala yang Dialami
Pada modal detail struk, modal stock opname, dan modal supplier:
- Tombol close silang (X) di header atas kadang terpotong.
- Tombol aksi utama ("Selesai", "Simpan", "Cetak") di bagian bawah tenggelam ke bawah layar sehingga tidak bisa diklik tanpa mengecilkan zoom browser ke 80%.

#### Akar Masalah
Banyak developer mendesain modal dengan asumsi resolusi layar adalah `1920x1080` pada scaling 100% (tinggi efektif 1080px). 
Namun pada kenyataannya, sebagian besar laptop 14 inci menggunakan scaling Windows 125% atau 150%. 
Pada scaling 150%, ruang vertikal layar efektif hanya **±720px**. Jika browser memiliki tab bar, address bar, dan bookmark bar (memakan ~120px), tinggi viewport yang tersisa untuk aplikasi **hanya tinggal ~600px**!
Jika tinggi modal statis mencapai 680px, maka bagian bawah modal pasti keluar dari layar.

#### Solusi Definitif (Struktur Modal 3-Bagian Anti-Bocor)
Terapkan arsitektur layout CSS flexbox dengan `max-h-[85vh]` atau `max-h-[90vh]`:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
  {/* Card Modal: Batasi tinggi maksimal dan gunakan flex-col */}
  <div className="flex flex-col w-full max-w-lg max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
    
    {/* 1. Header: sticky/flex-shrink-0 (TIDAK PERNAH TERPOTONG) */}
    <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
      <h3 className="text-lg font-bold text-gray-900">Detail Transaksi</h3>
      <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* 2. Body: flex-1 dan overflow-y-auto (BISA DIGULIR JIKA KEPANJANGAN) */}
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {children}
    </div>

    {/* 3. Footer: flex-shrink-0 (SELALU KELIHATAN & SIAP DIKLIK) */}
    <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
      <button onClick={onClose} className="px-4 py-2 border rounded-xl font-medium">Batal</button>
      <button onClick={onSave} className="px-5 py-2 bg-[#6FA084] text-white rounded-xl font-semibold">Simpan</button>
    </div>

  </div>
</div>
```

---

### Bug 5: Grafik Penjualan Tidak Muncul / Tinggi 0px (Recharts Flex Bug)

#### Gejala yang Dialami
Dalvin bertanya: *"btw ini di page laporan kenapa tidak ada grafiknya ya?"*.
Saat halaman laporan dibuka, kartu grafik kosong putih. Tidak ada error di console dan data transaksi ada.

#### Akar Masalah
Pustaka visualisasi grafik seperti Recharts (`<ResponsiveContainer width="100%" height="100%">`) menghitung dimensinya berdasarkan dimensi bounding-box elemen parent-nya di DOM.
Jika elemen parent adalah container flexbox tanpa tinggi definitif (misalnya `<div className="flex-1">` di dalam card tanpa `h-[...]`), browser menetapkan tinggi awal elemen tersebut sebagai `0px`.
Recharts mendeteksi `height: 0px`, sehingga kanvas grafik dirender dengan tinggi 0 piksel (tidak kelihatan).

#### Solusi Definitif
Jangan pernah mengandalkan `height="100%"` di dalam container flex tanpa tinggi eksplisit. **Selalu berikan pembungkus (wrapper div) dengan tinggi pasti dalam satuan piksel**:

```tsx
{/* ❌ SALAH: Tinggi parent tidak didefinisikan */}
<div className="w-full flex-1">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} ... />
  </ResponsiveContainer>
</div>

{/* ✅ BENAR: Berikan tinggi eksplisit yang pasti */}
<div className="w-full h-[320px] min-h-[300px]">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} ... />
  </ResponsiveContainer>
</div>
```

---

### Bug 6: Dilema WhatsApp Share (Web Share API vs wa.me vs Desktop WhatsApp)

#### Gejala yang Dialami
Dalam perjalanannya, fitur kirim struk ke WhatsApp mengalami beberapa kali perubahan kebutuhan:
1. Awalnya teks biasa via link URL `https://wa.me/nomor?text=...`.
2. Diubah ingin format gambar PNG agar rapi seperti bukti transfer bank.
3. Terjadi kendala saat kasir memakai laptop: membuka WhatsApp Web di laptop memerlukan scan QR code yang memakan waktu jika belum login, atau membuka WhatsApp Desktop yang memerlukan nomor tersimpan.
4. Di HP kasir, ingin langsung klik bagikan dan muncul aplikasi WhatsApp.

#### Akar Masalah
- Protokol Web Share API (`navigator.share({ files: [imageFile] })`) **hanya didukung penuh di browser mobile (Android Chrome, iOS Safari) melalui koneksi aman HTTPS**.
- Browser Desktop (Chrome Desktop di Windows/Mac) tidak mengizinkan pengiriman file gambar langsung ke aplikasi pihak ketiga via protokol URL schema sederhana.

#### Solusi Definitif (Solusi Hibrida 2-Arah)
Sediakan dua alur yang otomatis beradaptasi dengan perangkat:

```tsx
const handleShareWhatsApp = async (receiptBlob: Blob, invoiceNo: string, customerPhone?: string) => {
  const file = new File([receiptBlob], `struk-${invoiceNo}.png`, { type: 'image/png' });

  // 1. JIKA MENDUKUNG WEB SHARE API (Umumnya di Smartphone)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Struk Transaksi #${invoiceNo}`,
        text: `Terima kasih telah berbelanja di TokoKu! Berikut bukti transaksi Anda.`,
        files: [file],
      });
      return;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('Web Share gagal, beralih ke fallback', err);
      }
    }
  }

  // 2. FALLBACK DI DESKTOP / LAPTOP KASIR
  // Unduh gambar otomatis ke laptop
  const url = URL.createObjectURL(receiptBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `struk-${invoiceNo}.png`;
  a.click();
  URL.revokeObjectURL(url);

  // Jika kasir memasukkan nomor WA pelanggan, buka chat langsung
  if (customerPhone) {
    const cleanPhone = customerPhone.replace(/\D/g, '').replace(/^0/, '62');
    const waText = encodeURIComponent(`Halo, terima kasih telah berbelanja di TokoKu! Struk transaksi #${invoiceNo} telah kami siapkan.`);
    window.open(`https://wa.me/${cleanPhone}?text=${waText}`, '_blank');
  } else {
    // Sediakan tombol salin teks ringkasan untuk ditempel di WA Desktop
    toast.info('Gambar struk berhasil diunduh. Anda dapat melampirkannya langsung di WhatsApp.');
  }
};
```

---

### Bug 7: Suara Beep Scanner (Audio MP3 Aset vs Web Audio API Sintesis)

#### Gejala yang Dialami
Fitur scanner barcode membutuhkan feedback audio instan (bunyi "beep") setiap kali barcode berhasil dibaca agar kasir tahu barang telah masuk keranjang tanpa harus menoleh ke layar laptop.
Pendekatan awal yang sering dipakai adalah memutar file audio statis: `new Audio('/sounds/beep.mp3').play()`. Namun pendekatan ini:
- Gagal berbunyi di beberapa browser karena kebijakan browser autoplay restrictions.
- Memerlukan file MP3 fisik di folder `public/`.
- Memiliki latency ~100-200ms saat pertama kali memuat file audio dari disk.

#### Solusi Definitif: Web Audio API Oscillator (0 Dependencies & Latency 0ms)
Gunakan synthesizer suara bawaan browser tanpa file audio eksternal apa pun:

```ts
// src/lib/audio.ts
export function playBeepSound(frequency = 1200, durationMs = 80) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    console.warn('AudioContext tidak dapat diputar:', e);
  }
}
```

---

### Bug 8: Inkonsistensi Gaya Komponen Antar Modul (Dropdown Lama vs Baru)

#### Gejala yang Dialami
Pada tahap awal, modal tambah produk menggunakan elemen HTML bawaan `<select>` yang tampilannya kaku dan abu-abu kuno. Setelah Dalvin meminta tampilan diperbaiki, modul produk dirombak memakai custom dropdown yang estetik (flat, icon kategori, rounded).
Namun ketika modul Supplier dan Stock Opname dibuat kemudian, AI kembali menggunakan elemen `<select>` polos yang membuat UI terasa tidak konsisten.

#### Akar Masalah
AI memperlakukan perbaikan sebagai perbaikan lokal per file jika tidak ada instruksi tegas untuk mengekstraknya menjadi komponen global yang tercatat di `docs/PANDUAN_DESIGN_SYSTEM.md`.

#### Solusi Definitif
1. Setiap kali membuat atau memperbaiki pola komponen UI yang bagus, **segera ekstrak ke folder komponen bersama**:
   `src/components/ui/CustomSelect.tsx` atau `src/components/ui/SearchableDropdown.tsx`.
2. Catat komponen tersebut di `docs/PANDUAN_DESIGN_SYSTEM.md` dengan instruksi: *"Gunakan `<CustomSelect>` untuk semua input dropdown di seluruh aplikasi, dilarang memakai tag `<select>` HTML polos."*

---

### Bug 9: Repositori Kotor & Penempatan Aturan AI (.agents/ vs Root)

#### Gejala yang Dialami
Dalvin menyadari: *"dan juga aku ingin membahas masalah struktur folder, misal itu ada file agents.md dan gemini.md, kan gaenak kalo itu dilihat orang orang ketika membuka project ku di GitHub, apakah tidak bisa jika dimasukkan kedalam folder gitu, tapi apakah jika dimasukkan ke dalam folder nanti ketika room chat baru, kamu sebagai antigravity tau bahwa itu harus dibaca?"*

#### Analisis & Solusi
Pertanyaan ini sangat tepat dan kritis untuk kebersihan repositori profesional.
- **Standar AI Tooling Modern:** Lingkungan AI seperti Antigravity dan IDE agen modern mendukung folder `.agents/` di root proyek sebagai direktori resmi konfigurasi agen.
- **Struktur Rapi:**
  - Letakkan aturan di `.agents/AGENTS.md` (dan `.agents/GEMINI.md`).
  - Letakkan seluruh blueprint di `docs/`.
  - Letakkan panduan teknis tambahan di `docs/guides/`.
- **Hasil:** Root direktori repo hanya berisi `README.md`, file konfigurasi proyek standar (`package.json`, `tailwind.config.ts`, `next.config.ts`), dan folder kode (`src/`). Repositori terlihat 100% profesional di GitHub.

---

### Bug 10: Respons AI Terpotong / Kuota Habis di Tengah Eksekusi

#### Gejala yang Dialami
Respons AI terputus tiba-tiba atau muncul pesan kuota habis saat menjelaskan atau membuat file besar.

#### Pelajaran & Strategi Pencegahan
1. **Pecah File Besar:** Jangan meminta AI menulis kode 5 halaman sekaligus dalam satu pesan. Mintalah per modul atau per file.
2. **Auto-Commit Setiap Langkah:** Kebijakan auto-commit (`git add .`, `git commit`, `git push`) membuktikan perannya sebagai penyelamat. Ketika chat terputus, pekerjaan yang sudah dikerjakan tidak hilang karena sudah aman berada di Git commit.
3. **Handover Bersih:** Gunakan prompt handover (lihat Prompt 14 di file 02) saat membuka chat baru untuk melanjutkan tanpa kehilangan konteks.

---

## 2. PELAJARAN ARSITEKTUR & REKAYASA SOFTWARE

### A. Keberhasilan Interview Awal: Kenapa Ini Menghemat 80% Waktu
Di awal TokoKu, sesi wawancara menghasilkan keputusan-keputusan vital:
- Fitur diskon sengaja dihilangkan karena tidak dibutuhkan warung kelontong sederhana.
- Integrasi payment gateway QRIS dinamis dihilangkan (cukup QRIS statis tercetak).
- Pajak ditetapkan 0%.
- Format struk ditetapkan 58mm.

**Dampaknya:** Menghemat ribuan baris kode yang tidak perlu, mencegah kompleksitas database, dan mempercepat rilis aplikasi dari hitungan minggu menjadi hitungan hari.

---

### B. Dual-Mode Store (Mock LocalStorage vs Supabase Live)
Salah satu keputusan arsitektur terbaik di TokoKu adalah membuat Zustand store memiliki mode fallback:
- Jika koneksi Supabase Cloud aktif dan kredensial terisi, data disinkronkan ke PostgreSQL.
- Jika Supabase belum dikonfigurasi atau offline, store otomatis beroperasi menggunakan `localStorage` dengan data seed awal.

**Manfaat:** Developer atau penguji bisa langsung menjalankan aplikasi dan menguji seluruh fitur kasir di laptop tanpa harus menunggu setup akun database cloud selesai.

---

### C. Realtime Barcode Scanner Handphone: Batasan HTTPS & Kamera
Fitur menghubungkan kamera HP sebagai scanner kasir laptop secara realtime adalah fitur wow yang membedakan TokoKu dari POS kasir konvensional.
Pelajaran teknis penting:
1. **Wajib HTTPS:** Browser modern (Chrome, Safari) **memblokir akses kamera (`getUserMedia`)** jika halaman tidak dibuka lewat HTTPS atau `localhost`. Saat menguji di HP melalui jaringan Wi-Fi lokal (misal: `http://192.168.1.10:3000`), kamera HP akan menolak izin akses.
2. **Solusi untuk Testing HP:** Gunakan tunneling aman seperti ngrok (`npx ngrok http 3000`) atau deploy langsung ke Vercel (yang otomatis menyediakan HTTPS gratis).

---

### D. Mengapa Build Hijau Bukan Jaminan Tampilan Benar
Kompilasi TypeScript (`npm run build`) hanya memeriksa:
- Apakah nama variabel ada.
- Apakah tipe data cocok.
- Apakah sintaksis valid.

Kompiler **TIDAK TAHU**:
- Apakah tombol tertutup oleh navbar.
- Apakah teks font 9px terlalu kecil untuk dibaca mata manusia.
- Apakah container grafik Recharts memiliki tinggi 0 piksel.
- Apakah modal keluar dari batas viewport layar laptop.

**Kesimpulan:** Verifikasi visual manual di browser pada resolusi laptop nyata adalah bagian tak terpisahkan dari Definition of Done.

---

## 3. 10 ATURAN EMAS UNTUK PROYEK BERIKUTNYA

```text
1. WAWANCARA DULU, KODING NANTI: Selalu minta AI mengajukan 20-40 pertanyaan sebelum mulai.
2. REKOMENDASI DI TIAP PERTANYAAN: Pastikan AI menyertakan pilihan terbaiknya agar kamu tidak bingung.
3. SATU SUMBER ATURAN: Simpan SOP di `.agents/AGENTS.md` agar AI tidak berhalusinasi.
4. ZERO GRADIENTS: Gunakan warna solid, flat, dan harmonis demi estetika bersih dan profesional.
5. SCREEN SCALING AWARENESS: Desain modal selalu pakai `max-h-[85vh]` + scrollable body.
6. FIXED WIDTH UNTUK RENDER GAMBAR: Jangan pernah render canvas dari elemen flexbox lebar dinamis.
7. HOOKS DI PALING ATAS: Jangan pernah taruh React hooks di bawah conditional statement.
8. TINGGI PASTI UNTUK GRAFIK: Selalu bungkus grafik Recharts di div dengan tinggi piksel definitif.
9. DUAL SHARE STRATEGY: Web Share API untuk HP, Unduh + Link wa.me untuk Desktop.
10. VERIFIKASI SEBELUM SELESAI: npm run build lolos + cek visual di browser nyata.
```
