# 🛒 Stitch AI Prompt Guide
## Point of Sales (POS) & Inventory Management System
### Micro-Retail Convenience Store — Desktop-First UI

---

> **HOW TO USE THIS FILE**
> Copy each prompt block for the corresponding screen and paste it directly into Stitch AI's generation field.
> Feed them **one page at a time**, in order. Always set the Global Design System first.

---

## 📐 STEP 0 — GLOBAL DESIGN SYSTEM
> **Paste this block as a "Global Style Guide" or "System Prompt" in Stitch AI BEFORE generating any screen. Reference it for every single screen.**

```
GLOBAL DESIGN SYSTEM — Apply strictly to ALL screens without exception.

COLOR PALETTE (MANDATORY — NO DEVIATIONS):
- Page Background    : #F4F4F0  (Light Cream / Soft Beige) — flat solid only
- Surface / Card     : #FFFFFF  (Pure White) — flat solid only
- Primary Accent     : #6FA084  (Sage Green) — flat solid only, NEVER gradient
- Accent Hover Dark  : #5A8A6F  (Darker Sage Green)
- Sidebar Background : #2C2C2C  (Dark Charcoal) — flat solid only
- Icon Inactive      : #9E9E9E  (Medium Grey)
- Icon Active        : #6FA084  (Sage Green)
- Primary Text       : #1A1A1A  (Near Black)
- Secondary Text     : #6B7280  (Cool Grey)
- Divider / Border   : #E5E5E0  (Light Grey)
- Danger / Alert     : #D64545  (Flat Solid Red)
- Warning / Low Stock: #E8A838  (Flat Solid Amber)
- Success / In-Stock : #6FA084  (Sage Green)
- Table Row Hover    : #F9F9F7

TYPOGRAPHY:
- Font Family  : Inter (primary), fallback Roboto, sans-serif
- Page Title   : 24px, weight 700, color #1A1A1A
- Section Head : 16px, weight 600, color #1A1A1A
- Body / Table : 14px, weight 400, color #1A1A1A
- Caption/Label: 12px, weight 500, color #6B7280
- Button Text  : 14px, weight 600

⛔ CRITICAL NO-GRADIENT RULE (ENFORCED — ZERO EXCEPTIONS):
ABSOLUTELY NO GRADIENTS of any kind anywhere on any screen.
No linear-gradient, no radial-gradient, no glossy effects, no glass morphism,
no ombre text, no shimmer. Every background, card, button, badge, chart bar,
chart line area, header, sidebar, icon, and tooltip must use 100% flat, solid
colors only. This rule has absolutely ZERO exceptions across all 5 screens.

CARD / SURFACE STYLING:
- Background   : #FFFFFF solid flat
- Border Radius: 12px–16px
- Box Shadow   : 0px 1px 4px rgba(0,0,0,0.08) — subtle only, no glow
- Padding      : 20px–24px

BUTTON STYLES (flat solid fills ONLY):
- Primary   : bg #6FA084, text #FFFFFF, border-radius 8px
- Secondary : bg #FFFFFF, border 1.5px solid #6FA084, text #6FA084, border-radius 8px
- Danger    : bg #D64545, text #FFFFFF, border-radius 8px
- Warning   : bg #FFFFFF, border 1.5px solid #E8A838, text #E8A838, border-radius 8px
- All buttons: flat solid fill only — NO GRADIENT, NO SHADOW GRADIENT

PERSISTENT SIDEBAR (must appear identically on all 5 screens):
- Width      : 220px expanded (labels + icons)
- Background : #2C2C2C solid flat (dark charcoal)
- Brand area : 64px height at top, store name "TokoKu" centered, white text
- Nav items  : vertical list, icon (24px) + label, 48px row height
  - Active   : icon color #6FA084, left accent bar 3px solid #6FA084, row bg #FFFFFF0F
  - Inactive : icon color #9E9E9E, no bg highlight
- Bottom     : user avatar circle (initials), full name, role pill badge

PERSISTENT TOP HEADER BAR (must appear identically on all 5 screens):
- Background    : #FFFFFF solid flat
- Height        : 64px
- Border-bottom : 1px solid #E5E5E0
- Left          : Page title (changes per screen), 24px bold #1A1A1A
- Right (L→R)  : Date-time label → vertical divider → avatar + name + role badge
  - Date-time   : "Senin, 28 September 2026 | 16:02 WIB", 13px #6B7280
  - Role badges : "Pemilik" = flat #6FA084 bg, white text pill
                  "Kasir"   = flat #6B7280 bg, white text pill

ROLES & SIDEBAR VISIBILITY:
- Pemilik (Owner) : All 5 nav items visible — Dashboard, POS/Kasir, Inventaris, Riwayat, Laporan
- Kasir (Cashier) : ONLY 2 nav items visible — POS/Kasir, Riwayat
  (Dashboard, Inventaris, Laporan are completely hidden for Kasir role)

LAYOUT:
- Design for 1440 × 900px desktop viewport (minimum 1280px)
- Content area starts after sidebar (left), below header (top)
- Content padding: 28px
- Card/grid gap  : 16px–20px
```

---
---

## 🖥️ SCREEN 1 OF 5 — Dashboard (Owner View)

**Screen Name:** `Dashboard — Pemilik`
**Role:** Pemilik (Owner) only | **Active Sidebar Item:** Dashboard (home icon)

---

### PROMPT — Screen 1

```
Generate a Desktop-First UI screen (1440×900px) for a Point of Sales and Inventory
Management System for a micro-retail convenience store.
THIS IS SCREEN 1: Dashboard — Pemilik (Owner View).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔  STRICT VISUAL RULES — ZERO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Page background : #F4F4F0 — flat solid cream. NEVER any gradient.
• All cards       : #FFFFFF — flat solid white, border-radius 14px.
• Primary accent  : #6FA084 (Sage Green) — flat solid ONLY, NEVER as gradient.
• Font            : Inter, body 14px #1A1A1A, headings bold.
• ⛔ NO GRADIENTS, NO GLASS EFFECTS, NO OMBRE — flat and clean at all times.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSISTENT SIDEBAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Width 220px | Background #2C2C2C solid flat | Brand "TokoKu" at top.
Nav items (all visible — Pemilik role):
  1. Dashboard   ← ACTIVE (icon #6FA084, left solid bar 3px #6FA084)
  2. POS / Kasir   (icon #9E9E9E, inactive)
  3. Inventaris    (icon #9E9E9E, inactive)
  4. Riwayat       (icon #9E9E9E, inactive)
  5. Laporan       (icon #9E9E9E, inactive)
Bottom: avatar circle "BS" | "Budi Santoso" | role pill "Pemilik" flat #6FA084 bg white text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSISTENT TOP HEADER BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background #FFFFFF solid | Height 64px | Border-bottom 1px #E5E5E0.
Left  : Page title "Dashboard" — 24px bold #1A1A1A.
Right : "Senin, 28 September 2026 | 16:02 WIB" (13px #6B7280)
        → divider → avatar "BS" → "Budi Santoso" → "Pemilik" pill (flat #6FA084).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAIN CONTENT AREA — background #F4F4F0, padding 28px
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[SECTION 1] SUMMARY CARDS ROW — Two equal-width cards side by side (gap 16px):

CARD A — "Total Pendapatan Hari Ini"
• White card #FFFFFF, border-radius 14px, padding 24px.
• Top-left: flat wallet icon 32px color #6FA084 | label "Total Pendapatan Hari Ini" 13px #6B7280.
• Center: "Rp 4.872.500" — 36px bold #1A1A1A.
• Bottom-left: flat solid upward arrow icon #6FA084 + "+12% vs kemarin" 13px #6FA084.
• Bottom-right: "Update: 16:02 WIB" 11px #9E9E9E.
• ⛔ No gradient on the trend indicator. Flat solid text only.

CARD B — "Total Transaksi Hari Ini"
• Same card style as Card A.
• Top-left: flat receipt icon 32px #6FA084 | label "Total Transaksi Hari Ini" 13px #6B7280.
• Center: "47" — 36px bold #1A1A1A, below: "transaksi selesai" 14px #6B7280.
• Bottom-left: "+5 vs kemarin" 13px #6FA084, flat upward arrow icon.
• Bottom-right: "Update: 16:02 WIB" 11px #9E9E9E.

[SECTION 2] LOW STOCK ALERT TABLE — Full-width white card below summary cards:
• Card: #FFFFFF, border-radius 14px, padding 20px.

Card header row:
• Left : flat solid warning triangle icon 22px color #E8A838
         + "Peringatan Stok Menipis" 18px bold #1A1A1A.
• Right: secondary button "Lihat Semua Stok"
         (flat #FFFFFF bg, border 1.5px #6FA084, text #6FA084, border-radius 8px, height 36px).

Data table below (full width):
  Header row: bg #F4F4F0, text 12px uppercase bold #6B7280, height 44px.
  Columns: | Kode Barang | Nama Produk | Kategori | Stok Saat Ini | Stok Minimum | Status |
  Body rows: alternating #FFFFFF / #F9F9F7, text 14px #1A1A1A, height 48px,
             border-bottom 1px #E5E5E0.

  Status pill badges (FLAT SOLID ONLY — NO GRADIENT):
  • "Kritis"  = flat solid #D64545 bg, white text, border-radius 20px, 11px bold.
  • "Menipis" = flat solid #E8A838 bg, white text, border-radius 20px, 11px bold.

  6 sample rows:
  PRD-001 | Aqua 600ml           | Minuman    |  3  | 12 | Kritis
  PRD-002 | Indomie Goreng       | Mie Instan |  5  | 20 | Kritis
  PRD-003 | Teh Botol 350ml      | Minuman    |  8  | 15 | Menipis
  PRD-004 | Roti Tawar Sari Roti | Roti & Kue |  4  | 10 | Menipis
  PRD-005 | Sabun Lifebuoy 80g   | Kebersihan |  6  | 12 | Menipis
  PRD-006 | Pulpen Pilot G2      | ATK        |  2  |  8 | Kritis

[SECTION 3] QUICK STATS ROW — Three equal-width small cards (gap 16px):
  Card 1: flat box icon #6FA084 | "Produk Aktif"   | value "128 SKU" 22px bold #1A1A1A.
  Card 2: flat truck icon #6FA084 | "Supplier Aktif" | value "14" 22px bold #1A1A1A.
  Card 3: flat tag icon #6FA084  | "Kategori"       | value "9" 22px bold #1A1A1A.
  Each: #FFFFFF card, border-radius 12px, padding 18px. ⛔ No gradient.

OUTPUT: 1440×900px desktop, full Dashboard. Flat, clean, professional.
⛔ ZERO GRADIENTS anywhere — not on cards, icons, badges, text, or backgrounds.
```

---
---

## 🖥️ SCREEN 2 OF 5 — Menu Kasir / POS

**Screen Name:** `POS — Menu Kasir`
**Role:** Pemilik & Kasir | **Active Sidebar Item:** POS / Kasir (cash register icon)

---

### PROMPT — Screen 2

```
Generate a Desktop-First UI screen (1440×900px) for a Point of Sales and Inventory
Management System for a micro-retail convenience store.
THIS IS SCREEN 2: Menu Kasir / POS (Cashier Interface).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔  STRICT VISUAL RULES — ZERO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Page background : #F4F4F0 — flat solid cream. ⛔ NO GRADIENTS ANYWHERE.
• All cards       : #FFFFFF — flat solid white, border-radius 12px–14px.
• Primary accent  : #6FA084 (Sage Green) — flat solid ONLY, NEVER gradient.
• Font            : Inter. Body 14px #1A1A1A.
• ⛔ NO GRADIENTS, NO GLASS, NO OMBRE, NO GLOSS anywhere on this screen.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSISTENT SIDEBAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Width 220px | Background #2C2C2C solid flat.
Nav items (all visible — Pemilik role shown here):
  1. Dashboard   (icon #9E9E9E, inactive)
  2. POS / Kasir ← ACTIVE (icon #6FA084, left solid bar 3px #6FA084)
  3. Inventaris  (icon #9E9E9E, inactive)
  4. Riwayat     (icon #9E9E9E, inactive)
  5. Laporan     (icon #9E9E9E, inactive)
Bottom: "BS" avatar | "Budi Santoso" | "Pemilik" pill flat #6FA084 bg white text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSISTENT TOP HEADER BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background #FFFFFF solid | Height 64px | Border-bottom 1px #E5E5E0.
Left  : "Menu Kasir" — 24px bold #1A1A1A.
Right : date-time → divider → "Budi Santoso" → "Pemilik" pill (flat #6FA084).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAIN CONTENT AREA — SPLIT-SCREEN LAYOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background #F4F4F0. Two panels side by side. No outer card wrap on panels.

══════════════════════════════════════════
LEFT PANEL — 60% WIDTH — PRODUCT CATALOG
══════════════════════════════════════════

► SEARCH BAR (full width of left panel):
  White card #FFFFFF, height 52px, border-radius 12px, border 1.5px #E5E5E0.
  Left  : flat barcode-scanner icon 20px #6B7280.
  Middle: input placeholder "Cari produk atau scan barcode..." 14px #9E9E9E.
  Right : flat solid button "Scan" — bg #6FA084, white text 14px bold,
          border-radius 8px, width 80px. ⛔ NO GRADIENT on button.

► CATEGORY FILTER TABS (horizontal row, gap 8px, below search):
  Pill-shaped tabs, height 32px, font 13px:
  • "Semua"    ← ACTIVE: flat solid #6FA084 bg, white text, border-radius 20px.
  • "Minuman"     inactive: flat #FFFFFF bg, border 1px #E5E5E0, text #6B7280.
  • "Mie Instan"  inactive (same style)
  • "Roti & Kue"  inactive
  • "Kebersihan"  inactive
  • "ATK"         inactive
  ⛔ No gradient on any tab. Flat solid fills only.

► PRODUCT GRID (4 columns × 3 rows = 12 cards, below filters):
  Each product card:
  • White #FFFFFF card, border-radius 12px, shadow 0 1px 3px rgba(0,0,0,0.07).
  • Top area (40% of card): flat solid colored rectangle thumbnail placeholder.
    Use flat muted solid colors (NO GRADIENT):
    - Muted sage tint : #EAF3EC
    - Muted warm      : #FFF4E5
    - Muted lavender  : #F0F0FF
    - Muted blush     : #FFF0F0
    Alternate these across products. A flat initial letter centered inside.
  • Bottom: product name 13px bold #1A1A1A | price 14px bold #6FA084
            | stock badge: small flat pill #EAF3EC bg #6FA084 text "Stok: XX".
  • Low stock card: stock badge changes to flat #E8A838 bg, white text "Menipis".
  • Out-of-stock card: flat #FFFFFF overlay (70% opacity, solid) over thumbnail
    area + "Stok Habis" centered 13px bold #D64545. ⛔ No gradient on overlay.

  12 products to place in grid:
   1. Aqua 600ml        — Rp 3.500   — Stok: 3   (LOW badge, flat amber)
   2. Indomie Goreng    — Rp 3.200   — Stok: 0   (STOK HABIS overlay)
   3. Teh Botol 350ml   — Rp 4.000   — Stok: 8
   4. Roti Tawar        — Rp 12.500  — Stok: 4   (LOW badge)
   5. Sabun Lifebuoy    — Rp 8.900   — Stok: 6   (LOW badge)
   6. Pulpen Pilot G2   — Rp 7.000   — Stok: 2   (LOW badge)
   7. Kopiko 150ml      — Rp 5.500   — Stok: 22
   8. Chitato Original  — Rp 9.000   — Stok: 18
   9. Pocari Sweat      — Rp 6.500   — Stok: 11
  10. Ultra Milk 250ml  — Rp 4.500   — Stok: 30
  11. Rinso 1kg         — Rp 22.000  — Stok: 7
  12. Minyak Goreng 2L  — Rp 38.000  — Stok: 14

══════════════════════════════════════════
RIGHT PANEL — 40% WIDTH — SHOPPING CART
══════════════════════════════════════════
Full-height white card #FFFFFF, border-radius 16px, padding 20px,
shadow 0 2px 8px rgba(0,0,0,0.09). ⛔ NO GRADIENT anywhere inside.

► CART HEADER:
  "Keranjang Belanja" 18px bold #1A1A1A.
  Right of heading: flat pill badge "3 item" — bg #F4F4F0, text #6B7280, 12px.
  Below: "Transaksi #TRX-20260928-047" 12px #9E9E9E.

► CART ITEM LIST (scrollable, dividers 1px #E5E5E0 between rows):
  Each row layout:
  [Product name 14px bold] + [unit price 12px #6B7280]
  [Qty stepper: flat [−] + number + flat [+]]   [Line total 14px bold]   [🗑 trash #D64545]
  Stepper buttons: flat #FFFFFF bg, border 1px #E5E5E0, 28×28px, border-radius 6px.
  ⛔ No gradient on steppers.

  3 cart items:
  1. Aqua 600ml     × 3   = Rp 10.500  (unit Rp 3.500)
  2. Teh Botol      × 2   = Rp  8.000  (unit Rp 4.000)
  3. Chitato Ori    × 1   = Rp  9.000  (unit Rp 9.000)

► SUBTOTAL BREAKDOWN (below items, above divider):
  Thin divider 1px #E5E5E0, then:
  Row: "Subtotal"    right "Rp 27.500"  — 14px, label #6B7280, value #1A1A1A.
  Row: "Diskon"      right "- Rp 0"     — 14px, label #6B7280, value #1A1A1A.
  Row: "Total Bayar" right "Rp 27.500"  — 16px bold, both #1A1A1A.

► PAYMENT METHOD TOGGLE:
  Label "Metode Pembayaran" 12px uppercase bold #6B7280.
  Two flat pill toggle buttons side by side (full width, equal):
  • "💵 Tunai" ← ACTIVE: flat solid #6FA084 bg, white text bold.
  • "📱 QRIS"    inactive: flat #FFFFFF bg, border 1.5px #E5E5E0, text #6B7280.
  ⛔ NO GRADIENT on toggles.

► QUICK NOMINAL BUTTONS (3×2 grid — visible when Tunai active):
  Label "Nominal Cepat" 12px #6B7280.
  Grid of 6 flat buttons:
  [Rp 5.000]   [Rp 10.000]  [Rp 20.000]
  [Rp 50.000]  [Rp 100.000] [UANG PAS]
  Each: flat #FFFFFF bg, border 1px #E5E5E0, 13px bold #1A1A1A,
        border-radius 8px. ⛔ No gradient.

► CASH INPUT:
  Label "Uang Diterima" 12px #6B7280.
  Input field: flat #FFFFFF bg, border 1.5px #E5E5E0, border-radius 8px,
               value "Rp 30.000" 16px bold #1A1A1A.
  Below: "Kembalian: Rp 2.500" 14px bold flat #6FA084 text.

► ACTION BUTTONS (stacked, gap 10px):
  1. "⏸  Tunda Transaksi"
     flat #FFFFFF bg | border 1.5px #E8A838 | text #E8A838 | 14px bold
     border-radius 10px | full width | height 44px.
  2. "🗑  Batalkan"
     flat #FFFFFF bg | border 1.5px #D64545 | text #D64545 | 14px bold
     border-radius 10px | full width | height 44px.
  3. "BAYAR  — Rp 27.500"  ← THE MOST DOMINANT ELEMENT ON SCREEN
     flat solid #6FA084 bg (⛔ NO GRADIENT) | white text 20px bold
     border-radius 12px | full width | height 64px.

OUTPUT: 1440×900px. Split-screen POS. Flat, clean, professional.
⛔ ZERO GRADIENTS anywhere — not on buttons, cards, tabs, badges, or backgrounds.
```

---
---

## 🖥️ SCREEN 3 OF 5 — Inventaris / Master Data (Owner)

**Screen Name:** `Inventaris — Master Data`
**Role:** Pemilik (Owner) only | **Active Sidebar Item:** Inventaris (box icon)

---

### PROMPT — Screen 3

```
Generate a Desktop-First UI screen (1440×900px) for a Point of Sales and Inventory
Management System. THIS IS SCREEN 3: Menu Inventaris / Master Data (Owner View).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔  STRICT VISUAL RULES — ZERO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Page background : #F4F4F0 — flat solid cream. ⛔ ABSOLUTELY NO GRADIENTS.
• All cards       : #FFFFFF — flat solid white, border-radius 14px.
• Primary accent  : #6FA084 (Sage Green) — flat solid ONLY. Zero gradient.
• Font            : Inter. Body 14px #1A1A1A. Labels 12px #6B7280.
• ⛔ NO GRADIENTS, NO GLASS, NO GLOSS, NO OMBRE anywhere.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSISTENT SIDEBAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Width 220px | Background #2C2C2C solid flat.
Nav items (all visible — Pemilik role):
  1. Dashboard   (icon #9E9E9E, inactive)
  2. POS / Kasir (icon #9E9E9E, inactive)
  3. Inventaris  ← ACTIVE (icon #6FA084, left solid bar 3px #6FA084)
  4. Riwayat     (icon #9E9E9E, inactive)
  5. Laporan     (icon #9E9E9E, inactive)
Bottom: "BS" avatar | "Budi Santoso" | "Pemilik" pill flat #6FA084 bg.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSISTENT TOP HEADER BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background #FFFFFF solid | Height 64px | Border-bottom 1px #E5E5E0.
Left  : "Inventaris" — 24px bold #1A1A1A.
Right : date-time → divider → "Budi Santoso" → "Pemilik" pill.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAIN CONTENT AREA — background #F4F4F0, padding 28px
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

► TAB NAVIGATION (underline style, inside top of main content white card):
  Tabs (not pills — underline indicator only):
  • "Produk"    ← ACTIVE: 14px bold #1A1A1A, 3px bottom border solid #6FA084.
  • "Kategori"    inactive: 14px #6B7280, no underline.
  • "Supplier"    inactive: 14px #6B7280, no underline.
  Tab row bg: #FFFFFF top section of main card. Divider below tabs: 1px #E5E5E0.

► ACTION BAR (below tabs, inside same white card, padding 16px 20px):
  Horizontal row, left to right:
  - Search: flat white input, border 1.5px #E5E5E0, radius 8px,
            magnifier icon left, placeholder "Cari produk...", width 260px.
  - Filter Kategori: flat dropdown, #FFFFFF bg, border 1.5px #E5E5E0,
                     radius 8px, text #6B7280, chevron right, width 160px.
  - [SPACER]
  - "📦 Stock Opname" button:
    flat #FFFFFF bg | border 1.5px #E8A838 | text #E8A838 | 14px bold
    border-radius 8px | height 40px. ⛔ No gradient.
  - "+ Tambah Produk" button:
    flat solid #6FA084 bg | white text | 14px bold
    border-radius 8px | height 40px. ⛔ NO GRADIENT.

► PRODUCT DATA TABLE (full-width white card, padding 0):
  Header row: bg #F4F4F0 | 12px uppercase bold #6B7280 | height 44px | padding 0 16px.
  Columns: | ☐ | Foto | Kode SKU | Nama Produk | Kategori | Stok | Harga Beli | Harga Jual | Status | Aksi |

  Body rows: alternating #FFFFFF / #F9F9F7 | height 56px | border-bottom 1px #E5E5E0
             | text 14px #1A1A1A.

  "Foto" column: 36×36px flat muted solid-color square, border-radius 6px.
                 (Use flat muted colors — #EAF3EC, #FFF4E5, #F0F0FF, #FFF0F0 — NO GRADIENT)

  "Stok" column color coding (flat text colors only):
  • Stok > 15 : bold #6FA084 (green)
  • Stok 5–15 : bold #E8A838 (amber)
  • Stok < 5  : bold #D64545 (red)

  "Status" column pills (FLAT SOLID — NO GRADIENT):
  • "Aktif"     : flat #EAF3EC bg, #6FA084 text, border-radius 20px, 11px bold.
  • "Non-aktif" : flat #F4F4F0 bg, #9E9E9E text, border-radius 20px, 11px bold.

  "Aksi" column: 3 flat icon buttons per row (28×28px, border-radius 6px, flat #F4F4F0 bg):
  • Pencil (edit)  — icon #6FA084
  • Trash (delete) — icon #D64545
  • Eye (detail)   — icon #6B7280

  8 sample rows:
  PRD-001 | Aqua 600ml           | Minuman    |  3 (red)   | Rp 2.800  | Rp 3.500  | Aktif
  PRD-002 | Indomie Goreng       | Mie Instan |  0 (red)   | Rp 2.500  | Rp 3.200  | Non-aktif
  PRD-003 | Teh Botol 350ml      | Minuman    |  8 (amber) | Rp 3.200  | Rp 4.000  | Aktif
  PRD-004 | Roti Tawar Sari Roti | Roti & Kue |  4 (red)   | Rp 9.500  | Rp 12.500 | Aktif
  PRD-005 | Sabun Lifebuoy 80g   | Kebersihan |  6 (amber) | Rp 7.000  | Rp 8.900  | Aktif
  PRD-006 | Pulpen Pilot G2      | ATK        |  2 (red)   | Rp 5.000  | Rp 7.000  | Aktif
  PRD-007 | Kopiko 150ml         | Minuman    | 22 (green) | Rp 4.000  | Rp 5.500  | Aktif
  PRD-008 | Chitato Original     | Snack      | 18 (green) | Rp 7.200  | Rp 9.000  | Aktif

► PAGINATION (bottom of table, border-top 1px #E5E5E0, padding 12px 16px):
  Left : "Menampilkan 1–8 dari 128 produk" — 13px #6B7280.
  Right: flat pagination buttons [◀] [1] [2] [3] [...] [16] [▶]
         Page "1": flat solid #6FA084 bg, white text, border-radius 6px.
         Others  : flat #FFFFFF bg, border 1px #E5E5E0, border-radius 6px.
         ⛔ No gradient on any pagination button.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STOCK OPNAME MODAL — Show as open floating modal overlay on screen
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overlay : rgba(0,0,0,0.30) solid flat over the entire screen. ⛔ No gradient.
Modal card:
• Background: #FFFFFF flat | border-radius 16px | width 480px | padding 28px.
• Title    : "📦 Stock Opname" — 20px bold #1A1A1A.
• Subtitle : "Sesuaikan stok fisik dengan stok sistem" — 13px #6B7280.
• Divider  : 1px #E5E5E0.
• Mini table inside modal:
  Header: bg #F4F4F0, columns: Nama Produk | Stok Sistem | Stok Fisik | Selisih
  3 rows (editable "Stok Fisik" input field per row, flat border 1.5px #E5E5E0):
  Aqua 600ml        | 3  | [  5 ] | +2
  Indomie Goreng    | 0  | [  0 ] |  0
  Teh Botol 350ml   | 8  | [ 10 ] | +2
• "Selisih" positive values in #6FA084, negative in #D64545. Flat colors only.
• Bottom buttons (gap 10px):
  "Batal"          — flat #FFFFFF bg, border 1.5px #E5E5E0, text #6B7280, radius 8px.
  "Simpan Opname"  — flat solid #6FA084 bg, white text 14px bold, radius 8px. ⛔ No gradient.

OUTPUT: 1440×900px. Inventaris table screen with Stock Opname modal open.
⛔ ZERO GRADIENTS anywhere on this screen.
```

---
---

## 🖥️ SCREEN 4 OF 5 — Riwayat Transaksi (Transaction History)

**Screen Name:** `Riwayat Transaksi`
**Role:** Pemilik & Kasir | **Active Sidebar Item:** Riwayat (clock/history icon)

---

### PROMPT — Screen 4

```
Generate a Desktop-First UI screen (1440×900px) for a Point of Sales and Inventory
Management System. THIS IS SCREEN 4: Riwayat Transaksi (Transaction History).
This screen is shown in the KASIR (Cashier) role view — restricted sidebar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔  STRICT VISUAL RULES — ZERO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Page background : #F4F4F0 — flat solid cream. ⛔ ZERO GRADIENTS ANYWHERE.
• All cards       : #FFFFFF — flat solid white, border-radius 12px–16px.
• Primary accent  : #6FA084 (Sage Green) — flat solid ONLY. NEVER gradient.
• Font            : Inter. Body 14px #1A1A1A. Labels 12px #6B7280.
• ⛔ ABSOLUTELY NO GRADIENTS, GLOSS, GLASS, OR OMBRE on this screen.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSISTENT SIDEBAR — KASIR ROLE (RESTRICTED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Width 220px | Background #2C2C2C solid flat.
ONLY 2 nav items are visible (all others are completely hidden):
  1. POS / Kasir (icon #9E9E9E, inactive)
  2. Riwayat     ← ACTIVE (icon #6FA084, left solid bar 3px #6FA084)
  (Dashboard, Inventaris, Laporan are HIDDEN — not greyed out, but fully removed)
Bottom: "AN" avatar | "Ani Rahayu" | "Kasir" pill flat #6B7280 bg, white text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSISTENT TOP HEADER BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background #FFFFFF solid | Height 64px | Border-bottom 1px #E5E5E0.
Left  : "Riwayat Transaksi" — 24px bold #1A1A1A.
Right : "Senin, 28 September 2026 | 16:02 WIB" (13px #6B7280)
        → divider → "AN" avatar → "Ani Rahayu" → "Kasir" pill (flat #6B7280 bg).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAIN CONTENT AREA — background #F4F4F0, padding 28px
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

► FILTER & SEARCH BAR (white card #FFFFFF, border-radius 12px, padding 16px 20px):
  Horizontal row:
  - "Dari Tanggal" date input (flat, border 1.5px #E5E5E0, radius 8px, calendar icon)
  - " s/d " label 13px #6B7280
  - "Sampai Tanggal" date input (same style)
  - Status dropdown "Semua Status" (flat #FFFFFF, border 1.5px #E5E5E0, radius 8px)
  - Metode dropdown "Semua Metode" (same style)
  - [SPACER]
  - Search input "Cari No. Transaksi..." (magnifier left, width 220px, flat)
  - "Terapkan Filter" button: flat solid #6FA084 bg, white text, radius 8px, h 40px.
    ⛔ No gradient on button.

► SUMMARY CHIPS (3 flat inline info chips, gap 12px, below filter card):
  Each chip: flat #FFFFFF bg, border 1px #E5E5E0, border-radius 8px, padding 10px 16px.
  • "📊 47 Transaksi Hari Ini"  — 14px bold #1A1A1A.
  • "💰 Total: Rp 4.872.500"   — 14px bold #6FA084 (flat color, no gradient).
  • "❌ 2 Dibatalkan"          — 14px bold #D64545 (flat color, no gradient).

► TRANSACTION TABLE (full-width white card, border-radius 14px, padding 0):
  Header: bg #F4F4F0 | 12px uppercase bold #6B7280 | height 44px | padding 0 16px.
  Columns: | No. Transaksi | Tanggal & Jam | Kasir | Jml Item | Total | Metode | Status | Aksi |

  Body rows: alternating #FFFFFF / #F9F9F7 | height 52px | border-bottom 1px #E5E5E0.
  "No. Transaksi": 13px bold #1A1A1A.

  "Metode" column pills (FLAT SOLID — NO GRADIENT):
  • "Tunai" : flat #EAF3EC bg, #6FA084 text, border-radius 20px.
  • "QRIS"  : flat #E8F0FF bg, #3B82F6 text, border-radius 20px.

  "Status" column pills (FLAT SOLID — NO GRADIENT):
  • "Selesai"    : flat #EAF3EC bg, #6FA084 text, border-radius 20px.
  • "Ditunda"    : flat #FFF4E5 bg, #E8A838 text, border-radius 20px.
  • "Dibatalkan" : flat #FFF0F0 bg, #D64545 text, border-radius 20px.

  "Aksi" column: one flat eye icon button per row (28×28px, flat #F4F4F0 bg,
                 border-radius 6px, icon #6B7280).

  10 sample rows:
  TRX-20260928-047 | 28 Sep 2026, 15:45 | Ani Rahayu    | 5  | Rp 27.500  | Tunai | Selesai
  TRX-20260928-046 | 28 Sep 2026, 15:30 | Budi Santoso  | 2  | Rp  8.000  | QRIS  | Selesai
  TRX-20260928-045 | 28 Sep 2026, 15:10 | Ani Rahayu    | 8  | Rp 54.200  | Tunai | Selesai
  TRX-20260928-044 | 28 Sep 2026, 14:55 | Ani Rahayu    | 1  | Rp  3.500  | QRIS  | Selesai
  TRX-20260928-043 | 28 Sep 2026, 14:30 | Budi Santoso  | 3  | Rp 21.700  | Tunai | Ditunda
  TRX-20260928-042 | 28 Sep 2026, 14:15 | Ani Rahayu    | 6  | Rp 47.800  | QRIS  | Selesai
  TRX-20260928-041 | 28 Sep 2026, 13:50 | Ani Rahayu    | 2  | Rp 11.000  | Tunai | Dibatalkan
  TRX-20260928-040 | 28 Sep 2026, 13:30 | Budi Santoso  | 4  | Rp 35.600  | Tunai | Selesai
  TRX-20260928-039 | 28 Sep 2026, 13:10 | Ani Rahayu    | 7  | Rp 61.500  | QRIS  | Selesai
  TRX-20260928-038 | 28 Sep 2026, 12:45 | Ani Rahayu    | 3  | Rp 18.900  | Tunai | Dibatalkan

► PAGINATION (bottom of table, border-top 1px #E5E5E0, padding 12px 16px):
  Left : "Menampilkan 1–10 dari 47 transaksi" — 13px #6B7280.
  Right: flat pagination. Page "1" = flat #6FA084 bg white text. ⛔ No gradient.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSACTION DETAIL MODAL — Show as open overlay on screen
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overlay: rgba(0,0,0,0.30) flat solid. ⛔ No gradient.
Modal card: #FFFFFF flat | border-radius 16px | width 520px | padding 28px.

Modal header:
• Left : "Detail Transaksi" 20px bold #1A1A1A
          "TRX-20260928-047" 14px #6B7280 below.
• Right: close (×) button, flat #F4F4F0 bg, border-radius 6px. ⛔ No gradient.

Store info block (centered): "TokoKu" bold | "Jl. Merdeka No. 12, Jakarta" | "28 Sep 2026 16:02 WIB"
All 13px #6B7280. Divider 1px #E5E5E0 below.

Receipt item list (rows: item name left, qty × price right):
  Aqua 600ml       × 3  = Rp 10.500
  Teh Botol 350ml  × 2  = Rp  8.000
  Chitato Original × 1  = Rp  9.000
  Divider 1px #E5E5E0 then:
  Subtotal          Rp 27.500
  Diskon            Rp      0
  TOTAL             Rp 27.500  (bold, 16px #1A1A1A)
  Bayar             Rp 30.000
  Kembalian         Rp  2.500  (bold, #6FA084 flat text)
  Kasir: Ani Rahayu | Metode: Tunai

Bottom buttons (gap 10px):
• "🖨  Cetak Struk" — flat #FFFFFF bg, border 1.5px #6FA084, text #6FA084, radius 8px.
• "Tutup"           — flat solid #6FA084 bg, white text, radius 8px. ⛔ No gradient.

OUTPUT: 1440×900px. Riwayat table (Kasir role) with receipt modal open.
⛔ ZERO GRADIENTS anywhere on this screen.
```

---
---

## 🖥️ SCREEN 5 OF 5 — Laporan Keuangan (Financial Reports, Owner)

**Screen Name:** `Laporan Keuangan`
**Role:** Pemilik (Owner) only | **Active Sidebar Item:** Laporan (chart icon)

---

### PROMPT — Screen 5

```
Generate a Desktop-First UI screen (1440×900px) for a Point of Sales and Inventory
Management System. THIS IS SCREEN 5: Laporan Keuangan (Financial Reports) — Owner only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔  STRICT VISUAL RULES — ZERO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Page background : #F4F4F0 — flat solid cream. ⛔ ABSOLUTELY ZERO GRADIENTS.
• All cards       : #FFFFFF — flat solid white, border-radius 14px.
• Primary accent  : #6FA084 (Sage Green) — flat solid ONLY. NEVER gradient.
• Chart bars/lines: FLAT SOLID COLORS ONLY — no gradient fills on chart bars, no
                    gradient area-fills under line charts. Zero exceptions.
• Font            : Inter. Headings 16px–24px bold. Body 14px. Labels 12px.
• ⛔ NO GRADIENTS, NO GLASS, NO GLOSS, NO OMBRE — zero exceptions on all elements.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSISTENT SIDEBAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Width 220px | Background #2C2C2C solid flat.
Nav items (all visible — Pemilik role):
  1. Dashboard   (icon #9E9E9E, inactive)
  2. POS / Kasir (icon #9E9E9E, inactive)
  3. Inventaris  (icon #9E9E9E, inactive)
  4. Riwayat     (icon #9E9E9E, inactive)
  5. Laporan     ← ACTIVE (icon #6FA084, left solid bar 3px #6FA084)
Bottom: "BS" avatar | "Budi Santoso" | "Pemilik" pill flat #6FA084 bg.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSISTENT TOP HEADER BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background #FFFFFF solid | Height 64px | Border-bottom 1px #E5E5E0.
Left  : "Laporan Keuangan" — 24px bold #1A1A1A.
Right : date-time → divider → "Budi Santoso" → "Pemilik" pill (flat #6FA084).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAIN CONTENT AREA — background #F4F4F0, padding 28px
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

► PERIOD FILTER BAR (white card, border-radius 12px, padding 14px 20px):
  Horizontal row:
  - Label "Periode Laporan:" 13px bold #6B7280.
  - 4 flat pill toggle buttons:
    • "Harian"   inactive: flat #FFFFFF bg, border 1px #E5E5E0, text #6B7280.
    • "Mingguan" inactive (same)
    • "Bulanan"  ← ACTIVE: flat solid #6FA084 bg, white text bold, radius 20px.
    • "Kustom"   inactive (same as Harian)
    ⛔ No gradient on any toggle button.
  - "September 2026" dropdown (flat #FFFFFF, border 1.5px #E5E5E0, radius 8px).
  - [SPACER]
  - "⬇ Export Excel" button: flat #FFFFFF bg, border 1.5px #6FA084, text #6FA084, radius 8px.
  - "⬇ Export PDF"  button: flat #FFFFFF bg, border 1.5px #D64545, text #D64545, radius 8px.

► KPI CARDS ROW (4 equal-width cards, gap 16px):

  Card 1 — "Total Pendapatan Bulan Ini"
  • White #FFFFFF, radius 14px, padding 20px. ⛔ No gradient.
  • Label 12px #6B7280 | Value "Rp 134.820.000" 28px bold #1A1A1A.
  • Trend: flat ↑ icon #6FA084 + "+8.3% vs bulan lalu" 13px #6FA084.

  Card 2 — "Total Transaksi Bulan Ini"
  • Label 12px #6B7280 | Value "1.247" 28px bold #1A1A1A.
  • Trend: "+124 vs bulan lalu" 13px #6FA084. Flat.

  Card 3 — "Rata-rata per Transaksi"
  • Label 12px #6B7280 | Value "Rp 108.115" 28px bold #1A1A1A.
  • Trend: flat ↓ icon #D64545 + "-2.1% vs bulan lalu" 13px #D64545. Flat.

  Card 4 — "Total Produk Terjual"
  • Label 12px #6B7280 | Value "5.832 pcs" 28px bold #1A1A1A.
  • Trend: "+389 vs bulan lalu" 13px #6FA084. Flat.

► TWO-COLUMN LAYOUT (gap 20px):
  Left column: 65% | Right column: 35%

  ──────────────────────────────────────
  LEFT COLUMN
  ──────────────────────────────────────

  CHART CARD 1: "Grafik Pendapatan Harian — September 2026"
  White card #FFFFFF | radius 14px | padding 20px.
  BAR CHART (28 bars for 28 days of September):
  • Bar color    : flat solid #6FA084. ⛔ ABSOLUTELY NO GRADIENT ON BARS.
  • Today (day 28): flat solid #2C2C2C (dark) to distinguish. No gradient.
  • X-axis       : day numbers 1–28, 11px #6B7280.
  • Y-axis       : "Rp 0" to "Rp 8jt", 11px #6B7280.
  • Grid lines   : thin 1px #E5E5E0 horizontal. No gradient background.
  • Legend       : flat #6FA084 square dot + "Pendapatan Harian" 12px #6B7280.
  Vary bar heights realistically (weekends taller, weekdays varied).

  CHART CARD 2: "Grafik Tren Bulanan — Jan s/d Sep 2026"
  White card #FFFFFF | radius 14px | padding 20px.
  LINE CHART (9 data points, Jan–Sep):
  • Line         : flat solid #6FA084, stroke 3px. ⛔ NO GRADIENT.
  • Area under   : NONE or flat solid #EAF3EC very light (NOT gradient fill).
  • Data points  : flat circles #6FA084 fill, white center dot, stroke #6FA084.
  • X-axis       : Jan Feb Mar Apr Mei Jun Jul Agu Sep — 11px #6B7280.
  • Y-axis       : Rp 80jt to Rp 160jt — 11px #6B7280.
  • Grid lines   : thin 1px #E5E5E0. No gradient anywhere.

  ──────────────────────────────────────
  RIGHT COLUMN
  ──────────────────────────────────────

  CARD: "🏆 Barang Terlaris — September 2026"
  White #FFFFFF | radius 14px | padding 20px.
  Heading "Barang Terlaris" 16px bold #1A1A1A | subtext "September 2026" 13px #6B7280.

  Ranked list (8 rows, divider 1px #E5E5E0 between each):
  Each row: rank badge | product name 14px bold | units right | flat progress bar below.

  Rank badges (FLAT SOLID — NO GRADIENT):
  • Rank 1: flat solid #E8A838 (gold) bg, white text, 22px × 22px circle.
  • Rank 2: flat solid #9E9E9E (silver) bg, white text.
  • Rank 3: flat solid #CD7F32 (bronze) bg, white text.
  • Rank 4–8: flat #F4F4F0 bg, #6B7280 text.

  Progress bar: flat solid #6FA084 fill on flat #F4F4F0 track. Width proportional to units.
  ⛔ NO GRADIENT on progress bars.

  Best sellers data (units sold this month):
  1. Aqua 600ml          — 842 pcs
  2. Indomie Goreng       — 718 pcs
  3. Teh Botol 350ml     — 643 pcs
  4. Roti Tawar Sari Roti — 521 pcs
  5. Chitato Original    — 489 pcs
  6. Kopiko 150ml        — 412 pcs
  7. Ultra Milk 250ml    — 380 pcs
  8. Pocari Sweat 350ml  — 354 pcs

  CARD BELOW: "Pendapatan per Kategori"
  White #FFFFFF | radius 14px | padding 20px.
  HORIZONTAL BAR CHART (one bar per category):
  Each row: category name left (14px #1A1A1A) | flat solid bar middle | value right.

  Category colors (ALL FLAT SOLID — ⛔ NO GRADIENT):
  • Minuman    : #6FA084  — Rp 42.5jt
  • Mie Instan : #E8A838  — Rp 28.1jt
  • Snack      : #D64545  — Rp 19.6jt
  • Roti & Kue : #3B82F6  — Rp 14.3jt
  • Kebersihan : #8B5CF6  — Rp 11.7jt
  • ATK        : #6B7280  — Rp  7.2jt
  Bars are flat solid colored rectangles, no gradient fill, no shadow gradient.

OUTPUT: 1440×900px. Full financial reports screen. Flat, clean, professional.
⛔ ABSOLUTELY ZERO GRADIENTS anywhere — not on bars, lines, area fills, cards,
badges, buttons, backgrounds, or any element whatsoever.
```

---
---

## 📋 QUICK REFERENCE — COLOR CHEAT SHEET
> Keep this table open while generating all screens in Stitch AI to verify consistency.

| Element | Hex Value | Notes |
|---|---|---|
| Page Background | `#F4F4F0` | Flat solid cream — never white or grey |
| Card / Surface | `#FFFFFF` | Flat solid white |
| **Primary Accent** | **`#6FA084`** | **Sage Green — flat solid, NEVER gradient** |
| Accent Hover | `#5A8A6F` | Darker sage |
| Sidebar BG | `#2C2C2C` | Flat dark charcoal |
| Icon Inactive | `#9E9E9E` | Medium grey |
| Icon Active | `#6FA084` | Sage Green |
| Primary Text | `#1A1A1A` | Near black |
| Secondary Text | `#6B7280` | Cool grey |
| Divider / Border | `#E5E5E0` | Light grey |
| Danger Red | `#D64545` | Flat solid |
| Warning Amber | `#E8A838` | Flat solid |
| Table Row Hover | `#F9F9F7` | Very subtle |
| Card Shadow | `0 1px 4px rgba(0,0,0,0.08)` | Subtle only |
| Card Radius | `12px – 16px` | Rounded but not pill |
| Font | `Inter` | Roboto fallback |
| **GRADIENTS?** | **⛔ NEVER** | **Absolutely zero. None. Ever.** |

---

## ✅ CONSISTENCY CHECKLIST
> Verify every item below before submitting each prompt to Stitch AI.

**Layout & Navigation**
- [ ] Sidebar: always `220px` wide, `#2C2C2C` background, correct active item in `#6FA084`
- [ ] Sidebar: 3px left solid accent bar on active item — flat solid, not gradient
- [ ] Header: always `#FFFFFF`, `64px` tall, page title left, user info right
- [ ] Kasir role (Screen 2 & 4): sidebar shows ONLY POS + Riwayat; others hidden entirely
- [ ] Pemilik role (Screens 1, 3, 5): sidebar shows all 5 nav items

**Colors**
- [ ] Page background is `#F4F4F0` (cream) — never pure white, never grey
- [ ] All cards are `#FFFFFF` with `12px–16px` border-radius
- [ ] Primary action buttons: flat solid `#6FA084` fill — no gradient, no glow
- [ ] Status/method badges: flat solid pill fills — no gradient on any badge
- [ ] Chart bars/lines: flat solid `#6FA084` — no gradient color fill behind lines

**Anti-Gradient Verification (Most Critical)**
- [ ] ⛔ No linear-gradient on any element
- [ ] ⛔ No radial-gradient on any element
- [ ] ⛔ No glassmorphism / frosted glass effect
- [ ] ⛔ No ombre or two-tone text
- [ ] ⛔ No glossy sheen or specular highlight
- [ ] ⛔ No gradient fill under chart lines (area charts must be flat or transparent)
- [ ] ⛔ No gradient on chart bars (solid single color per bar)

---

*Generated for TokoKu POS & Inventory System · Desktop-First Design · v1.0*
*Prompt Guide by Antigravity AI — Ready for Stitch AI page-by-page generation*
