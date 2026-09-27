import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { FieldWithConfidence } from '../types';

interface ConfidenceBadgeProps {
  field: FieldWithConfidence<any>;
  onVerify?: () => void;
  compact?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ field, onVerify, compact = false }) => {
  if (field.isManuallyVerified) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-1.5 py-0.5 rounded">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        {!compact && 'Verified'}
      </span>
    );
  }

  if (field.isUnsure) {
    return (
      <div className="relative group inline-block">
        <button
          type="button"
          onClick={onVerify}
          title={field.reasonUnsure || 'Uncertain OCR extraction. Click to verify.'}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-500/60 px-2 py-0.5 rounded hover:bg-amber-900 transition-colors cursor-pointer shadow-sm shadow-amber-950/40"
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Needs Review ({field.confidenceScore}%)</span>
        </button>

        {field.reasonUnsure && (
          <div className="absolute z-50 left-0 bottom-full mb-1.5 hidden group-hover:flex flex-col w-60 p-2 text-xs bg-slate-900 text-slate-200 border border-amber-500/50 rounded-lg shadow-xl pointer-events-none">
            <span className="font-semibold text-amber-300 flex items-center gap-1 mb-0.5">
              <AlertCircle className="w-3.5 h-3.5" /> AI Uncertainty Reason:
            </span>
            <span className="text-slate-300 leading-relaxed">{field.reasonUnsure}</span>
            <span className="text-[10px] text-amber-400/80 mt-1 italic">Click badge to mark as verified</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <span className="text-[10px] text-slate-400 font-mono">
      {field.confidenceScore}%
    </span>
  );
};
