import React, { useState } from 'react';
import { RiskScoreBreakdown } from '../types/security';
import { Shield, Info, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface SecurityScoreGaugeProps {
  scoreBreakdown: RiskScoreBreakdown;
  score: number;
}

export const SecurityScoreGauge: React.FC<SecurityScoreGaugeProps> = ({
  scoreBreakdown,
  score,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Determine color theme based on score
  let scoreColor = '#10b981'; // green
  let scoreBadgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let ratingText = 'EXCELLENT';

  if (score < 40) {
    scoreColor = '#ef4444'; // red
    scoreBadgeBg = 'bg-red-500/20 text-red-300 border-red-500/40';
    ratingText = 'CRITICAL RISK';
  } else if (score < 60) {
    scoreColor = '#f97316'; // orange
    scoreBadgeBg = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    ratingText = 'HIGH RISK';
  } else if (score < 75) {
    scoreColor = '#eab308'; // yellow
    scoreBadgeBg = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    ratingText = 'FAIR / MODERATE';
  } else if (score < 90) {
    scoreColor = '#06b6d4'; // cyan
    scoreBadgeBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    ratingText = 'GOOD POSTURE';
  }

  // SVG Gauge calculations
  const radius = 70;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  // We'll show a 240 degree arc gauge
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(0, score))) / 100;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-xl shadow-slate-950/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-800/80 text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Security Risk Score</h3>
            <p className="text-xs text-slate-400">Deterministic rule-based posture</p>
          </div>
        </div>

        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${scoreBadgeBg}`}>
          {ratingText}
        </span>
      </div>

      {/* SVG Arc Gauge */}
      <div className="flex flex-col items-center justify-center py-2 relative">
        <div className="relative w-48 h-36 flex items-center justify-center">
          <svg className="w-48 h-48 -rotate-[135deg] transform" viewBox="0 0 180 180">
            {/* Background Track */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
            />
            {/* Animated Value Arc */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke={scoreColor}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Central Score Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
            <div className="flex items-baseline">
              <span className="text-4xl font-extrabold tracking-tight font-mono text-white">{score}</span>
              <span className="text-slate-400 text-sm font-mono ml-1">/100</span>
            </div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mt-0.5">
              Posture Index
            </span>
          </div>
        </div>

        {/* Deduction Quick Summary */}
        <div className="w-full grid grid-cols-4 gap-2 mt-2 pt-3 border-t border-slate-800/80 text-center">
          <div>
            <div className="text-[11px] font-mono font-bold text-red-400">-{scoreBreakdown?.criticalDeduction || 0}</div>
            <div className="text-[10px] text-slate-400">Critical</div>
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold text-amber-400">-{scoreBreakdown?.highDeduction || 0}</div>
            <div className="text-[10px] text-slate-400">High</div>
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold text-yellow-400">-{scoreBreakdown?.mediumDeduction || 0}</div>
            <div className="text-[10px] text-slate-400">Medium</div>
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold text-blue-400">-{scoreBreakdown?.lowDeduction || 0}</div>
            <div className="text-[10px] text-slate-400">Low</div>
          </div>
        </div>
      </div>

      {/* Accordion: Why did the score decrease? */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white font-medium py-1 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Why did the score decrease?</span>
          </span>
          {showDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showDetails && (
          <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
            {scoreBreakdown?.deductions && scoreBreakdown.deductions.length > 0 ? (
              scoreBreakdown.deductions.map((d, i) => (
                <div key={i} className="flex items-start justify-between p-2 rounded bg-slate-950/70 border border-slate-800/80">
                  <div className="pr-2">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded mr-1.5 ${
                      d.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
                      d.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300' :
                      d.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {d.severity}
                    </span>
                    <span className="text-slate-200">{d.reason}</span>
                  </div>
                  <span className="font-mono text-red-400 shrink-0 font-semibold">-{d.points} pts</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-xs italic">No score deductions! Zero vulnerabilities detected.</p>
            )}
          </div>
        )}

        {/* Disclaimer Notice */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-400 leading-tight">
            Relative Rule-Based Indicator: Relative metric prioritizing misconfigurations. Does not imply absolute perimeter immunity.
          </p>
        </div>
      </div>
    </div>
  );
};
