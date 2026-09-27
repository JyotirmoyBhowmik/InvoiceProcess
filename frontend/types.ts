export interface FieldWithConfidence<T = string> {
  value: T;
  isUnsure: boolean;
  confidenceScore: number; // 0 to 100
  reasonUnsure?: string;
  isManuallyVerified?: boolean;
}

export interface InvoiceLineItem {
  id: string;
  description: FieldWithConfidence<string>;
  quantity: FieldWithConfidence<number>;
  unitPrice: FieldWithConfidence<number>;
  amount: FieldWithConfidence<number>;
  taxRatePercent?: FieldWithConfidence<number>;
}

export interface TaxBreakdown {
  cgst: FieldWithConfidence<number>;
  sgst: FieldWithConfidence<number>;
  igst: FieldWithConfidence<number>;
  vat: FieldWithConfidence<number>;
  otherTax: FieldWithConfidence<number>;
}

export interface ExtractedInvoice {
  id: string;
  fileName: string;
  fileType: string; // 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/svg+xml'
  imagePreviewUrl: string;
  extractedAt: string;
  currency: FieldWithConfidence<string>; // 'USD', 'EUR', 'GBP', 'INR', 'NPR', etc.
  currencySymbol: string;                // '$', '€', '£', '₹', 'Rs', etc.
  baseCurrency?: string;                 // Target ERP currency (e.g. 'USD' or 'NPR')
  exchangeRate?: number;                 // FX rate for conversion
  convertedTotalAmount?: number;         // Total in base ERP currency
  vendorName: FieldWithConfidence<string>;
  vendorAddress: FieldWithConfidence<string>;
  vendorTaxId: FieldWithConfidence<string>;
  customerName: FieldWithConfidence<string>;
  customerAddress: FieldWithConfidence<string>;
  invoiceNumber: FieldWithConfidence<string>;
  invoiceDate: FieldWithConfidence<string>;
  dueDate: FieldWithConfidence<string>;
  paymentTerms: FieldWithConfidence<string>;
  subtotal: FieldWithConfidence<number>;
  taxAmount: FieldWithConfidence<number>;
  taxBreakdown: TaxBreakdown;
  discountAmount: FieldWithConfidence<number>;
  shippingAmount: FieldWithConfidence<number>;
  tipAmount: FieldWithConfidence<number>;
  totalAmount: FieldWithConfidence<number>;
  lineItems: InvoiceLineItem[];
  overallConfidenceScore: number;
  extractionNotes?: string;
  isMathReconciled: boolean;
  mathDiscrepancy: number;
  tokensConsumed?: number;
}

export type ExtractionStatus = 'idle' | 'analyzing' | 'success' | 'error';
