# OpenSEO Kit

OpenSEO Kit is a technical SEO auditing library for validating metadata, structure, canonical setup, robots directives, sitemaps and social tags.

## Features
- Meta title and description validation
- Canonical URL validation
- Robots.txt analysis
- XML sitemap validation
- Heading structure analysis
- Internal link checks
- Indexability checks
- Hreflang validation hooks
- Open Graph validation
- Structured data detection
- Exportable audit reports

## Installation

```bash
npm install @jagmohan-kurmi/openseokit
```

## Quick start

```js
const { auditHtml, formatReport } = require('@jagmohan-kurmi/openseokit');

const html = '<html><head><title>Example page</title><meta name="description" content="Example description" /></head><body><h1>Example</h1></body></html>';
const report = auditHtml(html, { baseUrl: 'https://example.com/page' });
console.log(formatReport(report, 'json'));
```

## CLI

```bash
npx openseokit ./example.html --format text --base-url https://example.com/page
```
