import React from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { InvoiceLineItem } from '../types';
import { ConfidenceBadge } from './ConfidenceBadge';

interface LineItemsTableProps {
  lineItems: InvoiceLineItem[];
  currencySymbol: string;
  onUpdateLineItem: (id: string, updated: InvoiceLineItem) => void;
  onAddLineItem: () => void;
  onDeleteLineItem: (id: string) => void;
  onVerifyField: (id: string, fieldKey: keyof InvoiceLineItem) => void;
}

export const LineItemsTable: React.FC<LineItemsTableProps> = ({
  lineItems,
  currencySymbol,
  onUpdateLineItem,
  onAddLineItem,
  onDeleteLineItem,
  onVerifyField,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Line Items ({lineItems.length})
          </h3>
          <span className="text-xs text-slate-400">
            • Editable table with dynamic ({currencySymbol}) currency rates
          </span>
        </div>
        <button
          type="button"
          onClick={onAddLineItem}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/50 hover:text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Item
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/90 shadow-inner">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
              <th className="py-2.5 px-3 w-8 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[220px]">Item Description</th>
              <th className="py-2.5 px-3 w-20 text-center">Qty</th>
              <th className="py-2.5 px-3 w-32 text-right">Unit Price ({currencySymbol})</th>
              <th className="py-2.5 px-3 w-36 text-right">Total ({currencySymbol})</th>
              <th className="py-2.5 px-2 w-10 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                  No line items extracted. Click "Add Item" to add manual entries.
                </td>
              </tr>
            ) : (
              lineItems.map((item, index) => {
                const descUnsure = item.description.isUnsure && !item.description.isManuallyVerified;
                const qtyUnsure = item.quantity.isUnsure && !item.quantity.isManuallyVerified;
                const priceUnsure = item.unitPrice.isUnsure && !item.unitPrice.isManuallyVerified;
                const amountUnsure = item.amount.isUnsure && !item.amount.isManuallyVerified;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-850 transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {index + 1}
                    </td>

                    <td className="py-2 px-3">
                      <div className="flex flex-col gap-1">
                        <input
                          type="text"
                          value={item.description.value}
                          onChange={(e) => {
                            onUpdateLineItem(item.id, {
                              ...item,
                              description: { ...item.description, value: e.target.value },
                            });
                          }}
                          className={`w-full px-2.5 py-1.5 rounded text-xs outline-none font-medium transition-all ${
                            descUnsure
                              ? 'bg-amber-950/30 border border-amber-500/80 text-amber-200'
                              : 'bg-slate-800/60 border border-slate-700/60 text-slate-100 focus:border-indigo-500'
                          }`}
                        />
                        {descUnsure && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-400">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span className="truncate" title={item.description.reasonUnsure}>
                              {item.description.reasonUnsure || 'Unsure text OCR'}
                            </span>
                            <button
                              type="button"
                              onClick={() => onVerifyField(item.id, 'description')}
                              className="ml-auto underline hover:text-white shrink-0 font-bold"
                            >
                              Verify
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        step="any"
                        value={item.quantity.value}
                        onChange={(e) => {
                          const newQty = parseFloat(e.target.value) || 0;
                          const calculatedAmount = Math.round(newQty * item.unitPrice.value * 100) / 100;
                          onUpdateLineItem(item.id, {
                            ...item,
                            quantity: { ...item.quantity, value: newQty },
                            amount: { ...item.amount, value: calculatedAmount },
                          });
                        }}
                        className={`w-16 px-2 py-1.5 rounded text-center text-xs outline-none font-mono font-medium ${
                          qtyUnsure
                            ? 'bg-amber-950/30 border border-amber-500/80 text-amber-200'
                            : 'bg-slate-800/60 border border-slate-700/60 text-slate-100 focus:border-indigo-500'
                        }`}
                      />
                    </td>

                    <td className="py-2 px-3 text-right">
                      <div className="relative inline-block w-full">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice.value}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value) || 0;
                            const calculatedAmount = Math.round(item.quantity.value * newPrice * 100) / 100;
                            onUpdateLineItem(item.id, {
                              ...item,
                              unitPrice: { ...item.unitPrice, value: newPrice },
                              amount: { ...item.amount, value: calculatedAmount },
                            });
                          }}
                          className={`w-full pl-6 pr-2 py-1.5 rounded text-right text-xs outline-none font-mono font-medium ${
                            priceUnsure
                              ? 'bg-amber-950/30 border border-amber-500/80 text-amber-200'
                              : 'bg-slate-800/60 border border-slate-700/60 text-slate-100 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                    </td>

                    <td className="py-2 px-3 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="relative inline-block w-full">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.amount.value}
                            onChange={(e) => {
                              const newAmount = parseFloat(e.target.value) || 0;
                              onUpdateLineItem(item.id, {
                                ...item,
                                amount: { ...item.amount, value: newAmount },
                              });
                            }}
                            className={`w-full pl-6 pr-2 py-1.5 rounded text-right text-xs outline-none font-mono font-bold ${
                              amountUnsure
                                ? 'bg-amber-950/30 border border-amber-500/80 text-amber-200'
                                : 'bg-slate-800/60 border border-slate-700/60 text-slate-100 focus:border-indigo-500'
                            }`}
                          />
                        </div>
                        {amountUnsure && (
                          <ConfidenceBadge
                            field={item.amount}
                            onVerify={() => onVerifyField(item.id, 'amount')}
                            compact
                          />
                        )}
                      </div>
                    </td>

                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteLineItem(item.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                        title="Delete line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
