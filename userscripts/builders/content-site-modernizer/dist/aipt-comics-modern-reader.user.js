// ==UserScript==
// @name         AIPT Comics Modern Reader
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/aipt-comics-modern-reader
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/builders/content-site-modernizer
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/content-site-modernizer/dist/aipt-comics-modern-reader.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/content-site-modernizer/dist/aipt-comics-modern-reader.user.js
// @version      0.1.0
// @description  Modern dark mobile-first reader UI for AIPT Comics.
// @author       Mikeyphw
// @match        https://aiptcomics.com/*
// @match        https://www.aiptcomics.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
// @noframes
// ==/UserScript==

(() => {
  'use strict';
  const PROFILE = {
  "id": "aipt-comics-modern-reader",
  "name": "AIPT Comics Modern Reader",
  "shortName": "AIPT",
  "mark": "A!",
  "storagePrefix": "aipt-comics-modern-reader",
  "home": "/",
  "searchPath": "/?s=",
  "layout": {
    "desktopMaxWidth": 1360,
    "articleMaxWidth": 780,
    "cardImageRatio": "16 / 9"
  },
  "articleHints": [
    "body.single-post",
    "body.post-template-default",
    "path:^/\\d{4}/\\d{2}/\\d{2}/",
    "article .entry-content",
    "main article h1"
  ],
  "selectors": {
    "page": {
      "main": "main,#main,.site-main,.main-content,.content,.site-content,.td-main-content,.td-ss-main-content,.td-pb-span8,.td-block-span12"
    },
    "feed": {
      "items": [
        "article",
        ".post",
        ".entry",
        ".story",
        ".card",
        ".td_module_wrap",
        ".td_module_1",
        ".td_module_2",
        ".td_module_6",
        ".td_module_10",
        ".td_module_16",
        ".td-block-span6",
        ".td-block-span4",
        "li:has(a[href*='aiptcomics.com/'])",
        "div:has(> a[href*='aiptcomics.com/'] > img)"
      ],
      "title": "h1,h2,h3,.entry-title,.post-title,.td-module-title,.td-big-grid-post .entry-title,.title",
      "category": ".cat-links,.category,.td-post-category,[rel='category tag'],a[href*='/category/']",
      "date": "time,.date,.posted-on,.td-post-date,.entry-date"
    },
    "article": {
      "root": "article,.post,.entry,main,.td-post-content,.td-ss-main-content",
      "comments": "#comments,.comments-area,.td-comments,#respond"
    },
    "ads": [
      "[id*='ad-']",
      "[id*='ads-']",
      "[id*='advert']",
      "[id*='leaderboard']",
      "[class*='ad-']",
      "[class*='ads-']",
      "[class*='advert']",
      "[class*='sponsor']",
      "[class*='promo']",
      ".td-a-rec",
      ".td-g-rec",
      ".td-adspot-title",
      ".google-auto-placed",
      "ins.adsbygoogle",
      "iframe[src*='doubleclick']",
      "iframe[src*='googlesyndication']",
      "script[src*='googlesyndication']"
    ]
  },
  "nav": {
    "primary": [
      {
        "id": "home",
        "label": "Home",
        "href": "/"
      },
      {
        "id": "comics",
        "label": "Comics",
        "href": "/category/comic-books/"
      },
      {
        "id": "movies",
        "label": "Movies",
        "href": "/category/movies/"
      },
      {
        "id": "tv",
        "label": "TV",
        "href": "/category/tv/"
      },
      {
        "id": "games",
        "label": "Games",
        "href": "/category/video-games/"
      },
      {
        "id": "wrestling",
        "label": "Wrestling",
        "href": "/category/pro-wrestling/"
      },
      {
        "id": "interviews",
        "label": "Interviews",
        "href": "/category/interviews/"
      }
    ],
    "bottom": [
      {
        "id": "home",
        "label": "Home",
        "action": "go-home"
      },
      {
        "id": "browse",
        "label": "Browse",
        "action": "open-browse"
      },
      {
        "id": "search",
        "label": "Search",
        "action": "open-search"
      },
      {
        "id": "saved",
        "label": "Saved",
        "action": "filter-saved"
      },
      {
        "id": "more",
        "label": "More",
        "action": "open-settings"
      }
    ],
    "articleBottom": [
      {
        "id": "back",
        "label": "Back",
        "action": "history-back"
      },
      {
        "id": "save",
        "label": "Save",
        "action": "toggle-save"
      },
      {
        "id": "comments",
        "label": "Comments",
        "action": "jump-comments"
      },
      {
        "id": "top",
        "label": "Top",
        "action": "scroll-top"
      },
      {
        "id": "more",
        "label": "More",
        "action": "open-settings"
      }
    ]
  }
};
  const CSS_TEXT = ":root {\n  --csm-bg: #090b0f;\n  --csm-surface: #12161d;\n  --csm-raised: #191f28;\n  --csm-text: #f0f3f7;\n  --csm-muted: #aab3c1;\n  --csm-faint: #8792a2;\n  --csm-accent: #d65cff;\n  --csm-accent-2: #5ad7ff;\n  --csm-radius: 24px;\n  color-scheme: dark;\n}\nhtml.csm-modernized {\n  background: var(--csm-bg) !important;\n  min-inline-size: 0 !important;\n}\nhtml.csm-modernized body {\n  background: radial-gradient(circle at 20% -10%, rgba(214,92,255,.14), transparent 36rem), var(--csm-bg) !important;\n  color: var(--csm-text) !important;\n  font: 16px/1.62 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif !important;\n  overflow-x: hidden !important;\n  min-inline-size: 0 !important;\n}\nhtml.csm-modernized body :is(#page,#content,.site,.site-content,.site-main,.content,.content-area,.main-content,.wrap,.wrapper,.container,.page-wrap,.page-wrapper,.row,.col,.column,.entry-content,.post-content,.single-post,.post,.article,.main,.primary) {\n  background-color: transparent !important;\n  background-image: none !important;\n  box-shadow: none !important;\n}\nhtml.csm-modernized img,\nhtml.csm-modernized video,\nhtml.csm-modernized iframe {\n  max-inline-size: 100% !important;\n}\n.csm-hidden,\n.csm-ad-hidden,\n.csm-source-hidden {\n  display: none !important;\n  visibility: hidden !important;\n  inline-size: 0 !important;\n  block-size: 0 !important;\n  max-inline-size: 0 !important;\n  max-block-size: 0 !important;\n  margin: 0 !important;\n  padding: 0 !important;\n  overflow: hidden !important;\n}\n.csm-topbar {\n  position: sticky;\n  top: 0;\n  z-index: 2147481000;\n  display: flex;\n  align-items: center;\n  gap: .8rem;\n  min-height: 58px;\n  padding: max(.7rem, env(safe-area-inset-top)) clamp(.85rem, 3vw, 1.4rem) .7rem;\n  background: rgba(9, 11, 15, .9);\n  backdrop-filter: blur(18px);\n  box-shadow: 0 1px 0 rgba(255,255,255,.06);\n}\n.csm-brand {\n  display: flex;\n  align-items: center;\n  min-width: 0;\n  gap: .65rem;\n  color: var(--csm-text) !important;\n  text-decoration: none !important;\n  font-weight: 800 !important;\n  letter-spacing: -.02em;\n}\n.csm-brand-mark {\n  display: grid;\n  place-items: center;\n  inline-size: 34px;\n  block-size: 34px;\n  border-radius: 13px;\n  background: linear-gradient(135deg, var(--csm-accent), var(--csm-accent-2));\n  color: #07080a;\n  font-weight: 900;\n  font-size: .86rem;\n}\n.csm-brand-text {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.csm-actions {\n  margin-inline-start: auto;\n  display: flex;\n  gap: .45rem;\n}\n.csm-btn,\n.csm-chip {\n  border: 0 !important;\n  min-height: 44px;\n  border-radius: 999px;\n  padding: .68rem .92rem;\n  background: rgba(255,255,255,.08);\n  color: var(--csm-text) !important;\n  text-decoration: none !important;\n  font: inherit;\n  font-weight: 750;\n  cursor: pointer;\n  touch-action: manipulation;\n}\n.csm-btn:hover,\n.csm-chip:hover,\n.csm-btn[aria-pressed=\"true\"],\n.csm-chip[aria-pressed=\"true\"] {\n  background: rgba(214,92,255,.2);\n}\n.csm-progress {\n  position: fixed;\n  inset: 0 0 auto 0;\n  height: 3px;\n  z-index: 2147481002;\n  transform-origin: 0 50%;\n  transform: scaleX(0);\n  background: linear-gradient(90deg, var(--csm-accent), var(--csm-accent-2));\n}\n.csm-layout {\n  width: min(100% - 1.5rem, var(--csm-max, 1360px)) !important;\n  max-inline-size: var(--csm-max, 1360px) !important;\n  margin: 1rem auto 5rem !important;\n  padding: 0 !important;\n  float: none !important;\n  clear: both !important;\n  min-inline-size: 0 !important;\n}\n.csm-feed-grid {\n  display: grid !important;\n  grid-template-columns: repeat(auto-fit, minmax(min(100%, 285px), 1fr));\n  gap: clamp(.8rem, 2vw, 1.2rem);\n  align-items: stretch;\n  width: 100% !important;\n  min-inline-size: 0 !important;\n}\n.csm-card {\n  position: relative !important;\n  display: flex !important;\n  flex-direction: column !important;\n  overflow: hidden !important;\n  min-width: 0 !important;\n  border: 0 !important;\n  border-radius: var(--csm-radius) !important;\n  background: linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.025)), var(--csm-surface) !important;\n  box-shadow: none !important;\n  padding: 0 !important;\n  margin: 0 !important;\n  color: var(--csm-text) !important;\n  float: none !important;\n  width: auto !important;\n  max-width: none !important;\n  min-height: 100% !important;\n}\n.csm-card-cover {\n  position: absolute !important;\n  inset: 0 !important;\n  z-index: 3 !important;\n  color: transparent !important;\n  text-decoration: none !important;\n}\n.csm-card a:not(.csm-card-cover) {\n  color: inherit !important;\n  text-decoration: none !important;\n  position: relative;\n  z-index: 2;\n}\n.csm-card img {\n  inline-size: 100% !important;\n  width: 100% !important;\n  aspect-ratio: var(--csm-card-ratio, 16 / 9);\n  block-size: auto !important;\n  object-fit: cover !important;\n  display: block !important;\n  border-radius: 0 !important;\n  margin: 0 !important;\n}\n.csm-card :is(h1,h2,h3,.entry-title,.post-title,.title) {\n  font-size: clamp(1.05rem, 2.4vw, 1.36rem) !important;\n  line-height: 1.12 !important;\n  letter-spacing: -.025em !important;\n  margin: .85rem .95rem .35rem !important;\n  color: var(--csm-text) !important;\n  display: -webkit-box !important;\n  -webkit-line-clamp: 3;\n  -webkit-box-orient: vertical;\n  overflow: hidden !important;\n}\n.csm-card :is(p,.excerpt,.summary,.dek) {\n  color: var(--csm-muted) !important;\n  margin: 0 .95rem .9rem !important;\n  display: -webkit-box !important;\n  -webkit-line-clamp: 3;\n  -webkit-box-orient: vertical;\n  overflow: hidden !important;\n}\n.csm-card .csm-meta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: .4rem;\n  margin: auto .95rem .95rem;\n  color: var(--csm-faint);\n  font-size: .84rem;\n  position: relative;\n  z-index: 2;\n}\n.csm-card.csm-viewed img {\n  opacity: .56;\n  filter: saturate(.7);\n}\n.csm-section-title {\n  grid-column: 1 / -1;\n  margin: 1.4rem 0 .8rem;\n  font-size: clamp(1.4rem, 4vw, 2.35rem);\n  line-height: 1.05;\n  letter-spacing: -.04em;\n  color: var(--csm-text) !important;\n}\n.csm-article-shell {\n  width: min(100% - 1.5rem, calc(var(--csm-article-width, 790px) + 4rem)) !important;\n  margin: 1rem auto 6rem !important;\n  padding: 0 !important;\n  float: none !important;\n  background: transparent !important;\n}\n.csm-article {\n  width: min(100%, var(--csm-article-width, 790px)) !important;\n  max-inline-size: var(--csm-article-width, 790px) !important;\n  margin: 1.1rem auto 6rem !important;\n  padding: clamp(1rem, 3vw, 1.35rem) !important;\n  border-radius: 28px !important;\n  background: linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.02)), var(--csm-surface) !important;\n  color: var(--csm-text) !important;\n  float: none !important;\n  box-sizing: border-box !important;\n}\n.csm-article :is(h1,.entry-title,.post-title) {\n  font-size: clamp(1.85rem, 8vw, 3.4rem) !important;\n  line-height: 1.08 !important;\n  letter-spacing: -.045em !important;\n  color: var(--csm-text) !important;\n  overflow: visible !important;\n  display: block !important;\n  -webkit-line-clamp: unset !important;\n}\n.csm-article :is(h2,h3,h4) {\n  color: var(--csm-text) !important;\n  line-height: 1.18 !important;\n}\n.csm-article :is(p,li) {\n  color: #e7ebf2 !important;\n  font-size: clamp(1rem, 1.4vw, 1.12rem) !important;\n  line-height: 1.72 !important;\n}\n.csm-article :is(a) { color: var(--csm-accent-2) !important; }\n.csm-article img,\n.csm-article video,\n.csm-article iframe {\n  max-inline-size: 100% !important;\n  block-size: auto !important;\n  border-radius: 18px !important;\n}\n.csm-drawer {\n  position: fixed;\n  inset: auto .65rem calc(.65rem + env(safe-area-inset-bottom)) .65rem;\n  z-index: 2147481001;\n  max-height: min(72vh, 620px);\n  overflow: auto;\n  border-radius: 28px;\n  padding: 1rem;\n  background: #10141b;\n  color: var(--csm-text);\n  box-shadow: 0 24px 80px rgba(0,0,0,.52);\n  transform: translateY(120%);\n  transition: transform .2s ease;\n}\n.csm-drawer[aria-hidden=\"false\"] { transform: translateY(0); }\n.csm-drawer-backdrop {\n  position: fixed;\n  inset: 0;\n  z-index: 2147481000;\n  background: rgba(0,0,0,.48);\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity .2s ease;\n}\n.csm-drawer-backdrop[data-open=\"true\"] { opacity: 1; pointer-events: auto; }\n.csm-drawer h2 { margin: .2rem 0 1rem; font-size: 1.25rem; color: var(--csm-text) !important; }\n.csm-drawer-grid { display: grid; gap: .55rem; }\n.csm-drawer input {\n  min-height: 46px;\n  border: 0;\n  border-radius: 16px;\n  padding: .75rem .9rem;\n  background: rgba(255,255,255,.08);\n  color: var(--csm-text);\n}\n.csm-bottomnav {\n  position: fixed;\n  inset: auto .55rem calc(.55rem + env(safe-area-inset-bottom)) .55rem;\n  z-index: 2147480999;\n  display: grid;\n  grid-template-columns: repeat(5, 1fr);\n  gap: .25rem;\n  padding: .35rem;\n  border-radius: 24px;\n  background: rgba(15,18,24,.9);\n  backdrop-filter: blur(18px);\n}\n.csm-bottomnav button {\n  min-height: 48px;\n  border: 0;\n  border-radius: 18px;\n  background: transparent;\n  color: var(--csm-muted);\n  font: inherit;\n  font-size: .76rem;\n  font-weight: 760;\n}\n.csm-bottomnav button[aria-current=\"page\"],\n.csm-bottomnav button:hover {\n  color: var(--csm-text);\n  background: rgba(255,255,255,.08);\n}\n\nhtml.csm-site-bleeding-cool-modern-reader {\n  --csm-accent: #b68cff;\n  --csm-accent-2: #6fd2ff;\n  --csm-max: 1320px;\n  --csm-article-width: 820px;\n}\nhtml.csm-site-bleeding-cool-modern-reader .csm-feed-grid {\n  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));\n}\nhtml.csm-site-bleeding-cool-modern-reader .csm-feed-grid .csm-card:first-child {\n  grid-column: span 2;\n}\nhtml.csm-site-bleeding-cool-modern-reader .csm-card:first-child :is(h1,h2,h3,.entry-title,.post-title,.title) {\n  font-size: clamp(1.25rem, 2.7vw, 2rem) !important;\n}\nhtml.csm-site-bleeding-cool-modern-reader .csm-article {\n  background: #171c24 !important;\n}\nhtml.csm-site-bleeding-cool-modern-reader :is(.popular-now,.popular,.trending,.widget,.widget-area,aside,[class*=\"sidebar\"],[id*=\"sidebar\"],[class*=\"popular\"]):not(.csm-drawer) {\n  display: none !important;\n}\n\n@media (min-width: 760px) {\n  .csm-bottomnav { display: none; }\n  .csm-layout { margin-bottom: 3rem !important; }\n}\n@media (max-width: 760px) {\n  .csm-layout { width: min(100% - .9rem, var(--csm-max, 1360px)) !important; }\n  html.csm-site-bleeding-cool-modern-reader .csm-feed-grid .csm-card:first-child { grid-column: auto; }\n}\n@media (max-width: 520px) {\n  .csm-actions .csm-btn[data-desktop] { display:none; }\n  .csm-topbar { min-height: 54px; }\n  .csm-card { border-radius: 20px !important; }\n  .csm-article { border-radius: 22px !important; padding: .95rem !important; }\n}\n";
  const install = function installContentSiteModernizer(profile, cssText) {
  if (!profile || document.documentElement.classList.contains('csm-modernized')) return;

  const d = document;
  const storage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(`${profile.storagePrefix}:${key}`);
        return value == null ? fallback : JSON.parse(value);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(`${profile.storagePrefix}:${key}`, JSON.stringify(value)); } catch {}
    }
  };

  const saved = new Set(storage.get('saved', []));
  const viewed = new Set(storage.get('viewed', []));
  const $$ = (sel, root = d) => {
    try { return Array.from(root.querySelectorAll(sel)); } catch { return []; }
  };
  const selectorList = (value) => Array.isArray(value) ? value : String(value || '').split(',').map((x) => x.trim()).filter(Boolean);
  const first = (selectors, root = d) => selectorList(selectors).flatMap((sel) => $$(sel, root)).find(Boolean);
  const slugClass = `csm-site-${String(profile.id || 'content-site').replace(/[^a-z0-9_-]+/gi, '-').toLowerCase()}`;
  const absolutePath = (href) => { try { return new URL(href, location.href).pathname; } catch { return href || location.href; } };
  const idFor = (node) => absolutePath(node.querySelector('a[href]')?.href || location.href);
  const isArticlePage = () => profile.articleHints?.some((hint) => {
    if (hint.startsWith('body.')) return d.body.classList.contains(hint.slice(5));
    if (hint.startsWith('path:')) return new RegExp(hint.slice(5)).test(location.pathname);
    return !!d.querySelector(hint);
  }) || false;

  function injectCss(articleMode) {
    const style = d.createElement('style');
    style.id = 'csm-style';
    style.textContent = cssText;
    d.head.append(style);
    d.documentElement.classList.add('csm-modernized', slugClass, articleMode ? 'csm-article-mode' : 'csm-feed-mode');
    d.body.classList.add('csm-modernized-body', slugClass, articleMode ? 'csm-article-mode' : 'csm-feed-mode');
    d.documentElement.style.setProperty('--csm-max', `${profile.layout?.desktopMaxWidth || 1360}px`);
    d.documentElement.style.setProperty('--csm-article-width', `${profile.layout?.articleMaxWidth || 790}px`);
    d.documentElement.style.setProperty('--csm-card-ratio', profile.layout?.cardImageRatio || '16 / 9');
  }

  function hideNodes(selectors, root = d) {
    for (const sel of selectorList(selectors)) {
      for (const node of $$(sel, root)) {
        if (node.closest?.('.csm-topbar,.csm-drawer,.csm-bottomnav')) continue;
        node.classList.add('csm-source-hidden');
      }
    }
  }

  function hideAds(root = d) {
    hideNodes(profile.selectors?.ads || [], root);
  }

  function installSourceCleanup(articleMode) {
    if (profile.layout?.hideSidebars) hideNodes(profile.selectors?.page?.sidebar || 'aside,.sidebar,#secondary,.widget-area,[class*="sidebar"]');
    if (profile.layout?.hideOriginalChrome) {
      hideNodes(profile.selectors?.page?.header || 'header,#masthead,.site-header,.header,.top-bar,.topbar,.ticker,[class*="breaking"]');
      hideNodes(profile.selectors?.page?.nav || 'nav,.main-navigation,.site-navigation,.menu,.navbar');
    }
    if (articleMode && profile.layout?.hideArticleSidebars !== false) {
      hideNodes(profile.selectors?.page?.sidebar || 'aside,.sidebar,#secondary,.widget-area,[class*="sidebar"]');
    }
  }

  function makeButton(label, action, attrs = {}) {
    const btn = d.createElement('button');
    btn.type = 'button';
    btn.className = 'csm-btn';
    btn.textContent = label;
    btn.dataset.action = action;
    for (const [key, value] of Object.entries(attrs)) btn.setAttribute(key, value);
    btn.addEventListener('click', () => runAction(action));
    return btn;
  }

  function installTopbar(articleMode) {
    const bar = d.createElement('header');
    bar.className = 'csm-topbar';
    bar.innerHTML = `<a class="csm-brand" href="${profile.home || '/'}"><span class="csm-brand-mark">${profile.mark || '★'}</span><span class="csm-brand-text">${profile.shortName || profile.name}</span></a><div class="csm-actions"></div>`;
    const actions = bar.querySelector('.csm-actions');
    actions.append(makeButton('Browse', 'open-browse', { 'aria-expanded': 'false', 'data-desktop': 'true' }));
    actions.append(makeButton('Search', 'open-search', { 'aria-expanded': 'false' }));
    if (articleMode) actions.append(makeButton(saved.has(absolutePath(location.href)) ? 'Saved' : 'Save', 'toggle-save', { 'aria-pressed': String(saved.has(absolutePath(location.href))) }));
    actions.append(makeButton('More', 'open-settings', { 'aria-expanded': 'false' }));
    d.body.prepend(bar);
  }

  function installProgress(articleMode) {
    if (!articleMode) return;
    const p = d.createElement('div');
    p.className = 'csm-progress';
    p.setAttribute('role', 'progressbar');
    p.setAttribute('aria-label', 'Reading progress');
    p.setAttribute('aria-valuemin', '0');
    p.setAttribute('aria-valuemax', '100');
    d.body.append(p);
    const update = () => {
      const max = Math.max(1, d.documentElement.scrollHeight - innerHeight);
      const value = Math.max(0, Math.min(100, Math.round((scrollY / max) * 100)));
      p.style.transform = `scaleX(${value / 100})`;
      p.setAttribute('aria-valuenow', String(value));
    };
    addEventListener('scroll', update, { passive: true });
    update();
  }

  function installDrawer() {
    const backdrop = d.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'csm-drawer-backdrop';
    backdrop.setAttribute('aria-label', 'Close panel');
    backdrop.addEventListener('click', closeDrawer);
    const drawer = d.createElement('aside');
    drawer.className = 'csm-drawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('aria-modal', 'true');
    drawer.innerHTML = `<h2>${profile.shortName || profile.name}</h2><div class="csm-drawer-grid" data-drawer-content></div>`;
    d.body.append(backdrop, drawer);
  }

  function openDrawer(kind) {
    const drawer = d.querySelector('.csm-drawer');
    const content = drawer.querySelector('[data-drawer-content]');
    const title = drawer.querySelector('h2');
    const navItems = kind === 'search' ? [] : (profile.nav?.primary || []);
    title.textContent = kind === 'search' ? 'Search loaded stories' : kind === 'settings' ? 'Display' : 'Browse';
    if (kind === 'search') {
      content.innerHTML = `<input type="search" placeholder="Filter stories on this page" aria-label="Filter stories"><button class="csm-btn" type="button" data-site-search>Open site search</button>`;
      const input = content.querySelector('input');
      input.addEventListener('input', () => filterCards(input.value));
      content.querySelector('[data-site-search]').addEventListener('click', () => {
        const q = encodeURIComponent(input.value.trim());
        if (q) location.href = `${profile.searchPath || '/?s='}${q}`;
      });
      setTimeout(() => input.focus(), 30);
    } else if (kind === 'settings') {
      content.innerHTML = `<button class="csm-btn" type="button" data-clear-viewed>Clear viewed</button><button class="csm-btn" type="button" data-clear-saved>Clear saved</button><p style="color:var(--csm-muted);margin:.4rem 0 0">Saved and viewed state stays in this browser.</p>`;
      content.querySelector('[data-clear-viewed]').addEventListener('click', () => { viewed.clear(); storage.set('viewed', []); refreshStates(); toast('Viewed history cleared'); });
      content.querySelector('[data-clear-saved]').addEventListener('click', () => { saved.clear(); storage.set('saved', []); refreshStates(); toast('Saved posts cleared'); });
    } else {
      content.innerHTML = navItems.map((item) => `<a class="csm-chip" href="${item.href}">${item.label}</a>`).join('') || '<p>No sections found.</p>';
    }
    drawer.setAttribute('aria-hidden', 'false');
    d.querySelector('.csm-drawer-backdrop').dataset.open = 'true';
    for (const btn of $$('[data-action^="open-"]')) btn.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    const drawer = d.querySelector('.csm-drawer');
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', 'true');
    const backdrop = d.querySelector('.csm-drawer-backdrop');
    if (backdrop) backdrop.dataset.open = 'false';
    for (const btn of $$('[data-action^="open-"]')) btn.setAttribute('aria-expanded', 'false');
  }

  function toast(message) {
    let node = d.querySelector('.csm-toast');
    if (!node) {
      node = d.createElement('div');
      node.className = 'csm-toast';
      node.setAttribute('role', 'status');
      node.style.cssText = 'position:fixed;left:50%;bottom:6rem;transform:translateX(-50%);z-index:2147481003;background:#1a2029;color:#fff;padding:.75rem 1rem;border-radius:999px;font-weight:750;box-shadow:0 10px 40px rgba(0,0,0,.35)';
      d.body.append(node);
    }
    node.textContent = message;
    clearTimeout(node._timer);
    node._timer = setTimeout(() => node.remove(), 4200);
  }

  function installBottomNav(articleMode) {
    const nav = d.createElement('nav');
    nav.className = 'csm-bottomnav';
    nav.setAttribute('aria-label', articleMode ? 'Article actions' : 'Page actions');
    const items = articleMode ? profile.nav?.articleBottom : profile.nav?.bottom;
    for (const item of items || []) {
      const btn = d.createElement('button');
      btn.type = 'button';
      btn.textContent = item.label;
      btn.dataset.action = item.action;
      if (item.id === 'home' && location.pathname === '/') btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', () => runAction(item.action));
      nav.append(btn);
    }
    d.body.append(nav);
  }

  function runAction(action) {
    if (action === 'go-home') location.href = profile.home || '/';
    else if (action === 'open-browse') openDrawer('browse');
    else if (action === 'open-search') openDrawer('search');
    else if (action === 'open-settings') openDrawer('settings');
    else if (action === 'filter-saved') filterSaved();
    else if (action === 'history-back') history.length > 1 ? history.back() : location.assign(profile.home || '/');
    else if (action === 'toggle-save') toggleSave(location.href, true);
    else if (action === 'jump-comments') (first(profile.selectors?.article?.comments || '#comments,.comments-area') || d.querySelector('#comments'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (action === 'scroll-top') scrollTo({ top: 0, behavior: 'smooth' });
  }

  function feedRoots() {
    const roots = selectorList(profile.selectors?.feed?.containers || profile.selectors?.page?.main || 'main,#main,.site-main')
      .flatMap((sel) => $$(sel))
      .filter((node) => node instanceof HTMLElement && !isExcluded(node));
    return roots.length ? [...new Set(roots)] : [d.body];
  }

  function isExcluded(node) {
    const excludes = selectorList(profile.selectors?.feed?.exclude || '');
    return excludes.some((sel) => node.matches?.(sel) || node.closest?.(sel));
  }

  function cardCandidates() {
    const selectors = selectorList(profile.selectors?.feed?.items || 'article');
    const nodes = [];
    for (const root of feedRoots()) {
      for (const sel of selectors) nodes.push(...$$(sel, root));
    }
    const seen = new Set();
    return nodes.filter((node) => {
      if (!(node instanceof HTMLElement) || seen.has(node)) return false;
      seen.add(node);
      if (node.closest('.csm-topbar,.csm-drawer,.csm-bottomnav') || isExcluded(node)) return false;
      if (!node.querySelector('a[href]')) return false;
      const text = node.textContent.replace(/\s+/g, ' ').trim();
      if (text.length < (profile.layout?.minCardTextLength || 18)) return false;
      return true;
    });
  }

  function primaryMain(items) {
    const roots = feedRoots();
    const best = roots.find((root) => items.some((item) => root.contains(item)));
    return best || first(profile.selectors?.page?.main || 'main,#main,.site-main') || items[0]?.parentElement || d.body;
  }

  function ensureFeedGrid(items, main) {
    main.classList.add('csm-layout');
    const rebuild = profile.layout?.rebuildFeedGrid !== false;
    if (!rebuild) {
      const parent = items[0]?.parentElement;
      if (parent && items.every((item) => item.parentElement === parent)) parent.classList.add('csm-feed-grid');
      return;
    }
    let grid = main.querySelector(':scope > .csm-feed-grid');
    if (!grid) {
      grid = d.createElement('section');
      grid.className = 'csm-feed-grid';
      grid.setAttribute('aria-label', 'Stories');
      main.prepend(grid);
    }
    for (const item of items) grid.append(item);
    for (const child of Array.from(main.children)) {
      if (child === grid || child.classList.contains('csm-section-title')) continue;
      if (!child.querySelector?.('a[href],img,video,iframe') && !child.textContent.trim()) child.classList.add('csm-source-hidden');
    }
  }

  function enhanceFeed() {
    const items = cardCandidates();
    if (!items.length) return;
    const main = primaryMain(items);
    const titleText = profile.feedTitle || first('h1,h2,.section-title,.archive-title', main)?.textContent?.trim();
    if (titleText && !main.querySelector(':scope > .csm-section-title')) {
      const title = d.createElement('h1');
      title.className = 'csm-section-title';
      title.textContent = titleText;
      main.prepend(title);
    }
    ensureFeedGrid(items, main);
    for (const item of items) enhanceCard(item);
  }

  function enhanceCard(item) {
    if (item.dataset.csmCard) return;
    item.dataset.csmCard = '1';
    item.classList.add('csm-card');
    const id = idFor(item);
    if (viewed.has(id)) item.classList.add('csm-viewed');
    const link = item.querySelector('a[href]');
    if (link && !item.querySelector('.csm-card-cover')) {
      const cover = d.createElement('a');
      cover.className = 'csm-card-cover';
      cover.href = link.href;
      cover.setAttribute('aria-label', link.textContent.trim() || 'Open story');
      item.prepend(cover);
    }
    if (!item.querySelector('.csm-meta')) {
      const meta = d.createElement('div');
      meta.className = 'csm-meta';
      const parts = [];
      const cat = first(profile.selectors?.feed?.category || '', item);
      const time = first(profile.selectors?.feed?.date || 'time', item);
      if (cat) parts.push(cat.textContent.trim().split(/\s+/).slice(0, 4).join(' '));
      if (time) parts.push(time.textContent.trim());
      meta.textContent = parts.filter(Boolean).join(' · ');
      if (meta.textContent) item.append(meta);
    }
    link?.addEventListener('click', () => { viewed.add(id); storage.set('viewed', [...viewed]); });
  }

  function filterCards(query) {
    const needle = query.trim().toLowerCase();
    for (const card of $$('.csm-card')) card.hidden = needle && !card.textContent.toLowerCase().includes(needle);
  }

  function filterSaved() {
    for (const card of $$('.csm-card')) card.hidden = !saved.has(idFor(card));
    toast('Showing saved items from this page');
  }

  function refreshStates() {
    for (const card of $$('.csm-card')) card.classList.toggle('csm-viewed', viewed.has(idFor(card)));
  }

  function toggleSave(href, articleMode = false) {
    const id = absolutePath(href);
    if (saved.has(id)) saved.delete(id); else saved.add(id);
    storage.set('saved', [...saved]);
    for (const btn of $$('[data-action="toggle-save"]')) {
      btn.textContent = saved.has(id) ? 'Saved' : 'Save';
      btn.setAttribute('aria-pressed', String(saved.has(id)));
    }
    toast(saved.has(id) ? 'Saved' : 'Removed from saved');
    if (articleMode) refreshStates();
  }

  function enhanceArticle() {
    const root = first(profile.selectors?.article?.root || 'article,main');
    if (!root) return;
    root.classList.add('csm-article');
    const wrapper = root.closest(profile.selectors?.page?.main || 'main,#main,.site-main,.content,.main-content,.site-content');
    if (wrapper instanceof HTMLElement) wrapper.classList.add('csm-article-shell');
    const id = absolutePath(location.href);
    let dwell = 0;
    const timer = setInterval(() => {
      if (d.visibilityState !== 'visible') return;
      dwell += 1;
      if (dwell >= 10) { viewed.add(id); storage.set('viewed', [...viewed]); clearInterval(timer); }
    }, 1000);
  }

  function observe() {
    const mo = new MutationObserver((records) => {
      let touched = false;
      for (const record of records) {
        for (const node of record.addedNodes) if (node.nodeType === 1) { hideAds(node); touched = true; }
      }
      if (touched && !isArticlePage()) enhanceFeed();
    });
    mo.observe(d.body, { childList: true, subtree: true });
  }

  const articleMode = isArticlePage();
  injectCss(articleMode);
  installSourceCleanup(articleMode);
  hideAds();
  installTopbar(articleMode);
  installProgress(articleMode);
  installDrawer();
  installBottomNav(articleMode);
  if (articleMode) enhanceArticle(); else enhanceFeed();
  observe();
  addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });
}
;
  install(PROFILE, CSS_TEXT);
})();
