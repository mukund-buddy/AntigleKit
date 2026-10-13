/* sitemap-generator.js — build sitemap.xml from a base URL + paths.
   CSP-safe. */
import { buildSitemapXml } from '../validate/web-tags.js';

const $ = (id) => document.getElementById(id);

function render() {
  const out = $('spOut');
  const detected = $('spDetected');
  const note = $('spNote');

  const base = $('sBase').value.trim().replace(/\/+$/, '');
  const rawPaths = String($('sPaths').value).split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  const seen = {};
  const urls = [];

  rawPaths.forEach(function (p) {
    if (/^https?:\/\//i.test(p)) {
      if (!seen[p]) { seen[p] = true; urls.push(p); }
      return;
    }
    const full = base + '/' + p.replace(/^\/+/, '');
    if (!seen[full]) { seen[full] = true; urls.push(full); }
  });

  out.textContent = buildSitemapXml(urls);

  if (!urls.length) {
    detected.className = 'chk-detected is-error';
    detected.textContent = 'No paths yet — add one per line in the paths box.';
    note.textContent = '';
    return;
  }

  const skipped = rawPaths.length - urls.length;
  detected.className = 'chk-detected';
  detected.textContent = urls.length + ' unique URL' + (urls.length === 1 ? '' : 's') +
    (skipped ? ' (' + skipped + ' duplicate' + (skipped === 1 ? '' : 's') + ' merged)' : '') + '.';
  note.textContent = urls.length > 50000
    ? 'Over 50,000 URLs — split this sitemap into an index file.'
    : 'Save as sitemap.xml, upload it to your site root, then submit it in Search Console.';
}

function wire() {
  $('fGenerate').addEventListener('click', render);
  ['sBase', 'sPaths'].forEach(function (id) { $(id).addEventListener('input', render); });
  $('fSample').addEventListener('click', function () {
    $('sBase').value = 'https://yourdomain.example';
    $('sPaths').value = '/\n/tools/\n/tools/json-formatter/\n/tools/json-validator/\n/about/\n/privacy/';
    render();
  });
  $('fDownload').addEventListener('click', function () {
    const blob = new Blob([$('spOut').textContent], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sitemap.xml';
    a.click();
    URL.revokeObjectURL(a.href);
  });
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