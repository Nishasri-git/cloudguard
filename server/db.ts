import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { ScanResult, CloudResource, SecurityFinding, SecurityReport, DashboardStats, SecurityCategory } from '../src/types/security.js';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'cloudguard.sqlite');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('[CloudGuard DB] Corrupted DB file, creating fresh database:', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Initialize Schema
  initSchema(dbInstance);
  saveDbToDisk();
  return dbInstance;
}

function saveDbToDisk() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('[CloudGuard DB] Failed to save DB to disk:', err);
  }
}

function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      total_resources INTEGER NOT NULL,
      secure_resources INTEGER NOT NULL,
      vulnerable_resources INTEGER NOT NULL,
      score INTEGER NOT NULL,
      risk_rating TEXT NOT NULL,
      critical_findings INTEGER NOT NULL,
      high_findings INTEGER NOT NULL,
      medium_findings INTEGER NOT NULL,
      low_findings INTEGER NOT NULL,
      score_breakdown TEXT NOT NULL,
      summary TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      scan_id TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      service TEXT NOT NULL,
      is_secure INTEGER NOT NULL,
      configuration TEXT NOT NULL,
      findings_count INTEGER DEFAULT 0,
      critical_count INTEGER DEFAULT 0,
      FOREIGN KEY (scan_id) REFERENCES scans(id)
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      scan_id TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      resource_name TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      severity TEXT NOT NULL,
      evidence TEXT NOT NULL,
      impact TEXT NOT NULL,
      risk_explanation TEXT NOT NULL,
      recommended_action TEXT NOT NULL,
      remediation_steps TEXT NOT NULL,
      score_impact INTEGER NOT NULL,
      cli_command TEXT,
      terraform_fix TEXT,
      ai_enhanced INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (scan_id) REFERENCES scans(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      scan_id TEXT NOT NULL,
      title TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      format TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_resources INTEGER NOT NULL,
      findings_count INTEGER NOT NULL,
      critical_count INTEGER NOT NULL,
      high_count INTEGER NOT NULL,
      FOREIGN KEY (scan_id) REFERENCES scans(id)
    );
  `);

  // Seed default user if not exists
  const userCheck = db.exec("SELECT COUNT(*) as count FROM users");
  if (!userCheck.length || userCheck[0].values[0][0] === 0) {
    db.run(
      "INSERT INTO users (id, name, email, role, created_at) VALUES (?, ?, ?, ?, ?)",
      ['user-analyst-1', 'Alex Vance', 'alex.vance@cloudguard.sec', 'Lead Security Architect', new Date().toISOString()]
    );
  }
}

export async function saveScan(scan: ScanResult): Promise<void> {
  const db = await getDb();

  db.run(
    `INSERT OR REPLACE INTO scans (
      id, name, created_at, total_resources, secure_resources, vulnerable_resources,
      score, risk_rating, critical_findings, high_findings, medium_findings, low_findings,
      score_breakdown, summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      scan.id,
      scan.name,
      scan.createdAt,
      scan.totalResources,
      scan.secureResources,
      scan.vulnerableResources,
      scan.score,
      scan.riskRating,
      scan.criticalFindings,
      scan.highFindings,
      scan.mediumFindings,
      scan.lowFindings,
      JSON.stringify(scan.scoreBreakdown),
      scan.summary
    ]
  );

  for (const r of scan.resources) {
    db.run(
      `INSERT OR REPLACE INTO resources (
        id, scan_id, resource_id, name, type, provider, service, is_secure, configuration, findings_count, critical_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `${scan.id}-${r.id}`,
        scan.id,
        r.id,
        r.name,
        r.type,
        r.provider,
        r.service,
        r.isSecure ? 1 : 0,
        JSON.stringify(r.configuration),
        r.findingsCount || 0,
        r.criticalCount || 0
      ]
    );
  }

  for (const f of scan.findings) {
    db.run(
      `INSERT OR REPLACE INTO findings (
        id, scan_id, resource_id, resource_name, resource_type, category, title, severity,
        evidence, impact, risk_explanation, recommended_action, remediation_steps,
        score_impact, cli_command, terraform_fix, ai_enhanced, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        f.id,
        f.scanId,
        f.resourceId,
        f.resourceName,
        f.resourceType,
        f.category,
        f.title,
        f.severity,
        f.evidence,
        f.impact,
        f.riskExplanation,
        f.recommendedAction,
        JSON.stringify(f.remediationSteps),
        f.scoreImpact,
        f.cliCommand || null,
        f.terraformFix || null,
        f.aiEnhanced ? 1 : 0,
        f.createdAt
      ]
    );
  }

  saveDbToDisk();
}

export async function getScans(): Promise<ScanResult[]> {
  const db = await getDb();
  const res = db.exec("SELECT * FROM scans ORDER BY created_at DESC");
  if (!res.length || !res[0].values.length) return [];

  const columns = res[0].columns;
  const scans: ScanResult[] = [];

  for (const row of res[0].values) {
    const rowObj: any = {};
    columns.forEach((col, idx) => {
      rowObj[col] = row[idx];
    });

    const findings = await getFindingsForScan(rowObj.id);
    const resources = await getResourcesForScan(rowObj.id);

    scans.push({
      id: rowObj.id,
      name: rowObj.name,
      createdAt: rowObj.created_at,
      totalResources: rowObj.total_resources,
      secureResources: rowObj.secure_resources,
      vulnerableResources: rowObj.vulnerable_resources,
      score: rowObj.score,
      riskRating: rowObj.risk_rating,
      criticalFindings: rowObj.critical_findings,
      highFindings: rowObj.high_findings,
      mediumFindings: rowObj.medium_findings,
      lowFindings: rowObj.low_findings,
      scoreBreakdown: JSON.parse(rowObj.score_breakdown || '{}'),
      summary: rowObj.summary,
      findings,
      resources
    });
  }

  return scans;
}

export async function getScanById(id: string): Promise<ScanResult | null> {
  const db = await getDb();
  const res = db.exec("SELECT * FROM scans WHERE id = '" + id.replace(/'/g, "''") + "'");
  if (!res.length || !res[0].values.length) return null;

  const columns = res[0].columns;
  const rowObj: any = {};
  columns.forEach((col, idx) => {
    rowObj[col] = res[0].values[0][idx];
  });

  const findings = await getFindingsForScan(id);
  const resources = await getResourcesForScan(id);

  return {
    id: rowObj.id,
    name: rowObj.name,
    createdAt: rowObj.created_at,
    totalResources: rowObj.total_resources,
    secureResources: rowObj.secure_resources,
    vulnerableResources: rowObj.vulnerable_resources,
    score: rowObj.score,
    riskRating: rowObj.risk_rating,
    criticalFindings: rowObj.critical_findings,
    highFindings: rowObj.high_findings,
    mediumFindings: rowObj.medium_findings,
    lowFindings: rowObj.low_findings,
    scoreBreakdown: JSON.parse(rowObj.score_breakdown || '{}'),
    summary: rowObj.summary,
    findings,
    resources
  };
}

export async function getFindingsForScan(scanId: string): Promise<SecurityFinding[]> {
  const db = await getDb();
  const res = db.exec(`SELECT * FROM findings WHERE scan_id = '${scanId.replace(/'/g, "''")}' ORDER BY 
    CASE severity
      WHEN 'CRITICAL' THEN 1
      WHEN 'HIGH' THEN 2
      WHEN 'MEDIUM' THEN 3
      WHEN 'LOW' THEN 4
      ELSE 5
    END ASC`);

  if (!res.length || !res[0].values.length) return [];

  const columns = res[0].columns;
  return res[0].values.map(row => {
    const f: any = {};
    columns.forEach((col, idx) => {
      f[col] = row[idx];
    });

    return {
      id: f.id,
      scanId: f.scan_id,
      resourceId: f.resource_id,
      resourceName: f.resource_name,
      resourceType: f.resource_type,
      category: f.category,
      title: f.title,
      severity: f.severity,
      evidence: f.evidence,
      impact: f.impact,
      riskExplanation: f.risk_explanation,
      recommendedAction: f.recommended_action,
      remediationSteps: JSON.parse(f.remediation_steps || '[]'),
      scoreImpact: f.score_impact,
      cliCommand: f.cli_command || undefined,
      terraformFix: f.terraform_fix || undefined,
      aiEnhanced: Boolean(f.ai_enhanced),
      createdAt: f.created_at
    };
  });
}

export async function getResourcesForScan(scanId: string): Promise<CloudResource[]> {
  const db = await getDb();
  const res = db.exec(`SELECT * FROM resources WHERE scan_id = '${scanId.replace(/'/g, "''")}' ORDER BY is_secure ASC, name ASC`);
  if (!res.length || !res[0].values.length) return [];

  const columns = res[0].columns;
  return res[0].values.map(row => {
    const r: any = {};
    columns.forEach((col, idx) => {
      r[col] = row[idx];
    });

    return {
      id: r.resource_id,
      name: r.name,
      type: r.type,
      provider: r.provider,
      service: r.service,
      isSecure: Boolean(r.is_secure),
      configuration: JSON.parse(r.configuration || '{}'),
      findingsCount: r.findings_count,
      criticalCount: r.critical_count
    };
  });
}

export async function getAllFindings(filters?: { severity?: string; category?: string; search?: string; scanId?: string }): Promise<SecurityFinding[]> {
  const db = await getDb();
  let query = `SELECT * FROM findings WHERE 1=1`;

  if (filters?.scanId) {
    query += ` AND scan_id = '${filters.scanId.replace(/'/g, "''")}'`;
  }
  if (filters?.severity && filters.severity !== 'ALL') {
    query += ` AND severity = '${filters.severity.replace(/'/g, "''")}'`;
  }
  if (filters?.category && filters.category !== 'ALL') {
    query += ` AND category = '${filters.category.replace(/'/g, "''")}'`;
  }
  if (filters?.search) {
    const s = filters.search.replace(/'/g, "''");
    query += ` AND (title LIKE '%${s}%' OR resource_name LIKE '%${s}%' OR evidence LIKE '%${s}%')`;
  }

  query += ` ORDER BY 
    CASE severity
      WHEN 'CRITICAL' THEN 1
      WHEN 'HIGH' THEN 2
      WHEN 'MEDIUM' THEN 3
      WHEN 'LOW' THEN 4
      ELSE 5
    END ASC, created_at DESC LIMIT 200`;

  const res = db.exec(query);
  if (!res.length || !res[0].values.length) return [];

  const columns = res[0].columns;
  return res[0].values.map(row => {
    const f: any = {};
    columns.forEach((col, idx) => {
      f[col] = row[idx];
    });

    return {
      id: f.id,
      scanId: f.scan_id,
      resourceId: f.resource_id,
      resourceName: f.resource_name,
      resourceType: f.resource_type,
      category: f.category,
      title: f.title,
      severity: f.severity,
      evidence: f.evidence,
      impact: f.impact,
      riskExplanation: f.risk_explanation,
      recommendedAction: f.recommended_action,
      remediationSteps: JSON.parse(f.remediation_steps || '[]'),
      scoreImpact: f.score_impact,
      cliCommand: f.cli_command || undefined,
      terraformFix: f.terraform_fix || undefined,
      aiEnhanced: Boolean(f.ai_enhanced),
      createdAt: f.created_at
    };
  });
}

export async function getAllResources(filters?: { scanId?: string; isSecure?: boolean; provider?: string }): Promise<CloudResource[]> {
  const db = await getDb();
  let query = `SELECT * FROM resources WHERE 1=1`;

  if (filters?.scanId) {
    query += ` AND scan_id = '${filters.scanId.replace(/'/g, "''")}'`;
  }
  if (filters?.isSecure !== undefined) {
    query += ` AND is_secure = ${filters.isSecure ? 1 : 0}`;
  }
  if (filters?.provider && filters.provider !== 'ALL') {
    query += ` AND provider = '${filters.provider.replace(/'/g, "''")}'`;
  }

  query += ` ORDER BY is_secure ASC, name ASC LIMIT 300`;

  const res = db.exec(query);
  if (!res.length || !res[0].values.length) return [];

  const columns = res[0].columns;
  return res[0].values.map(row => {
    const r: any = {};
    columns.forEach((col, idx) => {
      r[col] = row[idx];
    });

    return {
      id: r.resource_id,
      name: r.name,
      type: r.type,
      provider: r.provider,
      service: r.service,
      isSecure: Boolean(r.is_secure),
      configuration: JSON.parse(r.configuration || '{}'),
      findingsCount: r.findings_count,
      criticalCount: r.critical_count
    };
  });
}

export async function saveReport(report: SecurityReport): Promise<void> {
  const db = await getDb();
  db.run(
    `INSERT OR REPLACE INTO reports (
      id, scan_id, title, generated_at, format, score, total_resources, findings_count, critical_count, high_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      report.id,
      report.scanId,
      report.title,
      report.generatedAt,
      report.format,
      report.score,
      report.totalResources,
      report.findingsCount,
      report.criticalCount,
      report.highCount
    ]
  );
  saveDbToDisk();
}

export async function getReports(): Promise<SecurityReport[]> {
  const db = await getDb();
  const res = db.exec("SELECT * FROM reports ORDER BY generated_at DESC");
  if (!res.length || !res[0].values.length) return [];

  const columns = res[0].columns;
  return res[0].values.map(row => {
    const r: any = {};
    columns.forEach((col, idx) => {
      r[col] = row[idx];
    });

    return {
      id: r.id,
      scanId: r.scan_id,
      title: r.title,
      generatedAt: r.generated_at,
      format: r.format,
      score: r.score,
      totalResources: r.total_resources,
      findingsCount: r.findings_count,
      criticalCount: r.critical_count,
      highCount: r.high_count
    };
  });
}

export async function updateFindingWithAi(findingId: string, aiExplanation: string, enhancedFix: string): Promise<void> {
  const db = await getDb();
  db.run(
    `UPDATE findings SET risk_explanation = ?, recommended_action = ?, ai_enhanced = 1 WHERE id = ?`,
    [aiExplanation, enhancedFix, findingId]
  );
  saveDbToDisk();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const scans = await getScans();
  const latestScan = scans.length > 0 ? scans[0] : null;

  const defaultCategoryDist: Record<SecurityCategory, { total: number; critical: number; high: number; medium: number; low: number }> = {
    IAM: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
    STORAGE: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
    NETWORK: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
    ENCRYPTION: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
    LOGGING: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
  };

  const findings = latestScan ? latestScan.findings : [];

  for (const f of findings) {
    if (defaultCategoryDist[f.category]) {
      defaultCategoryDist[f.category].total += 1;
      if (f.severity === 'CRITICAL') defaultCategoryDist[f.category].critical += 1;
      else if (f.severity === 'HIGH') defaultCategoryDist[f.category].high += 1;
      else if (f.severity === 'MEDIUM') defaultCategoryDist[f.category].medium += 1;
      else if (f.severity === 'LOW') defaultCategoryDist[f.category].low += 1;
    }
  }

  return {
    latestScan,
    securityScore: latestScan ? latestScan.score : 100,
    resourcesScanned: latestScan ? latestScan.totalResources : 0,
    secureResources: latestScan ? latestScan.secureResources : 0,
    criticalFindings: latestScan ? latestScan.criticalFindings : 0,
    highFindings: latestScan ? latestScan.highFindings : 0,
    mediumFindings: latestScan ? latestScan.mediumFindings : 0,
    lowFindings: latestScan ? latestScan.lowFindings : 0,
    categoryDistribution: defaultCategoryDist,
    recentScans: scans.slice(0, 5).map(s => ({
      id: s.id,
      name: s.name,
      createdAt: s.createdAt,
      score: s.score,
      totalResources: s.totalResources,
      criticalFindings: s.criticalFindings,
      highFindings: s.highFindings
    })),
    recentFindings: findings.slice(0, 10)
  };
}
