/* tools-index.js — renders the approved "build plan" list on /tools/
   from assets/data/tools.json (progressive enhancement; live tools are
   hard-coded in the HTML for SEO, this only fills the upcoming list).
   CSP-safe: DOM APIs + textContent only, no innerHTML with data. */
const PLAN_ORDER = ['minecraft', 'youtube', 'web', 'student', 'design', 'security', 'file'];

function esc(s) {
  return String(s == null ? '' : s);
}

function makeItem(tool) {
  const li = document.createElement('li');
  li.className = 'tool-plan-item';

  const name = document.createElement('span');
  name.className = 'tool-plan-name';
  name.textContent = tool.name;

  const tag = document.createElement('span');
  tag.className = 'tool-plan-tag';
  tag.textContent = tool.tagline || '';

  li.appendChild(name);
  li.appendChild(tag);
  return li;
}

function buildPlan(tools) {
  const host = document.getElementById('toolPlan');
  if (!host) return;

  const approved = tools.filter(function (t) { return t.status === 'planned'; });
  const groups = new Map();
  approved.forEach(function (t) {
    const key = t.category || 'other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  });

  PLAN_ORDER.forEach(function (key) {
    const list = groups.get(key);
    if (!list || !list.length) return;
    list.sort(function (a, b) { return (a.sortOrder || 99) - (b.sortOrder || 99); });

    const section = document.createElement('section');
    section.className = 'tool-plan-cat';

    const head = document.createElement('h3');
    head.className = 'tool-plan-cat-title';
    head.textContent = list[0].categoryLabel || key;

    const ul = document.createElement('ul');
    ul.className = 'tool-plan-list';
    list.forEach(function (t) { ul.appendChild(makeItem(t)); });

    section.appendChild(head);
    section.appendChild(ul);
    host.appendChild(section);
  });

  host.removeAttribute('aria-busy');
}

function siteAsset(p) {
  const css = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'))
    .filter((l) => l.href && l.href.indexOf('/assets/') !== -1)[0];
  if (css && css.href) {
    return css.href.slice(0, css.href.indexOf('/assets/') + 1) + p;
  }
  return p;
}

fetch(siteAsset('assets/data/tools.json'))
  .then(function (r) { if (!r.ok) throw new Error('load failed'); return r.json(); })
  .then(function (data) { buildPlan(data && data.tools ? data.tools : []); })
  .catch(function () {
    const host = document.getElementById('toolPlan');
    if (host) {
      host.textContent = '';
      host.removeAttribute('aria-busy');
    }
  });
