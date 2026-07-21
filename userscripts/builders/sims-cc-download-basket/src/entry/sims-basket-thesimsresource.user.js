// ==UserScript==
// @name         Sims CC Download Basket - The Sims Resource
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/sims-basket-thesimsresource
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/builders/sims-cc-download-basket
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/sims-cc-download-basket/src/entry/sims-basket-thesimsresource.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/sims-cc-download-basket/src/entry/sims-basket-thesimsresource.user.js
// @version      1.4.1
// @description  Site-specific build for The Sims Resource, generated from the shared Sims CC Download Basket core.
// @author       ChatGPT
// @match        https://thesimsresource.com/*
// @match        https://www.thesimsresource.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      thesimsresource.com
// @connect      www.thesimsresource.com
// @connect      *
// ==/UserScript==

import { runSimsCcDownloadBasket } from '../core/app.js';
import { createTsrAdapter } from '../sites/tsr.js';

function installTsrEarlySurfaceGuard() {
  const css = `
    html[data-sccb-tsr-preload="1"],
    html[data-sccb-tsr-preload="1"] body {
      background: radial-gradient(circle at 18% 0%, rgba(40,215,197,.10), transparent 30%), linear-gradient(180deg, #101719, #081012) !important;
      background-color: #101719 !important;
      background-image: radial-gradient(circle at 18% 0%, rgba(40,215,197,.10), transparent 30%), linear-gradient(180deg, #101719, #081012) !important;
      color: #e7f7f4 !important;
      color-scheme: dark !important;
      min-width: 0 !important;
    }
    html[data-sccb-tsr-preload="1"] body::before,
    html[data-sccb-tsr-preload="1"] body::after,
    html[data-sccb-tsr-preload="1"] .background,
    html[data-sccb-tsr-preload="1"] .page-background,
    html[data-sccb-tsr-preload="1"] .site-background,
    html[data-sccb-tsr-preload="1"] .bg,
    html[data-sccb-tsr-preload="1"] .noise,
    html[data-sccb-tsr-preload="1"] .stripe,
    html[data-sccb-tsr-preload="1"] .stripes {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }
    html[data-sccb-tsr-preload="1"] :is(#app, #root, .app, .page, .wrapper, .site-wrapper, .main-wrapper, .content-wrapper, .tsr-page, .tsr-wrapper) {
      background: transparent !important;
      background-image: none !important;
      color: #e7f7f4 !important;
    }
  `;

  const apply = () => {
    try { document.documentElement.dataset.sccbTsrPreload = '1'; } catch (_) {}
    const html = document.documentElement;
    const body = document.body;
    [html, body].filter(Boolean).forEach(el => {
      try {
        el.style.setProperty('background-color', '#101719', 'important');
        el.style.setProperty('background-image', 'radial-gradient(circle at 18% 0%, rgba(40,215,197,.10), transparent 30%), linear-gradient(180deg, #101719, #081012)', 'important');
        el.style.setProperty('color', '#e7f7f4', 'important');
        el.style.setProperty('min-width', '0', 'important');
      } catch (_) {}
    });
    if (!document.getElementById('sccb-tsr-preload-style')) {
      const style = document.createElement('style');
      style.id = 'sccb-tsr-preload-style';
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    }
  };

  apply();
  document.addEventListener('DOMContentLoaded', apply, { once: true });
  [50, 150, 500, 1200, 2500, 5000].forEach(delay => setTimeout(apply, delay));
}

function installTsrTabFocusGuard() {
  const guardCode = String.raw`(() => {
    if (window.__sccbTsrTabFocusGuardInstalled) return;
    Object.defineProperty(window, '__sccbTsrTabFocusGuardInstalled', {
      value: true,
      configurable: true
    });

    const defineGetter = (target, prop, value) => {
      try {
        Object.defineProperty(target, prop, {
          get: () => value,
          configurable: true
        });
      } catch (_) {}
    };

    const defineValue = (target, prop, value) => {
      try {
        Object.defineProperty(target, prop, {
          value,
          writable: true,
          configurable: true
        });
      } catch (_) {
        try { target[prop] = value; } catch (__) {}
      }
    };

    const forceVisible = () => {
      defineValue(document, 'hasFocus', () => true);
      defineGetter(document, 'hidden', false);
      defineGetter(document, 'webkitHidden', false);
      defineGetter(document, 'mozHidden', false);
      defineGetter(document, 'msHidden', false);
      defineGetter(document, 'visibilityState', 'visible');
      defineGetter(document, 'webkitVisibilityState', 'visible');
      defineGetter(Document.prototype, 'hidden', false);
      defineGetter(Document.prototype, 'webkitHidden', false);
      defineGetter(Document.prototype, 'mozHidden', false);
      defineGetter(Document.prototype, 'msHidden', false);
      defineGetter(Document.prototype, 'visibilityState', 'visible');
      defineGetter(Document.prototype, 'webkitVisibilityState', 'visible');
    };

    forceVisible();

    const stopHiddenEvent = event => {
      forceVisible();
      try { event.stopImmediatePropagation(); } catch (_) {}
      try { event.stopPropagation(); } catch (_) {}
      if (event.cancelable) {
        try { event.preventDefault(); } catch (_) {}
      }
    };

    [document, window].forEach(target => {
      ['visibilitychange', 'webkitvisibilitychange', 'mozvisibilitychange', 'msvisibilitychange', 'blur', 'pagehide', 'freeze'].forEach(type => {
        try { target.addEventListener(type, stopHiddenEvent, true); } catch (_) {}
      });
    });

    const emitFocused = () => {
      forceVisible();
      try { window.dispatchEvent(new Event('focus')); } catch (_) {}
      try { document.dispatchEvent(new Event('visibilitychange')); } catch (_) {}
      try { window.dispatchEvent(new Event('pageshow')); } catch (_) {}
    };

    emitFocused();
    setInterval(emitFocused, 15000);
  })();`;

  const runGuard = () => {
    try {
      const script = document.createElement('script');
      script.textContent = guardCode;
      (document.documentElement || document.head || document.body).appendChild(script);
      script.remove();
    } catch (_) {
      // Script-tag injection is the only path that patches TSR's page context correctly.
    }
  };

  runGuard();
}

function runWhenPageIsReady() {
  const start = () => runSimsCcDownloadBasket([createTsrAdapter]);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}

installTsrEarlySurfaceGuard();
installTsrTabFocusGuard();
runWhenPageIsReady();
