import React from 'react';
import { SecurityReport, ScanResult } from '../types/security';
import {
  FileText,
  FileDown,
  Calendar,
  Shield,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Download
} from 'lucide-react';

interface ReportsViewProps {
  reports: SecurityReport[];
  activeScan: ScanResult | null;
  onGenerateReport: () => void;
  onDownloadReport: (scanId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  activeScan,
  onGenerateReport,
  onDownloadReport,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Audit Reports</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Export comprehensive security assessment documents including evidence traces, impacts, and remediation checklists.
          </p>
        </div>

        {activeScan && (
          <button
            onClick={onGenerateReport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Generate New PDF Report</span>
          </button>
        )}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep) => {
          const scoreBadge =
            rep.score >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
            rep.score >= 60 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
            'bg-red-500/20 text-red-300 border-red-500/30';

          return (
            <div
              key={rep.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 p-5 flex flex-col justify-between shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      PDF
                    </span>
                  </div>

                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${scoreBadge}`}>
                    {rep.score}/100 Score
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white tracking-tight">{rep.title}</h3>

                <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {new Date(rep.generatedAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span>Assets: {rep.totalResources}</span>
                  <span>•</span>
                  <span>Findings: {rep.findingsCount}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-red-400">
                    <span className="text-slate-400">Critical: </span>
                    <span className="font-bold">{rep.criticalCount}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-orange-400">
                    <span className="text-slate-400">High: </span>
                    <span className="font-bold">{rep.highCount}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">ID: {rep.id}</span>
                <button
                  onClick={() => onDownloadReport(rep.scanId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Report</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
