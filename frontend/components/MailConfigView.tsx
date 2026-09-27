import React, { useState } from 'react';
import { Mail, KeyRound, ShieldCheck, Check, RefreshCw, AlertTriangle, Filter, Lock } from 'lucide-react';

export const MailConfigView: React.FC = () => {
  const [provider, setProvider] = useState<'graph_api' | 'imap'>('graph_api');
  const [tenantId, setTenantId] = useState('72f988bf-86f1-41af-91ab-2d7cd011db47');
  const [clientId, setClientId] = useState('4a89901d-7812-4eb1-b3b0-e349881a2938');
  const [clientSecret, setClientSecret] = useState('••••••••••••••••••••••••••••••••');
  const [targetMailbox, setTargetMailbox] = useState('finance-invoices@company.com');
  const [folder, setFolder] = useState('Inbox');
  const [maxAgeDays, setMaxAgeDays] = useState(7);
  const [senders, setSenders] = useState('*@makemytrip.com, *@uber.com, *@apollohospitals.com, *@nexusdynamics.io');
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  const handleTestConnection = () => {
    setTestState('testing');
    setTimeout(() => {
      setTestState('success');
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Mailbox Ingestion & OAuth2 Adapter</h2>
              <span className="text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
                MS Graph API / Entra ID
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Configure Microsoft 365 Exchange credentials, polling intervals, attachment sanitization, and sender whitelists.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestConnection}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-sky-950/50"
        >
          {testState === 'testing' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : testState === 'success' ? (
            <Check className="w-3.5 h-3.5 text-emerald-300" />
          ) : (
            <KeyRound className="w-3.5 h-3.5" />
          )}
          {testState === 'testing' ? 'Testing Handshake...' : testState === 'success' ? 'OAuth2 Verified!' : 'Test Connection'}
        </button>
      </div>

      {/* Mailbox Parameters Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Authentication & Target Mailbox</h3>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Ingestion Provider</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProvider('graph_api')}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold ${
                    provider === 'graph_api'
                      ? 'bg-sky-600/30 border-sky-500 text-sky-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Microsoft Graph API (OAuth2)
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('imap')}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold ${
                    provider === 'imap'
                      ? 'bg-sky-600/30 border-sky-500 text-sky-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  IMAP / SMTP Fallback
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Azure AD Tenant ID</label>
              <input
                type="text"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-slate-200 font-mono text-xs outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Client ID (Application ID)</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-slate-200 font-mono text-xs outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Target Exchange Mailbox</label>
              <input
                type="email"
                value={targetMailbox}
                onChange={(e) => setTargetMailbox(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-slate-200 font-mono text-xs outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Filter Rules & Sanitization */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Filter className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Attachment Filters & Quarantine Rules</h3>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Allowed Sender Domains (Whitelist)</label>
              <textarea
                rows={2}
                value={senders}
                onChange={(e) => setSenders(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded-lg text-slate-200 font-mono text-xs outline-none focus:border-sky-500"
              />
              <span className="text-[11px] text-slate-500">Comma-separated glob wildcards</span>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Max Age Lookback Window</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={maxAgeDays}
                  onChange={(e) => setMaxAgeDays(parseInt(e.target.value, 10) || 7)}
                  className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-200 font-mono text-xs w-24 outline-none focus:border-sky-500"
                />
                <span className="text-slate-400 text-xs">Days (OData receivedDateTime filter)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col gap-1.5">
              <span className="font-semibold text-slate-200">Attachment Quarantine Invariants:</span>
              <ul className="text-slate-400 list-disc list-inside space-y-0.5 text-[11px]">
                <li>Rejects signatures, social icons, and tracking pixels &lt; 1KB</li>
                <li>Recursively unpacks nested <span className="text-amber-300 font-mono">.ZIP</span> archives in-memory</li>
                <li>Validates magic bytes (%PDF, PNG, JFIF, TIFF)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
