-- ==============================================================================
-- MIGRATION: MODUL 17 — Server-Side Cash Payment & Change Balance Validation
-- Description: Enforces strict server-side validation on cash_received and
--              cash_change in create_pos_transaction and adds check constraints
--              to ensure drawer cash integrity and prevent underpayment.
-- ==============================================================================

-- 1. Add table-level check constraint for cash & change balance integrity
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_tx_cash_integrity;
ALTER TABLE transactions ADD CONSTRAINT chk_tx_cash_integrity CHECK (
    (payment_method = 'Tunai' AND cash_received >= total_amount AND cash_change = (cash_received - total_amount))
    OR
    (payment_method = 'QRIS' AND (cash_change IS NULL OR cash_change = 0) AND (cash_received IS NULL OR cash_received >= total_amount))
    OR
    (payment_method NOT IN ('Tunai', 'QRIS'))
);

-- 2. Upgrade create_pos_transaction stored function with payment & change verification
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
    v_official_price NUMERIC;
    v_item_subtotal NUMERIC;
    v_calculated_total NUMERIC := 0;
    v_cash_change NUMERIC := 0;
    v_cash_received NUMERIC;
BEGIN
    -- 1. Validate items array is not empty
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Keranjang belanja tidak boleh kosong';
    END IF;

    -- 2. Lock stock, verify authoritative catalog price, and recalculate subtotals server-side
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT, unit_price NUMERIC, subtotal NUMERIC)
    LOOP
        -- Check quantity validity
        IF v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
            RAISE EXCEPTION 'Jumlah barang tidak valid (harus lebih besar dari 0)';
        END IF;

        -- Row-level locking to prevent race conditions during stock verification
        SELECT current_stock, name, sell_price INTO v_curr_stock, v_prod_name, v_official_price
        FROM products
        WHERE id = v_item.product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan', v_item.product_id;
        END IF;

        IF v_curr_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Stok produk "%" tidak mencukupi (Tersisa: %, Diminta: %)', v_prod_name, v_curr_stock, v_item.quantity;
        END IF;

        -- Authoritative server-side subtotal calculation from official products table price
        v_item_subtotal := v_official_price * v_item.quantity;
        v_calculated_total := v_calculated_total + v_item_subtotal;

        -- Anti-Price Tampering: detect if client attempted to manipulate item unit_price
        IF v_item.unit_price IS NOT NULL AND v_item.unit_price <> v_official_price THEN
            RAISE EXCEPTION 'Manipulasi harga terdeteksi pada produk "%": harga klien (Rp %) tidak sesuai dengan harga katalog resmi (Rp %)',
                v_prod_name, v_item.unit_price, v_official_price;
        END IF;

        -- Anti-Subtotal Tampering: detect if client attempted to manipulate item subtotal
        IF v_item.subtotal IS NOT NULL AND v_item.subtotal <> v_item_subtotal THEN
            RAISE EXCEPTION 'Manipulasi subtotal terdeteksi pada produk "%": subtotal klien (Rp %) tidak sesuai dengan perhitungan server (Rp %)',
                v_prod_name, v_item.subtotal, v_item_subtotal;
        END IF;
    END LOOP;

    -- 3. Anti-Grand Total Tampering: verify total amount matches authoritative sum
    IF p_total_amount IS NOT NULL AND p_total_amount <> v_calculated_total THEN
        RAISE EXCEPTION 'Manipulasi total transaksi terdeteksi: total klien (Rp %) tidak sesuai dengan kalkulasi server resmi (Rp %)',
            p_total_amount, v_calculated_total;
    END IF;

    -- 4. Payment Integrity & Cash Change Validation (Modul 17)
    IF p_payment_method NOT IN ('Tunai', 'QRIS') THEN
        RAISE EXCEPTION 'Metode pembayaran tidak valid: "%" (hanya "Tunai" atau "QRIS" yang diperbolehkan)', p_payment_method;
    END IF;

    IF p_payment_method = 'Tunai' THEN
        IF p_cash_received IS NULL OR p_cash_received < v_calculated_total THEN
            RAISE EXCEPTION 'Uang tunai yang diterima (Rp %) kurang dari total transaksi (Rp %)', 
                COALESCE(p_cash_received, 0), v_calculated_total;
        END IF;

        -- Authoritative calculation of cash change
        v_cash_change := p_cash_received - v_calculated_total;
        v_cash_received := p_cash_received;

        -- Detect if client attempted to tamper with cash change calculation
        IF p_cash_change IS NOT NULL AND p_cash_change <> v_cash_change THEN
            RAISE EXCEPTION 'Manipulasi kembalian terdeteksi: kembalian klien (Rp %) tidak sesuai kalkulasi resmi server (Rp %)',
                p_cash_change, v_cash_change;
        END IF;
    ELSIF p_payment_method = 'QRIS' THEN
        v_cash_received := COALESCE(p_cash_received, v_calculated_total);
        v_cash_change := 0;

        IF v_cash_received < v_calculated_total THEN
            RAISE EXCEPTION 'Nominal pembayaran QRIS (Rp %) tidak mencukupi total transaksi (Rp %)',
                v_cash_received, v_calculated_total;
        END IF;

        IF p_cash_change IS NOT NULL AND p_cash_change <> 0 THEN
            RAISE EXCEPTION 'Transaksi QRIS tidak boleh memiliki uang kembalian';
        END IF;
    END IF;

    -- 5. Insert authoritative transaction header
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
        v_calculated_total, -- Always authoritative server total
        p_payment_method,
        v_cash_received,    -- Always verified payment amount
        v_cash_change,      -- Always authoritative calculated change
        p_customer_phone,
        'Selesai'
    ) RETURNING id INTO v_tx_id;

    -- 6. Insert transaction details using authoritative official sell_price and subtotal, and deduct stock
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT, unit_price NUMERIC, subtotal NUMERIC)
    LOOP
        SELECT sell_price INTO v_official_price FROM products WHERE id = v_item.product_id;
        v_item_subtotal := v_official_price * v_item.quantity;

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
            v_official_price, -- Always authoritative catalog price
            v_item_subtotal   -- Always authoritative catalog subtotal
        );

        UPDATE products
        SET current_stock = current_stock - v_item.quantity
        WHERE id = v_item.product_id;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_tx_id,
        'invoice_number', p_invoice_number,
        'total_amount', v_calculated_total,
        'payment_method', p_payment_method,
        'cash_received', v_cash_received,
        'cash_change', v_cash_change,
        'message', 'Transaksi berhasil diproses'
    );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION create_pos_transaction TO anon, authenticated, service_role;
