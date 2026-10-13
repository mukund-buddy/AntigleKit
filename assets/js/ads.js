/* ads.js — lazy, consent-aware ad slot filler for AntigleKit.
   Policy (site-wide):
     - Ads appear ONLY inside reserved .ad-slot containers (fixed layout,
       CLS-safe). No pop-ups, pop-unders, interstitials, sticky or
       auto-expanding units. Never.
     - No adult content networks, ever.
     - Slots render a subtle placeholder label until an ad loads.
     - If the visitor blocks cookies (or an ad request fails), the slot
       falls back to the placeholder — the page keeps looking fine.

   To enable a network, set adsConfig.network below and publish the
   matching entry in /ads.txt. Until then nothing is loaded at all. */
(function () {
  'use strict';

  var adsConfig = {
    /* 'none' | 'adsense' | 'medianet' | 'adsterra' */
    network: 'none',
    /* AdSense publisher ID, e.g. 'ca-pub-1234567890123456' */
    adsenseClient: '',
    /* Media.net site/placement IDs */
    medianet: { cid: '', rid: '' },
    /* Adsterra publisher URL, e.g. 'https://www.adsafeprotected.com/...' */
    adsterraUrl: ''
  };

  var KEY = 'af-ads-optout';
  function optedOut() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function slots() {
    return Array.prototype.slice.call(document.querySelectorAll('.ad-slot'));
  }
  function label(slot, text) {
    if (!slot.getAttribute('data-armed')) {
      slot.textContent = text || 'Ad space';
      slot.setAttribute('data-armed', 'false');
    }
  }

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    s.onload = cb || null;
    document.head.appendChild(s);
  }

  function run(network) {
    if (network === 'none') { slots().forEach(function (s) { label(s); }); return; }
    if (optedOut()) { slots().forEach(function (s) { label(s); }); return; }

    if (network === 'adsense' && adsConfig.adsenseClient) {
      window.adsbygoogle = window.adsbygoogle || [];
      loadScript('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + adsConfig.adsenseClient, function () {
        slots().forEach(function (slot) {
          if (slot.getAttribute('data-armed') === 'true') return;
          try {
            var ins = document.createElement('ins');
            ins.className = 'adsbygoogle';
            ins.style.display = 'block';
            ins.setAttribute('data-ad-client', adsConfig.adsenseClient);
            ins.setAttribute('data-ad-slot', slot.getAttribute('data-ad-slot') || '');
            ins.setAttribute('data-ad-format', 'auto');
            ins.setAttribute('data-full-width-responsive', 'true');
            slot.textContent = '';
            slot.appendChild(ins);
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            slot.setAttribute('data-armed', 'true');
          } catch (e) { label(slot); }
        });
      });
      return;
    }

    if (network === 'medianet' && adsConfig.medianet.cid) {
      var h = document.createElement('script');
      h.type = 'text/javascript';
      h.src = 'https://contextual.media.net/cmedianet.js?cid=' + adsConfig.medianet.cid + '&rid=' + adsConfig.medianet.rid;
      h.async = true;
      slots().forEach(function (s) { s.setAttribute('data-armed', 'true'); s.removeAttribute('data-slot'); });
      document.head.appendChild(h);
      return;
    }

    if (network === 'adsterra' && adsConfig.adsterraUrl) {
      loadScript(adsConfig.adsterraUrl, function () {
        slots().forEach(function (s) {
          s.setAttribute('data-armed', 'true');
          s.classList.add('adsterra-active');
        });
      });
      return;
    }

    slots().forEach(function (s) { label(s); });
  }

  /* Fill slots as soon as the browser is idle (keeps LCP unaffected). */
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(function () { run(adsConfig.network); }, { timeout: 3000 });
  } else {
    window.setTimeout(function () { run(adsConfig.network); }, 1500);
  }

  window.AntigleAds = { config: adsConfig, optOut: function () { try { localStorage.setItem(KEY, '1'); } catch (e) {} } };
})();