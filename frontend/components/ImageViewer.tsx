import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, FileText, CheckCircle2, FileType, Download } from 'lucide-react';

interface ImageViewerProps {
  imageUrl: string;
  fileName: string;
  unsureCount: number;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, fileName, unsureCount }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const isPdf = fileName.toLowerCase().endsWith('.pdf') || imageUrl.startsWith('data:application/pdf');

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleDownload = () => {
    try {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn('Download error:', e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2 truncate">
          {isPdf ? (
            <FileType className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
          )}
          <span className="text-xs font-semibold text-slate-200 truncate max-w-[160px] sm:max-w-[200px]" title={fileName}>
            {fileName}
          </span>
          {isPdf && (
            <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-700/60 font-semibold">
              PDF Document
            </span>
          )}
          {unsureCount > 0 ? (
            <span className="shrink-0 text-[10px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded-full">
              {unsureCount} Unsure
            </span>
          ) : (
            <span className="shrink-0 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-600/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> Reconciled
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-slate-400">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Zoom Out (-25%)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1.5 text-slate-300 select-none">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Zoom In (+25%)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="h-3 w-px bg-slate-800 mx-0.5" />
          <button
            type="button"
            onClick={handleRotate}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Rotate 90 deg"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Reset View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Download document file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Document View Canvas */}
      <div className="relative flex-1 bg-slate-950/90 overflow-auto p-4 flex items-center justify-center min-h-[420px] select-none">
        {isPdf ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-2">
            <object
              data={imageUrl}
              type="application/pdf"
              className="w-full h-full min-h-[460px] rounded border border-slate-800 bg-slate-900"
            >
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-3">
                <FileType className="w-12 h-12 text-rose-400" />
                <p className="text-sm font-semibold text-white">PDF Invoice Document Ready</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Layout parsed and mapped into editable table ledger.
                </p>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  Download / View Native PDF
                </button>
              </div>
            </object>
          </div>
        ) : (
          <div
            className="transition-transform duration-200 ease-out origin-center flex items-center justify-center max-w-full"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={imageUrl}
              alt="Invoice preview"
              className="max-h-[680px] w-auto max-w-full object-contain rounded shadow-lg border border-slate-800/80 bg-white"
            />
          </div>
        )}
      </div>

      <div className="px-3 py-2 bg-slate-950/50 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Verified Scan Artifact</span>
        <span>Reconciliation synchronized with ledger</span>
      </div>
    </div>
  );
};
