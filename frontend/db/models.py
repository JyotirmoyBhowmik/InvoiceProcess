from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Boolean,
    Text,
    ForeignKey,
    Numeric,
    Index,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class VendorEntity(Base):
    """Standardized Vendor master registry for SAP/Oracle ERP integration."""
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vendor_code = Column(String(50), unique=True, nullable=False, index=True)
    canonical_name = Column(String(255), nullable=False, index=True)
    default_category = Column(String(100), nullable=True)
    default_payment_terms = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    tax_ids = relationship("VendorTaxId", back_populates="vendor", cascade="all, delete-orphan")
    aliases = relationship("VendorAlias", back_populates="vendor", cascade="all, delete-orphan")
    invoices = relationship("ProcessedInvoiceRecord", back_populates="vendor_rel")

class VendorTaxId(Base):
    """Tax identifiers (EIN, VAT, GSTIN, PAN) tied to vendor entity."""
    __tablename__ = "vendor_tax_ids"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    tax_id = Column(String(100), nullable=False, index=True)
    country_code = Column(String(10), nullable=True)

    vendor = relationship("VendorEntity", back_populates="tax_ids")

    __table_args__ = (
        Index("idx_vendor_tax_lookup", "tax_id"),
    )

class VendorAlias(Base):
    """Known trade names, aliases, and OCR variations."""
    __tablename__ = "vendor_aliases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    alias_name = Column(String(255), nullable=False, index=True)

    vendor = relationship("VendorEntity", back_populates="aliases")

class InvoiceBatchRecord(Base):
    """Tracks batch processing runs from email ingestion."""
    __tablename__ = "invoice_batches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(100), unique=True, nullable=False, index=True)
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="RUNNING", nullable=False) # RUNNING, COMPLETED, FAILED
    total_invoices = Column(Integer, default=0)
    valid_count = Column(Integer, default=0)
    flagged_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    invoices = relationship("ProcessedInvoiceRecord", back_populates="batch_rel")

class ProcessedInvoiceRecord(Base):
    """Normalized invoice metadata and financial summary."""
    __tablename__ = "processed_invoices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trace_id = Column(String(64), unique=True, nullable=False, index=True)
    batch_id = Column(String(100), ForeignKey("invoice_batches.batch_id"), nullable=False, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)

    company_entity_code = Column(String(50), nullable=False)
    vendor_code = Column(String(50), nullable=False, index=True)
    raw_vendor_name = Column(String(255), nullable=True)
    raw_tax_id = Column(String(100), nullable=True)

    invoice_number = Column(String(100), nullable=False, index=True)
    invoice_date = Column(String(20), nullable=True)
    due_date = Column(String(20), nullable=True)
    currency = Column(String(10), default="USD", nullable=False)
    expense_category = Column(String(100), nullable=True)
    tax_code = Column(String(50), nullable=True)
    gl_account = Column(String(50), nullable=True)
    cost_center = Column(String(50), nullable=True)

    subtotal = Column(Numeric(14, 2), default=0.00, nullable=False)
    tax_amount = Column(Numeric(14, 2), default=0.00, nullable=False)
    service_charges = Column(Numeric(14, 2), default=0.00)
    tip = Column(Numeric(14, 2), default=0.00)
    discount = Column(Numeric(14, 2), default=0.00)
    total_amount = Column(Numeric(14, 2), default=0.00, nullable=False)

    validation_status = Column(String(50), default="VALID", nullable=False) # VALID, FLAGGED_REVIEW
    failure_reasons = Column(Text, nullable=True)
    discrepancy_amount = Column(Numeric(14, 2), default=0.00)

    confidence_score = Column(Float, default=1.0)
    tokens_consumed = Column(Integer, default=0)
    source_filename = Column(String(255), nullable=True)
    source_sender_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    batch_rel = relationship("InvoiceBatchRecord", back_populates="invoices")
    vendor_rel = relationship("VendorEntity", back_populates="invoices")
    line_items = relationship("LineItemRecord", back_populates="invoice", cascade="all, delete-orphan")
    audit_logs = relationship("InvoiceAuditTrail", back_populates="invoice", cascade="all, delete-orphan")

class LineItemRecord(Base):
    """Extracted itemized billable line items."""
    __tablename__ = "invoice_line_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_id = Column(Integer, ForeignKey("processed_invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    item_index = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    quantity = Column(Numeric(12, 3), default=1.000, nullable=False)
    unit_price = Column(Numeric(14, 2), default=0.00, nullable=False)
    line_total = Column(Numeric(14, 2), default=0.00, nullable=False)

    invoice = relationship("ProcessedInvoiceRecord", back_populates="line_items")

class InvoiceAuditTrail(Base):
    """Audit log capturing every pipeline stage transition."""
    __tablename__ = "invoice_audit_trail"

    id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_id = Column(Integer, ForeignKey("processed_invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    trace_id = Column(String(64), nullable=False, index=True)
    stage = Column(String(50), nullable=False) # EMAIL_INGEST, OCR_EXTRACT, RULE_RESOLVE, VALIDATE, DB_PERSIST, ERP_EXPORT
    status = Column(String(20), nullable=False) # SUCCESS, WARNING, ERROR
    message = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    invoice = relationship("ProcessedInvoiceRecord", back_populates="audit_logs")
