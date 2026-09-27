from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class ExpenseCategory(str, Enum):
    TRAVELING = "Traveling"
    MEDICAL = "Medical"
    FOOD = "Food"
    CLOUD_INFRASTRUCTURE = "Cloud_Infrastructure"
    OTHER = "Other"

class HeaderInfo(BaseModel):
    invoice_number: str = Field(description="Unique invoice or bill identifier")
    invoice_date: str = Field(description="Issue date formatted as ISO 8601 (YYYY-MM-DD)")
    due_date: Optional[str] = Field(default=None, description="Due date formatted as ISO 8601 (YYYY-MM-DD)")
    currency: str = Field(default="USD", description="True ISO 4217 currency code (e.g. USD, EUR, GBP, INR, NPR, CAD, JPY)")

class VendorInfo(BaseModel):
    name: str = Field(description="Legal entity name of the vendor or supplier")
    address: Optional[str] = Field(default=None, description="Physical street address or operating location")
    tax_id: Optional[str] = Field(default=None, description="Tax Identification Number (EIN, VAT, GSTIN, PAN)")

class LineItem(BaseModel):
    description: str = Field(description="Line item description")
    quantity: float = Field(default=1.0, description="Quantity billed")
    unit_price: float = Field(default=0.0, description="Unit rate in document currency")
    line_total: float = Field(default=0.0, description="Total amount for this line item")

class TaxBreakdownSchema(BaseModel):
    cgst: float = Field(default=0.0, description="Central GST amount if applicable")
    sgst: float = Field(default=0.0, description="State GST amount if applicable")
    igst: float = Field(default=0.0, description="Integrated GST amount if applicable")
    vat: float = Field(default=0.0, description="VAT amount if applicable")

class FinancialSummary(BaseModel):
    subtotal: float = Field(description="Subtotal net amount before taxes and discounts")
    total_tax: float = Field(default=0.0, description="Sum of all tax amounts (CGST, SGST, IGST, VAT)")
    tax_breakdown: Optional[TaxBreakdownSchema] = Field(default_factory=TaxBreakdownSchema)
    service_charges: Optional[float] = Field(default=0.0, description="Service charges or shipping fees")
    tip: Optional[float] = Field(default=0.0, description="Optional gratuity or tip")
    discount: Optional[float] = Field(default=0.0, description="Discounts or promotional credits deducted")
    total_amount: float = Field(description="Final gross total payable amount (must match components)")

class NormalizedInvoice(BaseModel):
    header: HeaderInfo
    vendor: VendorInfo
    expense_classification: ExpenseCategory = Field(
        default=ExpenseCategory.OTHER,
        description="Categorization: Traveling, Medical, Food, Cloud_Infrastructure, or Other"
    )
    line_items: List[LineItem] = Field(default_factory=list, description="Extracted line items")
    financials: FinancialSummary
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0, description="Overall extraction confidence")
