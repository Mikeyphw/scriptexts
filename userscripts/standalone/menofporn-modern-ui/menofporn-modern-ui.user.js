// ==UserScript==
// @name         MenOfPorn Modern UI
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/menofporn-modern-ui
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/standalone/menofporn-modern-ui
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/standalone/menofporn-modern-ui/menofporn-modern-ui.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/standalone/menofporn-modern-ui/menofporn-modern-ui.user.js
// @version      1.4.0
// @description  Modern, dark, flat, borderless, mobile-first interface for MenOfPorn.blog.
// @author       OpenAI
// @match        https://www.menofporn.blog/*
// @match        https://menofporn.blog/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// ==/UserScript==

(() => {
  'use strict';

  const SCRIPT_ID = 'mop-modern-ui';
  const STORE_KEY = 'mop-modern-ui:v1';
  const DEFAULTS = Object.freeze({
    theme: 'dark',
    density: 'comfortable',
    blurMedia: false,
    hideViewed: false,
    bottomNav: true,
    restoreScroll: true,
    fitImages: false,
    saved: [],
    viewed: [],
    activeFilter: 'all',
  });

  const state = loadState();
  const runtime = {
    drawerMode: null,
    searchText: '',
    activeCategory: '',
    processedArticles: new WeakSet(),
    mutationTimer: 0,
    scrollTimer: 0,
    lastFocus: null,
    inertedElements: [],
    postUrl: '',
    viewedElapsed: 0,
    viewedStartedAt: 0,
    viewedTimer: 0,
    progressFrame: 0,
  };

  const ICONS = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>',
    tune: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M14 4v6M4 17h2M10 17h10M10 14v6"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h12v17l-6-4-6 4z"/></svg>',
    bookmarkOutline: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h12v17l-6-4-6 4z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.7 6.1A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-3.1 3.8M6.3 6.4C3.9 8.1 2.5 12 2.5 12s3.5 6 9.5 6a10 10 0 0 0 3.2-.5M9.9 9.8a3 3 0 0 0 4.2 4.2"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
    external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 13v6H5V6h6"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v11H9l-4 3z"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 14 7-7 7 7"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></svg>',
  };

  const CSS = String.raw`
    :root {
      --mop-bg: #090b0f;
      --mop-surface: #11151b;
      --mop-surface-2: #171c23;
      --mop-surface-3: #202630;
      --mop-text: #f2f4f7;
      --mop-muted: #9aa4b2;
      --mop-faint: #8792a2;
      --mop-body: #dce2e9;
      --mop-accent: #d35cff;
      --mop-accent-2: #ff6ca8;
      --mop-danger: #ff6d7a;
      --mop-success: #62dca3;
      --mop-header-h: 68px;
      --mop-bottom-h: 70px;
      --mop-content-w: 1440px;
      --mop-reading-w: 700px;
      --mop-media-w: 940px;
      --mop-gap: 20px;
      --mop-radius: 22px;
      color-scheme: dark;
    }

    html.mop-modern-ui[data-mop-theme="oled"] {
      --mop-bg: #000;
      --mop-surface: #0d0f12;
      --mop-surface-2: #171a1f;
      --mop-surface-3: #242932;
      --mop-body: #d8dde4;
    }

    html.mop-modern-ui,
    html.mop-modern-ui body {
      min-height: 100%;
      max-width: 100%;
      overflow-x: hidden;
      background: var(--mop-bg) !important;
      color: var(--mop-text) !important;
    }

    html.mop-modern-ui body {
      margin: 0 !important;
      padding-top: calc(var(--mop-header-h) + 18px) !important;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      font-size: 16px;
      line-height: 1.6;
      overflow-x: clip;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    html.mop-modern-ui * {
      box-sizing: border-box;
      scrollbar-color: var(--mop-surface-3) transparent;
    }

    html.mop-modern-ui *:focus-visible {
      outline: 3px solid color-mix(in srgb, var(--mop-accent) 72%, white);
      outline-offset: 3px;
    }

    html.mop-modern-ui a {
      color: inherit;
      text-decoration: none;
    }

    html.mop-modern-ui img,
    html.mop-modern-ui video,
    html.mop-modern-ui iframe {
      max-width: 100%;
    }

    html.mop-modern-ui #masthead,
    html.mop-modern-ui #secondary,
    html.mop-modern-ui #colophon,
    html.mop-modern-ui #bloglo-scroll-top,
    html.mop-modern-ui #pagetual-sideController,
    html.mop-modern-ui .pagetual_pageBar,
    html.mop-modern-ui [id^="pagetual_pageBar"],
    html.mop-modern-ui .bloglo-page-header,
    html.mop-modern-ui .bloglo-breadcrumbs,
    html.mop-modern-ui .bloglo-search,
    html.mop-modern-ui .bloglo-header-widgets {
      display: none !important;
    }

    html.mop-modern-ui .skip-link,
    html.mop-modern-ui .screen-reader-text {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      clip-path: inset(50%) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }

    html.mop-modern-ui .skip-link:focus {
      position: fixed !important;
      z-index: 2147483640;
      top: 10px !important;
      left: 10px !important;
      width: auto !important;
      height: auto !important;
      margin: 0 !important;
      padding: 10px 14px !important;
      overflow: visible !important;
      clip: auto !important;
      clip-path: none !important;
      border-radius: 12px;
      color: var(--mop-text) !important;
      background: var(--mop-surface-3) !important;
    }

    html.mop-modern-ui #page,
    html.mop-modern-ui #main,
    html.mop-modern-ui #primary,
    html.mop-modern-ui #content,
    html.mop-modern-ui .bloglo-container {
      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
    }

    html.mop-modern-ui .site-main {
      min-height: calc(100vh - var(--mop-header-h));
    }

    #mop-app-header {
      position: fixed;
      inset: 0 0 auto;
      z-index: 2147481000;
      height: calc(var(--mop-header-h) + env(safe-area-inset-top));
      padding: env(safe-area-inset-top) max(18px, env(safe-area-inset-right)) 0 max(18px, env(safe-area-inset-left));
      background: color-mix(in srgb, var(--mop-bg) 86%, transparent);
      backdrop-filter: blur(22px) saturate(135%);
      -webkit-backdrop-filter: blur(22px) saturate(135%);
      transform: translateY(0);
      transition: transform 180ms ease;
    }

    #mop-app-header.mop-hidden {
      transform: translateY(calc(-1 * var(--mop-header-h) - env(safe-area-inset-top)));
    }

    .mop-header-inner {
      width: min(100%, var(--mop-content-w));
      height: var(--mop-header-h);
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .mop-brand {
      min-width: 0;
      display: inline-flex;
      align-items: center;
      gap: 11px;
      font-weight: 800;
      letter-spacing: -.035em;
      font-size: 18px;
    }

    .mop-brand img {
      width: 38px;
      height: 38px;
      object-fit: contain;
      border-radius: 12px;
      background: var(--mop-surface-2);
    }

    .mop-brand-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mop-header-spacer { flex: 1; }

    .mop-header-actions {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .mop-icon-button,
    .mop-text-button,
    .mop-nav-button,
    .mop-chip,
    .mop-switch-row,
    .mop-action-button {
      -webkit-tap-highlight-color: transparent;
    }

    .mop-icon-button,
    .mop-action-button {
      appearance: none;
      border: 0;
      color: var(--mop-text);
      background: var(--mop-surface-2);
      cursor: pointer;
      display: inline-grid;
      place-items: center;
      transition: background 140ms ease, transform 140ms ease, color 140ms ease;
    }

    .mop-icon-button {
      width: 44px;
      height: 44px;
      border-radius: 15px;
    }

    .mop-icon-button:hover,
    .mop-action-button:hover {
      background: var(--mop-surface-3);
    }

    .mop-icon-button:active,
    .mop-action-button:active,
    .mop-nav-button:active {
      transform: scale(.95);
    }

    .mop-icon-button svg,
    .mop-action-button svg,
    .mop-nav-button svg,
    .mop-drawer-close svg,
    .mop-setting-arrow svg {
      width: 21px;
      height: 21px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .mop-icon-button[data-filled="true"] svg,
    .mop-action-button[data-filled="true"] svg {
      fill: currentColor;
    }

    .mop-primary-button {
      background: var(--mop-accent);
      color: #14091a;
    }

    #mop-feed-tools {
      width: min(calc(100% - 36px), var(--mop-content-w));
      margin: 0 auto 18px;
      display: flex;
      gap: 10px;
      align-items: center;
      min-width: 0;
    }

    .mop-chip-strip {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      overscroll-behavior-inline: contain;
      scrollbar-width: none;
      padding: 2px;
      flex: 1;
    }

    .mop-chip-strip::-webkit-scrollbar { display: none; }

    .mop-chip {
      appearance: none;
      border: 0;
      border-radius: 999px;
      background: var(--mop-surface);
      color: var(--mop-muted);
      min-height: 44px;
      padding: 0 16px;
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      white-space: nowrap;
      cursor: pointer;
      transition: color 140ms ease, background 140ms ease, transform 140ms ease;
    }

    .mop-chip:hover { color: var(--mop-text); background: var(--mop-surface-2); }
    .mop-chip[aria-pressed="true"] { color: #14091a; background: var(--mop-accent); }

    html.mop-modern-ui body.home #content > .bloglo-flex-row,
    html.mop-modern-ui body.blog #content > .bloglo-flex-row,
    html.mop-modern-ui body.archive #content > .bloglo-flex-row,
    html.mop-modern-ui body.search-results #content > .bloglo-flex-row {
      width: min(calc(100% - 36px), var(--mop-content-w));
      margin: 0 auto !important;
      padding: 0 0 48px !important;
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: stretch;
      gap: var(--mop-gap) !important;
    }

    html.mop-modern-ui body.home #content > .bloglo-flex-row > [class*="col-"],
    html.mop-modern-ui body.blog #content > .bloglo-flex-row > [class*="col-"],
    html.mop-modern-ui body.archive #content > .bloglo-flex-row > [class*="col-"],
    html.mop-modern-ui body.search-results #content > .bloglo-flex-row > [class*="col-"] {
      width: auto !important;
      max-width: none !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      display: flex !important;
    }

    html.mop-modern-ui article.bloglo-article {
      position: relative;
      flex: 1 1 auto;
      height: 100%;
      margin: 0 !important;
      padding: 0 !important;
      min-width: 0;
      color: var(--mop-text) !important;
      background: var(--mop-surface) !important;
      border: 0 !important;
      border-radius: var(--mop-radius) !important;
      overflow: clip;
      box-shadow: none !important;
      isolation: isolate;
      content-visibility: auto;
      contain-intrinsic-size: 620px;
    }

    html.mop-modern-ui article.bloglo-article.mop-filtered-out {
      display: none !important;
    }

    html.mop-modern-ui article.bloglo-article.mop-viewed {
      --mop-card-opacity: .72;
    }

    html.mop-modern-ui article.bloglo-article.mop-viewed .entry-media {
      opacity: var(--mop-card-opacity);
      filter: saturate(.72);
      transition: opacity 160ms ease, filter 160ms ease;
    }

    html.mop-modern-ui article.bloglo-article.mop-viewed:hover .entry-media {
      opacity: .88;
      filter: saturate(.9);
    }

    html.mop-modern-ui article.bloglo-article.mop-viewed .entry-title a {
      color: color-mix(in srgb, var(--mop-text) 88%, var(--mop-muted)) !important;
    }

    html.mop-modern-ui article.bloglo-article .bloglo-blog-entry-wrapper,
    html.mop-modern-ui article.bloglo-article .bloglo-thumb-left {
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      border: 0 !important;
    }

    html.mop-modern-ui article.bloglo-article .entry-media,
    html.mop-modern-ui article.bloglo-article .post-thumb,
    html.mop-modern-ui article.bloglo-article .thumbnail {
      position: relative;
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      aspect-ratio: 5 / 4;
      overflow: hidden;
      background: var(--mop-surface-2);
      border: 0 !important;
    }

    html.mop-modern-ui article.bloglo-article .entry-media a {
      display: block;
      width: 100%;
      height: 100%;
    }

    html.mop-modern-ui article.bloglo-article .entry-media img {
      display: block;
      width: 100% !important;
      height: 100% !important;
      max-width: none !important;
      object-fit: cover;
      object-position: center 18%;
      transform: scale(1.001);
      filter: none;
      transition: transform 260ms ease, filter 180ms ease;
    }

    html.mop-modern-ui[data-mop-blur="true"] article.bloglo-article .entry-media img {
      filter: blur(22px) saturate(.65);
      transform: scale(1.09);
    }

    html.mop-modern-ui[data-mop-blur="true"] article.bloglo-article.mop-media-revealed .entry-media img {
      filter: none;
      transform: scale(1.001);
    }

    @media (hover: hover) {
      html.mop-modern-ui article.bloglo-article:not(.mop-viewed):hover .entry-media img {
        transform: scale(1.025);
      }
    }

    .mop-image-fallback {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 24px;
      color: var(--mop-muted);
      background: var(--mop-surface-2);
      font-size: 13px;
      font-weight: 700;
      text-align: center;
    }

    .mop-media-reveal {
      position: absolute;
      inset: 50% auto auto 50%;
      translate: -50% -50%;
      z-index: 3;
      display: none;
      align-items: center;
      gap: 8px;
      min-height: 44px;
      padding: 0 16px;
      border: 0;
      border-radius: 999px;
      color: white;
      background: rgba(0,0,0,.72);
      backdrop-filter: blur(12px);
      font: inherit;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
    }

    html.mop-modern-ui[data-mop-blur="true"] article.bloglo-article:not(.mop-media-revealed) .mop-media-reveal {
      display: inline-flex;
    }

    html.mop-modern-ui article.bloglo-article .bloglo-entry-content-wrapper {
      display: flex !important;
      flex-direction: column !important;
      flex: 1;
      width: 100% !important;
      min-width: 0 !important;
      padding: 19px 20px 18px !important;
      background: transparent !important;
      border: 0 !important;
    }

    html.mop-modern-ui article.bloglo-article .post-category {
      margin: 0 0 10px !important;
      padding: 0 !important;
    }

    html.mop-modern-ui article.bloglo-article .post-category .cat-links,
    html.mop-modern-ui article.bloglo-article .post-category .cat-links > span {
      display: flex !important;
      flex-wrap: wrap;
      gap: 7px;
      margin: 0 !important;
      padding: 0 !important;
    }

    html.mop-modern-ui article.bloglo-article .post-category a {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      padding: 0 13px;
      border: 0 !important;
      border-radius: 999px;
      color: var(--mop-accent) !important;
      background: color-mix(in srgb, var(--mop-accent) 12%, transparent) !important;
      font-size: 13px !important;
      font-weight: 800 !important;
      letter-spacing: .065em;
      line-height: 1;
      text-transform: uppercase;
    }

    html.mop-modern-ui article.bloglo-article .entry-header,
    html.mop-modern-ui article.bloglo-article .entry-title {
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
    }

    html.mop-modern-ui article.bloglo-article .entry-title {
      font-family: inherit !important;
      font-size: clamp(20px, 1.7vw, 27px) !important;
      font-weight: 800 !important;
      line-height: 1.17 !important;
      letter-spacing: -.035em !important;
      text-transform: none !important;
    }

    html.mop-modern-ui article.bloglo-article .entry-title a {
      color: var(--mop-text) !important;
      background: none !important;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }

    html.mop-modern-ui article.bloglo-article .entry-summary,
    html.mop-modern-ui article.bloglo-article .bloglo-entry {
      margin: 11px 0 0 !important;
      padding: 0 !important;
      color: var(--mop-muted) !important;
      font-size: 15px !important;
      line-height: 1.5 !important;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }

    html.mop-modern-ui article.bloglo-article .entry-meta {
      margin: auto 0 0 !important;
      padding: 17px 0 0 !important;
      border: 0 !important;
      background: transparent !important;
      color: var(--mop-muted) !important;
    }

    html.mop-modern-ui article.bloglo-article .entry-meta-elements {
      display: flex !important;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px 14px;
      min-width: 0;
      font-size: 13px !important;
      font-weight: 600;
    }

    html.mop-modern-ui article.bloglo-article .entry-meta-elements > span {
      margin: 0 !important;
      padding: 0 !important;
      color: var(--mop-muted) !important;
    }

    html.mop-modern-ui article.bloglo-article .entry-meta-elements > .cat-links {
      order: 3;
      flex-basis: 100%;
      min-width: 0;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--mop-faint) !important;
    }

    html.mop-modern-ui article.bloglo-article .entry-meta-elements > .cat-links > span {
      display: block;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    html.mop-modern-ui article.bloglo-article .entry-meta a,
    html.mop-modern-ui article.bloglo-article .entry-meta time {
      color: inherit !important;
    }

    html.mop-modern-ui article.bloglo-article .entry-meta svg {
      width: 15px !important;
      height: 15px !important;
      fill: currentColor !important;
      margin-right: 5px !important;
      vertical-align: -2px;
    }

    /* Ad Inserter blocks placed between posts on the home feed. */
    html.mop-modern-ui body.home .code-block[class*="code-block-"] {
      display: none !important;
      visibility: hidden !important;
      width: 0 !important;
      height: 0 !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }

    .mop-card-actions {
      position: absolute;
      z-index: 5;
      top: 12px;
      right: 12px;
      display: flex;
      gap: 7px;
    }

    .mop-action-button {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      color: white;
      background: rgba(7, 8, 12, .68);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .mop-action-button.mop-active {
      color: #190c20;
      background: var(--mop-accent);
    }

    .mop-viewed-badge {
      position: absolute;
      z-index: 4;
      left: 12px;
      top: 12px;
      display: none;
      min-height: 30px;
      padding: 0 11px;
      align-items: center;
      border-radius: 999px;
      color: white;
      background: rgba(7, 8, 12, .72);
      backdrop-filter: blur(12px);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .05em;
      text-transform: uppercase;
    }

    article.bloglo-article.mop-viewed .mop-viewed-badge { display: inline-flex; }

    html.mop-modern-ui[data-mop-density="compact"] {
      --mop-gap: 12px;
      --mop-radius: 17px;
    }

    html.mop-modern-ui[data-mop-density="compact"] article.bloglo-article .bloglo-entry-content-wrapper {
      padding: 14px 15px 13px !important;
    }

    html.mop-modern-ui[data-mop-density="compact"] article.bloglo-article .entry-title {
      font-size: clamp(18px, 1.45vw, 23px) !important;
    }

    html.mop-modern-ui[data-mop-density="compact"] article.bloglo-article .entry-summary {
      -webkit-line-clamp: 2;
      font-size: 14px !important;
    }

    .mop-empty-state {
      display: none;
      width: min(calc(100% - 36px), 560px);
      margin: 64px auto;
      padding: 34px;
      border-radius: 24px;
      text-align: center;
      background: var(--mop-surface);
    }

    .mop-empty-state.mop-visible { display: block; }
    .mop-empty-state h2 { margin: 0 0 8px; font-size: 24px; letter-spacing: -.03em; }
    .mop-empty-state p { margin: 0; color: var(--mop-muted); }

    #mop-scrim {
      position: fixed;
      inset: 0;
      z-index: 2147482000;
      display: block;
      opacity: 0;
      visibility: hidden;
      background: rgba(0, 0, 0, .58);
      backdrop-filter: blur(4px);
      transition: opacity 180ms ease, visibility 180ms ease;
    }

    #mop-scrim.mop-open {
      opacity: 1;
      visibility: visible;
    }

    #mop-drawer {
      position: fixed;
      z-index: 2147482001;
      inset: 12px 12px 12px auto;
      width: min(440px, calc(100vw - 24px));
      display: flex;
      flex-direction: column;
      color: var(--mop-text);
      background: var(--mop-surface);
      border-radius: 26px;
      box-shadow: 0 28px 90px rgba(0,0,0,.42);
      overflow: hidden;
      transform: translateX(calc(100% + 28px));
      transition: transform 220ms cubic-bezier(.2,.8,.2,1);
    }

    #mop-scrim.mop-open #mop-drawer { transform: translateX(0); }

    .mop-drawer-head {
      display: flex;
      align-items: center;
      min-height: 72px;
      gap: 12px;
      padding: 12px 14px 12px 22px;
      flex: none;
    }

    .mop-drawer-title {
      min-width: 0;
      flex: 1;
      font-size: 21px;
      font-weight: 800;
      letter-spacing: -.035em;
    }

    .mop-drawer-close {
      appearance: none;
      border: 0;
      width: 44px;
      height: 44px;
      border-radius: 15px;
      color: var(--mop-text);
      background: var(--mop-surface-2);
      display: grid;
      place-items: center;
      cursor: pointer;
    }

    .mop-drawer-body {
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 0 18px max(24px, env(safe-area-inset-bottom));
    }

    .mop-search-box {
      position: sticky;
      top: 0;
      z-index: 2;
      padding: 4px 0 14px;
      background: var(--mop-surface);
    }

    .mop-search-input-wrap {
      min-height: 54px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 15px;
      border-radius: 18px;
      background: var(--mop-surface-2);
    }

    .mop-search-input-wrap svg {
      width: 21px;
      height: 21px;
      flex: none;
      fill: none;
      stroke: var(--mop-muted);
      stroke-width: 1.8;
      stroke-linecap: round;
    }

    .mop-search-input {
      width: 100%;
      min-width: 0;
      height: 54px;
      border: 0 !important;
      outline: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
      color: var(--mop-text) !important;
      background: transparent !important;
      font: inherit !important;
      font-size: 16px !important;
    }

    .mop-search-input::placeholder { color: var(--mop-faint); }

    .mop-search-results {
      display: grid;
      gap: 8px;
    }

    .mop-result-link,
    .mop-menu-link {
      display: flex;
      align-items: center;
      gap: 13px;
      min-height: 58px;
      padding: 10px 12px;
      border-radius: 17px;
      color: var(--mop-text) !important;
      background: transparent;
      transition: background 140ms ease;
    }

    .mop-result-link:hover,
    .mop-menu-link:hover { background: var(--mop-surface-2); }

    .mop-result-thumb {
      width: 62px;
      height: 48px;
      flex: none;
      object-fit: cover;
      border-radius: 12px;
      background: var(--mop-surface-3);
    }

    .mop-result-copy { min-width: 0; }
    .mop-result-title { display: block; font-size: 14px; font-weight: 700; line-height: 1.3; }
    .mop-result-meta { display: block; margin-top: 3px; color: var(--mop-muted); font-size: 12px; }

    .mop-section-title {
      margin: 22px 4px 9px;
      color: var(--mop-muted);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .09em;
      text-transform: uppercase;
    }

    .mop-link-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .mop-link-card {
      display: flex;
      align-items: center;
      min-height: 54px;
      padding: 10px 13px;
      border-radius: 16px;
      color: var(--mop-text) !important;
      background: var(--mop-surface-2);
      font-size: 13px;
      font-weight: 700;
      line-height: 1.25;
    }

    .mop-link-card:hover { background: var(--mop-surface-3); }

    .mop-menu-tree,
    .mop-menu-tree ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .mop-menu-tree > li { margin-bottom: 7px; }

    .mop-menu-tree details {
      border-radius: 17px;
      background: var(--mop-surface-2);
      overflow: hidden;
    }

    .mop-menu-tree summary {
      min-height: 54px;
      padding: 10px 15px;
      display: flex;
      align-items: center;
      font-weight: 700;
      cursor: pointer;
      list-style: none;
    }

    .mop-menu-tree summary::-webkit-details-marker { display: none; }

    .mop-menu-tree details ul {
      display: grid;
      gap: 2px;
      padding: 0 8px 9px;
      max-height: 360px;
      overflow-y: auto;
    }

    .mop-menu-tree details a {
      display: flex;
      min-height: 44px;
      align-items: center;
      padding: 8px 11px;
      border-radius: 12px;
      color: var(--mop-muted) !important;
      font-size: 13px;
    }

    .mop-menu-tree details a:hover { color: var(--mop-text) !important; background: var(--mop-surface-3); }

    .mop-settings-list {
      display: grid;
      gap: 8px;
    }

    .mop-switch-row,
    .mop-setting-row {
      width: 100%;
      min-height: 64px;
      display: flex;
      align-items: center;
      gap: 13px;
      padding: 10px 14px;
      border: 0;
      border-radius: 18px;
      color: var(--mop-text);
      background: var(--mop-surface-2);
      font: inherit;
      text-align: left;
    }

    button.mop-switch-row,
    button.mop-setting-row { cursor: pointer; }

    .mop-setting-copy { flex: 1; min-width: 0; }
    .mop-setting-label { display: block; font-size: 14px; font-weight: 700; }
    .mop-setting-description { display: block; margin-top: 2px; color: var(--mop-muted); font-size: 12px; line-height: 1.3; }

    .mop-switch {
      position: relative;
      width: 48px;
      height: 28px;
      flex: none;
      border-radius: 999px;
      background: var(--mop-surface-3);
      transition: background 150ms ease;
    }

    .mop-switch::after {
      content: "";
      position: absolute;
      top: 4px;
      left: 4px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--mop-muted);
      transition: transform 150ms ease, background 150ms ease;
    }

    .mop-switch-row[aria-checked="true"] .mop-switch { background: var(--mop-accent); }
    .mop-switch-row[aria-checked="true"] .mop-switch::after { transform: translateX(20px); background: #180b1e; }

    .mop-segmented {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5px;
      padding: 5px;
      border-radius: 16px;
      background: var(--mop-surface-2);
    }

    .mop-segmented button {
      appearance: none;
      border: 0;
      min-height: 44px;
      border-radius: 12px;
      color: var(--mop-muted);
      background: transparent;
      font: inherit;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }

    .mop-segmented button[aria-pressed="true"] { color: var(--mop-text); background: var(--mop-surface-3); }

    .mop-danger-button {
      appearance: none;
      width: 100%;
      min-height: 52px;
      border: 0;
      border-radius: 17px;
      color: var(--mop-danger);
      background: color-mix(in srgb, var(--mop-danger) 10%, transparent);
      font: inherit;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
    }

    #mop-bottom-nav {
      position: fixed;
      z-index: 2147481000;
      inset: auto 0 0;
      display: none;
      min-height: calc(var(--mop-bottom-h) + env(safe-area-inset-bottom));
      padding: 7px max(8px, env(safe-area-inset-right)) env(safe-area-inset-bottom) max(8px, env(safe-area-inset-left));
      background: color-mix(in srgb, var(--mop-bg) 88%, transparent);
      backdrop-filter: blur(22px) saturate(135%);
      -webkit-backdrop-filter: blur(22px) saturate(135%);
    }

    .mop-bottom-inner {
      width: min(100%, 560px);
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      align-items: stretch;
    }

    .mop-nav-button {
      appearance: none;
      min-width: 0;
      min-height: 56px;
      border: 0;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      color: var(--mop-muted);
      background: transparent;
      font: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: color 140ms ease, background 140ms ease, transform 140ms ease;
    }

    .mop-nav-button svg { width: 22px; height: 22px; }
    .mop-nav-button:hover,
    .mop-nav-button.mop-active { color: var(--mop-text); background: var(--mop-surface-2); }

    .mop-toast-stack {
      position: fixed;
      z-index: 2147483000;
      inset: auto 18px 18px auto;
      display: grid;
      gap: 8px;
      pointer-events: none;
    }

    .mop-toast {
      max-width: min(360px, calc(100vw - 36px));
      padding: 12px 15px;
      border-radius: 15px;
      color: var(--mop-text);
      background: var(--mop-surface-3);
      box-shadow: 0 16px 50px rgba(0,0,0,.34);
      font-size: 13px;
      font-weight: 700;
      animation: mop-toast-in 180ms ease both;
    }

    @keyframes mop-toast-in {
      from { opacity: 0; transform: translateY(8px) scale(.98); }
      to { opacity: 1; transform: none; }
    }

    /* Single article and static pages */
    html.mop-modern-ui body.single #primary,
    html.mop-modern-ui body.page:not(.home) #primary {
      width: min(calc(100% - 36px), var(--mop-reading-w)) !important;
      margin: 0 auto !important;
      padding-bottom: 64px !important;
    }

    html.mop-modern-ui body.single article,
    html.mop-modern-ui body.page:not(.home) article,
    html.mop-modern-ui body.single .comments-area,
    html.mop-modern-ui body.page:not(.home) .comments-area {
      color: var(--mop-text) !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    html.mop-modern-ui body.single article .bloglo-blog-entry-wrapper,
    html.mop-modern-ui body.page:not(.home) article .bloglo-blog-entry-wrapper {
      display: block !important;
      background: transparent !important;
    }


    html.mop-modern-ui body.single article.bloglo-article,
    html.mop-modern-ui body.page:not(.home) article.bloglo-article {
      display: block !important;
      height: auto !important;
      overflow: visible !important;
      border-radius: 0 !important;
      content-visibility: visible !important;
      contain-intrinsic-size: auto !important;
    }

    html.mop-modern-ui body.single article .entry-media,
    html.mop-modern-ui body.single article .post-thumb,
    html.mop-modern-ui body.page:not(.home) article .entry-media,
    html.mop-modern-ui body.page:not(.home) article .post-thumb {
      width: auto !important;
      max-width: 100% !important;
      aspect-ratio: auto !important;
      overflow: visible !important;
      background: transparent !important;
      border-radius: 0 !important;
    }

    html.mop-modern-ui body.single article .entry-media a,
    html.mop-modern-ui body.page:not(.home) article .entry-media a {
      height: auto !important;
    }

    html.mop-modern-ui body.single article .entry-media img,
    html.mop-modern-ui body.single article .post-thumb img,
    html.mop-modern-ui body.page:not(.home) article .entry-media img,
    html.mop-modern-ui body.page:not(.home) article .post-thumb img {
      width: auto !important;
      height: auto !important;
      max-width: 100% !important;
      object-fit: contain !important;
      transform: none !important;
      margin-inline: auto !important;
      border-radius: 20px;
    }

    html.mop-modern-ui body.single article .bloglo-entry-content-wrapper,
    html.mop-modern-ui body.page:not(.home) article .bloglo-entry-content-wrapper {
      display: block !important;
      padding: 0 !important;
    }

    html.mop-modern-ui body.single .entry-header,
    html.mop-modern-ui body.page:not(.home) .entry-header {
      margin-bottom: 22px;
    }

    html.mop-modern-ui body.single h1.entry-title,
    html.mop-modern-ui body.page:not(.home) h1.entry-title {
      margin: 0 0 16px !important;
      color: var(--mop-text) !important;
      font-family: inherit !important;
      font-size: clamp(34px, 6vw, 62px) !important;
      font-weight: 800 !important;
      line-height: 1.02 !important;
      letter-spacing: -.055em !important;
      text-transform: none !important;
      display: block !important;
      max-height: none !important;
      overflow: visible !important;
      text-overflow: clip !important;
      white-space: normal !important;
      -webkit-box-orient: initial !important;
      -webkit-line-clamp: unset !important;
      line-clamp: unset !important;
    }

    html.mop-modern-ui body.single .entry-content,
    html.mop-modern-ui body.page:not(.home) .entry-content,
    html.mop-modern-ui body.single .bloglo-entry,
    html.mop-modern-ui body.page:not(.home) .bloglo-entry {
      color: var(--mop-text) !important;
      font-size: clamp(17px, 2vw, 19px) !important;
      line-height: 1.72 !important;
      display: block !important;
      max-height: none !important;
      overflow: visible !important;
      text-overflow: clip !important;
      white-space: normal !important;
      -webkit-box-orient: initial !important;
      -webkit-line-clamp: unset !important;
      line-clamp: unset !important;
    }

    html.mop-modern-ui body.single .entry-content p,
    html.mop-modern-ui body.page:not(.home) .entry-content p {
      margin: 0 0 1.3em;
    }

    html.mop-modern-ui body.single .entry-content img,
    html.mop-modern-ui body.single .entry-content video,
    html.mop-modern-ui body.single .entry-content iframe,
    html.mop-modern-ui body.page:not(.home) .entry-content img {
      display: block;
      width: auto;
      height: auto;
      max-width: 100%;
      margin: 22px auto;
      border-radius: 20px;
    }

    html.mop-modern-ui body.single .entry-content a,
    html.mop-modern-ui body.page:not(.home) .entry-content a {
      color: var(--mop-accent) !important;
      text-decoration: underline;
      text-decoration-color: color-mix(in srgb, var(--mop-accent) 45%, transparent);
      text-underline-offset: .2em;
    }

    html.mop-modern-ui .comments-area {
      margin-top: 48px !important;
      padding-top: 30px !important;
    }

    html.mop-modern-ui .comment-list,
    html.mop-modern-ui .comment-list ol {
      list-style: none;
      padding: 0;
    }

    html.mop-modern-ui .comment-body {
      margin: 0 0 12px !important;
      padding: 18px !important;
      border: 0 !important;
      border-radius: 18px;
      background: var(--mop-surface) !important;
    }

    html.mop-modern-ui input:not([type="checkbox"]):not([type="radio"]),
    html.mop-modern-ui textarea,
    html.mop-modern-ui select {
      max-width: 100%;
      color: var(--mop-text) !important;
      background: var(--mop-surface-2) !important;
      border: 0 !important;
      border-radius: 15px !important;
      box-shadow: none !important;
    }

    html.mop-modern-ui input:not([type="checkbox"]):not([type="radio"]),
    html.mop-modern-ui select { min-height: 48px; }
    html.mop-modern-ui textarea { min-height: 140px; }

    html.mop-modern-ui button:not(.mop-icon-button):not(.mop-action-button):not(.mop-chip):not(.mop-nav-button):not(.mop-drawer-close):not(.mop-switch-row):not(.mop-setting-row):not(.mop-danger-button):not(.mop-media-reveal),
    html.mop-modern-ui input[type="submit"] {
      border: 0 !important;
      border-radius: 14px !important;
      box-shadow: none !important;
    }

    @media (min-width: 1200px) {
      html.mop-modern-ui body.home #content > .bloglo-flex-row,
      html.mop-modern-ui body.blog #content > .bloglo-flex-row,
      html.mop-modern-ui body.archive #content > .bloglo-flex-row,
      html.mop-modern-ui body.search-results #content > .bloglo-flex-row {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (max-width: 760px) {
      :root {
        --mop-header-h: 60px;
        --mop-gap: 14px;
        --mop-radius: 19px;
      }

      html.mop-modern-ui body {
        padding-top: calc(var(--mop-header-h) + 12px) !important;
        padding-bottom: calc(var(--mop-bottom-h) + env(safe-area-inset-bottom) + 10px) !important;
      }

      html.mop-modern-ui[data-mop-bottom-nav="false"] body { padding-bottom: 18px !important; }

      #mop-app-header { padding-inline: max(11px, env(safe-area-inset-left)); }
      .mop-header-inner { gap: 7px; }
      .mop-brand { gap: 8px; font-size: 16px; }
      .mop-brand img { width: 34px; height: 34px; border-radius: 11px; }
      .mop-header-actions { gap: 4px; }
      .mop-icon-button { width: 42px; height: 42px; border-radius: 14px; }
      .mop-desktop-only { display: none !important; }

      #mop-feed-tools { width: calc(100% - 22px); margin-bottom: 12px; }

      html.mop-modern-ui body.home #content > .bloglo-flex-row,
      html.mop-modern-ui body.blog #content > .bloglo-flex-row,
      html.mop-modern-ui body.archive #content > .bloglo-flex-row,
      html.mop-modern-ui body.search-results #content > .bloglo-flex-row {
        width: calc(100% - 22px);
        grid-template-columns: minmax(0, 1fr);
        padding-bottom: 20px !important;
      }

      html.mop-modern-ui article.bloglo-article .entry-media,
      html.mop-modern-ui article.bloglo-article .post-thumb,
      html.mop-modern-ui article.bloglo-article .thumbnail {
        aspect-ratio: 5 / 4;
      }

      html.mop-modern-ui article.bloglo-article .bloglo-entry-content-wrapper {
        padding: 17px 17px 16px !important;
      }

      html.mop-modern-ui article.bloglo-article .entry-title {
        font-size: clamp(21px, 6.2vw, 27px) !important;
      }

      html.mop-modern-ui article.bloglo-article .entry-summary {
        font-size: 15px !important;
        -webkit-line-clamp: 3;
      }

      #mop-bottom-nav { display: block; }
      html.mop-modern-ui[data-mop-bottom-nav="false"] #mop-bottom-nav { display: none; }

      #mop-drawer {
        inset: auto 8px 8px;
        width: auto;
        max-height: min(84dvh, 760px);
        border-radius: 24px;
        transform: translateY(calc(100% + 20px));
      }

      #mop-scrim.mop-open #mop-drawer { transform: translateY(0); }
      .mop-drawer-head { min-height: 64px; padding: 8px 10px 8px 18px; }
      .mop-drawer-body { padding-inline: 12px; }
      .mop-link-grid { grid-template-columns: minmax(0, 1fr); }
      .mop-toast-stack { inset: auto 11px calc(var(--mop-bottom-h) + env(safe-area-inset-bottom) + 12px); }
      html.mop-modern-ui[data-mop-bottom-nav="false"] .mop-toast-stack { bottom: 11px; }

      html.mop-modern-ui body.single #primary,
      html.mop-modern-ui body.page:not(.home) #primary {
        width: calc(100% - 28px) !important;
        padding-bottom: 28px !important;
      }

      html.mop-modern-ui body.single h1.entry-title,
      html.mop-modern-ui body.page:not(.home) h1.entry-title {
        font-size: clamp(32px, 10vw, 48px) !important;
      }
    }


    /* v1.3 audit repair layer */
    html.mop-modern-ui[data-mop-fit-images="true"] article.bloglo-article .entry-media img {
      object-fit: contain !important;
      object-position: center !important;
      transform: none !important;
      background: var(--mop-surface-2);
    }

    html.mop-modern-ui article.bloglo-article.mop-card-clickable {
      cursor: pointer;
    }

    html.mop-modern-ui article.bloglo-article.mop-card-clickable:focus-within {
      background: var(--mop-surface-2) !important;
    }

    .mop-shortcut-hint {
      position: absolute;
      right: 3px;
      bottom: 2px;
      min-width: 15px;
      height: 15px;
      display: grid;
      place-items: center;
      border-radius: 5px;
      color: var(--mop-faint);
      background: var(--mop-surface-3);
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
      pointer-events: none;
    }

    .mop-icon-button { position: relative; }

    .mop-menu-tree summary::after {
      content: "";
      width: 9px;
      height: 9px;
      margin-left: auto;
      border-right: 2px solid var(--mop-muted);
      border-bottom: 2px solid var(--mop-muted);
      transform: rotate(45deg) translateY(-2px);
      transition: transform 150ms ease;
    }

    .mop-menu-tree details[open] summary::after {
      transform: rotate(225deg) translate(-2px, -2px);
    }

    .mop-menu-tree details ul {
      max-height: none;
      overflow: visible;
    }

    .mop-search-scope {
      margin: 0 3px 12px;
      color: var(--mop-muted);
      font-size: 13px;
      line-height: 1.45;
    }

    .mop-site-search-form {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      margin-bottom: 16px;
    }

    .mop-site-search-form .mop-search-input-wrap { min-width: 0; }
    .mop-site-search-submit {
      appearance: none;
      min-width: 92px;
      min-height: 54px;
      border: 0;
      border-radius: 18px;
      color: #14091a;
      background: var(--mop-accent);
      font: inherit;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
    }

    .mop-toast {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 48px;
      pointer-events: auto;
    }

    .mop-toast-message { flex: 1; min-width: 0; }
    .mop-toast-action {
      appearance: none;
      min-height: 44px;
      border: 0;
      border-radius: 11px;
      padding: 0 11px;
      color: #14091a;
      background: var(--mop-accent);
      font: inherit;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
    }

    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
      #mop-app-header,
      #mop-bottom-nav { background: var(--mop-surface) !important; }
      .mop-action-button,
      .mop-viewed-badge { background: #10141bcc !important; }
    }

    /* Individual post experience */
    html.mop-modern-ui body.single #primary {
      width: min(calc(100% - 36px), var(--mop-media-w)) !important;
    }

    html.mop-modern-ui body.single article > .post-category,
    html.mop-modern-ui body.single article > .entry-header,
    html.mop-modern-ui body.single article > .entry-meta,
    html.mop-modern-ui body.single article > .entry-footer,
    html.mop-modern-ui body.single article > .post-nav,
    html.mop-modern-ui body.single #mop-post-actions {
      width: min(100%, var(--mop-reading-w));
      margin-inline: auto !important;
    }

    html.mop-modern-ui body.single h1.entry-title {
      font-size: clamp(34px, 4.6vw, 52px) !important;
      font-weight: 800 !important;
      line-height: 1.1 !important;
      letter-spacing: -.03em !important;
      text-wrap: balance;
    }

    html.mop-modern-ui body.single .entry-meta {
      padding: 0 !important;
      font-size: 13px !important;
      line-height: 1.45 !important;
    }

    html.mop-modern-ui body.single .entry-meta-elements {
      gap: 10px 16px !important;
      font-size: 13px !important;
      white-space: normal !important;
    }

    html.mop-modern-ui body.single .entry-meta-elements > .cat-links,
    html.mop-modern-ui body.single .entry-meta-elements > .cat-links > span {
      max-width: none !important;
      overflow: visible !important;
      text-overflow: clip !important;
      white-space: normal !important;
    }

    html.mop-modern-ui body.single .entry-content {
      width: 100%;
      color: var(--mop-body) !important;
      font-size: clamp(17px, 1.65vw, 18.5px) !important;
      line-height: 1.72 !important;
    }

    html.mop-modern-ui body.single .entry-content > p,
    html.mop-modern-ui body.single .entry-content > h1,
    html.mop-modern-ui body.single .entry-content > h2,
    html.mop-modern-ui body.single .entry-content > h3,
    html.mop-modern-ui body.single .entry-content > h4,
    html.mop-modern-ui body.single .entry-content > h5,
    html.mop-modern-ui body.single .entry-content > h6,
    html.mop-modern-ui body.single .entry-content > ul,
    html.mop-modern-ui body.single .entry-content > ol,
    html.mop-modern-ui body.single .entry-content > blockquote,
    html.mop-modern-ui body.single .entry-content > .wpulike,
    html.mop-modern-ui body.single .entry-content > .code-block,
    html.mop-modern-ui body.single .entry-content > div:not(.wp-block-image):not(.wp-block-gallery) {
      width: min(100%, var(--mop-reading-w));
      margin-inline: auto;
    }

    html.mop-modern-ui body.single .entry-content > figure,
    html.mop-modern-ui body.single .entry-content > img,
    html.mop-modern-ui body.single .entry-content > video,
    html.mop-modern-ui body.single .entry-content > iframe,
    html.mop-modern-ui body.single .entry-content > .wp-block-gallery {
      width: min(100%, var(--mop-media-w));
      max-width: var(--mop-media-w) !important;
      margin-inline: auto !important;
    }

    html.mop-modern-ui body.single .entry-content figure img {
      width: 100% !important;
      max-width: 100% !important;
      object-fit: contain !important;
    }

    #mop-reading-progress {
      position: fixed;
      z-index: 2147481100;
      top: calc(var(--mop-header-h) + env(safe-area-inset-top) - 3px);
      left: 0;
      width: 100%;
      height: 3px;
      pointer-events: none;
      background: transparent;
    }

    #mop-reading-progress > span {
      display: block;
      width: 0;
      height: 100%;
      background: linear-gradient(90deg, var(--mop-accent), var(--mop-accent-2));
      transform-origin: left center;
      transition: width 80ms linear;
    }

    #mop-post-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
      margin: 18px auto 28px !important;
    }

    .mop-post-action {
      appearance: none;
      min-height: 46px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0 15px;
      border: 0;
      border-radius: 15px;
      color: var(--mop-text);
      background: var(--mop-surface-2);
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }

    .mop-post-action svg {
      width: 19px;
      height: 19px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .mop-post-action.mop-active {
      color: #14091a;
      background: var(--mop-accent);
    }

    html.mop-modern-ui body.single .entry-footer {
      margin-top: 28px !important;
      color: var(--mop-muted) !important;
      font-size: 13px !important;
    }

    html.mop-modern-ui body.single .post-tags .cat-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    html.mop-modern-ui body.single .post-tags a {
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      padding: 0 12px;
      border-radius: 999px;
      color: var(--mop-muted) !important;
      background: var(--mop-surface-2);
      font-size: 13px;
    }

    html.mop-modern-ui body.single .post-nav {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 30px !important;
    }

    html.mop-modern-ui body.single .post-nav > div { min-width: 0; }
    html.mop-modern-ui body.single .post-nav h6 {
      margin: 0 0 7px !important;
      color: var(--mop-faint) !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      letter-spacing: .06em;
      text-transform: uppercase;
    }

    html.mop-modern-ui body.single .post-nav a {
      min-height: 94px;
      display: flex !important;
      align-items: center;
      padding: 12px;
      border-radius: 18px;
      color: var(--mop-text) !important;
      background: var(--mop-surface);
    }

    html.mop-modern-ui body.single .post-nav .nav-content {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    html.mop-modern-ui body.single .post-nav img {
      width: 68px !important;
      height: 68px !important;
      flex: none;
      border-radius: 14px;
      object-fit: cover;
      object-position: center 18%;
    }

    html.mop-modern-ui body.single .wpulike {
      display: inline-flex !important;
      align-items: center;
      gap: 8px;
      margin-block: 16px !important;
      padding: 7px !important;
      border-radius: 16px;
      background: var(--mop-surface-2);
    }

    html.mop-modern-ui body.single .wp_ulike_general_class {
      display: inline-flex !important;
      align-items: center;
      min-height: 40px;
      gap: 6px;
      padding: 0 9px;
      border-radius: 12px;
      background: var(--mop-surface-3);
    }

    html.mop-modern-ui body.single .wp_ulike_btn {
      width: 32px !important;
      height: 32px !important;
      min-height: 32px !important;
      border-radius: 10px !important;
      background-color: transparent !important;
    }

    html.mop-modern-ui body.single .count-box {
      color: var(--mop-muted) !important;
      font-size: 13px !important;
      font-weight: 700 !important;
    }

    html.mop-modern-ui body.single .comments-area {
      width: min(100%, 760px);
      margin-inline: auto !important;
    }

    html.mop-modern-ui .comments-title,
    html.mop-modern-ui .comment-reply-title {
      color: var(--mop-text) !important;
      font-size: clamp(24px, 4vw, 31px) !important;
      font-weight: 800 !important;
      line-height: 1.15 !important;
      letter-spacing: -.025em;
    }

    html.mop-modern-ui .comment-list,
    html.mop-modern-ui .comment-list ol,
    html.mop-modern-ui .comment-list ul.children {
      margin: 0 !important;
      padding: 0 !important;
    }

    html.mop-modern-ui .comment-list ul.children {
      margin-left: clamp(12px, 3vw, 26px) !important;
    }

    html.mop-modern-ui .comment-body {
      font-size: 16px !important;
      line-height: 1.65 !important;
    }

    html.mop-modern-ui .comment-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    html.mop-modern-ui .comment-author-meta {
      color: var(--mop-text) !important;
      font-size: 14px !important;
      font-weight: 700 !important;
    }

    html.mop-modern-ui .comment-meta,
    html.mop-modern-ui .comment-actions {
      color: var(--mop-faint) !important;
      font-size: 13px !important;
    }

    html.mop-modern-ui .comment-content {
      color: var(--mop-body) !important;
      margin-top: 10px;
    }

    html.mop-modern-ui .comment-content p { margin: 0 0 .9em; }

    @media (max-width: 760px) {
      .mop-shortcut-hint { display: none; }
      html.mop-modern-ui body.single #primary { width: calc(100% - 24px) !important; }
      html.mop-modern-ui body.single h1.entry-title {
        font-size: clamp(28px, 8vw, 40px) !important;
        line-height: 1.12 !important;
        letter-spacing: -.025em !important;
      }
      html.mop-modern-ui body.single .entry-content {
        font-size: 17px !important;
        line-height: 1.7 !important;
      }
      html.mop-modern-ui body.single .post-nav { grid-template-columns: minmax(0, 1fr); }
      html.mop-modern-ui body.single .comment-list ul.children { margin-left: 12px !important; }
      #mop-post-actions { gap: 7px; }
      .mop-post-action { flex: 1 1 calc(50% - 7px); min-width: 0; }

      html.mop-modern-ui body.single h1.entry-title {
        font-size: clamp(29px, 8.2vw, 42px) !important;
        line-height: 1.11 !important;
        letter-spacing: -.025em !important;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      html.mop-modern-ui *,
      html.mop-modern-ui *::before,
      html.mop-modern-ui *::after {
        scroll-behavior: auto !important;
        transition-duration: .001ms !important;
        animation-duration: .001ms !important;
        animation-iteration-count: 1 !important;
      }
    }
  `;

  bootstrapEarly();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  function bootstrapEarly() {
    document.documentElement.classList.add(SCRIPT_ID);
    applyStateAttributes();
    addStyle(CSS);
  }

  function init() {
    if (!document.body || document.getElementById('mop-app-header')) return;

    createHeader();
    createDrawer();
    createBottomNav();
    createToastStack();
    processPage();
    attachGlobalEvents();
    observeChanges();
    restoreScrollPosition();
    registerMenuCommands();
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        ...DEFAULTS,
        ...parsed,
        saved: Array.isArray(parsed.saved) ? parsed.saved : [],
        viewed: Array.isArray(parsed.viewed) ? parsed.viewed : [],
      };
    } catch {
      return { ...DEFAULTS, saved: [], viewed: [] };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be unavailable in strict privacy contexts. The UI remains functional for this page.
    }
    applyStateAttributes();
  }

  function applyStateAttributes() {
    const root = document.documentElement;
    root.dataset.mopTheme = state.theme;
    root.dataset.mopDensity = state.density;
    root.dataset.mopBlur = String(Boolean(state.blurMedia));
    root.dataset.mopBottomNav = String(Boolean(state.bottomNav));
    root.dataset.mopFitImages = String(Boolean(state.fitImages));
  }

  function addStyle(css) {
    if (typeof GM_addStyle === 'function') {
      GM_addStyle(css);
      return;
    }
    const style = document.createElement('style');
    style.id = 'mop-modern-ui-styles';
    style.textContent = css;
    (document.head || document.documentElement).append(style);
  }

  function createHeader() {
    const header = document.createElement('header');
    header.id = 'mop-app-header';
    const searchLabel = isFeedPage() ? 'Search this page or the site' : 'Search the site';
    header.innerHTML = `
      <div class="mop-header-inner">
        <a class="mop-brand" href="${escapeAttribute(siteHome())}" aria-label="MenOfPorn home">
          ${brandImageMarkup()}
          <span class="mop-brand-text">MenOfPorn</span>
        </a>
        <div class="mop-header-spacer"></div>
        <div class="mop-header-actions">
          <button class="mop-icon-button" type="button" data-mop-action="search" aria-label="${searchLabel}" aria-controls="mop-drawer" aria-expanded="false" title="Search (/)" >${ICONS.search}<span class="mop-shortcut-hint" aria-hidden="true">/</span></button>
          <button class="mop-icon-button mop-desktop-only" type="button" data-mop-action="filters" aria-label="Filter posts" aria-controls="mop-drawer" aria-expanded="false">${ICONS.tune}</button>
          <button class="mop-icon-button" type="button" data-mop-action="browse" aria-label="Browse site" aria-controls="mop-drawer" aria-expanded="false">${ICONS.menu}</button>
        </div>
      </div>`;
    document.body.prepend(header);
  }

  function createDrawer() {
    const scrim = document.createElement('div');
    scrim.id = 'mop-scrim';
    scrim.setAttribute('aria-hidden', 'true');
    scrim.innerHTML = `
      <aside id="mop-drawer" role="dialog" aria-modal="true" aria-labelledby="mop-drawer-title">
        <div class="mop-drawer-head">
          <div class="mop-drawer-title" id="mop-drawer-title">Menu</div>
          <button class="mop-drawer-close" type="button" data-mop-action="close-drawer" aria-label="Close">${ICONS.close}</button>
        </div>
        <div class="mop-drawer-body" id="mop-drawer-body"></div>
      </aside>`;
    document.body.append(scrim);
  }

  function createBottomNav() {
    const nav = document.createElement('nav');
    nav.id = 'mop-bottom-nav';
    nav.setAttribute('aria-label', document.body.classList.contains('single') ? 'Article actions' : 'Quick navigation');

    if (document.body.classList.contains('single')) {
      nav.innerHTML = `
        <div class="mop-bottom-inner">
          <button class="mop-nav-button" type="button" data-mop-action="back">${ICONS.back}<span>Back</span></button>
          <button class="mop-nav-button" type="button" data-mop-action="post-save" aria-pressed="false">${ICONS.bookmark}<span>Save</span></button>
          <button class="mop-nav-button" type="button" data-mop-action="comments">${ICONS.comment}<span>Comments</span></button>
          <button class="mop-nav-button" type="button" data-mop-action="top">${ICONS.up}<span>Top</span></button>
          <button class="mop-nav-button" type="button" data-mop-action="settings" aria-controls="mop-drawer" aria-expanded="false">${ICONS.more}<span>More</span></button>
        </div>`;
    } else {
      nav.innerHTML = `
        <div class="mop-bottom-inner">
          <button class="mop-nav-button" type="button" data-mop-action="home" aria-current="page">${ICONS.home}<span>Home</span></button>
          <button class="mop-nav-button" type="button" data-mop-action="browse" aria-controls="mop-drawer" aria-expanded="false">${ICONS.menu}<span>Browse</span></button>
          <button class="mop-nav-button" type="button" data-mop-action="search" aria-controls="mop-drawer" aria-expanded="false">${ICONS.search}<span>Search</span></button>
          <button class="mop-nav-button" type="button" data-mop-action="saved" aria-pressed="false">${ICONS.bookmark}<span>Saved</span></button>
          <button class="mop-nav-button" type="button" data-mop-action="settings" aria-controls="mop-drawer" aria-expanded="false">${ICONS.more}<span>More</span></button>
        </div>`;
    }
    document.body.append(nav);
  }

  function createToastStack() {
    const stack = document.createElement('div');
    stack.className = 'mop-toast-stack';
    stack.id = 'mop-toast-stack';
    stack.setAttribute('aria-live', 'polite');
    document.body.append(stack);
  }

  function processPage() {
    hideFeedAds(document);
    hideEmptyPostAdBlocks(document);
    processArticles(document);
    createFeedTools();
    createEmptyState();
    applyFilters();
    improveImages(document);
    if (document.body.classList.contains('single')) {
      enhancePostPage();
      scheduleCurrentPostViewed();
    }
  }

  function createFeedTools() {
    if (!isFeedPage() || document.getElementById('mop-feed-tools')) return;
    const content = document.querySelector('#content');
    if (!content) return;

    const tools = document.createElement('div');
    tools.id = 'mop-feed-tools';
    tools.innerHTML = `
      <div class="mop-chip-strip" role="toolbar" aria-label="Post filters">
        ${filterChip('all', 'All')}
        ${filterChip('unread', 'Unread')}
        ${filterChip('saved', 'Saved')}
      </div>
      <button class="mop-icon-button" type="button" data-mop-action="filters" aria-label="More filters">${ICONS.tune}</button>`;
    content.prepend(tools);
    syncFilterUI();
  }

  function createEmptyState() {
    if (!isFeedPage() || document.getElementById('mop-empty-state')) return;
    const content = document.querySelector('#content');
    if (!content) return;
    const empty = document.createElement('section');
    empty.id = 'mop-empty-state';
    empty.className = 'mop-empty-state';
    empty.innerHTML = '<h2>No posts match</h2><p>Try another filter or clear the search.</p>';
    content.append(empty);
  }

  function processArticles(root = document) {
    if (!isFeedPage()) return;
    const articles = [];
    if (root instanceof Element && root.matches('article.bloglo-article')) articles.push(root);
    root.querySelectorAll?.('article.bloglo-article').forEach((article) => articles.push(article));

    articles.forEach((article) => {
      if (runtime.processedArticles.has(article)) return;
      runtime.processedArticles.add(article);

      const data = getArticleData(article);
      if (!data.url) return;

      article.dataset.mopUrl = data.url;
      article.dataset.mopSearch = normalizeText([data.title, data.category, data.tags, data.summary].join(' '));
      article.dataset.mopCategory = normalizeText(data.category);
      article.classList.add('mop-card-clickable');

      const media = article.querySelector('.entry-media, .post-thumb');
      if (media && !media.querySelector('.mop-media-reveal')) {
        const reveal = document.createElement('button');
        reveal.className = 'mop-media-reveal';
        reveal.type = 'button';
        reveal.dataset.mopAction = 'reveal-media';
        reveal.textContent = 'Reveal image';
        media.append(reveal);
      }

      const actions = document.createElement('div');
      actions.className = 'mop-card-actions';
      actions.innerHTML = `
        <button class="mop-action-button" type="button" data-mop-card-action="save" aria-label="Save post" title="Save post">${ICONS.bookmarkOutline}</button>
        <button class="mop-action-button" type="button" data-mop-card-action="viewed" aria-label="Mark as viewed" title="Mark as viewed">${ICONS.eye}</button>`;
      article.append(actions);

      const viewedBadge = document.createElement('span');
      viewedBadge.className = 'mop-viewed-badge';
      viewedBadge.textContent = 'Viewed';
      article.append(viewedBadge);
      syncArticleState(article);
    });
  }

  function improveImages(root = document) {
    const images = [];
    if (root instanceof HTMLImageElement) images.push(root);
    root.querySelectorAll?.('article img, .entry-content img').forEach((img) => images.push(img));
    const firstPostImage = document.body.classList.contains('single') ? document.querySelector('.entry-content img') : null;

    images.forEach((img) => {
      if (img === firstPostImage) {
        img.loading = 'eager';
        try { img.fetchPriority = 'high'; } catch { /* Older browsers ignore fetchPriority. */ }
      } else if (!img.hasAttribute('loading')) {
        img.loading = 'lazy';
      }
      img.decoding = 'async';
      if (img.dataset.mopImageHandled === 'true') return;
      img.dataset.mopImageHandled = 'true';
      img.addEventListener('error', () => {
        const media = img.closest('.entry-media, .post-thumb, figure');
        if (!media || media.querySelector('.mop-image-fallback')) return;
        img.style.visibility = 'hidden';
        const fallback = document.createElement('span');
        fallback.className = 'mop-image-fallback';
        fallback.textContent = 'Image unavailable';
        media.prepend(fallback);
      });
    });
  }

  function enhancePostPage() {
    runtime.postUrl = normalizeUrl(document.querySelector('link[rel="canonical"]')?.href || location.href);
    const article = document.querySelector('article.bloglo-article');
    if (!article) return;

    const comments = document.querySelector('.comments-area');
    if (comments && !comments.id) comments.id = 'comments';

    if (!document.getElementById('mop-reading-progress')) {
      const progress = document.createElement('div');
      progress.id = 'mop-reading-progress';
      progress.setAttribute('role', 'progressbar');
      progress.setAttribute('aria-label', 'Reading progress');
      progress.setAttribute('aria-valuemin', '0');
      progress.setAttribute('aria-valuemax', '100');
      progress.setAttribute('aria-valuenow', '0');
      progress.innerHTML = '<span></span>';
      document.body.append(progress);
    }

    if (!document.getElementById('mop-post-actions')) {
      const actions = document.createElement('div');
      actions.id = 'mop-post-actions';
      actions.setAttribute('role', 'toolbar');
      actions.setAttribute('aria-label', 'Post actions');
      actions.innerHTML = `
        <button class="mop-post-action" type="button" data-mop-action="post-save" aria-pressed="false">${ICONS.bookmark}<span>Save</span></button>
        <button class="mop-post-action" type="button" data-mop-action="comments">${ICONS.comment}<span>Comments</span></button>
        <button class="mop-post-action" type="button" data-mop-action="copy-link">${ICONS.link}<span>Copy link</span></button>
        <button class="mop-post-action" type="button" data-mop-action="top">${ICONS.up}<span>Top</span></button>`;
      const meta = article.querySelector('.entry-meta');
      (meta || article.querySelector('.entry-header'))?.after(actions);
    }

    syncPostState();
    updateReadingProgress();
  }

  function scheduleCurrentPostViewed() {
    if (!runtime.postUrl || isViewed(runtime.postUrl)) return;
    runtime.viewedElapsed = 0;
    const resume = () => {
      if (document.hidden || isViewed(runtime.postUrl) || runtime.viewedStartedAt) return;
      runtime.viewedStartedAt = performance.now();
      clearTimeout(runtime.viewedTimer);
      runtime.viewedTimer = window.setTimeout(commitViewedDwell, Math.max(250, 10000 - runtime.viewedElapsed));
    };
    const pause = () => {
      if (runtime.viewedStartedAt) runtime.viewedElapsed += performance.now() - runtime.viewedStartedAt;
      runtime.viewedStartedAt = 0;
      clearTimeout(runtime.viewedTimer);
    };
    runtime.handleVisibility = () => document.hidden ? pause() : resume();
    document.addEventListener('visibilitychange', runtime.handleVisibility);
    resume();
  }

  function commitViewedDwell() {
    if (!runtime.postUrl || document.hidden || isViewed(runtime.postUrl)) return;
    if (runtime.viewedStartedAt) runtime.viewedElapsed += performance.now() - runtime.viewedStartedAt;
    runtime.viewedStartedAt = 0;
    if (runtime.viewedElapsed >= 9800) {
      markViewed(runtime.postUrl, true, false);
      syncPostState();
      return;
    }
    runtime.viewedTimer = window.setTimeout(commitViewedDwell, Math.max(250, 10000 - runtime.viewedElapsed));
  }

  function syncPostState() {
    if (!runtime.postUrl) return;
    const saved = isSaved(runtime.postUrl);
    document.querySelectorAll('[data-mop-action="post-save"]').forEach((button) => {
      button.classList.toggle('mop-active', saved);
      button.setAttribute('aria-pressed', String(saved));
      const label = button.querySelector('span');
      if (label) label.textContent = saved ? 'Saved' : 'Save';
    });
  }

  function updateReadingProgress() {
    if (!document.body.classList.contains('single')) return;
    const progress = document.getElementById('mop-reading-progress');
    const article = document.querySelector('article.bloglo-article');
    if (!progress || !article) return;
    const start = article.offsetTop;
    const end = start + article.offsetHeight - window.innerHeight;
    const percent = end <= start ? 100 : Math.min(100, Math.max(0, ((window.scrollY - start) / (end - start)) * 100));
    progress.querySelector('span')?.style.setProperty('width', `${percent.toFixed(1)}%`);
    progress.setAttribute('aria-valuenow', String(Math.round(percent)));
  }

  function attachGlobalEvents() {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', () => { storeScrollPosition(); clearTimeout(runtime.viewedTimer); });
    window.addEventListener('beforeunload', storeScrollPosition);
  }

  function onDocumentClick(event) {
    const actionNode = event.target.closest('[data-mop-action]');
    if (actionNode) {
      const action = actionNode.dataset.mopAction;
      if (handleGlobalAction(action, actionNode, event)) return;
    }

    const cardAction = event.target.closest('[data-mop-card-action]');
    if (cardAction) {
      event.preventDefault();
      event.stopPropagation();
      const article = cardAction.closest('article.bloglo-article');
      if (!article) return;
      const url = article.dataset.mopUrl;
      if (cardAction.dataset.mopCardAction === 'save') toggleSaved(url);
      if (cardAction.dataset.mopCardAction === 'viewed') markViewed(url, !isViewed(url), true);
      syncArticleState(article);
      applyFilters();
      return;
    }

    const card = event.target.closest('article.bloglo-article.mop-card-clickable');
    if (card && isFeedPage()) {
      const interactive = event.target.closest('a, button, input, textarea, select, summary, [role="button"]');
      const selection = window.getSelection?.()?.toString().trim();
      if (!interactive && !selection && card.dataset.mopUrl) location.href = card.dataset.mopUrl;
    }

    if (event.target.id === 'mop-scrim') closeDrawer();
  }

  function handleGlobalAction(action, node, event) {
    switch (action) {
      case 'search':
        event.preventDefault();
        openDrawer('search');
        return true;
      case 'browse':
        event.preventDefault();
        openDrawer('browse');
        return true;
      case 'filters':
        event.preventDefault();
        openDrawer('filters');
        return true;
      case 'settings':
        event.preventDefault();
        openDrawer('settings');
        return true;
      case 'saved':
        event.preventDefault();
        if (isFeedPage()) {
          setFilter('saved');
          closeDrawer();
          window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        } else {
          location.href = siteHome() + '#mop-saved';
        }
        return true;
      case 'home':
        event.preventDefault();
        if (location.href.replace(/#.*$/, '') === siteHome().replace(/#.*$/, '')) {
          window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        } else {
          location.href = siteHome();
        }
        return true;
      case 'back':
        event.preventDefault();
        if (history.length > 1) history.back();
        else location.href = siteHome();
        return true;
      case 'post-save':
        event.preventDefault();
        toggleSaved(runtime.postUrl || normalizeUrl(location.href));
        syncPostState();
        return true;
      case 'comments': {
        event.preventDefault();
        const comments = document.querySelector('.comments-area');
        if (comments) comments.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
        else toast('Comments are not available on this post');
        return true;
      }
      case 'top':
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        return true;
      case 'copy-link':
        event.preventDefault();
        copyCurrentLink();
        return true;
      case 'close-drawer':
        event.preventDefault();
        closeDrawer();
        return true;
      case 'set-filter':
        event.preventDefault();
        setFilter(node.dataset.filter || 'all');
        return true;
      case 'set-category':
        event.preventDefault();
        runtime.activeCategory = node.dataset.category || '';
        state.activeFilter = runtime.activeCategory ? 'category' : 'all';
        saveState();
        applyFilters();
        closeDrawer();
        return true;
      case 'reveal-media':
        event.preventDefault();
        event.stopPropagation();
        node.closest('article')?.classList.add('mop-media-revealed');
        return true;
      case 'toggle-setting':
        event.preventDefault();
        toggleSetting(node.dataset.setting);
        renderDrawer('settings');
        return true;
      case 'set-theme':
        event.preventDefault();
        state.theme = node.dataset.value === 'oled' ? 'oled' : 'dark';
        saveState();
        renderDrawer('settings');
        return true;
      case 'set-density':
        event.preventDefault();
        state.density = node.dataset.value === 'compact' ? 'compact' : 'comfortable';
        saveState();
        renderDrawer('settings');
        return true;
      case 'clear-history': {
        event.preventDefault();
        const previous = [...state.viewed];
        state.viewed = [];
        saveState();
        syncAllArticles();
        applyFilters();
        renderDrawer('settings');
        toast('Viewed history cleared', { actionLabel: 'Undo', duration: 8000, onAction: () => {
          state.viewed = previous;
          saveState();
          syncAllArticles();
          applyFilters();
          if (runtime.drawerMode === 'settings') renderDrawer('settings');
        }});
        return true;
      }
      case 'clear-saved': {
        event.preventDefault();
        const previous = [...state.saved];
        state.saved = [];
        saveState();
        syncAllArticles();
        syncPostState();
        applyFilters();
        renderDrawer('settings');
        toast('Saved posts cleared', { actionLabel: 'Undo', duration: 8000, onAction: () => {
          state.saved = previous;
          saveState();
          syncAllArticles();
          syncPostState();
          applyFilters();
          if (runtime.drawerMode === 'settings') renderDrawer('settings');
        }});
        return true;
      }
      default:
        return false;
    }
  }

  function onKeyDown(event) {
    if (runtime.drawerMode && event.key === 'Tab') {
      const drawer = document.getElementById('mop-drawer');
      const focusable = getFocusableElements(drawer);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    if (event.key === 'Escape' && document.getElementById('mop-scrim')?.classList.contains('mop-open')) {
      closeDrawer();
      return;
    }

    const target = event.target;
    const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
    if (!isTyping && event.key === '/') {
      event.preventDefault();
      openDrawer('search');
    }
  }

  function onScroll() {
    const header = document.getElementById('mop-app-header');
    if (header && !runtime.drawerMode) {
      const current = Math.max(0, window.scrollY);
      const previous = Number(header.dataset.lastScroll || '0');
      const goingDown = current > previous;
      if (current > 140 && goingDown && current - previous > 2) header.classList.add('mop-hidden');
      if (!goingDown || current < 80) header.classList.remove('mop-hidden');
      header.dataset.lastScroll = String(current);
    }

    if (!runtime.progressFrame) {
      runtime.progressFrame = requestAnimationFrame(() => {
        runtime.progressFrame = 0;
        updateReadingProgress();
      });
    }

    clearTimeout(runtime.scrollTimer);
    runtime.scrollTimer = window.setTimeout(storeScrollPosition, 180);
  }

  function openDrawer(mode) {
    const returnFocus = runtime.drawerMode ? runtime.lastFocus : document.activeElement;
    if (runtime.drawerMode) closeDrawer(false);
    runtime.lastFocus = returnFocus;
    runtime.drawerMode = mode;
    renderDrawer(mode);
    const scrim = document.getElementById('mop-scrim');
    scrim?.classList.add('mop-open');
    scrim?.setAttribute('aria-hidden', 'false');
    setDrawerTriggerState(mode, true);
    setPageInert(true);
    document.documentElement.style.overflow = 'hidden';
    document.getElementById('mop-app-header')?.classList.remove('mop-hidden');

    requestAnimationFrame(() => {
      const focusTarget = document.querySelector('#mop-drawer .mop-search-input, #mop-drawer button, #mop-drawer a, #mop-drawer summary');
      focusTarget?.focus({ preventScroll: true });
    });
  }

  function closeDrawer(restoreFocus = true) {
    const previousMode = runtime.drawerMode;
    runtime.drawerMode = null;
    const scrim = document.getElementById('mop-scrim');
    scrim?.classList.remove('mop-open');
    scrim?.setAttribute('aria-hidden', 'true');
    setDrawerTriggerState(previousMode, false);
    setPageInert(false);
    document.documentElement.style.overflow = '';
    if (restoreFocus && runtime.lastFocus instanceof HTMLElement) runtime.lastFocus.focus({ preventScroll: true });
  }

  function renderDrawer(mode) {
    const title = document.getElementById('mop-drawer-title');
    const body = document.getElementById('mop-drawer-body');
    if (!title || !body) return;
    body.replaceChildren();

    if (mode === 'search') {
      title.textContent = 'Search';
      renderSearch(body);
    } else if (mode === 'browse') {
      title.textContent = 'Browse';
      renderBrowse(body);
    } else if (mode === 'filters') {
      title.textContent = 'Filter posts';
      renderFilters(body);
    } else {
      title.textContent = 'Settings';
      renderSettings(body);
    }
  }

  function renderSearch(container) {
    const siteForm = document.createElement('form');
    siteForm.className = 'mop-site-search-form';
    siteForm.method = 'get';
    siteForm.action = siteHome();
    siteForm.innerHTML = `
      <label class="mop-search-input-wrap">
        ${ICONS.search}
        <input class="mop-search-input" name="s" type="search" inputmode="search" autocomplete="off" placeholder="Search the entire site…" aria-label="Search the entire site">
      </label>
      <button class="mop-site-search-submit" type="submit">Search</button>`;
    container.append(siteForm);

    if (!isFeedPage()) {
      const note = document.createElement('p');
      note.className = 'mop-search-scope';
      note.textContent = 'This searches the full site. Press / anywhere to reopen search.';
      container.append(note);
      return;
    }

    container.append(sectionTitle('Posts loaded on this page'));
    const note = document.createElement('p');
    note.className = 'mop-search-scope';
    note.textContent = 'Filter only the posts currently loaded below.';
    container.append(note);

    const searchBox = document.createElement('div');
    searchBox.className = 'mop-search-box';
    searchBox.innerHTML = `
      <label class="mop-search-input-wrap">
        ${ICONS.search}
        <input class="mop-search-input" type="search" inputmode="search" autocomplete="off" placeholder="Titles, tags, categories…" aria-label="Filter posts loaded on this page">
      </label>`;

    const results = document.createElement('div');
    results.className = 'mop-search-results';
    container.append(searchBox, results);

    const input = searchBox.querySelector('input');
    input.value = runtime.searchText;
    const update = () => {
      runtime.searchText = input.value.trim();
      renderSearchResults(results, runtime.searchText);
    };
    input.addEventListener('input', update);
    update();
  }

  function renderSearchResults(container, query) {
    const all = getAllArticleData();
    const normalized = normalizeText(query);
    const matches = all.filter((item) => !normalized || item.search.includes(normalized)).slice(0, 50);
    container.replaceChildren();

    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'mop-empty-state mop-visible';
      empty.style.margin = '24px 0';
      empty.innerHTML = '<h2>Nothing found</h2><p>Try a shorter name, tag, or category.</p>';
      container.append(empty);
      return;
    }

    matches.forEach((item) => {
      const link = document.createElement('a');
      link.className = 'mop-result-link';
      link.href = item.url;
      const image = item.image ? `<img class="mop-result-thumb" src="${escapeAttribute(item.image)}" alt="" loading="lazy">` : '<span class="mop-result-thumb"></span>';
      link.innerHTML = `${image}<span class="mop-result-copy"><span class="mop-result-title">${escapeHtml(item.title || 'Untitled')}</span><span class="mop-result-meta">${escapeHtml(item.category || item.date || 'Post')}</span></span>`;
      container.append(link);
    });
  }

  function renderBrowse(container) {
    const quick = [
      ['Latest posts', siteHome()],
      ['Categories & tags', findLinkByText('Categories & Tags') || `${siteHome()}categories`],
      ['Polls', findLinkByText('Polls') || `${siteHome()}category/polls`],
      ['Archives', findLinkByText('Archives') || `${siteHome()}archives`],
    ];

    container.append(sectionTitle('Quick links'));
    const grid = document.createElement('div');
    grid.className = 'mop-link-grid';
    quick.forEach(([label, href]) => {
      const link = document.createElement('a');
      link.className = 'mop-link-card';
      link.href = href;
      link.textContent = label;
      grid.append(link);
    });
    container.append(grid);

    const menuRoot = document.querySelector('#bloglo-primary-nav');
    if (menuRoot) {
      container.append(sectionTitle('Site menu'));
      container.append(buildMenuTree(menuRoot));
    }

    const sidebar = document.querySelector('#secondary');
    const discountWidget = sidebar?.querySelector('.widget_nav_menu');
    if (discountWidget) {
      const links = [...discountWidget.querySelectorAll('a')].slice(0, 20);
      if (links.length) {
        container.append(sectionTitle('Deals'));
        const deals = document.createElement('div');
        deals.className = 'mop-link-grid';
        links.forEach((source) => {
          const link = document.createElement('a');
          link.className = 'mop-link-card';
          link.href = source.href;
          link.target = source.target || '';
          link.rel = source.rel || 'noopener';
          link.textContent = cleanText(source.textContent);
          deals.append(link);
        });
        container.append(deals);
      }
    }
  }

  function buildMenuTree(sourceRoot) {
    const tree = document.createElement('ul');
    tree.className = 'mop-menu-tree';
    const topItems = [...sourceRoot.children].filter((node) => node.matches('li'));

    topItems.forEach((item) => {
      const directLink = [...item.children].find((node) => node.matches?.('a'));
      if (!directLink) return;
      const children = [...item.children].find((node) => node.matches?.('ul'));
      const li = document.createElement('li');

      if (children) {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = cleanText(directLink.textContent);
        const list = document.createElement('ul');
        flattenMenuLinks(children).slice(0, 120).forEach((entry) => {
          const child = document.createElement('li');
          const link = document.createElement('a');
          link.href = entry.href;
          link.textContent = entry.label;
          if (isExternal(entry.href)) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
          }
          child.append(link);
          list.append(child);
        });
        details.append(summary, list);
        li.append(details);
      } else {
        const link = document.createElement('a');
        link.className = 'mop-menu-link';
        link.href = directLink.href;
        link.textContent = cleanText(directLink.textContent);
        li.append(link);
      }
      tree.append(li);
    });
    return tree;
  }

  function renderFilters(container) {
    const filters = document.createElement('div');
    filters.className = 'mop-settings-list';
    [
      ['all', 'All posts', 'Show everything on this page'],
      ['unread', 'Unread', 'Hide posts already opened or marked viewed'],
      ['saved', 'Saved', `${state.saved.length} saved post${state.saved.length === 1 ? '' : 's'}`],
    ].forEach(([value, label, description]) => {
      const button = document.createElement('button');
      button.className = 'mop-setting-row';
      button.type = 'button';
      button.dataset.mopAction = 'set-filter';
      button.dataset.filter = value;
      button.innerHTML = `<span class="mop-setting-copy"><span class="mop-setting-label">${label}</span><span class="mop-setting-description">${description}</span></span>${state.activeFilter === value ? ICONS.check : ICONS.arrow}`;
      filters.append(button);
    });
    container.append(filters);

    const categories = collectCategories();
    if (categories.length) {
      container.append(sectionTitle('Categories on this page'));
      const grid = document.createElement('div');
      grid.className = 'mop-link-grid';
      categories.forEach((category) => {
        const button = document.createElement('button');
        button.className = 'mop-link-card';
        button.type = 'button';
        button.dataset.mopAction = 'set-category';
        button.dataset.category = category.normalized;
        button.textContent = `${category.label} · ${category.count}`;
        button.style.border = '0';
        button.style.cursor = 'pointer';
        button.style.color = 'var(--mop-text)';
        grid.append(button);
      });
      container.append(grid);
    }
  }

  function renderSettings(container) {
    container.append(sectionTitle('Appearance'));

    const themeWrap = document.createElement('div');
    themeWrap.className = 'mop-segmented';
    themeWrap.innerHTML = `
      <button type="button" data-mop-action="set-theme" data-value="dark" aria-pressed="${state.theme === 'dark'}">Dark</button>
      <button type="button" data-mop-action="set-theme" data-value="oled" aria-pressed="${state.theme === 'oled'}">OLED black</button>`;
    container.append(themeWrap);

    const densityWrap = document.createElement('div');
    densityWrap.className = 'mop-segmented';
    densityWrap.style.marginTop = '8px';
    densityWrap.innerHTML = `
      <button type="button" data-mop-action="set-density" data-value="comfortable" aria-pressed="${state.density === 'comfortable'}">Comfortable</button>
      <button type="button" data-mop-action="set-density" data-value="compact" aria-pressed="${state.density === 'compact'}">Compact</button>`;
    container.append(densityWrap);

    container.append(sectionTitle('Behavior'));
    const settings = document.createElement('div');
    settings.className = 'mop-settings-list';
    settings.append(
      settingToggle('blurMedia', 'Blur thumbnails', 'Tap an image to reveal it'),
      settingToggle('fitImages', 'Fit full thumbnails', 'Avoid cropping faces by letterboxing feed images'),
      settingToggle('hideViewed', 'Hide viewed posts', 'Applied whenever the All filter is active'),
      settingToggle('bottomNav', 'Mobile bottom bar', 'Keep quick actions within thumb reach'),
      settingToggle('restoreScroll', 'Restore scroll position', 'Continue where you left each page'),
    );
    container.append(settings);

    container.append(sectionTitle('Local data'));
    const clearViewed = document.createElement('button');
    clearViewed.className = 'mop-danger-button';
    clearViewed.type = 'button';
    clearViewed.dataset.mopAction = 'clear-history';
    clearViewed.textContent = `Clear viewed history (${state.viewed.length})`;
    container.append(clearViewed);

    const clearSaved = document.createElement('button');
    clearSaved.className = 'mop-danger-button';
    clearSaved.type = 'button';
    clearSaved.dataset.mopAction = 'clear-saved';
    clearSaved.style.marginTop = '8px';
    clearSaved.textContent = `Clear saved posts (${state.saved.length})`;
    container.append(clearSaved);
  }

  function settingToggle(key, label, description) {
    const button = document.createElement('button');
    button.className = 'mop-switch-row';
    button.type = 'button';
    button.role = 'switch';
    button.dataset.mopAction = 'toggle-setting';
    button.dataset.setting = key;
    button.setAttribute('aria-checked', String(Boolean(state[key])));
    button.innerHTML = `<span class="mop-setting-copy"><span class="mop-setting-label">${label}</span><span class="mop-setting-description">${description}</span></span><span class="mop-switch" aria-hidden="true"></span>`;
    return button;
  }

  function toggleSetting(key) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key) || typeof DEFAULTS[key] !== 'boolean') return;
    state[key] = !state[key];
    saveState();
    applyFilters();
    toast(`${settingLabel(key)} ${state[key] ? 'enabled' : 'disabled'}`);
  }

  function settingLabel(key) {
    return ({ blurMedia: 'Thumbnail blur', fitImages: 'Fit images', hideViewed: 'Hide viewed', bottomNav: 'Bottom bar', restoreScroll: 'Scroll restore' })[key] || 'Setting';
  }

  function setFilter(filter) {
    state.activeFilter = ['all', 'unread', 'saved'].includes(filter) ? filter : 'all';
    runtime.activeCategory = '';
    saveState();
    applyFilters();
    syncFilterUI();
    if (runtime.drawerMode === 'filters') closeDrawer();
  }

  function applyFilters() {
    if (!isFeedPage()) return;
    let visible = 0;
    document.querySelectorAll('article.bloglo-article').forEach((article) => {
      const url = article.dataset.mopUrl;
      const viewed = isViewed(url);
      const saved = isSaved(url);
      let show = true;

      if (state.activeFilter === 'unread') show = !viewed;
      if (state.activeFilter === 'saved') show = saved;
      if (state.activeFilter === 'category') show = article.dataset.mopCategory === runtime.activeCategory;
      if (state.activeFilter === 'all' && state.hideViewed) show = !viewed;
      if (runtime.searchText) show = show && article.dataset.mopSearch.includes(normalizeText(runtime.searchText));

      article.classList.toggle('mop-filtered-out', !show);
      if (show) visible += 1;
    });

    document.getElementById('mop-empty-state')?.classList.toggle('mop-visible', visible === 0);
    syncFilterUI();
  }

  function syncFilterUI() {
    document.querySelectorAll('[data-mop-action="set-filter"]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === state.activeFilter));
    });
    const home = document.querySelector('#mop-bottom-nav [data-mop-action="home"]');
    const saved = document.querySelector('#mop-bottom-nav [data-mop-action="saved"]');
    document.querySelectorAll('#mop-bottom-nav .mop-nav-button').forEach((button) => button.classList.remove('mop-active'));
    if (saved) saved.setAttribute('aria-pressed', String(state.activeFilter === 'saved'));
    if (home) {
      if (state.activeFilter === 'saved') home.removeAttribute('aria-current');
      else home.setAttribute('aria-current', 'page');
    }
    if (state.activeFilter === 'saved') saved?.classList.add('mop-active');
    else home?.classList.add('mop-active');
  }

  function syncArticleState(article) {
    const url = article.dataset.mopUrl;
    const saved = isSaved(url);
    const viewed = isViewed(url);
    article.classList.toggle('mop-viewed', viewed);

    const saveButton = article.querySelector('[data-mop-card-action="save"]');
    if (saveButton) {
      saveButton.classList.toggle('mop-active', saved);
      saveButton.dataset.filled = String(saved);
      saveButton.setAttribute('aria-label', saved ? 'Remove saved post' : 'Save post');
      saveButton.title = saved ? 'Remove saved post' : 'Save post';
    }

    const viewedButton = article.querySelector('[data-mop-card-action="viewed"]');
    if (viewedButton) {
      viewedButton.classList.toggle('mop-active', viewed);
      viewedButton.innerHTML = viewed ? ICONS.eyeOff : ICONS.eye;
      viewedButton.setAttribute('aria-label', viewed ? 'Mark as unread' : 'Mark as viewed');
      viewedButton.title = viewed ? 'Mark as unread' : 'Mark as viewed';
    }
  }

  function syncAllArticles() {
    document.querySelectorAll('article.bloglo-article').forEach(syncArticleState);
  }

  function toggleSaved(url) {
    if (!url) return;
    if (isSaved(url)) {
      state.saved = state.saved.filter((item) => item !== url);
      toast('Removed from saved');
    } else {
      state.saved = limitSet([...state.saved, url], 1000);
      toast('Saved locally');
    }
    saveState();
    syncPostState();
  }

  function markViewed(url, viewed, announce) {
    if (!url) return;
    if (viewed) state.viewed = limitSet([...state.viewed, url], 3000);
    else state.viewed = state.viewed.filter((item) => item !== url);
    saveState();
    if (announce) toast(viewed ? 'Marked as viewed' : 'Marked as unread');
  }

  function isSaved(url) {
    return Boolean(url && state.saved.includes(url));
  }

  function isViewed(url) {
    return Boolean(url && state.viewed.includes(url));
  }

  function getArticleData(article) {
    const titleLink = article.querySelector('.entry-title a, h1 a, h2 a, h3 a, h4 a');
    const image = article.querySelector('.entry-media img, .post-thumb img, img.wp-post-image');
    const categoryLinks = [...article.querySelectorAll('.post-category a, [rel="category"]')];
    const metaTagContainer = article.querySelector('.entry-meta .cat-links');
    const date = article.querySelector('time')?.textContent || '';
    const summary = article.querySelector('.entry-summary, .entry-content, .bloglo-entry')?.textContent || '';
    const title = cleanText(titleLink?.textContent || article.querySelector('.entry-title')?.textContent || '');
    const url = normalizeUrl(titleLink?.href || article.querySelector('.entry-image-link')?.href || '');
    const category = cleanText(categoryLinks.map((link) => link.textContent).join(' · '));
    const tags = cleanText(metaTagContainer?.textContent || '');

    return {
      article,
      title,
      url,
      image: image?.currentSrc || image?.src || '',
      category,
      tags,
      summary: cleanText(summary),
      date: cleanText(date),
      search: normalizeText([title, category, tags, summary].join(' ')),
    };
  }

  function getAllArticleData() {
    return [...document.querySelectorAll('article.bloglo-article')]
      .map(getArticleData)
      .filter((item) => item.url);
  }

  function collectCategories() {
    const map = new Map();
    getAllArticleData().forEach((item) => {
      item.category.split(' · ').map(cleanText).filter(Boolean).forEach((label) => {
        const normalized = normalizeText(label);
        const existing = map.get(normalized) || { label, normalized, count: 0 };
        existing.count += 1;
        map.set(normalized, existing);
      });
    });
    return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 24);
  }

  function observeChanges() {
    const target = document.querySelector('#content') || document.body;
    const pendingRoots = new Set();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) pendingRoots.add(node);
        });
      });
      if (!pendingRoots.size) return;
      clearTimeout(runtime.mutationTimer);
      runtime.mutationTimer = window.setTimeout(() => {
        [...pendingRoots].forEach((root) => {
          hideFeedAds(root);
          hideEmptyPostAdBlocks(root);
          processArticles(root);
          improveImages(root);
        });
        pendingRoots.clear();
        applyFilters();
      }, 80);
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  function hideFeedAds(root = document) {
    if (!isFeedPage()) return;
    const candidates = [];
    if (root instanceof Element && root.classList.contains('code-block')) candidates.push(root);
    root.querySelectorAll?.('.code-block').forEach((element) => candidates.push(element));
    candidates.forEach((element) => {
      if ([...element.classList].some((name) => /^code-block-\d+$/.test(name))) element.remove();
    });
  }

  function hideEmptyPostAdBlocks(root = document) {
    if (!document.body.classList.contains('single')) return;
    const candidates = [];
    if (root instanceof Element && root.classList.contains('code-block')) candidates.push(root);
    root.querySelectorAll?.('.code-block').forEach((element) => candidates.push(element));
    candidates.forEach((element) => {
      const hasContent = cleanText(element.textContent) || element.querySelector('img, video, iframe, a[href], form, button');
      if (!hasContent) element.remove();
    });
  }

  function setDrawerTriggerState(mode, expanded) {
    document.querySelectorAll('[aria-controls="mop-drawer"]').forEach((trigger) => {
      const matches = trigger.dataset.mopAction === mode || (mode === 'settings' && trigger.dataset.mopAction === 'settings');
      trigger.setAttribute('aria-expanded', String(Boolean(expanded && matches)));
    });
  }

  function setPageInert(enabled) {
    const scrim = document.getElementById('mop-scrim');
    if (enabled) {
      runtime.inertedElements = [...document.body.children]
        .filter((element) => element !== scrim && element.id !== 'mop-toast-stack')
        .map((element) => ({ element, wasInert: element.inert }));
      runtime.inertedElements.forEach(({ element }) => { element.inert = true; });
      return;
    }
    runtime.inertedElements.forEach(({ element, wasInert }) => { element.inert = wasInert; });
    runtime.inertedElements = [];
  }

  function getFocusableElements(root) {
    if (!root) return [];
    return [...root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hidden && element.getClientRects().length > 0);
  }

  async function copyCurrentLink() {
    const url = runtime.postUrl || normalizeUrl(location.href);
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch {
      const input = document.createElement('textarea');
      input.value = url;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.append(input);
      input.select();
      const copied = document.execCommand('copy');
      input.remove();
      toast(copied ? 'Link copied' : 'Could not copy the link');
    }
  }

  function storeScrollPosition() {
    if (!state.restoreScroll) return;
    try {
      sessionStorage.setItem(scrollKey(), String(Math.round(window.scrollY)));
    } catch {
      // Ignore unavailable session storage.
    }
  }

  function restoreScrollPosition() {
    if (!state.restoreScroll || location.hash) {
      if (location.hash === '#mop-saved' && isFeedPage()) setFilter('saved');
      return;
    }
    try {
      const value = Number(sessionStorage.getItem(scrollKey()) || '0');
      if (value > 80) requestAnimationFrame(() => window.scrollTo(0, value));
    } catch {
      // Ignore unavailable session storage.
    }
  }

  function scrollKey() {
    return `${STORE_KEY}:scroll:${location.pathname}${location.search}`;
  }

  function registerMenuCommands() {
    if (typeof GM_registerMenuCommand !== 'function') return;
    GM_registerMenuCommand('Open Modern UI settings', () => openDrawer('settings'));
    GM_registerMenuCommand('Toggle thumbnail blur', () => {
      toggleSetting('blurMedia');
      syncAllArticles();
    });
    GM_registerMenuCommand('Show saved posts', () => {
      if (isFeedPage()) setFilter('saved');
      else location.href = siteHome() + '#mop-saved';
    });
  }

  function brandImageMarkup() {
    const source = document.querySelector('.custom-logo, .bloglo-logo img, #masthead img')?.src;
    return source ? `<img src="${escapeAttribute(source)}" alt="" decoding="async">` : '<span aria-hidden="true">M</span>';
  }

  function filterChip(value, label) {
    return `<button class="mop-chip" type="button" data-mop-action="set-filter" data-filter="${value}" aria-pressed="false">${label}</button>`;
  }

  function sectionTitle(text) {
    const heading = document.createElement('h3');
    heading.className = 'mop-section-title';
    heading.textContent = text;
    return heading;
  }

  function flattenMenuLinks(root) {
    return [...root.querySelectorAll('a')]
      .map((link) => ({ label: cleanText(link.textContent), href: link.href }))
      .filter((item) => item.label && item.href);
  }

  function findLinkByText(text) {
    const normalized = normalizeText(text);
    const link = [...document.querySelectorAll('#masthead a, #secondary a')].find((node) => normalizeText(node.textContent) === normalized);
    return link?.href || '';
  }

  function siteHome() {
    const home = document.querySelector('link[rel="home"]')?.href || document.querySelector('#bloglo-primary-nav .menu-item-home > a')?.href;
    return home || `${location.protocol}//${location.host}/`;
  }

  function normalizeUrl(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url, location.href);
      parsed.hash = '';
      return parsed.href;
    } catch {
      return url.split('#')[0];
    }
  }

  function isExternal(url) {
    try {
      return new URL(url, location.href).origin !== location.origin;
    } catch {
      return false;
    }
  }

  function isFeedPage() {
    const body = document.body;
    return Boolean(body && (body.classList.contains('home') || body.classList.contains('blog') || body.classList.contains('archive') || body.classList.contains('search-results')));
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase();
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function limitSet(values, limit) {
    return [...new Set(values)].slice(-limit);
  }

  function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  function toast(message, options = {}) {
    const stack = document.getElementById('mop-toast-stack');
    if (!stack) return null;
    const item = document.createElement('div');
    item.className = 'mop-toast';
    item.setAttribute('role', options.actionLabel ? 'alert' : 'status');
    const copy = document.createElement('span');
    copy.className = 'mop-toast-message';
    copy.textContent = message;
    item.append(copy);

    let timer = 0;
    const dismiss = () => {
      clearTimeout(timer);
      item.remove();
    };

    if (options.actionLabel && typeof options.onAction === 'function') {
      const action = document.createElement('button');
      action.className = 'mop-toast-action';
      action.type = 'button';
      action.textContent = options.actionLabel;
      action.addEventListener('click', () => {
        options.onAction();
        dismiss();
        toast('Restored');
      }, { once: true });
      item.append(action);
    }

    stack.append(item);
    timer = window.setTimeout(dismiss, Number(options.duration) || 4000);
    return item;
  }
})();
