import React from 'react';
import { Play, UploadCloud, FileDown, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { ScanResult } from '../types/security';

interface HeaderProps {
  activeTabTitle: string;
  onOpenScanModal: () => void;
  onLoadDemo: () => void;
  isScanning: boolean;
  activeScan: ScanResult | null;
  onGeneratePdf: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTabTitle,
  onOpenScanModal,
  onLoadDemo,
  isScanning,
  activeScan,
  onGeneratePdf,
}) => {
  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: View title & context */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-white tracking-tight">{activeTabTitle}</h1>
        {activeScan && (
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
            <span className="text-slate-400">Target:</span>
            <span className="text-slate-200 font-mono font-medium truncate max-w-xs">{activeScan.name}</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
              {new Date(activeScan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Mode Button */}
        <button
          onClick={onLoadDemo}
          disabled={isScanning}
          title="Load pre-configured multi-cloud sample infrastructure with intentional vulnerabilities"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 transition-all shadow-sm shadow-amber-950/40 disabled:opacity-50 cursor-pointer"
        >
          {isScanning ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
          ) : (
            <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400/40" />
          )}
          <span>Load Demo Configuration</span>
        </button>

        {/* Generate PDF Report Button */}
        {activeScan && (
          <button
            onClick={onGeneratePdf}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Generate PDF Report</span>
          </button>
        )}

        {/* Start Scan Modal Button */}
        <button
          onClick={onOpenScanModal}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 hover:shadow-cyan-600/50 transition-all cursor-pointer disabled:opacity-50"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>New Scan</span>
        </button>
      </div>
    </header>
  );
};
