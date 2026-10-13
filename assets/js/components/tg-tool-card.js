/* tg-tool-card.js — renders a catalog card from assets/data/tools.json.
   <tg-tool-card data-tool="manifest-generator"></tg-tool-card>
   DECORATIVE ONLY: use in secondary lists, never for crawlable gold pages.
   Primary catalog markup (/tools/) is written out statically in HTML. */
class TgToolCard extends HTMLElement {
  connectedCallback() {
    if (this._built) return;
    this._built = true;
    this._render();
  }

  siteAsset(p) {
    const css = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'))
      .filter((l) => l.href && l.href.indexOf('/assets/') !== -1)[0];
    if (css && css.href) {
      return css.href.slice(0, css.href.indexOf('/assets/') + 1) + p;
    }
    return p;
  }

  siteHref(h) {
    if (typeof h !== 'string' || h.charAt(0) !== '/') return h;
    return this.siteAsset(h.slice(1));
  }

  async _render() {
    const id = this.getAttribute('data-tool');
    if (!id) return;
    try {
      const res = await fetch(this.siteAsset('assets/data/tools.json'));
      const pack = await res.json();
      const tool = (pack.tools || []).find((t) => t.id === id);
      if (!tool) return;

      const status = tool.status === 'live'
        ? '<span class="status-badge status-badge--live">Live</span>'
        : '<span class="status-badge status-badge--planned">Coming soon</span>';

      const icon = tool.status === 'live'
        ? '<span class="card-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></svg></span>'
        : '<span class="card-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>';

      const title = tool.status === 'live'
        ? '<h3 class="card-title"><a href="' + this._escAttr(this.siteHref(tool.href)) + '">' + this._esc(tool.name) + '</a></h3>'
        : '<h3 class="card-title">' + this._esc(tool.name) + '</h3>';

      this.innerHTML =
        '<article class="card card--compact">' +
        '<div class="card-top">' + icon + status + '</div>' +
        title +
        '<p class="card-desc">' + this._esc(tool.tagline) + '</p>' +
        '<span class="card-tag">' + this._esc(tool.categoryLabel) + '</span>' +
        '</article>';
    } catch (_) {
      this.innerHTML = '';
    }
  }

  _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  _escAttr(s) {
    /* Attribute context: escape quotes/angle brackets so a poisoned JSON
       value cannot smuggle an event handler or javascript: URL. */
    return this._esc(s).replace(/[`]/g, '&#96;');
  }
}

customElements.define('tg-tool-card', TgToolCard);