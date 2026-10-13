/* robots-generator.js — build robots.txt from user agents, allow /
   disallow lists, and a sitemap reference. CSP-safe. */
import { buildRobotsTxt } from '../validate/web-tags.js';

const $ = (id) => document.getElementById(id);

function lines(value) {
  return String(value || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
}

function render() {
  const out = $('rbOut');
  const detected = $('rbDetected');
  const note = $('rbNote');

  const text = buildRobotsTxt({
    siteUrl: $('rSite').value,
    userAgents: lines($('rAgents').value),
    allow: lines($('rAllow').value),
    disallow: lines($('rDisallow').value),
    sitemap: $('rSitemap').value.trim()
  });
  out.textContent = text;

  const disallowed = lines($('rDisallow').value).length;
  const allowed = lines($('rAllow').value).length;
  const agents = lines($('rAgents').value).length || 1;
  detected.className = 'chk-detected' + (disallowed ? ' is-error' : '');
  detected.textContent = agents + ' user-agent group' + (agents === 1 ? '' : 's') + ', ' +
    disallowed + ' disallow rule' + (disallowed === 1 ? '' : 's') + ', ' +
    allowed + ' allow rule' + (allowed === 1 ? '' : 's') + '.';
  note.textContent = $('rSitemap').value.trim()
    ? 'Save as robots.txt and place it at the root of your site.'
    : 'Tip: add a Sitemap: line — search consoles use it to find your sitemap.';
}

function download() {
  const blob = new Blob([$('rbOut').textContent], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'robots.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}

function wire() {
  $('fGenerate').addEventListener('click', render);
  ['rSite', 'rAgents', 'rDisallow', 'rAllow', 'rSitemap'].forEach(function (id) {
    $(id).addEventListener('input', render);
  });
  $('fSample').addEventListener('click', function () {
    $('rSite').value = 'https://yourdomain.example';
    $('rAgents').value = '*';
    $('rDisallow').value = '/admin/\n/private/\n/checkout/payment';
    $('rAllow').value = '/public/\n/feed/';
    $('rSitemap').value = 'https://yourdomain.example/sitemap.xml';
    render();
  });
  $('fDownload').addEventListener('click', download);
}

function init() {
  render();
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}