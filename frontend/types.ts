export interface FieldWithConfidence<T = string> {
  value: T;
  isUnsure: boolean;
  confidenceScore: number;
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
  traceId: string;
  fileName: string;
  fileType: string;
  imagePreviewUrl: string;
  extractedAt: string;
  currency: FieldWithConfidence<string>;
  currencySymbol: string;
  baseCurrency?: string;
  exchangeRate?: number;
  convertedTotalAmount?: number;
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
  validationStatus: 'VALID' | 'FLAGGED_REVIEW';
  failureReasons?: string[];
  customFields?: Record<string, string>;
  modelUsed?: string;
}

export type MailProviderType = 'graph_api' | 'ews' | 'imap' | 'gmail';

export interface MailboxAccount {
  id: string;
  name: string;
  provider: MailProviderType;
  emailAddress: string;
  folder: string;
  isActive: boolean;
  pollingIntervalSeconds: number;
  lastSyncAt?: string;
  authConfig: {
    tenantId?: string;
    clientId?: string;
    clientSecret?: string;
    certificatePath?: string;
    serverHost?: string;
    serverPort?: number;
    useSsl?: boolean;
    serviceAccountEmail?: string;
  };
  filters: {
    allowedSenders: string[];
    subjectKeywords: string[];
    maxAgeDays: number;
    rejectSignatures: boolean;
    unpackZips: boolean;
  };
}

export type TemplateSourceType = 'fixed' | 'extracted' | 'derived' | 'custom_master';

export interface TemplateFieldMapping {
  id: string;
  columnName: string;
  sourceType: TemplateSourceType;
  fixedValue?: string;
  extractedFieldPath?: string;
  derivedSource?: 'vendor_resolver' | 'tax_matrix' | 'trace_id';
  customFieldKey?: string;
  expressionTransform?: 'none' | 'uppercase' | 'lowercase' | 'date_YYYYMMDD' | 'date_MMDDYYYY' | 'decimal_2';
  columnWidth: number;
  paddingSide: 'left' | 'right';
  paddingChar: string;
}

export interface ExportTemplateConfig {
  id: string;
  name: string;
  format: 'csv' | 'pipe_delimited' | 'fixed_width_txt';
  delimiter: string;
  includeHeaders: boolean;
  fields: TemplateFieldMapping[];
}

export interface CustomFieldDefinition {
  id: string;
  key: string;
  label: string;
  fieldType: 'text' | 'number' | 'date' | 'select';
  defaultValue: string;
  isRequired: boolean;
}

export interface VendorMasterRecord {
  id: string;
  vendorCode: string;
  canonicalName: string;
  aliases: string[];
  taxIds: string[];
  defaultCategory: string;
  defaultPaymentTerms: string;
  customFieldValues?: Record<string, string>;
}

export interface TaxMatrixRule {
  id: string;
  category: string;
  taxCode: string;
  ratePercentage: number;
  glAccount: string;
  costCenter: string;
  description: string;
  customFieldValues?: Record<string, string>;
}

export interface AdminAuditChangeLog {
  id: string;
  timestamp: string;
  changedBy: string;
  action: 'UPDATE_CONFIG' | 'CREATE_VENDOR' | 'EDIT_VENDOR' | 'DELETE_VENDOR' | 'CREATE_TAX_RULE' | 'DELETE_TAX_RULE' | 'PURGE_DATA' | 'RECONCILE_INVOICE' | 'CHANGE_MODEL';
  entity: string;
  summary: string;
  details?: Record<string, any>;
}

export type AIProvider = 'vertex_ai' | 'azure_ai' | 'local_ai';

export interface AIModelConfiguration {
  activeProvider: AIProvider;
  vertexAi: {
    projectId: string;
    location: string;
    dataStoreId: string;
    model: string;
    temperature: number;
    thinkingBudget: number;
  };
  azureAi: {
    endpoint: string;
    apiKey: string;
    deploymentName: string;
    apiVersion: string;
    useDocumentIntelligence: boolean;
  };
  localAi: {
    endpointUrl: string; // e.g. http://localhost:11434/api/generate or vLLM / Ollama
    modelName: string;   // e.g. llama3.2-vision:11b, qwen2-vl:7b, llava
    ocrFallbackEngine: 'tesseract' | 'easyocr' | 'pymupdf';
  };
}

export interface SystemBrandingConfig {
  applicationName: string;
  headerSubtitle: string;
  footerText: string;
  themeColor: 'indigo' | 'emerald' | 'sky' | 'rose' | 'amber';
  serviceName: string;
  appIconName: string;
  visibleTabs: {
    extractor: boolean;
    inbox: boolean;
    mailboxes: boolean;
    templates: boolean;
    master_data: boolean;
    admin: boolean;
    traces: boolean;
    exceptions: boolean;
    codebase: boolean;
  };
  tabLabels: {
    extractor: string;
    inbox: string;
    mailboxes: string;
    templates: string;
    master_data: string;
    admin: string;
    traces: string;
    exceptions: string;
    codebase: string;
  };
  tabIcons: {
    extractor: string;
    inbox: string;
    mailboxes: string;
    templates: string;
    master_data: string;
    admin: string;
    traces: string;
    exceptions: string;
    codebase: string;
  };
  duplicateInvoiceGuard: boolean;
  strictTaxIdFormatCheck: boolean;
  preventFutureInvoiceDates: boolean;
  maxLineItemDeviationAllowed: number;
}

export interface AuditTraceRecord {
  traceId: string;
  timestamp: string;
  mailbox: string;
  fileName: string;
  vendorCode: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  status: 'VALID' | 'FLAGGED_REVIEW' | 'PROCESSING' | 'RECONCILED';
  discrepancy: number;
  tokensUsed: number;
  durationMs: number;
  steps: Array<{
    name: string;
    status: 'success' | 'warning' | 'error';
    detail: string;
    timestamp: string;
  }>;
}

export type ExtractionStatus = 'idle' | 'analyzing' | 'success' | 'error';
