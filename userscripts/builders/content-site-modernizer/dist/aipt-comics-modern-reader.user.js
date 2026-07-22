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
  const CSS_TEXT = ":root {\n  --csm-bg: #090b0f;\n  --csm-surface: #12161d;\n  --csm-raised: #191f28;\n  --csm-text: #f0f3f7;\n  --csm-muted: #aab3c1;\n  --csm-faint: #8792a2;\n  --csm-accent: #d65cff;\n  --csm-accent-2: #5ad7ff;\n  --csm-radius: 24px;\n  color-scheme: dark;\n}\nhtml.csm-modernized { background: var(--csm-bg) !important; }\nhtml.csm-modernized body {\n  background: radial-gradient(circle at 20% -10%, rgba(214,92,255,.14), transparent 36rem), var(--csm-bg) !important;\n  color: var(--csm-text) !important;\n  font: 16px/1.62 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif !important;\n  overflow-x: hidden !important;\n}\n.csm-hidden, .csm-ad-hidden { display: none !important; visibility: hidden !important; inline-size: 0 !important; block-size: 0 !important; margin: 0 !important; padding: 0 !important; }\n.csm-topbar {\n  position: sticky; top: 0; z-index: 2147481000; display: flex; align-items: center; gap: .8rem;\n  min-height: 58px; padding: max(.7rem, env(safe-area-inset-top)) clamp(.85rem, 3vw, 1.4rem) .7rem;\n  background: rgba(9, 11, 15, .86); backdrop-filter: blur(18px); box-shadow: 0 1px 0 rgba(255,255,255,.06);\n}\n.csm-brand { display: flex; align-items: center; min-width: 0; gap: .65rem; color: var(--csm-text) !important; text-decoration: none !important; font-weight: 800 !important; letter-spacing: -.02em; }\n.csm-brand-mark { display: grid; place-items: center; inline-size: 34px; block-size: 34px; border-radius: 13px; background: linear-gradient(135deg, var(--csm-accent), var(--csm-accent-2)); color: #07080a; font-weight: 900; }\n.csm-brand-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.csm-actions { margin-inline-start: auto; display: flex; gap: .45rem; }\n.csm-btn, .csm-chip {\n  border: 0 !important; min-height: 44px; border-radius: 999px; padding: .68rem .92rem;\n  background: rgba(255,255,255,.08); color: var(--csm-text) !important; text-decoration: none !important;\n  font: inherit; font-weight: 750; cursor: pointer; touch-action: manipulation;\n}\n.csm-btn:hover, .csm-chip:hover, .csm-btn[aria-pressed=\"true\"], .csm-chip[aria-pressed=\"true\"] { background: rgba(214,92,255,.2); }\n.csm-progress { position: fixed; inset: 0 0 auto 0; height: 3px; z-index: 2147481002; transform-origin: 0 50%; transform: scaleX(0); background: linear-gradient(90deg, var(--csm-accent), var(--csm-accent-2)); }\n.csm-layout { width: min(100% - 1.2rem, var(--csm-max, 1360px)); margin: 1rem auto 5rem; }\n.csm-feed-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(min(100%, 285px), 1fr)); gap: clamp(.8rem, 2vw, 1.2rem); align-items: stretch; }\n.csm-card {\n  display: flex !important; flex-direction: column; overflow: hidden; min-width: 0; border: 0 !important; border-radius: var(--csm-radius) !important;\n  background: linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.025)), var(--csm-surface) !important;\n  box-shadow: none !important; padding: 0 !important; color: var(--csm-text) !important;\n}\n.csm-card a { color: inherit !important; text-decoration: none !important; }\n.csm-card img { inline-size: 100% !important; aspect-ratio: var(--csm-card-ratio, 16 / 9); block-size: auto !important; object-fit: cover !important; display: block !important; border-radius: 0 !important; }\n.csm-card :is(h1,h2,h3,.entry-title,.post-title,.title) { font-size: clamp(1.05rem, 2.4vw, 1.36rem) !important; line-height: 1.12 !important; letter-spacing: -.025em !important; margin: .85rem .95rem .35rem !important; color: var(--csm-text) !important; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }\n.csm-card :is(p,.excerpt,.summary,.dek) { color: var(--csm-muted) !important; margin: 0 .95rem .9rem !important; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }\n.csm-card .csm-meta { display: flex; flex-wrap: wrap; gap: .4rem; margin: auto .95rem .95rem; color: var(--csm-faint); font-size: .84rem; }\n.csm-card.csm-viewed img { opacity: .56; filter: saturate(.7); }\n.csm-section-title { margin: 1.4rem 0 .8rem; font-size: clamp(1.4rem, 4vw, 2.35rem); line-height: 1.05; letter-spacing: -.04em; }\n.csm-article { width: min(100% - 1.1rem, var(--csm-article-width, 790px)); margin: 1.1rem auto 6rem; }\n.csm-article :is(h1,.entry-title,.post-title) { font-size: clamp(1.85rem, 8vw, 3.4rem) !important; line-height: 1.08 !important; letter-spacing: -.045em !important; color: var(--csm-text) !important; overflow: visible !important; display: block !important; -webkit-line-clamp: unset !important; }\n.csm-article :is(p,li) { color: #e7ebf2 !important; font-size: clamp(1rem, 1.4vw, 1.12rem) !important; line-height: 1.72 !important; }\n.csm-article img, .csm-article video, .csm-article iframe { max-inline-size: 100% !important; block-size: auto !important; border-radius: 18px !important; }\n.csm-drawer { position: fixed; inset: auto .65rem calc(.65rem + env(safe-area-inset-bottom)) .65rem; z-index: 2147481001; max-height: min(72vh, 620px); overflow: auto; border-radius: 28px; padding: 1rem; background: #10141b; color: var(--csm-text); box-shadow: 0 24px 80px rgba(0,0,0,.52); transform: translateY(120%); transition: transform .2s ease; }\n.csm-drawer[aria-hidden=\"false\"] { transform: translateY(0); }\n.csm-drawer-backdrop { position: fixed; inset: 0; z-index: 2147481000; background: rgba(0,0,0,.48); opacity: 0; pointer-events: none; transition: opacity .2s ease; }\n.csm-drawer-backdrop[data-open=\"true\"] { opacity: 1; pointer-events: auto; }\n.csm-drawer h2 { margin: .2rem 0 1rem; font-size: 1.25rem; }\n.csm-drawer-grid { display: grid; gap: .55rem; }\n.csm-drawer input { min-height: 46px; border: 0; border-radius: 16px; padding: .75rem .9rem; background: rgba(255,255,255,.08); color: var(--csm-text); }\n.csm-bottomnav { position: fixed; inset: auto .55rem calc(.55rem + env(safe-area-inset-bottom)) .55rem; z-index: 2147480999; display: grid; grid-template-columns: repeat(5, 1fr); gap: .25rem; padding: .35rem; border-radius: 24px; background: rgba(15,18,24,.9); backdrop-filter: blur(18px); }\n.csm-bottomnav button { min-height: 48px; border: 0; border-radius: 18px; background: transparent; color: var(--csm-muted); font: inherit; font-size: .76rem; font-weight: 760; }\n.csm-bottomnav button[aria-current=\"page\"], .csm-bottomnav button:hover { color: var(--csm-text); background: rgba(255,255,255,.08); }\n@media (min-width: 760px) { .csm-bottomnav { display: none; } .csm-layout { margin-bottom: 3rem; } }\n@media (max-width: 520px) { .csm-actions .csm-btn[data-desktop] { display:none; } .csm-topbar { min-height: 54px; } .csm-card { border-radius: 20px !important; } }\n";
  const install = function installContentSiteModernizer(profile, cssText) {
  if (!profile || document.documentElement.classList.contains('csm-modernized')) return;
  const d = document;
  const w = window;
  const storage = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(`${profile.storagePrefix}:${key}`)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(`${profile.storagePrefix}:${key}`, JSON.stringify(value)); } catch {} }
  };
  const saved = new Set(storage.get('saved', []));
  const viewed = new Set(storage.get('viewed', []));
  const $$ = (sel, root = d) => Array.from(root.querySelectorAll(sel));
  const first = (selectors, root = d) => selectors.flatMap((sel) => $$(sel, root)).find(Boolean);
  const selectorList = (value) => Array.isArray(value) ? value : String(value || '').split(',').map((x) => x.trim()).filter(Boolean);
  const absolutePath = (href) => { try { return new URL(href, location.href).pathname; } catch { return href || location.href; } };
  const idFor = (node) => absolutePath(node.querySelector('a[href]')?.href || location.href);
  const isArticlePage = () => profile.articleHints?.some((hint) => {
    if (hint.startsWith('body.')) return d.body.classList.contains(hint.slice(5));
    if (hint.startsWith('path:')) return new RegExp(hint.slice(5)).test(location.pathname);
    return !!d.querySelector(hint);
  }) || false;

  function injectCss() {
    const style = d.createElement('style');
    style.id = 'csm-style';
    style.textContent = cssText;
    d.head.append(style);
    d.documentElement.classList.add('csm-modernized');
    d.documentElement.style.setProperty('--csm-max', `${profile.layout?.desktopMaxWidth || 1360}px`);
    d.documentElement.style.setProperty('--csm-article-width', `${profile.layout?.articleMaxWidth || 790}px`);
    d.documentElement.style.setProperty('--csm-card-ratio', profile.layout?.cardImageRatio || '16 / 9');
  }

  function hideAds(root = d) {
    for (const sel of profile.selectors?.ads || []) {
      for (const node of $$(sel, root)) node.classList.add('csm-ad-hidden');
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
    else if (action === 'jump-comments') (first(selectorList(profile.selectors?.article?.comments)) || d.querySelector('#comments'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (action === 'scroll-top') scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cardCandidates() {
    const selectors = selectorList(profile.selectors?.feed?.items || 'article');
    const nodes = selectors.flatMap((sel) => { try { return $$(sel); } catch { return []; } });
    return [...new Set(nodes)].filter((node) => node instanceof HTMLElement && node.querySelector('a[href]') && !node.closest('.csm-topbar,.csm-drawer,.csm-bottomnav'));
  }

  function enhanceFeed() {
    const items = cardCandidates();
    if (!items.length) return;
    const main = first(selectorList(profile.selectors?.page?.main || 'main,#main,.site-main')) || items[0].parentElement;
    main.classList.add('csm-layout');
    const parent = items[0].parentElement;
    if (parent && items.every((item) => item.parentElement === parent)) parent.classList.add('csm-feed-grid');
    for (const item of items) enhanceCard(item);
  }

  function enhanceCard(item) {
    if (item.dataset.csmCard) return;
    item.dataset.csmCard = '1';
    item.classList.add('csm-card');
    const id = idFor(item);
    if (viewed.has(id)) item.classList.add('csm-viewed');
    if (!item.querySelector('.csm-meta')) {
      const meta = d.createElement('div');
      meta.className = 'csm-meta';
      const parts = [];
      const cat = first(selectorList(profile.selectors?.feed?.category || ''), item);
      const time = first(selectorList(profile.selectors?.feed?.date || 'time'), item);
      if (cat) parts.push(cat.textContent.trim().split(/\s+/).slice(0, 4).join(' '));
      if (time) parts.push(time.textContent.trim());
      meta.textContent = parts.filter(Boolean).join(' · ');
      item.append(meta);
    }
    const link = item.querySelector('a[href]');
    link?.addEventListener('click', () => { viewed.add(id); storage.set('viewed', [...viewed]); });
  }

  function filterCards(query) {
    const needle = query.trim().toLowerCase();
    for (const card of $$('.csm-card')) {
      card.hidden = needle && !card.textContent.toLowerCase().includes(needle);
    }
  }

  function filterSaved() {
    for (const card of $$('.csm-card')) card.hidden = !saved.has(idFor(card));
    toast('Showing saved items from this page');
  }

  function refreshStates() {
    for (const card of $$('.csm-card')) {
      const id = idFor(card);
      card.classList.toggle('csm-viewed', viewed.has(id));
    }
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
    const root = first(selectorList(profile.selectors?.article?.root || 'article,main'));
    if (!root) return;
    root.classList.add('csm-article');
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

  injectCss();
  hideAds();
  const articleMode = isArticlePage();
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
