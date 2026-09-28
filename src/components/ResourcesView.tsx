import React, { useState, useMemo } from 'react';
import { CloudResource } from '../types/security';
import {
  Server,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  Code2,
  X,
  ExternalLink,
  Layers
} from 'lucide-react';

interface ResourcesViewProps {
  resources: CloudResource[];
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ resources }) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectingResource, setInspectingResource] = useState<CloudResource | null>(null);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchProvider = selectedProvider === 'ALL' || r.provider === selectedProvider;
      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'SECURE' && r.isSecure) ||
        (selectedStatus === 'VULNERABLE' && !r.isSecure);
      const matchSearch =
        !searchQuery.trim() ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.service.toLowerCase().includes(searchQuery.toLowerCase());
      return matchProvider && matchStatus && matchSearch;
    });
  }, [resources, selectedProvider, selectedStatus, searchQuery]);

  const secureCount = resources.filter(r => r.isSecure).length;
  const vulnerableCount = resources.length - secureCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Discovered Cloud Assets</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inventory of normalized multi-cloud components discovered from parsed configuration.
          </p>
        </div>

        {/* Status Counters */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Total: </span>
            <span className="text-white font-bold">{resources.length}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono text-emerald-300">
            <span>Secure: </span>
            <span className="font-bold">{secureCount}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-mono text-red-300">
            <span>Vulnerable: </span>
            <span className="font-bold">{vulnerableCount}</span>
          </div>
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
            placeholder="Search asset name, type, service..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-3">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Providers</option>
            <option value="AWS">AWS</option>
            <option value="Azure">Azure</option>
            <option value="GCP">GCP</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Postures</option>
            <option value="SECURE">Hardened (Secure)</option>
            <option value="VULNERABLE">With Findings (Vulnerable)</option>
          </select>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Provider</th>
                <th className="py-3.5 px-4 font-semibold">Asset Identifier</th>
                <th className="py-3.5 px-4 font-semibold">Resource Type</th>
                <th className="py-3.5 px-4 font-semibold">Service</th>
                <th className="py-3.5 px-4 font-semibold">Violations</th>
                <th className="py-3.5 px-4 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredResources.map((res) => (
                <tr
                  key={res.id}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono">
                    {res.isSecure ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Hardened
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        Vulnerable
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      res.provider === 'AWS' ? 'bg-orange-950/60 text-orange-400 border border-orange-800/40' :
                      res.provider === 'Azure' ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40' :
                      res.provider === 'GCP' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {res.provider}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-cyan-300 font-medium">
                    {res.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                    {res.type}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {res.service}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {(res.findingsCount || 0) > 0 ? (
                      <span className="text-red-400 font-semibold">
                        {res.findingsCount} issue{res.findingsCount! > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[11px]">Zero issues</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setInspectingResource(res)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    >
                      Raw Config
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Raw Config Modal */}
      {inspectingResource && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white font-mono">{inspectingResource.name}</span>
              </div>
              <button
                onClick={() => setInspectingResource(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto bg-slate-950">
              <pre className="text-xs font-mono text-cyan-200 whitespace-pre-wrap">
                {JSON.stringify(inspectingResource.configuration, null, 2)}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingResource(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
