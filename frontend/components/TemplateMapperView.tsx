import React, { useState } from 'react';
import { Layers, Plus, Trash2, Copy, Check, Table, Download, Settings } from 'lucide-react';
import { ExportTemplateConfig, TemplateFieldMapping, ExtractedInvoice, CustomFieldDefinition } from '../types';
import { MOCK_TEMPLATES } from '../sampleData';

interface TemplateMapperViewProps {
  currentInvoice: ExtractedInvoice | null;
  customFields?: CustomFieldDefinition[];
}

export const TemplateMapperView: React.FC<TemplateMapperViewProps> = ({ currentInvoice, customFields = [] }) => {
  const [templates, setTemplates] = useState<ExportTemplateConfig[]>(MOCK_TEMPLATES);
  const [selectedTplId, setSelectedTplId] = useState<string>(MOCK_TEMPLATES[0].id);
  const [copied, setCopied] = useState<boolean>(false);

  const activeTpl = templates.find((t) => t.id === selectedTplId) || templates[0];

  const handleAddField = () => {
    const newField: TemplateFieldMapping = {
      id: `f-${Date.now()}`,
      columnName: 'Custom_Field',
      sourceType: 'fixed',
      fixedValue: 'NEW_VALUE',
      columnWidth: 15,
      paddingSide: 'right',
      paddingChar: ' ',
    };
    setTemplates((prev) =>
      prev.map((t) => (t.id === activeTpl.id ? { ...t, fields: [...t.fields, newField] } : t))
    );
  };

  const handleDeleteField = (fieldId: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === activeTpl.id
          ? { ...t, fields: t.fields.filter((f) => f.id !== fieldId) }
          : t
      )
    );
  };

  const inv = currentInvoice;
  const generatePreview = (): string => {
    const rows: string[] = [];

    if (activeTpl.includeHeaders && activeTpl.format !== 'fixed_width_txt') {
      const headerTokens = activeTpl.fields.map((f) => f.columnName);
      rows.push(headerTokens.join(activeTpl.delimiter || ','));
    }

    if (activeTpl.format === 'fixed_width_txt') {
      let recordStr = '';
      for (const field of activeTpl.fields) {
        let val = '';
        if (field.sourceType === 'fixed') val = field.fixedValue || '';
        else if (field.sourceType === 'extracted' && inv) {
          const raw = (inv as any)[field.extractedFieldPath || ''];
          val = raw && typeof raw === 'object' && 'value' in raw ? String(raw.value) : String(raw || '');
        } else if (field.sourceType === 'derived') {
          val = field.derivedSource === 'trace_id' ? (inv?.traceId || 'TRACE-1001') : 'VEND_NEXUS_01';
        } else if (field.sourceType === 'custom_master') {
          val = 'PRJ_DEFAULT_01';
        }

        if (field.expressionTransform === 'uppercase') val = val.toUpperCase();
        if (field.expressionTransform === 'decimal_2') {
          const num = parseFloat(val) || 0;
          val = num.toFixed(2);
        }

        const width = field.columnWidth || 10;
        const padChar = field.paddingChar || ' ';
        const padded =
          field.paddingSide === 'left'
            ? val.padStart(width, padChar)
            : val.padEnd(width, padChar);
        recordStr += padded.slice(0, width);
      }
      rows.push(recordStr);
    } else {
      const rowTokens = activeTpl.fields.map((field) => {
        let val = '';
        if (field.sourceType === 'fixed') val = field.fixedValue || '';
        else if (field.sourceType === 'extracted' && inv) {
          const raw = (inv as any)[field.extractedFieldPath || ''];
          val = raw && typeof raw === 'object' && 'value' in raw ? String(raw.value) : String(raw || '');
        } else if (field.sourceType === 'derived') {
          val = field.derivedSource === 'trace_id' ? (inv?.traceId || 'TRACE-1001') : 'VEND_NEXUS_01';
        } else if (field.sourceType === 'custom_master') {
          val = 'PRJ_DEFAULT_01';
        }
        return val.includes(',') ? `"${val.replace(/"/g, '""')}"` : val;
      });
      rows.push(rowTokens.join(activeTpl.delimiter || ','));
    }

    return rows.join('\n');
  };

  const previewOutput = generatePreview();

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(previewOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Dynamic Template & Column Mapper</h2>
              <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                Custom Output Schema
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Bind AI-extracted fields, constant values, or dynamic custom master fields to output columns.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyPreview}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-purple-950/50"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied Output!' : 'Copy Formatted Record'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Templates ({templates.length})
            </span>
            <span className="text-[10px] font-mono text-purple-400">ERP Schemas</span>
          </div>

          <div className="flex flex-col gap-2">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => setSelectedTplId(tpl.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 ${
                  selectedTplId === tpl.id
                    ? 'bg-purple-950/40 border-purple-500/70 shadow-sm'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white truncate max-w-[190px]">
                    {tpl.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-400 font-mono">
                    {tpl.format.toUpperCase()}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {tpl.fields.length} columns defined • {tpl.format === 'fixed_width_txt' ? 'Exact Padding' : `Delimiter: '${tpl.delimiter || ','}'`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] text-purple-400 uppercase font-mono tracking-wider font-semibold">
                  Field Ordering & Specification
                </span>
                <h3 className="text-sm font-bold text-white">{activeTpl.name}</h3>
              </div>

              <button
                type="button"
                onClick={handleAddField}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/50 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Column
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="py-2 px-3">Column Name</th>
                    <th className="py-2 px-3">Source Type</th>
                    <th className="py-2 px-3">Binding / Key</th>
                    <th className="py-2 px-2 text-center">Width</th>
                    <th className="py-2 px-2 text-center">Pad</th>
                    <th className="py-2 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {activeTpl.fields.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-850 transition-colors">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={f.columnName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTemplates((prev) =>
                              prev.map((t) =>
                                t.id === activeTpl.id
                                  ? {
                                      ...t,
                                      fields: t.fields.map((field) =>
                                        field.id === f.id ? { ...field, columnName: val } : field
                                      ),
                                    }
                                  : t
                              )
                            );
                          }}
                          className="bg-slate-800 px-2 py-1 rounded text-xs text-white border border-slate-700 w-32 outline-none font-medium"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <select
                          value={f.sourceType}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setTemplates((prev) =>
                              prev.map((t) =>
                                t.id === activeTpl.id
                                  ? {
                                      ...t,
                                      fields: t.fields.map((field) =>
                                        field.id === f.id ? { ...field, sourceType: val } : field
                                      ),
                                    }
                                  : t
                              )
                            );
                          }}
                          className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-200 border border-slate-700 outline-none"
                        >
                          <option value="fixed">Fixed Value</option>
                          <option value="extracted">AI-Extracted</option>
                          <option value="derived">Derived Logic</option>
                          <option value="custom_master">Custom Master Field</option>
                        </select>
                      </td>

                      <td className="py-2 px-3">
                        {f.sourceType === 'custom_master' ? (
                          <select
                            value={f.customFieldKey || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTemplates((prev) =>
                                prev.map((t) =>
                                  t.id === activeTpl.id
                                    ? {
                                        ...t,
                                        fields: t.fields.map((field) =>
                                          field.id === f.id ? { ...field, customFieldKey: val } : field
                                        ),
                                      }
                                    : t
                                )
                              );
                            }}
                            className="bg-slate-800 px-2 py-1 rounded text-xs text-indigo-300 border border-slate-700 w-36 outline-none"
                          >
                            <option value="">Select Field...</option>
                            {customFields.map((cf) => (
                              <option key={cf.id} value={cf.key}>
                                {cf.label} ({cf.key})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={f.sourceType === 'fixed' ? f.fixedValue : (f.extractedFieldPath || f.derivedSource || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTemplates((prev) =>
                                prev.map((t) =>
                                  t.id === activeTpl.id
                                    ? {
                                        ...t,
                                        fields: t.fields.map((field) =>
                                          field.id === f.id
                                            ? field.sourceType === 'fixed'
                                              ? { ...field, fixedValue: val }
                                              : { ...field, extractedFieldPath: val }
                                            : field
                                        ),
                                      }
                                    : t
                                )
                              );
                            }}
                            className="bg-slate-800 px-2 py-1 rounded text-xs text-indigo-300 border border-slate-700 w-36 outline-none font-mono"
                          />
                        )}
                      </td>

                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          value={f.columnWidth}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 10;
                            setTemplates((prev) =>
                              prev.map((t) =>
                                t.id === activeTpl.id
                                  ? {
                                      ...t,
                                      fields: t.fields.map((field) =>
                                        field.id === f.id ? { ...field, columnWidth: val } : field
                                      ),
                                    }
                                  : t
                              )
                            );
                          }}
                          className="bg-slate-800 px-1.5 py-1 rounded text-xs text-slate-200 border border-slate-700 w-14 text-center font-mono outline-none"
                        />
                      </td>

                      <td className="py-2 px-2 text-center">
                        <select
                          value={f.paddingSide}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setTemplates((prev) =>
                              prev.map((t) =>
                                t.id === activeTpl.id
                                  ? {
                                      ...t,
                                      fields: t.fields.map((field) =>
                                        field.id === f.id ? { ...field, paddingSide: val } : field
                                      ),
                                    }
                                  : t
                              )
                            );
                          }}
                          className="bg-slate-800 px-1 py-1 rounded text-[11px] text-slate-300 border border-slate-700 outline-none"
                        >
                          <option value="right">Right</option>
                          <option value="left">Left</option>
                        </select>
                      </td>

                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteField(f.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                          title="Delete column"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Table className="w-4 h-4 text-emerald-400" />
              Live Generated Record Output
            </span>
            <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-emerald-300 border border-slate-800 overflow-x-auto whitespace-pre">
              {previewOutput}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
