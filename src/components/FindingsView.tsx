import React, { useState, useMemo } from 'react';
import {
  SecurityFinding,
  SeverityLevel,
  SecurityCategory,
} from '../types/security';
import {
  Search,
  Filter,
  AlertOctagon,
  AlertTriangle,
  Info,
  Key,
  Database,
  Network,
  Lock,
  FileText,
  ChevronRight,
  Code2,
  Terminal,
  Sparkles,
  Layers,
  Table as TableIcon
} from 'lucide-react';

interface FindingsViewProps {
  findings: SecurityFinding[];
  onSelectFinding: (finding: SecurityFinding) => void;
}

export const FindingsView: React.FC<FindingsViewProps> = ({
  findings,
  onSelectFinding,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  const categories: SecurityCategory[] = ['IAM', 'STORAGE', 'NETWORK', 'ENCRYPTION', 'LOGGING'];
  const severities: SeverityLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchSeverity = selectedSeverity === 'ALL' || f.severity === selectedSeverity;
      const matchCategory = selectedCategory === 'ALL' || f.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.evidence.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.impact.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSeverity && matchCategory && matchSearch;
    });
  }, [findings, selectedSeverity, selectedCategory, searchQuery]);

  const criticalTotal = findings.filter(f => f.severity === 'CRITICAL').length;
  const highTotal = findings.filter(f => f.severity === 'HIGH').length;
  const mediumTotal = findings.filter(f => f.severity === 'MEDIUM').length;
  const lowTotal = findings.filter(f => f.severity === 'LOW').length;

  return (
    <div className="space-y-6">
      {/* Header & Quick Filter Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security Findings</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rule-based detections prioritizing misconfigurations and unauthorized public exposure.
          </p>
        </div>

        {/* Severity counts pill filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedSeverity('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              selectedSeverity === 'ALL'
                ? 'bg-slate-700 text-white font-bold'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({findings.length})
          </button>
          <button
            onClick={() => setSelectedSeverity('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
              selectedSeverity === 'CRITICAL'
                ? 'bg-red-500/30 text-red-200 border-red-500/50 font-bold'
                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
            }`}
          >
            Critical ({criticalTotal})
          </button>
          <button
            onClick={() => setSelectedSeverity('HIGH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
              selectedSeverity === 'HIGH'
                ? 'bg-orange-500/30 text-orange-200 border-orange-500/50 font-bold'
                : 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
            }`}
          >
            High ({highTotal})
          </button>
          <button
            onClick={() => setSelectedSeverity('MEDIUM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
              selectedSeverity === 'MEDIUM'
                ? 'bg-yellow-500/30 text-yellow-200 border-yellow-500/50 font-bold'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20'
            }`}
          >
            Medium ({mediumTotal})
          </button>
          <button
            onClick={() => setSelectedSeverity('LOW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
              selectedSeverity === 'LOW'
                ? 'bg-blue-500/30 text-blue-200 border-blue-500/50 font-bold'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
            }`}
          >
            Low ({lowTotal})
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings, resources, or evidence..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Category selector & View toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Card View"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Results View */}
      {filteredFindings.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <Info className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-white">No Findings Match Your Filters</h4>
          <p className="text-xs text-slate-400 mt-1">Try clearing search terms or selecting another severity category.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Severity</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Title & Evidence</th>
                  <th className="py-3.5 px-4 font-semibold">Resource</th>
                  <th className="py-3.5 px-4 font-semibold">Risk Penalty</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredFindings.map((f) => {
                  const severityBadgeClass =
                    f.severity === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : f.severity === 'HIGH'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : f.severity === 'MEDIUM'
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40';

                  return (
                    <tr
                      key={f.id}
                      onClick={() => onSelectFinding(f)}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityBadgeClass}`}>
                          {f.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {f.category}
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {f.title}
                        </div>
                        <div className="text-[11px] font-mono text-amber-400/90 truncate mt-0.5">
                          {f.evidence}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-cyan-300 text-[11px]">
                        <div>{f.resourceName}</div>
                        <div className="text-slate-500 text-[10px]">{f.resourceType}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-red-400 font-bold">
                        -{f.scoreImpact} pts
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                          <span className="text-[11px] font-semibold">Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFindings.map((f) => {
            const severityBadgeClass =
              f.severity === 'CRITICAL'
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : f.severity === 'HIGH'
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                : f.severity === 'MEDIUM'
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/40';

            return (
              <div
                key={f.id}
                onClick={() => onSelectFinding(f)}
                className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-cyan-500/40 p-5 transition-all cursor-pointer flex flex-col justify-between group shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${severityBadgeClass}`}>
                        {f.severity}
                      </span>
                      <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                        {f.category}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-red-400">
                      -{f.scoreImpact} pts
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {f.title}
                  </h3>

                  <div className="mt-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-amber-300 truncate">
                    <code>{f.evidence}</code>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {f.impact}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px] truncate max-w-[200px]">
                    {f.resourceName}
                  </span>
                  <div className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Remediate</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
