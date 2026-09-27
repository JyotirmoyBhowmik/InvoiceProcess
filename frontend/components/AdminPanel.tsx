import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  Cpu,
  Database,
  Save,
  Check,
  Percent,
  Palette,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  History,
  Tag,
  Plus,
  Server,
  KeyRound,
  Lock,
  Globe
} from 'lucide-react';
import { SystemBrandingConfig, CustomFieldDefinition, AdminAuditChangeLog, AIModelConfiguration } from '../types';

interface AdminPanelProps {
  brandingConfig: SystemBrandingConfig;
  onUpdateBranding: (updated: SystemBrandingConfig) => void;
  aiConfig: AIModelConfiguration;
  onUpdateAIConfig: (updated: AIModelConfiguration) => void;
  customFields: CustomFieldDefinition[];
  onAddCustomField: (field: CustomFieldDefinition) => void;
  onDeleteCustomField: (fieldId: string) => void;
  onPurgeDemoData: () => void;
  auditLogs: AdminAuditChangeLog[];
  onAddAuditLog: (action: AdminAuditChangeLog['action'], entity: string, summary: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  brandingConfig,
  onUpdateBranding,
  aiConfig,
  onUpdateAIConfig,
  customFields,
  onAddCustomField,
  onDeleteCustomField,
  onPurgeDemoData,
  auditLogs,
  onAddAuditLog,
}) => {
  const [config, setConfig] = useState<SystemBrandingConfig>(brandingConfig);
  const [currentAiConfig, setCurrentAiConfig] = useState<AIModelConfiguration>(aiConfig);
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'ai_engine' | 'tabs' | 'validations' | 'custom_fields' | 'audit_log'>('branding');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  // New Custom field form state
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<'text' | 'number' | 'date'>('text');
  const [newDefault, setNewDefault] = useState('');

  const handleSaveAll = () => {
    onUpdateBranding(config);
    onUpdateAIConfig(currentAiConfig);
    onAddAuditLog(
      'UPDATE_CONFIG',
      'System Configuration',
      `Updated platform branding (${config.applicationName}), theme (${config.themeColor}), and AI provider (${currentAiConfig.activeProvider}).`
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2200);
  };

  const handleCreateField = () => {
    if (!newKey.trim() || !newLabel.trim()) return;
    const cleanKey = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    const field: CustomFieldDefinition = {
      id: `cf-${Date.now()}`,
      key: cleanKey,
      label: newLabel.trim(),
      fieldType: newType,
      defaultValue: newDefault,
      isRequired: false,
    };
    onAddCustomField(field);
    onAddAuditLog('UPDATE_CONFIG', 'Custom Field', `Registered dynamic master field '${field.label}' (${field.key})`);
    setNewKey('');
    setNewLabel('');
    setNewDefault('');
  };

  const handleExecutePurge = () => {
    onPurgeDemoData();
    onAddAuditLog('PURGE_DATA', 'Database Ledger', 'Completely purged demo transactions and state.');
    setShowPurgeConfirm(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Platform Administration & Governance</h2>
              <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                White-Label & AI Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Customize branding, AI models (Vertex / Azure / Local), tab naming, custom master fields, and full audit logging.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-950/50"
        >
          {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
          {saveSuccess ? 'Configuration Applied!' : 'Save & Deploy Changes'}
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 flex-wrap">
        {[
          { id: 'branding', label: 'White-Label Branding', icon: Palette },
          { id: 'ai_engine', label: `AI Engine (${currentAiConfig.activeProvider.toUpperCase()})`, icon: Cpu },
          { id: 'tabs', label: 'Navigation & Tab Controls', icon: Eye },
          { id: 'validations', label: 'Advanced Validations', icon: ShieldCheck },
          { id: 'custom_fields', label: 'Dynamic Custom Fields', icon: Tag },
          { id: 'audit_log', label: `Change Audit Trail (${auditLogs.length})`, icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubTab === tab.id
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5 text-indigo-400" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: White-Label Branding */}
      {activeSubTab === 'branding' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Identity & App Customization
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Application Name</label>
                <input
                  type="text"
                  value={config.applicationName}
                  onChange={(e) => setConfig({ ...config, applicationName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 font-medium outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Header Subtitle</label>
                <input
                  type="text"
                  value={config.headerSubtitle}
                  onChange={(e) => setConfig({ ...config, headerSubtitle: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 font-medium outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Footer Copyright & Legal Text</label>
                <input
                  type="text"
                  value={config.footerText}
                  onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 font-medium outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Service Engine Badge</label>
                <input
                  type="text"
                  value={config.serviceName}
                  onChange={(e) => setConfig({ ...config, serviceName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 font-medium outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Theme Palette & Data State
            </h3>

            <div className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1.5">Theme Palette</label>
                <div className="grid grid-cols-5 gap-2">
                  {(['indigo', 'sky', 'emerald', 'rose', 'amber'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setConfig({ ...config, themeColor: color })}
                      className={`p-2.5 rounded-lg border text-center font-bold capitalize transition-all ${
                        config.themeColor === color
                          ? 'border-white text-white shadow-md bg-slate-800 ring-2 ring-white/20'
                          : 'border-slate-800 text-slate-400 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-red-950/20 border border-red-500/40 rounded-xl flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="font-bold text-red-200">Purge Sample & Demo Data</span>
                </div>
                <p className="text-[11px] text-red-300/80 leading-relaxed">
                  Permanently deletes sample invoices, test batch logs, and dummy line items to start from a completely clean slate.
                </p>

                {showPurgeConfirm ? (
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={handleExecutePurge}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs"
                    >
                      Confirm Complete Wipe
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPurgeConfirm(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPurgeConfirm(true)}
                    className="self-start px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 border border-red-500/50 text-red-300 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Purge All Demo Data
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Multi-Model AI Routing (Vertex / Azure / Local) */}
      {activeSubTab === 'ai_engine' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Provider Selection */}
          <div className="md:col-span-3 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Select AI Engine / Model Provider
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'vertex_ai',
                  title: 'Google Cloud Vertex AI',
                  subtitle: 'Gemini 2.5 Flash / Agent Builder',
                  desc: 'Cloud-grounded OCR with schema enforcement and thinkingBudget=0 low token pricing.',
                },
                {
                  id: 'azure_ai',
                  title: 'Azure AI / OpenAI',
                  subtitle: 'GPT-4o / Document Intelligence',
                  desc: 'Microsoft Azure OpenAI endpoint with layout model document intelligence extraction.',
                },
                {
                  id: 'local_ai',
                  title: 'Local On-Premises AI',
                  subtitle: 'Ollama / vLLM / Tesseract',
                  desc: 'Complete on-prem local server execution (Llama 3.2 Vision or Qwen2-VL) without internet dependency.',
                },
              ].map((prov) => (
                <div
                  key={prov.id}
                  onClick={() =>
                    setCurrentAiConfig({
                      ...currentAiConfig,
                      activeProvider: prov.id as any,
                    })
                  }
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    currentAiConfig.activeProvider === prov.id
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{prov.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                      {prov.subtitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{prov.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Provider Parameters */}
          {currentAiConfig.activeProvider === 'vertex_ai' && (
            <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 text-xs">
              <span className="font-bold text-white uppercase tracking-wider">Vertex AI Configuration</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-300 block mb-1">GCP Project ID</label>
                  <input
                    type="text"
                    value={currentAiConfig.vertexAi.projectId}
                    onChange={(e) =>
                      setCurrentAiConfig({
                        ...currentAiConfig,
                        vertexAi: { ...currentAiConfig.vertexAi, projectId: e.target.value },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Model Name</label>
                  <input
                    type="text"
                    value={currentAiConfig.vertexAi.model}
                    onChange={(e) =>
                      setCurrentAiConfig({
                        ...currentAiConfig,
                        vertexAi: { ...currentAiConfig.vertexAi, model: e.target.value },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Thinking Budget Tokens</label>
                  <input
                    type="number"
                    value={currentAiConfig.vertexAi.thinkingBudget}
                    onChange={(e) =>
                      setCurrentAiConfig({
                        ...currentAiConfig,
                        vertexAi: { ...currentAiConfig.vertexAi, thinkingBudget: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">0 = Minimum latency and low token usage</span>
                </div>
              </div>
            </div>
          )}

          {currentAiConfig.activeProvider === 'azure_ai' && (
            <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 text-xs">
              <span className="font-bold text-white uppercase tracking-wider">Azure OpenAI / Document Intelligence</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-300 block mb-1">Azure Endpoint URL</label>
                  <input
                    type="text"
                    placeholder="https://your-resource.openai.azure.com"
                    value={currentAiConfig.azureAi.endpoint}
                    onChange={(e) =>
                      setCurrentAiConfig({
                        ...currentAiConfig,
                        azureAi: { ...currentAiConfig.azureAi, endpoint: e.target.value },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Deployment Name</label>
                  <input
                    type="text"
                    value={currentAiConfig.azureAi.deploymentName}
                    onChange={(e) =>
                      setCurrentAiConfig({
                        ...currentAiConfig,
                        azureAi: { ...currentAiConfig.azureAi, deploymentName: e.target.value },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">API Key</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={currentAiConfig.azureAi.apiKey}
                    onChange={(e) =>
                      setCurrentAiConfig({
                        ...currentAiConfig,
                        azureAi: { ...currentAiConfig.azureAi, apiKey: e.target.value },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {currentAiConfig.activeProvider === 'local_ai' && (
            <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 text-xs">
              <span className="font-bold text-white uppercase tracking-wider">Local On-Premises Server Model</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-300 block mb-1">Ollama / vLLM Endpoint</label>
                  <input
                    type="text"
                    value={currentAiConfig.localAi.endpointUrl}
                    onChange={(e) =>
                      setCurrentAiConfig({
                        ...currentAiConfig,
                        localAi: { ...currentAiConfig.localAi, endpointUrl: e.target.value },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Model Tag</label>
                  <input
                    type="text"
                    value={currentAiConfig.localAi.modelName}
                    onChange={(e) =>
                      setCurrentAiConfig({
                        ...currentAiConfig,
                        localAi: { ...currentAiConfig.localAi, modelName: e.target.value },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Local OCR Engine Fallback</label>
                  <select
                    value={currentAiConfig.localAi.ocrFallbackEngine}
                    onChange={(e) =>
                      setCurrentAiConfig({
                        ...currentAiConfig,
                        localAi: { ...currentAiConfig.localAi, ocrFallbackEngine: e.target.value as any },
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-white"
                  >
                    <option value="tesseract">Tesseract OCR (Native)</option>
                    <option value="easyocr">EasyOCR (PyTorch)</option>
                    <option value="pymupdf">PyMuPDF Text Extract</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: Navigation & Tab Controls */}
      {activeSubTab === 'tabs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Tab Visibility & Labels</h3>
            <p className="text-xs text-slate-400">
              Rename tab labels or toggle off views you do not wish operators to see.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {Object.keys(config.visibleTabs).map((tabKey) => {
              const k = tabKey as keyof typeof config.visibleTabs;
              const isVisible = config.visibleTabs[k];
              const label = config.tabLabels[k];

              return (
                <div
                  key={k}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-400 uppercase">{k}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          visibleTabs: {
                            ...config.visibleTabs,
                            [k]: !isVisible,
                          },
                        })
                      }
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isVisible
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {isVisible ? 'Visible' : 'Hidden'}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={label}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        tabLabels: {
                          ...config.tabLabels,
                          [k]: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-white font-medium outline-none focus:border-indigo-500"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 4: Advanced Validations */}
      {activeSubTab === 'validations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Accounting Invariants & Date Integrity
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={config.duplicateInvoiceGuard}
                  onChange={(e) => setConfig({ ...config, duplicateInvoiceGuard: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded mt-0.5"
                />
                <div>
                  <span className="font-semibold block">Duplicate Invoice Prevention Guard</span>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    Flags any invoice where the combination of Vendor Code and Invoice Number has previously been committed.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-slate-200 pt-2 border-t border-slate-800/80">
                <input
                  type="checkbox"
                  checked={config.strictTaxIdFormatCheck}
                  onChange={(e) => setConfig({ ...config, strictTaxIdFormatCheck: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded mt-0.5"
                />
                <div>
                  <span className="font-semibold block">Strict Tax ID Regex Validation</span>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    Enforces formal syntax checking (US EIN, European VAT, and Indian GSTIN).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-slate-200 pt-2 border-t border-slate-800/80">
                <input
                  type="checkbox"
                  checked={config.preventFutureInvoiceDates}
                  onChange={(e) => setConfig({ ...config, preventFutureInvoiceDates: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded mt-0.5"
                />
                <div>
                  <span className="font-semibold block">Reject Future Invoice Dates</span>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    Flags documents dated more than 48 hours into the future as anomalous.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Arithmetic Deviation Threshold
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Max Deviation Tolerance (± Units)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.maxLineItemDeviationAllowed}
                  onChange={(e) =>
                    setConfig({ ...config, maxLineItemDeviationAllowed: parseFloat(e.target.value) || 0.05 })
                  }
                  className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-200 font-mono text-xs w-28 outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  If the sum of line items deviates from the Net Subtotal by more than this limit, the document is routed to the Exception Queue.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: Dynamic Custom Fields */}
      {activeSubTab === 'custom_fields' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <span className="text-xs font-bold text-white uppercase font-mono border-b border-slate-800 pb-2">
              Define New Master / Template Field
            </span>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Field Label</label>
                <input
                  type="text"
                  placeholder="e.g. Cost Center / Project Code"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Field Key (Identifier)</label>
                <input
                  type="text"
                  placeholder="e.g. cost_center"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-white font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Data Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-white outline-none"
                >
                  <option value="text">String / Text</option>
                  <option value="number">Numeric</option>
                  <option value="date">Date</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Default Fallback Value</label>
                <input
                  type="text"
                  placeholder="e.g. CC_DEFAULT"
                  value={newDefault}
                  onChange={(e) => setNewDefault(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-white outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateField}
                className="mt-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Master & Template Registry
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Registered Dynamic Fields ({customFields.length})
              </h3>
              <span className="text-[11px] text-slate-500">Available in Master Data & Template Mapper</span>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-[480px] overflow-y-auto">
              {customFields.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs italic">
                  No custom fields defined yet.
                </div>
              ) : (
                customFields.map((cf) => (
                  <div key={cf.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{cf.label}</span>
                      <span className="font-mono text-indigo-400 text-[11px]">key: {cf.key}</span>
                      <span className="text-slate-500 text-[11px] ml-2">• Type: {cf.fieldType}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        Default: {cf.defaultValue || 'None'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteCustomField(cf.id)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                        title="Delete custom field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: Audit Log Trail */}
      {activeSubTab === 'audit_log' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-400" />
              Administrative Change & Governance Log
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Immutable Trail</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Audit Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{log.timestamp}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-semibold">{log.changedBy}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-amber-300 font-medium">{log.entity}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans text-xs">{log.summary}</td>
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
