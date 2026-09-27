import React, { useState } from 'react';
import { Database, Plus, Trash2, Check, Save, ShieldCheck, Percent, Tag, Edit2, X } from 'lucide-react';
import { VendorMasterRecord, TaxMatrixRule, CustomFieldDefinition } from '../types';
import { MOCK_VENDORS, MOCK_TAX_RULES } from '../sampleData';

interface MasterDataViewProps {
  customFields?: CustomFieldDefinition[];
  onAuditChange?: (action: any, entity: string, summary: string) => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  customFields = [],
  onAuditChange,
}) => {
  const [vendors, setVendors] = useState<VendorMasterRecord[]>(MOCK_VENDORS);
  const [taxRules, setTaxRules] = useState<TaxMatrixRule[]>(MOCK_TAX_RULES);
  const [activeTab, setActiveTab] = useState<'vendors' | 'tax_matrix'>('vendors');
  const [editingVendor, setEditingVendor] = useState<VendorMasterRecord | null>(null);

  const handleSaveVendor = (vendor: VendorMasterRecord) => {
    const exists = vendors.some((v) => v.id === vendor.id);
    if (exists) {
      setVendors(vendors.map((v) => (v.id === vendor.id ? vendor : v)));
      onAuditChange?.('EDIT_VENDOR', 'Vendor Catalog', `Updated vendor record ${vendor.vendorCode} (${vendor.canonicalName})`);
    } else {
      setVendors([...vendors, vendor]);
      onAuditChange?.('CREATE_VENDOR', 'Vendor Catalog', `Created new vendor ${vendor.vendorCode} (${vendor.canonicalName})`);
    }
    setEditingVendor(null);
  };

  const handleDeleteVendor = (id: string) => {
    const v = vendors.find((item) => item.id === id);
    setVendors(vendors.filter((item) => item.id !== id));
    if (v) {
      onAuditChange?.('DELETE_VENDOR', 'Vendor Catalog', `Deleted vendor ${v.vendorCode} (${v.canonicalName})`);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Master Data & Resolution Catalog</h2>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Relational Catalog
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Maintain standardized Vendor codes, aliases, Tax IDs, and custom master fields with full revision logging.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const newV: VendorMasterRecord = {
              id: `v-${Date.now()}`,
              vendorCode: `VEND_${Math.floor(1000 + Math.random() * 9000)}`,
              canonicalName: 'New Vendor Entity',
              aliases: ['Alias 1'],
              taxIds: ['US-EIN-000000000'],
              defaultCategory: 'General',
              defaultPaymentTerms: 'Net 30 Days',
              customFieldValues: {},
            };
            setEditingVendor(newV);
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/50"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Vendor Entity
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('vendors')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'vendors'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-indigo-400" />
          Vendor Aliases & Master Codes ({vendors.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tax_matrix')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'tax_matrix'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Percent className="w-3.5 h-3.5 text-emerald-400" />
          Tax Codes & General Ledger Matrix ({taxRules.length})
        </button>
      </div>

      {/* Edit/Create Vendor Modal */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Vendor Master Record Editor</h3>
              <button
                type="button"
                onClick={() => setEditingVendor(null)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">ERP Vendor Code</label>
                <input
                  type="text"
                  value={editingVendor.vendorCode}
                  onChange={(e) => setEditingVendor({ ...editingVendor, vendorCode: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Canonical Legal Name</label>
                <input
                  type="text"
                  value={editingVendor.canonicalName}
                  onChange={(e) => setEditingVendor({ ...editingVendor, canonicalName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-300 font-medium block mb-1">Tax / VAT IDs (Comma-separated)</label>
                <input
                  type="text"
                  value={editingVendor.taxIds.join(', ')}
                  onChange={(e) =>
                    setEditingVendor({
                      ...editingVendor,
                      taxIds: e.target.value.split(',').map((s) => s.trim()),
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sky-400 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-300 font-medium block mb-1">OCR Aliases & Brand Variations</label>
                <input
                  type="text"
                  value={editingVendor.aliases.join(', ')}
                  onChange={(e) =>
                    setEditingVendor({
                      ...editingVendor,
                      aliases: e.target.value.split(',').map((s) => s.trim()),
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-slate-200"
                />
              </div>

              {/* Dynamic Custom Fields attached to vendor */}
              {customFields.map((cf) => (
                <div key={cf.id} className="sm:col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">{cf.label}</label>
                  <input
                    type={cf.fieldType === 'number' ? 'number' : 'text'}
                    value={editingVendor.customFieldValues?.[cf.key] ?? cf.defaultValue}
                    onChange={(e) =>
                      setEditingVendor({
                        ...editingVendor,
                        customFieldValues: {
                          ...editingVendor.customFieldValues,
                          [cf.key]: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-indigo-300 font-mono"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingVendor(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveVendor(editingVendor)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs"
              >
                Save Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendors Table */}
      {activeTab === 'vendors' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase font-mono">
              Master Vendor Registry
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Vendor Code</th>
                  <th className="py-2.5 px-3">Canonical Legal Name</th>
                  <th className="py-2.5 px-3">Tax / VAT IDs</th>
                  <th className="py-2.5 px-3">Known Aliases</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-indigo-300">{v.vendorCode}</td>
                    <td className="py-2.5 px-3 text-white font-medium">{v.canonicalName}</td>
                    <td className="py-2.5 px-3 text-sky-400">{v.taxIds.join(', ')}</td>
                    <td className="py-2.5 px-3 text-slate-400">{v.aliases.join(' • ')}</td>
                    <td className="py-2.5 px-3 text-amber-300">{v.defaultCategory}</td>
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingVendor(v)}
                          className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                          title="Edit vendor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVendor(v.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                          title="Delete vendor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tax Matrix Table */}
      {activeTab === 'tax_matrix' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase font-mono">
              Tax Code & GL Account Derivation Matrix
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Expense Category</th>
                  <th className="py-2.5 px-3">Tax Code</th>
                  <th className="py-2.5 px-3">Rate (%)</th>
                  <th className="py-2.5 px-3">GL Account</th>
                  <th className="py-2.5 px-3">Cost Center</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {taxRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-amber-300">{rule.category}</td>
                    <td className="py-2.5 px-3 text-indigo-400 font-semibold">{rule.taxCode}</td>
                    <td className="py-2.5 px-3 font-semibold">{rule.ratePercentage}%</td>
                    <td className="py-2.5 px-3 text-sky-300">{rule.glAccount}</td>
                    <td className="py-2.5 px-3 text-slate-400">{rule.costCenter}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{rule.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
