from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from ai.schemas import NormalizedInvoice

@dataclass
class ValidationResult:
    is_valid: bool
    status: str  # "VALID" or "FLAGGED_REVIEW"
    discrepancy_amount: float = 0.0
    failure_reasons: List[str] = field(default_factory=list)
    line_item_subtotal_diff: float = 0.0

class InvoiceValidator:
    """Validates arithmetic consistency, date schemas, and monetary invariants."""

    def __init__(self, tolerance: float = 0.05):
        self.tolerance = tolerance

    def validate(self, invoice: NormalizedInvoice) -> ValidationResult:
        reasons: List[str] = []
        is_valid = True

        subtotal = round(invoice.financials.subtotal, 2)
        total_tax = round(invoice.financials.total_tax, 2)
        service_charges = round(invoice.financials.service_charges or 0.0, 2)
        tip = round(invoice.financials.tip or 0.0, 2)
        discount = round(invoice.financials.discount or 0.0, 2)
        total_amount = round(invoice.financials.total_amount, 2)

        # 1. Total arithmetic reconciliation: (Subtotal + Tax + Charges + Tip - Discount) == Total
        calculated_total = round(subtotal + total_tax + service_charges + tip - discount, 2)
        discrepancy = round(abs(calculated_total - total_amount), 2)

        if discrepancy > self.tolerance:
            is_valid = False
            reasons.append(
                f"ARITHMETIC_MISMATCH: Subtotal ({subtotal}) + Tax ({total_tax}) + Fees ({service_charges}) "
                f"+ Tip ({tip}) - Discount ({discount}) = {calculated_total}, but Total is {total_amount} "
                f"(Diff: {discrepancy} > tolerance {self.tolerance})"
            )

        # 2. Line Items vs Subtotal validation
        if invoice.line_items:
            line_sum = round(sum(item.line_total for item in invoice.line_items), 2)
            line_diff = round(abs(line_sum - subtotal), 2)
            if line_diff > self.tolerance:
                reasons.append(
                    f"LINE_ITEMS_MISMATCH: Sum of line items ({line_sum}) differs from invoice Subtotal ({subtotal}) "
                    f"by {line_diff}"
                )

        # 3. ISO 8601 Date validations
        if invoice.header.invoice_date:
            try:
                datetime.fromisoformat(invoice.header.invoice_date.replace("Z", "+00:00"))
            except ValueError:
                is_valid = False
                reasons.append(f"INVALID_DATE_FORMAT: Invoice date '{invoice.header.invoice_date}' is not ISO 8601")

        if invoice.header.due_date:
            try:
                datetime.fromisoformat(invoice.header.due_date.replace("Z", "+00:00"))
            except ValueError:
                is_valid = False
                reasons.append(f"INVALID_DUE_DATE_FORMAT: Due date '{invoice.header.due_date}' is not ISO 8601")

        # 4. Mandatory header fields
        if not invoice.header.invoice_number or invoice.header.invoice_number.strip().upper() in ("N/A", "UNKNOWN", ""):
            reasons.append("MISSING_INVOICE_NUMBER: Invoice number is absent or unparseable")

        if not invoice.vendor.name or invoice.vendor.name.strip().upper() in ("UNKNOWN", ""):
            reasons.append("MISSING_VENDOR_NAME: Vendor name could not be extracted")

        status = "VALID" if is_valid and not reasons else "FLAGGED_REVIEW"

        return ValidationResult(
            is_valid=(status == "VALID"),
            status=status,
            discrepancy_amount=discrepancy,
            failure_reasons=reasons,
        )
