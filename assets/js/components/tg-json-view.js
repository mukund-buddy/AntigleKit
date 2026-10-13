/* tg-json-view.js — read-only, syntax-highlighted JSON preview.
   Renders into light DOM so page CSS (.tok-*) applies.
   Every token is HTML-escaped before injection — input is always data. */
class TgJsonView extends HTMLElement {
  connectedCallback() {
    if (this._built) return;
    this._built = true;

    const scroller = document.createElement('div');
    scroller.className = 'json-scroll';
    scroller.setAttribute('role', 'region');
    scroller.setAttribute('aria-label', this.getAttribute('aria-label') || 'JSON output');
    this.appendChild(scroller);
    this._scroller = scroller;
  }

  /* Accepts a JSON-compatible object or a JSON string. */
  setData(data) {
    if (!this._built) this.connectedCallback();
    let json;
    try {
      json = typeof data === 'string' ? JSON.stringify(JSON.parse(data), null, 2) : JSON.stringify(data, null, 2);
    } catch (_) {
      this._scroller.textContent = 'Invalid JSON.';
      return;
    }
    this._scroller.innerHTML = this._tokenize(json);
  }

  _esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  _tokenize(json) {
    const re = /("(?:[^"\\]|\\.)*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
    let out = '';
    let last = 0;
    let m;
    while ((m = re.exec(json)) !== null) {
      out += this._esc(json.slice(last, m.index));
      const tok = m[0];
      let cls = 'tok-num';
      if (tok[0] === '"') cls = 'tok-key';
      else if (tok === 'true' || tok === 'false') cls = 'tok-bool';
      else if (tok === 'null') cls = 'tok-null';
      // Keys (before ':') are colored as keys, values as strings:
      if (cls === 'tok-key') {
        const nextChar = json.slice(m.index + tok.length).replace(/^\s*/, '')[0];
        cls = nextChar === ':' ? 'tok-key' : 'tok-string';
      }
      out += '<span class="' + cls + '">' + this._esc(tok) + '</span>';
      last = re.lastIndex;
    }
    out += this._esc(json.slice(last));
    return out;
  }
}

customElements.define('tg-json-view', TgJsonView);