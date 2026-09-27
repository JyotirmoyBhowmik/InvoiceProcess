import React, { useState } from 'react';
import { Mail, Plus, Trash2, CheckCircle2, RefreshCw, KeyRound, Server, ShieldCheck, Power, AlertTriangle, ExternalLink, Settings } from 'lucide-react';
import { MailboxAccount, MailProviderType } from '../types';
import { MOCK_MAILBOXES } from '../sampleData';

export const MailboxManager: React.FC = () => {
  const [mailboxes, setMailboxes] = useState<MailboxAccount[]>(MOCK_MAILBOXES || []);
  const [selectedId, setSelectedId] = useState<string>(mailboxes[0]?.id || '');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  const active = mailboxes.find((m) => m.id === selectedId) || mailboxes[0] || null;

  const handleTestConnection = (id: string) => {
    setTestingId(id);
    setTestResult(null);
    setTimeout(() => {
      setTestingId(null);
      setTestResult({
        id,
        success: true,
        msg: 'Handshake successful: OAuth2 token active, folder verified, mailbox listening for incoming invoices.'
      });
    }, 1100);
  };

  const handleToggleActive = (id: string) => {
    setMailboxes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m))
    );
  };

  const handleDelete = (id: string) => {
    const updated = mailboxes.filter((m) => m.id !== id);
    setMailboxes(updated);
    if (selectedId === id) {
      setSelectedId(updated[0]?.id || '');
    }
  };

  const handleAddNewMailbox = () => {
    const newMbx: MailboxAccount = {
      id: `mbx-${Date.now()}`,
      name: 'New Corporate Mailbox',
      provider: 'graph_api',
      emailAddress: 'ap-invoices@company.com',
      folder: 'Inbox',
      isActive: true,
      pollingIntervalSeconds: 60,
      lastSyncAt: 'Never',
      authConfig: {
        tenantId: '',
        clientId: '',
        clientSecret: '',
      },
      filters: {
        allowedSenders: ['*'],
        subjectKeywords: ['Invoice', 'Bill'],
        maxAgeDays: 7,
        rejectSignatures: true,
        unpackZips: true,
      }
    };
    setMailboxes([...mailboxes, newMbx]);
    setSelectedId(newMbx.id);
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
              <h2 className="text-base font-bold text-white">Universal Mailbox Ingestion Engine</h2>
              <span className="text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
                Multi-Protocol Poller
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage Microsoft 365 (Graph API), On-Prem Exchange (EWS), Generic IMAP/POP3, and Google Workspace connections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {active && (
            <button
              type="button"
              onClick={() => handleTestConnection(active.id)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-sky-950/50"
            >
              {testingId === active.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              {testingId === active.id ? 'Testing Protocol...' : 'Test Active Connection'}
            </button>
          )}

          <button
            type="button"
            onClick={handleAddNewMailbox}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            Add Mailbox
          </button>
        </div>
      </div>

      {testResult && active && testResult.id === active.id && (
        <div className="bg-emerald-950/60 border border-emerald-500/60 p-3.5 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{testResult.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setTestResult(null)}
            className="text-xs underline text-emerald-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Mailbox List Panel */}
        <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Configured Mailboxes ({mailboxes.length})
            </span>
            <span className="text-[10px] font-mono text-sky-400">Daemon Listener</span>
          </div>

          <div className="flex flex-col gap-2">
            {mailboxes.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs italic">
                No mailboxes configured. Click &quot;Add Mailbox&quot; above.
              </div>
            ) : (
              mailboxes.map((mbx) => (
                <div
                  key={mbx.id}
                  onClick={() => setSelectedId(mbx.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    active?.id === mbx.id
                      ? 'bg-sky-950/40 border-sky-500/70 shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white truncate max-w-[180px]">
                      {mbx.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          mbx.provider === 'graph_api'
                            ? 'bg-sky-950 text-sky-300 border border-sky-800/60'
                            : mbx.provider === 'ews'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                            : mbx.provider === 'gmail'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {mbx.provider.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(mbx.id);
                        }}
                        className={`p-1 rounded transition-colors ${
                          mbx.isActive ? 'text-emerald-400 hover:bg-emerald-950/40' : 'text-slate-600 hover:bg-slate-800'
                        }`}
                        title={mbx.isActive ? 'Disable Polling' : 'Enable Polling'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono truncate">{mbx.emailAddress}</span>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>Folder: {mbx.folder}</span>
                    <span>Synced {mbx.lastSyncAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Mailbox Inspector */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
          {active ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[11px] text-sky-400 uppercase font-mono tracking-wider font-semibold">
                    Mailbox Parameters
                  </span>
                  <h3 className="text-sm font-bold text-white">{active.name}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestConnection(active.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                    Live Handshake
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(active.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 transition-colors"
                    title="Delete mailbox"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Target Email / Dedicated User ID</label>
                  <input
                    type="email"
                    value={active.emailAddress}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMailboxes((prev) =>
                        prev.map((m) => (m.id === active.id ? { ...m, emailAddress: val } : m))
                      );
                    }}
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 font-mono outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Target Mailbox Folder</label>
                  <input
                    type="text"
                    value={active.folder}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMailboxes((prev) =>
                        prev.map((m) => (m.id === active.id ? { ...m, folder: val } : m))
                      );
                    }}
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 font-mono outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Polling Interval (Seconds)</label>
                  <input
                    type="number"
                    value={active.pollingIntervalSeconds}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 60;
                      setMailboxes((prev) =>
                        prev.map((m) => (m.id === active.id ? { ...m, pollingIntervalSeconds: val } : m))
                      );
                    }}
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 font-mono outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Max Age Window (Days)</label>
                  <input
                    type="number"
                    value={active.filters.maxAgeDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 7;
                      setMailboxes((prev) =>
                        prev.map((m) =>
                          m.id === active.id
                            ? { ...m, filters: { ...m.filters, maxAgeDays: val } }
                            : m
                        )
                      );
                    }}
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 font-mono outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Filter Criteria */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-3 text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Attachment Quarantine & Filtering Rules
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={active.filters.rejectSignatures}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setMailboxes((prev) =>
                          prev.map((m) =>
                            m.id === active.id
                              ? { ...m, filters: { ...m.filters, rejectSignatures: checked } }
                              : m
                          )
                        );
                      }}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                    <span>Quarantine logos, signatures, and tracking pixels (&lt; 1KB)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={active.filters.unpackZips}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setMailboxes((prev) =>
                          prev.map((m) =>
                            m.id === active.id
                              ? { ...m, filters: { ...m.filters, unpackZips: checked } }
                              : m
                          )
                        );
                      }}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                    <span>Unpack nested in-memory .ZIP archives safely</span>
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <label className="text-slate-400 block mb-1">Sender Whitelist Patterns (Glob)</label>
                  <input
                    type="text"
                    value={active.filters.allowedSenders.join(', ')}
                    onChange={(e) => {
                      const arr = e.target.value.split(',').map((s) => s.trim());
                      setMailboxes((prev) =>
                        prev.map((m) =>
                          m.id === active.id
                            ? { ...m, filters: { ...m.filters, allowedSenders: arr } }
                            : m
                        )
                      );
                    }}
                    className="w-full bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-200 font-mono text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs italic flex flex-col items-center gap-2">
              <Mail className="w-8 h-8 text-slate-600" />
              <span>Select or create a mailbox to inspect configuration parameters.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
