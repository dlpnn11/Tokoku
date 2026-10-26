-- ==============================================================================
-- MIGRATION: 20261026_pos_shift_cash_reconciliation.sql
-- MODUL 24: POS SHIFT CASH RECONCILIATION & BLIND BALANCING
-- ==============================================================================

-- 1. Table: pos_shifts (POS Cashier Shifts & Cash Drawer Tracking)
CREATE TABLE IF NOT EXISTS pos_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cashier_name TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    starting_cash NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (starting_cash >= 0),
    expected_cash NUMERIC(12, 2),
    actual_cash NUMERIC(12, 2),
    discrepancy NUMERIC(12, 2),
    total_cash_sales NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_cash_sales >= 0),
    total_qris_sales NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_qris_sales >= 0),
    total_sales NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_sales >= 0),
    transactions_count INTEGER NOT NULL DEFAULT 0 CHECK (transactions_count >= 0),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_pos_shifts_user_id ON pos_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_shifts_status ON pos_shifts(status);
CREATE INDEX IF NOT EXISTS idx_pos_shifts_created_at ON pos_shifts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_shifts_start_time ON pos_shifts(start_time DESC);

-- 3. Realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE pos_shifts;

-- 4. Row Level Security (RLS)
ALTER TABLE pos_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_shifts_select_policy" ON pos_shifts
    FOR SELECT USING (true);

CREATE POLICY "pos_shifts_insert_policy" ON pos_shifts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "pos_shifts_update_policy" ON pos_shifts
    FOR UPDATE USING (true);
