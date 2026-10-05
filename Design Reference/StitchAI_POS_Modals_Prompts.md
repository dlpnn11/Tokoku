# 🛒 Stitch AI — Supplemental Prompt Guide
## TokoKu POS & Inventory System — Missing Modals & Sub-Pages
### Extension of the Main Screen Prompt Guide

---

> **HOW TO USE THIS FILE**
> This file extends the main `StitchAI_POS_Prompts.md`. The Global Design System from
> that file is still in effect. Each prompt here generates a specific modal or sub-page.
> Paste each prompt block directly into Stitch AI, one at a time.
>
> ⚠️ **IMPORTANT:** Always instruct Stitch AI to use the same background screen (e.g.,
> the POS screen or Inventaris screen) behind each modal so the overlay context is clear.

---

## 🔒 DESIGN SYSTEM REMINDER
> Paste this reminder at the top of EVERY Stitch AI session before using any prompt below.

```
DESIGN SYSTEM CARRY-OVER — Match existing screens exactly:
• Page background : #F4F4F0 — flat solid cream. ⛔ NO GRADIENTS.
• Cards / Modals  : #FFFFFF — flat solid white, border-radius 12px–16px.
• Primary accent  : #6FA084 (Sage Green) — flat solid ONLY. ZERO gradient.
• Sidebar         : #2C2C2C solid flat dark, 220px wide.
• Header          : #FFFFFF solid, 64px, border-bottom 1px #E5E5E0.
• Font            : Inter. Body 14px #1A1A1A. Labels 12px #6B7280.
• ⛔ ABSOLUTELY NO GRADIENTS anywhere — not on modals, overlays, buttons,
  badges, inputs, or any other element. Flat solid colors only, always.
```

---
---

## 🖥️ SCREEN 2B — Modal: Tunda Transaksi (Hold Bill)

**Triggered by:** Clicking "Tunda Transaksi" button on the POS / Menu Kasir screen.
**Type:** Floating modal centered over the POS screen.

---

### PROMPT — Screen 2B

```
Generate a Desktop-First UI screen (1440×900px) for a Point of Sales and Inventory
Management System. THIS IS SCREEN 2B: Modal — Tunda Transaksi (Hold Bill).

The full POS split-screen (Screen 2) is visible in the background behind a dimmed
overlay. The modal floats centered on top of that background.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔  STRICT VISUAL RULES — ZERO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Background screen (POS): #F4F4F0 cream, dimmed with flat rgba(0,0,0,0.35) overlay.
  ⛔ The overlay must be flat solid — NO GRADIENT on the overlay itself.
• Modal card   : #FFFFFF — flat solid white, border-radius 16px.
• Primary accent: #6FA084 (Sage Green) — flat solid ONLY. NEVER gradient.
• Font         : Inter. Headings bold. Body 14px #1A1A1A.
• ⛔ NO GRADIENTS, NO GLASS EFFECTS, NO OMBRE anywhere on or around this modal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BACKGROUND CONTEXT (behind the modal)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Show the POS split-screen (Screen 2) faded in the background:
• Left sidebar #2C2C2C solid | Top header #FFFFFF solid.
• POS catalog left panel (dimmed) | Shopping cart right panel (dimmed).
• The Sage Green "BAYAR" button is visible but dimmed.
• Everything behind the modal should appear at ~40% opacity to show context.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODAL CARD — Tunda Transaksi
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Modal dimensions: 520px wide. Background #FFFFFF flat. Border-radius 16px.
Box shadow: 0 8px 32px rgba(0,0,0,0.18) — no glow, no gradient shadow.
Padding: 28px.

► MODAL HEADER:
  Left : flat pause icon (⏸) 22px #E8A838 | "Tunda Transaksi" 20px bold #1A1A1A.
  Right: close (×) button — flat #F4F4F0 bg, border-radius 6px, 32×32px,
         icon #6B7280. ⛔ No gradient on close button.
  Below title: "Transaksi saat ini akan disimpan sementara. Beri nama agar mudah ditemukan."
  13px #6B7280. Divider 1px #E5E5E0 below this subtitle.

► SECTION 1 — NAMA TRANSAKSI TERTUNDA:
  Label "Nama Transaksi (opsional)" 12px bold #6B7280, margin-bottom 6px.
  Input field:
  • Flat #FFFFFF bg | border 1.5px #E5E5E0 | border-radius 8px | height 44px
  • Padding 0 14px | font 14px #1A1A1A.
  • Placeholder text: "Contoh: Bapak Baju Merah, Meja 3..."
  • On focus: border 1.5px #6FA084 (flat solid — no glow, no shadow ring).
  Below input: helper text "Transaksi akan tersimpan di daftar tunda" 12px #9E9E9E.

  Cart summary chip below:
  • Flat #F4F4F0 bg | border 1px #E5E5E0 | border-radius 8px | padding 10px 14px.
  • "Keranjang saat ini: 3 item — Total Rp 27.500" 13px #6B7280.

  "Tunda Sekarang" button — full width:
  • Flat solid #E8A838 bg | white text | 14px bold | border-radius 10px | height 44px.
  • ⛔ NO GRADIENT. Flat solid amber fill only.

► DIVIDER with label — "atau lanjutkan transaksi yang sudah ditunda":
  Horizontal line 1px #E5E5E0 with centered label text 12px #9E9E9E.
  ⛔ No gradient on divider area.

► SECTION 2 — DAFTAR TRANSAKSI TERTUNDA:
  Label "Transaksi Tertunda (3)" 13px bold #6B7280. Margin-bottom 8px.

  Scrollable list of held transaction cards (max height ~240px, scrollable):
  Each held transaction card:
  • Flat #F9F9F7 bg | border 1px #E5E5E0 | border-radius 10px | padding 14px 16px.
  • Gap between cards: 8px.
  • Layout (horizontal):
    LEFT  : pause icon flat #E8A838 (16px) | transaction name bold 14px #1A1A1A
             | below name: "3 item · Rp 27.500" 12px #6B7280
             | small timestamp "15:45 WIB" 11px #9E9E9E.
    RIGHT : "Lanjutkan" button — flat solid #6FA084 bg, white text, 13px bold,
             border-radius 8px, height 34px, width 96px. ⛔ NO GRADIENT.
            | trash icon button — flat #FFF0F0 bg, icon #D64545, 32×32px,
             border-radius 6px. ⛔ No gradient.

  Show exactly 3 held transaction cards:
  Card 1: "Bapak Baju Merah"    | 3 item · Rp 27.500  | 15:45 WIB
  Card 2: "Ibu Belanja Bulanan" | 8 item · Rp 112.000 | 15:12 WIB
  Card 3: "Pelanggan Antre 2"   | 1 item · Rp 3.500   | 14:58 WIB

► MODAL FOOTER:
  Divider 1px #E5E5E0. Then full-width "Batal" button:
  • Flat #FFFFFF bg | border 1.5px #E5E5E0 | text #6B7280 | 14px | border-radius 10px
  • height 44px. ⛔ No gradient.

OUTPUT: 1440×900px. POS screen visible behind a flat dimmed overlay. Tunda Transaksi
modal centered, open, showing name input + 3 held transaction cards.
⛔ ZERO GRADIENTS anywhere — not on overlay, modal, buttons, or any element.
```

---
---

## 🖥️ SCREEN 3B — Inventaris: Tab Kategori

**Screen Name:** `Inventaris — Kategori`
**Role:** Pemilik (Owner) only | **Active Sidebar:** Inventaris | **Active Tab:** Kategori

---

### PROMPT — Screen 3B

```
Generate a Desktop-First UI screen (1440×900px) for a Point of Sales and Inventory
Management System. THIS IS SCREEN 3B: Inventaris — Tab Kategori (Category Management).
This is the same Inventaris screen as Screen 3, but with the "Kategori" tab active.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔  STRICT VISUAL RULES — ZERO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Page background : #F4F4F0 — flat solid cream. ⛔ ABSOLUTELY NO GRADIENTS.
• All cards       : #FFFFFF — flat solid white, border-radius 14px.
• Primary accent  : #6FA084 (Sage Green) — flat solid ONLY. Zero gradient.
• Font            : Inter. Body 14px #1A1A1A. Labels 12px #6B7280.
• ⛔ NO GRADIENTS, NO GLASS, NO GLOSS, NO OMBRE anywhere on this screen.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSISTENT SIDEBAR (identical to all previous screens)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Width 220px | Background #2C2C2C solid flat.
Nav items (Pemilik role — all 5 visible):
  1. Dashboard   (icon #9E9E9E, inactive)
  2. POS / Kasir (icon #9E9E9E, inactive)
  3. Inventaris  ← ACTIVE (icon #6FA084, left solid bar 3px #6FA084)
  4. Riwayat     (icon #9E9E9E, inactive)
  5. Laporan     (icon #9E9E9E, inactive)
Bottom: "BS" avatar | "Budi Santoso" | "Pemilik" pill flat #6FA084 bg white text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSISTENT TOP HEADER BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background #FFFFFF solid | Height 64px | Border-bottom 1px #E5E5E0.
Left  : "Inventaris" — 24px bold #1A1A1A.
Right : "Senin, 28 September 2026 | 23:35 WIB" (13px #6B7280)
        → divider → "BS" avatar → "Budi Santoso" → "Pemilik" pill flat #6FA084.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAIN CONTENT AREA — background #F4F4F0, padding 28px
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

► TAB NAVIGATION (underline style, at top of main white content card):
  • "Produk"   inactive: 14px #6B7280, no underline.
  • "Kategori" ← ACTIVE: 14px bold #1A1A1A, 3px bottom border solid #6FA084.
  • "Supplier"  inactive: 14px #6B7280, no underline.
  Tab bar bg: #FFFFFF. Divider below tabs: 1px #E5E5E0.

► ACTION BAR (below tabs, padding 16px 20px):
  Left  : Search input — flat #FFFFFF bg, border 1.5px #E5E5E0, radius 8px,
           magnifier icon, placeholder "Cari kategori...", width 260px.
  Right : "+ Tambah Kategori" button:
          flat solid #6FA084 bg | white text | 14px bold | border-radius 8px
          height 40px. ⛔ NO GRADIENT on button.

► CATEGORY DATA TABLE (full-width white card, padding 0):
  Header row: bg #F4F4F0 | 12px uppercase bold #6B7280 | height 44px.
  Columns (left to right):
  | No. | ID Kategori | Nama Kategori | Jumlah Produk | Deskripsi | Aksi |

  Body rows: alternating #FFFFFF / #F9F9F7 | height 52px | border-bottom 1px #E5E5E0.
  Text: 14px #1A1A1A.

  "Jumlah Produk" column: bold flat #6FA084 number with small flat #EAF3EC bg
  pill badge (e.g., "24 produk"), border-radius 20px. ⛔ No gradient.

  "Aksi" column: 2 flat icon buttons (28×28px, border-radius 6px, flat #F4F4F0 bg):
  • Pencil (edit)  — icon #6FA084.
  • Trash (delete) — icon #D64545.

  9 sample rows:
   1 | KAT-001 | Minuman        | 24 produk | Semua jenis minuman kemasan       | [edit][del]
   2 | KAT-002 | Mie Instan     | 18 produk | Mie instan berbagai merek         | [edit][del]
   3 | KAT-003 | Roti & Kue     | 11 produk | Produk roti, kue, dan snack manis | [edit][del]
   4 | KAT-004 | Snack          | 22 produk | Keripik, biskuit, dan camilan     | [edit][del]
   5 | KAT-005 | Kebersihan     | 15 produk | Sabun, deterjen, perawatan diri   | [edit][del]
   6 | KAT-006 | ATK            |  9 produk | Alat tulis dan perlengkapan kantor| [edit][del]
   7 | KAT-007 | Bumbu Dapur    | 13 produk | Bumbu masak, kecap, saus          | [edit][del]
   8 | KAT-008 | Rokok          |  8 produk | Berbagai merek rokok              | [edit][del]
   9 | KAT-009 | Frozen Food    |  8 produk | Makanan beku dan es krim          | [edit][del]

► PAGINATION (bottom of table, border-top 1px #E5E5E0, padding 12px 16px):
  Left : "Menampilkan 1–9 dari 9 kategori" — 13px #6B7280.
  Right: flat pagination. Current page "1" = flat #6FA084 bg white text.
  ⛔ No gradient on pagination buttons.

OUTPUT: 1440×900px. Inventaris screen — Kategori tab active.
Flat, clean, professional. ⛔ ZERO GRADIENTS anywhere on this screen.
```

---
---

## 🖥️ SCREEN 3C — Inventaris: Tab Supplier

**Screen Name:** `Inventaris — Supplier`
**Role:** Pemilik (Owner) only | **Active Sidebar:** Inventaris | **Active Tab:** Supplier

---

### PROMPT — Screen 3C

```
Generate a Desktop-First UI screen (1440×900px) for a Point of Sales and Inventory
Management System. THIS IS SCREEN 3C: Inventaris — Tab Supplier (Supplier Management).
This is the same Inventaris screen, but with the "Supplier" tab active.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔  STRICT VISUAL RULES — ZERO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Page background : #F4F4F0 — flat solid cream. ⛔ ABSOLUTELY NO GRADIENTS.
• All cards       : #FFFFFF — flat solid white, border-radius 14px.
• Primary accent  : #6FA084 (Sage Green) — flat solid ONLY. Zero gradient.
• Font            : Inter. Body 14px #1A1A1A. Labels 12px #6B7280.
• ⛔ NO GRADIENTS, NO GLASS, NO GLOSS, NO OMBRE anywhere on this screen.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSISTENT SIDEBAR (identical to all previous screens)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Width 220px | Background #2C2C2C solid flat.
Nav items (Pemilik — all 5 visible):
  1. Dashboard   (icon #9E9E9E, inactive)
  2. POS / Kasir (icon #9E9E9E, inactive)
  3. Inventaris  ← ACTIVE (icon #6FA084, left solid bar 3px #6FA084)
  4. Riwayat     (icon #9E9E9E, inactive)
  5. Laporan     (icon #9E9E9E, inactive)
Bottom: "BS" | "Budi Santoso" | "Pemilik" flat #6FA084 pill.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSISTENT TOP HEADER BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background #FFFFFF solid | Height 64px | Border-bottom 1px #E5E5E0.
Left  : "Inventaris" — 24px bold #1A1A1A.
Right : date-time → divider → avatar → "Budi Santoso" → "Pemilik" pill.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAIN CONTENT AREA — background #F4F4F0, padding 28px
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

► TAB NAVIGATION (underline style):
  • "Produk"   inactive: 14px #6B7280.
  • "Kategori" inactive: 14px #6B7280.
  • "Supplier" ← ACTIVE: 14px bold #1A1A1A, 3px bottom border solid #6FA084.
  Divider below tabs: 1px #E5E5E0.

► ACTION BAR (below tabs, padding 16px 20px):
  Left  : Search input — flat #FFFFFF bg, border 1.5px #E5E5E0, radius 8px,
           magnifier icon, placeholder "Cari supplier...", width 260px.
  Right : "+ Tambah Supplier" button:
          flat solid #6FA084 bg | white text | 14px bold | border-radius 8px
          height 40px. ⛔ NO GRADIENT.

► SUPPLIER DATA TABLE (full-width white card, padding 0):
  Header row: bg #F4F4F0 | 12px uppercase bold #6B7280 | height 44px.
  Columns:
  | No. | ID Supplier | Nama Supplier | No. Kontak | Alamat | Produk Dipasok | Status | Aksi |

  Body rows: alternating #FFFFFF / #F9F9F7 | height 56px | border-bottom 1px #E5E5E0.
  Text: 14px #1A1A1A.

  "Status" column pills (FLAT SOLID — NO GRADIENT):
  • "Aktif"     : flat #EAF3EC bg, #6FA084 text, border-radius 20px, 11px bold.
  • "Non-aktif" : flat #F4F4F0 bg, #9E9E9E text, border-radius 20px, 11px bold.

  "Produk Dipasok": plain number, 14px bold #1A1A1A.

  "Aksi" column: 2 flat icon buttons (28×28px, border-radius 6px, flat #F4F4F0 bg):
  • Pencil (edit)  — icon #6FA084.
  • Trash (delete) — icon #D64545.

  7 sample rows:
   1 | SUP-001 | CV Sumber Barokah    | 0812-3456-7890 | Jl. Pasar Baru No.5, Jakarta     | 32 | Aktif
   2 | SUP-002 | PT Indofood Sukses   | 021-5555-1234  | Jl. Sudirman Kav.22, Jakarta     | 18 | Aktif
   3 | SUP-003 | UD Minuman Nusantara | 0813-9876-5432 | Jl. Gatot Subroto No.88, Jakarta | 24 | Aktif
   4 | SUP-004 | Toko Grosir Makmur   | 0811-2222-3333 | Jl. Mangga Besar No.12, Jakarta  | 15 | Aktif
   5 | SUP-005 | CV Berkah Sejahtera  | 0878-4444-5555 | Jl. Hayam Wuruk No.3, Jakarta    |  9 | Aktif
   6 | SUP-006 | PT Wings Indonesia   | 021-7777-8888  | Jl. TB Simatupang No.15, Jakarta |  8 | Non-aktif
   7 | SUP-007 | Distributor Unilever | 021-4444-9999  | Jl. Jenderal Sudirman, Jakarta   | 11 | Aktif

► PAGINATION (bottom of table, border-top 1px #E5E5E0):
  Left : "Menampilkan 1–7 dari 14 supplier" — 13px #6B7280.
  Right: flat pagination. Page "1" flat #6FA084 bg white text. ⛔ No gradient.

OUTPUT: 1440×900px. Inventaris screen — Supplier tab active.
Flat, clean, professional. ⛔ ZERO GRADIENTS anywhere on this screen.
```

---
---

## 🖥️ SCREEN 3D — Modal: Tambah / Edit Produk (Form)

**Triggered by:** Clicking "+ Tambah Produk" or the Pencil (edit) icon on the Inventaris screen.
**Type:** Large slide-out drawer from the right side of the screen (or large centered modal).

---

### PROMPT — Screen 3D

```
Generate a Desktop-First UI screen (1440×900px) for a Point of Sales and Inventory
Management System. THIS IS SCREEN 3D: Modal / Drawer — Tambah & Edit Produk.

Show the Inventaris screen (Tab Produk) visible in the background, dimmed behind a
flat rgba(0,0,0,0.35) overlay. A large right-side SLIDE-OUT DRAWER panel is open on
the right side of the screen, sliding in from the right edge.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔  STRICT VISUAL RULES — ZERO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Drawer background : #FFFFFF — flat solid white. ⛔ NO GRADIENT.
• Page bg behind    : #F4F4F0 cream, dimmed flat rgba(0,0,0,0.35).
• Primary accent    : #6FA084 (Sage Green) — flat solid ONLY. NEVER gradient.
• Input fields      : #FFFFFF bg, border 1.5px #E5E5E0. On focus: border #6FA084.
• Font              : Inter. Form labels 12px bold #6B7280. Input text 14px #1A1A1A.
• ⛔ NO GRADIENTS, NO GLASS EFFECTS, NO OMBRE anywhere on or inside the drawer.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLIDE-OUT DRAWER PANEL (right side of screen)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Width: 520px | Full viewport height | Background: #FFFFFF flat | No border-radius on
right edges (flush with screen right) | Left edge border: 1px #E5E5E0.
Box shadow: -4px 0 24px rgba(0,0,0,0.12) on the left edge only (no glow gradient).

► DRAWER HEADER (top, height 64px, border-bottom 1px #E5E5E0):
  Left : "Tambah Produk Baru" 20px bold #1A1A1A.
         (If editing: "Edit Produk — Aqua 600ml")
  Right: close (×) button — flat #F4F4F0 bg, 32×32px, border-radius 6px, icon #6B7280.
  ⛔ No gradient on header area.

► DRAWER BODY (scrollable, padding 24px):

  [FIELD 1] — FOTO PRODUK (Upload Area):
  Label "Foto Produk" 12px bold #6B7280.
  Upload area:
  • Flat #F9F9F7 bg | border 2px dashed #E5E5E0 | border-radius 12px | height 140px.
  • Centered: flat image icon (40px, #9E9E9E) above text "Klik untuk upload foto"
    (14px #6B7280) and below "PNG, JPG maksimal 2MB" (12px #9E9E9E).
  • ⛔ No gradient on upload area.

  [FIELD 2] — NAMA PRODUK:
  Label "Nama Produk *" 12px bold #6B7280. Required star in #D64545.
  Input: flat #FFFFFF bg | border 1.5px #E5E5E0 | radius 8px | height 44px
         | placeholder "Masukkan nama produk" | font 14px #1A1A1A.
  Pre-filled example: "Aqua 600ml" (for edit mode).

  [FIELD 3] — TWO-COLUMN ROW: Kategori + Supplier:
  Two dropdowns side by side (50% each, gap 12px):

  Dropdown "Kategori *":
  • Label 12px bold #6B7280.
  • Flat #FFFFFF bg | border 1.5px #E5E5E0 | radius 8px | height 44px | chevron icon right.
  • Selected value "Minuman" 14px #1A1A1A.
  • ⛔ No gradient on dropdown.

  Dropdown "Supplier *":
  • Same style as Kategori dropdown.
  • Selected value "CV Sumber Barokah" 14px #1A1A1A.

  [FIELD 4] — TWO-COLUMN ROW: Harga Beli + Harga Jual:
  Two inputs side by side (50% each, gap 12px):

  Input "Harga Beli *":
  • Label 12px bold #6B7280.
  • Flat input | left prefix "Rp" flat #F4F4F0 bg block | border 1.5px #E5E5E0
    radius 8px | height 44px | value "2.800" 14px #1A1A1A.

  Input "Harga Jual *":
  • Same style. Value "3.500".
  • Below: helper "Margin: Rp 700 (25%)" 12px #6FA084 flat text.

  [FIELD 5] — TWO-COLUMN ROW: Stok Awal + Stok Minimum:
  Two inputs side by side (50% each, gap 12px):

  Input "Stok Awal *":
  • Label 12px bold #6B7280.
  • Flat input | right suffix "pcs" flat #F4F4F0 bg block | border 1.5px #E5E5E0
    radius 8px | height 44px | value "24" 14px #1A1A1A.

  Input "Stok Minimum *":
  • Same style. Value "12".
  • Below: helper "Peringatan stok akan muncul di bawah nilai ini" 12px #9E9E9E.

  [FIELD 6] — SATUAN PRODUK:
  Label "Satuan" 12px bold #6B7280.
  Dropdown: flat #FFFFFF bg | border 1.5px #E5E5E0 | radius 8px | height 44px.
  Selected: "pcs (pieces)".

  [FIELD 7] — DESKRIPSI (optional):
  Label "Deskripsi (opsional)" 12px bold #6B7280.
  Textarea: flat #FFFFFF bg | border 1.5px #E5E5E0 | radius 8px | height 80px
            | placeholder "Tambahkan deskripsi produk..." | font 14px.

  [FIELD 8] — STATUS TOGGLE:
  Label "Status Produk" 12px bold #6B7280.
  Toggle row: "Aktif" label left | flat toggle switch right (ACTIVE state: flat solid
  #6FA084 track, white thumb circle. INACTIVE: flat #E5E5E0 track).
  ⛔ No gradient on toggle track or thumb.

► DRAWER FOOTER (sticky bottom, border-top 1px #E5E5E0, padding 16px 24px):
  Two buttons side by side, right-aligned:

  "Batal" button:
  • Flat #FFFFFF bg | border 1.5px #E5E5E0 | text #6B7280 | 14px | border-radius 8px
  • Height 44px | width 120px.

  "Simpan Produk" button:
  • Flat solid #6FA084 bg | white text | 14px bold | border-radius 8px
  • Height 44px | width 160px. ⛔ NO GRADIENT.

OUTPUT: 1440×900px. Inventaris (Produk tab) dimmed in background. Right-side drawer
open, showing complete Tambah/Edit Produk form, all fields filled as example.
⛔ ZERO GRADIENTS anywhere — not on inputs, dropdowns, buttons, upload area, or drawer.
```

---
---

## 🖥️ SCREEN 3E — Modal: Detail Produk (View Mode)

**Triggered by:** Clicking the Eye (👁) icon in the Aksi column of the product table.
**Type:** Centered floating modal with read-only product information.

---

### PROMPT — Screen 3E

```
Generate a Desktop-First UI screen (1440×900px) for a Point of Sales and Inventory
Management System. THIS IS SCREEN 3E: Modal — Detail Produk (Read-Only View).

The Inventaris screen (Tab Produk, Screen 3) is fully visible in the background,
dimmed behind a flat overlay. A centered modal shows full product details in read-only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔  STRICT VISUAL RULES — ZERO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Background overlay: rgba(0,0,0,0.35) flat solid. ⛔ No gradient on overlay.
• Modal card        : #FFFFFF — flat solid white, border-radius 16px.
• Primary accent    : #6FA084 (Sage Green) — flat solid ONLY. NEVER gradient.
• All text          : read-only, no input borders.
• Font              : Inter. Labels 12px #6B7280. Values 14px #1A1A1A.
• ⛔ NO GRADIENTS, NO GLASS EFFECTS, NO OMBRE, NO GLOSS anywhere.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODAL CARD — Detail Produk
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Modal dimensions: 560px wide | Background #FFFFFF flat | Border-radius 16px.
Box shadow: 0 8px 32px rgba(0,0,0,0.14) — subtle, no gradient shadow.
Padding: 0 (internal sections control their own padding).

► MODAL HEADER (padding 24px 28px, border-bottom 1px #E5E5E0):
  Left : flat eye icon 20px #6B7280 | "Detail Produk" 20px bold #1A1A1A.
  Right: close (×) button — flat #F4F4F0 bg, 32×32px, border-radius 6px, icon #6B7280.
         ⛔ No gradient.
  Below title: product SKU code "PRD-001" flat pill badge — #F4F4F0 bg, #6B7280 text,
               border-radius 20px, 12px bold. ⛔ No gradient.

► MODAL BODY (padding 24px 28px):

  TWO-COLUMN LAYOUT inside the modal:
  Left column: 200px | Right column: fills remaining space (gap 24px).

  ──────────────────────────────────────
  LEFT — PRODUCT IMAGE PLACEHOLDER
  ──────────────────────────────────────
  A large flat solid-colored square:
  • Dimensions: 180×180px | border-radius 12px.
  • Background: flat solid #EAF3EC (muted sage tint). ⛔ NO GRADIENT.
  • Centered inside: flat product icon or large initial letter "A" for Aqua.
  • Icon/letter: 48px, color #6FA084.
  Below the image square: "Aqua 600ml" 13px bold #1A1A1A centered.
  Below that: status badge — flat solid #EAF3EC bg, #6FA084 text "Aktif" 11px bold pill.
  ⛔ No gradient on badge.

  ──────────────────────────────────────
  RIGHT — PRODUCT DETAIL FIELDS (read-only)
  ──────────────────────────────────────
  Display as labeled data rows (label above, value below, divider line between groups):

  Row 1 — Basic Info group (bg #F9F9F7, border-radius 10px, padding 14px 16px, margin-bottom 10px):
  • Label "Nama Produk" 11px bold #6B7280 | Value "Aqua 600ml" 15px bold #1A1A1A.
  • Label "Kategori" 11px #6B7280 | Value "Minuman" 14px #1A1A1A.
  • Label "Supplier" 11px #6B7280 | Value "CV Sumber Barokah" 14px #1A1A1A.

  Row 2 — Pricing group (same card style):
  • Label "Harga Beli" 11px #6B7280 | Value "Rp 2.800" 14px bold #1A1A1A.
  • Label "Harga Jual" 11px #6B7280 | Value "Rp 3.500" 14px bold #6FA084 flat color.
  • Label "Margin Keuntungan" 11px #6B7280 | Value "Rp 700 (25%)" 14px bold #6FA084.

  Row 3 — Stock group (same card style):
  • Label "Stok Saat Ini" 11px #6B7280
    Value "3 pcs" — 18px BOLD #D64545 flat (because it's critically low stock).
    Below value: flat solid pill badge "⚠ Kritis" — flat #D64545 bg, white text, radius 20px.
    ⛔ No gradient on badge.
  • Label "Stok Minimum" 11px #6B7280 | Value "12 pcs" 14px #1A1A1A.
  • Label "Satuan" 11px #6B7280 | Value "pcs (pieces)" 14px #1A1A1A.

  Row 4 — Meta info group (same card style):
  • Label "Kode SKU"   | Value "PRD-001"
  • Label "Dibuat"     | Value "12 Januari 2026 · oleh Budi Santoso"
  • Label "Diperbarui" | Value "27 September 2026 · oleh Ani Rahayu"
  All 13px #6B7280 labels and 13px #1A1A1A values.

► MODAL FOOTER (padding 16px 28px, border-top 1px #E5E5E0):
  Right-aligned, two buttons side by side (gap 10px):

  "Tutup" button:
  • Flat #FFFFFF bg | border 1.5px #E5E5E0 | text #6B7280 | 14px | radius 8px
  • Height 44px | width 100px.

  "Edit Produk" button:
  • Flat solid #6FA084 bg | white text | 14px bold | radius 8px
  • Height 44px | width 140px. ⛔ NO GRADIENT.

OUTPUT: 1440×900px. Inventaris table visible and dimmed in background. Centered
Detail Produk modal open, showing all product info in read-only view for "Aqua 600ml".
⛔ ZERO GRADIENTS anywhere — not on the image placeholder, info groups, badges, or buttons.
```

---
---

## 📋 SUPPLEMENTAL QUICK REFERENCE

| Screen | Type | Triggered From | Key Elements |
|---|---|---|---|
| **2B** | Modal (centered) | POS — "Tunda Transaksi" button | Hold-bill name input + 3 held transactions list |
| **3B** | Full screen (tab) | Inventaris — "Kategori" tab | 9-row category table + Tambah Kategori |
| **3C** | Full screen (tab) | Inventaris — "Supplier" tab | 7-row supplier table + Tambah Supplier |
| **3D** | Slide-out drawer (right) | Inventaris — "+ Tambah Produk" or pencil icon | Full product form with all fields |
| **3E** | Modal (centered) | Inventaris — eye icon per row | Read-only product detail view |

---

## ✅ SUPPLEMENTAL CONSISTENCY CHECKLIST
> Verify before feeding each prompt to Stitch AI:

- [ ] Modal overlays use **flat** `rgba(0,0,0,0.35)` — not a gradient fade
- [ ] All modal cards are **#FFFFFF flat** with `border-radius 16px`
- [ ] Drawer background is **#FFFFFF flat**, shadow on left edge only
- [ ] All form inputs use **flat #FFFFFF bg + border 1.5px #E5E5E0**
- [ ] Focus state on inputs = **border 1.5px #6FA084** — no glow, no box-shadow ring
- [ ] Upload/drop area uses **flat #F9F9F7 bg + dashed border** — no gradient
- [ ] "Simpan" / primary buttons = **flat solid #6FA084** — ⛔ no gradient
- [ ] Toggle switches = **flat solid #6FA084 track** — ⛔ no gradient
- [ ] All status/type badges = **flat solid fills** — ⛔ no gradient
- [ ] Progress bars (if any) = **flat solid #6FA084 fill** — ⛔ no gradient
- [ ] Sidebar + header match **identically** to all main screens

---

*Supplemental Prompt Guide — TokoKu POS & Inventory System · v1.1*
*Extends StitchAI_POS_Prompts.md · Generated by Antigravity AI*
