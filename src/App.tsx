import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { FindingsView } from './components/FindingsView';
import { ResourcesView } from './components/ResourcesView';
import { ScansView } from './components/ScansView';
import { ReportsView } from './components/ReportsView';
import { FutureScopeView } from './components/FutureScopeView';
import { ScanModal } from './components/ScanModal';
import { FindingDetailDrawer } from './components/FindingDetailDrawer';
import {
  fetchDashboard,
  fetchScans,
  fetchReports,
  runScan,
  createReport,
} from './services/api';
import { DashboardStats, ScanResult, SecurityFinding, SecurityReport } from './types/security';
import { generateSecurityPdfReport } from './utils/pdfGenerator';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [reports, setReports] = useState<SecurityReport[]>([]);
  const [activeScan, setActiveScan] = useState<ScanResult | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isDemoScanning, setIsDemoScanning] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadInitialData = async () => {
    try {
      const [dashStats, allScans, allReports] = await Promise.all([
        fetchDashboard(),
        fetchScans(),
        fetchReports(),
      ]);

      setStats(dashStats);
      setScans(allScans);
      setReports(allReports);

      if (dashStats.latestScan) {
        setActiveScan(dashStats.latestScan);
      } else if (allScans.length > 0) {
        setActiveScan(allScans[0]);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleLoadDemo = async () => {
    setIsDemoScanning(true);
    try {
      const newScan = await runScan({
        useSample: true,
        name: "Acme Multi-Cloud Production (Demo Baseline)",
      });

      setActiveScan(newScan);
      await loadInitialData();
      showToast(`Demo scan completed! Security Score: ${newScan.score}/100 with ${newScan.findings.length} findings.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to execute demo scan', 'error');
    } finally {
      setIsDemoScanning(false);
    }
  };

  const handleScanCompleted = async (newScan: ScanResult) => {
    setActiveScan(newScan);
    await loadInitialData();
    showToast(`Assessment completed! Score: ${newScan.score}/100. Discovered ${newScan.totalResources} assets.`);
    setActiveTab('overview');
  };

  const handleGeneratePdf = async (targetScan?: ScanResult) => {
    const scanToUse = targetScan || activeScan;
    if (!scanToUse) {
      showToast('No active scan available for report generation.', 'error');
      return;
    }

    try {
      generateSecurityPdfReport(scanToUse);
      // Persist report in database
      const newReport = await createReport(scanToUse.id, `Executive Security Assessment Report - ${scanToUse.name}`);
      setReports((prev) => [newReport, ...prev]);
      showToast(`PDF Security Report generated and downloaded for ${scanToUse.name}!`);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      showToast('Failed to generate PDF report: ' + err.message, 'error');
    }
  };

  const handleDownloadReportByScanId = (scanId: string) => {
    const targetScan = scans.find((s) => s.id === scanId) || activeScan;
    if (targetScan) {
      handleGeneratePdf(targetScan);
    } else {
      showToast('Scan records could not be found for report download.', 'error');
    }
  };

  const handleFindingUpdated = (updatedFinding: SecurityFinding) => {
    setSelectedFinding(updatedFinding);
    if (activeScan) {
      const updatedFindings = activeScan.findings.map((f) =>
        f.id === updatedFinding.id ? updatedFinding : f
      );
      setActiveScan({
        ...activeScan,
        findings: updatedFindings,
      });
    }
  };

  const currentTabTitle =
    activeTab === 'overview'
      ? 'Security Overview'
      : activeTab === 'scans'
      ? 'Assessment History'
      : activeTab === 'findings'
      ? 'Security Findings'
      : activeTab === 'resources'
      ? 'Cloud Assets'
      : activeTab === 'reports'
      ? 'Executive Audit Reports'
      : 'Future Scope';

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 text-xs font-medium ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
                : toastMessage.type === 'error'
                ? 'bg-red-950/95 border-red-500/50 text-red-200'
                : 'bg-cyan-950/95 border-cyan-500/50 text-cyan-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        criticalCount={stats?.criticalFindings || 0}
        totalFindings={activeScan?.findings.length || 0}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header */}
        <Header
          activeTabTitle={currentTabTitle}
          onOpenScanModal={() => setIsScanModalOpen(true)}
          onLoadDemo={handleLoadDemo}
          isScanning={isDemoScanning}
          activeScan={activeScan}
          onGeneratePdf={() => handleGeneratePdf()}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {!stats ? (
            <div className="h-96 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
              <div className="text-sm font-semibold text-white">Initializing CloudGuard Engine...</div>
              <p className="text-xs text-slate-400 mt-1">Connecting to SQLite persistence and loading security baselines.</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewView
                  stats={stats}
                  onSelectFinding={setSelectedFinding}
                  onNavigateToTab={setActiveTab}
                  onGenerateReport={() => handleGeneratePdf()}
                  onOpenScanModal={() => setIsScanModalOpen(true)}
                />
              )}

              {activeTab === 'scans' && (
                <ScansView
                  scans={scans}
                  activeScanId={activeScan?.id || null}
                  onSelectScan={(scan) => {
                    setActiveScan(scan);
                    setActiveTab('overview');
                  }}
                  onOpenScanModal={() => setIsScanModalOpen(true)}
                  onLoadDemo={handleLoadDemo}
                  onGeneratePdfForScan={handleGeneratePdf}
                />
              )}

              {activeTab === 'findings' && (
                <FindingsView
                  findings={activeScan?.findings || []}
                  onSelectFinding={setSelectedFinding}
                />
              )}

              {activeTab === 'resources' && (
                <ResourcesView resources={activeScan?.resources || []} />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  reports={reports}
                  activeScan={activeScan}
                  onGenerateReport={() => handleGeneratePdf()}
                  onDownloadReport={handleDownloadReportByScanId}
                />
              )}

              {activeTab === 'futurescope' && <FutureScopeView />}
            </>
          )}
        </main>
      </div>

      {/* Slide-out Finding Detail Drawer */}
      <FindingDetailDrawer
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onFindingUpdated={handleFindingUpdated}
      />

      {/* New Scan / Upload Configuration Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScanCompleted={handleScanCompleted}
      />
    </div>
  );
}
