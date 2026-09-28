import React from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Info,
  Server,
  Key,
  Database,
  Network,
  Lock,
  FileText,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { DashboardStats, SecurityFinding, SecurityCategory, ScanResult } from '../types/security';
import { SecurityScoreGauge } from './SecurityScoreGauge';

interface OverviewViewProps {
  stats: DashboardStats;
  onSelectFinding: (finding: SecurityFinding) => void;
  onNavigateToTab: (tab: any) => void;
  onGenerateReport: () => void;
  onOpenScanModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  onSelectFinding,
  onNavigateToTab,
  onGenerateReport,
  onOpenScanModal,
}) => {
  const latestScan = stats.latestScan;

  const categoryIcons: Record<SecurityCategory, React.ComponentType<{ className?: string }>> = {
    IAM: Key,
    STORAGE: Database,
    NETWORK: Network,
    ENCRYPTION: Lock,
    LOGGING: FileText,
  };

  const categories: SecurityCategory[] = ['IAM', 'STORAGE', 'NETWORK', 'ENCRYPTION', 'LOGGING'];

  return (
    <div className="space-y-6">
      {/* Top Banner if no scan or latest scan active */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-cyan-400">
              Posture Status
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">
              Evaluated against deterministic CIS Benchmarks
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {latestScan?.name || "Cloud Infrastructure Security Posture"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {latestScan?.summary || "Automated rule-based misconfiguration scanning across Storage, Network, IAM, Encryption, and Audit Logging."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <button
            onClick={onGenerateReport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit PDF Report</span>
          </button>
          <button
            onClick={onOpenScanModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <span>Scan New Config</span>
          </button>
        </div>
      </div>

      {/* Row 1: Score Gauge & Key Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Security Score Gauge (4 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          {latestScan ? (
            <SecurityScoreGauge
              score={stats.securityScore}
              scoreBreakdown={latestScan.scoreBreakdown}
            />
          ) : (
            <div className="h-full bg-slate-900 rounded-2xl border border-slate-800 p-8 flex flex-col items-center justify-center text-center">
              <ShieldCheck className="w-12 h-12 text-slate-600 mb-3" />
              <div className="font-semibold text-white">No Scan Executed Yet</div>
              <p className="text-xs text-slate-400 mt-1">Load demo data or upload a configuration JSON to compute security risk score.</p>
            </div>
          )}
        </div>

        {/* Right: Metric Cards Grid (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Card 1: Resources Scanned */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Assets Scanned</span>
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Server className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-white">{stats.resourcesScanned}</div>
              <span className="text-[11px] text-slate-400">Total discovered</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>{stats.secureResources} Hardened Secure</span>
            </div>
          </div>

          {/* Card 2: Critical Findings */}
          <div className="bg-slate-900/90 rounded-2xl border border-red-500/20 p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-300">Critical Findings</span>
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-red-400">{stats.criticalFindings}</div>
              <span className="text-[11px] text-slate-400">Immediate breach risk</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-red-400/90 font-mono">
              Action Required Now
            </div>
          </div>

          {/* Card 3: High Findings */}
          <div className="bg-slate-900/90 rounded-2xl border border-orange-500/20 p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-300">High Findings</span>
              <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-orange-400">{stats.highFindings}</div>
              <span className="text-[11px] text-slate-400">Significant exposure</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-orange-400/90 font-mono">
              High Priority Fix
            </div>
          </div>

          {/* Card 4: Medium Findings */}
          <div className="bg-slate-900/90 rounded-2xl border border-yellow-500/20 p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-yellow-300">Medium Findings</span>
              <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-yellow-400">{stats.mediumFindings}</div>
              <span className="text-[11px] text-slate-400">Weak configuration</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-yellow-400/90 font-mono">
              Schedule Remediation
            </div>
          </div>

          {/* Card 5: Low Findings */}
          <div className="bg-slate-900/90 rounded-2xl border border-blue-500/20 p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-300">Low Findings</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Info className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-blue-400">{stats.lowFindings}</div>
              <span className="text-[11px] text-slate-400">Best practice deviation</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-blue-400/90 font-mono">
              Optimization
            </div>
          </div>

          {/* Card 6: Secure Hardened Assets */}
          <div className="bg-slate-900/90 rounded-2xl border border-emerald-500/20 p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300">Secure Assets</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-emerald-400">{stats.secureResources}</div>
              <span className="text-[11px] text-slate-400">Compliant configurations</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400/90 font-mono">
              Verified Compliant
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Category Breakdown Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Security Category Assessment
          </h3>
          <span className="text-xs text-slate-400 font-mono">5 Baseline Categories</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat];
            const data = stats.categoryDistribution[cat] || { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
            const hasCritical = data.critical > 0;
            const hasHigh = data.high > 0;

            return (
              <div
                key={cat}
                onClick={() => onNavigateToTab('findings')}
                className="bg-slate-900/90 rounded-xl border border-slate-800 hover:border-cyan-500/40 p-4 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">{cat}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    hasCritical ? 'bg-red-500/20 text-red-300' :
                    hasHigh ? 'bg-amber-500/20 text-amber-300' :
                    data.total > 0 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {data.total}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                      Critical:
                    </span>
                    <span className={data.critical > 0 ? 'text-red-400 font-bold' : 'text-slate-500'}>{data.critical}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                      High:
                    </span>
                    <span className={data.high > 0 ? 'text-orange-400 font-bold' : 'text-slate-500'}>{data.high}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                      Medium:
                    </span>
                    <span className={data.medium > 0 ? 'text-yellow-400 font-bold' : 'text-slate-500'}>{data.medium}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Recent Findings Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Priority Security Findings
            </h3>
            <p className="text-xs text-slate-400">Click any finding to inspect evidence, impact, and AI-assisted remediation.</p>
          </div>
          <button
            onClick={() => onNavigateToTab('findings')}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
          >
            <span>View All ({latestScan?.findings.length || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <th className="pb-3 font-semibold">Severity</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Finding Description</th>
                <th className="pb-3 font-semibold">Affected Resource</th>
                <th className="pb-3 font-semibold">Score Penalty</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {stats.recentFindings.slice(0, 6).map((finding) => {
                const badgeColor =
                  finding.severity === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                    : finding.severity === 'HIGH'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    : finding.severity === 'MEDIUM'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30';

                return (
                  <tr
                    key={finding.id}
                    onClick={() => onSelectFinding(finding)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 pr-3 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                        {finding.severity}
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-mono text-slate-300">
                      {finding.category}
                    </td>
                    <td className="py-3 pr-3 font-medium text-slate-100 max-w-sm">
                      <div className="truncate group-hover:text-cyan-300 transition-colors">{finding.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{finding.evidence}</div>
                    </td>
                    <td className="py-3 pr-3 font-mono text-cyan-300 text-[11px] truncate max-w-xs">
                      {finding.resourceName}
                    </td>
                    <td className="py-3 pr-3 font-mono text-red-400 font-semibold">
                      -{finding.scoreImpact} pts
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold underline underline-offset-2">
                        Inspect
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
