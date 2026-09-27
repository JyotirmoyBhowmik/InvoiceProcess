import React from 'react';
import { FieldWithConfidence } from '../types';
import { ConfidenceBadge } from './ConfidenceBadge';

interface EditableFieldProps {
  label: string;
  field: FieldWithConfidence<string | number>;
  onChange: (newValue: string | number) => void;
  onVerify: () => void;
  type?: 'text' | 'number' | 'date';
  prefix?: string;
  className?: string;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  label,
  field,
  onChange,
  onVerify,
  type = 'text',
  prefix,
  className = '',
}) => {
  const isUnsure = field.isUnsure && !field.isManuallyVerified;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <label className="font-medium text-slate-300">{label}</label>
        <ConfidenceBadge field={field} onVerify={onVerify} />
      </div>

      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono select-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={field.value}
          onChange={(e) => {
            const val = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
            onChange(val);
          }}
          className={`w-full rounded-lg px-3 py-2 text-sm transition-all outline-none font-medium ${
            prefix ? 'pl-8' : ''
          } ${
            isUnsure
              ? 'bg-amber-950/20 border-2 border-amber-500/80 text-amber-100 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20'
              : 'bg-slate-800/80 border border-slate-700 text-slate-100 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
          }`}
        />
      </div>

      {isUnsure && field.reasonUnsure && (
        <p className="text-[11px] text-amber-400/90 leading-tight flex items-start gap-1">
          <span className="font-semibold select-none">Note:</span> {field.reasonUnsure}
        </p>
      )}
    </div>
  );
};
