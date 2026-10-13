/* tg-toast.js — minimal status notification (role="status").
   Used by copy buttons, the generator, and future tools.
   No user data is ever rendered here (XSS-safe by construction). */
class TgToast extends HTMLElement {
  constructor() {
    super();
    this._timer = null;
  }

  connectedCallback() {
    if (this._built) return;
    this._built = true;
    this.setAttribute('role', 'status');
    this.setAttribute('aria-live', 'polite');
    this.setAttribute('aria-atomic', 'true');
    const icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
    this.innerHTML = icon + '<span></span>';
    this._label = this.querySelector('span');
  }

  show(message) {
    if (!this._built) this.connectedCallback();
    this._label.textContent = message;
    this.classList.add('show');
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.classList.remove('show'), 2600);
  }
}

customElements.define('tg-toast', TgToast);

export function showToast(message) {
  let toast = document.querySelector('tg-toast');
  if (!toast) {
    toast = document.createElement('tg-toast');
    document.body.appendChild(toast);
  }
  toast.show(message);
}