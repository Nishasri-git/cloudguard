# CloudGuard – Intelligent Cloud Security Assessment Platform

CloudGuard is a cloud security posture assessment platform that ingests multi-cloud configurations (AWS, Azure, GCP), automatically scans them for critical misconfigurations using a deterministic CIS/NIST rule engine, calculates a transparent risk score (0–100), provides Gemini AI-enhanced explanations and remediation instructions, and generates executive-ready PDF audit reports.

---

## 🚀 Key Features

1. **Deterministic Security Rule Engine**:
   - **IAM**: Wildcard permissions (`Action: "*"`), excessive administrative rights, unrotated keys (>90 days), missing MFA enforcement.
   - **Storage**: Public read/write buckets (`public_access = true`), unencrypted buckets, missing versioning.
   - **Network**: Internet-exposed administrative ports (Port 22 SSH, Port 3389 RDP open to `0.0.0.0/0`), exposed database ports (3306, 5432, 1433), publicly accessible RDS instances.
   - **Encryption**: Missing encryption at rest, plaintext transport (`https_only = false`, HTTP port 80).
   - **Logging & Auditing**: Disabled audit logging (`audit_logging = false`), single-region CloudTrail, disabled log file validation.

2. **Transparent Rule-Based Risk Scoring**:
   - Evaluates severity (Critical, High, Medium, Low), public exposure multipliers, and resource sensitivity multipliers.
   - Detailed breakdown showing *exactly why the score decreased* and point deductions per finding.
   - Explicit disclaimer that the relative score prioritizes misconfigurations and does not guarantee perimeter invulnerability.

3. **Gemini 3.8 Intelligence Integration**:
   - Uses `@google/genai` on the server-side to generate plain-language explanations, threat actor attack perspectives, and tailored remediation steps.
   - Strict separation of concerns: The rule engine deterministically determines vulnerability existence and severity; Gemini is used solely for explanation and wording improvements.
   - Resilient offline fallback templates when Gemini API is unavailable.

4. **Multi-Format Ingestion**:
   - Upload `.json` configuration files.
   - Paste JSON directly with real-time schema and syntax validation.
   - 1-Click "Load Demo Configuration" with realistic multi-cloud resources (intentional vulnerabilities & hardened secure assets).

5. **Executive & Technical PDF Reports**:
   - Instant PDF generation with audit metadata, security score gauge, categorical breakdown matrix, and step-by-step remediation checklists.

6. **SQLite Relational Persistence**:
   - Fast, persistent SQLite database (`cloudguard.sqlite`) tracking scans, resources, findings, and generated reports.

7. **Strategic Future Scope Page**:
   - Clearly documented roadmap for Live AWS/Azure/GCP connectors, Continuous monitoring daemon, Compliance frameworks mapping (SOC 2, PCI-DSS), and Approval-based automated remediation (marked as **PLANNED**).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express, REST API
- **AI**: Google Gen AI SDK (`@google/genai`), Model: `gemini-3.8-flash`
- **Database**: SQLite (via `sql.js` WASM persistence to disk)
- **Reporting**: jsPDF & jsPDF-AutoTable

---

## ⚡ Setup & Run Commands

### 1. Prerequisites
- Node.js 20+ installed
- (Optional) `GEMINI_API_KEY` set in `.env` for AI explanations (fallback templates automatically activate if key is omitted).

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000` with both Express REST API endpoints and Vite frontend middlewares active.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🧪 Complete Test Workflow

1. Open the application at `http://localhost:3000`.
2. Click **"Load Demo Configuration"** on the top header or Scans view.
3. Observe the automated multi-step scan:
   - Resource discovery (AWS, Azure, GCP assets)
   - Configuration normalization
   - CIS rule engine evaluation
   - Transparent risk score calculation (Score: ~78/100, 3 Critical, High, Medium, Low, Secure assets).
4. Review the **Overview Dashboard** (Risk score gauge, categorical distribution, asset counts).
5. Switch to **Security Findings** and click on any finding (e.g. *Public Storage Access Enabled* or *Open SSH Port 22*).
6. In the slide-out detail drawer:
   - Inspect evidence code
   - Click **"Analyze with Gemini"** to view AI deep-dive explanation
   - Copy the CLI remediation snippet or Terraform fix.
7. Click **"Generate PDF Report"** to download the professional audit document.
8. Switch to **Future Scope** to review the planned live cloud connector roadmap.
