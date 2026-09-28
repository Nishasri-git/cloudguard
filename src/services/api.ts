import { DashboardStats, ScanResult, SecurityFinding, CloudResource, SecurityReport } from '../types/security';

export async function fetchDashboard(): Promise<DashboardStats> {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return res.json();
}

export async function runScan(params: { config?: any; name?: string; useSample?: boolean }): Promise<ScanResult> {
  const res = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to complete cloud scan');
  }
  return res.json();
}

export async function validateJson(jsonString: string): Promise<{ valid: boolean; resourceCount?: number; resourceTypes?: string[]; error?: string; parsed?: any }> {
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonString }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { valid: false, error: data.error || 'Validation failed' };
  }
  return data;
}

export async function fetchScans(): Promise<ScanResult[]> {
  const res = await fetch('/api/scans');
  if (!res.ok) throw new Error('Failed to fetch scans history');
  return res.json();
}

export async function fetchScan(id: string): Promise<ScanResult> {
  const res = await fetch(`/api/scans/${id}`);
  if (!res.ok) throw new Error('Failed to fetch scan details');
  return res.json();
}

export async function fetchFindings(filters?: { scanId?: string; severity?: string; category?: string; search?: string }): Promise<SecurityFinding[]> {
  const params = new URLSearchParams();
  if (filters?.scanId) params.append('scanId', filters.scanId);
  if (filters?.severity) params.append('severity', filters.severity);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.search) params.append('search', filters.search);

  const res = await fetch(`/api/findings?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch findings');
  return res.json();
}

export async function fetchResources(filters?: { scanId?: string; provider?: string; isSecure?: boolean }): Promise<CloudResource[]> {
  const params = new URLSearchParams();
  if (filters?.scanId) params.append('scanId', filters.scanId);
  if (filters?.provider) params.append('provider', filters.provider);
  if (filters?.isSecure !== undefined) params.append('isSecure', String(filters.isSecure));

  const res = await fetch(`/api/resources?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch resources');
  return res.json();
}

export async function requestAiExplanation(findingId: string): Promise<{
  findingId: string;
  explanation: string;
  whyItMatters: string;
  remediationGuidance: string;
  isAiGenerated: boolean;
}> {
  const res = await fetch(`/api/findings/${findingId}/ai-explain`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch AI explanation');
  }
  return res.json();
}

export async function fetchReports(): Promise<SecurityReport[]> {
  const res = await fetch('/api/reports');
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

export async function createReport(scanId: string, title?: string): Promise<SecurityReport> {
  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scanId, title }),
  });
  if (!res.ok) throw new Error('Failed to create report record');
  return res.json();
}

export async function fetchSampleData(): Promise<any> {
  const res = await fetch('/api/sample-data');
  if (!res.ok) throw new Error('Failed to fetch sample data');
  return res.json();
}
