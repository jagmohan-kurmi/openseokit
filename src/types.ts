export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ReportFormat = 'text' | 'json';

export interface AuditIssue {
  id: string;
  severity: Severity;
  message: string;
  recommendation: string;
  location?: string;
}

export interface AuditSummary {
  score: number;
  errors: number;
  warnings: number;
  passed: number;
  target: string;
}

export interface AuditReport {
  target: string;
  generatedAt: string;
  issues: AuditIssue[];
  summary: AuditSummary;
}

export interface SeoAuditOptions {
  baseUrl?: string;
  robotsTxt?: string;
  sitemapXml?: string;
}
