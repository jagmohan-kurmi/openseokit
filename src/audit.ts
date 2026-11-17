import * as cheerio from 'cheerio';
import type { AuditIssue, AuditReport, SeoAuditOptions } from './types';

const ISSUE_TEMPLATES = {
  missingTitle: {
    id: 'missing-title',
    severity: 'high',
    message: 'The page is missing a title tag.',
    recommendation: 'Add a unique <title> element between 30 and 60 characters.'
  },
  weakTitle: {
    id: 'title-length',
    severity: 'medium',
    message: 'The title tag length is outside the recommended range.',
    recommendation: 'Keep the title concise and descriptive, ideally 30-60 characters.'
  },
  missingDescription: {
    id: 'missing-description',
    severity: 'medium',
    message: 'The meta description is missing.',
    recommendation: 'Add a meta description that summarizes the page content.'
  },
  canonical: {
    id: 'canonical-url',
    severity: 'medium',
    message: 'A canonical URL is missing or inconsistent with the current page.',
    recommendation: 'Add a self-referential canonical URL to avoid duplicate indexing.'
  },
  h1: {
    id: 'heading-structure',
    severity: 'medium',
    message: 'The page is missing a single clear H1 heading.',
    recommendation: 'Use one primary H1 and maintain a logical heading hierarchy.'
  },
  link: {
    id: 'internal-link-check',
    severity: 'medium',
    message: 'An internal link appears to be broken or unresolved.',
    recommendation: 'Verify the destination URL and fix any missing internal routes.'
  },
  noindex: {
    id: 'noindex',
    severity: 'high',
    message: 'The page includes a noindex directive.',
    recommendation: 'Remove noindex from important pages unless it is intentional.'
  },
  og: {
    id: 'opengraph',
    severity: 'low',
    message: 'Open Graph metadata is incomplete.',
    recommendation: 'Add og:title, og:description, and og:type metadata for social shares.'
  },
  schema: {
    id: 'structured-data',
    severity: 'info',
    message: 'No JSON-LD structured data was found.',
    recommendation: 'Add schema markup where applicable to improve entity understanding.'
  }
} as const;

function normalizeUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

export function auditHtml(html: string, options: SeoAuditOptions = {}): AuditReport {
  const $ = cheerio.load(html);
  const baseUrl = options.baseUrl ?? 'https://example.com';
  const issues: AuditIssue[] = [];

  const title = $('title').first().text().trim();
  if (!title) {
    issues.push({ ...ISSUE_TEMPLATES.missingTitle, location: 'title' });
  } else if (title.length < 30 || title.length > 60) {
    issues.push({ ...ISSUE_TEMPLATES.weakTitle, location: 'title' });
  }

  const metaDescription = $('meta[name="description"]').attr('content')?.trim() ?? '';
  if (!metaDescription) {
    issues.push({ ...ISSUE_TEMPLATES.missingDescription, location: 'meta[name="description"]' });
  }

  const canonicalHref = $('link[rel="canonical"]').attr('href')?.trim() ?? '';
  const pageUrl = $('meta[property="og:url"]').attr('content') ?? baseUrl;
  if (!canonicalHref || normalizeUrl(canonicalHref, baseUrl) !== normalizeUrl(pageUrl, baseUrl)) {
    issues.push({ ...ISSUE_TEMPLATES.canonical, location: 'link[rel="canonical"]' });
  }

  const h1s = $('h1').length;
  if (h1s !== 1) {
    issues.push({ ...ISSUE_TEMPLATES.h1, location: 'h1' });
  }

  const internalLinks = $('a[href]');
  const internalUrls: string[] = [];
  internalLinks.each((_, element) => {
    const href = $(element).attr('href')?.trim() ?? '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const normalized = normalizeUrl(href, baseUrl);
    if (normalized.startsWith(baseUrl) || href.startsWith('/')) {
      internalUrls.push(normalized);
    }
  });

  for (const href of internalUrls) {
    const target = href.endsWith('/') ? href : href.replace(/#.*$/, '');
    if (!target || target === baseUrl || target === `${baseUrl}/`) continue;
    const url = new URL(target);
    if (url.pathname === '/' && url.hostname === new URL(baseUrl).hostname) continue;
    if (!url.pathname || url.pathname === 'undefined') {
      issues.push({ ...ISSUE_TEMPLATES.link, location: href });
    }
  }

  const robotsMeta = $('meta[name="robots"]').attr('content') ?? '';
  if (/noindex/i.test(robotsMeta) || /nofollow/i.test(robotsMeta)) {
    issues.push({ ...ISSUE_TEMPLATES.noindex, location: 'meta[name="robots"]' });
  }

  const ogTitle = $('meta[property="og:title"]').attr('content') ?? '';
  const ogDescription = $('meta[property="og:description"]').attr('content') ?? '';
  const ogType = $('meta[property="og:type"]').attr('content') ?? '';
  if (!ogTitle || !ogDescription || !ogType) {
    issues.push({ ...ISSUE_TEMPLATES.og, location: 'meta[property="og:*"]' });
  }

  const jsonLdCount = $('script[type="application/ld+json"]').length;
  if (jsonLdCount === 0) {
    issues.push({ ...ISSUE_TEMPLATES.schema, location: 'script[type="application/ld+json"]' });
  }

  if (options.robotsTxt) {
    const robotsLines = options.robotsTxt.split(/\r?\n/);
    const maybeDisallow = robotsLines.some((line) => /^Disallow:\s*\//i.test(line));
    if (!maybeDisallow) {
      issues.push({
        id: 'robots-check',
        severity: 'info',
        message: 'Robots.txt does not explicitly block any paths.',
        recommendation: 'Review the file to ensure indexing guidelines match the site goals.',
        location: 'robots.txt'
      });
    }
  }

  if (options.sitemapXml) {
    const sitemapUrlCount = (options.sitemapXml.match(/<loc>/gi) || []).length;
    if (sitemapUrlCount === 0) {
      issues.push({
        id: 'sitemap-xml',
        severity: 'medium',
        message: 'The sitemap XML does not appear to contain valid loc entries.',
        recommendation: 'Ensure the sitemap XML includes one or more URL entries.',
        location: 'sitemap.xml'
      });
    }
  }

  const score = Math.max(0, 100 - issues.reduce((total, issue) => {
    const weight = { critical: 20, high: 12, medium: 6, low: 3, info: 1 }[issue.severity] ?? 1;
    return total + weight;
  }, 0));

  const summary = {
    score,
    errors: issues.filter((issue) => ['critical', 'high'].includes(issue.severity)).length,
    warnings: issues.filter((issue) => ['medium', 'low'].includes(issue.severity)).length,
    passed: Math.max(0, 10 - issues.length),
    target: baseUrl
  };

  return {
    target: baseUrl,
    generatedAt: new Date().toISOString(),
    issues,
    summary
  };
}

export function analyzeRobotsTxt(robotsTxt: string): AuditIssue[] {
  const lines = robotsTxt.split(/\r?\n/);
  const issues: AuditIssue[] = [];
  const userAgents = lines.filter((line) => /^User-agent:/i.test(line));

  if (userAgents.length === 0) {
    issues.push({
      id: 'robots-user-agent',
      severity: 'medium',
      message: 'Robots.txt is missing User-agent entries.',
      recommendation: 'Add explicit User-agent directives to describe crawler access rules.',
      location: 'robots.txt'
    });
  }

  const disallowCount = lines.filter((line) => /^Disallow:\s*\//i.test(line)).length;
  if (disallowCount === 0) {
    issues.push({
      id: 'robots-disallow',
      severity: 'info',
      message: 'There are no Disallow rules in robots.txt.',
      recommendation: 'Review the file and consider whether blocking-sensitive paths is needed.',
      location: 'robots.txt'
    });
  }

  return issues;
}

export function analyzeSitemapXml(xml: string): AuditIssue[] {
  const issues: AuditIssue[] = [];
  if (!/<urlset|<sitemapindex/i.test(xml)) {
    issues.push({
      id: 'sitemap-root',
      severity: 'medium',
      message: 'The XML does not look like a valid sitemap document.',
      recommendation: 'Ensure the sitemap root element is either urlset or sitemapindex.',
      location: 'sitemap.xml'
    });
  }

  if ((xml.match(/<loc>/gi) || []).length < 1) {
    issues.push({
      id: 'sitemap-loc',
      severity: 'high',
      message: 'The sitemap has no URL entries.',
      recommendation: 'Add valid <loc> entries for each page you want indexed.',
      location: 'sitemap.xml'
    });
  }

  return issues;
}
