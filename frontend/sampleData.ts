import {
  MailboxAccount,
  ExportTemplateConfig,
  VendorMasterRecord,
  TaxMatrixRule,
  AuditTraceRecord
} from './types';

// Zero Mock Policy: Default state starts empty for genuine production input
export const INITIAL_EMPTY_INVOICE = null;

// Initial ERP Export Template Schemas (structural definitions, not mock data)
export const INITIAL_TEMPLATES: ExportTemplateConfig[] = [
  {
    id: 'tpl-sap-idoc',
    name: 'SAP_ECC_IDOC_AP_FEED',
    format: 'fixed_width_txt',
    delimiter: '',
    includeHeaders: false,
    fields: [
      { id: 'f1', columnName: 'Company_Entity', sourceType: 'fixed', fixedValue: 'CORP_HQ_01', columnWidth: 12, paddingSide: 'right', paddingChar: ' ' },
      { id: 'f2', columnName: 'Vendor_Code', sourceType: 'derived', derivedSource: 'vendor_resolver', columnWidth: 15, paddingSide: 'right', paddingChar: ' ' },
      { id: 'f3', columnName: 'Invoice_Number', sourceType: 'extracted', extractedFieldPath: 'invoiceNumber', expressionTransform: 'uppercase', columnWidth: 20, paddingSide: 'right', paddingChar: ' ' },
      { id: 'f4', columnName: 'Invoice_Date', sourceType: 'extracted', extractedFieldPath: 'invoiceDate', expressionTransform: 'date_YYYYMMDD', columnWidth: 8, paddingSide: 'right', paddingChar: ' ' },
      { id: 'f5', columnName: 'Currency', sourceType: 'extracted', extractedFieldPath: 'currency', columnWidth: 5, paddingSide: 'right', paddingChar: ' ' },
      { id: 'f6', columnName: 'Subtotal', sourceType: 'extracted', extractedFieldPath: 'subtotal', expressionTransform: 'decimal_2', columnWidth: 14, paddingSide: 'left', paddingChar: '0' },
      { id: 'f7', columnName: 'Tax_Amount', sourceType: 'extracted', extractedFieldPath: 'taxAmount', expressionTransform: 'decimal_2', columnWidth: 12, paddingSide: 'left', paddingChar: '0' },
      { id: 'f8', columnName: 'Total_Amount', sourceType: 'extracted', extractedFieldPath: 'totalAmount', expressionTransform: 'decimal_2', columnWidth: 14, paddingSide: 'left', paddingChar: '0' },
      { id: 'f9', columnName: 'Trace_ID', sourceType: 'derived', derivedSource: 'trace_id', columnWidth: 36, paddingSide: 'right', paddingChar: ' ' },
    ]
  },
  {
    id: 'tpl-csv-generic',
    name: 'STANDARD_FINANCE_CSV_RECORDS',
    format: 'csv',
    delimiter: ',',
    includeHeaders: true,
    fields: [
      { id: 'f1', columnName: 'Entity_Code', sourceType: 'fixed', fixedValue: 'CORP_HQ_01', columnWidth: 12, paddingSide: 'right', paddingChar: ' ' },
      { id: 'f2', columnName: 'Vendor_Code', sourceType: 'derived', derivedSource: 'vendor_resolver', columnWidth: 15, paddingSide: 'right', paddingChar: ' ' },
      { id: 'f3', columnName: 'Vendor_Name', sourceType: 'extracted', extractedFieldPath: 'vendorName', columnWidth: 30, paddingSide: 'right', paddingChar: ' ' },
      { id: 'f4', columnName: 'Invoice_Number', sourceType: 'extracted', extractedFieldPath: 'invoiceNumber', columnWidth: 20, paddingSide: 'right', paddingChar: ' ' },
      { id: 'f5', columnName: 'Invoice_Date', sourceType: 'extracted', extractedFieldPath: 'invoiceDate', expressionTransform: 'date_YYYYMMDD', columnWidth: 10, paddingSide: 'right', paddingChar: ' ' },
      { id: 'f6', columnName: 'Due_Date', sourceType: 'extracted', extractedFieldPath: 'dueDate', expressionTransform: 'date_YYYYMMDD', columnWidth: 10, paddingSide: 'right', paddingChar: ' ' },
      { id: 'f7', columnName: 'Currency', sourceType: 'extracted', extractedFieldPath: 'currency', columnWidth: 6, paddingSide: 'right', paddingChar: ' ' },
      { id: 'f8', columnName: 'Subtotal', sourceType: 'extracted', extractedFieldPath: 'subtotal', expressionTransform: 'decimal_2', columnWidth: 12, paddingSide: 'left', paddingChar: ' ' },
      { id: 'f9', columnName: 'Tax_Amount', sourceType: 'extracted', extractedFieldPath: 'taxAmount', expressionTransform: 'decimal_2', columnWidth: 12, paddingSide: 'left', paddingChar: ' ' },
      { id: 'f10', columnName: 'Grand_Total', sourceType: 'extracted', extractedFieldPath: 'totalAmount', expressionTransform: 'decimal_2', columnWidth: 12, paddingSide: 'left', paddingChar: ' ' },
      { id: 'f11', columnName: 'Trace_ID', sourceType: 'derived', derivedSource: 'trace_id', columnWidth: 36, paddingSide: 'right', paddingChar: ' ' },
    ]
  }
];

// Completely empty live schemas with zero mock records
export const INITIAL_MAILBOXES: MailboxAccount[] = [];
export const INITIAL_VENDORS: VendorMasterRecord[] = [];
export const INITIAL_TAX_RULES: TaxMatrixRule[] = [];
export const INITIAL_AUDIT_LOGS: AuditTraceRecord[] = [];

// Unified aliases
export const MOCK_TEMPLATES = INITIAL_TEMPLATES;
export const MOCK_MAILBOXES = INITIAL_MAILBOXES;
export const MOCK_VENDORS = INITIAL_VENDORS;
export const MOCK_TAX_RULES = INITIAL_TAX_RULES;
export const MOCK_AUDIT_LOGS = INITIAL_AUDIT_LOGS;
