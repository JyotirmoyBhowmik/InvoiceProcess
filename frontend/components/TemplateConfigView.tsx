import React, { useState } from 'react';
import { FileSpreadsheet, Layers, Check, Copy, ArrowRight, Table, Settings } from 'lucide-react';
import { ExtractedInvoice } from '../types';

interface TemplateConfigViewProps {
  currentInvoice: ExtractedInvoice | null;
}

export const TemplateConfigView: React.FC<TemplateConfigViewProps> = ({ currentInvoice }) => {
  const [erpTarget, setErpTarget] = useState<'SAP_ECC' | 'ORACLE_FUSION' | 'TALLY' | 'GENERIC_CSV'>('SAP_ECC');
  const [txtDelimiter, setTxtDelimiter] = useState<string>('|');
  const [includeLineItems, setIncludeLineItems] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate live ERP format preview record based on current invoice
  const inv = currentInvoice;
  const sampleRecord = inv
    ? [
        'CORP_HQ_01',
        inv.vendorTaxId.value || 'VEND_UNKNOWN',
        inv.invoiceNumber.value,
        inv.invoiceDate.value,
        inv.dueDate.value,
        inv.currency.value,
        inv.subtotal.value.toFixed(2),
        inv.taxAmount.value.toFixed(2),
        inv.totalAmount.value.toFixed(2),
        inv.id
      ].join(txtDelimiter)
    : `CORP_HQ_01${txtDelimiter}VEND_NEXUS_01${txtDelimiter}INV-2025-0842${txtDelimiter}2025-02-14${txtDelimiter}USD${txtDelimiter}5015.50${txtDelimiter}413.78${txtDelimiter}5279.28`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleRecord);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">ERP Export & Template Mapper</h2>
              <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                SAP / Oracle / Custom TXT
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Customize CSV column mapping templates, pipe-delimited flat files, and target ERP accounts-payable formats.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-purple-950/50"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied Sample Record!' : 'Copy ERP Sample Record'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Template Controls */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Settings className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Target ERP Accounting Specification</h3>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Target ERP System</label>
              <select
                value={erpTarget}
                onChange={(e) => setErpTarget(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-slate-200 text-xs outline-none focus:border-purple-500"
              >
                <option value="SAP_ECC">SAP ECC / S4HANA (BAPI_INCOMINGINVOICE_CREATE)</option>
                <option value="ORACLE_FUSION">Oracle Fusion Cloud Financials (AP_INVOICES_INTERFACE)</option>
                <option value="TALLY">Tally Prime / ERP 9 XML Format</option>
                <option value="GENERIC_CSV">Standard Enterprise CSV Ledger</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Flat-File Delimiter</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={2}
                  value={txtDelimiter}
                  onChange={(e) => setTxtDelimiter(e.target.value || '|')}
                  className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-200 font-mono text-center text-xs w-16 outline-none focus:border-purple-500"
                />
                <span className="text-slate-400 text-xs">(Pipe |, Tab \t, or Comma ,)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-slate-200 font-medium block">Export Itemized Line Items</span>
                <span className="text-[11px] text-slate-500">
                  Generate child table rows with item description, quantity, and unit price.
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeLineItems}
                onChange={(e) => setIncludeLineItems(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Live Export Preview */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Table className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Live Formatted Record Output</h3>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Target Header Format: {erpTarget}
            </span>
            <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
              {sampleRecord}
            </pre>
            <span className="text-[11px] text-slate-500">
              Ready for direct batch ingest into {erpTarget} accounts payable module.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
