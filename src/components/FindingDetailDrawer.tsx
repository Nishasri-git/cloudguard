import React, { useState } from 'react';
import { SecurityFinding } from '../types/security';
import {
  X,
  ShieldAlert,
  Terminal,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Code2,
  ExternalLink,
  Loader2,
  AlertOctagon,
  FileCode
} from 'lucide-react';
import { requestAiExplanation } from '../services/api';

interface FindingDetailDrawerProps {
  finding: SecurityFinding | null;
  onClose: () => void;
  onFindingUpdated?: (updated: SecurityFinding) => void;
}

export const FindingDetailDrawer: React.FC<FindingDetailDrawerProps> = ({
  finding,
  onClose,
  onFindingUpdated,
}) => {
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedTf, setCopiedTf] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiData, setAiData] = useState<{
    explanation?: string;
    whyItMatters?: string;
    remediationGuidance?: string;
    isAiGenerated?: boolean;
  } | null>(null);

  // Reset aiData whenever the selected finding changes so a previous finding's AI explanation is never displayed
  React.useEffect(() => {
    setAiData(null);
  }, [finding?.id]);

  if (!finding) return null;

  const copyToClipboard = (text: string, type: 'cli' | 'tf') => {
    navigator.clipboard.writeText(text);
    if (type === 'cli') {
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    } else {
      setCopiedTf(true);
      setTimeout(() => setCopiedTf(false), 2000);
    }
  };

  const handleEnhanceAi = async () => {
    if (!finding) return;
    setLoadingAi(true);
    try {
      const res = await requestAiExplanation(finding.id);
      setAiData(res);
      if (onFindingUpdated) {
        onFindingUpdated({
          ...finding,
          riskExplanation: res.explanation,
          recommendedAction: res.remediationGuidance,
          aiEnhanced: true,
        });
      }
    } catch (err) {
      console.error('Failed to trigger AI explanation:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const severityBadgeClass =
    finding.severity === 'CRITICAL'
      ? 'bg-red-500/20 text-red-300 border-red-500/40'
      : finding.severity === 'HIGH'
      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
      : finding.severity === 'MEDIUM'
      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
      : 'bg-blue-500/20 text-blue-300 border-blue-500/40';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${severityBadgeClass}`}>
                {finding.severity}
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {finding.category}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Impact: -{finding.scoreImpact} pts
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">{finding.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span>Target Asset:</span>
              <span className="font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                {finding.resourceName}
              </span>
              <span className="text-slate-400 font-mono">({finding.resourceType})</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Evidence */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              Evidence / Configuration Trace
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto">
              <code>{finding.evidence}</code>
            </div>
          </div>

          {/* Section 2: Security Impact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              Potential Threat Impact
            </h4>
            <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 text-xs text-red-200 leading-relaxed">
              {finding.impact}
            </div>
          </div>

          {/* Section 3: Gemini AI Explanation Card */}
          <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-950 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  AI Context & Threat Explanation
                </span>
              </div>
              <button
                onClick={handleEnhanceAi}
                disabled={loadingAi}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{finding.aiEnhanced || aiData ? 'Re-analyze' : 'Analyze with Gemini'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-normal space-y-2">
              {aiData ? (
                <>
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-cyan-500/20">
                    <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1">
                      {aiData.isAiGenerated ? 'Gemini 3.8 Intelligence Deep-Dive' : 'Deterministic Cybersecurity Reference'}
                    </div>
                    <p className="text-slate-200">{aiData.explanation}</p>
                  </div>
                  {aiData.whyItMatters && (
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">Attacker Perspective: </span>
                      {aiData.whyItMatters}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-300 leading-relaxed">{finding.riskExplanation}</p>
              )}
            </div>
          </div>

          {/* Section 4: Recommended Action */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Recommended Remediation Action
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              {aiData?.remediationGuidance || finding.recommendedAction}
            </p>
          </div>

          {/* Section 5: Step-by-step checklist */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Remediation Steps Checklist
            </h4>
            <div className="space-y-2">
              {finding.remediationSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800/60 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: CLI Command Fix (if available) */}
          {finding.cliCommand && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  CLI Remediation Command
                </h4>
                <button
                  onClick={() => copyToClipboard(finding.cliCommand!, 'cli')}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer font-mono"
                >
                  {copiedCli ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCli ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto flex items-center justify-between">
                <code>{finding.cliCommand}</code>
              </div>
            </div>
          )}

          {/* Section 7: Terraform Fix (if available) */}
          {finding.terraformFix && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-purple-400" />
                  Terraform / IaC Hardening Snippet
                </h4>
                <button
                  onClick={() => copyToClipboard(finding.terraformFix!, 'tf')}
                  className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 cursor-pointer font-mono"
                >
                  {copiedTf ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTf ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-purple-200 overflow-x-auto whitespace-pre">
                <code>{finding.terraformFix}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Rule Engine Deterministic Finding</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
