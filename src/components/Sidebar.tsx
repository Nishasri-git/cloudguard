import React from 'react';
import {
  ShieldAlert,
  LayoutDashboard,
  SearchCode,
  AlertTriangle,
  Server,
  FileText,
  Compass,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export type NavTab = 'overview' | 'scans' | 'findings' | 'resources' | 'reports' | 'futurescope';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  criticalCount: number;
  totalFindings: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  criticalCount,
  totalFindings,
}) => {
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'scans', label: 'Scans History', icon: SearchCode },
    {
      id: 'findings',
      label: 'Security Findings',
      icon: AlertTriangle,
      badge: totalFindings > 0 ? totalFindings : undefined,
      badgeColor: criticalCount > 0 ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    { id: 'resources', label: 'Cloud Assets', icon: Server },
    { id: 'reports', label: 'Audit Reports', icon: FileText },
    { id: 'futurescope', label: 'Future Scope', icon: Compass, badge: 'PLANNED', badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' },
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-wider text-base font-mono">CLOUDGUARD</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Cloud Security Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Core Assessment
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Engine Status Card */}
      <div className="p-3 m-3 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-200">Rule Engine</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Deterministic CIS/NIST baseline scanner. Scoring and severity determined strictly by rules.
        </p>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Gemini AI Logic</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Explanations</span>
        </div>
      </div>

      {/* User / Organization Profile */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-cyan-900/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold font-mono text-xs">
            AV
          </div>
          <div className="overflow-hidden">
            <div className="font-medium text-slate-200 truncate">Alex Vance</div>
            <div className="text-[10px] text-slate-400 truncate">Lead Security Architect</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
