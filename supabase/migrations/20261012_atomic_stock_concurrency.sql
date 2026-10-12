-- ==============================================================================
-- TOKOKU POS — ATOMIC CONCURRENCY & ROW-LEVEL LOCKING MIGRATION
-- Migration: 20261012_atomic_stock_concurrency.sql
-- ==============================================================================

-- 1. ATOMIC DELTA STOCK ADJUSTMENT (Restock, Return, or Scrap with FOR UPDATE lock)
CREATE OR REPLACE FUNCTION adjust_product_stock_delta(
    p_product_id UUID,
    p_delta INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_curr_stock INT;
    v_prod_name TEXT;
    v_new_stock INT;
    v_updated_product JSONB;
BEGIN
    -- 1. Acquire exclusive row-level lock on the product row
    SELECT current_stock, name INTO v_curr_stock, v_prod_name
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan', p_product_id;
    END IF;

    v_new_stock := v_curr_stock + p_delta;

    -- 2. Validate resulting stock is not negative
    IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'Pengurangan stok melebihi stok yang tersedia untuk produk "%" (Tersisa: %, Perubahan: %)', 
            v_prod_name, v_curr_stock, p_delta;
    END IF;

    -- 3. Atomically update the stock
    UPDATE products
    SET current_stock = v_new_stock
    WHERE id = p_product_id;

    -- 4. Retrieve updated product representation
    SELECT to_jsonb(p) INTO v_updated_product
    FROM products p
    WHERE p.id = p_product_id;

    RETURN jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'old_stock', v_curr_stock,
        'new_stock', v_new_stock,
        'product', v_updated_product
    );
END;
$$;

-- 2. ATOMIC SET STOCK FUNCTION (Stock Opname with FOR UPDATE row lock)
CREATE OR REPLACE FUNCTION set_product_stock_atomic(
    p_product_id UUID,
    p_new_stock INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_curr_stock INT;
    v_prod_name TEXT;
    v_updated_product JSONB;
BEGIN
    IF p_new_stock < 0 THEN
        RAISE EXCEPTION 'Stok baru tidak boleh bernilai negatif (Diberikan: %)', p_new_stock;
    END IF;

    -- Acquire exclusive row-level lock
    SELECT current_stock, name INTO v_curr_stock, v_prod_name
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan', p_product_id;
    END IF;

    -- Atomically update stock
    UPDATE products
    SET current_stock = p_new_stock
    WHERE id = p_product_id;

    SELECT to_jsonb(p) INTO v_updated_product
    FROM products p
    WHERE p.id = p_product_id;

    RETURN jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'old_stock', v_curr_stock,
        'new_stock', p_new_stock,
        'product', v_updated_product
    );
END;
$$;
