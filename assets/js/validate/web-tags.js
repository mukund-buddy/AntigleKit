/* web-tags.js — pure builders for SEO meta tags, robots.txt, sitemap.xml
   and Open Graph markup. No DOM, no network. Node-testable. */

function escAttr(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escText(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* Meta Tag Generator output. t: { title, description, url, image, type,
   siteName, twitterHandle, robots, keywords } — all optional strings. */
export function buildMetaTags(t) {
  var out = [];
  out.push('<title>' + escText(t.title || '') + '</title>');
  if (t.description) out.push('<meta name="description" content="' + escAttr(t.description) + '">');
  if (t.robots) out.push('<meta name="robots" content="' + escAttr(t.robots) + '">');
  if (t.keywords) out.push('<meta name="keywords" content="' + escAttr(t.keywords) + '">');
  if (t.url) out.push('<link rel="canonical" href="' + escAttr(t.url) + '">');
  if (t.title) out.push('<meta property="og:title" content="' + escAttr(t.title) + '">');
  if (t.description) out.push('<meta property="og:description" content="' + escAttr(t.description) + '">');
  if (t.type) out.push('<meta property="og:type" content="' + escAttr(t.type) + '">');
  if (t.url) out.push('<meta property="og:url" content="' + escAttr(t.url) + '">');
  if (t.image) out.push('<meta property="og:image" content="' + escAttr(t.image) + '">');
  if (t.siteName) out.push('<meta property="og:site_name" content="' + escAttr(t.siteName) + '">');
  if (t.title) out.push('<meta name="twitter:card" content="summary_large_image">');
  if (t.twitterHandle) out.push('<meta name="twitter:site" content="' + escAttr(t.twitterHandle) + '">');
  if (t.title) out.push('<meta name="twitter:title" content="' + escAttr(t.title) + '">');
  if (t.description) out.push('<meta name="twitter:description" content="' + escAttr(t.description) + '">');
  if (t.image) out.push('<meta name="twitter:image" content="' + escAttr(t.image) + '">');
  return out.join('\n');
}

/* robots.txt output. t: { userAgents: string[], allow: string[],
   disallow: string[], sitemap: string } */
export function buildRobotsTxt(t) {
  var out = [];
  var agents = Array.isArray(t.userAgents) && t.userAgents.length ? t.userAgents : ['*'];
  agents.forEach(function (ua, i) {
    out.push(i > 0 ? '' : '# robots.txt for ' + escText(t.siteUrl || 'this site'));
    out.push('User-agent: ' + (String(ua).trim() || '*'));
    (t.allow || []).forEach(function (p) { if (String(p).trim()) out.push('Allow: ' + String(p).trim()); });
    (t.disallow || []).forEach(function (p) { if (String(p).trim()) out.push('Disallow: ' + String(p).trim()); });
  });
  if (t.sitemap) out.push('');
  if (t.sitemap) out.push('Sitemap: ' + String(t.sitemap).trim());
  return out.join('\n');
}

/* sitemap.xml output from a list of absolute URLs. */
export function buildSitemapXml(urls) {
  var lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  urls.forEach(function (u) {
    var clean = String(u).trim();
    if (!clean) return;
    lines.push('  <url>');
    lines.push('    <loc>' + escText(clean) + '</loc>');
    lines.push('  </url>');
  });
  lines.push('</urlset>');
  return lines.join('\n');
}

/* Open Graph / social preview markup. t: { title, description, url,
   image, type, siteName } */
export function buildOpenGraph(t) {
  var out = [];
  if (t.title) out.push('<meta property="og:title" content="' + escAttr(t.title) + '">');
  if (t.description) out.push('<meta property="og:description" content="' + escAttr(t.description) + '">');
  if (t.type) out.push('<meta property="og:type" content="' + escAttr(t.type) + '">');
  if (t.url) out.push('<meta property="og:url" content="' + escAttr(t.url) + '">');
  if (t.image) out.push('<meta property="og:image" content="' + escAttr(t.image) + '">');
  if (t.siteName) out.push('<meta property="og:site_name" content="' + escAttr(t.siteName) + '">');
  return out.join('\n');
}
