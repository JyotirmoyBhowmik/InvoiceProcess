import os
from datetime import datetime
from typing import Any, Dict, List
from core.logger import get_logger
from core.pipeline import PipelineContext, PipelineItem

class TxtExporter:
    """Generates pipe-delimited or fixed-width flat TXT files for ERP ingestion."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config.get("outputs", {}).get("txt", {})
        self.output_dir = self.config.get("output_dir", "./output/txt")
        self.format_type = self.config.get("format", "pipe_delimited")
        self.delimiter = self.config.get("delimiter", "|")
        self.fixed_widths = self.config.get("fixed_widths", {
            "Company_Entity_Code": 12,
            "Vendor_Code": 15,
            "Invoice_Number": 20,
            "Invoice_Date": 10,
            "Expense_Category": 15,
            "Tax_Code": 14,
            "GL_Account": 12,
            "Subtotal": 14,
            "Tax_Amount": 14,
            "Total_Amount": 14,
            "Trace_ID": 36,
        })
        self.logger = get_logger()
        os.makedirs(self.output_dir, exist_ok=True)

    def export(self, context: PipelineContext) -> List[str]:
        if not self.config.get("enabled", True) or not context.valid_items:
            return []

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        txt_path = os.path.join(self.output_dir, f"erp_feed_{context.batch_id}_{timestamp}.txt")
        fixed_fields = context.config.get("rules", {}).get("fixed_fields", {})

        with open(txt_path, "w", encoding="utf-8") as f:
            for item in context.valid_items:
                if not item.invoice:
                    continue
                record = self._format_record(item, fixed_fields)
                f.write(record + "\n")

        self.logger.info("erp_txt_exported", path=txt_path, format=self.format_type, count=len(context.valid_items))
        return [txt_path]

    def _format_record(self, item: PipelineItem, fixed_fields: Dict[str, Any]) -> str:
        inv = item.invoice
        raw_values = {
            "Company_Entity_Code": fixed_fields.get("Company_Entity_Code", "CORP_HQ_01"),
            "Vendor_Code": item.vendor_code,
            "Invoice_Number": inv.header.invoice_number if inv else "",
            "Invoice_Date": inv.header.invoice_date if inv else "",
            "Expense_Category": inv.expense_classification.value if inv else "Other",
            "Tax_Code": item.tax_code,
            "GL_Account": item.gl_account,
            "Subtotal": f"{inv.financials.subtotal:.2f}" if inv else "0.00",
            "Tax_Amount": f"{inv.financials.total_tax:.2f}" if inv else "0.00",
            "Total_Amount": f"{inv.financials.total_amount:.2f}" if inv else "0.00",
            "Trace_ID": item.trace_id,
        }

        if self.format_type == "fixed_width":
            parts = []
            for field, width in self.fixed_widths.items():
                val = str(raw_values.get(field, ""))
                parts.append(val.ljust(width)[:width])
            return "".join(parts)
        else:
            # Delimited (e.g. pipe-delimited)
            ordered_keys = list(self.fixed_widths.keys())
            return self.delimiter.join(str(raw_values.get(k, "")) for k in ordered_keys)
