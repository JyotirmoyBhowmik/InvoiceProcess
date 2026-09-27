import React, { useState } from 'react';
import { Sliders, ShieldCheck, Cpu, Database, Save, Check, RefreshCw, AlertCircle, Coins, Percent } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'sandbox'>('production');
  const [confidenceCutoff, setConfidenceCutoff] = useState<number>(85);
  const [roundingTolerance, setRoundingTolerance] = useState<number>(0.05);
  const [zeroTokenMode, setZeroTokenMode] = useState<boolean>(true);
  const [autoApproveReconciled, setAutoApproveReconciled] = useState<boolean>(true);
  const [fuzzyThreshold, setFuzzyThreshold] = useState<number>(78);
  const [maxBatchSize, setMaxBatchSize] = useState<number>(50);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">System Admin & Business Rule Engine</h2>
              <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                Global Parameters
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Configure extraction confidence thresholds, arithmetic tolerances, auto-approval rules, and AI token constraints.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-950/50"
        >
          {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
          {saveSuccess ? 'Configuration Saved!' : 'Save & Deploy Rules'}
        </button>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: AI & Accuracy Settings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">AI Extraction & Confidence Gates</h3>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-medium">Uncertainty Flagging Cutoff</label>
                <span className="font-mono text-indigo-400 font-bold">{confidenceCutoff}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="98"
                value={confidenceCutoff}
                onChange={(e) => setConfidenceCutoff(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Fields scoring below {confidenceCutoff}% will trigger an amber review badge instead of guessing.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-medium">Vendor Fuzzy Match Threshold</label>
                <span className="font-mono text-emerald-400 font-bold">{fuzzyThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={fuzzyThreshold}
                onChange={(e) => setFuzzyThreshold(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Token sort ratio similarity required to associate raw vendor string to standardized Vendor_Code.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-slate-200 font-medium block">Zero-Token Thinking Budget (thinkingBudget: 0)</span>
                <span className="text-[11px] text-slate-500">
                  Suppresses internal reasoning tokens to slash processing latency by 75% and token billing.
                </span>
              </div>
              <input
                type="checkbox"
                checked={zeroTokenMode}
                onChange={(e) => setZeroTokenMode(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Financial Reconciliation & Math Validation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Percent className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Mathematical Invariant Checks</h3>
          </div>

          <div className="flex flex-col gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Arithmetic Rounding Tolerance</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={roundingTolerance}
                  onChange={(e) => setRoundingTolerance(parseFloat(e.target.value) || 0.05)}
                  className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-200 font-mono text-xs w-28 outline-none focus:border-indigo-500"
                />
                <span className="text-slate-500 text-[11px]">± Currency units (default: 0.05)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Subtotal + Tax + Shipping + Tip - Discount = Grand Total within this delta.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-slate-200 font-medium block">Auto-Approve Reconciled Invoices</span>
                <span className="text-[11px] text-slate-500">
                  Automatically mark valid invoices for immediate ERP posting if math discrepancy is 0.00.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoApproveReconciled}
                onChange={(e) => setAutoApproveReconciled(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-slate-300 font-medium block mb-1">Max Processing Batch Limit</label>
              <input
                type="number"
                value={maxBatchSize}
                onChange={(e) => setMaxBatchSize(parseInt(e.target.value, 10) || 50)}
                className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-200 font-mono text-xs w-28 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
