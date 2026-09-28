/**
 * CloudGuard Sample Multi-Cloud Infrastructure Configuration
 * Contains both intentionally vulnerable resources and hardened secure resources.
 */
export const SAMPLE_CLOUD_CONFIG = {
  organization: "Acme FinTech Cloud Infrastructure",
  environment: "Production-US-East",
  scanned_at: new Date().toISOString(),
  resources: [
    // --- 1. STORAGE VULNERABILITIES ---
    {
      id: "s3-customer-archive-prod",
      name: "acme-customer-financial-archive-prod",
      type: "aws_s3_bucket",
      provider: "AWS",
      service: "S3",
      public_access: true,
      block_public_access: false,
      acl: "public-read",
      encryption: false,
      versioning: false,
      audit_logging: false,
      tags: { Environment: "Production", Compliance: "PCI-DSS" }
    },
    {
      id: "azure-blob-contracts",
      name: "acmelegalblobcontracts",
      type: "azure_storage_account",
      provider: "Azure",
      service: "Blob Storage",
      public_access: true,
      allow_blob_public_access: true,
      encryption: true,
      audit_logging: false,
      https_only: false,
      tags: { Department: "Legal", Confidentiality: "High" }
    },
    {
      id: "gcp-bucket-backups-dev",
      name: "acme-infra-database-backups-staging",
      type: "gcp_storage_bucket",
      provider: "GCP",
      service: "Cloud Storage",
      public_access: true,
      uniform_bucket_level_access: false,
      encryption: false,
      audit_logging: false,
      tags: { Environment: "Staging" }
    },

    // --- 2. NETWORK VULNERABILITIES ---
    {
      id: "sg-app-bastion-public",
      name: "sg-production-bastion-host",
      type: "aws_security_group",
      provider: "AWS",
      service: "VPC",
      ingress_rules: [
        {
          protocol: "tcp",
          port: 22,
          cidr_ip: "0.0.0.0/0",
          description: "SSH exposed to the public internet"
        },
        {
          protocol: "tcp",
          port: 3389,
          cidr_ip: "0.0.0.0/0",
          description: "RDP exposed to the public internet"
        },
        {
          protocol: "tcp",
          port: 80,
          cidr_ip: "0.0.0.0/0",
          description: "Unencrypted HTTP"
        }
      ],
      tags: { Role: "Bastion", Tier: "Management" }
    },
    {
      id: "azure-nsg-database-tier",
      name: "nsg-payment-postgres-db",
      type: "azure_network_security_group",
      provider: "Azure",
      service: "Virtual Network",
      security_rules: [
        {
          name: "Allow-Postgres-Anywhere",
          destination_port_range: "5432",
          source_address_prefix: "0.0.0.0/0",
          access: "Allow",
          direction: "Inbound",
          protocol: "Tcp"
        }
      ],
      tags: { App: "PaymentGateway" }
    },

    // --- 3. IAM VULNERABILITIES ---
    {
      id: "iam-policy-super-admin-wildcard",
      name: "AcmeDevOpsAdminOverprivilegedRole",
      type: "aws_iam_policy",
      provider: "AWS",
      service: "IAM",
      policy_document: {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AllowEverythingAnywhere",
            Effect: "Allow",
            Action: "*",
            Resource: "*"
          }
        ]
      },
      mfa_required: false,
      tags: { Team: "DevOps" }
    },
    {
      id: "iam-user-legacy-developer",
      name: "contractor-deploy-agent",
      type: "aws_iam_user",
      provider: "AWS",
      service: "IAM",
      mfa_enabled: false,
      access_keys_active: true,
      last_key_rotation_days: 412,
      attached_policies: ["AdministratorAccess", "AmazonS3FullAccess"],
      tags: { Status: "Legacy" }
    },
    {
      id: "gcp-iam-owner-service-account",
      name: "sa-pipeline-deployer@acme-prod.iam.gserviceaccount.com",
      type: "gcp_service_account",
      provider: "GCP",
      service: "IAM",
      roles: ["roles/owner", "roles/resourcemanager.organizationAdmin"],
      key_rotation_enabled: false,
      tags: { Service: "CI-CD" }
    },

    // --- 4. ENCRYPTION VULNERABILITIES ---
    {
      id: "rds-prod-mysql-transaction-db",
      name: "acme-core-ledger-mysql-primary",
      type: "aws_db_instance",
      provider: "AWS",
      service: "RDS",
      engine: "mysql",
      storage_encrypted: false,
      encryption: false,
      publicly_accessible: true,
      audit_logging: false,
      auto_minor_version_upgrade: false,
      tags: { Environment: "Production", DataClassification: "Restricted" }
    },
    {
      id: "ebs-app-volume-unencrypted",
      name: "vol-0a91fbc88921ec901",
      type: "aws_ebs_volume",
      provider: "AWS",
      service: "EC2",
      encrypted: false,
      encryption: false,
      size_gb: 500,
      tags: { Volume: "AppData" }
    },

    // --- 5. LOGGING VULNERABILITIES ---
    {
      id: "cloudtrail-global-events",
      name: "acme-global-audit-trail-primary",
      type: "aws_cloudtrail",
      provider: "AWS",
      service: "CloudTrail",
      audit_logging: false,
      logging_enabled: false,
      is_multi_region_trail: false,
      log_file_validation_enabled: false,
      tags: { Scope: "OrganizationAudit" }
    },
    {
      id: "azure-app-service-gateway",
      name: "api-customer-portal-app",
      type: "azure_app_service",
      provider: "Azure",
      service: "App Service",
      audit_logging: false,
      http_logs_enabled: false,
      detailed_error_logging: false,
      enforce_ssl: true,
      tags: { App: "CustomerPortal" }
    },

    // --- 6. HARDENED & SECURE RESOURCES ---
    {
      id: "s3-compliance-vault-cold",
      name: "acme-sec-compliance-evidence-vault",
      type: "aws_s3_bucket",
      provider: "AWS",
      service: "S3",
      public_access: false,
      block_public_access: true,
      acl: "private",
      encryption: true,
      kms_key_id: "arn:aws:kms:us-east-1:123456789012:key/sec-vault-key",
      versioning: true,
      audit_logging: true,
      tags: { SecurityTier: "Gold", Compliance: "SOC2-Type2" }
    },
    {
      id: "sg-internal-alb-secured",
      name: "sg-private-application-loadbalancer",
      type: "aws_security_group",
      provider: "AWS",
      service: "VPC",
      ingress_rules: [
        {
          protocol: "tcp",
          port: 443,
          cidr_ip: "10.0.0.0/16",
          description: "TLS traffic restricted to corporate internal VPC"
        }
      ],
      tags: { Tier: "Private-ALB" }
    },
    {
      id: "iam-policy-finance-auditor",
      name: "FinanceAuditorReadOnlyPolicy",
      type: "aws_iam_policy",
      provider: "AWS",
      service: "IAM",
      policy_document: {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "ReadOnlyAuditAccess",
            Effect: "Allow",
            Action: [
              "s3:GetBucketLocation",
              "s3:ListBucket",
              "s3:GetObject"
            ],
            Resource: "arn:aws:s3:::acme-finance-reports/*"
          }
        ]
      },
      mfa_required: true,
      tags: { Compliance: "SOX" }
    },
    {
      id: "rds-postgres-vault-prod",
      name: "acme-auth-postgres-secure-replica",
      type: "aws_db_instance",
      provider: "AWS",
      service: "RDS",
      engine: "postgres",
      storage_encrypted: true,
      encryption: true,
      kms_key_id: "arn:aws:kms:us-east-1:123456789012:key/rds-cluster-key",
      publicly_accessible: false,
      audit_logging: true,
      tags: { Tier: "DataVault", Environment: "Production" }
    },
    {
      id: "azure-keyvault-hsm",
      name: "acme-corp-prod-keyvault-hsm",
      type: "azure_key_vault",
      provider: "Azure",
      service: "Key Vault",
      purge_protection_enabled: true,
      soft_delete_retention_days: 90,
      public_network_access: "Disabled",
      encryption: true,
      audit_logging: true,
      tags: { SecurityLevel: "FIPS-140-2" }
    },
    {
      id: "gcp-cloud-kms-keyring",
      name: "acme-prod-crypto-keyring-us",
      type: "gcp_kms_keyring",
      provider: "GCP",
      service: "Cloud KMS",
      rotation_period: "7776000s",
      encryption: true,
      audit_logging: true,
      tags: { SecurityDomain: "Cryptography" }
    },
    {
      id: "aws-waf-protection-core",
      name: "waf-core-api-shield",
      type: "aws_wafv2_web_acl",
      provider: "AWS",
      service: "WAF",
      managed_rule_groups: ["AWSManagedRulesCommonRuleSet", "AWSManagedRulesKnownBadInputsRuleSet"],
      default_action: "Block",
      audit_logging: true,
      tags: { SecurityTier: "EdgeDefense" }
    },
    {
      id: "aws-guardduty-detector-prod",
      name: "guardduty-threat-detector-useast1",
      type: "aws_guardduty_detector",
      provider: "AWS",
      service: "GuardDuty",
      status: "ENABLED",
      finding_publishing_frequency: "FIFTEEN_MINUTES",
      audit_logging: true,
      tags: { ThreatIntel: "Active" }
    },
    {
      id: "azure-storage-customer-documents",
      name: "acmecustomersecurestorage",
      type: "azure_storage_account",
      provider: "Azure",
      service: "Blob Storage",
      public_access: false,
      allow_blob_public_access: false,
      encryption: true,
      https_only: true,
      minimum_tls_version: "TLS1_2",
      audit_logging: true,
      tags: { Tier: "ProtectedStorage" }
    },
    {
      id: "gcp-vpc-secure-subnet-prod",
      name: "vpc-prod-private-subnet-app",
      type: "gcp_compute_network",
      provider: "GCP",
      service: "VPC",
      private_google_access: true,
      flow_logs_enabled: true,
      audit_logging: true,
      tags: { NetworkTier: "Private" }
    }
  ]
};
