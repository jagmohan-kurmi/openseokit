const { auditHtml, formatReport } = require('../dist/src');

const html = '<html><head><title>Example</title><meta name="description" content="Example description"/><link rel="canonical" href="https://example.com/example"/><meta property="og:title" content="Example" /><meta property="og:description" content="Example description" /><meta property="og:type" content="website" /></head><body><h1>Example</h1><a href="https://example.com/about">About</a></body></html>';

const report = auditHtml(html, { baseUrl: 'https://example.com/example' });
console.log(formatReport(report, 'json'));
