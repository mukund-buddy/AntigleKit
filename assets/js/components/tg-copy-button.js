/* tg-copy-button.js — copies the text content of a target element.
   Usage: <tg-copy-button data-source="#jsonOutput" data-label="Copy JSON">Copy</tg-copy-button>
   Falls back to a selection-based copy when navigator.clipboard is unavailable. */
import { showToast } from './tg-toast.js';

class TgCopyButton extends HTMLElement {
  connectedCallback() {
    if (this._built) return;
    this._built = true;

    const label = this.getAttribute('data-label') || 'Copy';
    this.type = 'button';
    this.classList.add('btn', 'btn-outline');
    this.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span></span>';
    this._labelEl = this.querySelector('span');
    this._labelEl.textContent = label;

    this.addEventListener('click', () => this._copy());
  }

  _copy() {
    const sourceSel = this.getAttribute('data-source');
    if (!sourceSel) return;
    const source = document.querySelector(sourceSel);
    if (!source) return;

    const text = source.textContent;
    this._doCopy(text).then((ok) => {
      this._labelEl.textContent = ok ? 'Copied!' : 'Copy failed';
      showToast(ok ? 'Copied to clipboard' : 'Could not access clipboard');
      setTimeout(() => { this._labelEl.textContent = this.getAttribute('data-label') || 'Copy'; }, 1600);
    });
  }

  async _doCopy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_) { /* fall through to legacy path */ }
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (_) {
      return false;
    }
  }
}

customElements.define('tg-copy-button', TgCopyButton);