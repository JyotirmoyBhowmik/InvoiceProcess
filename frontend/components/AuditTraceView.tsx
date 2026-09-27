import React, { useState } from 'react';
import { Terminal, Search, CheckCircle2, AlertTriangle, ArrowRight, Clock, Cpu, FileText } from 'lucide-react';
import { AuditTraceRecord } from '../types';
import { MOCK_AUDIT_LOGS } from '../sampleData';

export const AuditTraceView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs] = useState<AuditTraceRecord[]>(MOCK_AUDIT_LOGS || []);
  const [selectedTrace, setSelectedTrace] = useState<AuditTraceRecord | null>(logs[0] || null);

  const filteredLogs = logs.filter(
    (l) =>
      l.traceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Distributed Trace & Audit Log Viewer</h2>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                UUID4 Tracing
              </span>
            </div>
            <p className="text-xs text-slate-400">
              End-to-end telemetry tracking: Email Polled &rarr; Layout OCR &rarr; Token Billing &rarr; Math Audit &rarr; ERP File Dispatched.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Trace_ID, Vendor, Invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Trace List */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase font-mono">
              Transaction Traces ({filteredLogs.length})
            </span>
            <span className="text-[10px] text-slate-500 font-mono">structlog Json</span>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[580px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs italic">
                No trace records found. Process an invoice to view telemetry.
              </div>
            ) : (
              filteredLogs.map((item) => (
                <div
                  key={item.traceId}
                  onClick={() => setSelectedTrace(item)}
                  className={`p-3.5 transition-colors cursor-pointer flex flex-col gap-1.5 ${
                    selectedTrace?.traceId === item.traceId
                      ? 'bg-slate-850 border-l-2 border-emerald-500'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-white">{item.traceId}</span>
                    {item.status === 'VALID' ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                        VALID
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/60">
                        FLAGGED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                    <span>{item.vendorCode} • #{item.invoiceNumber}</span>
                    <span className="font-mono font-bold text-white">
                      {item.currency} {item.totalAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>{item.timestamp}</span>
                    <span>{item.durationMs}ms • {item.tokensUsed} tokens</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Trace Drilldown Inspector */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          {selectedTrace ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[11px] text-emerald-400 uppercase font-mono tracking-wider font-semibold">
                    Trace Telemetry Inspector
                  </span>
                  <h3 className="text-sm font-bold text-white font-mono">{selectedTrace.traceId}</h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Tokens: {selectedTrace.tokensUsed}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Latency: {selectedTrace.durationMs}ms
                  </span>
                </div>
              </div>

              {/* Timeline of Pipeline Steps */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Step Execution Sequence
                </span>

                <div className="flex flex-col gap-2 font-mono text-xs">
                  {selectedTrace.steps.map((st, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              st.status === 'success'
                                ? 'bg-emerald-400'
                                : st.status === 'warning'
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                            }`}
                          />
                          <span className="font-bold text-white">{st.name}</span>
                        </div>
                        <span className="text-slate-500">{st.timestamp}</span>
                      </div>
                      <p className="text-slate-300 font-sans text-xs pl-4">{st.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs italic">
              Select a trace from the left panel to inspect step telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
