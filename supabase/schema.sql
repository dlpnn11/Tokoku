-- ==============================================================================
-- TOKOKU POS & INVENTORY MANAGEMENT SYSTEM
-- SUPABASE POSTGRESQL SCHEMA & SEED MIGRATION SCRIPT
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP EXISTING TABLES (FOR CLEAN SLATE RE-RUNS)
DROP TABLE IF EXISTS transaction_details CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 3. CREATE TABLES

-- Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('pemilik', 'kasir')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    icon_name TEXT DEFAULT 'Package',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    buy_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    sell_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 5,
    unit TEXT NOT NULL DEFAULT 'pcs',
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_unique ON products(barcode) WHERE barcode IS NOT NULL AND barcode != '';

-- Table: transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Tunai', 'QRIS')),
    cash_received NUMERIC(12, 2),
    cash_change NUMERIC(12, 2),
    customer_phone TEXT,
    status TEXT NOT NULL DEFAULT 'Selesai' CHECK (status IN ('Selesai', 'Dibatalkan')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: transaction_details
CREATE TABLE transaction_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- 4. INDEXES FOR LIGHTNING FAST CASHIER SEARCH & FILTER
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_number);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transaction_details_tx ON transaction_details(transaction_id);

-- 5. ENABLE SUPABASE REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- 5B. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transaction_details" ON transaction_details FOR ALL USING (true) WITH CHECK (true);

-- 6. ATOMIC TRANSACTION CHECKOUT RPC FUNCTION (ACID)
CREATE OR REPLACE FUNCTION create_pos_transaction(
    p_invoice_number TEXT,
    p_user_id UUID,
    p_total_amount NUMERIC,
    p_payment_method TEXT,
    p_cash_received NUMERIC,
    p_cash_change NUMERIC,
    p_customer_phone TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_tx_id UUID;
    v_item RECORD;
    v_curr_stock INT;
    v_prod_name TEXT;
BEGIN
    -- 1. Validate items array is not empty
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Keranjang belanja tidak boleh kosong';
    END IF;

    -- 2. Verify stock availability with ROW-LEVEL LOCKING
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT, unit_price NUMERIC, subtotal NUMERIC)
    LOOP
        SELECT current_stock, name INTO v_curr_stock, v_prod_name
        FROM products
        WHERE id = v_item.product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan', v_item.product_id;
        END IF;

        IF v_curr_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Stok produk "%" tidak mencukupi (Tersisa: %, Diminta: %)', v_prod_name, v_curr_stock, v_item.quantity;
        END IF;
    END LOOP;

    -- 3. Insert transaction header
    INSERT INTO transactions (
        invoice_number,
        user_id,
        total_amount,
        payment_method,
        cash_received,
        cash_change,
        customer_phone,
        status
    ) VALUES (
        p_invoice_number,
        p_user_id,
        p_total_amount,
        p_payment_method,
        p_cash_received,
        p_cash_change,
        p_customer_phone,
        'Selesai'
    ) RETURNING id INTO v_tx_id;

    -- 4. Insert transaction details & deduct current_stock
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT, unit_price NUMERIC, subtotal NUMERIC)
    LOOP
        INSERT INTO transaction_details (
            transaction_id,
            product_id,
            quantity,
            unit_price,
            subtotal
        ) VALUES (
            v_tx_id,
            v_item.product_id,
            v_item.quantity,
            v_item.unit_price,
            v_item.subtotal
        );

        UPDATE products
        SET current_stock = current_stock - v_item.quantity
        WHERE id = v_item.product_id;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_tx_id,
        'invoice_number', p_invoice_number,
        'message', 'Transaksi berhasil disimpan'
    );
END;
$$;

-- 7. FUNCTION TO CANCEL TRANSACTION AND RESTOCK PRODUCTS (OWNER ONLY)
CREATE OR REPLACE FUNCTION cancel_pos_transaction(
    p_transaction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_status TEXT;
    v_item RECORD;
BEGIN
    SELECT status INTO v_status FROM transactions WHERE id = p_transaction_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaksi tidak ditemukan';
    END IF;

    IF v_status = 'Dibatalkan' THEN
        RAISE EXCEPTION 'Transaksi ini sudah pernah dibatalkan';
    END IF;

    -- Restock items
    FOR v_item IN SELECT product_id, quantity FROM transaction_details WHERE transaction_id = p_transaction_id
    LOOP
        UPDATE products
        SET current_stock = current_stock + v_item.quantity
        WHERE id = v_item.product_id;
    END LOOP;

    -- Update transaction status
    UPDATE transactions SET status = 'Dibatalkan' WHERE id = p_transaction_id;

    RETURN jsonb_build_object('success', true, 'message', 'Transaksi berhasil dibatalkan dan stok dikembalikan');
END;
$$;

-- ==============================================================================
-- 8. REALISTIC SEED DATA (INDONESIAN WARUNG KELONTONG)
-- ==============================================================================

-- A. USERS
INSERT INTO users (id, username, password_hash, full_name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'pemilik', 'pemilik123', 'Firdaus Ubaidillah', 'pemilik'),
('22222222-2222-2222-2222-222222222222', 'kasir', 'kasir123', 'Ani Rahayu', 'kasir');

-- B. CATEGORIES
INSERT INTO categories (id, name, icon_name) VALUES
('c1111111-1111-1111-1111-111111111111', 'Minuman', 'Coffee'),
('c2222222-2222-2222-2222-222222222222', 'Mie Instan', 'Soup'),
('c3333333-3333-3333-3333-333333333333', 'Makanan Ringan / Snack', 'Cookie'),
('c4444444-4444-4444-4444-444444444444', 'Sembako & Bumbu', 'Wheat'),
('c5555555-5555-5555-5555-555555555555', 'Kebutuhan Rumah Tangga / Kebersihan', 'Sparkles'),
('c6666666-6666-6666-6666-666666666666', 'ATK & Rokok', 'PenTool');

-- C. SUPPLIERS
INSERT INTO suppliers (id, name, phone, address) VALUES
('ba111111-1111-1111-1111-111111111111', 'Toko Grosir Sumber Rejeki', '081234567890', 'Pasar Induk Kramat Jati Blok A5'),
('ba222222-2222-2222-2222-222222222222', 'Agen Sembako Barokah Jaya', '085712349988', 'Jl. Raya Kebon Jeruk No. 14'),
('ba333333-3333-3333-3333-333333333333', 'Distributor Wings & Unilever', '082198765432', 'Kawasan Industri Pulogadung');

-- D. PRODUCTS (WITH REAL INDONESIAN EAN-13 BARCODES & NON-BARCODE ITEMS)
INSERT INTO products (sku, name, category_id, supplier_id, buy_price, sell_price, current_stock, minimum_stock, unit) VALUES
-- Minuman
('8992753123456', 'Aqua 600ml', 'c1111111-1111-1111-1111-111111111111', 'ba111111-1111-1111-1111-111111111111', 2800, 3500, 24, 6, 'botol'),
('8998866200234', 'Teh Botol Sosro 350ml', 'c1111111-1111-1111-1111-111111111111', 'ba111111-1111-1111-1111-111111111111', 3200, 4000, 18, 5, 'botol'),
('8992741910013', 'Pocari Sweat 350ml', 'c1111111-1111-1111-1111-111111111111', 'ba111111-1111-1111-1111-111111111111', 5200, 6500, 15, 4, 'botol'),
('8996001410222', 'Kopiko 78C Coffee Latte 240ml', 'c1111111-1111-1111-1111-111111111111', 'ba111111-1111-1111-1111-111111111111', 4200, 5500, 20, 5, 'botol'),
('8998009010101', 'Ultra Milk Full Cream 250ml', 'c1111111-1111-1111-1111-111111111111', 'ba111111-1111-1111-1111-111111111111', 3800, 4800, 16, 5, 'kotak'),

-- Mie Instan
('089686010019', 'Indomie Goreng Original', 'c2222222-2222-2222-2222-222222222222', 'ba111111-1111-1111-1111-111111111111', 2700, 3500, 40, 10, 'bungkus'),
('089686010033', 'Indomie Kuah Ayam Bawang', 'c2222222-2222-2222-2222-222222222222', 'ba111111-1111-1111-1111-111111111111', 2600, 3300, 30, 8, 'bungkus'),
('8998866100101', 'Mie Sedaap Goreng', 'c2222222-2222-2222-2222-222222222222', 'ba111111-1111-1111-1111-111111111111', 2600, 3300, 25, 8, 'bungkus'),

-- Snack & Roti
('8996001300121', 'Chitato Sapi Panggang 68g', 'c3333333-3333-3333-3333-333333333333', 'ba111111-1111-1111-1111-111111111111', 7800, 9500, 14, 4, 'bungkus'),
('8992775210101', 'Oreo Vanilla 133g', 'c3333333-3333-3333-3333-333333333333', 'ba111111-1111-1111-1111-111111111111', 7200, 9000, 12, 4, 'bungkus'),
('8991001100202', 'Roti Tawar Sari Roti', 'c3333333-3333-3333-3333-333333333333', 'ba111111-1111-1111-1111-111111111111', 11000, 13500, 6, 2, 'bungkus'),

-- Kebersihan
('8999999052028', 'Sabun Lifebuoy Total 10 80g', 'c5555555-5555-5555-5555-555555555555', 'ba333333-3333-3333-3333-333333333333', 3800, 4800, 18, 5, 'pcs'),
('8999999023417', 'Rinso Anti Noda 1kg', 'c5555555-5555-5555-5555-555555555555', 'ba333333-3333-3333-3333-333333333333', 21000, 24500, 8, 3, 'bungkus'),
('8999999011122', 'Sunlight Jeruk Nipis 700ml', 'c5555555-5555-5555-5555-555555555555', 'ba333333-3333-3333-3333-333333333333', 12500, 15000, 10, 3, 'pouch'),

-- ATK & Rokok
('4902505163158', 'Pulpen Pilot G2 0.5 Black', 'c6666666-6666-6666-6666-666666666666', 'ba111111-1111-1111-1111-111111111111', 14000, 17000, 15, 3, 'pcs'),
('8999999710010', 'Sampoerna Mild 16', 'c6666666-6666-6666-6666-666666666666', 'ba111111-1111-1111-1111-111111111111', 31000, 34000, 20, 5, 'bungkus'),

-- Sembako dengan Barcode
('8992758110014', 'Minyak Goreng Bimoli 1L', 'c4444444-4444-4444-4444-444444444444', 'ba222222-2222-2222-2222-222222222222', 17500, 20000, 15, 4, 'pouch'),
('8998888123456', 'Gula Pasir Gulaku 1kg', 'c4444444-4444-4444-4444-444444444444', 'ba222222-2222-2222-2222-222222222222', 16000, 18500, 12, 4, 'bungkus'),

-- PRODUK TANPA BARCODE PABRIK (KODE INTERNAL PRD-XXX)
('PRD-001', 'Telur Ayam Negeri', 'c4444444-4444-4444-4444-444444444444', 'ba222222-2222-2222-2222-222222222222', 1800, 2200, 50, 10, 'butir'),
('PRD-002', 'Beras Ramos Premium', 'c4444444-4444-4444-4444-444444444444', 'ba222222-2222-2222-2222-222222222222', 12000, 14000, 60, 15, 'liter'),
('PRD-003', 'Kerupuk Kaleng Putih', 'c3333333-3333-3333-3333-333333333333', 'ba222222-2222-2222-2222-222222222222', 700, 1000, 30, 5, 'pcs'),
('PRD-004', 'Bumbu Racik Sayur Asem Indofood', 'c4444444-4444-4444-4444-444444444444', 'ba222222-2222-2222-2222-222222222222', 1800, 2500, 25, 5, 'bungkus'),
('PRD-005', 'Es Batu Kristal Kantong', 'c1111111-1111-1111-1111-111111111111', 'ba222222-2222-2222-2222-222222222222', 1500, 2500, 10, 3, 'kantong');

-- E. SAMPLE COMPLETED TRANSACTION (FOR DASHBOARD & REPORT VERIFICATION)
INSERT INTO transactions (id, invoice_number, user_id, total_amount, payment_method, cash_received, cash_change, status, created_at) VALUES
('da111111-1111-1111-1111-111111111111', 'TRX-20260928-001', '22222222-2222-2222-2222-222222222222', 27500, 'Tunai', 30000, 2500, 'Selesai', NOW() - INTERVAL '1 HOUR'),
('da222222-2222-2222-2222-222222222222', 'TRX-20260928-002', '22222222-2222-2222-2222-222222222222', 34000, 'QRIS', 34000, 0, 'Selesai', NOW() - INTERVAL '30 MINUTES');

INSERT INTO transaction_details (transaction_id, product_id, quantity, unit_price, subtotal)
SELECT 'da111111-1111-1111-1111-111111111111', id, 3, 3500, 10500 FROM products WHERE sku = '8992753123456';

INSERT INTO transaction_details (transaction_id, product_id, quantity, unit_price, subtotal)
SELECT 'da111111-1111-1111-1111-111111111111', id, 2, 4000, 8000 FROM products WHERE sku = '8998866200234';

INSERT INTO transaction_details (transaction_id, product_id, quantity, unit_price, subtotal)
SELECT 'da111111-1111-1111-1111-111111111111', id, 1, 9000, 9000 FROM products WHERE sku = '8996001300121';

INSERT INTO transaction_details (transaction_id, product_id, quantity, unit_price, subtotal)
SELECT 'da222222-2222-2222-2222-222222222222', id, 1, 34000, 34000 FROM products WHERE sku = '8999999710010';
