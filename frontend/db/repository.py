import json
import os
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import or_
from sqlalchemy.orm import Session
from core.logger import get_logger
from core.pipeline import PipelineContext, PipelineItem
from db.models import (
    VendorEntity,
    VendorTaxId,
    VendorAlias,
    InvoiceBatchRecord,
    ProcessedInvoiceRecord,
    LineItemRecord,
    InvoiceAuditTrail,
)

class DatabaseRepository:
    """Repository managing transactions for MySQL & PostgreSQL backends."""

    def __init__(self, session: Session):
        self.session = session
        self.logger = get_logger()

    def seed_vendors_from_json(self, vendors_json_path: str = "config/vendors.json") -> int:
        """Seeds or updates vendor registry from vendors.json file."""
        if not os.path.exists(vendors_json_path):
            return 0

        with open(vendors_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            vendor_list = data.get("vendors", [])

        count = 0
        for v in vendor_list:
            v_code = v.get("vendor_code")
            existing = self.session.query(VendorEntity).filter_by(vendor_code=v_code).first()

            if not existing:
                vendor = VendorEntity(
                    vendor_code=v_code,
                    canonical_name=v.get("canonical_name", ""),
                    default_category=v.get("default_category"),
                    default_payment_terms=v.get("default_payment_terms"),
                    is_active=True,
                )
                self.session.add(vendor)
                self.session.flush()

                # Add tax IDs
                for tax in v.get("tax_ids", []):
                    self.session.add(VendorTaxId(vendor_id=vendor.id, tax_id=tax.strip().upper()))

                # Add aliases
                for alias in v.get("aliases", []):
                    self.session.add(VendorAlias(vendor_id=vendor.id, alias_name=alias.strip()))

                count += 1

        self.session.commit()
        if count > 0:
            self.logger.info("vendors_seeded_to_db", new_vendors_count=count)
        return count

    def get_all_vendors_with_aliases(self) -> List[Dict[str, Any]]:
        """Retrieves all vendors with associated tax IDs and aliases for resolution."""
        vendors = self.session.query(VendorEntity).filter_by(is_active=True).all()
        result = []
        for v in vendors:
            result.append({
                "vendor_id": v.id,
                "vendor_code": v.vendor_code,
                "canonical_name": v.canonical_name,
                "default_category": v.default_category,
                "tax_ids": [t.tax_id for t in v.tax_ids],
                "aliases": [a.alias_name for a in v.aliases],
            })
        return result

    def create_batch_record(self, batch_id: str, total_count: int) -> InvoiceBatchRecord:
        """Initializes a new batch log record."""
        batch = InvoiceBatchRecord(
            batch_id=batch_id,
            total_invoices=total_count,
            status="RUNNING",
        )
        self.session.add(batch)
        self.session.commit()
        return batch

    def finalize_batch(self, batch_id: str, valid_count: int, flagged_count: int, status: str = "COMPLETED") -> None:
        """Updates batch summary with final counts."""
        batch = self.session.query(InvoiceBatchRecord).filter_by(batch_id=batch_id).first()
        if batch:
            batch.valid_count = valid_count
            batch.flagged_count = flagged_count
            batch.status = status
            self.session.commit()

    def persist_pipeline_item(self, batch_id: str, item: PipelineItem, fixed_fields: Dict[str, Any]) -> ProcessedInvoiceRecord:
        """Stores normalized invoice, line items, and audit trails in a single atomic transaction."""
        inv = item.invoice
        reasons_str = " | ".join(item.validation.failure_reasons) if item.validation else (item.error or "")

        # Look up vendor foreign key if known
        vendor_rec = self.session.query(VendorEntity).filter_by(vendor_code=item.vendor_code).first()
        vendor_id = vendor_rec.id if vendor_rec else None

        record = ProcessedInvoiceRecord(
            trace_id=item.trace_id,
            batch_id=batch_id,
            vendor_id=vendor_id,
            company_entity_code=fixed_fields.get("Company_Entity_Code", "CORP_HQ_01"),
            vendor_code=item.vendor_code,
            raw_vendor_name=inv.vendor.name if inv else "",
            raw_tax_id=inv.vendor.tax_id if inv else "",
            invoice_number=inv.header.invoice_number if inv else "N/A",
            invoice_date=inv.header.invoice_date if inv else "",
            due_date=inv.header.due_date if inv else "",
            currency=inv.header.currency if inv else fixed_fields.get("Default_Currency", "USD"),
            expense_category=inv.expense_classification.value if inv else "Other",
            tax_code=item.tax_code,
            gl_account=item.gl_account,
            cost_center=item.cost_center,
            subtotal=inv.financials.subtotal if inv else 0.0,
            tax_amount=inv.financials.total_tax if inv else 0.0,
            service_charges=inv.financials.service_charges if inv else 0.0,
            tip=inv.financials.tip if inv else 0.0,
            discount=inv.financials.discount if inv else 0.0,
            total_amount=inv.financials.total_amount if inv else 0.0,
            validation_status=item.validation.status if item.validation else "FLAGGED_REVIEW",
            failure_reasons=reasons_str,
            discrepancy_amount=item.validation.discrepancy_amount if item.validation else 0.0,
            confidence_score=inv.confidence_score if inv else 0.0,
            tokens_consumed=item.tokens_consumed,
            source_filename=item.attachment.filename,
            source_sender_email=item.attachment.sender_email,
        )

        self.session.add(record)
        self.session.flush()

        # Persist itemized line items
        if inv and inv.line_items:
            for idx, li in enumerate(inv.line_items):
                line_rec = LineItemRecord(
                    invoice_id=record.id,
                    item_index=idx + 1,
                    description=li.description,
                    quantity=li.quantity,
                    unit_price=li.unit_price,
                    line_total=li.line_total,
                )
                self.session.add(line_rec)

        # Audit trail entry
        audit = InvoiceAuditTrail(
            invoice_id=record.id,
            trace_id=item.trace_id,
            stage="DB_PERSIST",
            status="SUCCESS" if record.validation_status == "VALID" else "WARNING",
            message=f"Persisted to database with status: {record.validation_status}",
            metadata_json=json.dumps({
                "vendor_code": item.vendor_code,
                "tax_code": item.tax_code,
                "total": float(record.total_amount),
            }),
        )
        self.session.add(audit)
        self.session.commit()
        return record
