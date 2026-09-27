-- ============================================================================
-- EXTRACTO ENTERPRISE - MYSQL 8.0+ PRODUCTION DDL SCRIPT
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. SYSTEM BRANDING & SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_branding_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_name VARCHAR(120) NOT NULL DEFAULT 'Invoice Intelligence Platform',
    header_subtitle VARCHAR(255) NOT NULL DEFAULT 'Accounts Payable Automation & Ledger Reconciliation',
    footer_text VARCHAR(255) NOT NULL DEFAULT 'Enterprise Accounts Payable Automation • Multi-Tenant Engine',
    theme_color VARCHAR(30) NOT NULL DEFAULT 'indigo',
    auto_approve_reconciled TINYINT(1) NOT NULL DEFAULT 1,
    confidence_threshold DECIMAL(5,2) NOT NULL DEFAULT 85.00,
    rounding_tolerance DECIMAL(5,2) NOT NULL DEFAULT 0.05,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. VENDOR MASTER CATALOG
CREATE TABLE IF NOT EXISTS vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_code VARCHAR(64) UNIQUE NOT NULL,
    canonical_name VARCHAR(255) NOT NULL,
    default_category VARCHAR(100) DEFAULT 'General',
    default_payment_terms VARCHAR(100) DEFAULT 'Net 30 Days',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    custom_fields JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vendors_code (vendor_code),
    INDEX idx_vendors_name (canonical_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. VENDOR TAX IDENTIFIERS
CREATE TABLE IF NOT EXISTS vendor_tax_ids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    tax_id VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) DEFAULT 'US',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tax_vendor (vendor_id),
    INDEX idx_tax_lookup (tax_id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. VENDOR ALIASES
CREATE TABLE IF NOT EXISTS vendor_aliases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    alias_name VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_alias_vendor (vendor_id),
    INDEX idx_alias_name (alias_name),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TAX CODE & GL MATRIX
CREATE TABLE IF NOT EXISTS tax_matrix_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) UNIQUE NOT NULL,
    tax_code VARCHAR(50) NOT NULL,
    rate_percentage DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    gl_account VARCHAR(50) NOT NULL,
    cost_center VARCHAR(50) NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. INVOICE BATCHES
CREATE TABLE IF NOT EXISTS invoice_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id VARCHAR(100) UNIQUE NOT NULL,
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'RUNNING',
    total_invoices INT NOT NULL DEFAULT 0,
    valid_count INT NOT NULL DEFAULT 0,
    flagged_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_batch_id (batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. PROCESSED INVOICES
CREATE TABLE IF NOT EXISTS processed_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trace_id VARCHAR(64) UNIQUE NOT NULL,
    batch_id VARCHAR(100) NULL,
    vendor_id INT NULL,
    company_entity_code VARCHAR(50) NOT NULL DEFAULT 'CORP_HQ_01',
    vendor_code VARCHAR(64) NOT NULL,
    raw_vendor_name VARCHAR(255),
    raw_tax_id VARCHAR(100),
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE,
    due_date DATE,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    exchange_rate DECIMAL(14,6) DEFAULT 1.000000,
    converted_total_amount DECIMAL(14,2),
    expense_category VARCHAR(100),
    tax_code VARCHAR(50),
    gl_account VARCHAR(50),
    cost_center VARCHAR(50),
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    cgst DECIMAL(14,2) DEFAULT 0.00,
    sgst DECIMAL(14,2) DEFAULT 0.00,
    igst DECIMAL(14,2) DEFAULT 0.00,
    vat DECIMAL(14,2) DEFAULT 0.00,
    shipping_amount DECIMAL(14,2) DEFAULT 0.00,
    tip_amount DECIMAL(14,2) DEFAULT 0.00,
    discount_amount DECIMAL(14,2) DEFAULT 0.00,
    total_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'VALID',
    failure_reasons TEXT,
    discrepancy_amount DECIMAL(14,2) DEFAULT 0.00,
    confidence_score DECIMAL(5,2) DEFAULT 100.00,
    tokens_consumed INT DEFAULT 0,
    source_filename VARCHAR(255),
    source_sender_email VARCHAR(255),
    custom_metadata JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_vendor_invoice (vendor_code, invoice_number),
    INDEX idx_trace_id (trace_id),
    INDEX idx_inv_number (invoice_number),
    FOREIGN KEY (batch_id) REFERENCES invoice_batches(batch_id) ON DELETE SET NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. INVOICE LINE ITEMS
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    item_index INT NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(12,4) NOT NULL DEFAULT 1.0000,
    unit_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    tax_rate_percent DECIMAL(6,2) DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item_invoice (invoice_id),
    FOREIGN KEY (invoice_id) REFERENCES processed_invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS administrative_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80) NOT NULL,
    action_type VARCHAR(40) NOT NULL,
    changed_by VARCHAR(120) NOT NULL DEFAULT 'system_admin',
    change_summary TEXT NOT NULL,
    previous_state JSON NULL,
    new_state JSON NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_time (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
