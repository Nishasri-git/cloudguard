import React from 'react';
import {
  Compass,
  Radio,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  Cloud,
  Layers,
  FileCheck,
  Bot
} from 'lucide-react';

export const FutureScopeView: React.FC = () => {
  const roadmapItems = [
    {
      title: "Live AWS Cloud Connector",
      provider: "AWS",
      icon: Cloud,
      status: "PLANNED",
      description: "Direct read-only IAM Cross-Account Role integration using STS assume-role to discover live S3, EC2, IAM, and RDS configurations dynamically.",
      milestone: "Q4 Roadmap",
      tags: ["STS AssumeRole", "AWS Config API", "Read-Only Scanner"]
    },
    {
      title: "Live Azure Cloud Connector",
      provider: "Azure",
      icon: Cloud,
      status: "PLANNED",
      description: "Microsoft Entra App Registration Service Principal integration for live scanning of Azure Resource Graph, Storage Accounts, and NSGs.",
      milestone: "Q4 Roadmap",
      tags: ["Entra ID", "Resource Graph API", "Reader Role"]
    },
    {
      title: "Live GCP Cloud Connector",
      provider: "GCP",
      icon: Cloud,
      status: "PLANNED",
      description: "Workload Identity Federation connector communicating with Google Cloud Asset Inventory API for multi-project tenant discovery.",
      milestone: "Q1 Roadmap",
      tags: ["Workload Identity", "Cloud Asset Inventory", "GCP Org"]
    },
    {
      title: "Continuous Monitoring & Drift Daemon",
      provider: "Platform",
      icon: Radio,
      status: "PLANNED",
      description: "Hourly and event-driven posture polling with Webhook alerts (Slack, PagerDuty, Microsoft Teams) whenever an asset drifts into non-compliance.",
      milestone: "Q1 Roadmap",
      tags: ["Webhook Alerts", "Cron Worker", "Drift Detection"]
    },
    {
      title: "Real-time Threat Intelligence Feed",
      provider: "Intelligence",
      icon: ShieldAlert,
      status: "PLANNED",
      description: "Correlation of discovered open ports and public buckets against live botnet telemetry, known malicious IP lists, and zero-day CVE feeds.",
      milestone: "Q2 Roadmap",
      tags: ["CVE Feeds", "Threat Correlation", "EPSS Scoring"]
    },
    {
      title: "Regulatory Compliance Frameworks Mapping",
      provider: "Compliance",
      icon: FileCheck,
      status: "PLANNED",
      description: "Automated tagging and reporting against formal compliance matrices: SOC 2 Type II, ISO 27001, HIPAA Security Rule, and PCI-DSS 4.0.",
      milestone: "Q2 Roadmap",
      tags: ["SOC2", "PCI-DSS 4.0", "ISO 27001", "HIPAA"]
    },
    {
      title: "Approval-Based Automated Remediation",
      provider: "Automation",
      icon: Bot,
      status: "PLANNED",
      description: "One-click 'Remediate Now' capability that creates audited Pull Requests or executes signed AWS/Azure CLI scripts after multi-engineer approval.",
      milestone: "Q3 Roadmap",
      tags: ["Human-In-The-Loop", "IaC PR Bot", "Audited Fixes"]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-cyan-400">
            Strategic Architecture Roadmap
          </span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Future Scope & Planned Integrations</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          CloudGuard currently operates as an offline, rule-based static configuration scanner. Live cloud API connectors and automated agentic remediations are strictly marked as <strong className="text-cyan-300">PLANNED</strong> future enhancements.
        </p>
      </div>

      {/* Roadmap Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roadmapItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 rounded-2xl border border-slate-800/90 hover:border-cyan-500/30 p-5 flex flex-col justify-between transition-all group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                        {item.provider}
                      </span>
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  {item.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800/80">
                  {item.tags.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Target: {item.milestone}</span>
                <span className="text-cyan-400/80 group-hover:text-cyan-300">Phase Specification Ready</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
