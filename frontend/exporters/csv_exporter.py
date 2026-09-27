import csv
import os
from datetime import datetime
from typing import Any, Dict, List
from core.logger import get_logger
from core.pipeline import PipelineContext, PipelineItem

class CsvExporter:
    """Generates standard CSV records for ERP ingestion and a separate exceptions CSV."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config.get("outputs", {}).get("csv", {})
        self.output_dir = self.config.get("output_dir", "./output/csv")
        self.columns = self.config.get("columns", [
            "Company_Entity_Code", "Vendor_Code", "Invoice_Number", "Invoice_Date",
            "Expense_Category", "Tax_Code", "Subtotal", "Tax_Amount", "Total_Amount", "Trace_ID"
        ])
        self.logger = get_logger()
        os.makedirs(self.output_dir, exist_ok=True)

    def export(self, context: PipelineContext) -> List[str]:
        if not self.config.get("enabled", True):
            return []

        generated_files: List[str] = []
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        fixed_fields = context.config.get("rules", {}).get("fixed_fields", {})

        # 1. Export valid invoices
        if context.valid_items:
            valid_path = os.path.join(self.output_dir, f"invoices_{context.batch_id}_{timestamp}.csv")
            with open(valid_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(self.columns)

                for item in context.valid_items:
                    if not item.invoice:
                        continue
                    row = self._build_row(item, fixed_fields)
                    writer.writerow(row)

            self.logger.info("valid_csv_exported", path=valid_path, row_count=len(context.valid_items))
            generated_files.append(valid_path)

        # 2. Export exceptions queue
        if context.flagged_items:
            exc_path = os.path.join(self.output_dir, f"exceptions_{context.batch_id}_{timestamp}.csv")
            exc_columns = self.columns + ["Validation_Status", "Failure_Reasons", "Filename"]
            with open(exc_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(exc_columns)

                for item in context.flagged_items:
                    base_row = self._build_row(item, fixed_fields)
                    status = item.validation.status if item.validation else "CRITICAL_ERROR"
                    reasons = " | ".join(item.validation.failure_reasons) if item.validation else (item.error or "Unknown failure")
                    writer.writerow(base_row + [status, reasons, item.attachment.filename])

            self.logger.warn("exceptions_csv_exported", path=exc_path, count=len(context.flagged_items))
            generated_files.append(exc_path)

        return generated_files

    def _build_row(self, item: PipelineItem, fixed_fields: Dict[str, Any]) -> List[Any]:
        inv = item.invoice
        field_map = {
            "Company_Entity_Code": fixed_fields.get("Company_Entity_Code", "CORP_HQ_01"),
            "Vendor_Code": item.vendor_code,
            "Invoice_Number": inv.header.invoice_number if inv else "N/A",
            "Invoice_Date": inv.header.invoice_date if inv else "",
            "Due_Date": inv.header.due_date if inv and inv.header.due_date else "",
            "Expense_Category": inv.expense_classification.value if inv else "Other",
            "Tax_Code": item.tax_code,
            "GL_Account": item.gl_account,
            "Cost_Center": item.cost_center,
            "Subtotal": f"{inv.financials.subtotal:.2f}" if inv else "0.00",
            "Tax_Amount": f"{inv.financials.total_tax:.2f}" if inv else "0.00",
            "Total_Amount": f"{inv.financials.total_amount:.2f}" if inv else "0.00",
            "Currency": inv.header.currency if inv else fixed_fields.get("Default_Currency", "USD"),
            "Trace_ID": item.trace_id,
        }
        return [field_map.get(col, "") for col in self.columns]
