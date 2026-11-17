#!/usr/bin/env node

import * as fs from 'node:fs';

import { auditHtml, analyzeRobotsTxt, analyzeSitemapXml } from './audit';
import { formatReport } from './reporters';

function printUsage(): void {
  console.log(`OpenSEO Kit CLI

Usage: openseokit <path-to-html-or-url> [--format text|json] [--base-url https://example.com]`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  const target = args[0];
  const format = (args.find((arg) => arg.startsWith('--format='))?.split('=')[1] ?? 'text') as 'text' | 'json';
  const baseUrl = args.find((arg) => arg.startsWith('--base-url='))?.split('=')[1] ?? 'https://example.com';

  try {
    let html = '';
    let resolvedTarget = target;

    if (target.startsWith('http://') || target.startsWith('https://')) {
      const response = await fetch(target);
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      html = await response.text();
    } else {
      if (!fs.existsSync(target)) throw new Error(`File not found: ${target}`);
      html = fs.readFileSync(target, 'utf8');
      resolvedTarget = target;
    }

    const robotsTxt = fs.existsSync('robots.txt') ? fs.readFileSync('robots.txt', 'utf8') : '';
    const sitemapXml = fs.existsSync('sitemap.xml') ? fs.readFileSync('sitemap.xml', 'utf8') : '';

    const report = auditHtml(html, { baseUrl, robotsTxt, sitemapXml });
    const robotsIssues = robotsTxt ? analyzeRobotsTxt(robotsTxt) : [];
    const sitemapIssues = sitemapXml ? analyzeSitemapXml(sitemapXml) : [];
    report.issues.push(...robotsIssues, ...sitemapIssues);
    report.summary.errors = report.issues.filter((issue) => ['critical', 'high'].includes(issue.severity)).length;
    report.summary.warnings = report.issues.filter((issue) => ['medium', 'low'].includes(issue.severity)).length;

    console.log(formatReport(report, format));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`OpenSEO Kit error: ${message}`);
    process.exitCode = 1;
  }
}

void main();
