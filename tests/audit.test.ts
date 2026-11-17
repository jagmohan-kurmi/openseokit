import test from 'node:test';
import assert from 'node:assert/strict';

import { auditHtml, analyzeRobotsTxt, analyzeSitemapXml } from '../src/audit';
import { formatReport } from '../src/reporters';

test('auditHtml reports missing title, description, canonical and heading issues', () => {
  const html = `
    <html>
      <head>
        <meta name="robots" content="noindex"/>
      </head>
      <body>
        <h2>Bad heading</h2>
        <a href="/about">About</a>
      </body>
    </html>
  `;

  const report = auditHtml(html, { baseUrl: 'https://example.com' });
  assert.ok(report.issues.some((issue) => issue.id === 'missing-title'));
  assert.ok(report.issues.some((issue) => issue.id === 'missing-description'));
  assert.ok(report.issues.some((issue) => issue.id === 'canonical-url'));
  assert.ok(report.issues.some((issue) => issue.id === 'heading-structure'));
  assert.ok(report.issues.some((issue) => issue.id === 'noindex'));
});

test('analyzeRobotsTxt and analyzeSitemapXml detect missing robot or sitemap structure', () => {
  const robots = 'User-agent: *\nAllow: /\n';
  const sitemap = '<xml></xml>';

  assert.ok(analyzeRobotsTxt(robots).some((issue) => issue.id === 'robots-disallow'));
  assert.ok(analyzeSitemapXml(sitemap).some((issue) => issue.id === 'sitemap-root'));
});

test('formatReport renders JSON output', () => {
  const report = auditHtml('<html><head><title>Example page</title><meta name="description" content="Example description"/><link rel="canonical" href="https://example.com/page"/><meta property="og:title" content="Example page"/><meta property="og:description" content="Example description"/><meta property="og:type" content="website"/></head><body><h1>Example</h1><a href="https://example.com/about">About</a></body></html>', { baseUrl: 'https://example.com/page' });
  const output = formatReport(report, 'json');
  assert.ok(output.includes('"target": "https://example.com/page"'));
  assert.ok(output.includes('"score"'));
});
