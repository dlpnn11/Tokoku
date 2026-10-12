-- ==============================================================================
-- TOKOKU POS — DATABASE INTEGRITY CONSTRAINTS (ANTI-DATA CORRUPTION)
-- Migration: 20261012_add_check_constraints.sql
-- ==============================================================================

-- 1. PRODUCTS TABLE CONSTRAINTS
ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_sell_price;
ALTER TABLE products ADD CONSTRAINT chk_products_sell_price CHECK (sell_price >= 0);

ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_buy_price;
ALTER TABLE products ADD CONSTRAINT chk_products_buy_price CHECK (buy_price >= 0);

ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_current_stock;
ALTER TABLE products ADD CONSTRAINT chk_products_current_stock CHECK (current_stock >= 0);

ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_min_stock;
ALTER TABLE products ADD CONSTRAINT chk_products_min_stock CHECK (minimum_stock >= 0);

-- 2. TRANSACTIONS TABLE CONSTRAINTS
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_tx_total_amount;
ALTER TABLE transactions ADD CONSTRAINT chk_tx_total_amount CHECK (total_amount >= 0);

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_tx_cash_received;
ALTER TABLE transactions ADD CONSTRAINT chk_tx_cash_received CHECK (cash_received IS NULL OR cash_received >= 0);

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_tx_cash_change;
ALTER TABLE transactions ADD CONSTRAINT chk_tx_cash_change CHECK (cash_change IS NULL OR cash_change >= 0);

-- 3. TRANSACTION DETAILS TABLE CONSTRAINTS
ALTER TABLE transaction_details DROP CONSTRAINT IF EXISTS chk_txd_quantity;
ALTER TABLE transaction_details ADD CONSTRAINT chk_txd_quantity CHECK (quantity > 0);

ALTER TABLE transaction_details DROP CONSTRAINT IF EXISTS chk_txd_unit_price;
ALTER TABLE transaction_details ADD CONSTRAINT chk_txd_unit_price CHECK (unit_price >= 0);

ALTER TABLE transaction_details DROP CONSTRAINT IF EXISTS chk_txd_subtotal;
ALTER TABLE transaction_details ADD CONSTRAINT chk_txd_subtotal CHECK (subtotal >= 0);
