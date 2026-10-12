-- ==============================================================================
-- TOKOKU POS — ROW LEVEL SECURITY (RLS) HARDENING MIGRATION
-- Migration: 20261012_harden_row_level_security.sql
-- ==============================================================================

-- 1. DROP EXISTING OVERLY PERMISSIVE POLICIES
DROP POLICY IF EXISTS "Allow all on users" ON users;
DROP POLICY IF EXISTS "Allow all on categories" ON categories;
DROP POLICY IF EXISTS "Allow all on suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow all on products" ON products;
DROP POLICY IF EXISTS "Allow all on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow all on transaction_details" ON transaction_details;

-- 2. USERS TABLE POLICIES
-- Drop existing custom policies if any
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Allow SELECT for displaying cashier/owner names in transaction history & app header
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (true);

-- Explicitly block untrusted client insertions, updates, and deletions
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (false);

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (false);

CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (false);

-- 3. TRANSACTIONS TABLE POLICIES (IMMUTABLE FINANCIAL RECORDS)
-- Drop existing custom policies if any
DROP POLICY IF EXISTS "transactions_select_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_update_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_delete_policy" ON transactions;

-- Allow SELECT for POS cashier history, receipts, and financial reports
CREATE POLICY "transactions_select_policy" ON transactions
    FOR SELECT USING (true);

-- Disallow direct client INSERT; transactions MUST be created through atomic RPC create_pos_transaction
CREATE POLICY "transactions_insert_policy" ON transactions
    FOR INSERT WITH CHECK (false);

-- Disallow direct client UPDATE & DELETE (transactions and receipts are immutable)
CREATE POLICY "transactions_update_policy" ON transactions
    FOR UPDATE USING (false);

CREATE POLICY "transactions_delete_policy" ON transactions
    FOR DELETE USING (false);

-- 4. TRANSACTION_DETAILS TABLE POLICIES
-- Drop existing custom policies if any
DROP POLICY IF EXISTS "transaction_details_select_policy" ON transaction_details;
DROP POLICY IF EXISTS "transaction_details_insert_policy" ON transaction_details;
DROP POLICY IF EXISTS "transaction_details_update_policy" ON transaction_details;
DROP POLICY IF EXISTS "transaction_details_delete_policy" ON transaction_details;

-- Allow SELECT for receipt itemization and sales reports
CREATE POLICY "transaction_details_select_policy" ON transaction_details
    FOR SELECT USING (true);

-- Disallow direct client INSERT, UPDATE, DELETE (only created via create_pos_transaction RPC)
CREATE POLICY "transaction_details_insert_policy" ON transaction_details
    FOR INSERT WITH CHECK (false);

CREATE POLICY "transaction_details_update_policy" ON transaction_details
    FOR UPDATE USING (false);

CREATE POLICY "transaction_details_delete_policy" ON transaction_details
    FOR DELETE USING (false);

-- 5. PRODUCTS, CATEGORIES, SUPPLIERS POLICIES
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;

CREATE POLICY "products_select_policy" ON products
    FOR SELECT USING (true);

CREATE POLICY "products_insert_policy" ON products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "products_update_policy" ON products
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "products_delete_policy" ON products
    FOR DELETE USING (true);

DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
DROP POLICY IF EXISTS "categories_update_policy" ON categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON categories;

CREATE POLICY "categories_select_policy" ON categories
    FOR SELECT USING (true);

CREATE POLICY "categories_insert_policy" ON categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "categories_update_policy" ON categories
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "categories_delete_policy" ON categories
    FOR DELETE USING (true);

DROP POLICY IF EXISTS "suppliers_select_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_insert_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_update_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_delete_policy" ON suppliers;

CREATE POLICY "suppliers_select_policy" ON suppliers
    FOR SELECT USING (true);

CREATE POLICY "suppliers_insert_policy" ON suppliers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "suppliers_update_policy" ON suppliers
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "suppliers_delete_policy" ON suppliers
    FOR DELETE USING (true);

-- 6. UPGRADE create_pos_transaction TO SECURITY DEFINER & SECURE search_path
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
SECURITY DEFINER
SET search_path = public
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
        'message', 'Transaksi berhasil diproses'
    );
END;
$$;
