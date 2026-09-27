-- ============================================================================
-- EXTRACTO ENTERPRISE - POSTGRESQL 15+ PRODUCTION DDL SCRIPT
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. SYSTEM BRANDING & SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_branding_config (
    id SERIAL PRIMARY KEY,
    application_name VARCHAR(120) NOT NULL DEFAULT 'Invoice Intelligence Platform',
    header_subtitle VARCHAR(255) NOT NULL DEFAULT 'Accounts Payable Automation & Ledger Reconciliation',
    footer_text VARCHAR(255) NOT NULL DEFAULT 'Enterprise Accounts Payable Automation • Multi-Tenant Engine',
    theme_color VARCHAR(30) NOT NULL DEFAULT 'indigo',
    auto_approve_reconciled BOOLEAN NOT NULL DEFAULT TRUE,
    confidence_threshold NUMERIC(5,2) NOT NULL DEFAULT 85.00,
    rounding_tolerance NUMERIC(5,2) NOT NULL DEFAULT 0.05,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. VENDOR MASTER CATALOG
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    vendor_code VARCHAR(64) UNIQUE NOT NULL,
    canonical_name VARCHAR(255) NOT NULL,
    default_category VARCHAR(100) DEFAULT 'General',
    default_payment_terms VARCHAR(100) DEFAULT 'Net 30 Days',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_code ON vendors(vendor_code);
CREATE INDEX IF NOT EXISTS idx_vendors_name_trgm ON vendors USING gin(canonical_name gin_trgm_ops);

-- 3. VENDOR TAX IDENTIFIERS
CREATE TABLE IF NOT EXISTS vendor_tax_ids (
    id SERIAL PRIMARY KEY,
    vendor_id INT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    tax_id VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) DEFAULT 'US',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vendor_tax_lookup ON vendor_tax_ids(tax_id);

-- 4. VENDOR ALIASES FOR FUZZY MATCHING
CREATE TABLE IF NOT EXISTS vendor_aliases (
    id SERIAL PRIMARY KEY,
    vendor_id INT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    alias_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vendor_aliases_trgm ON vendor_aliases USING gin(alias_name gin_trgm_ops);

-- 5. TAX CODE & GENERAL LEDGER MATRIX
CREATE TABLE IF NOT EXISTS tax_matrix_rules (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) UNIQUE NOT NULL,
    tax_code VARCHAR(50) NOT NULL,
    rate_percentage NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    gl_account VARCHAR(50) NOT NULL,
    cost_center VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. INVOICE BATCH AUDIT HEADERS
CREATE TABLE IF NOT EXISTS invoice_batches (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(100) UNIQUE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'RUNNING',
    total_invoices INT NOT NULL DEFAULT 0,
    valid_count INT NOT NULL DEFAULT 0,
    flagged_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_batches_batch_id ON invoice_batches(batch_id);

-- 7. PROCESSED INVOICE TRANSACTIONS (MASTER LEDGER)
CREATE TABLE IF NOT EXISTS processed_invoices (
    id SERIAL PRIMARY KEY,
    trace_id VARCHAR(64) UNIQUE NOT NULL,
    batch_id VARCHAR(100) REFERENCES invoice_batches(batch_id) ON DELETE SET NULL,
    vendor_id INT REFERENCES vendors(id) ON DELETE SET NULL,
    company_entity_code VARCHAR(50) NOT NULL DEFAULT 'CORP_HQ_01',
    vendor_code VARCHAR(64) NOT NULL,
    raw_vendor_name VARCHAR(255),
    raw_tax_id VARCHAR(100),
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE,
    due_date DATE,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    exchange_rate NUMERIC(14,6) DEFAULT 1.000000,
    converted_total_amount NUMERIC(14,2),
    expense_category VARCHAR(100),
    tax_code VARCHAR(50),
    gl_account VARCHAR(50),
    cost_center VARCHAR(50),
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    cgst NUMERIC(14,2) DEFAULT 0.00,
    sgst NUMERIC(14,2) DEFAULT 0.00,
    igst NUMERIC(14,2) DEFAULT 0.00,
    vat NUMERIC(14,2) DEFAULT 0.00,
    shipping_amount NUMERIC(14,2) DEFAULT 0.00,
    tip_amount NUMERIC(14,2) DEFAULT 0.00,
    discount_amount NUMERIC(14,2) DEFAULT 0.00,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'VALID',
    failure_reasons TEXT,
    discrepancy_amount NUMERIC(14,2) DEFAULT 0.00,
    confidence_score NUMERIC(5,2) DEFAULT 100.00,
    tokens_consumed INT DEFAULT 0,
    source_filename VARCHAR(255),
    source_sender_email VARCHAR(255),
    custom_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_vendor_invoice UNIQUE (vendor_code, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_trace ON processed_invoices(trace_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON processed_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_code ON processed_invoices(vendor_code);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON processed_invoices(invoice_date);

-- 8. ITEMIZED LINE ITEMS
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES processed_invoices(id) ON DELETE CASCADE,
    item_index INT NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(12,4) NOT NULL DEFAULT 1.0000,
    unit_price NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    tax_rate_percent NUMERIC(6,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_line_items_inv_id ON invoice_line_items(invoice_id);

-- 9. AUDIT LOG OF ADMINISTRATIVE & TRANSACTION CHANGES
CREATE TABLE IF NOT EXISTS administrative_audit_logs (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80) NOT NULL,
    action_type VARCHAR(40) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'PURGE_DEMO', 'CONFIG_SAVE'
    changed_by VARCHAR(120) NOT NULL DEFAULT 'system_admin',
    change_summary TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON administrative_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON administrative_audit_logs(timestamp DESC);
