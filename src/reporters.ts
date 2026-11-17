import type { AuditIssue, AuditReport, ReportFormat } from './types';

export function formatTextReport(report: AuditReport): string {
  const lines: string[] = [];
  lines.push(`OpenSEO Kit audit report`);
  lines.push(`Target: ${report.target}`);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`SEO score: ${report.summary.score}/100`);
  lines.push(`Errors: ${report.summary.errors} | Warnings: ${report.summary.warnings}`);
  lines.push('');

  if (report.issues.length === 0) {
    lines.push('No issues detected.');
    return lines.join('\n');
  }

  for (const issue of report.issues) {
    lines.push(`${issue.severity.toUpperCase()} | ${issue.id} | ${issue.location ?? 'page'}`);
    lines.push(`  ${issue.message}`);
    lines.push(`  Recommendation: ${issue.recommendation}`);
    lines.push('');
  }

  return lines.join('\n').trim();
}

export function formatJsonReport(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatReport(report: AuditReport, format: ReportFormat = 'text'): string {
  return format === 'json' ? formatJsonReport(report) : formatTextReport(report);
}
