export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SECURE';

export type SecurityCategory = 'IAM' | 'STORAGE' | 'NETWORK' | 'ENCRYPTION' | 'LOGGING';

export interface CloudResource {
  id: string;
  name: string;
  type: string; // e.g., 'aws_s3_bucket', 'aws_security_group', 'aws_iam_policy', 'azure_storage_account', etc.
  provider: 'AWS' | 'Azure' | 'GCP' | 'Generic';
  service: string;
  isSecure: boolean;
  configuration: Record<string, any>;
  findingsCount?: number;
  criticalCount?: number;
}

export interface SecurityFinding {
  id: string;
  scanId: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  category: SecurityCategory;
  title: string;
  severity: SeverityLevel;
  evidence: string;
  impact: string;
  riskExplanation: string;
  recommendedAction: string;
  remediationSteps: string[];
  scoreImpact: number;
  cliCommand?: string;
  terraformFix?: string;
  aiEnhanced?: boolean;
  createdAt: string;
}

export interface ScoreDeduction {
  reason: string;
  category: SecurityCategory;
  severity: SeverityLevel;
  points: number;
  resourceName: string;
}

export interface RiskScoreBreakdown {
  score: number; // 0 - 100
  rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  deductions: ScoreDeduction[];
  criticalDeduction: number;
  highDeduction: number;
  mediumDeduction: number;
  lowDeduction: number;
  disclaimer: string;
}

export interface ScanResult {
  id: string;
  name: string;
  createdAt: string;
  totalResources: number;
  secureResources: number;
  vulnerableResources: number;
  score: number;
  riskRating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  findings: SecurityFinding[];
  resources: CloudResource[];
  scoreBreakdown: RiskScoreBreakdown;
  summary: string;
}

export interface DashboardStats {
  latestScan: ScanResult | null;
  securityScore: number;
  resourcesScanned: number;
  secureResources: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  categoryDistribution: Record<SecurityCategory, { total: number; critical: number; high: number; medium: number; low: number }>;
  recentScans: Array<{
    id: string;
    name: string;
    createdAt: string;
    score: number;
    totalResources: number;
    criticalFindings: number;
    highFindings: number;
  }>;
  recentFindings: SecurityFinding[];
}

export interface SecurityReport {
  id: string;
  scanId: string;
  title: string;
  generatedAt: string;
  format: 'PDF';
  score: number;
  totalResources: number;
  findingsCount: number;
  criticalCount: number;
  highCount: number;
}
