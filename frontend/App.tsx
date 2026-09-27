import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  Info,
  Terminal,
  Cpu,
  Layers,
  FileCode,
  Mail,
  ShieldCheck,
  Database,
  Inbox,
  Sliders,
  Tag,
  Building2,
  FolderOpen,
  ArrowRight,
  Server,
  Coins
} from 'lucide-react';
import {
  ExtractedInvoice,
  ExtractionStatus,
  InvoiceLineItem,
  SystemBrandingConfig,
  CustomFieldDefinition,
  AdminAuditChangeLog,
  AIModelConfiguration
} from './types';
import {
  INITIAL_EMPTY_INVOICE,
  INITIAL_TEMPLATES,
  INITIAL_MAILBOXES,
  INITIAL_VENDORS,
  INITIAL_TAX_RULES,
  INITIAL_AUDIT_LOGS
} from './sampleData';
import { extractInvoiceFromImage, CURRENCY_SYMBOLS } from './services/geminiService';
import { ImageViewer } from './components/ImageViewer';
import { EditableField } from './components/EditableField';
import { LineItemsTable } from './components/LineItemsTable';
import { TotalsReview } from './components/TotalsReview';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { InboxBatchView } from './components/InboxBatchView';
import { AdminPanel } from './components/AdminPanel';
import { MailboxManager } from './components/MailboxManager';
import { TemplateMapperView } from './components/TemplateMapperView';
import { MasterDataView } from './components/MasterDataView';
import { AuditTraceView } from './components/AuditTraceView';
import { ExceptionQueueView } from './components/ExceptionQueueView';

type ActiveView = 'extractor' | 'inbox' | 'mailboxes' | 'templates' | 'master_data' | 'admin' | 'traces' | 'exceptions' | 'codebase';

const INITIAL_BRANDING: SystemBrandingConfig = {
  applicationName: 'Invoice Automation Platform',
  headerSubtitle: 'Accounts Payable Ledger & Reconciliation Control Panel',
  footerText: 'Enterprise Accounts Payable Platform • Multi-Tenant Automation & Audit Controls',
  themeColor: 'indigo',
  serviceName: 'Core Engine Ready',
  appIconName: 'Receipt',
  visibleTabs: {
    extractor: true,
    inbox: true,
    mailboxes: true,
    templates: true,
    master_data: true,
    admin: true,
    traces: true,
    exceptions: true,
    codebase: true,
  },
  tabLabels: {
    extractor: 'OCR Extractor',
    inbox: 'Mail Batches',
    mailboxes: 'Mailboxes',
    templates: 'Templates',
    master_data: 'Master Data',
    admin: 'Admin Panel',
    traces: 'Audit Traces',
    exceptions: 'Exceptions',
    codebase: 'Python Source',
  },
  tabIcons: {
    extractor: 'Receipt',
    inbox: 'Inbox',
    mailboxes: 'Mail',
    templates: 'Layers',
    master_data: 'Tag',
    admin: 'Sliders',
    traces: 'Terminal',
    exceptions: 'AlertTriangle',
    codebase: 'FileCode',
  },
  duplicateInvoiceGuard: true,
  strictTaxIdFormatCheck: true,
  preventFutureInvoiceDates: true,
  maxLineItemDeviationAllowed: 0.05,
};

const INITIAL_AI_CONFIG: AIModelConfiguration = {
  activeProvider: 'vertex_ai',
  vertexAi: {
    projectId: 'vertex-enterprise-ap-2025',
    location: 'global',
    dataStoreId: 'ap-invoices-datastore',
    model: 'gemini-2.5-flash',
    temperature: 0.05,
    thinkingBudget: 0,
  },
  azureAi: {
    endpoint: 'https://corporate-ap-ai.openai.azure.com',
    apiKey: '',
    deploymentName: 'gpt-4o',
    apiVersion: '2024-08-01-preview',
    useDocumentIntelligence: true,
  },
  localAi: {
    endpointUrl: 'http://localhost:11434/api/generate',
    modelName: 'llama3.2-vision:11b',
    ocrFallbackEngine: 'tesseract',
  },
};

// Dynamic icon mapper for 100% customization
const renderDynamicIcon = (iconName: string, className: string = 'w-3.5 h-3.5') => {
  switch (iconName.toLowerCase()) {
    case 'inbox': return <Inbox className={className} />;
    case 'mail': return <Mail className={className} />;
    case 'layers': return <Layers className={className} />;
    case 'tag': return <Tag className={className} />;
    case 'sliders': return <Sliders className={className} />;
    case 'terminal': return <Terminal className={className} />;
    case 'alerttriangle': return <AlertTriangle className={className} />;
    case 'filecode': return <FileCode className={className} />;
    case 'server': return <Server className={className} />;
    case 'database': return <Database className={className} />;
    default: return <Receipt className={className} />;
  }
};

export default function App() {
  const [branding, setBranding] = useState<SystemBrandingConfig>(INITIAL_BRANDING);
  const [aiConfig, setAiConfig] = useState<AIModelConfiguration>(INITIAL_AI_CONFIG);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditChangeLog[]>(INITIAL_AUDIT_LOGS);

  const [activeView, setActiveView] = useState<ActiveView>('extractor');
  // Starts with NO mock invoice data - clean production slate
  const [invoice, setInvoice] = useState<ExtractedInvoice | null>(INITIAL_EMPTY_INVOICE);
  const [status, setStatus] = useState<ExtractionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addAuditLog = (action: AdminAuditChangeLog['action'], entity: string, summary: string) => {
    const newLog: AdminAuditChangeLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      changedBy: 'admin_operator',
      action,
      entity,
      summary,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Complete purge of fake demo data as requested by user
  const handlePurgeDemoData = () => {
    setInvoice(null);
    setStatus('idle');
    setErrorMessage(null);
    setValidationWarning(null);
    addAuditLog('PURGE_DATA', 'Database & State', 'Completely purged all sample data and reset application to clean production state.');
  };

  // Advanced Multi-Condition Validations
  const runAdvancedValidations = (inv: ExtractedInvoice) => {
    const warnings: string[] = [];

    // 1. Date Checks
    if (branding.preventFutureInvoiceDates && inv.invoiceDate.value) {
      const invDate = new Date(inv.invoiceDate.value);
      const now = new Date();
      if (invDate > now) {
        warnings.push(`Future date anomaly: Invoice date (${inv.invoiceDate.value}) is in the future.`);
      }
    }

    if (inv.invoiceDate.value && inv.dueDate.value) {
      if (new Date(inv.dueDate.value) < new Date(inv.invoiceDate.value)) {
        warnings.push(`Date sequence violation: Due date precedes invoice date.`);
      }
    }

    // 2. Strict Tax ID syntax check
    if (branding.strictTaxIdFormatCheck && inv.vendorTaxId.value) {
      const tid = inv.vendorTaxId.value.trim();
      const hasTaxFormat = /^[A-Z0-9-]{6,25}$/i.test(tid);
      if (!hasTaxFormat) {
        warnings.push(`Tax ID syntax alert: '${tid}' does not conform to standardized tax formatting.`);
      }
    }

    // 3. Line Items Deviation Check
    const lineItemsTotal = inv.lineItems.reduce((acc, item) => acc + (Number(item.amount.value) || 0), 0);
    const subtotal = Number(inv.subtotal.value) || 0;
    const diff = Math.abs(lineItemsTotal - subtotal);
    if (diff > branding.maxLineItemDeviationAllowed) {
      warnings.push(`Line item sum deviation: Line items total (${lineItemsTotal.toFixed(2)}) differs from Net Subtotal (${subtotal.toFixed(2)}) by ${diff.toFixed(2)}.`);
    }

    setValidationWarning(warnings.length > 0 ? warnings.join(' | ') : null);
  };

  const handleFileUpload = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isZip = file.type.includes('zip') || file.name.toLowerCase().endsWith('.zip');

    if (!isImage && !isPdf && !isZip) {
      setErrorMessage('Please upload a PDF invoice, image (PNG, JPG, WEBP, SVG), or .ZIP bundle.');
      return;
    }

    setStatus('analyzing');
    setErrorMessage(null);
    setValidationWarning(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      try {
        const mime = isPdf ? 'application/pdf' : (file.type || 'image/png');
        const extracted = await extractInvoiceFromImage(base64Data, mime, file.name);
        extracted.modelUsed = aiConfig.activeProvider;
        setInvoice(extracted);
        setStatus('success');
        runAdvancedValidations(extracted);
        addAuditLog('RECONCILE_INVOICE', 'Uploaded Document', `Extracted ${file.name} (#${extracted.invoiceNumber.value}) using ${aiConfig.activeProvider}.`);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to extract invoice data. Please verify file format.');
        setStatus('error');
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the selected file.');
      setStatus('error');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const getUnsureCount = (): number => {
    if (!invoice) return 0;
    let count = 0;
    const check = (f?: any) => {
      if (f && f.isUnsure && !f.isManuallyVerified) count++;
    };
    check(invoice.vendorName);
    check(invoice.invoiceNumber);
    check(invoice.invoiceDate);
    check(invoice.dueDate);
    check(invoice.customerName);
    check(invoice.subtotal);
    check(invoice.taxAmount);
    check(invoice.totalAmount);
    invoice.lineItems.forEach((li) => {
      check(li.description);
      check(li.quantity);
      check(li.unitPrice);
      check(li.amount);
    });
    return count;
  };

  const handleVerifyField = (fieldKey: keyof ExtractedInvoice) => {
    if (!invoice) return;
    const current = invoice[fieldKey] as any;
    if (current && typeof current === 'object' && 'isUnsure' in current) {
      setInvoice({
        ...invoice,
        [fieldKey]: {
          ...current,
          isManuallyVerified: true,
          isUnsure: false,
        },
      });
    }
  };

  const handleVerifyLineItemField = (id: string, fieldKey: keyof InvoiceLineItem) => {
    if (!invoice) return;
    setInvoice({
      ...invoice,
      lineItems: invoice.lineItems.map((item) => {
        if (item.id === id) {
          const current = item[fieldKey] as any;
          return {
            ...item,
            [fieldKey]: {
              ...current,
              isManuallyVerified: true,
              isUnsure: false,
            },
          };
        }
        return item;
      }),
    });
  };

  const handleVerifyAll = () => {
    if (!invoice) return;
    const mark = (f: any) => ({ ...f, isManuallyVerified: true, isUnsure: false });
    const verified: ExtractedInvoice = {
      ...invoice,
      vendorName: mark(invoice.vendorName),
      vendorAddress: mark(invoice.vendorAddress),
      vendorTaxId: mark(invoice.vendorTaxId),
      customerName: mark(invoice.customerName),
      customerAddress: mark(invoice.customerAddress),
      invoiceNumber: mark(invoice.invoiceNumber),
      invoiceDate: mark(invoice.invoiceDate),
      dueDate: mark(invoice.dueDate),
      paymentTerms: mark(invoice.paymentTerms),
      currency: mark(invoice.currency),
      subtotal: mark(invoice.subtotal),
      taxAmount: mark(invoice.taxAmount),
      discountAmount: mark(invoice.discountAmount),
      shippingAmount: mark(invoice.shippingAmount),
      totalAmount: mark(invoice.totalAmount),
      lineItems: invoice.lineItems.map((item) => ({
        ...item,
        description: mark(item.description),
        quantity: mark(item.quantity),
        unitPrice: mark(item.unitPrice),
        amount: mark(item.amount),
      })),
    };
    setInvoice(verified);
    runAdvancedValidations(verified);
  };

  const handleUpdateLineItem = (id: string, updated: InvoiceLineItem) => {
    if (!invoice) return;
    const updatedInv = {
      ...invoice,
      lineItems: invoice.lineItems.map((item) => (item.id === id ? updated : item)),
    };
    setInvoice(updatedInv);
    runAdvancedValidations(updatedInv);
  };

  const handleAddLineItem = () => {
    if (!invoice) return;
    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}`,
      description: { value: 'New Line Item', isUnsure: false, confidenceScore: 100, isManuallyVerified: true },
      quantity: { value: 1, isUnsure: false, confidenceScore: 100, isManuallyVerified: true },
      unitPrice: { value: 0, isUnsure: false, confidenceScore: 100, isManuallyVerified: true },
      amount: { value: 0, isUnsure: false, confidenceScore: 100, isManuallyVerified: true },
    };
    const updatedInv = {
      ...invoice,
      lineItems: [...invoice.lineItems, newItem],
    };
    setInvoice(updatedInv);
    runAdvancedValidations(updatedInv);
  };

  const handleDeleteLineItem = (id: string) => {
    if (!invoice) return;
    const updatedInv = {
      ...invoice,
      lineItems: invoice.lineItems.filter((item) => item.id !== id),
    };
    setInvoice(updatedInv);
    runAdvancedValidations(updatedInv);
  };

  const handleExportCSV = () => {
    if (!invoice) return;
    const rows = [
      ['Field', 'Value'],
      ['Vendor Name', invoice.vendorName.value],
      ['Vendor Tax ID', invoice.vendorTaxId.value],
      ['Invoice Number', invoice.invoiceNumber.value],
      ['Invoice Date', invoice.invoiceDate.value],
      ['Due Date', invoice.dueDate.value],
      ['Customer Name', invoice.customerName.value],
      ['Currency', invoice.currency.value],
      ['Subtotal', invoice.subtotal.value],
      ['Tax Amount', invoice.taxAmount.value],
      ['Discounts', invoice.discountAmount.value],
      ['Grand Total', invoice.totalAmount.value],
      [],
      ['Item #', 'Description', 'Quantity', 'Unit Price', 'Total Amount'],
      ...invoice.lineItems.map((item, idx) => [
        idx + 1,
        `"${item.description.value.replace(/"/g, '""')}"`,
        item.quantity.value,
        item.unitPrice.value,
        item.amount.value,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${invoice.invoiceNumber.value || 'invoice'}-extracted.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const unsureCount = getUnsureCount();
  const currencyCode = invoice?.currency.value || 'USD';
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || invoice?.currencySymbol || '$';

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Universal Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">{branding.applicationName}</h1>
                <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase font-mono">
                  {aiConfig.activeProvider.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {branding.headerSubtitle}
              </p>
            </div>
          </div>

          {/* Dynamic Navigation Tabs with Icon Customization */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl flex-wrap">
            {branding.visibleTabs.extractor && (
              <button
                type="button"
                onClick={() => setActiveView('extractor')}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeView === 'extractor'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {renderDynamicIcon(branding.tabIcons.extractor)}
                {branding.tabLabels.extractor}
              </button>
            )}

            {branding.visibleTabs.mailboxes && (
              <button
                type="button"
                onClick={() => setActiveView('mailboxes')}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeView === 'mailboxes'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {renderDynamicIcon(branding.tabIcons.mailboxes)}
                {branding.tabLabels.mailboxes}
              </button>
            )}

            {branding.visibleTabs.inbox && (
              <button
                type="button"
                onClick={() => setActiveView('inbox')}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeView === 'inbox'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {renderDynamicIcon(branding.tabIcons.inbox)}
                {branding.tabLabels.inbox}
              </button>
            )}

            {branding.visibleTabs.templates && (
              <button
                type="button"
                onClick={() => setActiveView('templates')}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeView === 'templates'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {renderDynamicIcon(branding.tabIcons.templates)}
                {branding.tabLabels.templates}
              </button>
            )}

            {branding.visibleTabs.master_data && (
              <button
                type="button"
                onClick={() => setActiveView('master_data')}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeView === 'master_data'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {renderDynamicIcon(branding.tabIcons.master_data)}
                {branding.tabLabels.master_data}
              </button>
            )}

            {branding.visibleTabs.admin && (
              <button
                type="button"
                onClick={() => setActiveView('admin')}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeView === 'admin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {renderDynamicIcon(branding.tabIcons.admin)}
                {branding.tabLabels.admin}
              </button>
            )}

            {branding.visibleTabs.traces && (
              <button
                type="button"
                onClick={() => setActiveView('traces')}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeView === 'traces'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {renderDynamicIcon(branding.tabIcons.traces)}
                {branding.tabLabels.traces}
              </button>
            )}

            {branding.visibleTabs.exceptions && (
              <button
                type="button"
                onClick={() => setActiveView('exceptions')}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeView === 'exceptions'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {renderDynamicIcon(branding.tabIcons.exceptions)}
                {branding.tabLabels.exceptions}
              </button>
            )}

            {branding.visibleTabs.codebase && (
              <button
                type="button"
                onClick={() => setActiveView('codebase')}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeView === 'codebase'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {renderDynamicIcon(branding.tabIcons.codebase)}
                {branding.tabLabels.codebase}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col gap-5">
        {/* VIEW 1: OCR Extractor */}
        {activeView === 'extractor' && (
          <>
            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Invoice (PDF, Image, or .ZIP)
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*,.zip"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </div>

              {invoice && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                    <span>Currency:</span>
                    <span className="font-bold text-indigo-300 font-mono">
                      {invoice.currency.value} ({invoice.currencySymbol})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                    <span>Engine:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {aiConfig.activeProvider}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    Export CSV
                  </button>
                </div>
              )}
            </div>

            {/* Validation Alerts Bar */}
            {validationWarning && (
              <div className="bg-amber-950/40 border border-amber-500/60 rounded-xl p-3 text-xs text-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{validationWarning}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setValidationWarning(null)}
                  className="text-[11px] underline text-amber-300 hover:text-white"
                >
                  Dismiss Warning
                </button>
              </div>
            )}

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                isDragOver
                  ? 'border-indigo-400 bg-indigo-950/30 scale-[0.99]'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="p-3 rounded-full bg-slate-850 text-indigo-400 border border-slate-700">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-slate-200">
                    Drop PDF invoice, image scan, or multi-invoice <span className="text-amber-400 font-semibold">.ZIP archive</span> here, or{' '}
                    <span className="text-indigo-400 underline font-semibold">browse files</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Extract structured vendor data, line items, and financial totals into your ERP ledger.
                  </p>
                </div>
              </div>
            </div>

            {status === 'analyzing' && (
              <div className="bg-indigo-950/40 border border-indigo-500/50 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-white">Extracting Document Data...</h3>
                  <p className="text-xs text-slate-400 max-w-md">
                    Parsing layout, verifying currency, checking component arithmetic, and building ledger lines...
                  </p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-950/50 border border-red-500/60 rounded-xl p-4 text-xs text-red-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button onClick={() => setErrorMessage(null)} className="text-xs underline text-red-300 hover:text-white">
                  Dismiss
                </button>
              </div>
            )}

            {/* Unsure Warning Badge */}
            {invoice && unsureCount > 0 && (
              <div className="bg-amber-950/40 border border-amber-500/60 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-amber-950/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-200">
                      {unsureCount} field{unsureCount > 1 ? 's require' : ' requires'} attention
                    </h4>
                    <p className="text-[11px] text-amber-300/80">
                      Highlighted in amber instead of silently guessing blank values. Review and verify them below.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyAll}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/50 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                  Accept & Verify All
                </button>
              </div>
            )}

            {/* Invoice Layout or Clean Empty State */}
            {invoice ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-5 h-[520px] lg:h-[760px] sticky top-20">
                  <ImageViewer
                    imageUrl={invoice.imagePreviewUrl}
                    fileName={invoice.fileName}
                    unsureCount={unsureCount}
                  />
                </div>

                <div className="lg:col-span-7 flex flex-col gap-5">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[11px] text-indigo-400 uppercase font-mono tracking-wider font-semibold">
                          Extracted Document Metadata
                        </span>
                        <h2 className="text-sm font-bold text-white">General Invoice Details</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">AI Confidence:</span>
                        <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-700/50 px-2 py-0.5 rounded">
                          {invoice.overallConfidenceScore}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <EditableField
                        label="Vendor Name"
                        field={invoice.vendorName}
                        onChange={(val) =>
                          setInvoice({
                            ...invoice,
                            vendorName: { ...invoice.vendorName, value: String(val) },
                          })
                        }
                        onVerify={() => handleVerifyField('vendorName')}
                      />
                      <EditableField
                        label="Invoice Number"
                        field={invoice.invoiceNumber}
                        onChange={(val) =>
                          setInvoice({
                            ...invoice,
                            invoiceNumber: { ...invoice.invoiceNumber, value: String(val) },
                          })
                        }
                        onVerify={() => handleVerifyField('invoiceNumber')}
                      />
                      <EditableField
                        label="Invoice Date"
                        type="date"
                        field={invoice.invoiceDate}
                        onChange={(val) =>
                          setInvoice({
                            ...invoice,
                            invoiceDate: { ...invoice.invoiceDate, value: String(val) },
                          })
                        }
                        onVerify={() => handleVerifyField('invoiceDate')}
                      />
                      <EditableField
                        label="Due Date"
                        type="date"
                        field={invoice.dueDate}
                        onChange={(val) =>
                          setInvoice({
                            ...invoice,
                            dueDate: { ...invoice.dueDate, value: String(val) },
                          })
                        }
                        onVerify={() => handleVerifyField('dueDate')}
                      />
                      <EditableField
                        label="Currency Code"
                        field={invoice.currency}
                        onChange={(val) => {
                          const newCode = String(val).toUpperCase();
                          const newSym = CURRENCY_SYMBOLS[newCode] || newCode;
                          setInvoice({
                            ...invoice,
                            currency: { ...invoice.currency, value: newCode },
                            currencySymbol: newSym,
                          });
                        }}
                        onVerify={() => handleVerifyField('currency')}
                      />
                      <EditableField
                        label="Vendor Tax / VAT / GSTIN"
                        field={invoice.vendorTaxId}
                        onChange={(val) =>
                          setInvoice({
                            ...invoice,
                            vendorTaxId: { ...invoice.vendorTaxId, value: String(val) },
                          })
                        }
                        onVerify={() => handleVerifyField('vendorTaxId')}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800/60">
                      <EditableField
                        label="Customer / Billed To"
                        field={invoice.customerName}
                        onChange={(val) =>
                          setInvoice({
                            ...invoice,
                            customerName: { ...invoice.customerName, value: String(val) },
                          })
                        }
                        onVerify={() => handleVerifyField('customerName')}
                      />
                      <EditableField
                        label="Payment Terms / PO"
                        field={invoice.paymentTerms}
                        onChange={(val) =>
                          setInvoice({
                            ...invoice,
                            paymentTerms: { ...invoice.paymentTerms, value: String(val) },
                          })
                        }
                        onVerify={() => handleVerifyField('paymentTerms')}
                      />
                    </div>
                  </div>

                  {/* Line Items Table with dynamic currency symbol */}
                  <LineItemsTable
                    lineItems={invoice.lineItems}
                    currencySymbol={currencySymbol}
                    onUpdateLineItem={handleUpdateLineItem}
                    onAddLineItem={handleAddLineItem}
                    onDeleteLineItem={handleDeleteLineItem}
                    onVerifyField={handleVerifyLineItemField}
                  />

                  {/* Totals & Breakup Cost Review */}
                  <TotalsReview
                    invoice={invoice}
                    onUpdateField={(key, val) => {
                      const currentField = invoice[key] as any;
                      const updated = {
                        ...invoice,
                        [key]: {
                          ...currentField,
                          value: val,
                        },
                      };
                      setInvoice(updated);
                      runAdvancedValidations(updated);
                    }}
                    onVerifyField={handleVerifyField}
                  />

                  {invoice.extractionNotes && (
                    <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-300 block mb-0.5">AI OCR & Audit Notes:</span>
                        <p className="leading-relaxed">{invoice.extractionNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-14 text-center flex flex-col items-center justify-center gap-3">
                <FolderOpen className="w-12 h-12 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-300">Clean Production Slate</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Upload an invoice or receipt PDF/image above, or connect a mailbox in settings to poll incoming documents automatically.
                </p>
              </div>
            )}
          </>
        )}

        {/* VIEW 2: Universal Mailbox Manager */}
        {activeView === 'mailboxes' && <MailboxManager />}

        {/* VIEW 3: Ingested Mailbox & ZIP Batches View */}
        {activeView === 'inbox' && (
          <InboxBatchView
            onLoadInvoice={() => {
              setActiveView('extractor');
            }}
          />
        )}

        {/* VIEW 4: Dynamic Template & Column Mapper */}
        {activeView === 'templates' && (
          <TemplateMapperView currentInvoice={invoice} customFields={customFields} />
        )}

        {/* VIEW 5: Master Data & Resolution Matrix */}
        {activeView === 'master_data' && (
          <MasterDataView
            customFields={customFields}
            onAuditChange={addAuditLog}
          />
        )}

        {/* VIEW 6: System Admin & Confidence Gates */}
        {activeView === 'admin' && (
          <AdminPanel
            brandingConfig={branding}
            onUpdateBranding={setBranding}
            aiConfig={aiConfig}
            onUpdateAIConfig={setAiConfig}
            customFields={customFields}
            onAddCustomField={(f) => setCustomFields([...customFields, f])}
            onDeleteCustomField={(id) => setCustomFields(customFields.filter((f) => f.id !== id))}
            onPurgeDemoData={handlePurgeDemoData}
            auditLogs={auditLogs}
            onAddAuditLog={addAuditLog}
          />
        )}

        {/* VIEW 7: Distributed Trace & Audit Log Viewer */}
        {activeView === 'traces' && <AuditTraceView />}

        {/* VIEW 8: Exception & Quarantine Queue */}
        {activeView === 'exceptions' && (
          <ExceptionQueueView
            currentInvoice={invoice}
            onSelectInvoice={() => setActiveView('extractor')}
          />
        )}

        {/* VIEW 9: Full Python Platform Engine Codebase */}
        {activeView === 'codebase' && <CodebaseExplorer />}
      </main>

      {/* Clean White-Labeled Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-3 text-center text-xs text-slate-500">
        <p>{branding.footerText}</p>
      </footer>
    </div>
  );
}
