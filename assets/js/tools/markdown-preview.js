/* markdown-preview.js — live markdown preview (safe DOM renderer).
   CSP-safe: builds nodes with createElement, never innerHTML with user data. */
import { markdownTokens } from '../validate/file-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = [
  '# The Antigle',
  '',
  'A **free** collection of *browser tools*.',
  '',
  '- Works offline-friendly',
  '- Private by design',
  '',
  '> "Crafted with quality and creativity."',
  '',
  '## Code sample',
  '',
  '```js',
  'const tools = 70;',
  '```',
  '',
  '[Visit the home page](/about/)'
].join('\n');

function makeEl(tag, cls, text) {
  var el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

function renderInline(toks, parent) {
  (toks || []).forEach(function (tk) {
    if (tk.t === 'text') parent.appendChild(document.createTextNode(tk.v));
    else if (tk.t === 'code') parent.appendChild(makeEl('code', 'md-code', tk.v));
    else if (tk.t === 'strong') {
      var s = makeEl('strong'); renderInline(tk.c, s); parent.appendChild(s);
    } else if (tk.t === 'em') {
      var e = makeEl('em'); renderInline(tk.c, e); parent.appendChild(e);
    } else if (tk.t === 'link') {
      var a = makeEl('a', 'md-link', null);
      a.href = tk.href;
      a.rel = 'noopener noreferrer';
      a.target = /^(https?:|mailto:)/.test(tk.href) ? '_blank' : '_self';
      if (tk.title) a.title = tk.title;
      renderInline(tk.c, a);
      parent.appendChild(a);
    }
  });
}

function renderBlock(b) {
  var wrap = document.createElement('div');
  if (b.t === 'h') {
    var h = makeEl('h' + Math.min(6, Math.max(1, b.level)));
    renderInline(b.c, h);
    wrap.appendChild(h);
  } else if (b.t === 'p') {
    var p = makeEl('p');
    renderInline(b.c, p);
    wrap.appendChild(p);
  } else if (b.t === 'hr') {
    wrap.appendChild(makeEl('hr'));
  } else if (b.t === 'code') {
    var pre = makeEl('pre', 'md-pre');
    var code = makeEl('code');
    if (b.lang) code.className = 'language-' + b.lang.replace(/[^\w-]/g, '');
    code.textContent = b.v;
    pre.appendChild(code);
    wrap.appendChild(pre);
  } else if (b.t === 'bq') {
    var q = makeEl('blockquote', 'md-quote');
    renderInline(b.c, q);
    wrap.appendChild(q);
  } else if (b.t === 'ul' || b.t === 'ol') {
    var ul = makeEl(b.t);
    (b.items || []).forEach(function (it) {
      var li = makeEl('li');
      renderInline(it.c, li);
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
  }
  return wrap;
}

function render() {
  var input = $('mpInput').value;
  var out = $('mpOut');
  var status = $('mpStatus');

  out.textContent = '';
  if (!input.trim()) {
    status.textContent = '';
    return;
  }

  var blocks = markdownTokens(input);
  blocks.forEach(function (b) {
    out.appendChild(renderBlock(b));
  });

  var words = (input.match(/\S+/g) || []).length;
  status.className = 'chk-detected';
  status.textContent = 'Rendered ' + blocks.length + ' block' + (blocks.length === 1 ? '' : 's') + ' · ' + words + ' word' + (words === 1 ? '' : 's');
}

function wire() {
  $('mpInput').addEventListener('input', render);
  $('fSample').addEventListener('click', function () {
    $('mpInput').value = SAMPLE;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('mpInput').value = '';
    render();
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