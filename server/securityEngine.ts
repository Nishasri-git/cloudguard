import { CloudResource, SecurityFinding, SecurityCategory, SeverityLevel, RiskScoreBreakdown, ScoreDeduction } from '../src/types/security.js';

export interface EvaluatedRule {
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
}

/**
 * CloudGuard Deterministic Rule Engine
 * Evaluates cloud resources against CIS/NIST-aligned configuration baselines.
 */
export class SecurityEngine {
  /**
   * Evaluates a single resource against all security rules
   */
  public evaluateResource(resource: any, scanId: string): { findings: SecurityFinding[]; isSecure: boolean } {
    const findings: SecurityFinding[] = [];
    const resConfig = resource.configuration || resource;
    const resName = resource.name || resource.id || 'unnamed-resource';
    const resType = resource.type || 'generic_cloud_resource';

    // 1. STORAGE SECURITY CHECKS
    this.checkStorageRules(resource, resConfig, resName, resType, findings, scanId);

    // 2. NETWORK SECURITY CHECKS
    this.checkNetworkRules(resource, resConfig, resName, resType, findings, scanId);

    // 3. IAM SECURITY CHECKS
    this.checkIamRules(resource, resConfig, resName, resType, findings, scanId);

    // 4. ENCRYPTION SECURITY CHECKS
    this.checkEncryptionRules(resource, resConfig, resName, resType, findings, scanId);

    // 5. LOGGING & AUDIT CHECKS
    this.checkLoggingRules(resource, resConfig, resName, resType, findings, scanId);

    const isSecure = findings.length === 0;
    return { findings, isSecure };
  }

  // --- 1. STORAGE RULES ---
  private checkStorageRules(res: any, cfg: any, name: string, type: string, findings: SecurityFinding[], scanId: string) {
    const isStorage = 
      type.includes('s3') || 
      type.includes('storage') || 
      type.includes('blob') || 
      type.includes('bucket') || 
      res.service?.toLowerCase().includes('storage') ||
      res.service?.toLowerCase().includes('s3');

    if (!isStorage) return;

    // Rule: Public Read Access / Unrestricted Bucket Access
    if (cfg.public_access === true || cfg.block_public_access === false || cfg.allow_blob_public_access === true || cfg.acl === 'public-read' || cfg.acl === 'public-read-write') {
      const evidence = cfg.acl 
        ? `acl = "${cfg.acl}", public_access = true`
        : cfg.allow_blob_public_access 
        ? `allow_blob_public_access = true` 
        : `public_access = true, block_public_access = false`;

      findings.push({
        id: `finding-${scanId}-storage-pub-${res.id || Math.random().toString(36).substring(7)}`,
        scanId,
        resourceId: res.id,
        resourceName: name,
        resourceType: type,
        category: 'STORAGE',
        title: 'Public Storage Access Enabled',
        severity: 'CRITICAL',
        evidence,
        impact: 'Stored objects and confidential organizational files may be accessed, indexed, or exfiltrated by unauthenticated internet users.',
        riskExplanation: 'Public storage buckets are one of the leading causes of enterprise cloud data breaches. When public access prevention is disabled or ACLs grant public read permissions, any actor on the public internet can read or download data without authentication.',
        recommendedAction: 'Enable block public access configurations immediately and remove all public ACL or bucket policy statements.',
        remediationSteps: [
          'Enable "Block all public access" on the storage account/bucket level.',
          'Review and remove public-read, public-read-write, or principal="*" grants from ACLs and policies.',
          'Enforce least-privilege IAM policies for authorized service principals.',
          'Re-scan the resource to verify public ingress is sealed.'
        ],
        scoreImpact: 15,
        cliCommand: type.includes('azure')
          ? `az storage account update --name ${name} --allow-blob-public-access false`
          : `aws s3api put-public-access-block --bucket ${name} --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"`,
        terraformFix: `resource "${type}" "hardened_${name.replace(/[^a-zA-Z0-9_]/g, '_')}" {\n  bucket = "${name}"\n  # Enforce public access block\n  block_public_acls       = true\n  block_public_policy     = true\n  ignore_public_acls      = true\n  restrict_public_buckets = true\n}`,
        createdAt: new Date().toISOString()
      });
    }

    // Rule: Bucket Versioning Disabled
    if (cfg.versioning === false) {
      findings.push({
        id: `finding-${scanId}-storage-ver-${res.id || Math.random().toString(36).substring(7)}`,
        scanId,
        resourceId: res.id,
        resourceName: name,
        resourceType: type,
        category: 'STORAGE',
        title: 'Storage Object Versioning Disabled',
        severity: 'LOW',
        evidence: `versioning = false`,
        impact: 'Objects deleted or overwritten by accidental human error or ransomware cannot be restored from prior versions.',
        riskExplanation: 'Versioning preserves multiple variants of an object in the same bucket, safeguarding critical operational and audit assets against accidental deletions or malicious overwrites.',
        recommendedAction: 'Enable bucket object versioning and configure lifecycle transition policies.',
        remediationSteps: [
          'Enable versioning on the target storage bucket.',
          'Configure lifecycle rules to expire non-current versions after a designated retention period.'
        ],
        scoreImpact: 2,
        cliCommand: `aws s3api put-bucket-versioning --bucket ${name} --versioning-configuration Status=Enabled`,
        createdAt: new Date().toISOString()
      });
    }
  }

  // --- 2. NETWORK RULES ---
  private checkNetworkRules(res: any, cfg: any, name: string, type: string, findings: SecurityFinding[], scanId: string) {
    const isNetwork = 
      type.includes('security_group') || 
      type.includes('firewall') || 
      type.includes('nsg') || 
      cfg.ingress_rules || 
      cfg.security_rules ||
      cfg.publicly_accessible === true;

    // Check ingress rules in AWS Security Groups
    if (cfg.ingress_rules && Array.isArray(cfg.ingress_rules)) {
      for (const rule of cfg.ingress_rules) {
        const isPublicCidr = rule.cidr_ip === '0.0.0.0/0' || rule.cidr_ip === '::/0';
        
        // Open SSH (Port 22)
        if (rule.port === 22 && isPublicCidr) {
          findings.push({
            id: `finding-${scanId}-net-ssh-${res.id}`,
            scanId,
            resourceId: res.id,
            resourceName: name,
            resourceType: type,
            category: 'NETWORK',
            title: 'Open SSH (Port 22) Exposed to Public Internet',
            severity: 'HIGH',
            evidence: `port 22 open to ${rule.cidr_ip}`,
            impact: 'Virtual machines and hosts are directly exposed to automated internet-wide brute force attacks, credential stuffing, and zero-day SSH vulnerabilities.',
            riskExplanation: 'Allowing port 22 from 0.0.0.0/0 leaves the server ingress boundary open to continuous scanning by botnets and attackers attempting unauthorized shell access.',
            recommendedAction: 'Restrict SSH ingress to specific corporate bastion IP addresses or utilize AWS Systems Manager Session Manager / Azure Bastion without opening inbound port 22.',
            remediationSteps: [
              'Remove the 0.0.0.0/0 inbound rule on port 22.',
              'Add authorized CIDR ranges (e.g. corporate office IP /32 or VPN /24).',
              'Adopt identity-aware remote access solutions (SSM / Teleport / Cloudflare Zero Trust).'
            ],
            scoreImpact: 8,
            cliCommand: `aws ec2 revoke-security-group-ingress --group-id ${res.id} --protocol tcp --port 22 --cidr 0.0.0.0/0`,
            terraformFix: `ingress {\n  description = "Restricted Corporate VPN SSH"\n  from_port   = 22\n  to_port     = 22\n  protocol    = "tcp"\n  cidr_blocks = ["198.51.100.50/32"] # Company VPN only\n}`,
            createdAt: new Date().toISOString()
          });
        }

        // Open RDP (Port 3389)
        if (rule.port === 3389 && isPublicCidr) {
          findings.push({
            id: `finding-${scanId}-net-rdp-${res.id}`,
            scanId,
            resourceId: res.id,
            resourceName: name,
            resourceType: type,
            category: 'NETWORK',
            title: 'Open RDP (Port 3389) Exposed to Public Internet',
            severity: 'HIGH',
            evidence: `port 3389 open to ${rule.cidr_ip}`,
            impact: 'Windows remote desktop protocol is exposed to internet reconnaissance, BlueKeep-style remote code execution exploits, and brute force login attempts.',
            riskExplanation: 'Remote Desktop Protocol services on port 3389 are frequent targets for automated ransomware intrusion vectors.',
            recommendedAction: 'Revoke public RDP ingress and route remote management through an encrypted VPN tunnel or Azure Bastion.',
            remediationSteps: [
              'Delete 0.0.0.0/0 inbound security group rules targeting TCP port 3389.',
              'Tunnel administrative management through private network overlays or VPN.'
            ],
            scoreImpact: 8,
            cliCommand: `aws ec2 revoke-security-group-ingress --group-id ${res.id} --protocol tcp --port 3389 --cidr 0.0.0.0/0`,
            createdAt: new Date().toISOString()
          });
        }

        // Unencrypted HTTP (Port 80)
        if (rule.port === 80 && isPublicCidr) {
          findings.push({
            id: `finding-${scanId}-net-http-${res.id}`,
            scanId,
            resourceId: res.id,
            resourceName: name,
            resourceType: type,
            category: 'NETWORK',
            title: 'Unencrypted Insecure HTTP Traffic Allowed (Port 80)',
            severity: 'MEDIUM',
            evidence: `port 80 open to ${rule.cidr_ip} without forced HTTPS redirection`,
            impact: 'Cleartext web traffic can be intercepted, read, or modified via man-in-the-middle (MitM) attacks.',
            riskExplanation: 'Exposing plain HTTP without strict transport security (HSTS) and automatic redirection to HTTPS exposes session cookies and payload data in transit.',
            recommendedAction: 'Enforce automatic TLS/HTTPS redirection on port 443 at the load balancer or ingress gateway.',
            remediationSteps: [
              'Update load balancer listener configuration to redirect HTTP port 80 requests to HTTPS port 443.',
              'Install valid TLS certificates managed by ACM or Let\'s Encrypt.'
            ],
            scoreImpact: 4,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    // Check Azure Network Security Group Rules
    if (cfg.security_rules && Array.isArray(cfg.security_rules)) {
      for (const rule of cfg.security_rules) {
        const isAllow = rule.access === 'Allow' && rule.direction === 'Inbound';
        const isPublic = rule.source_address_prefix === '0.0.0.0/0' || rule.source_address_prefix === '*';
        
        if (isAllow && isPublic && (rule.destination_port_range === '5432' || rule.destination_port_range === '3306' || rule.destination_port_range === '1433')) {
          findings.push({
            id: `finding-${scanId}-net-db-${res.id}`,
            scanId,
            resourceId: res.id,
            resourceName: name,
            resourceType: type,
            category: 'NETWORK',
            title: 'Database Port Open to Internet (Port ' + rule.destination_port_range + ')',
            severity: 'CRITICAL',
            evidence: `destination_port_range = "${rule.destination_port_range}", source_address_prefix = "${rule.source_address_prefix}"`,
            impact: 'Production database instances are directly reachable from any IP address on the globe, exposing internal tables to authentication bypasses and automated SQL attacks.',
            riskExplanation: 'Database listeners must never be directly addressable from public subnets. They should be strictly isolated within private application database tiers.',
            recommendedAction: 'Restrict database ingress exclusively to application tier security groups or private virtual subnets.',
            remediationSteps: [
              'Delete the public inbound firewall rule.',
              'Attach the database instance to an isolated private subnet without public IP allocation.',
              'Grant ingress access only to the authorized application cluster subnet.'
            ],
            scoreImpact: 15,
            cliCommand: `az network nsg rule delete --name "${rule.name}" --nsg-name "${name}"`,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    // Public Database Instance Check (e.g. AWS RDS publicly_accessible: true)
    if (type.includes('db') || type.includes('rds')) {
      if (cfg.publicly_accessible === true) {
        findings.push({
          id: `finding-${scanId}-net-dbpub-${res.id}`,
          scanId,
          resourceId: res.id,
          resourceName: name,
          resourceType: type,
          category: 'NETWORK',
          title: 'Database Instance Configured as Publicly Accessible',
          severity: 'CRITICAL',
          evidence: `publicly_accessible = true`,
          impact: 'Database receives a public IP address and DNS endpoint resolvable on the internet, creating an attack surface for data breaches.',
          riskExplanation: 'Managed databases must remain isolated inside private VPC subnets with zero internet ingress routes.',
          recommendedAction: 'Modify database instance settings to disable Public Accessibility.',
          remediationSteps: [
            'Modify the RDS instance and set Public Accessibility to "No".',
            'Ensure route tables for the database subnets do not route to an Internet Gateway (IGW).'
          ],
          scoreImpact: 14,
          cliCommand: `aws rds modify-db-instance --db-instance-identifier ${name} --no-publicly-accessible --apply-immediately`,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  // --- 3. IAM RULES ---
  private checkIamRules(res: any, cfg: any, name: string, type: string, findings: SecurityFinding[], scanId: string) {
    const isIam = 
      type.includes('iam') || 
      type.includes('service_account') || 
      type.includes('role') || 
      res.service === 'IAM' ||
      cfg.policy_document || 
      cfg.roles;

    if (!isIam) return;

    // Check IAM Policy Statements for Wildcards
    if (cfg.policy_document?.Statement && Array.isArray(cfg.policy_document.Statement)) {
      for (const stmt of cfg.policy_document.Statement) {
        if (stmt.Effect === 'Allow') {
          const action = stmt.Action;
          const hasActionWildcard = action === '*' || (Array.isArray(action) && action.includes('*'));
          const resource = stmt.Resource;
          const hasResourceWildcard = resource === '*' || (Array.isArray(resource) && resource.includes('*'));

          if (hasActionWildcard && hasResourceWildcard) {
            findings.push({
              id: `finding-${scanId}-iam-wildcard-full-${res.id}`,
              scanId,
              resourceId: res.id,
              resourceName: name,
              resourceType: type,
              category: 'IAM',
              title: 'Full Wildcard Administrative IAM Policy (Action: "*", Resource: "*")',
              severity: 'HIGH',
              evidence: `Effect = "Allow", Action = "*", Resource = "*"`,
              impact: 'Principals assigned this policy obtain unconditional administrative control across all cloud services, enabling privilege escalation, resource destruction, or unauthorized data access.',
              riskExplanation: 'Granting unrestricted wildcard permissions violates the principle of least privilege. In the event of compromised credentials, attackers can pivot without constraints.',
              recommendedAction: 'Grant only the specific actions and resource ARNs required for the entity\'s functional operational scope.',
              remediationSteps: [
                'Review CloudTrail / audit logs to identify which API calls the role actually performs.',
                'Replace Action: "*" with explicit granular permissions (e.g. s3:GetObject, dynamodb:Query).',
                'Scope Resource: "*" to target resource ARNs with least privilege.'
              ],
              scoreImpact: 10,
              terraformFix: `statement {\n  effect = "Allow"\n  actions = [\n    "s3:GetObject",\n    "s3:PutObject"\n  ]\n  resources = ["arn:aws:s3:::specific-app-bucket/*"]\n}`,
              createdAt: new Date().toISOString()
            });
          } else if (hasActionWildcard) {
            findings.push({
              id: `finding-${scanId}-iam-wildcard-act-${res.id}`,
              scanId,
              resourceId: res.id,
              resourceName: name,
              resourceType: type,
              category: 'IAM',
              title: 'Wildcard Action Permissions in IAM Policy',
              severity: 'HIGH',
              evidence: `Action contains "*"`,
              impact: 'Permits executing unintended destructive or administrative actions within the targeted resource scope.',
              riskExplanation: 'Using wildcards in Actions broadens the permission blast radius beyond minimal operational requirements.',
              recommendedAction: 'Grant only required API actions.',
              remediationSteps: [
                'Replace wildcard actions with specific API method declarations.',
                'Audit attached roles with IAM Access Analyzer.'
              ],
              scoreImpact: 7,
              createdAt: new Date().toISOString()
            });
          }
        }
      }
    }

    // Check GCP Service Account Roles
    if (cfg.roles && Array.isArray(cfg.roles)) {
      if (cfg.roles.includes('roles/owner') || cfg.roles.includes('roles/resourcemanager.organizationAdmin')) {
        findings.push({
          id: `finding-${scanId}-iam-owner-${res.id}`,
          scanId,
          resourceId: res.id,
          resourceName: name,
          resourceType: type,
          category: 'IAM',
          title: 'Excessive Project Owner Role Assigned to Service Account',
          severity: 'HIGH',
          evidence: `roles = [${cfg.roles.join(', ')}]`,
          impact: 'A compromised service account key allows complete tenant takeover, resource deployment, and billing manipulation.',
          riskExplanation: 'The primitive "roles/owner" grants broad permissions across all GCP services. Automated pipelines should always use fine-grained IAM roles.',
          recommendedAction: 'Replace primitive Owner role with role-specific predefined or custom least-privilege IAM roles.',
          remediationSteps: [
            'Revoke roles/owner from the service account.',
            'Assign tailored roles such as roles/compute.admin or roles/storage.objectUser based on workload needs.'
          ],
          scoreImpact: 9,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Check IAM User MFA and Old Credentials
    if (cfg.mfa_enabled === false) {
      findings.push({
        id: `finding-${scanId}-iam-mfa-${res.id}`,
        scanId,
        resourceId: res.id,
        resourceName: name,
        resourceType: type,
        category: 'IAM',
        title: 'Multi-Factor Authentication (MFA) Not Enforced on IAM Identity',
        severity: 'MEDIUM',
        evidence: `mfa_enabled = false`,
        impact: 'Account is vulnerable to single-factor password interception, phishing, and credential stuffing attacks.',
        riskExplanation: 'MFA adds a critical second verification layer preventing unauthorized console logins even if passwords are compromised.',
        recommendedAction: 'Enforce mandatory hardware or virtual MFA device registration for all human console users.',
        remediationSteps: [
          'Enable virtual MFA or FIDO2 security key for the IAM user.',
          'Attach an IAM policy enforcing MFA for all privileged console and API operations.'
        ],
        scoreImpact: 5,
        createdAt: new Date().toISOString()
      });
    }

    // Unrotated Access Keys (> 90 days)
    if (cfg.last_key_rotation_days && cfg.last_key_rotation_days > 90) {
      findings.push({
        id: `finding-${scanId}-iam-key-rot-${res.id}`,
        scanId,
        resourceId: res.id,
        resourceName: name,
        resourceType: type,
        category: 'IAM',
        title: `Unrotated IAM Access Keys (${cfg.last_key_rotation_days} Days Old)`,
        severity: 'MEDIUM',
        evidence: `last_key_rotation_days = ${cfg.last_key_rotation_days} (Exceeds 90-day threshold)`,
        impact: 'Stale programmatic keys increase the probability of unnoticed key leaks, code repo exposure, or departed employee retention.',
        riskExplanation: 'Security compliance standards (CIS AWS Benchmark 1.14) require periodic 90-day access key rotation.',
        recommendedAction: 'Rotate active access key and decommission inactive credentials.',
        remediationSteps: [
          'Generate a new secondary access key.',
          'Update downstream applications and CI/CD pipelines to adopt the new key.',
          'Deactivate and delete the older key.'
        ],
        scoreImpact: 4,
        createdAt: new Date().toISOString()
      });
    }
  }

  // --- 4. ENCRYPTION RULES ---
  private checkEncryptionRules(res: any, cfg: any, name: string, type: string, findings: SecurityFinding[], scanId: string) {
    // Missing Encryption at Rest
    const hasEncryptionFlag = cfg.encryption !== undefined || cfg.storage_encrypted !== undefined || cfg.encrypted !== undefined;
    const isUnencrypted = cfg.encryption === false || cfg.storage_encrypted === false || cfg.encrypted === false;

    if (hasEncryptionFlag && isUnencrypted) {
      findings.push({
        id: `finding-${scanId}-enc-rest-${res.id}`,
        scanId,
        resourceId: res.id,
        resourceName: name,
        resourceType: type,
        category: 'ENCRYPTION',
        title: 'Missing Encryption at Rest',
        severity: 'HIGH',
        evidence: `encryption = false`,
        impact: 'Underlying persistent storage volumes, disks, and backups are stored in plaintext, violating data privacy compliance standards.',
        riskExplanation: 'Unencrypted data at rest is vulnerable to physical media theft, unauthorized snapshot duplication, and non-compliance with PCI-DSS, HIPAA, and GDPR.',
        recommendedAction: 'Enable server-side encryption using Customer Managed Keys (KMS) or cloud-provider default AES-256 keys.',
        remediationSteps: [
          'Enable Server-Side Encryption (SSE-KMS or SSE-S3) on the resource.',
          'For existing unencrypted volumes/databases, create an encrypted snapshot and restore from it.',
          'Enforce organization-wide SCPs (Service Control Policies) requiring encryption flags upon creation.'
        ],
        scoreImpact: 8,
        cliCommand: type.includes('s3') 
          ? `aws s3api put-bucket-encryption --bucket ${name} --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms"}}]}'`
          : `aws ec2 copy-snapshot --source-region us-east-1 --source-snapshot-id <snap-id> --encrypted --kms-key-id <kms-id>`,
        terraformFix: `server_side_encryption_configuration {\n  rule {\n    apply_server_side_encryption_by_default {\n      sse_algorithm = "aws:kms"\n    }\n  }\n}`,
        createdAt: new Date().toISOString()
      });
    }

    // Missing Encryption in Transit (HTTPS / SSL)
    if (cfg.https_only === false || cfg.enforce_ssl === false) {
      findings.push({
        id: `finding-${scanId}-enc-transit-${res.id}`,
        scanId,
        resourceId: res.id,
        resourceName: name,
        resourceType: type,
        category: 'ENCRYPTION',
        title: 'In-Transit Encryption Not Enforced (HTTP/Plaintext Allowed)',
        severity: 'HIGH',
        evidence: `https_only = false`,
        impact: 'Data sent across networks can be sniffed or altered by intermediate network adversaries.',
        riskExplanation: 'Cloud service endpoints should strictly enforce TLS 1.2+ encryption for all incoming and outbound requests to prevent plaintext data exposure.',
        recommendedAction: 'Enforce HTTPS-only transport on the storage account / API service endpoint.',
        remediationSteps: [
          'Set https_only or enforce_ssl property to true.',
          'Require TLS 1.2 as minimum allowable cipher suite.'
        ],
        scoreImpact: 6,
        cliCommand: `az storage account update --name ${name} --https-only true`,
        createdAt: new Date().toISOString()
      });
    }
  }

  // --- 5. LOGGING & AUDIT RULES ---
  private checkLoggingRules(res: any, cfg: any, name: string, type: string, findings: SecurityFinding[], scanId: string) {
    const isAuditLoggingDisabled = cfg.audit_logging === false || cfg.logging_enabled === false;

    if (isAuditLoggingDisabled) {
      findings.push({
        id: `finding-${scanId}-log-audit-${res.id}`,
        scanId,
        resourceId: res.id,
        resourceName: name,
        resourceType: type,
        category: 'LOGGING',
        title: 'Audit Logging Disabled',
        severity: 'MEDIUM',
        evidence: `audit_logging = false`,
        impact: 'Security operations and forensic analysts cannot track administrative modifications, API invocations, or lateral movements during a security incident.',
        riskExplanation: 'Audit logs provide the fundamental forensic record for security visibility, post-incident investigations, and compliance attestations.',
        recommendedAction: 'Enable centralized audit logging and route logs to a secure, tamper-proof repository.',
        remediationSteps: [
          'Enable audit logging on the cloud resource.',
          'Configure log delivery to an immutable log retention bucket or SIEM system.',
          'Configure alerts for unauthorized configuration anomalies.'
        ],
        scoreImpact: 4,
        cliCommand: type.includes('cloudtrail')
          ? `aws cloudtrail start-logging --name ${name}`
          : `# Enable access/audit logging in provider console or IaC`,
        createdAt: new Date().toISOString()
      });
    }

    // CloudTrail specific checks (multi-region, log validation)
    if (type.includes('cloudtrail')) {
      if (cfg.is_multi_region_trail === false) {
        findings.push({
          id: `finding-${scanId}-log-multiregion-${res.id}`,
          scanId,
          resourceId: res.id,
          resourceName: name,
          resourceType: type,
          category: 'LOGGING',
          title: 'CloudTrail Multi-Region Logging Disabled',
          severity: 'LOW',
          evidence: `is_multi_region_trail = false`,
          impact: 'Actions executed in unused or non-default cloud regions will not be captured, allowing attackers to evade detection.',
          riskExplanation: 'Adversaries often spin up unauthorized resources in unmonitored regions. Multi-region trails capture global control plane activity.',
          recommendedAction: 'Convert CloudTrail trail to multi-region configuration.',
          remediationSteps: [
            'Enable multi-region trail option in CloudTrail configuration.'
          ],
          scoreImpact: 2,
          cliCommand: `aws cloudtrail update-trail --name ${name} --is-multi-region-trail`,
          createdAt: new Date().toISOString()
        });
      }

      if (cfg.log_file_validation_enabled === false) {
        findings.push({
          id: `finding-${scanId}-log-validation-${res.id}`,
          scanId,
          resourceId: res.id,
          resourceName: name,
          resourceType: type,
          category: 'LOGGING',
          title: 'CloudTrail Log File Validation Disabled',
          severity: 'LOW',
          evidence: `log_file_validation_enabled = false`,
          impact: 'Log files could potentially be tampered with or deleted without triggering cryptographic integrity mismatch alerts.',
          riskExplanation: 'Cryptographic digest validation proves that log records have not been altered, modified, or deleted after delivery.',
          recommendedAction: 'Enable log file integrity validation on CloudTrail trails.',
          remediationSteps: [
            'Turn on log file validation on the trail.'
          ],
          scoreImpact: 2,
          cliCommand: `aws cloudtrail update-trail --name ${name} --enable-log-file-validation`,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Calculates a transparent, deterministic risk score from 0 to 100
   * Takes into account severity, exposure, resource sensitivity, and configuration weaknesses.
   */
  public calculateRiskScore(findings: SecurityFinding[]): RiskScoreBreakdown {
    const deductions: ScoreDeduction[] = [];
    let criticalDeduction = 0;
    let highDeduction = 0;
    let mediumDeduction = 0;
    let lowDeduction = 0;

    for (const f of findings) {
      let pts = f.scoreImpact || 5;

      // Sensitive resource multiplier
      const isSensitive = 
        f.resourceName.toLowerCase().includes('prod') || 
        f.resourceName.toLowerCase().includes('ledger') || 
        f.resourceName.toLowerCase().includes('financial') || 
        f.resourceName.toLowerCase().includes('admin');
      if (isSensitive) {
        pts = Math.round(pts * 1.2);
      }

      // Public exposure multiplier
      const isExposed = f.evidence.includes('0.0.0.0/0') || f.evidence.includes('public_access = true');
      if (isExposed) {
        pts = Math.round(pts * 1.15);
      }

      deductions.push({
        reason: `${f.title} on ${f.resourceName}`,
        category: f.category,
        severity: f.severity,
        points: pts,
        resourceName: f.resourceName
      });

      if (f.severity === 'CRITICAL') criticalDeduction += pts;
      else if (f.severity === 'HIGH') highDeduction += pts;
      else if (f.severity === 'MEDIUM') mediumDeduction += pts;
      else if (f.severity === 'LOW') lowDeduction += pts;
    }

    const totalDeductions = criticalDeduction + highDeduction + mediumDeduction + lowDeduction;
    // Bounded between 0 and 100
    const score = Math.max(0, Math.min(100, Math.round(100 - totalDeductions)));

    let rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' = 'EXCELLENT';
    if (score >= 90) rating = 'EXCELLENT';
    else if (score >= 75) rating = 'GOOD';
    else if (score >= 60) rating = 'FAIR';
    else if (score >= 40) rating = 'POOR';
    else rating = 'CRITICAL';

    return {
      score,
      rating,
      deductions,
      criticalDeduction,
      highDeduction,
      mediumDeduction,
      lowDeduction,
      disclaimer: "CloudGuard Relative Rule-based Indicator: The security score represents relative posture against deterministic CIS/NIST cloud baselines and does not guarantee perimeter invulnerability."
    };
  }
}

export const securityEngine = new SecurityEngine();
