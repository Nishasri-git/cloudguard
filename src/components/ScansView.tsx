import React from 'react';
import { ScanResult } from '../types/security';
import {
  Calendar,
  CheckCircle2,
  FileDown,
  ArrowRight,
  ShieldAlert,
  SearchCode,
  UploadCloud,
  Play
} from 'lucide-react';

interface ScansViewProps {
  scans: ScanResult[];
  activeScanId: string | null;
  onSelectScan: (scan: ScanResult) => void;
  onOpenScanModal: () => void;
  onLoadDemo: () => void;
  onGeneratePdfForScan: (scan: ScanResult) => void;
}

export const ScansView: React.FC<ScansViewProps> = ({
  scans,
  activeScanId,
  onSelectScan,
  onOpenScanModal,
  onLoadDemo,
  onGeneratePdfForScan,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Assessment History</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit logs of all executed cloud security scans, calculated scores, and timestamped postures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLoadDemo}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-amber-400/40" />
            <span>Load Demo Run</span>
          </button>
          <button
            onClick={onOpenScanModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Scans List */}
      <div className="space-y-3.5">
        {scans.map((scan) => {
          const isActive = scan.id === activeScanId;
          const score = scan.score;
          const scoreColor =
            score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
          const scoreBadge =
            score >= 80 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' :
            score >= 60 ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' :
            'bg-red-500/20 border-red-500/40 text-red-300';

          return (
            <div
              key={scan.id}
              className={`p-5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-slate-900 border-cyan-500/40 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Scan Title & Meta */}
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl border font-mono font-extrabold text-lg flex flex-col items-center justify-center min-w-[70px] ${scoreBadge}`}>
                    <span>{score}</span>
                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">/100</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white tracking-tight">{scan.name}</h3>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          ACTIVE VIEW
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(scan.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>Assets: {scan.totalResources}</span>
                      <span className="text-emerald-400">Hardened: {scan.secureResources}</span>
                      <span className="text-red-400 font-semibold">Critical: {scan.criticalFindings}</span>
                      <span className="text-amber-400">High: {scan.highFindings}</span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-1 font-sans">
                      {scan.summary}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => onGeneratePdfForScan(scan)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() => onSelectScan(scan)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    }`}
                  >
                    <span>{isActive ? 'Current View' : 'Load Dashboard'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
