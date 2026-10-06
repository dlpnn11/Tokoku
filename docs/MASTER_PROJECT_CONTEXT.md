# MASTER PROJECT CONTEXT: TOKOKU POS & INVENTORY MANAGEMENT SYSTEM

## 1. PROJECT OVERVIEW
- **Application Name:** TokoKu
- **Domain:** Micro-Retail Convenience Store (Warung Kelontong) Management System.
- **Client/Partner:** Firdaus Ubaidillah.
- **Primary Goal:** Transform manual paper-based transaction and inventory tracking into a fast, desktop-first Point of Sale (POS) and inventory platform.
- **Deployment Mode:** 100% Online Cloud-Hosted (Zero cost deployment).
- **Development Scope:** Full-stack development with complete TypeScript type-safety.

## 2. CHOSEN TECH STACK & ARCHITECTURE
- **Frontend & Full-stack Framework:** Next.js (App Router) with TypeScript.
- **UI & Styling:** Tailwind CSS, Shadcn UI components, Lucide React icons.
- **State Management:** Zustand (for reactive, zero-lag cashier shopping cart state).
- **Backend & Database:** Supabase (Managed PostgreSQL, Authentication, Realtime Channels).
- **Hosting Strategy:** 
  - Frontend & API: Vercel (Free Hobby Tier, connected to GitHub repository).
  - Database & Realtime: Supabase Cloud (Free Tier PostgreSQL).
- **Mobile Barcode Scanner:** Responsive web route accessed via mobile browser using `html5-qrcode` library, communicating real-time via Supabase Realtime Channels with the desktop POS.
- **Audio Feedback:** Web Audio API sound synthesizer / lightweight local audio trigger that fires an instant "beep" sound upon every successful barcode scan.
- **Receipt Handling (Hybrid Zero-Cost Approach):**
  - **Browser Print API (`window.print()`):** Print-optimized CSS (@media print) formatted for thermal receipt dimensions (58mm/80mm) without cutting margins.
  - **WhatsApp Direct Receipt:** Generates an automated formatted text message with transaction details sent via WhatsApp click-to-chat URL scheme (`https://wa.me/{phone}?text={encoded_receipt}`).
  - **Extensible Architecture:** Modular printing function ready for future Web Bluetooth or Web Serial ESC/POS integration.

## 3. STRICT VISUAL DESIGN SYSTEM (FLAT MINIMALIST)
- **CRITICAL RULE:** ABSOLUTELY NO GRADIENTS. 100% solid, flat colors only.
- **Base Background:** `#F4F4F0` (Light Cream / Soft Beige).
- **Surfaces & Cards:** `#FFFFFF` (Pure White) with 12px–16px border-radius.
- **Primary Accent:** `#6FA084` (Solid Sage Green).
- **Sidebar Background:** `#2C2C2C` (Dark Charcoal).
- **Text Hierarchy:** Primary `#1A1A1A` (Near Black), Secondary `#6B7280` (Cool Grey).
- **Status Colors:** Low Stock `#E8A838` (Amber), Out of Stock / Danger `#D64545` (Red), In Stock `#6FA084` (Green).
- **Comprehensive Guidelines:** For exhaustive specifications, see [docs/PANDUAN_DESIGN_SYSTEM_TOKOKU.md](./docs/PANDUAN_DESIGN_SYSTEM_TOKOKU.md).

### RESPONSIBILITY & VIEWPORT CONSTRAINTS
- **Desktop Viewport (Primary):** Layar kasir dioptimalkan untuk monitor lanskap di atas meja kasir (1440×900px atau 1920×1080px) dengan tata letak bilah samping tetap (*sticky sidebar*) dan panel terbelah (*split-screen*).
- **Mobile Viewport (Mandatory):** Seluruh antarmuka aplikasi **wajib 100% responsif terhadap ponsel pintar** (lebar 360px–430px).
  - Bilah samping (*sidebar*) otomatis berubah menjadi menu laci navigasi tersembunyi (*collapsible sheet* atau *hamburger menu drawer*).
  - Dasbor Pemilik menyesuaikan kartu ringkasan menjadi tata letak satu kolom bertumpuk (*single-column stack*).
  - Tabel Inventaris dan Riwayat menyediakan mode geser horizontal (*horizontal scroll*) atau bertransformasi menjadi kartu data (*data cards*) agar tetap terbaca jelas tanpa terpotong di layar HP.
  - Halaman Pemindai Barcode (`/scan`) berjalan optimal pada peramban seluler dengan penyesuaian area bidik kamera secara vertikal.

## 4. RELATIONAL DATABASE SCHEMA (POSTGRESQL / SUPABASE)
The system data model consists of 6 primary relational entities:

1. `users`:
   - `id` (UUID, Primary Key)
   - `username` (Text, Unique)
   - `password_hash` (Text)
   - `role` (Enum: 'pemilik', 'kasir')
   - `created_at` (Timestamp)

2. `categories`:
   - `id` (UUID, Primary Key)
   - `name` (Text, Unique)
   - `created_at` (Timestamp)

3. `suppliers`:
   - `id` (UUID, Primary Key)
   - `name` (Text)
   - `phone` (Text)
   - `address` (Text)
   - `created_at` (Timestamp)

4. `products`:
   - `id` (UUID, Primary Key)
   - `sku` (Text, Unique / Barcode string)
   - `name` (Text)
   - `category_id` (UUID, References categories.id)
   - `supplier_id` (UUID, References suppliers.id, Nullable)
   - `buy_price` (Numeric)
   - `sell_price` (Numeric)
   - `current_stock` (Integer)
   - `minimum_stock` (Integer, Default 5)
   - `unit` (Text, e.g., 'pcs', 'botol', 'kg')
   - `is_active` (Boolean, Default true)
   - `created_at` (Timestamp)

5. `transactions`:
   - `id` (UUID, Primary Key)
   - `invoice_number` (Text, Unique, Indexed)
   - `user_id` (UUID, References users.id)
   - `total_amount` (Numeric)
   - `payment_method` (Enum: 'Tunai', 'QRIS')
   - `cash_received` (Numeric, Nullable)
   - `cash_change` (Numeric, Nullable)
   - `customer_phone` (Text, Nullable, for WhatsApp receipt delivery)
   - `status` (Enum: 'Selesai', 'Dibatalkan')
   - `created_at` (Timestamp, Indexed)

6. `transaction_details`:
   - `id` (UUID, Primary Key)
   - `transaction_id` (UUID, References transactions.id on delete cascade)
   - `product_id` (UUID, References products.id)
   - `quantity` (Integer)
   - `unit_price` (Numeric)
   - `subtotal` (Numeric)

## 5. CORE MODULES & ROUTE STRUCTURE

### `/dashboard` (Owner Only)
- Daily KPI summary cards: Today's Revenue, Total Completed Transactions.
- Real-time Low Stock Warning table filtering items where `current_stock <= minimum_stock`.

### `/pos` (Cashier & Owner)
- Split-screen layout (60% Catalog & Search, 40% Cart & Calculation).
- Instant product search by text SKU or Name.
- Shopping cart with quantity steppers and line-item subtotals.
- Quick cash nominal buttons: Exact Amount ("Uang Pas"), Rp 20.000, Rp 50.000, Rp 100.000.
- Payment method switch: Cash (Tunai) or QRIS.
- Checkout trigger: Atomically creates `transactions`, inserts `transaction_details`, deducts `products.current_stock`, and opens success modal.
- Post-Checkout Modal Options:
  - "Cetak Struk" (Standard browser print preview).
  - "Kirim via WhatsApp" (Input customer mobile number to send formatted bill).
- Note: "Tunda Transaksi" (Hold Bill) feature has been removed intentionally.

### `/scan` (Mobile PWA Route)
- Minimalist camera viewfinder running in mobile browser.
- Uses `html5-qrcode` to decode barcodes.
- Emits an instant audible "beep" feedback upon detecting a code.
- Broadcasts the decoded SKU to the desktop POS session via Supabase Realtime Channel.

### `/inventaris` (Owner Only)
- Tabbed interface: "Produk", "Kategori", "Supplier".
- Full CRUD operations with standard slide-over / modals.
- Stock Opname modal for direct physical vs system stock discrepancy adjustments.

### `/riwayat` (Cashier & Owner)
- Paginated transaction records with date-range filters.
- Detail modal showing complete receipt data, option to re-print, and option to re-send to WhatsApp.

### `/laporan` (Owner Only)
- Revenue analytics (Daily / Monthly view).
- Best Sellers ranking list based on aggregated `transaction_details` sales volumes.
- Category revenue contribution breakdown.

## 6. ROLE-BASED ACCESS CONTROL (RBAC) RULES
- `Pemilik` (Owner): Full access to all routes (`/dashboard`, `/pos`, `/inventaris`, `/riwayat`, `/laporan`).
- `Kasir` (Cashier): Restricted access. Navigates ONLY to `/pos` and `/riwayat`. Any attempt to access `/dashboard`, `/inventaris`, or `/laporan` must redirect automatically to `/pos`.