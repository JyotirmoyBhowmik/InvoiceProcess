import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Calculator, ArrowRightLeft, Percent, DollarSign, RefreshCw } from 'lucide-react';
import { ExtractedInvoice } from '../types';
import { EditableField } from './EditableField';
import { CURRENCY_SYMBOLS, DEFAULT_FX_RATES } from '../services/geminiService';

interface TotalsReviewProps {
  invoice: ExtractedInvoice;
  onUpdateField: (fieldKey: keyof ExtractedInvoice, value: number) => void;
  onVerifyField: (fieldKey: keyof ExtractedInvoice) => void;
}

export const TotalsReview: React.FC<TotalsReviewProps> = ({
  invoice,
  onUpdateField,
  onVerifyField,
}) => {
  const [targetBaseCurrency, setTargetBaseCurrency] = useState<string>('USD');
  const [customFxRate, setCustomFxRate] = useState<number>(
    DEFAULT_FX_RATES[invoice.currency.value] || 1.0
  );

  const subtotal = Number(invoice.subtotal.value) || 0;
  const tax = Number(invoice.taxAmount.value) || 0;
  const shipping = Number(invoice.shippingAmount.value) || 0;
  const tip = Number(invoice.tipAmount?.value) || 0;
  const discount = Number(invoice.discountAmount.value) || 0;
  const billedTotal = Number(invoice.totalAmount.value) || 0;

  const lineItemsSum = invoice.lineItems.reduce(
    (acc, item) => acc + (Number(item.amount.value) || 0),
    0
  );

  // Accurate formula: Grand Total = Subtotal + Tax + Shipping + Tip - Discount
  const formulaTotal = Math.round((subtotal + tax + shipping + tip - discount) * 100) / 100;
  const mathDiscrepancy = Math.abs(formulaTotal - billedTotal);
  const hasDiscrepancy = mathDiscrepancy > 0.05;

  const lineSumDiscrepancy = Math.abs(lineItemsSum - subtotal);
  const hasSubtotalMismatch = lineSumDiscrepancy > 0.05;

  // Dynamic currency symbol (never hardcoded '$')
  const currencyCode = invoice.currency.value || 'USD';
  const currencySym = CURRENCY_SYMBOLS[currencyCode] || invoice.currencySymbol || currencyCode;

  // Converted value in target ERP currency
  const convertedAmount = Math.round(billedTotal * customFxRate * 100) / 100;
  const baseCurrencySym = CURRENCY_SYMBOLS[targetBaseCurrency] || targetBaseCurrency;

  const handleAutoReconcile = () => {
    onUpdateField('totalAmount', formulaTotal);
  };

  const handleAutoSyncSubtotal = () => {
    onUpdateField('subtotal', Math.round(lineItemsSum * 100) / 100);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-4">
      {/* Header with dynamic status badge */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Breakup Cost Audit & Math Verification
          </h3>
        </div>

        {hasDiscrepancy ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-950/80 border border-amber-500/60 px-2.5 py-1 rounded-full shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              Total Discrepancy: {currencySym}{mathDiscrepancy.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={handleAutoReconcile}
              className="text-[11px] font-bold px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded transition-colors shadow-sm"
              title="Align Grand Total with calculated component breakup"
            >
              Auto-Balance Total
            </button>
          </div>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-600/50 px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Components Invariant Reconciled (100% Match)
          </span>
        )}
      </div>

      {/* Visual Arithmetic Formula Bar */}
      <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-1.5 text-slate-300">
          <span className="text-slate-400">Formula:</span>
          <span className="px-2 py-0.5 rounded bg-slate-850 text-indigo-300 border border-slate-700 font-semibold">
            Subtotal ({currencySym}{subtotal.toFixed(2)})
          </span>
          <span className="text-emerald-400 font-bold">+</span>
          <span className="px-2 py-0.5 rounded bg-slate-850 text-emerald-300 border border-slate-700 font-semibold">
            Tax ({currencySym}{tax.toFixed(2)})
          </span>
          {shipping > 0 && (
            <>
              <span className="text-emerald-400 font-bold">+</span>
              <span className="px-2 py-0.5 rounded bg-slate-850 text-sky-300 border border-slate-700">
                Ship ({currencySym}{shipping.toFixed(2)})
              </span>
            </>
          )}
          {tip > 0 && (
            <>
              <span className="text-emerald-400 font-bold">+</span>
              <span className="px-2 py-0.5 rounded bg-slate-850 text-purple-300 border border-slate-700">
                Tip ({currencySym}{tip.toFixed(2)})
              </span>
            </>
          )}
          {discount > 0 && (
            <>
              <span className="text-rose-400 font-bold">-</span>
              <span className="px-2 py-0.5 rounded bg-slate-850 text-rose-300 border border-slate-700 font-semibold">
                Discount ({currencySym}{discount.toFixed(2)})
              </span>
            </>
          )}
          <span className="text-slate-400 font-bold">=</span>
          <span
            className={`px-2 py-0.5 rounded font-bold ${
              hasDiscrepancy ? 'bg-amber-950 text-amber-300 border border-amber-600' : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
            }`}
          >
            {currencySym}{formulaTotal.toFixed(2)}
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Document Billed Total: <span className="font-bold text-white">{currencySym}{billedTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Primary Financial Inputs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <EditableField
          label="Net Subtotal"
          prefix={currencySym}
          type="number"
          field={invoice.subtotal}
          onChange={(val) => onUpdateField('subtotal', Number(val))}
          onVerify={() => onVerifyField('subtotal')}
        />
        <EditableField
          label="Total Tax / VAT"
          prefix={currencySym}
          type="number"
          field={invoice.taxAmount}
          onChange={(val) => onUpdateField('taxAmount', Number(val))}
          onVerify={() => onVerifyField('taxAmount')}
        />
        <EditableField
          label="Discounts / Credits"
          prefix={`-${currencySym}`}
          type="number"
          field={invoice.discountAmount}
          onChange={(val) => onUpdateField('discountAmount', Number(val))}
          onVerify={() => onVerifyField('discountAmount')}
        />
        <EditableField
          label="Shipping & Handling"
          prefix={currencySym}
          type="number"
          field={invoice.shippingAmount}
          onChange={(val) => onUpdateField('shippingAmount', Number(val))}
          onVerify={() => onVerifyField('shippingAmount')}
        />
        <EditableField
          label="Tip / Gratuity"
          prefix={currencySym}
          type="number"
          field={invoice.tipAmount || { value: 0, isUnsure: false, confidenceScore: 100 }}
          onChange={(val) => onUpdateField('tipAmount', Number(val))}
          onVerify={() => onVerifyField('tipAmount')}
        />
      </div>

      {/* Tax Breakup Breakdown Sub-Card */}
      {invoice.taxBreakdown && (
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold flex items-center gap-1.5 text-slate-300">
              <Percent className="w-3.5 h-3.5 text-indigo-400" />
              Granular Tax Component Breakdown
            </span>
            <span className="text-[11px]">Audit breakdown for GST / VAT filing</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-slate-900 p-2 rounded border border-slate-800/80 flex justify-between items-center">
              <span className="text-slate-400">CGST (Central):</span>
              <span className="font-semibold text-slate-200">
                {currencySym}{(invoice.taxBreakdown.cgst?.value || 0).toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800/80 flex justify-between items-center">
              <span className="text-slate-400">SGST (State):</span>
              <span className="font-semibold text-slate-200">
                {currencySym}{(invoice.taxBreakdown.sgst?.value || 0).toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800/80 flex justify-between items-center">
              <span className="text-slate-400">IGST (Integrated):</span>
              <span className="font-semibold text-slate-200">
                {currencySym}{(invoice.taxBreakdown.igst?.value || 0).toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800/80 flex justify-between items-center">
              <span className="text-slate-400">VAT / Other:</span>
              <span className="font-semibold text-slate-200">
                {currencySym}{(invoice.taxBreakdown.vat?.value || invoice.taxBreakdown.otherTax?.value || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Line Item Sum Subtotal Reconciliation Alert */}
      {hasSubtotalMismatch && (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-lg p-2.5 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Sum of table line items ({currencySym}{lineItemsSum.toFixed(2)}) differs from Net Subtotal ({currencySym}
              {subtotal.toFixed(2)}) by {currencySym}{lineSumDiscrepancy.toFixed(2)}.
            </span>
          </div>
          <button
            type="button"
            onClick={handleAutoSyncSubtotal}
            className="text-[11px] font-bold px-2 py-1 bg-amber-600/40 hover:bg-amber-600/70 text-amber-100 rounded border border-amber-500/60 transition-colors"
          >
            Auto-Sync Subtotal
          </button>
        </div>
      )}

      {/* Currency Conversion & Grand Total Bottom Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-4 gap-4">
        {/* Currency Conversion Module */}
        <div className="flex flex-wrap items-center gap-3 text-xs w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
            <span>Convert to ERP Base Currency:</span>
          </div>

          <select
            value={targetBaseCurrency}
            onChange={(e) => {
              const code = e.target.value;
              setTargetBaseCurrency(code);
              setCustomFxRate(DEFAULT_FX_RATES[code] || 1.0);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs outline-none"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="INR">INR (₹)</option>
            <option value="NPR">NPR (Rs.)</option>
            <option value="CAD">CAD (C$)</option>
            <option value="AUD">AUD (A$)</option>
            <option value="JPY">JPY (¥)</option>
          </select>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-mono text-[11px]">Rate:</span>
            <input
              type="number"
              step="0.0001"
              value={customFxRate}
              onChange={(e) => setCustomFxRate(parseFloat(e.target.value) || 1.0)}
              className="w-20 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-right font-mono text-xs text-slate-200 outline-none"
            />
          </div>

          <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 rounded text-xs">
            ≈ {baseCurrencySym}{convertedAmount.toFixed(2)} {targetBaseCurrency}
          </span>
        </div>

        {/* Invoice Grand Total Final Field */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <EditableField
            label="Invoice Grand Total Due"
            prefix={currencySym}
            type="number"
            field={invoice.totalAmount}
            onChange={(val) => onUpdateField('totalAmount', Number(val))}
            onVerify={() => onVerifyField('totalAmount')}
            className="w-52 text-right"
          />
        </div>
      </div>
    </div>
  );
};
