import React, { useState } from 'react';
import { Mail, FolderArchive, FileText, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Sparkles, Filter } from 'lucide-react';

interface SimulatedEmail {
  id: string;
  sender: string;
  subject: string;
  receivedAt: string;
  attachments: Array<{
    name: string;
    size: string;
    type: 'pdf' | 'image' | 'zip';
    isSignature?: boolean;
    extractedCount?: number;
  }>;
  status: 'pending' | 'processed' | 'exception';
}

const MOCK_INBOX_EMAILS: SimulatedEmail[] = [
  {
    id: 'msg-01',
    sender: 'billing@nexusdynamics.io',
    subject: 'Invoice #INV-2025-0842 - Enterprise Cloud Retainer',
    receivedAt: '10 mins ago',
    attachments: [
      { name: 'Nexus-Dynamics-Cloud-Invoice-0842.pdf', size: '245 KB', type: 'pdf' },
      { name: 'corp_signature_logo.png', size: '14 KB', type: 'image', isSignature: true }
    ],
    status: 'processed'
  },
  {
    id: 'msg-02',
    sender: 'corporate.travel@makemytrip.com',
    subject: 'Monthly E-Tickets & Hotel Bills Bundle [ZIP]',
    receivedAt: '2 hours ago',
    attachments: [
      { name: 'MMT_Invoices_Bundle_Feb.zip', size: '1.8 MB', type: 'zip', extractedCount: 4 }
    ],
    status: 'processed'
  },
  {
    id: 'msg-03',
    sender: 'invoicing@vendorportal.com',
    subject: 'Pharmacy Retainer Bill - Faded Stamp [Needs Audit]',
    receivedAt: '4 hours ago',
    attachments: [
      { name: 'Apollo_Clinic_Inv_9941.pdf', size: '180 KB', type: 'pdf' }
    ],
    status: 'exception'
  }
];

interface InboxBatchViewProps {
  onLoadInvoice: (fileName: string) => void;
}

export const InboxBatchView: React.FC<InboxBatchViewProps> = ({ onLoadInvoice }) => {
  const [emails, setEmails] = useState<SimulatedEmail[]>(MOCK_INBOX_EMAILS);
  const [filterType, setFilterType] = useState<'all' | 'processed' | 'exception'>('all');

  const filtered = emails.filter((e) => (filterType === 'all' ? true : e.status === filterType));

  return (
    <div className="flex flex-col gap-5">
      {/* Overview stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Unread Invoices Ingested</span>
            <span className="text-xl font-bold text-white font-mono">14 Documents</span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">ZIP Archives Unpacked</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">3 Archives (9 Files)</span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
            <FolderArchive className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Logos & Signatures Quarantined</span>
            <span className="text-xl font-bold text-slate-300 font-mono">8 JPEGs Ignored</span>
          </div>
          <div className="p-3 bg-slate-800 text-slate-400 rounded-xl">
            <Filter className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Inbox table list */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Target Mailbox: finance-invoices@company.com</h3>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded font-medium ${
                filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Messages
            </button>
            <button
              type="button"
              onClick={() => setFilterType('processed')}
              className={`px-2.5 py-1 rounded font-medium ${
                filterType === 'processed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Processed
            </button>
            <button
              type="button"
              onClick={() => setFilterType('exception')}
              className={`px-2.5 py-1 rounded font-medium ${
                filterType === 'exception' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Exceptions
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {filtered.map((msg) => (
            <div key={msg.id} className="p-4 hover:bg-slate-900/50 transition-colors flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200 text-xs">{msg.sender}</span>
                  <span className="text-slate-500 text-[11px]">• {msg.receivedAt}</span>
                </div>
                {msg.status === 'processed' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Auto-Reconciled
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600/60 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Review Required
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-white font-medium">{msg.subject}</span>
              </div>

              {/* Attachments Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {msg.attachments.map((att, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${
                      att.isSignature
                        ? 'bg-slate-900/50 text-slate-500 border-slate-800 line-through'
                        : att.type === 'zip'
                        ? 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60'
                        : 'bg-slate-900 text-slate-300 border-slate-700/80'
                    }`}
                  >
                    {att.type === 'zip' ? (
                      <FolderArchive className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{att.name}</span>
                    <span className="text-[10px] text-slate-500">({att.size})</span>
                    {att.extractedCount && (
                      <span className="text-[10px] font-bold text-emerald-400 ml-1">
                        [{att.extractedCount} PDFs unzipped]
                      </span>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => onLoadInvoice(msg.attachments[0].name)}
                  className="ml-auto text-xs font-semibold px-3 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-500/50 flex items-center gap-1 transition-colors"
                >
                  Inspect in Extractor <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
