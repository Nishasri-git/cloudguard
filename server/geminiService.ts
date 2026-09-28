import { GoogleGenAI } from '@google/genai';
import { SecurityFinding } from '../src/types/security.js';

// Pre-defined high fidelity cybersecurity fallback templates accurately mapped by specific security topics
interface FallbackTemplate {
  explanation: string;
  whyItMatters: string;
  practicalFix: string;
}

const TOPIC_FALLBACKS: Record<string, FallbackTemplate> = {
  // Network: Database Ports (5432, 3306, 1433)
  DATABASE_PORT: {
    explanation: "A production database listener (PostgreSQL/MySQL/MSSQL) is directly reachable from the public internet (0.0.0.0/0). Any remote host can attempt connections against the database engine.",
    whyItMatters: "Direct internet exposure of relational databases invites persistent SQL authentication brute-forcing, zero-day exploit attempts against database daemon software, and potential data exfiltration.",
    practicalFix: "Remove the public CIDR (0.0.0.0/0) inbound rule immediately. Confine the database to a private isolated subnet accessible only from authorized application tier security groups or VPN tunnels."
  },
  // Network: SSH (Port 22)
  SSH_PORT: {
    explanation: "Secure Shell (SSH Port 22) administrative access is exposed to the entire internet (0.0.0.0/0), allowing unrestricted external connection handshakes.",
    whyItMatters: "Port 22 is continuously swept by automated global botnets executing dictionary credential stuffing and looking for unpatched OpenSSH vulnerabilities.",
    practicalFix: "Revoke 0.0.0.0/0 ingress on port 22. Restrict SSH access strictly to corporate VPN/bastion static IPs, or adopt cloud-native identity-aware session managers like AWS SSM Session Manager or Azure Bastion."
  },
  // Network: RDP (Port 3389)
  RDP_PORT: {
    explanation: "Windows Remote Desktop Protocol (RDP Port 3389) is open to the public internet without an encrypted management gateway.",
    whyItMatters: "Public RDP endpoints are the number one initial access vector for enterprise ransomware gangs, password spraying, and BlueKeep-style remote code execution exploits.",
    practicalFix: "Delete public 0.0.0.0/0 RDP rules. Route administrative sessions through Azure Bastion or corporate VPN with mandatory multi-factor authentication (MFA)."
  },
  // Network: Plaintext HTTP
  HTTP_PORT: {
    explanation: "Unencrypted HTTP (Port 80) traffic is accepted without automatic redirection to secure TLS/HTTPS.",
    whyItMatters: "Cleartext HTTP traffic across untrusted network hops can be intercepted or manipulated through man-in-the-middle (MitM) attacks, leaking session tokens and credentials.",
    practicalFix: "Configure application load balancers and web servers to issue HTTP 301 redirects to HTTPS on port 443 with HSTS headers."
  },
  // Storage: Public Buckets / Blobs
  PUBLIC_STORAGE: {
    explanation: "This cloud storage container (S3/Azure Blob/GCS) permits unauthenticated public reads or public ACLs, making stored data discoverable without authorization.",
    whyItMatters: "Public cloud storage misconfiguration is a primary vector for catastrophic enterprise data breaches, regulatory fines (GDPR, HIPAA, PCI-DSS), and proprietary intellectual property theft.",
    practicalFix: "Enable account/bucket-level 'Block Public Access', revoke public-read ACLs, and restrict object access strictly to authenticated IAM roles or short-lived presigned URLs."
  },
  // Storage: Versioning
  VERSIONING: {
    explanation: "Object versioning is disabled on this storage bucket, leaving stored files vulnerable to irreversible overwrites or accidental deletion.",
    whyItMatters: "Without versioning, objects corrupted by ransomware or deleted by human error cannot be recovered to a known good state.",
    practicalFix: "Enable object versioning on the storage bucket and configure lifecycle retention policies for historical versions."
  },
  // IAM: Wildcard / Excessive Admin Permissions
  WILDCARD_IAM: {
    explanation: "Identity access policies grant wildcard '*' actions or resources, conferring unrestricted administrative authority across cloud APIs.",
    whyItMatters: "If credentials attached to this identity leak or are compromised, attackers gain complete privilege escalation and tenant takeover capability without barrier.",
    practicalFix: "Refactor policy statements to grant strictly the minimal set of specific API actions and target resource ARNs necessary for functional workload duties."
  },
  // IAM: MFA & Key Rotation
  IAM_HYGIENE: {
    explanation: "IAM user identities lack multi-factor authentication enforcement or maintain unrotated programmatic access keys exceeding compliance limits.",
    whyItMatters: "Single-factor credentials and stale access keys stored in source repositories or developer laptops are readily harvested and weaponized by attackers.",
    practicalFix: "Mandate hardware/virtual MFA on all console identities and establish automated 90-day rotation for all active programmatic API keys."
  },
  // Encryption: At Rest & In Transit
  ENCRYPTION: {
    explanation: "The resource does not enforce server-side encryption at rest using managed cryptographic keys or allows unencrypted transmission.",
    whyItMatters: "Plaintext volumes, databases, or snapshots violate major security frameworks (SOC2, PCI-DSS) and risk exposure during underlying hardware decommissioning or unauthorized snapshot copying.",
    practicalFix: "Enable cloud KMS (Key Management Service) encryption with Customer Managed Keys (CMK) or AES-256 for all disks and database instances, and mandate TLS 1.2+."
  },
  // Logging & Auditing
  LOGGING: {
    explanation: "Centralized audit logging (CloudTrail, Activity Logs, or VPC Flow Logs) is disabled, unconfigured, or restricted to a single region.",
    whyItMatters: "Without continuous control-plane audit logs, security teams cannot detect lateral movement, identify attacker entry points, or perform post-incident forensic investigations.",
    practicalFix: "Enable global multi-region audit logging with log file integrity validation enabled and configure delivery to an immutable, access-controlled log archive."
  }
};

function getTopicKey(finding: SecurityFinding): string {
  const title = finding.title.toLowerCase();
  const evidence = finding.evidence.toLowerCase();
  const cat = finding.category;

  if (cat === 'NETWORK') {
    if (title.includes('database') || title.includes('5432') || title.includes('3306') || title.includes('1433') || title.includes('publicly accessible')) {
      return 'DATABASE_PORT';
    }
    if (title.includes('ssh') || evidence.includes('22')) {
      return 'SSH_PORT';
    }
    if (title.includes('rdp') || evidence.includes('3389')) {
      return 'RDP_PORT';
    }
    if (title.includes('http') || evidence.includes('80')) {
      return 'HTTP_PORT';
    }
    return 'DATABASE_PORT';
  }

  if (cat === 'STORAGE') {
    if (title.includes('versioning')) return 'VERSIONING';
    return 'PUBLIC_STORAGE';
  }

  if (cat === 'IAM') {
    if (title.includes('mfa') || title.includes('key') || title.includes('rotation')) return 'IAM_HYGIENE';
    return 'WILDCARD_IAM';
  }

  if (cat === 'ENCRYPTION') {
    return 'ENCRYPTION';
  }

  if (cat === 'LOGGING') {
    return 'LOGGING';
  }

  return 'PUBLIC_STORAGE';
}

export class GeminiSecurityService {
  private ai: GoogleGenAI | null = null;
  private hasKey: boolean = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        this.hasKey = true;
      } catch (e) {
        console.warn('[CloudGuard AI] Failed to initialize Gemini SDK:', e);
        this.ai = null;
        this.hasKey = false;
      }
    } else {
      console.log('[CloudGuard AI] No active GEMINI_API_KEY detected. Using deterministic fallback cybersecurity templates.');
    }
  }

  /**
   * Explains a specific security finding in plain language and refines remediation wording.
   * Note: The rule engine has ALREADY determined vulnerability existence and severity!
   * Gemini is strictly used for natural language explanation and remediation guidance.
   */
  public async explainFinding(finding: SecurityFinding): Promise<{
    explanation: string;
    whyItMatters: string;
    remediationGuidance: string;
    isAiGenerated: boolean;
  }> {
    if (!this.ai || !this.hasKey) {
      return this.getFallbackExplanation(finding);
    }

    try {
      const prompt = `
You are the CloudGuard Security Assistant. A deterministic rule engine detected the following cloud misconfiguration.
Do NOT question the severity or existence of the finding. Your role is solely to explain the risk clearly to an engineer and provide precise remediation guidance.

FINDING DETAILS:
- Title: ${finding.title}
- Severity: ${finding.severity}
- Category: ${finding.category}
- Resource: ${finding.resourceName} (${finding.resourceType})
- Evidence: ${finding.evidence}
- Impact: ${finding.impact}

Please provide a concise, high-impact assessment with three distinct sections:
1. WHAT THIS MEANS: Plain language breakdown of what this configuration issue actually is in clear engineering terms.
2. WHY IT MATTERS: The attacker perspective and realistic threat scenarios (e.g. data breach, lateral movement, ransomware).
3. RECOMMENDED FIX: Step-by-step remediation guidance tailored to this resource and cloud provider.

Keep the response structured and professional. No fluff or unnecessary preambles.
`;

      // Timeout protection (5 seconds) so the UI responds immediately with accurate fallback if network/API delays
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out')), 4500)
      );

      const apiPromise = this.ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          systemInstruction: "You are a senior cloud security architect explaining rule-based security findings in a professional DevSecOps dashboard."
        }
      });

      const response: any = await Promise.race([apiPromise, timeoutPromise]);

      const text = response?.text;
      if (text && text.trim().length > 30) {
        return {
          explanation: text,
          whyItMatters: "Identified by CloudGuard Rule Engine & analyzed by Gemini Security AI.",
          remediationGuidance: finding.recommendedAction,
          isAiGenerated: true
        };
      }

      return this.getFallbackExplanation(finding);
    } catch (err: any) {
      console.warn(`[CloudGuard AI] Error calling Gemini for finding ${finding.id}:`, err?.message || err);
      return this.getFallbackExplanation(finding);
    }
  }

  private getFallbackExplanation(finding: SecurityFinding): {
    explanation: string;
    whyItMatters: string;
    remediationGuidance: string;
    isAiGenerated: boolean;
  } {
    const key = getTopicKey(finding);
    const fallback = TOPIC_FALLBACKS[key] || TOPIC_FALLBACKS.PUBLIC_STORAGE;
    return {
      explanation: `${finding.riskExplanation}\n\n${fallback.explanation}`,
      whyItMatters: fallback.whyItMatters,
      remediationGuidance: fallback.practicalFix,
      isAiGenerated: false
    };
  }
}

export const geminiService = new GeminiSecurityService();
