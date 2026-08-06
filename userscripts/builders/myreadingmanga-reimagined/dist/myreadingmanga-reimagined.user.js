// ==UserScript==
// @name         MyReadingManga Reimagined
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/myreadingmanga-reimagined
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/builders/myreadingmanga-reimagined
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/myreadingmanga-reimagined/dist/myreadingmanga-reimagined.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/myreadingmanga-reimagined/dist/myreadingmanga-reimagined.user.js
// @version      6.0.0
// @description  A clean-room MyReadingManga archive workspace and accessible manga reader with persistent filtering, facets, read history, responsive layouts, and mobile-first controls.
// @run-at       document-idle
// @match        https://myreadingmanga.info/*
// @grant        none
// ==/UserScript==

(() => {
  "use strict";
  const MRM = {
    config: Object.freeze({"id":"myreadingmanga-reimagined","name":"MyReadingManga Reimagined","version":"6.0.0","description":"A clean-room MyReadingManga archive workspace and accessible manga reader with persistent filtering, facets, read history, responsive layouts, and mobile-first controls.","matches":["https://myreadingmanga.info/*"],"runAt":"document-idle","storagePrefix":"mrm-reimagined-v1","hostnames":["myreadingmanga.info"],"fixtureContractVersion":1}),
    css: "/* archive.css */\nhtml.mrm-ui-enabled .mrm-archive-page .content > .entry,\nhtml.mrm-ui-enabled .mrm-archive-page main > .entry { margin: 0 !important; }\nhtml.mrm-ui-enabled .mrm-archive-page .content,\nhtml.mrm-ui-enabled .mrm-archive-page main.content {\n  display: grid !important;\n  grid-template-columns: repeat(var(--mrm-grid-desktop), minmax(0, 1fr));\n  gap: var(--mrm-grid-gap) !important;\n  align-items: start;\n}\nhtml.mrm-ui-enabled .mrm-card { min-width: 0; overflow: hidden; border-radius: var(--mrm-radius); background: var(--mrm-surface); box-shadow: 0 10px 28px rgba(0,0,0,.22); }\nhtml[data-mrm-border-cards=\"on\"] .mrm-card { border: 1px solid var(--mrm-line) !important; }\nhtml[data-mrm-border-cards=\"off\"] .mrm-card { border: 0 !important; }\nhtml.mrm-ui-enabled .mrm-card .entry-header { padding: 12px 12px 8px; min-height: 66px; }\nhtml.mrm-ui-enabled .mrm-card .entry-title { margin: 0 !important; font-size: .95rem !important; line-height: 1.35 !important; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }\nhtml.mrm-ui-enabled .mrm-card-cover { margin: 0 !important; aspect-ratio: var(--mrm-cover-ratio); overflow: hidden; background: var(--mrm-surface-2); }\nhtml.mrm-ui-enabled .mrm-card-cover a, html.mrm-ui-enabled .mrm-card-cover img { display: block; width: 100% !important; height: 100% !important; }\nhtml.mrm-ui-enabled .mrm-card-cover img { object-fit: cover !important; transition: transform .18s ease; }\nhtml.mrm-ui-enabled .mrm-card:hover .mrm-card-cover img { transform: scale(1.025); }\nhtml.mrm-ui-enabled .mrm-card .entry-footer { display: grid; gap: 8px; padding: 10px 12px 12px; }\n.mrm-card-chips { display: flex; gap: 5px; overflow: hidden; }\n.mrm-taxonomy-chip, .mrm-filter-chip { border-radius: 999px; border: 1px solid var(--mrm-line); background: var(--mrm-surface-2); color: var(--mrm-muted); font-size: .72rem; line-height: 1; padding: 6px 8px; white-space: nowrap; }\nhtml[data-mrm-border-chips=\"off\"] .mrm-taxonomy-chip, html[data-mrm-border-chips=\"off\"] .mrm-filter-chip { border-color: transparent; }\n.mrm-card-actions { display: flex; gap: 8px; }\n.mrm-reader-button, .mrm-primary-action { min-height: 42px; flex: 1; border: 0; border-radius: 11px; background: var(--mrm-accent); color: #09090d; font-weight: 800; cursor: pointer; }\n.mrm-is-read { opacity: .67; }\n.mrm-is-read::after { content: \"Read\"; position: absolute; top: 8px; right: 8px; z-index: 2; background: rgba(10,10,14,.82); border-radius: 999px; padding: 5px 8px; font-size: .7rem; }\n.mrm-card { position: relative; }\nhtml.mrm-ui-enabled .pagination, html.mrm-ui-enabled .archive-pagination { grid-column: 1 / -1; }\nhtml[data-mrm-border-pagination=\"off\"] .pagination, html[data-mrm-border-pagination=\"off\"] .archive-pagination { border: 0 !important; box-shadow: none !important; }\n@media (max-width: 1100px) { html.mrm-ui-enabled .mrm-archive-page .content, html.mrm-ui-enabled .mrm-archive-page main.content { grid-template-columns: repeat(var(--mrm-grid-tablet), minmax(0,1fr)); } }\n@media (max-width: 680px) { html.mrm-ui-enabled .mrm-archive-page .content, html.mrm-ui-enabled .mrm-archive-page main.content { grid-template-columns: repeat(var(--mrm-grid-mobile), minmax(0,1fr)); } html.mrm-ui-enabled .mrm-card .entry-header { min-height: 58px; padding: 9px; } html.mrm-ui-enabled .mrm-card .entry-title { font-size: .82rem !important; } html.mrm-ui-enabled .mrm-card .entry-footer { padding: 8px; } }\n\n/* base.css */\n:root {\n  --mrm-accent: #9b7cff;\n  --mrm-bg: #0b0c10;\n  --mrm-surface: #14161d;\n  --mrm-surface-2: #1b1e27;\n  --mrm-text: #f6f7fb;\n  --mrm-muted: #aeb4c2;\n  --mrm-line: rgba(255,255,255,.13);\n  --mrm-shadow: 0 18px 54px rgba(0,0,0,.38);\n  --mrm-radius: 16px;\n  --mrm-grid-desktop: 6;\n  --mrm-grid-tablet: 4;\n  --mrm-grid-mobile: 2;\n  --mrm-grid-gap: 16px;\n  --mrm-cover-ratio: .714;\n  color-scheme: dark;\n}\n.mrm-sr-only { position: fixed !important; width: 1px !important; height: 1px !important; overflow: hidden !important; clip: rect(0 0 0 0) !important; white-space: nowrap !important; }\nhtml.mrm-ui-enabled body { background: var(--mrm-bg) !important; color: var(--mrm-text) !important; }\nhtml.mrm-ui-enabled body, html.mrm-ui-enabled button, html.mrm-ui-enabled input, html.mrm-ui-enabled select { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif !important; }\nhtml.mrm-ui-enabled a { color: inherit; }\nhtml.mrm-ui-enabled .site-header, html.mrm-ui-enabled .nav-primary, html.mrm-ui-enabled .site-footer, html.mrm-ui-enabled .footer-widgets { background: var(--mrm-surface) !important; color: var(--mrm-text) !important; }\nhtml[data-mrm-border-header=\"off\"] .site-header, html[data-mrm-border-header=\"off\"] .nav-primary { border: 0 !important; box-shadow: none !important; }\nhtml.mrm-ui-enabled .site-inner { max-width: 1680px !important; padding-inline: clamp(12px, 2.2vw, 34px) !important; }\n#mrm-ui-recovery { position: fixed; right: 12px; bottom: 12px; z-index: 2147482000; display: none; border: 1px solid var(--mrm-line); border-radius: 999px; padding: 10px 14px; background: var(--mrm-surface); color: var(--mrm-text); box-shadow: var(--mrm-shadow); }\nhtml.mrm-ui-disabled #mrm-ui-recovery { display: block; }\n@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }\n\n/* reader.css */\nhtml.mrm-reader-open, html.mrm-reader-open body { overflow: hidden !important; }\n.mrm-reader-modal { position: fixed; z-index: 2147483500; inset: 0; display: grid; grid-template-rows: auto auto minmax(0,1fr) auto; background: #08090c; color: var(--mrm-text); }\n.mrm-reader-modal[hidden] { display: none; }\nhtml[data-mrm-border-reader=\"on\"] .mrm-reader-modal { box-shadow: inset 0 0 0 1px var(--mrm-line); }\n.mrm-reader-toolbar { z-index: 3; display: grid; gap: 6px; padding: 8px 10px; background: rgba(15,17,23,.96); backdrop-filter: blur(14px); transition: transform .18s ease; }\n.mrm-reader-toolbar-primary { display: grid; grid-template-columns: auto auto minmax(0,1fr) auto auto; align-items: center; gap: 8px; }\n.mrm-reader-toolbar-primary h2 { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 1rem; text-align: center; }\n.mrm-reader-toolbar button, .mrm-reader-footer button { min-height: 40px; border: 0; border-radius: 9px; background: var(--mrm-surface-2); color: var(--mrm-text); padding: 6px 10px; }\n.mrm-reader-toolbar-secondary { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: thin; }\n.mrm-reader-toolbar-secondary button { flex: 0 0 auto; }\n.mrm-reader-progress { background: var(--mrm-surface); padding: 3px 10px; }\n.mrm-reader-progress input { width: 100%; accent-color: var(--mrm-accent); }\n.mrm-reader-body { min-height: 0; display: grid; grid-template-columns: 112px minmax(0,1fr); }\n.mrm-reader-thumbnails { overflow-y: auto; padding: 8px; background: #0f1117; }\n.mrm-reader-thumbnail { width: 100%; display: grid; gap: 4px; margin-bottom: 8px; border: 2px solid transparent; border-radius: 8px; overflow: hidden; background: var(--mrm-surface-2); color: var(--mrm-text); padding: 3px; }\n.mrm-reader-thumbnail.is-active { border-color: var(--mrm-accent); }\n.mrm-reader-thumbnail img { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; }\n.mrm-reader-stage { min-width: 0; min-height: 0; overflow: auto; scroll-snap-type: y proximity; background: #050608; }\n.mrm-reader-page { width: min(100%, 980px); margin: 0 auto; display: grid; justify-items: center; scroll-snap-align: start; }\n.mrm-reader-page img { display: block; max-width: 100%; width: auto; height: auto; background: #111; }\n.mrm-reader-page figcaption { padding: 6px 10px; color: var(--mrm-muted); font-size: .76rem; }\n.mrm-reader-modal[data-view=\"strip-gaps\"] .mrm-reader-page { margin-block: 14px; }\n.mrm-reader-modal[data-view=\"paged\"] .mrm-reader-stage { display: grid; place-items: center; padding: 8px; }\n.mrm-reader-modal[data-view=\"paged\"] .mrm-reader-page { height: 100%; align-content: center; }\n.mrm-reader-modal[data-fit=\"height\"] .mrm-reader-page img { max-height: calc(100vh - 180px); width: auto; }\n.mrm-reader-modal[data-fit=\"width\"] .mrm-reader-page img { width: 100%; max-height: none; }\n.mrm-reader-modal[data-width=\"comfort\"] .mrm-reader-page { max-width: 920px; }\n.mrm-reader-modal[data-width=\"wide\"] .mrm-reader-page { max-width: 1480px; }\n.mrm-reader-modal[data-thumbnails=\"off\"] .mrm-reader-body { grid-template-columns: minmax(0,1fr); }\n.mrm-reader-modal[data-thumbnails=\"off\"] .mrm-reader-thumbnails { display: none; }\n.mrm-reader-comments { overflow: auto; padding: clamp(14px, 3vw, 40px); background: var(--mrm-bg); }\n.mrm-reader-status { place-self: center; padding: 22px; border-radius: 14px; background: var(--mrm-surface); }\n.mrm-reader-error { color: #ff9a9a; }\n.mrm-reader-footer { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 7px 10px; background: var(--mrm-surface); }\n.mrm-reader-mobile-zones { display: none; }\n.mrm-reader-modal.is-toolbar-hidden .mrm-reader-toolbar { transform: translateY(-100%); position: absolute; width: 100%; }\n.mrm-post-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 18px; }\n.mrm-post-actions button { min-height: 46px; border: 0; border-radius: 11px; padding: 10px 16px; background: var(--mrm-surface-2); color: var(--mrm-text); }\nhtml.mrm-ui-enabled .mrm-post-page .entry-content > div:has(> img.img-myreadingmanga) { display: grid; justify-items: center; }\nhtml.mrm-ui-enabled .mrm-post-page .img-myreadingmanga { max-width: min(100%, 1100px); height: auto; }\n@media (max-width: 760px) {\n  .mrm-reader-modal { grid-template-rows: auto auto minmax(0,1fr); }\n  .mrm-reader-toolbar { padding: 6px; }\n  .mrm-reader-toolbar-primary { grid-template-columns: auto minmax(0,1fr) auto; }\n  .mrm-reader-toolbar-primary [data-reader-action=\"previous-post\"], .mrm-reader-toolbar-primary [data-reader-action=\"next-post\"] { display: none; }\n  .mrm-reader-toolbar-secondary { max-width: 100vw; }\n  .mrm-reader-body { grid-template-columns: minmax(0,1fr); }\n  .mrm-reader-thumbnails { display: none; }\n  .mrm-reader-footer { display: none; }\n  .mrm-reader-mobile-zones { pointer-events: none; display: grid; grid-template-columns: 30% 40% 30%; position: absolute; inset: 112px 0 0; z-index: 2; }\n  .mrm-reader-mobile-zones button { pointer-events: auto; border: 0; background: transparent; }\n  .mrm-reader-page figcaption { display: none; }\n  .mrm-reader-modal[data-fit=\"height\"] .mrm-reader-page img { max-height: calc(100vh - 125px); }\n}\n\n.mrm-post-taxonomies { flex-basis: 100%; display: flex; flex-wrap: wrap; gap: 6px; }\n.mrm-reader-toolbar button:disabled, .mrm-reader-footer button:disabled { opacity: .42; cursor: not-allowed; }\n\n/* settings.css */\n#mrm-panel-launcher { position: fixed; z-index: 2147481000; top: 45%; right: 0; min-width: 48px; min-height: 48px; border: 0; border-radius: 14px 0 0 14px; background: var(--mrm-accent); color: #09090d; font-weight: 900; box-shadow: var(--mrm-shadow); cursor: pointer; }\nhtml[data-mrm-dock=\"left\"] #mrm-panel-launcher { right: auto; left: 0; border-radius: 0 14px 14px 0; }\n.mrm-control-panel[hidden] { display: none !important; }\n.mrm-control-panel { position: fixed; z-index: 2147482000; inset: 10px 10px 10px auto; width: min(420px, calc(100vw - 20px)); display: grid; grid-template-rows: auto auto minmax(0,1fr); background: var(--mrm-surface); color: var(--mrm-text); border-radius: 20px; box-shadow: var(--mrm-shadow); overflow: hidden; }\nhtml[data-mrm-dock=\"left\"] .mrm-control-panel { inset: 10px auto 10px 10px; }\nhtml[data-mrm-border-panel=\"on\"] .mrm-control-panel { border: 1px solid var(--mrm-line); }\n.mrm-panel-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 16px; }\n.mrm-panel-header div { display: grid; gap: 3px; }\n.mrm-panel-header span { color: var(--mrm-muted); font-size: .82rem; }\n.mrm-panel-header button, .mrm-facet-modal header button { min-width: 42px; min-height: 42px; border: 0; border-radius: 50%; background: var(--mrm-surface-2); color: var(--mrm-text); font-size: 1.4rem; }\n.mrm-panel-tabs { display: grid; grid-template-columns: repeat(3, 1fr); padding: 0 12px 12px; gap: 6px; }\n.mrm-panel-tabs button { min-height: 40px; border: 0; border-radius: 10px; background: var(--mrm-surface-2); color: var(--mrm-muted); }\n.mrm-panel-tabs button[aria-selected=\"true\"] { background: color-mix(in srgb, var(--mrm-accent) 24%, var(--mrm-surface-2)); color: var(--mrm-text); }\n.mrm-panel-scroll { overflow: auto; padding: 0 14px 18px; }\n.mrm-panel-scroll section { display: grid; gap: 14px; }\n.mrm-panel-scroll section[hidden] { display: none; }\n.mrm-field { display: grid; grid-template-columns: 1fr auto; gap: 7px 10px; align-items: center; }\n.mrm-field > input[type=\"search\"], .mrm-field > input[type=\"text\"], .mrm-field > select, .mrm-facet-group > input { grid-column: 1 / -1; width: 100%; min-height: 42px; border: 1px solid var(--mrm-line); border-radius: 10px; background: var(--mrm-surface-2); color: var(--mrm-text); padding: 8px 10px; }\n.mrm-field > input[type=\"range\"] { grid-column: 1 / -1; width: 100%; accent-color: var(--mrm-accent); }\n.mrm-toggle-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; min-height: 42px; }\n.mrm-toggle-row input { width: 22px; height: 22px; accent-color: var(--mrm-accent); }\n.mrm-inline-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }\n.mrm-inline-actions button, .mrm-facet-more, [data-panel-section=\"theme\"] > button { min-height: 42px; border: 0; border-radius: 10px; background: var(--mrm-surface-2); color: var(--mrm-text); }\n.mrm-active-filters { display: flex; flex-wrap: wrap; gap: 6px; }\n.mrm-filter-chip { display: inline-flex; gap: 6px; align-items: center; color: var(--mrm-text); }\n.mrm-facets { display: grid; gap: 8px; }\n.mrm-facet-group { border-radius: 12px; background: var(--mrm-surface-2); padding: 10px; }\n.mrm-facet-group summary { cursor: pointer; font-weight: 700; }\n.mrm-facet-group > input { margin-top: 10px; }\n.mrm-facet-list { display: grid; gap: 4px; margin-top: 8px; }\n.mrm-facet-term { display: grid; grid-template-columns: minmax(0,1fr) auto 42px 48px; gap: 6px; align-items: center; min-height: 38px; }\n.mrm-facet-term span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.mrm-facet-term small { color: var(--mrm-muted); }\n.mrm-facet-term button { min-height: 34px; border: 1px solid var(--mrm-line); border-radius: 8px; background: transparent; color: var(--mrm-muted); font-size: .7rem; }\n.mrm-facet-term button[aria-pressed=\"true\"] { background: var(--mrm-accent); color: #09090d; border-color: transparent; font-weight: 800; }\n.mrm-border-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; border: 1px solid var(--mrm-line); border-radius: 12px; padding: 10px 12px; }\n.mrm-border-grid legend { padding-inline: 5px; }\n.mrm-facet-modal { position: fixed; z-index: 2147483000; inset: 0; display: grid; place-items: center; padding: 14px; background: rgba(0,0,0,.72); }\n.mrm-facet-modal-card { width: min(680px, 100%); max-height: min(84vh, 760px); display: grid; grid-template-rows: auto auto minmax(0,1fr); gap: 12px; background: var(--mrm-surface); border-radius: 18px; padding: 16px; box-shadow: var(--mrm-shadow); }\n.mrm-facet-modal header { display: flex; justify-content: space-between; align-items: center; }\n.mrm-facet-modal input { min-height: 44px; border: 1px solid var(--mrm-line); border-radius: 10px; background: var(--mrm-surface-2); color: var(--mrm-text); padding: 8px 10px; }\n.mrm-facet-modal-list { overflow: auto; display: grid; gap: 5px; }\nhtml.mrm-ui-disabled #mrm-panel-launcher, html.mrm-ui-disabled #mrm-control-panel { display: none !important; }\n@media (max-width: 680px) { .mrm-control-panel { inset: 0 !important; width: 100vw; border-radius: 0; } #mrm-panel-launcher { top: auto; bottom: 74px; } }\n\n#mrm-native-search-controls { display: grid; gap: 8px; }\n#mrm-native-search-controls > button { min-height: 42px; border: 0; border-radius: 10px; background: color-mix(in srgb, var(--mrm-accent) 22%, var(--mrm-surface-2)); color: var(--mrm-text); font-weight: 750; }\n.mrm-facet-modal-card { grid-template-rows: auto auto minmax(0,1fr) auto; }\n.mrm-facet-modal-pagination { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; }\n.mrm-facet-modal-pagination button { min-height: 40px; border: 0; border-radius: 9px; background: var(--mrm-surface-2); color: var(--mrm-text); }\n.mrm-facet-modal-pagination button:disabled { opacity: .45; }",
  };

  // module: 00-core.js
  MRM.events = new EventTarget();
  MRM.runtime = {
    page: null,
    cards: [],
    panelOpen: false,
    facetModalOpen: false,
    reader: null,
    archiveObserver: null,
    readerObserver: null,
    refreshTimer: 0,
    lastFocused: null,
  };
  
  MRM.selectors = Object.freeze({
    archiveCards: "article.post.entry:has(.entry-title-link)",
    titleLink: ".entry-title-link",
    coverImage: ".entry-image, .post-image",
    postArticle: "body.single-post article.post.entry, body.wp-singular article.post.entry",
    postContent: "article.post.entry > .entry-content, .single-post .entry-content",
    mangaImages: ".entry-content img.img-myreadingmanga, .entry-content img[class*='myreadingmanga']",
    comments: "#comments, #wpdcom, .wpdiscuz-comments",
    commentsCount: ".entry-comments-link, .wpd-thread-head .wpd-thread-info, [class*='comment-count']",
    nativeFacets: ".ep-filter-widget.widget_ep-facet, .widget_ep-facet",
    nativeFacetTitle: ".ep-filter-title",
    nativeFacetTerm: ".term[data-term-slug]",
    mainContent: ".content, main, .site-inner",
    pagination: ".pagination, .archive-pagination, .entry-pagination",
  });
  
  MRM.util = (() => {
    const text = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    const normalize = (value) => text(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
    const slugLabel = (value) => text(value).replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const q = (selector, root = document) => root.querySelector(selector);
    const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const create = (tag, options = {}) => {
      const node = document.createElement(tag);
      if (options.className) node.className = options.className;
      if (options.text !== undefined) node.textContent = options.text;
      if (options.html !== undefined) node.innerHTML = options.html;
      if (options.attrs) for (const [name, value] of Object.entries(options.attrs)) {
        if (value === false || value == null) continue;
        if (value === true) node.setAttribute(name, "");
        else node.setAttribute(name, String(value));
      }
      if (options.dataset) for (const [name, value] of Object.entries(options.dataset)) node.dataset[name] = String(value);
      return node;
    };
    const debounce = (fn, delay = 120) => {
      let timer = 0;
      return (...args) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => fn(...args), delay);
      };
    };
    const throttle = (fn, delay = 120) => {
      let pending = false;
      let latest = null;
      return (...args) => {
        latest = args;
        if (pending) return;
        pending = true;
        window.setTimeout(() => {
          pending = false;
          fn(...latest);
        }, delay);
      };
    };
    const idle = (fn, timeout = 600) => {
      if ("requestIdleCallback" in window) return window.requestIdleCallback(fn, { timeout });
      return window.setTimeout(fn, 1);
    };
    const canonicalUrl = (raw) => {
      try {
        const url = new URL(raw, location.href);
        url.hash = "";
        url.searchParams.delete("output");
        return url.href.replace(/\/$/, "") + "/";
      } catch {
        return "";
      }
    };
    const bestSrcset = (srcset) => {
      const candidates = String(srcset || "").split(",").map((part) => {
        const [url, descriptor = "0w"] = part.trim().split(/\s+/);
        const score = Number.parseFloat(descriptor) || 0;
        return { url, score };
      }).filter((item) => item.url);
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0]?.url || "";
    };
    const imageSource = (img) => {
      if (!img) return "";
      const srcset = img.getAttribute("data-srcset") || img.getAttribute("data-lazy-srcset") || img.getAttribute("srcset");
      const candidates = [
        bestSrcset(srcset),
        img.getAttribute("data-lazy-src"),
        img.getAttribute("data-src"),
        img.getAttribute("data-original"),
        img.currentSrc,
        img.getAttribute("src"),
      ].filter(Boolean);
      return candidates.find((src) => !/^data:,$/.test(src) && !/^data:image\/svg\+xml/i.test(src)) || "";
    };
    const safeFetchDocument = async (url, signal) => {
      const target = new URL(url, location.href);
      if (target.hostname !== location.hostname) throw new Error("Cross-origin reader fetch blocked");
      const response = await fetch(target.href, { credentials: "include", signal, headers: { Accept: "text/html" } });
      if (!response.ok) throw new Error(`Reader fetch failed (${response.status})`);
      const html = await response.text();
      return new DOMParser().parseFromString(html, "text/html");
    };
    const unique = (items, keyFn = (item) => item) => {
      const seen = new Set();
      return items.filter((item) => {
        const key = keyFn(item);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
    })[char]);
    const announce = (message) => {
      let region = q("#mrm-live-region");
      if (!region) {
        region = create("div", { attrs: { id: "mrm-live-region", role: "status", "aria-live": "polite" }, className: "mrm-sr-only" });
        document.body.append(region);
      }
      region.textContent = "";
      requestAnimationFrame(() => { region.textContent = message; });
    };
    const focusable = (root) => qa("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])", root)
      .filter((node) => !node.hidden && node.getClientRects().length);
    const trapFocus = (event, root) => {
      if (event.key !== "Tab") return;
      const nodes = focusable(root);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    const pageTitle = (doc = document) => text(q("article.post.entry .entry-title", doc)?.textContent || doc.title);
    return { text, normalize, slugLabel, clamp, q, qa, create, debounce, throttle, idle, canonicalUrl, imageSource, safeFetchDocument, unique, escapeHtml, announce, focusable, trapFocus, pageTitle };
  })();

  // module: 01-storage.js
  MRM.storage = (() => {
    const key = `${MRM.config.storagePrefix}:preferences`;
    const readKey = `${MRM.config.storagePrefix}:read-posts`;
    const facetCacheKey = `${MRM.config.storagePrefix}:facet-directory`;
    const readerCachePrefix = `${MRM.config.storagePrefix}:reader-pages:`;
    const defaults = Object.freeze({
      uiEnabled: true,
      dock: "right",
      accent: "#9b7cff",
      border: { header: false, cards: true, pagination: false, reader: false, panel: true, chips: true },
      grid: { desktop: 6, tablet: 4, mobile: 2, gap: 16, ratio: 0.714 },
      filters: { query: "", hideRead: false, onlyEnglish: false, sort: "default", include: {}, exclude: { tag: ["cuntboy", "ai", "shota"] } },
      reader: { view: "strip", width: "comfort", fit: "width", direction: "ltr", thumbnails: true, autoHideToolbar: true },
    });
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const merge = (base, incoming) => {
      if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return base;
      const out = { ...base };
      for (const [name, value] of Object.entries(incoming)) {
        if (value && typeof value === "object" && !Array.isArray(value) && base[name] && typeof base[name] === "object") out[name] = merge(base[name], value);
        else out[name] = value;
      }
      return out;
    };
    const parse = (raw, fallback) => {
      try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
    };
    let preferences = merge(clone(defaults), parse(localStorage.getItem(key), {}));
    let readPosts = parse(localStorage.getItem(readKey), {});
    const persist = () => localStorage.setItem(key, JSON.stringify(preferences));
    const update = (patch) => {
      preferences = merge(preferences, patch);
      persist();
      MRM.events.dispatchEvent(new CustomEvent("preferences", { detail: preferences }));
      return preferences;
    };
    const replaceFilters = (filters) => {
      preferences = { ...preferences, filters: clone(filters) };
      persist();
      MRM.events.dispatchEvent(new CustomEvent("preferences", { detail: preferences }));
      return preferences;
    };
    const markRead = (url, title = "") => {
      const normalized = MRM.util.canonicalUrl(url);
      if (!normalized) return;
      readPosts[normalized] = { title: MRM.util.text(title), readAt: Date.now() };
      const entries = Object.entries(readPosts).sort((a, b) => b[1].readAt - a[1].readAt).slice(0, 5000);
      readPosts = Object.fromEntries(entries);
      localStorage.setItem(readKey, JSON.stringify(readPosts));
      MRM.events.dispatchEvent(new CustomEvent("read-history", { detail: { url: normalized } }));
    };
    const isRead = (url) => Boolean(readPosts[MRM.util.canonicalUrl(url)]);
    const clearRead = () => {
      readPosts = {};
      localStorage.removeItem(readKey);
      MRM.events.dispatchEvent(new Event("read-history"));
    };
    const getFacetCache = () => {
      const cached = parse(localStorage.getItem(facetCacheKey), null);
      if (!cached || Date.now() - cached.savedAt > 14 * 24 * 60 * 60 * 1000) return null;
      return cached.value;
    };
    const setFacetCache = (value) => localStorage.setItem(facetCacheKey, JSON.stringify({ savedAt: Date.now(), value }));
    const readerCacheKey = (url) => `${readerCachePrefix}${encodeURIComponent(MRM.util.canonicalUrl(url))}`;
    const getReaderCache = (url) => {
      try {
        const cached = parse(sessionStorage.getItem(readerCacheKey(url)), null);
        if (!cached || Date.now() - cached.savedAt > 30 * 60 * 1000 || !Array.isArray(cached.pages) || !cached.pages.length) return null;
        return cached;
      } catch { return null; }
    };
    const setReaderCache = (url, title, pages) => {
      try {
        const compactPages = pages.slice(0, 1000).map(({ src, alt, width, height }) => ({ src, alt, width, height }));
        sessionStorage.setItem(readerCacheKey(url), JSON.stringify({ savedAt: Date.now(), title: MRM.util.text(title), pages: compactPages }));
      } catch { /* Session storage can be unavailable in hardened contexts. */ }
    };
    return {
      defaults,
      get preferences() { return preferences; },
      get readPosts() { return readPosts; },
      update,
      replaceFilters,
      markRead,
      isRead,
      clearRead,
      getFacetCache,
      setFacetCache,
      getReaderCache,
      setReaderCache,
    };
  })();

  // module: 02-site-model.js
  MRM.site = (() => {
    const facetPrefixes = Object.freeze({
      lang: "Language",
      category: "Category",
      genre: "Genre",
      tag: "Tag",
      artist: "Artist",
      pairing: "Pairing",
      group: "Group",
      status: "Status",
    });
    const ignoredClasses = new Set(["status-publish"]);
    const detectPage = (doc = document) => {
      const body = doc.body;
      if (!body) return "unknown";
      if (body.matches(".single-post, .wp-singular") || MRM.util.q(MRM.selectors.mangaImages, doc)) return "post";
      if (body.matches(".search, .search-results") || MRM.util.q(MRM.selectors.nativeFacets, doc)) return "search";
      if (MRM.util.qa(MRM.selectors.archiveCards, doc).length) return "archive";
      return "unknown";
    };
    const taxonomiesFromClasses = (article) => {
      const result = {};
      for (const className of article.classList) {
        const index = className.indexOf("-");
        if (index < 1) continue;
        const prefix = className.slice(0, index);
        const value = className.slice(index + 1);
        if (!facetPrefixes[prefix] || !value || ignoredClasses.has(className) || /^\d+$/.test(value)) continue;
        if (!result[prefix]) result[prefix] = [];
        result[prefix].push(value);
      }
      for (const values of Object.values(result)) values.sort();
      return result;
    };
    const parseCard = (article, order) => {
      const link = MRM.util.q(MRM.selectors.titleLink, article) || MRM.util.q("a[href]", article);
      if (!link) return null;
      const url = MRM.util.canonicalUrl(link.href);
      if (!url || new URL(url).hostname !== location.hostname) return null;
      const title = MRM.util.text(link.textContent || article.getAttribute("aria-label"));
      const taxonomies = taxonomiesFromClasses(article);
      const image = MRM.util.q(MRM.selectors.coverImage, article);
      const haystack = MRM.util.normalize([title, ...Object.values(taxonomies).flat().map(MRM.util.slugLabel)].join(" "));
      return { article, link, image, url, title, order, taxonomies, haystack, isEnglish: taxonomies.lang?.includes("english") || /\[eng(?:lish)?\]/i.test(title) };
    };
    const collectCards = (root = document) => MRM.util.qa(MRM.selectors.archiveCards, root)
      .filter((article) => !article.closest(".yarpp-related, .related-posts, #comments"))
      .map(parseCard)
      .filter(Boolean);
    const nativeFacets = (doc = document) => {
      const groups = {};
      for (const widget of MRM.util.qa(MRM.selectors.nativeFacets, doc)) {
        const rawTitle = MRM.util.text(MRM.util.q(MRM.selectors.nativeFacetTitle, widget)?.textContent).toLocaleLowerCase();
        let type = Object.keys(facetPrefixes).find((prefix) => rawTitle.includes(prefix));
        if (rawTitle.includes("circle") || rawTitle.includes("artist")) type = "artist";
        if (!type) continue;
        const terms = MRM.util.qa(MRM.selectors.nativeFacetTerm, widget).map((term) => {
          const anchor = MRM.util.q("a[href]", term);
          const countText = MRM.util.text(MRM.util.q("span", term)?.textContent).replace(/[^\d]/g, "");
          return {
            slug: term.dataset.termSlug,
            name: term.dataset.termName || MRM.util.text(anchor?.childNodes?.[1]?.textContent || anchor?.textContent).replace(/\(\d+\)$/, "").trim(),
            count: Number(countText) || 0,
            href: anchor?.href || "",
          };
        }).filter((term) => term.slug);
        if (terms.length) groups[type] = terms;
      }
      return groups;
    };
    const syntheticFacets = (cards) => {
      const counts = {};
      for (const card of cards) for (const [type, values] of Object.entries(card.taxonomies)) {
        counts[type] ||= {};
        for (const value of values) counts[type][value] = (counts[type][value] || 0) + 1;
      }
      return Object.fromEntries(Object.entries(counts).map(([type, values]) => [type, Object.entries(values)
        .map(([slug, count]) => ({ slug, name: MRM.util.slugLabel(slug), count, href: "" }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))]));
    };
    const extractImages = (doc = document) => {
      const content = MRM.util.q(MRM.selectors.postContent, doc) || doc;
      const selectors = [
        MRM.selectors.mangaImages,
        ".entry-content img[data-src]",
        ".entry-content img[data-lazy-src]",
        ".entry-content picture img",
      ].join(",");
      const images = MRM.util.qa(selectors, content).map((img, index) => {
        const src = MRM.util.imageSource(img);
        const width = Number(img.getAttribute("width")) || img.naturalWidth || 0;
        const height = Number(img.getAttribute("height")) || img.naturalHeight || 0;
        const marker = MRM.util.normalize(`${img.className} ${img.alt} ${src}`);
        if (!src || /avatar|emoji|logo|icon|banner|advert|gravatar/.test(marker)) return null;
        if (width && height && width < 250 && height < 250) return null;
        return { src: new URL(src, doc.baseURI || location.href).href, alt: MRM.util.text(img.alt) || `Page ${index + 1}`, width, height };
      }).filter(Boolean);
      return MRM.util.unique(images, (item) => item.src);
    };
    const commentsCount = (doc = document) => {
      const candidates = MRM.util.qa(MRM.selectors.commentsCount, doc).map((node) => MRM.util.text(node.textContent));
      for (const candidate of candidates) {
        const match = candidate.match(/\d+/);
        if (match) return Number(match[0]);
      }
      return MRM.util.q(MRM.selectors.comments, doc) ? null : 0;
    };
    const adjacentLinks = (doc = document) => {
      const prev = MRM.util.q("a[rel~='prev'], .previous a, .pagination-previous a, .adjacent-entry-pagination .previous a", doc);
      const next = MRM.util.q("a[rel~='next'], .next a, .pagination-next a, .adjacent-entry-pagination .next a", doc);
      return { prev: prev?.href || "", next: next?.href || "" };
    };
    return { facetPrefixes, detectPage, taxonomiesFromClasses, parseCard, collectCards, nativeFacets, syntheticFacets, extractImages, commentsCount, adjacentLinks };
  })();

  // module: 03-theme.js
  MRM.theme = (() => {
    const styleId = "mrm-reimagined-styles";
    const install = () => {
      if (!document.getElementById(styleId)) {
        const style = MRM.util.create("style", { attrs: { id: styleId }, text: MRM.css });
        document.documentElement.append(style);
      }
      apply(MRM.storage.preferences);
    };
    const apply = (preferences) => {
      const root = document.documentElement;
      root.classList.toggle("mrm-ui-enabled", Boolean(preferences.uiEnabled));
      root.classList.toggle("mrm-ui-disabled", !preferences.uiEnabled);
      root.dataset.mrmDock = preferences.dock;
      root.style.setProperty("--mrm-accent", preferences.accent);
      root.style.setProperty("--mrm-grid-desktop", preferences.grid.desktop);
      root.style.setProperty("--mrm-grid-tablet", preferences.grid.tablet);
      root.style.setProperty("--mrm-grid-mobile", preferences.grid.mobile);
      root.style.setProperty("--mrm-grid-gap", `${preferences.grid.gap}px`);
      root.style.setProperty("--mrm-cover-ratio", preferences.grid.ratio);
      for (const [name, enabled] of Object.entries(preferences.border)) root.dataset[`mrmBorder${name[0].toUpperCase()}${name.slice(1)}`] = enabled ? "on" : "off";
      document.body?.classList.toggle("mrm-reader-capable", true);
    };
    MRM.events.addEventListener("preferences", (event) => apply(event.detail));
    return { install, apply };
  })();

  // module: 04-facets.js
  MRM.facets = (() => {
    const paramFor = Object.freeze({ lang: "ep_filter_lang", category: "ep_filter_category", genre: "ep_filter_genre", tag: "ep_filter_post_tag", artist: "ep_filter_artist", pairing: "ep_filter_pairing", group: "ep_filter_group", status: "ep_filter_status" });
    let directory = {};
    const buildDirectory = (cards) => {
      const native = MRM.site.nativeFacets();
      const synthetic = MRM.site.syntheticFacets(cards);
      const cached = MRM.storage.getFacetCache() || {};
      directory = {};
      for (const type of Object.keys(MRM.site.facetPrefixes)) {
        const merged = new Map();
        for (const source of [cached[type] || [], synthetic[type] || [], native[type] || []]) for (const term of source) {
          const prior = merged.get(term.slug) || {};
          merged.set(term.slug, { ...prior, ...term, count: Math.max(prior.count || 0, term.count || 0) });
        }
        if (merged.size) directory[type] = [...merged.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      }
      if (Object.keys(native).length) MRM.storage.setFacetCache(directory);
      return directory;
    };
    const activeFor = (mode, type) => MRM.storage.preferences.filters[mode]?.[type] || [];
    const setActive = (mode, type, values) => {
      const filters = structuredClone(MRM.storage.preferences.filters);
      filters[mode] ||= {};
      if (values.length) filters[mode][type] = values;
      else delete filters[mode][type];
      MRM.storage.replaceFilters(filters);
    };
    const toggle = (mode, type, slug) => {
      const current = new Set(activeFor(mode, type));
      current.has(slug) ? current.delete(slug) : current.add(slug);
      const otherMode = mode === "include" ? "exclude" : "include";
      const other = new Set(activeFor(otherMode, type));
      other.delete(slug);
      const filters = structuredClone(MRM.storage.preferences.filters);
      filters[mode] ||= {}; filters[otherMode] ||= {};
      current.size ? filters[mode][type] = [...current] : delete filters[mode][type];
      other.size ? filters[otherMode][type] = [...other] : delete filters[otherMode][type];
      MRM.storage.replaceFilters(filters);
    };
    const matches = (card, filters) => {
      for (const [type, values] of Object.entries(filters.include || {})) {
        if (!values.length) continue;
        const cardValues = new Set(card.taxonomies[type] || []);
        if (!values.some((value) => cardValues.has(value))) return false;
      }
      for (const [type, values] of Object.entries(filters.exclude || {})) {
        if (!values.length) continue;
        const cardValues = new Set(card.taxonomies[type] || []);
        if (values.some((value) => cardValues.has(value))) return false;
      }
      return true;
    };
    const nativeSortValue = () => {
      const url = new URL(location.href);
      return url.searchParams.get("ep_sort") || MRM.util.q("#ep-sort")?.value || "";
    };
    const nativeApplyUrl = (filters = MRM.storage.preferences.filters, sortValue = nativeSortValue()) => {
      if (MRM.runtime.page !== "search") return "";
      const url = new URL(location.href);
      for (const [type, parameter] of Object.entries(paramFor)) {
        url.searchParams.delete(parameter);
        const included = filters.include?.[type] || [];
        if (included.length) url.searchParams.set(parameter, included.join(","));
      }
      if (sortValue) url.searchParams.set("ep_sort", sortValue);
      else url.searchParams.delete("ep_sort");
      return url.href;
    };
    const applyNative = (sortValue = nativeSortValue()) => {
      const target = nativeApplyUrl(MRM.storage.preferences.filters, sortValue);
      if (target && target !== location.href) location.assign(target);
    };
    const syncFromUrl = () => {
      if (MRM.runtime.page !== "search") return;
      const url = new URL(location.href);
      const filters = structuredClone(MRM.storage.preferences.filters);
      filters.include ||= {};
      let changed = false;
      for (const [type, parameter] of Object.entries(paramFor)) {
        const values = (url.searchParams.get(parameter) || "").split(",").map((value) => value.trim()).filter(Boolean);
        const prior = filters.include[type] || [];
        if (JSON.stringify(values) !== JSON.stringify(prior)) changed = true;
        if (values.length) filters.include[type] = values;
        else delete filters.include[type];
      }
      if (changed) MRM.storage.replaceFilters(filters);
    };
    const clear = () => {
      const filters = structuredClone(MRM.storage.preferences.filters);
      filters.include = {}; filters.exclude = {};
      MRM.storage.replaceFilters(filters);
    };
    return { paramFor, buildDirectory, get directory() { return directory; }, activeFor, setActive, toggle, matches, nativeSortValue, nativeApplyUrl, applyNative, syncFromUrl, clear };
  })();

  // module: 05-archive.js
  MRM.archive = (() => {
    const enhancedAttr = "data-mrm-enhanced";
    const filterAndSort = () => {
      const { filters } = MRM.storage.preferences;
      const query = MRM.util.normalize(filters.query);
      let visible = MRM.runtime.cards.filter((card) => {
        if (query && !card.haystack.includes(query)) return false;
        if (filters.hideRead && MRM.storage.isRead(card.url)) return false;
        if (filters.onlyEnglish && !card.isEnglish) return false;
        return MRM.facets.matches(card, filters);
      });
      const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
      if (filters.sort === "title-asc") visible.sort((a, b) => collator.compare(a.title, b.title));
      else if (filters.sort === "title-desc") visible.sort((a, b) => collator.compare(b.title, a.title));
      else if (filters.sort === "english-first") visible.sort((a, b) => Number(b.isEnglish) - Number(a.isEnglish) || a.order - b.order);
      else visible.sort((a, b) => a.order - b.order);
      const visibleSet = new Set(visible.map((card) => card.url));
      const root = findGridRoot();
      for (const card of MRM.runtime.cards) {
        card.article.hidden = !visibleSet.has(card.url);
        card.article.classList.toggle("mrm-is-read", MRM.storage.isRead(card.url));
        if (!card.article.hidden && root) root.append(card.article);
      }
      MRM.util.q("#mrm-result-count")?.replaceChildren(document.createTextNode(`${visible.length} of ${MRM.runtime.cards.length}`));
      MRM.util.announce(`${visible.length} results visible`);
      renderActiveChips();
      return visible;
    };
    const findGridRoot = () => {
      const first = MRM.runtime.cards[0]?.article;
      return first?.parentElement || null;
    };
    const chip = (label, onRemove) => {
      const button = MRM.util.create("button", { className: "mrm-filter-chip", attrs: { type: "button", "aria-label": `Remove ${label}` } });
      button.append(MRM.util.create("span", { text: label }), MRM.util.create("span", { text: "×", attrs: { "aria-hidden": "true" } }));
      button.addEventListener("click", onRemove);
      return button;
    };
    const renderActiveChips = () => {
      const host = MRM.util.q("#mrm-active-filters");
      if (!host) return;
      host.replaceChildren();
      const filters = MRM.storage.preferences.filters;
      if (filters.query) host.append(chip(`Search: ${filters.query}`, () => MRM.storage.replaceFilters({ ...filters, query: "" })));
      if (filters.hideRead) host.append(chip("Hide read", () => MRM.storage.replaceFilters({ ...filters, hideRead: false })));
      if (filters.onlyEnglish) host.append(chip("English only", () => MRM.storage.replaceFilters({ ...filters, onlyEnglish: false })));
      for (const mode of ["include", "exclude"]) for (const [type, values] of Object.entries(filters[mode] || {})) for (const value of values) {
        host.append(chip(`${mode === "include" ? "IN" : "OUT"} · ${MRM.site.facetPrefixes[type]} · ${MRM.util.slugLabel(value)}`, () => MRM.facets.toggle(mode, type, value)));
      }
    };
    const metadataChips = (card) => {
      const row = MRM.util.create("div", { className: "mrm-card-chips" });
      const priority = ["lang", "genre", "category", "artist", "tag", "status", "group", "pairing"];
      const values = priority.flatMap((type) => (card.taxonomies[type] || []).map((slug) => ({ type, slug })));
      for (const item of values.slice(0, 7)) {
        const anchor = MRM.util.create("button", { className: "mrm-taxonomy-chip", text: MRM.util.slugLabel(item.slug), attrs: { type: "button", title: `Include ${MRM.site.facetPrefixes[item.type]}: ${MRM.util.slugLabel(item.slug)}` } });
        anchor.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); MRM.facets.toggle("include", item.type, item.slug); });
        row.append(anchor);
      }
      if (values.length > 7) {
        const more = MRM.util.create("button", { className: "mrm-taxonomy-chip", text: `+${values.length - 7}`, attrs: { type: "button", "aria-label": `Show ${values.length - 7} more tags` } });
        more.addEventListener("click", (event) => {
          event.preventDefault(); event.stopPropagation();
          MRM.settings.openFacetModal(null, values.map((item) => ({ ...item, name: MRM.util.slugLabel(item.slug), count: 0 })), `${card.title} metadata`);
        });
        row.append(more);
      }
      return row;
    };
    const enhanceCard = (card) => {
      if (card.article.hasAttribute(enhancedAttr)) return;
      card.article.setAttribute(enhancedAttr, "true");
      card.article.classList.add("mrm-card");
      card.article.dataset.mrmUrl = card.url;
      const content = MRM.util.q(".entry-content", card.article) || card.article;
      const imageLink = MRM.util.q(".entry-image-link", card.article);
      if (imageLink) imageLink.removeAttribute("aria-hidden");
      if (card.image) {
        card.image.alt = card.image.alt || card.title;
        card.image.loading = card.order < 8 ? "eager" : "lazy";
        card.image.decoding = "async";
      }
      const footer = MRM.util.q(".entry-footer", card.article) || MRM.util.create("footer", { className: "entry-footer" });
      if (!footer.parentElement) card.article.append(footer);
      const actions = MRM.util.create("div", { className: "mrm-card-actions" });
      const reader = MRM.util.create("button", { className: "mrm-reader-button", text: "Reader", attrs: { type: "button", "aria-label": `Open ${card.title} in reader` } });
      reader.addEventListener("click", (event) => {
        event.preventDefault();
        MRM.reader.open(card.url, { sequence: visibleCards().map((item) => item.url), trigger: reader });
      });
      actions.append(reader);
      footer.replaceChildren(metadataChips(card), actions);
      card.link.addEventListener("click", () => MRM.storage.markRead(card.url, card.title), { passive: true });
      content.classList.add("mrm-card-cover");
    };
    const visibleCards = () => MRM.runtime.cards.filter((card) => !card.article.hidden);
    const markVisibleRead = () => {
      for (const card of visibleCards()) MRM.storage.markRead(card.url, card.title);
      filterAndSort();
    };
    const scan = (root = document) => {
      const parsed = MRM.site.collectCards(root);
      if (!parsed.length) return;
      const existing = new Map(MRM.runtime.cards.map((card) => [card.url, card]));
      let order = MRM.runtime.cards.length;
      for (const card of parsed) {
        if (existing.has(card.url)) continue;
        card.order = order++;
        MRM.runtime.cards.push(card);
        enhanceCard(card);
      }
      MRM.facets.buildDirectory(MRM.runtime.cards);
      filterAndSort();
      MRM.settings.refreshFacets();
    };
    const observe = () => {
      MRM.runtime.archiveObserver?.disconnect();
      const refresh = MRM.util.debounce(() => scan(document), 120);
      MRM.runtime.archiveObserver = new MutationObserver((records) => {
        if (records.some((record) => [...record.addedNodes].some((node) => node.nodeType === 1 && (node.matches?.("article.post.entry") || node.querySelector?.("article.post.entry"))))) refresh();
      });
      MRM.runtime.archiveObserver.observe(document.body, { childList: true, subtree: true });
      document.addEventListener("pagetual:insert", refresh);
      document.addEventListener("pagetual_page_inserted", refresh);
    };
    const init = () => {
      document.body.classList.add("mrm-archive-page");
      scan(document);
      observe();
    };
    MRM.events.addEventListener("preferences", filterAndSort);
    MRM.events.addEventListener("read-history", filterAndSort);
    return { init, scan, filterAndSort, visibleCards, markVisibleRead, renderActiveChips };
  })();

  // module: 06-reader.js
  MRM.reader = (() => {
    const state = {
      modal: null,
      document: null,
      url: "",
      title: "",
      pages: [],
      pageIndex: 0,
      sequence: [],
      abort: null,
      commentsVisible: false,
      toolbarHidden: false,
    };
    const renderShell = () => {
      if (state.modal) return state.modal;
      const modal = MRM.util.create("section", { className: "mrm-reader-modal", attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": "mrm-reader-title", hidden: true } });
      modal.innerHTML = `
        <div class="mrm-reader-toolbar">
          <div class="mrm-reader-toolbar-primary">
            <button type="button" data-reader-action="close" aria-label="Close reader">×</button>
            <button type="button" data-reader-action="previous-post" aria-label="Previous post">‹ Post</button>
            <h2 id="mrm-reader-title">Reader</h2>
            <span id="mrm-reader-page-count" aria-live="polite">0 / 0</span>
            <button type="button" data-reader-action="next-post" aria-label="Next post">Post ›</button>
          </div>
          <div class="mrm-reader-toolbar-secondary">
            <button type="button" data-reader-action="cycle-view" title="Cycle view (C)">Strip</button>
            <button type="button" data-reader-action="width" title="Toggle width (W)">Comfort</button>
            <button type="button" data-reader-action="fit" title="Toggle fit (M)">Fit width</button>
            <button type="button" data-reader-action="direction" title="Toggle direction (R)">LTR</button>
            <button type="button" data-reader-action="thumbnails" title="Toggle thumbnails (T)">Thumbs</button>
            <button type="button" data-reader-action="comments">Comments</button>
            <button type="button" data-reader-action="open-tab">Open post</button>
            <button type="button" data-reader-action="fullscreen" title="Fullscreen (F)">Fullscreen</button>
          </div>
        </div>
        <div class="mrm-reader-progress"><input id="mrm-reader-scrubber" type="range" min="1" max="1" value="1" aria-label="Reader page"></div>
        <div class="mrm-reader-body">
          <aside class="mrm-reader-thumbnails" aria-label="Page thumbnails"></aside>
          <main class="mrm-reader-stage" tabindex="0"></main>
          <section class="mrm-reader-comments" hidden></section>
        </div>
        <div class="mrm-reader-mobile-zones" aria-hidden="true">
          <button type="button" data-reader-action="previous-page" tabindex="-1"></button>
          <button type="button" data-reader-action="toolbar" tabindex="-1"></button>
          <button type="button" data-reader-action="next-page" tabindex="-1"></button>
        </div>
        <nav class="mrm-reader-footer" aria-label="Reader navigation">
          <button type="button" data-reader-action="first-page">First</button>
          <button type="button" data-reader-action="previous-page">Previous</button>
          <button type="button" data-reader-action="next-page">Next</button>
          <button type="button" data-reader-action="last-page">Last</button>
        </nav>`;
      document.body.append(modal);
      modal.addEventListener("click", onClick);
      modal.addEventListener("keydown", (event) => MRM.util.trapFocus(event, modal));
      modal.querySelector("#mrm-reader-scrubber").addEventListener("input", (event) => goTo(Number(event.target.value) - 1));
      modal.querySelector(".mrm-reader-stage").addEventListener("scroll", MRM.util.throttle(onScroll, 80));
      state.modal = modal;
      MRM.runtime.reader = state;
      return modal;
    };
    const actionButton = (action) => state.modal?.querySelector(`[data-reader-action='${action}']`);
    const actionButtons = (action) => state.modal ? Array.from(state.modal.querySelectorAll(`[data-reader-action='${action}']`)) : [];
    const setLoading = (loading, message = "Loading reader…") => {
      const stage = state.modal.querySelector(".mrm-reader-stage");
      stage.toggleAttribute("aria-busy", loading);
      if (loading) stage.replaceChildren(MRM.util.create("div", { className: "mrm-reader-status", text: message, attrs: { role: "status" } }));
    };
    const collectPost = async (url) => {
      if (MRM.util.canonicalUrl(url) === MRM.util.canonicalUrl(location.href) && MRM.runtime.page === "post") return document;
      state.abort?.abort();
      state.abort = new AbortController();
      return MRM.util.safeFetchDocument(url, state.abort.signal);
    };
    const waitForPages = async (doc) => {
      const attempts = doc === document ? 12 : 3;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const pages = MRM.site.extractImages(doc);
        if (pages.length) return pages;
        await new Promise((resolve) => window.setTimeout(resolve, 125));
      }
      return [];
    };
    const open = async (url, options = {}) => {
      renderShell();
      MRM.runtime.lastFocused = options.trigger || document.activeElement;
      state.sequence = options.sequence || state.sequence;
      state.modal.hidden = false;
      document.documentElement.classList.add("mrm-reader-open");
      setLoading(true);
      actionButton("close").focus();
      try {
        const normalizedUrl = MRM.util.canonicalUrl(url);
        let doc = null;
        let pages = [];
        let loadError = null;
        try {
          doc = await collectPost(url);
          pages = await waitForPages(doc);
        } catch (error) { loadError = error; }
        const cached = !pages.length ? MRM.storage.getReaderCache(normalizedUrl) : null;
        if (!pages.length && cached) {
          doc = document.implementation.createHTMLDocument(cached.title || "Cached reader");
          pages = cached.pages;
        }
        if (!pages.length) throw loadError || new Error("No manga pages were detected on this post.");
        state.document = doc;
        state.url = normalizedUrl;
        state.title = MRM.util.pageTitle(doc) || cached?.title || "Reader";
        state.pages = pages;
        MRM.storage.setReaderCache(state.url, state.title, state.pages);
        state.pageIndex = 0;
        state.commentsVisible = false;
        MRM.storage.markRead(state.url, state.title);
        render();
        prefetchAdjacent();
      } catch (error) {
        const stage = state.modal.querySelector(".mrm-reader-stage");
        stage.replaceChildren(MRM.util.create("div", { className: "mrm-reader-status mrm-reader-error", text: error.message || "Reader could not open this post.", attrs: { role: "alert" } }));
      }
    };
    const updateNavigation = () => {
      const atFirst = state.pageIndex <= 0;
      const atLast = state.pageIndex >= Math.max(0, state.pages.length - 1);
      for (const action of ["first-page", "previous-page"]) for (const button of actionButtons(action)) button.disabled = atFirst;
      for (const action of ["next-page", "last-page"]) for (const button of actionButtons(action)) button.disabled = atLast;
      const previousPost = actionButton("previous-post");
      const nextPost = actionButton("next-post");
      if (previousPost) previousPost.disabled = !sequenceTarget(-1);
      if (nextPost) nextPost.disabled = !sequenceTarget(1);
    };
    const render = () => {
      const prefs = MRM.storage.preferences.reader;
      state.modal.dataset.view = prefs.view;
      state.modal.dataset.width = prefs.width;
      state.modal.dataset.fit = prefs.fit;
      state.modal.dataset.direction = prefs.direction;
      state.modal.dataset.thumbnails = prefs.thumbnails ? "on" : "off";
      state.modal.querySelector("#mrm-reader-title").textContent = state.title;
      actionButton("cycle-view").textContent = prefs.view === "strip" ? "Strip" : prefs.view === "strip-gaps" ? "Strip + gaps" : "Paged";
      actionButton("width").textContent = prefs.width === "comfort" ? "Comfort" : "Wide";
      actionButton("fit").textContent = prefs.fit === "width" ? "Fit width" : "Fit height";
      actionButton("direction").textContent = prefs.direction.toUpperCase();
      const comments = MRM.site.commentsCount(state.document);
      actionButton("comments").textContent = comments == null ? "Comments" : `Comments (${comments})`;
      renderPages();
      renderThumbnails();
      setPageIndex(state.pageIndex);
      updateNavigation();
    };
    const renderPages = () => {
      const stage = state.modal.querySelector(".mrm-reader-stage");
      stage.replaceChildren();
      state.pages.forEach((page, index) => {
        const figure = MRM.util.create("figure", { className: "mrm-reader-page", dataset: { index } });
        const img = MRM.util.create("img", { attrs: { src: page.src, alt: page.alt, loading: index < 2 ? "eager" : "lazy", decoding: "async" } });
        const captionText = () => `${index + 1} / ${state.pages.length}${page.width && page.height ? ` · ${page.width}×${page.height}` : ""}`;
        const caption = MRM.util.create("figcaption", { text: captionText() });
        img.addEventListener("load", () => {
          if ((!page.width || !page.height) && img.naturalWidth && img.naturalHeight) {
            page.width = img.naturalWidth;
            page.height = img.naturalHeight;
            caption.textContent = captionText();
            MRM.storage.setReaderCache(state.url, state.title, state.pages);
          }
        }, { once: true });
        figure.append(img, caption);
        stage.append(figure);
      });
      if (MRM.storage.preferences.reader.view === "paged") goTo(state.pageIndex, false);
      else observePages();
    };
    const renderThumbnails = () => {
      const host = state.modal.querySelector(".mrm-reader-thumbnails");
      host.replaceChildren();
      state.pages.forEach((page, index) => {
        const button = MRM.util.create("button", { className: "mrm-reader-thumbnail", attrs: { type: "button", "aria-label": `Go to page ${index + 1}` }, dataset: { index } });
        button.append(MRM.util.create("img", { attrs: { src: page.src, alt: "", loading: "lazy" } }), MRM.util.create("span", { text: String(index + 1) }));
        button.addEventListener("click", () => goTo(index));
        host.append(button);
      });
    };
    const observePages = () => {
      state.readerObserver?.disconnect?.();
      MRM.runtime.readerObserver?.disconnect();
      MRM.runtime.readerObserver = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setPageIndex(Number(visible.target.dataset.index));
      }, { root: state.modal.querySelector(".mrm-reader-stage"), threshold: [0.2, 0.5, 0.8] });
      state.modal.querySelectorAll(".mrm-reader-page").forEach((page) => MRM.runtime.readerObserver.observe(page));
    };
    const setPageIndex = (index) => {
      state.pageIndex = MRM.util.clamp(index, 0, Math.max(0, state.pages.length - 1));
      state.modal.querySelector("#mrm-reader-page-count").textContent = `${state.pageIndex + 1} / ${state.pages.length}`;
      const scrubber = state.modal.querySelector("#mrm-reader-scrubber");
      scrubber.max = String(Math.max(1, state.pages.length));
      scrubber.value = String(state.pageIndex + 1);
      state.modal.querySelectorAll(".mrm-reader-thumbnail").forEach((button, i) => button.classList.toggle("is-active", i === state.pageIndex));
      updateNavigation();
    };
    const goTo = (index, smooth = true) => {
      setPageIndex(index);
      const target = state.modal.querySelector(`.mrm-reader-page[data-index='${state.pageIndex}']`);
      if (!target) return;
      if (MRM.storage.preferences.reader.view === "paged") {
        state.modal.querySelectorAll(".mrm-reader-page").forEach((page, i) => page.hidden = i !== state.pageIndex);
        target.hidden = false;
        state.modal.querySelector(".mrm-reader-stage").scrollTop = 0;
      } else target.scrollIntoView({ block: "start", behavior: smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
    };
    const movePage = (delta) => goTo(state.pageIndex + delta);
    const sequenceTarget = (delta) => {
      const index = state.sequence.indexOf(state.url);
      if (index >= 0) return state.sequence[index + delta] || "";
      const adjacent = MRM.site.adjacentLinks(state.document);
      return delta < 0 ? adjacent.prev : adjacent.next;
    };
    const movePost = (delta) => {
      const target = sequenceTarget(delta);
      if (target) open(target, { sequence: state.sequence, trigger: state.modal.querySelector(`[data-reader-action='${delta < 0 ? "previous-post" : "next-post"}']`) });
      else MRM.util.announce("No adjacent post available");
    };
    const prefetchAdjacent = () => MRM.util.idle(() => {
      for (const target of [sequenceTarget(-1), sequenceTarget(1)]) if (target) fetch(target, { credentials: "include", priority: "low" }).catch(() => {});
    });
    const showComments = () => {
      const commentsHost = state.modal.querySelector(".mrm-reader-comments");
      const stage = state.modal.querySelector(".mrm-reader-stage");
      const source = MRM.util.q(MRM.selectors.comments, state.document);
      state.commentsVisible = !state.commentsVisible;
      commentsHost.hidden = !state.commentsVisible;
      stage.hidden = state.commentsVisible;
      state.modal.querySelector(".mrm-reader-thumbnails").hidden = state.commentsVisible;
      actionButton("comments").textContent = state.commentsVisible ? "Back to reader" : "Comments";
      if (state.commentsVisible) {
        commentsHost.replaceChildren();
        if (source) {
          const clone = source.cloneNode(true);
          clone.querySelectorAll("script, iframe, form").forEach((node) => node.remove());
          commentsHost.append(clone);
        } else commentsHost.append(MRM.util.create("p", { text: "Comments are not present in the fetched page." }));
        commentsHost.focus?.();
      }
    };
    const togglePreference = (patch) => MRM.storage.update({ reader: { ...MRM.storage.preferences.reader, ...patch } });
    const cycleView = () => {
      const modes = ["strip", "strip-gaps", "paged"];
      const current = MRM.storage.preferences.reader.view;
      togglePreference({ view: modes[(modes.indexOf(current) + 1) % modes.length] });
      render();
    };
    const fullscreen = () => {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else state.modal.requestFullscreen?.();
    };
    const close = () => {
      state.abort?.abort();
      MRM.runtime.readerObserver?.disconnect();
      state.modal.hidden = true;
      document.documentElement.classList.remove("mrm-reader-open");
      MRM.runtime.lastFocused?.focus?.();
    };
    const onClick = (event) => {
      const button = event.target.closest("[data-reader-action]");
      if (!button) {
        if (event.target === state.modal) close();
        return;
      }
      const action = button.dataset.readerAction;
      const map = {
        close,
        "previous-post": () => movePost(-1),
        "next-post": () => movePost(1),
        "previous-page": () => movePage(MRM.storage.preferences.reader.direction === "rtl" ? 1 : -1),
        "next-page": () => movePage(MRM.storage.preferences.reader.direction === "rtl" ? -1 : 1),
        "first-page": () => goTo(0),
        "last-page": () => goTo(state.pages.length - 1),
        "cycle-view": cycleView,
        width: () => { togglePreference({ width: MRM.storage.preferences.reader.width === "comfort" ? "wide" : "comfort" }); render(); },
        fit: () => { togglePreference({ fit: MRM.storage.preferences.reader.fit === "width" ? "height" : "width" }); render(); },
        direction: () => { togglePreference({ direction: MRM.storage.preferences.reader.direction === "ltr" ? "rtl" : "ltr" }); render(); },
        thumbnails: () => { togglePreference({ thumbnails: !MRM.storage.preferences.reader.thumbnails }); render(); },
        comments: showComments,
        "open-tab": () => window.open(state.url, "_blank", "noopener"),
        fullscreen,
        toolbar: () => state.modal.classList.toggle("is-toolbar-hidden"),
      };
      map[action]?.();
    };
    const onScroll = () => {
      if (!MRM.storage.preferences.reader.autoHideToolbar || MRM.storage.preferences.reader.view === "paged") return;
      const stage = state.modal.querySelector(".mrm-reader-stage");
      state.modal.classList.toggle("is-toolbar-hidden", stage.scrollTop > 120 && stage.scrollTop > (state.lastScrollTop || 0));
      state.lastScrollTop = stage.scrollTop;
    };
    const onKeydown = (event) => {
      if (!state.modal || state.modal.hidden) return;
      const target = event.target;
      if (target.matches("input, textarea, select") && event.key !== "Escape") return;
      const key = event.key.toLocaleLowerCase();
      const handlers = {
        escape: close,
        f: fullscreen,
        w: () => actionButton("width").click(),
        m: () => actionButton("fit").click(),
        c: cycleView,
        r: () => actionButton("direction").click(),
        t: () => actionButton("thumbnails").click(),
        home: () => goTo(0),
        end: () => goTo(state.pages.length - 1),
        arrowleft: () => movePage(MRM.storage.preferences.reader.direction === "rtl" ? 1 : -1),
        pageup: () => movePage(-1),
        arrowright: () => movePage(MRM.storage.preferences.reader.direction === "rtl" ? -1 : 1),
        pagedown: () => movePage(1),
      };
      if (event.altKey && (key === "arrowleft" || key === "arrowright")) {
        event.preventDefault(); movePost(key === "arrowleft" ? -1 : 1); return;
      }
      if (handlers[key]) { event.preventDefault(); handlers[key](); }
    };
    const installPostButtons = () => {
      const article = MRM.util.q(MRM.selectors.postArticle);
      const title = MRM.util.q(".entry-title", article || document);
      if (!title || MRM.util.q("#mrm-post-actions")) return;
      const actions = MRM.util.create("div", { attrs: { id: "mrm-post-actions" }, className: "mrm-post-actions" });
      const reader = MRM.util.create("button", { className: "mrm-primary-action", text: "Open Reader", attrs: { type: "button" } });
      const count = MRM.site.commentsCount(document);
      const comments = MRM.util.create("button", { text: count == null ? "Comments" : `Comments (${count})`, attrs: { type: "button" } });
      reader.addEventListener("click", () => open(location.href, { trigger: reader }));
      comments.addEventListener("click", () => MRM.util.q(MRM.selectors.comments)?.scrollIntoView({ behavior: "smooth", block: "start" }));
      actions.append(reader, comments);
      if (article) {
        const taxonomies = MRM.site.taxonomiesFromClasses(article);
        const chips = MRM.util.create("div", { className: "mrm-post-taxonomies", attrs: { "aria-label": "Post metadata" } });
        for (const type of ["lang", "category", "genre", "artist", "group", "pairing", "status", "tag"]) {
          for (const slug of (taxonomies[type] || []).slice(0, type === "tag" ? 12 : 5)) {
            chips.append(MRM.util.create("span", { className: "mrm-taxonomy-chip", text: MRM.util.slugLabel(slug), attrs: { title: MRM.site.facetPrefixes[type] } }));
          }
        }
        if (chips.childElementCount) actions.append(chips);
      }
      title.insertAdjacentElement("afterend", actions);
      MRM.storage.markRead(location.href, title.textContent);
    };
    document.addEventListener("keydown", onKeydown, true);
    MRM.events.addEventListener("preferences", () => { if (state.modal && !state.modal.hidden && state.pages.length) render(); });
    return { open, close, installPostButtons, goTo };
  })();

  // module: 07-settings.js
  MRM.settings = (() => {
    let panel = null;
    let facetHost = null;
    const makeToggle = (label, checked, onChange) => {
      const row = MRM.util.create("label", { className: "mrm-toggle-row" });
      const input = MRM.util.create("input", { attrs: { type: "checkbox" } });
      input.checked = checked;
      input.addEventListener("change", () => onChange(input.checked));
      row.append(MRM.util.create("span", { text: label }), input);
      return row;
    };
    const updateFilters = (patch) => MRM.storage.replaceFilters({ ...MRM.storage.preferences.filters, ...patch });
    const renderPanel = () => {
      if (panel) return panel;
      const launcher = MRM.util.create("button", { attrs: { id: "mrm-panel-launcher", type: "button", "aria-controls": "mrm-control-panel", "aria-expanded": "false", "aria-label": "Open MyReadingManga controls" }, text: "MRM" });
      panel = MRM.util.create("aside", { attrs: { id: "mrm-control-panel", role: "dialog", "aria-modal": "false", "aria-labelledby": "mrm-panel-title", hidden: true }, className: "mrm-control-panel" });
      panel.innerHTML = `
        <header class="mrm-panel-header"><div><strong id="mrm-panel-title">MRM workspace</strong><span id="mrm-result-count">0 results</span></div><button type="button" data-panel-action="close" aria-label="Close controls">×</button></header>
        <nav class="mrm-panel-tabs" aria-label="Settings sections"><button type="button" data-tab="filters" aria-selected="true">Filters</button><button type="button" data-tab="grid">Grid</button><button type="button" data-tab="theme">Theme</button></nav>
        <div class="mrm-panel-scroll">
          <section data-panel-section="filters">
            <label class="mrm-field"><span>Search visible archive</span><input id="mrm-live-search" type="search" autocomplete="off" placeholder="Title, artist, tags…"></label>
            <div id="mrm-filter-toggles"></div>
            <label class="mrm-field"><span>Display order</span><select id="mrm-sort"><option value="default">Default</option><option value="title-asc">Title A–Z</option><option value="title-desc">Title Z–A</option><option value="english-first">English first</option></select></label>
            <div id="mrm-native-search-controls"></div>
            <div class="mrm-inline-actions"><button type="button" data-panel-action="mark-read">Mark visible read</button><button type="button" data-panel-action="clear-filters">Clear filters</button></div>
            <div id="mrm-active-filters" class="mrm-active-filters" aria-label="Active filters"></div>
            <div id="mrm-facets" class="mrm-facets"></div>
          </section>
          <section data-panel-section="grid" hidden></section>
          <section data-panel-section="theme" hidden></section>
        </div>`;
      document.body.append(launcher, panel);
      launcher.addEventListener("click", () => togglePanel());
      panel.addEventListener("click", onPanelClick);
      panel.addEventListener("keydown", (event) => MRM.util.trapFocus(event, panel));
      const search = panel.querySelector("#mrm-live-search");
      search.value = MRM.storage.preferences.filters.query;
      search.addEventListener("input", MRM.util.debounce(() => updateFilters({ query: search.value }), 120));
      const sort = panel.querySelector("#mrm-sort");
      sort.value = MRM.storage.preferences.filters.sort;
      sort.addEventListener("change", () => updateFilters({ sort: sort.value }));
      renderNativeSearchControls();
      renderFilterToggles();
      renderGridSettings();
      renderThemeSettings();
      facetHost = panel.querySelector("#mrm-facets");
      refreshFacets();
      return panel;
    };
    const renderNativeSearchControls = () => {
      const host = panel.querySelector("#mrm-native-search-controls");
      host.replaceChildren();
      if (MRM.runtime.page !== "search") return;
      const native = MRM.util.q("#ep-sort");
      const field = MRM.util.create("label", { className: "mrm-field" });
      const select = MRM.util.create("select", { attrs: { id: "mrm-native-sort" } });
      if (native) for (const option of native.options) select.append(MRM.util.create("option", { text: option.textContent, attrs: { value: option.value } }));
      else for (const [value, label] of [["date", "Newest"], ["date_asc", "Oldest"], ["relevance", "Relevance"], ["rand", "Random"]]) select.append(MRM.util.create("option", { text: label, attrs: { value } }));
      select.value = MRM.facets.nativeSortValue() || "date";
      field.append(MRM.util.create("span", { text: "Site order" }), select);
      const apply = MRM.util.create("button", { text: "Apply filters on site", attrs: { type: "button", "data-panel-action": "apply-native" } });
      host.append(field, apply);
    };
    const renderFilterToggles = () => {
      const host = panel.querySelector("#mrm-filter-toggles");
      host.replaceChildren(
        makeToggle("Hide read", MRM.storage.preferences.filters.hideRead, (value) => updateFilters({ hideRead: value })),
        makeToggle("Only English", MRM.storage.preferences.filters.onlyEnglish, (value) => updateFilters({ onlyEnglish: value })),
      );
    };
    const rangeField = (label, key, value, min, max, step, onInput) => {
      const row = MRM.util.create("label", { className: "mrm-field" });
      const output = MRM.util.create("output", { text: String(value) });
      const input = MRM.util.create("input", { attrs: { type: "range", min, max, step, value, "data-grid-key": key } });
      input.addEventListener("input", () => { output.value = input.value; onInput(Number(input.value)); });
      row.append(MRM.util.create("span", { text: label }), output, input);
      return row;
    };
    const renderGridSettings = () => {
      const host = panel.querySelector("[data-panel-section='grid']");
      const updateGrid = (patch) => MRM.storage.update({ grid: { ...MRM.storage.preferences.grid, ...patch } });
      const g = MRM.storage.preferences.grid;
      host.replaceChildren(
        rangeField("Desktop columns", "desktop", g.desktop, 2, 10, 1, (value) => updateGrid({ desktop: value })),
        rangeField("Tablet columns", "tablet", g.tablet, 2, 8, 1, (value) => updateGrid({ tablet: value })),
        rangeField("Mobile columns", "mobile", g.mobile, 1, 4, 1, (value) => updateGrid({ mobile: value })),
        rangeField("Grid gap", "gap", g.gap, 4, 32, 1, (value) => updateGrid({ gap: value })),
        rangeField("Cover ratio", "ratio", g.ratio, 0.55, 1.2, 0.01, (value) => updateGrid({ ratio: value })),
      );
    };
    const renderThemeSettings = () => {
      const host = panel.querySelector("[data-panel-section='theme']");
      const prefs = MRM.storage.preferences;
      const ui = makeToggle("Enable site makeover", prefs.uiEnabled, (value) => MRM.storage.update({ uiEnabled: value }));
      const dock = MRM.util.create("label", { className: "mrm-field" });
      const dockSelect = MRM.util.create("select");
      dockSelect.innerHTML = '<option value="right">Dock right</option><option value="left">Dock left</option>';
      dockSelect.value = prefs.dock;
      dockSelect.addEventListener("change", () => MRM.storage.update({ dock: dockSelect.value }));
      dock.append(MRM.util.create("span", { text: "Panel position" }), dockSelect);
      const accent = MRM.util.create("label", { className: "mrm-field" });
      const color = MRM.util.create("input", { attrs: { type: "color", value: prefs.accent } });
      const text = MRM.util.create("input", { attrs: { type: "text", value: prefs.accent, maxlength: 7, pattern: "#[0-9A-Fa-f]{6}" } });
      const applyColor = (value) => { if (/^#[0-9a-f]{6}$/i.test(value)) MRM.storage.update({ accent: value }); };
      color.addEventListener("input", () => { text.value = color.value; applyColor(color.value); });
      text.addEventListener("change", () => { color.value = text.value; applyColor(text.value); });
      accent.append(MRM.util.create("span", { text: "Accent" }), color, text);
      const borders = MRM.util.create("fieldset", { className: "mrm-border-grid" });
      borders.append(MRM.util.create("legend", { text: "Borders" }));
      for (const [name, enabled] of Object.entries(prefs.border)) borders.append(makeToggle(MRM.util.slugLabel(name), enabled, (value) => MRM.storage.update({ border: { ...MRM.storage.preferences.border, [name]: value } })));
      const clearRead = MRM.util.create("button", { text: "Clear read history", attrs: { type: "button" } });
      clearRead.addEventListener("click", () => { if (confirm("Clear all locally stored read history?")) MRM.storage.clearRead(); });
      host.replaceChildren(ui, dock, accent, borders, clearRead);
    };
    const termRow = (type, term) => {
      const row = MRM.util.create("div", { className: "mrm-facet-term" });
      const label = MRM.util.create("span", { text: term.name });
      const count = MRM.util.create("small", { text: term.count ? String(term.count) : "" });
      const include = MRM.util.create("button", { text: "IN", attrs: { type: "button", "aria-pressed": MRM.facets.activeFor("include", type).includes(term.slug) } });
      const exclude = MRM.util.create("button", { text: "OUT", attrs: { type: "button", "aria-pressed": MRM.facets.activeFor("exclude", type).includes(term.slug) } });
      include.addEventListener("click", () => MRM.facets.toggle("include", type, term.slug));
      exclude.addEventListener("click", () => MRM.facets.toggle("exclude", type, term.slug));
      row.append(label, count, include, exclude);
      return row;
    };
    const refreshFacets = () => {
      if (!facetHost) return;
      facetHost.replaceChildren();
      for (const [type, terms] of Object.entries(MRM.facets.directory)) {
        const details = MRM.util.create("details", { className: "mrm-facet-group" });
        const summary = MRM.util.create("summary", { text: `${MRM.site.facetPrefixes[type]} (${terms.length})` });
        const search = MRM.util.create("input", { attrs: { type: "search", placeholder: `Search ${MRM.site.facetPrefixes[type].toLocaleLowerCase()}`, "aria-label": `Search ${MRM.site.facetPrefixes[type]}` } });
        const list = MRM.util.create("div", { className: "mrm-facet-list" });
        const renderTerms = () => {
          const needle = MRM.util.normalize(search.value);
          const filtered = terms.filter((term) => !needle || MRM.util.normalize(term.name).includes(needle));
          list.replaceChildren(...filtered.slice(0, 8).map((term) => termRow(type, term)));
          more.hidden = filtered.length <= 8;
        };
        const more = MRM.util.create("button", { className: "mrm-facet-more", text: "Show all", attrs: { type: "button" } });
        more.addEventListener("click", () => openFacetModal(type, terms, MRM.site.facetPrefixes[type]));
        search.addEventListener("input", MRM.util.debounce(renderTerms, 80));
        details.append(summary, search, list, more);
        facetHost.append(details);
        renderTerms();
      }
    };
    const openFacetModal = (type, terms, title) => {
      let modal = MRM.util.q("#mrm-facet-modal");
      if (!modal) {
        modal = MRM.util.create("section", { attrs: { id: "mrm-facet-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "mrm-facet-modal-title" }, className: "mrm-facet-modal" });
        document.body.append(modal);
      }
      modal.innerHTML = `<div class="mrm-facet-modal-card"><header><h2 id="mrm-facet-modal-title"></h2><button type="button" data-modal-close aria-label="Close">×</button></header><input type="search" aria-label="Search options" placeholder="Search options…"><div class="mrm-facet-modal-list"></div><footer class="mrm-facet-modal-pagination"><button type="button" data-page="previous">Previous</button><span aria-live="polite"></span><button type="button" data-page="next">Next</button></footer></div>`;
      modal.querySelector("h2").textContent = title;
      const input = modal.querySelector("input");
      const list = modal.querySelector(".mrm-facet-modal-list");
      const pageLabel = modal.querySelector(".mrm-facet-modal-pagination span");
      const previous = modal.querySelector("[data-page='previous']");
      const next = modal.querySelector("[data-page='next']");
      const pageSize = 18;
      let page = 0;
      const render = () => {
        const needle = MRM.util.normalize(input.value);
        const filtered = terms.filter((term) => !needle || MRM.util.normalize(term.name).includes(needle));
        const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
        page = MRM.util.clamp(page, 0, pageCount - 1);
        const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);
        list.replaceChildren(...visible.map((term) => type ? termRow(type, term) : MRM.util.create("span", { className: "mrm-taxonomy-chip", text: term.name })));
        pageLabel.textContent = `${page + 1} / ${pageCount} · ${filtered.length} options`;
        previous.disabled = page <= 0;
        next.disabled = page >= pageCount - 1;
      };
      previous.addEventListener("click", () => { page -= 1; render(); });
      next.addEventListener("click", () => { page += 1; render(); });
      input.addEventListener("input", () => { page = 0; render(); });
      modal.querySelector("[data-modal-close]").addEventListener("click", () => modal.remove());
      modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
      modal.addEventListener("keydown", (event) => { if (event.key === "Escape") modal.remove(); else MRM.util.trapFocus(event, modal); });
      render(); input.focus();
    };
    const togglePanel = (force) => {
      renderPanel();
      const open = force ?? panel.hidden;
      panel.hidden = !open;
      MRM.runtime.panelOpen = open;
      const launcher = MRM.util.q("#mrm-panel-launcher");
      launcher.setAttribute("aria-expanded", String(open));
      if (open) panel.querySelector("[data-panel-action='close']").focus();
      else launcher.focus();
    };
    const onPanelClick = (event) => {
      const tab = event.target.closest("[data-tab]");
      if (tab) {
        panel.querySelectorAll("[data-tab]").forEach((button) => button.setAttribute("aria-selected", String(button === tab)));
        panel.querySelectorAll("[data-panel-section]").forEach((section) => section.hidden = section.dataset.panelSection !== tab.dataset.tab);
        return;
      }
      const action = event.target.closest("[data-panel-action]")?.dataset.panelAction;
      if (action === "close") togglePanel(false);
      if (action === "mark-read") MRM.archive.markVisibleRead();
      if (action === "apply-native") MRM.facets.applyNative(panel.querySelector("#mrm-native-sort")?.value || MRM.facets.nativeSortValue());
      if (action === "clear-filters") {
        const filters = { ...MRM.storage.preferences.filters, query: "", hideRead: false, onlyEnglish: false, include: {}, exclude: {} };
        MRM.storage.replaceFilters(filters);
        panel.querySelector("#mrm-live-search").value = "";
        renderFilterToggles();
      }
    };
    const installRecoveryButton = () => {
      if (MRM.util.q("#mrm-ui-recovery")) return;
      const button = MRM.util.create("button", { attrs: { id: "mrm-ui-recovery", type: "button" }, text: "Enable MRM UI" });
      button.addEventListener("click", () => MRM.storage.update({ uiEnabled: true }));
      document.body.append(button);
    };
    const init = () => {
      renderPanel();
      installRecoveryButton();
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && MRM.runtime.panelOpen && !event.defaultPrevented) togglePanel(false);
      });
    };
    MRM.events.addEventListener("preferences", () => {
      if (!panel) return;
      const search = panel.querySelector("#mrm-live-search");
      if (document.activeElement !== search) search.value = MRM.storage.preferences.filters.query;
      panel.querySelector("#mrm-sort").value = MRM.storage.preferences.filters.sort;
      refreshFacets();
    });
    return { init, togglePanel, refreshFacets, openFacetModal, installRecoveryButton };
  })();

  // module: 08-app.js
  MRM.app = (() => {
    const removeNoise = () => {
      document.querySelectorAll("ins[data-zoneid], .eas6a97888e38, [id^='ad-'], .advertisement, .before-footer-widgets").forEach((node) => node.remove());
    };
    const initPost = () => {
      document.body.classList.add("mrm-post-page");
      MRM.settings.installRecoveryButton();
      MRM.reader.installPostButtons();
      removeNoise();
    };
    const initArchive = () => {
      MRM.facets.syncFromUrl();
      MRM.settings.init();
      MRM.archive.init();
      removeNoise();
    };
    const start = () => {
      if (!MRM.config.hostnames.includes(location.hostname)) return;
      MRM.theme.install();
      MRM.runtime.page = MRM.site.detectPage();
      document.documentElement.dataset.mrmPage = MRM.runtime.page;
      if (MRM.runtime.page === "post") initPost();
      else if (MRM.runtime.page === "archive" || MRM.runtime.page === "search") initArchive();
      else MRM.settings.init();
    };
    return { start };
  })();
  
  MRM.app.start();
})();
