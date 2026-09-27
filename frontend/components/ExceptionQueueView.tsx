import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, ArrowRight, Calculator, Check, ExternalLink } from 'lucide-react';
import { ExtractedInvoice } from '../types';

interface ExceptionQueueViewProps {
  currentInvoice: ExtractedInvoice | null;
  onSelectInvoice: () => void;
}

export const ExceptionQueueView: React.FC<ExceptionQueueViewProps> = ({ currentInvoice, onSelectInvoice }) => {
  const [reconciled, setReconciled] = useState(false);

  const handleFixAndApprove = () => {
    setReconciled(true);
    setTimeout(() => setReconciled(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Exception & Quarantine Queue</h2>
              <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Human-In-The-Loop
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Invoices flagged for arithmetic mismatches, ambiguous OCR characters, or unresolved vendor codes.
            </p>
          </div>
        </div>
      </div>

      {/* Flagged Item Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700/60">
              FLAGGED_REVIEW
            </span>
            <span className="text-xs font-mono text-slate-300">#INV-2025-0842 • Nexus Dynamics Cloud Corp</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectInvoice}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              Open in OCR Extractor <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleFixAndApprove}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {reconciled ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {reconciled ? 'Re-Approved for ERP!' : 'Approve & Dispatch'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Discrepancy:</span>
            <span className="font-bold text-amber-300">$0.00 (Component Invariant Matched)</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Unsure Field:</span>
            <span className="font-bold text-amber-300">Line Item #3 (Promo credit note)</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Total Billed:</span>
            <span className="font-bold text-white">$5,279.28 USD</span>
          </div>
        </div>

        <div className="p-3 bg-amber-950/30 border border-amber-600/40 rounded-lg text-xs text-amber-200">
          <span className="font-bold block mb-0.5">Audit Reason:</span>
          Faded pencil annotation detected on invoice: &quot;Promo credit pending approval? [verify]&quot;. Highlighting allows accounts-payable reviewers to verify without halting the batch run.
        </div>
      </div>
    </div>
  );
};
