import express, { Request, Response } from 'express';
import { securityEngine } from './securityEngine.js';
import { geminiService } from './geminiService.js';
import { SAMPLE_CLOUD_CONFIG } from './sampleData.js';
import * as db from './db.js';
import { ScanResult, CloudResource, SecurityFinding, SecurityReport } from '../src/types/security.js';

export const apiRouter = express.Router();

/**
 * Normalizes raw input configuration into standard CloudResource objects
 */
function normalizeResources(rawConfig: any): any[] {
  let resourcesList: any[] = [];

  if (Array.isArray(rawConfig)) {
    resourcesList = rawConfig;
  } else if (rawConfig && Array.isArray(rawConfig.resources)) {
    resourcesList = rawConfig.resources;
  } else if (rawConfig && typeof rawConfig === 'object') {
    // Check if it's terraform-like state or cloud provider export
    if (rawConfig.values?.root_module?.resources) {
      resourcesList = rawConfig.values.root_module.resources.map((r: any) => ({
        id: r.address || r.name,
        name: r.name,
        type: r.type,
        provider: r.type.startsWith('aws_') ? 'AWS' : r.type.startsWith('azurerm_') ? 'Azure' : 'GCP',
        service: r.type.split('_')[1] || 'Cloud',
        ...r.values
      }));
    } else {
      // Key-value resources or single resource
      resourcesList = Object.entries(rawConfig).map(([key, val]: [string, any]) => {
        if (typeof val === 'object' && val !== null) {
          return { id: key, name: key, ...val };
        }
        return { id: key, name: key, value: val };
      });
    }
  }

  return resourcesList;
}

/**
 * POST /api/scan
 * Runs deterministic rule evaluation, score calculation, and persists to DB.
 */
apiRouter.post('/scan', async (req: Request, res: Response) => {
  try {
    const { config, name, useSample } = req.body;
    const rawConfig = useSample || !config ? SAMPLE_CLOUD_CONFIG : config;
    const scanName = name || (useSample ? "Demo Environment Baseline Audit" : "Custom Cloud Security Scan");
    const scanId = `scan-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const rawResources = normalizeResources(rawConfig);
    if (!rawResources.length) {
      return res.status(400).json({ error: "No cloud resources detected in the provided JSON configuration." });
    }

    const allFindings: SecurityFinding[] = [];
    const processedResources: CloudResource[] = [];

    for (const r of rawResources) {
      const { findings, isSecure } = securityEngine.evaluateResource(r, scanId);
      allFindings.push(...findings);

      const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
      processedResources.push({
        id: r.id || `res-${Math.random().toString(36).substring(7)}`,
        name: r.name || r.id || 'unnamed-resource',
        type: r.type || 'generic_cloud_resource',
        provider: r.provider || (r.type?.startsWith('aws') ? 'AWS' : r.type?.startsWith('azure') ? 'Azure' : r.type?.startsWith('gcp') ? 'GCP' : 'Generic'),
        service: r.service || 'Infrastructure',
        isSecure,
        configuration: r,
        findingsCount: findings.length,
        criticalCount
      });
    }

    // Calculate transparent rule-based score
    const scoreBreakdown = securityEngine.calculateRiskScore(allFindings);
    const criticalFindings = allFindings.filter(f => f.severity === 'CRITICAL').length;
    const highFindings = allFindings.filter(f => f.severity === 'HIGH').length;
    const mediumFindings = allFindings.filter(f => f.severity === 'MEDIUM').length;
    const lowFindings = allFindings.filter(f => f.severity === 'LOW').length;
    const secureResources = processedResources.filter(r => r.isSecure).length;

    const scanResult: ScanResult = {
      id: scanId,
      name: scanName,
      createdAt: new Date().toISOString(),
      totalResources: processedResources.length,
      secureResources,
      vulnerableResources: processedResources.length - secureResources,
      score: scoreBreakdown.score,
      riskRating: scoreBreakdown.rating,
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      findings: allFindings,
      resources: processedResources,
      scoreBreakdown,
      summary: `Scanned ${processedResources.length} cloud assets across ${allFindings.length} findings (${criticalFindings} Critical, ${highFindings} High). Deterministic Security Score: ${scoreBreakdown.score}/100.`
    };

    // Save to SQLite
    await db.saveScan(scanResult);

    return res.status(201).json(scanResult);
  } catch (err: any) {
    console.error('[CloudGuard API] Scan error:', err);
    return res.status(500).json({ error: "Failed to execute cloud security scan: " + (err?.message || err) });
  }
});

/**
 * POST /api/upload
 * Validates JSON structure, syntax, and returns discovered count
 */
apiRouter.post('/upload', async (req: Request, res: Response) => {
  try {
    const { jsonString } = req.body;
    if (!jsonString) {
      return res.status(400).json({ valid: false, error: "JSON content cannot be empty." });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseErr: any) {
      return res.status(400).json({
        valid: false,
        error: `Invalid JSON syntax: ${parseErr.message}`
      });
    }

    const resources = normalizeResources(parsed);
    if (!resources.length) {
      return res.status(400).json({
        valid: false,
        error: "JSON is valid syntax, but no cloud resources (e.g. array of resources or configuration objects) were found."
      });
    }

    const resourceTypes = Array.from(new Set(resources.map(r => r.type || 'generic')));
    return res.json({
      valid: true,
      resourceCount: resources.length,
      resourceTypes,
      parsed
    });
  } catch (err: any) {
    return res.status(500).json({ valid: false, error: err.message });
  }
});

/**
 * GET /api/scans
 * Returns all past scans
 */
apiRouter.get('/scans', async (_req: Request, res: Response) => {
  try {
    const scans = await db.getScans();
    return res.json(scans);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/scans/:id
 * Returns single scan
 */
apiRouter.get('/scans/:id', async (req: Request, res: Response) => {
  try {
    const scan = await db.getScanById(req.params.id);
    if (!scan) {
      return res.status(404).json({ error: "Scan record not found" });
    }
    return res.json(scan);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/findings
 * Query findings across scans with optional filters
 */
apiRouter.get('/findings', async (req: Request, res: Response) => {
  try {
    const { scanId, severity, category, search } = req.query;
    const findings = await db.getAllFindings({
      scanId: scanId as string,
      severity: severity as string,
      category: category as string,
      search: search as string
    });
    return res.json(findings);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/findings/:id/ai-explain
 * Triggers server-side Gemini AI for finding explanation and remediation wording
 */
apiRouter.post('/findings/:id/ai-explain', async (req: Request, res: Response) => {
  try {
    const findingId = req.params.id;
    const findings = await db.getAllFindings();
    const targetFinding = findings.find(f => f.id === findingId);

    if (!targetFinding) {
      return res.status(404).json({ error: "Finding not found" });
    }

    const aiResult = await geminiService.explainFinding(targetFinding);
    await db.updateFindingWithAi(findingId, aiResult.explanation, aiResult.remediationGuidance);

    return res.json({
      findingId,
      explanation: aiResult.explanation,
      whyItMatters: aiResult.whyItMatters,
      remediationGuidance: aiResult.remediationGuidance,
      isAiGenerated: aiResult.isAiGenerated
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Gemini AI analysis error: " + err.message });
  }
});

/**
 * GET /api/resources
 * Query resources with optional filters
 */
apiRouter.get('/resources', async (req: Request, res: Response) => {
  try {
    const { scanId, provider, isSecure } = req.query;
    const isSecureBool = isSecure !== undefined ? isSecure === 'true' : undefined;
    const resources = await db.getAllResources({
      scanId: scanId as string,
      provider: provider as string,
      isSecure: isSecureBool
    });
    return res.json(resources);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reports
 * Returns generated reports
 */
apiRouter.get('/reports', async (_req: Request, res: Response) => {
  try {
    const reports = await db.getReports();
    return res.json(reports);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reports
 * Creates a new report record from a scan
 */
apiRouter.post('/reports', async (req: Request, res: Response) => {
  try {
    const { scanId, title } = req.body;
    const scan = await db.getScanById(scanId);
    if (!scan) {
      return res.status(404).json({ error: "Scan not found for report generation" });
    }

    const report: SecurityReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      scanId: scan.id,
      title: title || `Cloud Security Assessment Report - ${scan.name}`,
      generatedAt: new Date().toISOString(),
      format: 'PDF',
      score: scan.score,
      totalResources: scan.totalResources,
      findingsCount: scan.findings.length,
      criticalCount: scan.criticalFindings,
      highCount: scan.highFindings
    };

    await db.saveReport(report);
    return res.status(201).json(report);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dashboard
 * Aggregated dashboard stats
 */
apiRouter.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    let stats = await db.getDashboardStats();
    // If no scans exist, auto-seed with sample configuration so dashboard is functional immediately!
    if (!stats.latestScan) {
      const rawResources = normalizeResources(SAMPLE_CLOUD_CONFIG);
      const scanId = `scan-init-demo`;
      const allFindings: SecurityFinding[] = [];
      const processedResources: CloudResource[] = [];

      for (const r of rawResources) {
        const { findings, isSecure } = securityEngine.evaluateResource(r, scanId);
        allFindings.push(...findings);
        processedResources.push({
          id: r.id,
          name: r.name,
          type: r.type,
          provider: r.provider as any,
          service: r.service,
          isSecure,
          configuration: r,
          findingsCount: findings.length,
          criticalCount: findings.filter(f => f.severity === 'CRITICAL').length
        });
      }

      const scoreBreakdown = securityEngine.calculateRiskScore(allFindings);
      const criticalFindings = allFindings.filter(f => f.severity === 'CRITICAL').length;
      const highFindings = allFindings.filter(f => f.severity === 'HIGH').length;
      const mediumFindings = allFindings.filter(f => f.severity === 'MEDIUM').length;
      const lowFindings = allFindings.filter(f => f.severity === 'LOW').length;
      const secureResources = processedResources.filter(r => r.isSecure).length;

      const initialScan: ScanResult = {
        id: scanId,
        name: "Enterprise Multi-Cloud Infrastructure (Demo Baseline)",
        createdAt: new Date().toISOString(),
        totalResources: processedResources.length,
        secureResources,
        vulnerableResources: processedResources.length - secureResources,
        score: scoreBreakdown.score,
        riskRating: scoreBreakdown.rating,
        criticalFindings,
        highFindings,
        mediumFindings,
        lowFindings,
        findings: allFindings,
        resources: processedResources,
        scoreBreakdown,
        summary: `Baseline assessment of ${processedResources.length} multi-cloud infrastructure assets across AWS, Azure, and GCP.`
      };

      await db.saveScan(initialScan);

      // Also create an initial report record
      await db.saveReport({
        id: 'rep-init-1',
        scanId: initialScan.id,
        title: 'Executive Security Audit Report - Q3 Cloud Posture',
        generatedAt: new Date().toISOString(),
        format: 'PDF',
        score: initialScan.score,
        totalResources: initialScan.totalResources,
        findingsCount: initialScan.findings.length,
        criticalCount: initialScan.criticalFindings,
        highCount: initialScan.highFindings
      });

      stats = await db.getDashboardStats();
    }

    return res.json(stats);
  } catch (err: any) {
    console.error('[CloudGuard API] Dashboard error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/sample-data
 * Returns the rich sample cloud configuration
 */
apiRouter.get('/sample-data', (_req: Request, res: Response) => {
  return res.json(SAMPLE_CLOUD_CONFIG);
});
