-- ==============================================================================
-- MIGRATION: MODUL 20 — Immutable Security Audit Trail Logging
-- Description: Creates an append-only audit_logs table, strict database-enforced
--              immutability triggers (disallowing UPDATE and DELETE), automated
--              audit triggers for products (price & stock changes) and transactions
--              (creation & cancellation), and an RPC logging function.
-- ==============================================================================

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for fast query and audit inspection
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- 3. Strict Database-Enforced Immutability (Zero-Tampering Trigger)
-- Disallow any UPDATE or DELETE operations on audit_logs unconditionally
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Keamanan Audit Trail: Tabel audit_logs bersifat immutable (append-only). Operasi UPDATE atau DELETE dilarang demi kepatuhan non-repudiation.';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();

-- 4. Row Level Security (RLS) Configuration
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_policy" ON audit_logs;
CREATE POLICY "audit_logs_select_policy" ON audit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON audit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "audit_logs_update_policy" ON audit_logs;
CREATE POLICY "audit_logs_update_policy" ON audit_logs FOR UPDATE USING (false);

DROP POLICY IF EXISTS "audit_logs_delete_policy" ON audit_logs;
CREATE POLICY "audit_logs_delete_policy" ON audit_logs FOR DELETE USING (false);

-- 5. RPC Helper for Application-Layer Audit Logging
CREATE OR REPLACE FUNCTION log_security_audit_event(
    p_user_id UUID DEFAULT NULL,
    p_action TEXT DEFAULT 'SECURITY_EVENT',
    p_entity TEXT DEFAULT 'system',
    p_entity_id TEXT DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        entity,
        entity_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_action,
        p_entity,
        p_entity_id,
        p_old_values,
        p_new_values,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- 6. Automated Audit Trigger for Products Table (Prices, Stock, Creation, Deletion)
CREATE OR REPLACE FUNCTION audit_products_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        -- Audit Price Changes (HARGA_DIUBAH)
        IF (OLD.sell_price <> NEW.sell_price OR OLD.buy_price <> NEW.buy_price) THEN
            INSERT INTO audit_logs (
                action,
                entity,
                entity_id,
                old_values,
                new_values
            ) VALUES (
                'HARGA_DIUBAH',
                'products',
                NEW.id::text,
                jsonb_build_object(
                    'sku', OLD.sku,
                    'name', OLD.name,
                    'buy_price', OLD.buy_price,
                    'sell_price', OLD.sell_price
                ),
                jsonb_build_object(
                    'sku', NEW.sku,
                    'name', NEW.name,
                    'buy_price', NEW.buy_price,
                    'sell_price', NEW.sell_price
                )
            );
        END IF;

        -- Audit Stock Adjustments (STOK_DISESUAIKAN)
        IF (OLD.current_stock <> NEW.current_stock) THEN
            INSERT INTO audit_logs (
                action,
                entity,
                entity_id,
                old_values,
                new_values
            ) VALUES (
                'STOK_DISESUAIKAN',
                'products',
                NEW.id::text,
                jsonb_build_object(
                    'sku', OLD.sku,
                    'name', OLD.name,
                    'current_stock', OLD.current_stock
                ),
                jsonb_build_object(
                    'sku', NEW.sku,
                    'name', NEW.name,
                    'current_stock', NEW.current_stock,
                    'delta', (NEW.current_stock - OLD.current_stock)
                )
            );
        END IF;

        -- Audit General Product Info Updates (PRODUK_DIUBAH)
        IF (OLD.sell_price = NEW.sell_price AND OLD.buy_price = NEW.buy_price AND OLD.current_stock = NEW.current_stock) THEN
            INSERT INTO audit_logs (
                action,
                entity,
                entity_id,
                old_values,
                new_values
            ) VALUES (
                'PRODUK_DIUBAH',
                'products',
                NEW.id::text,
                jsonb_build_object('name', OLD.name, 'is_active', OLD.is_active, 'category_id', OLD.category_id),
                jsonb_build_object('name', NEW.name, 'is_active', NEW.is_active, 'category_id', NEW.category_id)
            );
        END IF;

        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (
            action,
            entity,
            entity_id,
            new_values
        ) VALUES (
            'PRODUK_DIBUAT',
            'products',
            NEW.id::text,
            jsonb_build_object(
                'sku', NEW.sku,
                'name', NEW.name,
                'buy_price', NEW.buy_price,
                'sell_price', NEW.sell_price,
                'current_stock', NEW.current_stock
            )
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (
            action,
            entity,
            entity_id,
            old_values
        ) VALUES (
            'PRODUK_DIHAPUS',
            'products',
            OLD.id::text,
            jsonb_build_object(
                'sku', OLD.sku,
                'name', OLD.name,
                'current_stock', OLD.current_stock
            )
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_products ON products;
CREATE TRIGGER trg_audit_products
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION audit_products_trigger_func();

-- 7. Automated Audit Trigger for Transactions Table (Creation, Cancellation)
CREATE OR REPLACE FUNCTION audit_transactions_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        -- Audit Transaction Cancellation (TRANSAKSI_DIBATALKAN)
        IF (OLD.status <> NEW.status AND NEW.status = 'Dibatalkan') THEN
            INSERT INTO audit_logs (
                user_id,
                action,
                entity,
                entity_id,
                old_values,
                new_values
            ) VALUES (
                NEW.user_id,
                'TRANSAKSI_DIBATALKAN',
                'transactions',
                NEW.id::text,
                jsonb_build_object(
                    'invoice_number', OLD.invoice_number,
                    'status', OLD.status,
                    'total_amount', OLD.total_amount
                ),
                jsonb_build_object(
                    'invoice_number', NEW.invoice_number,
                    'status', NEW.status
                )
            );
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        -- Audit Transaction Creation (TRANSAKSI_DIBUAT)
        INSERT INTO audit_logs (
            user_id,
            action,
            entity,
            entity_id,
            new_values
        ) VALUES (
            NEW.user_id,
            'TRANSAKSI_DIBUAT',
            'transactions',
            NEW.id::text,
            jsonb_build_object(
                'invoice_number', NEW.invoice_number,
                'total_amount', NEW.total_amount,
                'payment_method', NEW.payment_method,
                'cash_received', NEW.cash_received,
                'cash_change', NEW.cash_change
            )
        );
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_transactions ON transactions;
CREATE TRIGGER trg_audit_transactions
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION audit_transactions_trigger_func();

-- 8. Enable Supabase Realtime Replication for audit_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'audit_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
    END IF;
END $$;
