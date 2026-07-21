// ==UserScript==
// @name         Manga Archive Panel + Reader Popup (MyReadingManga, Pure MRM)
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/myreadingmanga-modern-reader
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/builders/manga-reader-modernizer
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/manga-reader-modernizer/dist/myreadingmanga-modern-reader.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/manga-reader-modernizer/dist/myreadingmanga-modern-reader.user.js
// @version      5.2.43
// @description  Pure MRM userscript: archive panel, dynamic native/synthetic facet filtering with IN/OUT modes, native sort with instant search-page apply, debounced search facets, facet directory display sort, global UI makeover toggle, grid config, Komikku-style reader, and archive-matched single-post UI for MyReadingManga, with improved mobile reader ergonomics.
// @run-at       document-idle
// @match        https://myreadingmanga.info/*
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  if (!['myreadingmanga.info'].includes(location.hostname)) return;

  const STORAGE_KEY = "mrm_modern_archive_panel_v6";
  const READ_POSTS_KEY = "mrm_modern_archive_read_posts_v2";

  function getSiteStorageScope() {
    return "mrm";
  }

  function getStorageKey() {
    return `${STORAGE_KEY}:${getSiteStorageScope()}`;
  }

  function getLegacyStorageKeys() {
    return [STORAGE_KEY];
  }

  function getReadPostsKey() {
    return `${READ_POSTS_KEY}:${getSiteStorageScope()}`;
  }

  const CHIP_LIMIT_DESKTOP = 7;
  const CHIP_LIMIT_MOBILE = 5;
  const MOBILE_BREAKPOINT = 920;
  const FACET_PANEL_PAGE_SIZE = 4;
  const FACET_MODAL_PAGE_SIZE = 18;
  const NATIVE_FILTER_APPLY_DEBOUNCE_MS = 450;
  const FACET_CATALOG_CACHE_KEY = "mrm_facet_catalog_v1";
  const FACET_CATALOG_TTL_MS = 1000 * 60 * 60 * 24 * 14;

  let nativeFacetApplyTimer = 0;
  let nativeFacetApplyTarget = "";
  let archiveRefreshTimer = 0;
  let facetCatalogWarmPromise = null;
  let facetCatalogWarmNonce = "";

  const state = {
    archive: {
      q: "",
      hideRead: false,
      onlyEnglish: false,
      sort: "default",
      dock: "right",
      serverSort: "",
      termModes: {},
      facetSearch: {},
      facetPage: {},
      facetCollapsed: {},
    },
    grid: {
      desktopCols: 6,
      tabletCols: 3,
      mobileCols: 2,
      gap: 18,
      coverRatioW: 5,
      coverRatioH: 7,
    },
    ui: {
      panelOpen: false,
      activeTab: "filters",
      uiEnabled: true,
    },
    cards: [],
    cardContainer: null,
    observer: null,
    archivePerf: {
      cardSignature: "",
      renderedFacetSignature: "",
      lastSortApplied: "",
    },
    modal: {
      opener: null,
      currentHref: "",
      currentTitle: "",
      currentView: "reader",
      commentCount: 0,
    },
  };

  const domIdCache = new Map();
  const cardMetaCache = new WeakMap();
  const chipModelCache = new WeakMap();

  function debounce(fn, wait = 120) {
    let timer = 0;
    return (...args) => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = 0;
        fn(...args);
      }, wait);
    };
  }

  function rafThrottle(fn) {
    let frame = 0;
    let lastArgs = null;
    return (...args) => {
      lastArgs = args;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const nextArgs = lastArgs;
        lastArgs = null;
        fn(...(nextArgs || []));
      });
    };
  }

  function getCachedElementById(id) {
    const cached = domIdCache.get(id);
    if (cached?.isConnected) return cached;
    const next = document.getElementById(id);
    if (next) domIdCache.set(id, next);
    else domIdCache.delete(id);
    return next;
  }

  function clearCachedElementById(id) {
    domIdCache.delete(id);
  }



const facetElementCache = new Map();
const optionLabelCache = new Map();

function getFacetElement(facet) {
  if (!facet || !facet.key) return createFacetWidget(facet);
  if (facetElementCache.has(facet.key)) return facetElementCache.get(facet.key);
  const elem = createFacetWidget(facet);
  facetElementCache.set(facet.key, elem);
  return elem;
}

function getOptionLabel(option) {
  if (!option) return "";
  if (optionLabelCache.has(option.raw)) return optionLabelCache.get(option.raw);
  const label = option.label || titleCase(option.raw);
  optionLabelCache.set(option.raw, label);
  return label;
}
const DEFAULT_UI_THEME = {
    accentColor: "#7c5cff",
    borders: {
      header: true,
      cards: true,
      pagination: true,
      reader: true,
      panel: true,
      chips: true,
    },
  };

  function sanitizeHexColor(value, fallback = DEFAULT_UI_THEME.accentColor) {
    const raw = String(value || "").trim();
    if (/^#?[0-9a-fA-F]{6}$/.test(raw)) {
      return raw.startsWith("#") ? raw.toLowerCase() : `#${raw.toLowerCase()}`;
    }
    return fallback;
  }

  function ensureUiThemeState() {
    if (!state.ui || typeof state.ui !== "object") state.ui = {};
    state.ui.accentColor = sanitizeHexColor(state.ui.accentColor, DEFAULT_UI_THEME.accentColor);
    if (!state.ui.borders || typeof state.ui.borders !== "object") {
      state.ui.borders = { ...DEFAULT_UI_THEME.borders };
      return true;
    }

    let changed = false;
    for (const [key, value] of Object.entries(DEFAULT_UI_THEME.borders)) {
      if (typeof state.ui.borders[key] !== "boolean") {
        state.ui.borders[key] = value;
        changed = true;
      }
    }
    return changed;
  }

  function getAccentColor() {
    return sanitizeHexColor(state.ui.accentColor, DEFAULT_UI_THEME.accentColor);
  }

  function hasUiBorder(key) {
    ensureUiThemeState();
    return state.ui.borders[key] !== false;
  }

  function setUiBorder(key, enabled) {
    ensureUiThemeState();
    state.ui.borders[key] = Boolean(enabled);
    saveState();
    applyFlatThemeRuntime();
  }

  function resetUiThemeSettings() {
    ensureUiThemeState();
    state.ui.accentColor = DEFAULT_UI_THEME.accentColor;
    state.ui.borders = { ...DEFAULT_UI_THEME.borders };
    saveState();
    applyFlatThemeRuntime();
    renderThemePane();
  }

  function getAccentRgb(color = getAccentColor()) {
    const hex = sanitizeHexColor(color).slice(1);
    const value = Number.parseInt(hex, 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  }

  function applyFlatThemeRuntime() {
    ensureUiThemeState();

    const root = document.documentElement;
    const accent = getAccentColor();
    const { r, g, b } = getAccentRgb(accent);

    root.style.setProperty("--mrm-accent", accent);
    root.style.setProperty("--mrm-accent-rgb", `${r}, ${g}, ${b}`);
    root.style.setProperty("--mrm-bg", "#030303");
    root.style.setProperty("--mrm-bg-2", "#090909");
    root.style.setProperty("--mrm-panel", "#0c0c0c");
    root.style.setProperty("--mrm-panel-2", "#121212");
    root.style.setProperty("--mrm-soft", "#161616");
    root.style.setProperty("--mrm-soft-2", "#101010");
    root.style.setProperty("--mrm-line", "rgba(255,255,255,.10)");
    root.style.setProperty("--mrm-line-2", "rgba(255,255,255,.18)");
    root.style.setProperty("--mrm-text", "#f1f5fb");
    root.style.setProperty("--mrm-muted", "#9ca7b5");
    root.style.setProperty("--mrm-shadow", "0 10px 24px rgba(0,0,0,.28)");
    root.style.setProperty("--mrm-shadow-lg", "0 14px 34px rgba(0,0,0,.32)");
    root.style.setProperty("--mrm-reader-bg", "#030303");
    root.style.setProperty("--mrm-reader-bg-2", "#090909");
    root.style.setProperty("--mrm-reader-surface", "#0d0d0d");
    root.style.setProperty("--mrm-reader-line", "rgba(255,255,255,.10)");
    root.style.setProperty("--mrm-reader-line-strong", "rgba(255,255,255,.18)");
    root.style.setProperty("--mrm-reader-text", "#f1f5fb");
    root.style.setProperty("--mrm-reader-muted", "#9ca7b5");

    const body = document.body;
    if (body) {
      body.classList.toggle("mrm-no-border-header", !hasUiBorder("header"));
      body.classList.toggle("mrm-no-border-cards", !hasUiBorder("cards"));
      body.classList.toggle("mrm-no-border-pagination", !hasUiBorder("pagination"));
      body.classList.toggle("mrm-no-border-reader", !hasUiBorder("reader"));
      body.classList.toggle("mrm-no-border-panel", !hasUiBorder("panel"));
      body.classList.toggle("mrm-no-border-chips", !hasUiBorder("chips"));
    }

    let style = getCachedElementById("mrm-flat-theme-runtime");
    if (!style) {
      style = document.createElement("style");
      style.id = "mrm-flat-theme-runtime";
      document.head.appendChild(style);
    }

    style.textContent = `
      :root {
        --mrm-accent: ${accent} !important;
        --mrm-accent-rgb: ${r}, ${g}, ${b} !important;
        --mrm-bg: #030303 !important;
        --mrm-bg-2: #090909 !important;
        --mrm-panel: #0c0c0c !important;
        --mrm-panel-2: #121212 !important;
        --mrm-soft: #161616 !important;
        --mrm-soft-2: #101010 !important;
        --mrm-line: rgba(255,255,255,.10) !important;
        --mrm-line-2: rgba(255,255,255,.18) !important;
        --mrm-text: #f1f5fb !important;
        --mrm-muted: #9ca7b5 !important;
        --mrm-shadow: 0 10px 24px rgba(0,0,0,.28) !important;
        --mrm-shadow-lg: 0 14px 34px rgba(0,0,0,.32) !important;
        --mrm-reader-bg: #030303 !important;
        --mrm-reader-bg-2: #090909 !important;
        --mrm-reader-surface: #0d0d0d !important;
        --mrm-reader-line: rgba(255,255,255,.10) !important;
        --mrm-reader-line-strong: rgba(255,255,255,.18) !important;
        --mrm-reader-text: #f1f5fb !important;
        --mrm-reader-muted: #9ca7b5 !important;
      }

      html,
      body,
      .site-container,
      html.mrm-reader-page,
      body.mrm-reader-page,
      body.mrm-single-post-page {
        background: #030303 !important;
        color: var(--mrm-text) !important;
      }

      .nav-primary,
      .site-header,
      .search-form,
      .mrm-panel,
      .mrm-panel-toggle,
      .mrm-reader-page__topbar,
      .mrm-reader-page__dock,
      .mrm-reader-page__thumbs,
      #mrm-reader-dialog,
      .mrm-reader-title,
      .mrm-reader-page__page,
      .mrm-reader-page__hint,
      .mrm-reader-page__empty,
      .mrm-reader-page__loading,
      .mrm-facet-widget,
      .footer-widgets .widget-wrap,
      .entry,
      .post,
      article.entry,
      article.post,
      article.post-standard,
      .pagination a,
      .pagination span,
      .entry-pagination a,
      .entry-pagination span,
      .mrm-reader-page__button,
      .mrm-reader-trigger,
      .mrm-reader-close,
      .mrm-reader-fullscreen,
      .mrm-reader-open-tab,
      .mrm-reader-comments,
      .mrm-reader-back,
      .mrm-reader-prev,
      .mrm-reader-next,
      .search-form-submit,
      input.search-form-submit,
      .search-form input[type="submit"],
      .mrm-btn,
      .mrm-chip,
      .mrm-chip-overflow-button,
      .mrm-chip-overflow-count {
        backdrop-filter: none !important;
        background-image: none !important;
        box-shadow: none !important;
      }

      .site-container,
      .site-inner,
      .content,
      .full-width-content .content,
      .content-sidebar-wrap,
      .container,
      #app,
      #content {
        background: transparent !important;
      }

      .nav-primary,
      .mrm-reader-page__topbar {
        background: #080808 !important;
      }

      .site-header,
      .search-form,
      .mrm-panel,
      .mrm-facet-widget,
      .footer-widgets .widget-wrap,
      article.entry,
      article.post,
      article.post-standard,
      .mrm-reader-page__dock,
      .mrm-reader-page__thumbs,
      .mrm-reader-page__page,
      .mrm-reader-page__hint,
      .mrm-reader-page__empty,
      .mrm-reader-page__loading {
        background: #0c0c0c !important;
      }

      .search-form::before,
      .mrm-chip,
      .mrm-chip-overflow-count,
      .mrm-chip-overflow-button,
      .pagination a,
      .pagination span,
      .entry-pagination a,
      .entry-pagination span,
      .footer-widgets .tagcloud a,
      .footer-widgets .textwidget a,
      .footer-widgets .widget_nav_menu li a,
      .footer-widgets .widget_categories li a,
      .footer-widgets .widget_meta li a,
      .footer-widgets .widget_pages li a {
        background: #141414 !important;
      }

      .mrm-panel-toggle,
      .search-form-submit,
      input.search-form-submit,
      .search-form input[type="submit"],
      .mrm-btn.is-active,
      .mrm-tab.is-active,
      .mrm-selected-chip.is-include,
      .mrm-reader-page__button--primary,
      .mrm-reader-page__button.is-active,
      .mrm-reader-page__thumb.is-active,
      .entry-pagination .current,
      .pagination .current {
        background: ${accent} !important;
        border-color: transparent !important;
        color: #ffffff !important;
        outline: none !important;
      }

      .mrm-btn,
      .mrm-tab,
      .mrm-reader-page__button,
      .mrm-reader-trigger,
      .mrm-reader-close,
      .mrm-reader-fullscreen,
      .mrm-reader-open-tab,
      .mrm-reader-comments,
      .mrm-reader-back,
      .mrm-reader-prev,
      .mrm-reader-next,
      .pagination a,
      .pagination span,
      .entry-pagination a,
      .entry-pagination span,
      .genesis-nav-menu a,
      .nav-primary .menu a,
      .footer-widgets .tagcloud a,
      .footer-widgets .textwidget a,
      .footer-widgets .widget_nav_menu li a,
      .footer-widgets .widget_categories li a,
      .footer-widgets .widget_meta li a,
      .footer-widgets .widget_pages li a {
        background: #121212 !important;
        color: var(--mrm-text) !important;
      }

      .genesis-nav-menu a:hover,
      .genesis-nav-menu .current-menu-item > a,
      .nav-primary .menu a:hover,
      .nav-primary .menu .current-menu-item > a,
      .mrm-btn:hover,
      .mrm-tab:hover,
      .mrm-reader-page__button:hover,
      .pagination a:hover,
      .entry-pagination a:hover {
        background: ${accent} !important;
        border-color: transparent !important;
        color: #ffffff !important;
      }

      .mrm-reader-page__button[aria-pressed="true"],
      .mrm-reader-page__button[data-active="true"] {
        background: rgba(${r}, ${g}, ${b}, .18) !important;
        border-color: rgba(${r}, ${g}, ${b}, .72) !important;
      }

      .mrm-reader-page__page.is-active {
        outline: 1px solid rgba(${r}, ${g}, ${b}, .55) !important;
      }

      .mrm-selected-chip.is-exclude {
        background: rgba(255, 92, 143, .14) !important;
        border-color: rgba(255, 92, 143, .34) !important;
      }

      .mrm-check,
      .mrm-field input,
      .mrm-field select,
      .mrm-facet-search,
      .mrm-facet-term,
      .mrm-facet-modal,
      .mrm-facet-modal__dialog {
        background: #111111 !important;
      }

      .mrm-panel,
      .mrm-panel__head,
      .mrm-facet-widget__head,
      .mrm-facet-widget__toolbar,
      .mrm-facet-widget__footer,
      .mrm-reader-page__topbar,
      .mrm-reader-page__dock,
      .mrm-reader-page__thumbs {
        border-color: rgba(255,255,255,.10) !important;
      }

      body.mrm-no-border-header .nav-primary,
      body.mrm-no-border-header .site-header,
      body.mrm-no-border-header .mrm-reader-page__topbar,
      body.mrm-no-border-cards article.entry,
      body.mrm-no-border-cards article.post,
      body.mrm-no-border-cards article.post-standard,
      body.mrm-no-border-cards .post-thumbnail,
      body.mrm-no-border-cards .entry-image,
      body.mrm-no-border-cards .post-image,
      body.mrm-no-border-pagination .pagination a,
      body.mrm-no-border-pagination .pagination span,
      body.mrm-no-border-pagination .entry-pagination a,
      body.mrm-no-border-pagination .entry-pagination span,
      body.mrm-no-border-reader .mrm-reader-page__topbar,
      body.mrm-no-border-reader .mrm-reader-page__dock,
      body.mrm-no-border-reader .mrm-reader-page__thumbs,
      body.mrm-no-border-reader .mrm-reader-page__page,
      body.mrm-no-border-reader .mrm-reader-page__button,
      body.mrm-no-border-panel .mrm-panel,
      body.mrm-no-border-panel .mrm-panel__head,
      body.mrm-no-border-panel .mrm-facet-widget,
      body.mrm-no-border-panel .mrm-btn,
      body.mrm-no-border-panel .mrm-field input,
      body.mrm-no-border-panel .mrm-field select,
      body.mrm-no-border-chips .mrm-chip,
      body.mrm-no-border-chips .mrm-chip-overflow-button,
      body.mrm-no-border-chips .mrm-chip-overflow-count {
        border-color: transparent !important;
        outline: none !important;
      }

      .mrm-theme-section {
        display: grid;
        gap: 10px;
        margin-bottom: 14px;
        padding: 12px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 14px;
        background: #101010;
      }

      .mrm-theme-section__title {
        font-size: 12px;
        font-weight: 800;
        color: var(--mrm-text);
      }

      .mrm-theme-accent-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 8px;
        align-items: end;
      }

      .mrm-theme-swatch {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,.12);
        background: ${accent};
      }


      /* Final flat-theme cleanup overrides */
      /* Flat accent-colored pagination for archive and post pages */
      .pagination a,
      .pagination span,
      .entry-pagination a,
      .entry-pagination span {
        border: none !important;
        box-shadow: none !important;
        background: #101010 !important;
        color: var(--mrm-text) !important;
      }

      .pagination a:hover,
      .pagination span:hover,
      .entry-pagination a:hover,
      .entry-pagination span:hover,
      .pagination .current,
      .pagination span.current,
      .entry-pagination .current,
      .entry-pagination span.current {
        background: var(--mrm-accent) !important;
        color: #ffffff !important;
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
      }

      /* Remove border for specific post container */
      .post-1039994 > div:nth-child(3) > div:nth-child(2) {
        border: none !important;
        box-shadow: none !important;
      }

      /* Universal flat accent for active/selected UI elements */
      .mrm-selected-chip.is-include,
      .mrm-tab.is-active,
      .mrm-btn.is-active,
      .mrm-reader-page__button.is-active,
      .mrm-reader-page__button--primary,
      .mrm-reader-trigger.is-active,
      #menu-main li.current-menu-item > a,
      #menu-main li.current_page_item > a,
      #menu-main li.current-menu-parent > a,
      #menu-main li.current_page_parent > a,
      .pagination .current,
      .entry-pagination .current {
        background: ${accent} !important;
        border: none !important;
        box-shadow: none !important;
        color: #ffffff !important;
        outline: none !important;
      }

      #menu-main li,
      #menu-main li a,
      #menu-main li span,
      #menu-main .menu-item,
      #menu-main .menu-item > a,
      #menu-main .menu-item > span,
      #menu-main .sub-menu,
      #menu-main .sub-menu a,
      .pagination a,
      .pagination span,
      .entry-pagination a,
      .entry-pagination span,
      .mrm-reader-page__button,
      .mrm-reader-page__button::before,
      .mrm-reader-page__button::after {
        border: none !important;
        box-shadow: none !important;
      }

      #menu-main li a,
      #menu-main .menu-item > a,
      .pagination a,
      .pagination span,
      .entry-pagination a,
      .entry-pagination span,
      .mrm-reader-page__button {
        background: #101010 !important;
        color: var(--mrm-text) !important;
      }

      #menu-main li:hover > a,
      #menu-main li.current-menu-item > a,
      #menu-main li.current_page_item > a,
      #menu-main li.current-menu-parent > a,
      #menu-main li.current_page_parent > a,
      #menu-main .menu-item:hover > a,
      #menu-main .menu-item.current-menu-item > a,
      #menu-main .menu-item.current_page_item > a,
      .mrm-reader-page__button:hover,
      .mrm-reader-page__button:focus,
      .mrm-reader-page__button[aria-pressed="true"],
      .mrm-reader-page__button[data-active="true"] {
        background: ${accent} !important;
        color: #ffffff !important;
        outline: none !important;
      }

      body.mrm-no-border-pagination .pagination a,
      body.mrm-no-border-pagination .pagination span,
      body.mrm-no-border-pagination .entry-pagination a,
      body.mrm-no-border-pagination .entry-pagination span,
      body.mrm-no-border-reader .mrm-reader-page__button,
      body.mrm-no-border-header #menu-main li,
      body.mrm-no-border-header #menu-main li a,
      body.mrm-no-border-header #menu-main .menu-item,
      body.mrm-no-border-header #menu-main .menu-item > a {
        border: none !important;
        box-shadow: none !important;
      }

      .pagination a:hover,
      .pagination .current,
      .pagination span.current,
      .entry-pagination a:hover,
      .entry-pagination .current,
      .entry-pagination span.current,
      .entry-pagination > .current,
      .pagination > .current {
        background: ${accent} !important;
        color: #ffffff !important;
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
      }

      #menu-main li a:hover,
      #menu-main li a:focus,
      #menu-main li.current-menu-item > a,
      #menu-main li.current_page_item > a,
      #menu-main li.current-menu-parent > a,
      #menu-main li.current_page_parent > a,
      #menu-main .menu-item:hover > a,
      #menu-main .menu-item > a:hover,
      #menu-main .menu-item > a:focus,
      #menu-main .menu-item.current-menu-item > a,
      #menu-main .menu-item.current_page_item > a,
      #menu-main .menu-item.current-menu-parent > a,
      #menu-main .menu-item.current_page_parent > a,
      .mrm-reader-page__button:hover,
      .mrm-reader-page__button:focus,
      .mrm-reader-page__button.is-active,
      .mrm-reader-page__button--primary,
      .mrm-reader-page__button[aria-pressed="true"],
      .mrm-reader-page__button[data-active="true"],
      .mrm-reader-trigger:hover,
      .mrm-reader-trigger:focus,
      .mrm-reader-trigger.is-active,
      .mrm-reader-close:hover,
      .mrm-reader-close:focus,
      .mrm-reader-fullscreen:hover,
      .mrm-reader-fullscreen:focus,
      .mrm-reader-open-tab:hover,
      .mrm-reader-open-tab:focus,
      .mrm-reader-comments:hover,
      .mrm-reader-comments:focus,
      .mrm-reader-back:hover,
      .mrm-reader-back:focus,
      .mrm-reader-prev:hover,
      .mrm-reader-prev:focus,
      .mrm-reader-next:hover,
      .mrm-reader-next:focus {
        background: ${accent} !important;
        color: #ffffff !important;
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
      }

      .mrm-reader-trigger,
      .mrm-reader-close,
      .mrm-reader-fullscreen,
      .mrm-reader-open-tab,
      .mrm-reader-comments,
      .mrm-reader-back,
      .mrm-reader-prev,
      .mrm-reader-next {
        background: #101010 !important;
        color: var(--mrm-text) !important;
        border: none !important;
        box-shadow: none !important;
      }

      #menu-main li,
      #menu-main li::before,
      #menu-main li::after,
      #menu-main li a,
      #menu-main li a::before,
      #menu-main li a::after,
      #menu-main .menu-item,
      #menu-main .menu-item::before,
      #menu-main .menu-item::after,
      #menu-main .menu-item > a,
      #menu-main .menu-item > a::before,
      #menu-main .menu-item > a::after,
      .pagination a,
      .pagination a::before,
      .pagination a::after,
      .pagination span,
      .pagination span::before,
      .pagination span::after,
      .entry-pagination a,
      .entry-pagination a::before,
      .entry-pagination a::after,
      .entry-pagination span,
      .entry-pagination span::before,
      .entry-pagination span::after,
      .mrm-reader-page__button,
      .mrm-reader-page__button::before,
      .mrm-reader-page__button::after,
      .mrm-reader-trigger,
      .mrm-reader-trigger::before,
      .mrm-reader-trigger::after,
      .mrm-reader-close,
      .mrm-reader-close::before,
      .mrm-reader-close::after,
      .mrm-reader-fullscreen,
      .mrm-reader-fullscreen::before,
      .mrm-reader-fullscreen::after,
      .mrm-reader-open-tab,
      .mrm-reader-open-tab::before,
      .mrm-reader-open-tab::after,
      .mrm-reader-comments,
      .mrm-reader-comments::before,
      .mrm-reader-comments::after,
      .mrm-reader-back,
      .mrm-reader-back::before,
      .mrm-reader-back::after,
      .mrm-reader-prev,
      .mrm-reader-prev::before,
      .mrm-reader-prev::after,
      .mrm-reader-next,
      .mrm-reader-next::before,
      .mrm-reader-next::after {
        border: none !important;
        box-shadow: none !important;
      }    `;
  }

  const DEFAULT_HIDDEN_FACET_TERMS = {
    "synthetic:tag": ["cuntboy", "ai", "shota"],
    "native:ep_filter_post_tag": ["cuntboy", "ai", "shota"],
  };

  const READER_MODAL_IDS = {
    style: "mrm-reader-modal-style",
    overlay: "mrm-reader-overlay",
    dialog: "mrm-reader-dialog",
    frame: "mrm-reader-frame",
  };

  const READER_POPUP_PARAM = "mrm_reader_popup";
  const READER_PREFS_KEY = "mrm_reader_page_prefs_v2";
  const READER_PAYLOAD_KEY = "mrm_reader_payload_v1";


const PAGE_TYPES = Object.freeze({
  LISTING: "listing",
  POST: "post",
  READER: "reader",
  OTHER: "other",
});

let cachedPageType = null;
let cachedSinglePostPage = null;
let hasInstalledListingMessageHooks = false;



  function removeBeforeFooterWidget() {
    const nodes = document.querySelectorAll(".before-footer-widget.before-footer, .before-footer-widget, .before-footer");
    for (const node of nodes) {
      if (node instanceof HTMLElement) {
        node.remove();
      }
    }
  }

  function isReaderPopupPage() {
    try {
      return new URL(location.href).searchParams.get(READER_POPUP_PARAM) === "1";
    } catch {
      return false;
    }
  }

  function getSinglePostArticle() {
    const selectors = [
      "main article.post",
      "main article.entry",
      "main article.hentry",
      ".content article.post",
      ".content article.entry",
      ".content article.hentry",
      "article.post",
      "article.entry",
      "article.hentry",
    ];

    for (const selector of selectors) {
      const article = document.querySelector(selector);
      if (article instanceof HTMLElement) return article;
    }

    return null;
  }

  function getSinglePostContentRoot(article = getSinglePostArticle()) {
    if (!(article instanceof HTMLElement)) return null;

    const selectors = [
      ".entry-content",
      ".post-content",
      ".entry",
      ".post-inner",
      ".article-content",
      ".single-entry-content",
      ".the-content",
    ];

    for (const selector of selectors) {
      const node = article.querySelector(selector);
      if (node instanceof HTMLElement) return node;
    }

    return article;
  }

  function getSinglePostTitle(article = getSinglePostArticle()) {
    const scope = article instanceof HTMLElement ? article : document;
    return (
      scope.querySelector(".entry-title")?.textContent?.trim() ||
      scope.querySelector(".post-title")?.textContent?.trim() ||
      scope.querySelector("h1")?.textContent?.trim() ||
      document.title.replace(/\s*[\|\-].*$/, "").trim() ||
      "Reader"
    );
  }

  function hasSinglePostBodyClass() {
    const body = document.body;
    if (!body) return false;

    if (
      body.classList.contains("single") ||
      body.classList.contains("single-post") ||
      body.classList.contains("post-template-default")
    ) {
      return true;
    }

    return Array.from(body.classList).some((cls) => /^single($|-)/.test(cls) || /^postid-\d+$/.test(cls));
  }


function isSinglePostPage() {
  if (cachedSinglePostPage !== null) return cachedSinglePostPage;
  if (document.querySelector(".content-archive")) {
    cachedSinglePostPage = false;
    return cachedSinglePostPage;
  }

  const article = getSinglePostArticle();
  const content = getSinglePostContentRoot(article);

  if (hasSinglePostBodyClass()) {
    cachedSinglePostPage = true;
    return cachedSinglePostPage;
  }

  if (!(article instanceof HTMLElement) || !(content instanceof HTMLElement)) {
    cachedSinglePostPage = false;
    return cachedSinglePostPage;
  }

  const commentArea = document.querySelector("#comments, #commentform, .comments-area, .comment-respond");
  const taxonomyArea = article.querySelector(".entry-categories, .entry-tags, .post-tags, .cat-links, .tags-links");
  const primaryReaderImages = content.querySelectorAll("img.img-myreadingmanga").length;
  const imageCount = content.querySelectorAll("img").length;
  const paragraphCount = content.querySelectorAll("p").length;

  cachedSinglePostPage = Boolean(commentArea || taxonomyArea || primaryReaderImages >= 2 || imageCount >= 4 || paragraphCount >= 3);
  return cachedSinglePostPage;
}

function detectPageType() {
  if (cachedPageType) return cachedPageType;

  if (isReaderPopupPage()) {
    cachedPageType = PAGE_TYPES.READER;
    return cachedPageType;
  }

  if (document.querySelector(".content-archive")) {
    cachedSinglePostPage = false;
    cachedPageType = PAGE_TYPES.LISTING;
    return cachedPageType;
  }

  cachedPageType = isSinglePostPage() ? PAGE_TYPES.POST : PAGE_TYPES.LISTING;
  return cachedPageType;
}

function shouldRunArchiveMode() {
  return detectPageType() === PAGE_TYPES.LISTING;
}

function cleanupSinglePostLayoutArtifacts() {
  document.querySelectorAll(".mrm-results-grid").forEach((node) => node.classList.remove("mrm-results-grid"));
  document.querySelectorAll(".mrm-hidden-card, .mrm-read").forEach((node) => {
    node.classList.remove("mrm-hidden-card");
  });
  getCachedElementById("mrm-panel")?.remove();
  getCachedElementById("mrm-panel-toggle")?.remove();
  state.cardContainer = null;
  state.cards = [];
}

function getDefaultReaderPrefs() {
  return {
    widthMode: "comfort",
    fitMode: "width",
    viewMode: "strip-gaps",
    direction: "ltr",
    thumbsCollapsed: true,
  };
}

function sanitizeReaderPrefs(value) {
  const defaults = getDefaultReaderPrefs();
  const source = value && typeof value === "object" ? value : {};
  const legacyViewMode = source.flowMode === "paged" ? "paged" : defaults.viewMode;
  const viewMode = ["strip", "strip-gaps", "paged"].includes(source.viewMode) ? source.viewMode : legacyViewMode;

  return {
    widthMode: source.widthMode === "wide" ? "wide" : defaults.widthMode,
    fitMode: source.fitMode === "height" ? "height" : defaults.fitMode,
    viewMode,
    direction: source.direction === "rtl" ? "rtl" : defaults.direction,
    thumbsCollapsed: source.thumbsCollapsed === undefined ? defaults.thumbsCollapsed : Boolean(source.thumbsCollapsed),
  };
}

function loadReaderPrefs() {
  try {
    return sanitizeReaderPrefs(JSON.parse(localStorage.getItem(READER_PREFS_KEY) || "{}"));
  } catch {
    return getDefaultReaderPrefs();
  }
}

function saveReaderPrefs(prefs) {
  localStorage.setItem(READER_PREFS_KEY, JSON.stringify(sanitizeReaderPrefs(prefs)));
}

function getReaderPayloadStorageKey(url = location.href) {
  return `${READER_PAYLOAD_KEY}:${normalizeReaderHref(url)}`;
}

function loadReaderPayload(url = location.href) {
  try {
    const raw = sessionStorage.getItem(getReaderPayloadStorageKey(url));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const images = Array.isArray(parsed.images) ? parsed.images : [];
    return {
      title: String(parsed.title || "").trim(),
      images: images
        .map((item) => ({
          src: normalizeAssetUrl(item?.src || ""),
          alt: String(item?.alt || ""),
          width: Number(item?.width || 0),
          height: Number(item?.height || 0),
        }))
        .filter((item) => item.src),
      createdAt: Number(parsed.createdAt || 0),
    };
  } catch {
    return null;
  }
}

function saveReaderPayload(url, payload) {
  if (!payload || !Array.isArray(payload.images) || !payload.images.length) return;
  try {
    sessionStorage.setItem(
      getReaderPayloadStorageKey(url),
      JSON.stringify({
        title: String(payload.title || "").trim(),
        images: payload.images.map((item) => ({
          src: normalizeAssetUrl(item?.src || ""),
          alt: String(item?.alt || ""),
          width: Number(item?.width || 0),
          height: Number(item?.height || 0),
        })).filter((item) => item.src),
        createdAt: Date.now(),
      })
    );
  } catch {}
}

function applyReaderPrefs(root, prefs, controls = {}) {
  if (!(root instanceof HTMLElement)) return;
  const next = sanitizeReaderPrefs(prefs);

  root.classList.toggle("is-wide", next.widthMode === "wide");
  root.classList.toggle("is-thumbs-collapsed", next.thumbsCollapsed);
  root.dataset.fit = next.fitMode;
  root.dataset.view = next.viewMode;
  root.dataset.flow = next.viewMode === "paged" ? "paged" : "continuous";
  root.dataset.direction = next.direction;

  if (controls.widthButton instanceof HTMLElement) {
    controls.widthButton.textContent = `Width: ${next.widthMode === "wide" ? "Wide" : "Comfort"}`;
    controls.widthButton.setAttribute("aria-pressed", String(next.widthMode === "wide"));
  }
  if (controls.fitButton instanceof HTMLElement) {
    controls.fitButton.textContent = `Fit: ${next.fitMode === "height" ? "Height" : "Width"}`;
    controls.fitButton.setAttribute("aria-pressed", String(next.fitMode === "height"));
  }
  if (controls.viewButton instanceof HTMLElement) {
    const viewLabel = next.viewMode === "strip" ? "Long Strip" : next.viewMode === "strip-gaps" ? "Long Strip + Gaps" : "Paged";
    controls.viewButton.textContent = `View: ${viewLabel}`;
    controls.viewButton.setAttribute("aria-pressed", String(next.viewMode === "paged"));
  }
  if (controls.directionButton instanceof HTMLElement) {
    controls.directionButton.textContent = `Dir: ${next.direction.toUpperCase()}`;
    controls.directionButton.setAttribute("aria-pressed", String(next.direction === "rtl"));
  }
  const thumbButtons = Array.isArray(controls.thumbnailButtons) ? controls.thumbnailButtons : [];
  for (const button of thumbButtons) {
    if (!(button instanceof HTMLElement)) continue;
    button.textContent = next.thumbsCollapsed ? "Thumbs: Show" : "Thumbs: Hide";
    button.setAttribute("aria-pressed", String(!next.thumbsCollapsed));
  }
}

function scrollReaderPageIntoView(pageNodes, index) {
  const node = pageNodes[index];
  if (!(node instanceof HTMLElement)) return;
  node.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getNearestReaderPageIndex(pageNodes) {
  if (!pageNodes.length) return 0;
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < pageNodes.length; index += 1) {
    const page = pageNodes[index];
    const rect = page.getBoundingClientRect();
    const distance = Math.abs(rect.top - 82);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function postReaderMessage(action) {
  if (window.top === window.self) return;
  window.parent.postMessage({ source: "mrm-reader-embed", action }, location.origin);
}

function toggleReaderTopbar(root, forceHidden = null) {
  if (!(root instanceof HTMLElement)) return;
  const next = typeof forceHidden === "boolean" ? forceHidden : !root.classList.contains("is-topbar-hidden");
  root.classList.toggle("is-topbar-hidden", next);
}

function bindReaderTopbarAutoHide(root, main) {
  if (!(root instanceof HTMLElement) || !(main instanceof HTMLElement)) return () => {};

  let lastY = 0;

  const getScrollTop = (eventTarget = null) => {
    if (root.dataset.view === "paged" || eventTarget === main) return main.scrollTop || 0;
    return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  };

  const onScroll = rafThrottle((event) => {
    const currentY = getScrollTop(event?.currentTarget || null);
    const delta = currentY - lastY;

    if (currentY < 28 || delta < -12) {
      root.classList.remove("is-topbar-hidden");
    } else if (delta > 18) {
      root.classList.add("is-topbar-hidden");
    }

    lastY = currentY;
  });

  main.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    main.removeEventListener("scroll", onScroll);
    window.removeEventListener("scroll", onScroll);
  };
}

function pickLargestSrcFromSrcset(srcset) {
  const entries = String(srcset || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!entries.length) return "";

  const parsed = entries
    .map((entry) => {
      const parts = entry.split(/\s+/).filter(Boolean);
      const url = parts[0] || "";
      const descriptor = parts[1] || "";
      const width = Number((descriptor.match(/(\d+)w/) || [])[1] || 0);
      const density = Number((descriptor.match(/([\d.]+)x/) || [])[1] || 0);
      return { url, score: width || density || 1 };
    })
    .filter((item) => item.url);

  parsed.sort((a, b) => a.score - b.score);
  return parsed.at(-1)?.url || parsed[0]?.url || "";
}

function normalizeAssetUrl(url) {
  try {
    return new URL(url, location.href).toString();
  } catch {
    return String(url || "").trim();
  }
}

function resolveReaderImageUrl(img) {
  if (!(img instanceof HTMLImageElement)) return "";

  const candidates = [
    img.currentSrc,
    img.getAttribute("data-full"),
    img.getAttribute("data-image"),
    img.getAttribute("data-pin-media"),
    img.getAttribute("data-lazy-src"),
    img.getAttribute("data-src"),
    img.getAttribute("data-original"),
    img.getAttribute("data-orig-file"),
    img.getAttribute("data-large-file"),
    img.getAttribute("data-medium-file"),
    img.getAttribute("data-pagespeed-lsc-url"),
    pickLargestSrcFromSrcset(img.getAttribute("data-srcset")),
    pickLargestSrcFromSrcset(img.getAttribute("data-lazy-srcset")),
    pickLargestSrcFromSrcset(img.getAttribute("srcset")),
    img.src,
  ];

  const anchorHref = img.closest("a[href]")?.getAttribute("href") || "";
  if (/\.(?:avif|gif|jpe?g|png|webp)(?:[?#]|$)/i.test(anchorHref)) {
    candidates.unshift(anchorHref);
  }

  for (const candidate of candidates) {
    const normalized = normalizeAssetUrl(candidate);
    if (!normalized || /^data:/i.test(normalized)) continue;
    if (/blank\.gif|loader|spinner|emoji|avatar|gravatar|icon/i.test(normalized)) continue;
    return normalized;
  }

  return "";
}

function shouldUseReaderImage(img, contentRoot) {
  if (!(img instanceof HTMLImageElement) || !(contentRoot instanceof HTMLElement)) return false;
  if (!contentRoot.contains(img)) return false;
  if (img.closest("header, footer, nav, aside, .sharedaddy, .jp-relatedposts, .related-posts, .comments, #comments, .comment-list, .comment-respond, .widget, .before-footer-widget, .before-footer")) {
    return false;
  }

  const url = resolveReaderImageUrl(img);
  if (!url) return false;
  if (/logo|banner|doubleclick|ads|traffic|avatar|emoji|smiley/i.test(url)) return false;
  if (img.classList.contains("emoji") || img.classList.contains("avatar") || img.classList.contains("wp-smiley")) return false;

  const width = Number(img.getAttribute("data-width") || img.getAttribute("width") || img.naturalWidth || 0);
  const height = Number(img.getAttribute("data-height") || img.getAttribute("height") || img.naturalHeight || 0);
  const ariaHidden = img.getAttribute("aria-hidden") === "true";
  const className = String(img.className || "");

  if (ariaHidden) return false;
  if (/img-myreadingmanga/.test(className)) return true;
  if (width && height && width < 140 && height < 140) return false;

  return true;
}

function mergeReaderImages(...collections) {
  const seen = new Set();
  const images = [];

  for (const collection of collections) {
    if (!Array.isArray(collection)) continue;
    for (const item of collection) {
      const src = normalizeAssetUrl(item?.src || "");
      if (!src || seen.has(src)) continue;
      seen.add(src);
      images.push({
        src,
        alt: String(item?.alt || ""),
        width: Number(item?.width || 0),
        height: Number(item?.height || 0),
      });
    }
  }

  return images;
}

function extractReaderImagesFromContent(contentRoot = getSinglePostContentRoot()) {
  if (!(contentRoot instanceof HTMLElement)) return [];

  const primaryCandidates = Array.from(contentRoot.querySelectorAll("img.img-myreadingmanga"));
  const fallbackCandidates = Array.from(contentRoot.querySelectorAll("img"));
  const candidates = primaryCandidates.length ? primaryCandidates : fallbackCandidates;
  const images = [];

  for (const img of candidates) {
    if (!shouldUseReaderImage(img, contentRoot)) continue;
    images.push({
      src: resolveReaderImageUrl(img),
      alt: img.getAttribute("alt") || "",
      width: Number(img.getAttribute("data-width") || img.getAttribute("width") || img.naturalWidth || 0),
      height: Number(img.getAttribute("data-height") || img.getAttribute("height") || img.naturalHeight || 0),
    });
  }

  return mergeReaderImages(images);
}

function collectReaderPayload(contentRoot = getSinglePostContentRoot(), title = getSinglePostTitle()) {
  return {
    title,
    images: extractReaderImagesFromContent(contentRoot),
    createdAt: Date.now(),
  };
}

function primeReaderPayloadForCurrentPage(url = location.href) {
  const contentRoot = getSinglePostContentRoot();
  if (!(contentRoot instanceof HTMLElement)) return;
  const payload = collectReaderPayload(contentRoot, getSinglePostTitle());
  if (!payload.images.length) return;
  saveReaderPayload(url, payload);
}

function waitForReaderImages(contentRoot, seedImages = []) {
  if (!(contentRoot instanceof HTMLElement)) {
    return Promise.resolve(mergeReaderImages(seedImages));
  }

  return new Promise((resolve) => {
    const start = Date.now();
    const timeoutMs = 3200;
    const settleMs = 650;
    let best = mergeReaderImages(seedImages, extractReaderImagesFromContent(contentRoot));
    let lastChangeAt = Date.now();
    let intervalId = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      observer.disconnect();
      if (intervalId) clearInterval(intervalId);
      resolve(best);
    };

    const refresh = () => {
      const next = mergeReaderImages(seedImages, extractReaderImagesFromContent(contentRoot));
      if (next.length !== best.length) {
        best = next;
        lastChangeAt = Date.now();
      }

      const elapsed = Date.now() - start;
      const settled = Date.now() - lastChangeAt >= settleMs;
      if ((best.length && settled) || elapsed >= timeoutMs) {
        finish();
      }
    };

    const observer = new MutationObserver(refresh);
    observer.observe(contentRoot, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset", "data-src", "data-srcset", "data-lazy-src", "data-lazy-srcset", "class"],
    });

    intervalId = window.setInterval(refresh, 160);
    window.addEventListener("load", refresh, { once: true });
    refresh();
  });
}

function getReaderImageStep(prefs) {
  return prefs.direction === "rtl" ? -1 : 1;
}

function cycleReaderViewMode(prefs) {
  const order = ["strip", "strip-gaps", "paged"];
  const currentIndex = order.indexOf(prefs.viewMode);
  prefs.viewMode = order[(currentIndex + 1 + order.length) % order.length];
}

function navigateReaderPages(pageNodes, prefs, step) {
  if (!pageNodes.length) return;
  if (prefs.viewMode === "paged") {
    const nextIndex = Math.max(0, Math.min(pageNodes.length - 1, getNearestReaderPageIndex(pageNodes) + step));
    scrollReaderPageIntoView(pageNodes, nextIndex);
    return;
  }

  window.scrollBy({
    top: step * Math.max(280, Math.floor(window.innerHeight * 0.82)),
    behavior: "smooth",
  });
}

function findAdjacentPostLinks() {
  const linkEntries = [
    { key: "prev", selectors: ["link[rel='prev']", "a[rel='prev']", ".nav-previous a[href]", ".previous a[href]", "a.prev[href]"] },
    { key: "next", selectors: ["link[rel='next']", "a[rel='next']", ".nav-next a[href]", ".next a[href]", "a.next[href]"] },
  ];

  const result = { prev: "", next: "" };

  for (const entry of linkEntries) {
    for (const selector of entry.selectors) {
      const node = document.querySelector(selector);
      const href = node?.getAttribute?.("href") || "";
      if (!href) continue;
      result[entry.key] = normalizeReaderHref(href);
      break;
    }
  }

  if (!result.prev || !result.next) {
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    for (const anchor of anchors) {
      const href = normalizeReaderHref(anchor.getAttribute("href") || "");
      if (!href || href === normalizeReaderHref(location.href)) continue;
      const text = (anchor.textContent || "").trim().toLowerCase();
      const className = String(anchor.className || "").toLowerCase();

      if (!result.prev && (/prev|previous|older|«|←/.test(text) || /prev|previous/.test(className))) {
        result.prev = href;
      }
      if (!result.next && (/next|newer|»|→/.test(text) || /next/.test(className))) {
        result.next = href;
      }
      if (result.prev && result.next) break;
    }
  }

  return result;
}

function setReaderNavigationButtonState(button, href) {
  if (!(button instanceof HTMLButtonElement)) return;
  button.disabled = !href && window.top === window.self;
}

function updateReaderPrefetchLinks(urls) {
  const normalized = Array.from(new Set(urls.map((url) => buildReaderPopupUrl(url)).filter(Boolean)));
  document.querySelectorAll("link[data-mrm-reader-prefetch='1']").forEach((node) => node.remove());

  for (const href of normalized.slice(0, 3)) {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    link.as = "document";
    link.setAttribute("data-mrm-reader-prefetch", "1");
    document.head.appendChild(link);
  }
}

function prefetchReaderAroundCurrent() {
  const { cards, index } = getCurrentReaderCardIndex();
  if (!cards.length || index < 0) return;

  const urls = [];
  for (const offset of [-1, 1, 2]) {
    const card = cards[index + offset];
    if (!card) continue;
    const href = getCardHref(card.article);
    if (href) urls.push(href);
  }

  updateReaderPrefetchLinks(urls);
}


function getDocumentCommentCount(rootDocument = document) {
  const parseNumericValue = (value) => {
    if (value === undefined || value === null) return null;
    const match = String(value).match(/\d+/);
    return match ? Number(match[0]) : null;
  };

  const extractFromSchemaNode = (node) => {
    if (!node || typeof node !== "object") return null;
    if (Array.isArray(node)) {
      for (const item of node) {
        const count = extractFromSchemaNode(item);
        if (count !== null) return count;
      }
      return null;
    }

    const type = Array.isArray(node["@type"]) ? node["@type"].join(" ") : String(node["@type"] || "");
    if (/article/i.test(type)) {
      const count = parseNumericValue(node.commentCount);
      if (count !== null) return count;
    }

    if (Array.isArray(node["@graph"])) {
      return extractFromSchemaNode(node["@graph"]);
    }

    for (const value of Object.values(node)) {
      const count = extractFromSchemaNode(value);
      if (count !== null) return count;
    }

    return null;
  };

  for (const script of rootDocument.querySelectorAll("script[type='application/ld+json']")) {
    const raw = script.textContent?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const count = extractFromSchemaNode(parsed);
      if (count !== null) return count;
    } catch {}
  }

  const commentLink = rootDocument.querySelector(".entry-comments-link a, a[href='#comments'], a[href$='#comments']");
  const linkCount = parseNumericValue(commentLink?.textContent || "");
  if (linkCount !== null) return linkCount;

  const commentNodes = rootDocument.querySelectorAll(
    "#comments .wpd-comment, #comments .comment, #comments article.comment, #comments li.comment, #comments .comment-body, #comments .wpd-comment-wrap"
  );
  if (commentNodes.length) return commentNodes.length;

  const commentItems = rootDocument.querySelectorAll("#comments article, #comments li, #comments .wc-comment");
  if (commentItems.length) return commentItems.length;

  return 0;
}

function getSinglePostCommentCount() {
  return getDocumentCommentCount(document);
}

function removeSinglePostInterstitialNodes(article = getSinglePostArticle()) {
  if (!(article instanceof HTMLElement)) return;

  const directAdSelectors = [
    ".after_4th_post",
    ".after-post",
    ".post-ad",
    ".entry-ad",
    ".adsbygoogle",
    ".mrm-native-ad",
    ".ad-wrapper",
    ".advertisement",
    "ins[data-zoneid]",
    "iframe[src*='ads']",
    "iframe[src*='doubleclick']",
    "iframe[src*='traffic']",
    "iframe[src*='pop']",
    "script[src*='ads']",
    "script[src*='doubleclick']",
  ];

  for (const node of article.querySelectorAll(directAdSelectors.join(","))) {
    node.remove();
  }

  const footer = article.querySelector(":scope > footer.entry-footer, :scope > .entry-footer");
  const bookmark = article.querySelector(":scope > #bottom, :scope > .bookmark, :scope > [id='bottom']");
  if (!(footer instanceof HTMLElement) || !(bookmark instanceof HTMLElement) || footer.parentElement !== bookmark.parentElement) {
    return;
  }

  let cursor = bookmark.nextSibling;
  while (cursor && cursor !== footer) {
    const next = cursor.nextSibling;
    if (cursor instanceof HTMLElement) {
      cursor.remove();
    } else if (cursor.nodeType === Node.TEXT_NODE && !cursor.textContent?.trim()) {
      cursor.remove();
    }
    cursor = next;
  }
}

function wrapSinglePostContentImages(content = getSinglePostContentRoot()) {
  if (!(content instanceof HTMLElement)) return;

  const images = Array.from(
    content.querySelectorAll(
      "img.img-myreadingmanga, img[src*='/wp-content/uploads/'], img[srcset], img[decoding='async'], img[loading='lazy']"
    )
  );

  for (const img of images) {
    if (!(img instanceof HTMLImageElement)) continue;
    if (img.closest("#comments, #respond, .yarpp-thumbnails-horizontal, .mrm-post-image-card")) continue;
    if (!content.contains(img)) continue;

    const src = img.currentSrc || img.src || "";
    const widthAttr = Number(img.getAttribute("width") || 0);
    const shouldWrap = img.classList.contains("img-myreadingmanga") || widthAttr >= 360 || /\/wp-content\/uploads\//.test(src);
    if (!shouldWrap) continue;

    const wrapper = document.createElement("div");
    wrapper.className = "mrm-post-image-card";
    img.parentNode?.insertBefore(wrapper, img);
    wrapper.appendChild(img);
  }
}

function injectSinglePostStyles() {
  if (getCachedElementById("mrm-single-post-style-v528")) return;

  const style = document.createElement("style");
  style.id = "mrm-single-post-style-v528";
  style.textContent = `
    body.mrm-single-post-page {
      background:
        radial-gradient(circle at top, rgba(124,92,255,.10), transparent 28%),
        radial-gradient(circle at 85% 10%, rgba(37,194,160,.06), transparent 18%),
        #07101a !important;
      color: #e9eef6 !important;
      font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important;
      line-height: 1.45 !important;
    }

    body.mrm-single-post-page .site-container,
    body.mrm-single-post-page .wrap,
    body.mrm-single-post-page .site-inner,
    body.mrm-single-post-page .content-sidebar-wrap,
    body.mrm-single-post-page .content,
    body.mrm-single-post-page .full-width-content .content {
      max-width: none !important;
    }

    body.mrm-single-post-page a,
    body.mrm-single-post-page a:visited {
      color: #dfe7f3 !important;
      text-decoration: none !important;
    }

    body.mrm-single-post-page a:hover {
      color: #fff !important;
      text-decoration: none !important;
    }

    body.mrm-single-post-page .nav-primary {
      position: sticky !important;
      top: 0 !important;
      z-index: 999 !important;
      background: rgba(13, 16, 22, 0.72) !important;
            border-bottom: 1px solid rgba(255,255,255,.05) !important;
      box-shadow: none !important;
    }

    body.mrm-single-post-page .nav-primary .wrap,
    body.mrm-single-post-page .site-header .wrap,
    body.mrm-single-post-page .site-inner .content-sidebar-wrap,
    body.mrm-single-post-page .site-footer .wrap {
      max-width: 1360px !important;
      margin-left: auto !important;
      margin-right: auto !important;
      padding-left: 20px !important;
      padding-right: 20px !important;
    }

    body.mrm-single-post-page .genesis-nav-menu,
    body.mrm-single-post-page .nav-primary .menu {
      display: flex !important;
      flex-wrap: nowrap !important;
      align-items: center !important;
      gap: 10px !important;
      padding: 14px 0 !important;
      margin: 0 !important;
      white-space: nowrap !important;
      overflow-x: auto !important;
      scrollbar-width: none !important;
      text-transform: none !important;
    }

    body.mrm-single-post-page .genesis-nav-menu::-webkit-scrollbar,
    body.mrm-single-post-page .nav-primary .menu::-webkit-scrollbar {
      display: none !important;
    }

    body.mrm-single-post-page .genesis-nav-menu > li,
    body.mrm-single-post-page .nav-primary .menu > li {
      float: none !important;
      display: inline-flex !important;
      align-items: center !important;
      margin: 0 !important;
    }

    body.mrm-single-post-page .genesis-nav-menu a,
    body.mrm-single-post-page .nav-primary .menu a {
      min-height: 40px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 14px !important;
      border-radius: 999px !important;
            background: rgba(255,255,255,.03) !important;
      color: #dbe4f2 !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      letter-spacing: .01em !important;
      text-transform: none !important;
    }

    body.mrm-single-post-page .genesis-nav-menu a:hover,
    body.mrm-single-post-page .genesis-nav-menu .current-menu-item > a,
    body.mrm-single-post-page .nav-primary .menu a:hover,
    body.mrm-single-post-page .nav-primary .menu .current-menu-item > a {
      background: rgba(124,92,255,.16) !important;
      border-color: rgba(124,92,255,.45) !important;
    }

    body.mrm-single-post-page .site-header {
      background: transparent !important;
      border: 0 !important;
      padding: 22px 0 8px !important;
    }

    body.mrm-single-post-page .site-header .wrap {
      display: grid !important;
      grid-template-columns: 1fr !important;
      gap: 16px !important;
      align-items: stretch !important;
    }

    body.mrm-single-post-page .search-form,
    body.mrm-single-post-page .site-header .search-form,
    body.mrm-single-post-page form.search-form {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      min-height: 72px !important;
      padding: 10px !important;
      width: 100% !important;
      max-width: none !important;
      margin: 12px 0 0 !important;
      background: rgba(13, 20, 33, 0.88) !important;
            border-radius: 20px !important;
            overflow: hidden !important;
    }

    body.mrm-single-post-page .search-form::before {
      content: "⌕" !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 40px !important;
      height: 40px !important;
      border-radius: 12px !important;
      background: rgba(255,255,255,.04) !important;
      color: #98a5b8 !important;
      font-size: 20px !important;
      flex: 0 0 auto !important;
    }

    body.mrm-single-post-page .search-form-input,
    body.mrm-single-post-page input.search-form-input,
    body.mrm-single-post-page .search-form input[type="search"] {
      flex: 1 1 auto !important;
      width: auto !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 4px !important;
      background: transparent !important;
      border: 0 !important;
      color: #e9eef6 !important;
      box-shadow: none !important;
      font-size: 15px !important;
    }

    body.mrm-single-post-page .search-form-input::placeholder,
    body.mrm-single-post-page .search-form input[type="search"]::placeholder {
      color: #98a5b8 !important;
      opacity: 1 !important;
    }

    body.mrm-single-post-page .search-form-submit,
    body.mrm-single-post-page input.search-form-submit,
    body.mrm-single-post-page .search-form input[type="submit"] {
      display: inline-flex !important;
      flex: 0 0 auto !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 48px !important;
      width: auto !important;
      margin: 0 !important;
      padding: 0 18px !important;
      border: 0 !important;
      border-radius: 14px !important;
            color: #fff !important;
      font-size: 14px !important;
      font-weight: 800 !important;
      cursor: pointer !important;
      box-shadow: 0 10px 24px rgba(124,92,255,.28) !important;
      clip: auto !important;
      height: auto !important;
      position: static !important;
    }

    body.mrm-single-post-page .site-inner {
      padding-top: 10px !important;
      padding-bottom: 36px !important;
      background: transparent !important;
      box-shadow: none !important;
      border-top: 0 !important;
      margin-top: 0 !important;
    }

    body.mrm-single-post-page .content-sidebar-wrap {
      max-width: 1360px !important;
      margin: 0 auto !important;
    }

    body.mrm-single-post-page .breadcrumb {
      max-width: 1100px !important;
      margin: 0 auto 14px !important;
      padding: 0 !important;
      background: transparent !important;
      border: 0 !important;
      color: #98a5b8 !important;
      font-size: 13px !important;
    }

    body.mrm-single-post-page main.content,
    body.mrm-single-post-page .content {
      float: none !important;
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    body.mrm-single-post-page article.entry,
    body.mrm-single-post-page article.post,
    body.mrm-single-post-page article.hentry {
      max-width: 1100px !important;
      margin: 0 auto !important;
      padding: 0 !important;
      border-radius: 24px !important;
                        overflow: hidden !important;
    }

    body.mrm-single-post-page article.entry > .mrm-chip-row-wrap,
    body.mrm-single-post-page article.post > .mrm-chip-row-wrap {
      padding: 18px 18px 0 !important;
      margin: 0 !important;
    }

    body.mrm-single-post-page article.entry > .mrm-chip-row-wrap .mrm-tag-row,
    body.mrm-single-post-page article.post > .mrm-chip-row-wrap .mrm-tag-row {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
      min-height: 28px !important;
    }

    body.mrm-single-post-page article.entry > .mrm-chip-row-wrap .mrm-chip,
    body.mrm-single-post-page article.post > .mrm-chip-row-wrap .mrm-chip {
      display: inline-flex !important;
      align-items: center !important;
      min-height: 28px !important;
      padding: 0 12px !important;
      border-radius: 999px !important;
            background: rgba(255,255,255,.05) !important;
      color: #dbe4f2 !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      line-height: 1 !important;
      white-space: nowrap !important;
    }

    body.mrm-single-post-page article.entry > .mrm-chip-row-wrap .mrm-chip--lang,
    body.mrm-single-post-page article.post > .mrm-chip-row-wrap .mrm-chip--lang {
      background: rgba(37,194,160,.14) !important;
    }

    body.mrm-single-post-page article.entry > .mrm-chip-row-wrap .mrm-chip--category,
    body.mrm-single-post-page article.post > .mrm-chip-row-wrap .mrm-chip--category {
      background: rgba(124,92,255,.14) !important;
    }

    body.mrm-single-post-page .entry-header {
      display: grid !important;
      gap: 16px !important;
      padding: 18px 18px 0 !important;
    }

    body.mrm-single-post-page .entry-title {
      min-height: 0 !important;
      margin: 0 !important;
      color: #fff !important;
      font-size: clamp(28px, 4vw, 40px) !important;
      line-height: 1.12 !important;
      font-weight: 800 !important;
      text-align: left !important;
      text-wrap: balance !important;
    }

    body.mrm-single-post-page .entry-header .entry-meta,
    body.mrm-single-post-page .entry-meta {
      margin: 0 !important;
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 12px 18px !important;
      align-items: center !important;
      color: #98a5b8 !important;
      font-size: 14px !important;
      border: 0 !important;
      padding: 0 !important;
    }

    body.mrm-single-post-page .entry-meta a {
      color: #cfe2ff !important;
    }

    body.mrm-single-post-page .entry-comments-link::before {
      content: "" !important;
      margin: 0 !important;
    }

    body.mrm-single-post-page .mrm-post-toolbar {
      display: flex !important;
      flex-wrap: wrap !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 10px !important;
      padding-bottom: 6px !important;
    }

    body.mrm-single-post-page .mrm-post-toolbar-left,
    body.mrm-single-post-page .mrm-post-toolbar-right {
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: center !important;
      gap: 10px !important;
    }

    body.mrm-single-post-page .mrm-btn {
      appearance: none !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 34px !important;
      width: auto !important;
      min-width: 0 !important;
      flex: 0 0 auto !important;
      white-space: nowrap !important;
      padding: 0 11px !important;
            border-radius: 999px !important;
            color: #fff !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      line-height: 1 !important;
      cursor: pointer !important;
            text-decoration: none !important;
    }

    body.mrm-single-post-page .mrm-btn:hover {
      transform: translateY(-1px) !important;
      text-decoration: none !important;
    }

    body.mrm-single-post-page .mrm-btn--primary {
            border-color: rgba(124,92,255,.45) !important;
      box-shadow: 0 12px 26px rgba(124,92,255,.28) !important;
    }

    body.mrm-single-post-page .mrm-btn--comments::after {
      content: attr(data-count) !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 22px !important;
      height: 22px !important;
      margin-left: 8px !important;
      padding: 0 7px !important;
      border-radius: 999px !important;
      background: rgba(255,255,255,.18) !important;
      color: #fff !important;
      font-size: 12px !important;
      font-weight: 800 !important;
    }

    body.mrm-single-post-page .entry-content {
      display: grid !important;
      gap: 14px !important;
      padding: 18px !important;
    }

    body.mrm-single-post-page .entry-content > p {
      margin: 0 !important;
      color: #dbe4f2 !important;
      font-size: 15px !important;
      line-height: 1.65 !important;
      padding: 0 !important;
    }

    body.mrm-single-post-page .mrm-post-image-card {
      overflow: hidden !important;
      border-radius: 18px !important;
            background: rgba(255,255,255,.03) !important;
          }

    body.mrm-single-post-page .entry-content img.img-myreadingmanga,
    body.mrm-single-post-page .entry-content .mrm-post-image-card > img {
      display: block !important;
      width: 100% !important;
      height: auto !important;
      margin: 0 auto !important;
      background: #101826 !important;
      max-width: 100% !important;
    }

    body.mrm-single-post-page .entry-pagination,
    body.mrm-single-post-page .pagination {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      flex-wrap: wrap !important;
      gap: 10px !important;
      padding: 6px 18px 18px !important;
      margin: 0 !important;
      width: 100% !important;
      clear: both !important;
    }

    body.mrm-single-post-page .entry-pagination a,
    body.mrm-single-post-page .entry-pagination span,
    body.mrm-single-post-page .pagination a,
    body.mrm-single-post-page .pagination span {
      min-width: 42px !important;
      height: 42px !important;
      padding: 0 14px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 12px !important;
      background: rgba(255,255,255,.035) !important;
            color: #e9eef6 !important;
      text-decoration: none !important;
      font-weight: 700 !important;
    }

    body.mrm-single-post-page .entry-pagination .current,
    body.mrm-single-post-page .pagination .current {
            border-color: rgba(124,92,255,.55) !important;
    }

    body.mrm-single-post-page .bookmark,
    body.mrm-single-post-page #bottom {
      display: block !important;
      width: 100% !important;
      height: 1px !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    body.mrm-single-post-page .entry-footer {
      display: grid !important;
      gap: 16px !important;
      padding: 18px !important;
      border-top: 1px solid rgba(255,255,255,.08) !important;
          }

    body.mrm-single-post-page .entry-footer .entry-meta {
      display: grid !important;
      gap: 12px !important;
      color: #98a5b8 !important;
      font-size: 14px !important;
      border: 0 !important;
      padding: 0 !important;
    }

    body.mrm-single-post-page .entry-categories,
    body.mrm-single-post-page .entry-terms,
    body.mrm-single-post-page .entry-tags {
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: center !important;
      gap: 8px !important;
      margin: 0 !important;
      line-height: 1.7 !important;
    }

    body.mrm-single-post-page .meta-label {
      color: #fff !important;
      font-weight: 700 !important;
      font-size: 12px !important;
      letter-spacing: .02em !important;
      min-width: 0 !important;
      padding-right: 0 !important;
      margin-right: 4px !important;
    }

    body.mrm-single-post-page .entry-categories a,
    body.mrm-single-post-page .entry-terms a,
    body.mrm-single-post-page .entry-tags a {
      display: inline-flex !important;
      align-items: center !important;
      min-height: 30px !important;
      padding: 0 10px !important;
      border-radius: 999px !important;
            background: rgba(255,255,255,.03) !important;
      color: #dbe4f2 !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      margin: 0 !important;
    }

    body.mrm-single-post-page .yarpp-thumbnails-horizontal {
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      gap: 16px !important;
      margin: 0 !important;
      padding: 0 !important;
      justify-content: stretch !important;
    }

    body.mrm-single-post-page .yarpp-thumbnails-horizontal .yarpp-thumbnail {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      width: auto !important;
      min-width: 0 !important;
      border-radius: 18px !important;
                        overflow: hidden !important;
    }

    body.mrm-single-post-page .yarpp-thumbnails-horizontal .yarpp-thumbnail img {
      display: block !important;
      width: 100% !important;
      aspect-ratio: 5 / 7 !important;
      object-fit: cover !important;
      background: rgba(255,255,255,.03) !important;
    }

    body.mrm-single-post-page .yarpp-thumbnail-title {
      margin: 0 !important;
      padding: 12px !important;
      color: #eef3fb !important;
      font-size: 14px !important;
      line-height: 1.4 !important;
      font-weight: 700 !important;
      text-align: left !important;
      max-width: none !important;
    }

    body.mrm-single-post-page #comments,
    body.mrm-single-post-page #respond {
      max-width: 1100px !important;
      margin: 20px auto 0 !important;
      border-radius: 24px !important;
                        overflow: hidden !important;
      color: #e9eef6 !important;
    }

    body.mrm-single-post-page #wpdcom {
      max-width: none !important;
      margin: 0 !important;
      padding: 18px !important;
    }

    body.mrm-single-post-page .comments-area > h3,
    body.mrm-single-post-page #reply-title,
    body.mrm-single-post-page .wpd-thread-head {
      color: #fff !important;
    }

    body.mrm-single-post-page .before-footer-widget,
    body.mrm-single-post-page .before-footer,
    body.mrm-single-post-page .mrm-native-ad,
    body.mrm-single-post-page .mrm-ad-slot,
    body.mrm-single-post-page .after_4th_post,
    body.mrm-single-post-page .top_page,
    body.mrm-single-post-page .widget_custom_html,
    body.mrm-single-post-page ins[data-zoneid],
    body.mrm-single-post-page iframe[src*='doubleclick'],
    body.mrm-single-post-page iframe[src*='ads'],
    body.mrm-single-post-page iframe[src*='traffic'],
    body.mrm-single-post-page iframe[src*='pop'],
    body.mrm-single-post-page [class*='ad-'],
    body.mrm-single-post-page [class*='ads-'],
    body.mrm-single-post-page [id*='ad-'],
    body.mrm-single-post-page [id*='ads-'] {
      display: none !important;
    }

    body.mrm-single-post-page .site-footer {
      margin-top: 28px !important;
      background: #0b121d !important;
      border-top: 1px solid rgba(255,255,255,.06) !important;
      box-shadow: none !important;
      padding: 0 !important;
    }

    body.mrm-single-post-page .site-footer .wrap {
      padding-top: 26px !important;
      padding-bottom: 36px !important;
      color: #98a5b8 !important;
      text-align: center !important;
      font-size: 13px !important;
      line-height: 1.6 !important;
    }

    @media (max-width: 1100px) {
      body.mrm-single-post-page .yarpp-thumbnails-horizontal {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    @media (max-width: 720px) {
      body.mrm-single-post-page .nav-primary .wrap,
      body.mrm-single-post-page .site-header .wrap,
      body.mrm-single-post-page .site-inner .content-sidebar-wrap,
      body.mrm-single-post-page .site-footer .wrap {
        padding-left: 12px !important;
        padding-right: 12px !important;
      }

      body.mrm-single-post-page .entry-header,
      body.mrm-single-post-page .entry-content,
      body.mrm-single-post-page .entry-footer,
      body.mrm-single-post-page article.entry > .mrm-chip-row-wrap,
      body.mrm-single-post-page article.post > .mrm-chip-row-wrap,
      body.mrm-single-post-page .entry-pagination,
      body.mrm-single-post-page .pagination,
      body.mrm-single-post-page #wpdcom {
        padding-left: 12px !important;
        padding-right: 12px !important;
      }

      body.mrm-single-post-page .yarpp-thumbnails-horizontal {
        grid-template-columns: 1fr !important;
      }

      body.mrm-single-post-page .entry-title {
        font-size: 26px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function injectSinglePostReaderEntryButton() {
  if (!isSinglePostPage() || isReaderPopupPage()) return;

  const article = getSinglePostArticle();
  const content = getSinglePostContentRoot(article);
  const header = article?.querySelector(":scope > .entry-header, .entry-header") || article;
  if (!(article instanceof HTMLElement) || !(content instanceof HTMLElement) || !(header instanceof HTMLElement)) return;

  document.body.classList.add("mrm-single-post-page");

  injectSinglePostStyles();
  removeBeforeFooterWidget();
  hideAds();
  removeSinglePostInterstitialNodes(article);
  wrapSinglePostContentImages(content);
  injectCardChips(article, extractCardMeta(article));

  let toolbar = header.querySelector(":scope > .mrm-post-toolbar");
  if (!(toolbar instanceof HTMLElement)) {
    toolbar = document.createElement("div");
    toolbar.className = "mrm-post-toolbar";

    const left = document.createElement("div");
    left.className = "mrm-post-toolbar-left";

    const right = document.createElement("div");
    right.className = "mrm-post-toolbar-right";

    toolbar.append(left, right);
    header.appendChild(toolbar);
  }

  let left = toolbar.querySelector(".mrm-post-toolbar-left");
  if (!(left instanceof HTMLElement)) {
    left = document.createElement("div");
    left.className = "mrm-post-toolbar-left";
    toolbar.prepend(left);
  }

  let readerButton = toolbar.querySelector("#mrm-open-reader-page");
  if (!(readerButton instanceof HTMLButtonElement)) {
    readerButton = document.createElement("button");
    readerButton.type = "button";
    readerButton.id = "mrm-open-reader-page";
    readerButton.className = "mrm-btn mrm-btn--primary mrm-reader-trigger";
    readerButton.textContent = "Reader Mode";
    readerButton.addEventListener("click", () => {
      primeReaderPayloadForCurrentPage(location.href);
      location.href = buildReaderPopupUrl(location.href);
    });
    left.appendChild(readerButton);
  }

  const commentCount = getSinglePostCommentCount();
  const commentsRoot =
    getCachedElementById("comments") ||
    document.querySelector(".comments-area, #commentform, .comment-respond, #respond");

  let commentsButton = toolbar.querySelector("#mrm-jump-comments");
  if (!(commentsButton instanceof HTMLAnchorElement)) {
    commentsButton = document.createElement("a");
    commentsButton.id = "mrm-jump-comments";
    commentsButton.className = "mrm-btn mrm-btn--comments";
    commentsButton.href = "#comments";
    commentsButton.textContent = "Comments";
    commentsButton.addEventListener("click", (event) => {
      event.preventDefault();
      commentsRoot?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    left.appendChild(commentsButton);
  }

  commentsButton.setAttribute("data-count", String(commentCount));
  commentsButton.setAttribute("aria-label", `Jump to comments (${commentCount})`);

  const entryCommentsLink = article.querySelector(".entry-comments-link a");
  if (entryCommentsLink instanceof HTMLAnchorElement) {
    entryCommentsLink.addEventListener("click", (event) => {
      if (!commentsRoot) return;
      event.preventDefault();
      commentsRoot.scrollIntoView({ behavior: "smooth", block: "start" });
    }, { passive: false });
  }

  commentsRoot?.setAttribute("data-comment-count", String(commentCount));

  if (!document.body.dataset.mrmSinglePostObserved) {
    const observer = new MutationObserver(() => {
      removeBeforeFooterWidget();
      hideAds();
      removeSinglePostInterstitialNodes(article);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.body.dataset.mrmSinglePostObserved = "1";
  }
}

function injectReaderPageStyles() {
  if (getCachedElementById("mrm-reader-page-style")) return;

  const style = document.createElement("style");
  style.id = "mrm-reader-page-style";
  style.textContent = `
    :root {
      --mrm-reader-bg: #070d17;
      --mrm-reader-bg-2: rgba(9, 14, 24, 0.92);
      --mrm-reader-surface: rgba(17, 24, 39, 0.88);
      --mrm-reader-line: rgba(255,255,255,0.10);
      --mrm-reader-line-strong: rgba(255,255,255,0.18);
      --mrm-reader-text: #eef3fb;
      --mrm-reader-muted: #95a4bc;
      --mrm-reader-width: min(1120px, calc(100vw - 28px));
      --mrm-reader-page-height: calc(100vh - 154px);
      --mrm-reader-dock-height: 78px;
      --mrm-reader-thumbs-height: 176px;
    }

    html.mrm-reader-page,
    body.mrm-reader-page {
      margin: 0 !important;
      padding: 0 !important;
      min-height: 100% !important;
      background:
        radial-gradient(circle at top, rgba(124,92,255,.12), transparent 28%),
        radial-gradient(circle at 82% 12%, rgba(37,194,160,.08), transparent 20%),
        var(--mrm-reader-bg) !important;
      color: var(--mrm-reader-text) !important;
      overflow-y: auto !important;
    }

    body.mrm-reader-page {
      font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important;
    }

    #mrm-reader-page {
      min-height: 100vh;
    }

    #mrm-reader-page.is-wide {
      --mrm-reader-width: min(1480px, calc(100vw - 18px));
    }

    .mrm-reader-page__topbar {
      position: sticky;
      top: 0;
      z-index: 30;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
            background: rgba(7, 13, 23, 0.78);
      border-bottom: 1px solid var(--mrm-reader-line);
      transition: transform .18s ease, opacity .18s ease;
    }

    #mrm-reader-page.is-topbar-hidden .mrm-reader-page__topbar {
      transform: translateY(calc(-100% - 12px));
      opacity: 0;
      pointer-events: none;
    }

    .mrm-reader-page__title {
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .mrm-reader-page__title-text {
      font-size: 14px;
      font-weight: 800;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mrm-reader-page__progress {
      color: var(--mrm-reader-muted);
      font-size: 12px;
      font-weight: 600;
    }

    .mrm-reader-page__toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .mrm-reader-page__button {
      appearance: none;
      min-width: 40px;
      height: 40px;
      padding: 0 14px;
      border: 1px solid var(--mrm-reader-line);
      border-radius: 999px;
      background: rgba(11, 18, 29, 0.88);
      color: var(--mrm-reader-text);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }

    .mrm-reader-page__button[disabled] {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    .mrm-reader-page__button--comments::after {
      content: attr(data-count);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      margin-left: 8px;
      padding: 0 6px;
      border-radius: 999px;
      background: rgba(255,255,255,.14);
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      line-height: 1;
    }

    .mrm-reader-page__main {
      width: 100%;
      box-sizing: border-box;
      padding: 18px 14px calc(var(--mrm-reader-dock-height) + 42px);
    }

    #mrm-reader-page:not(.is-thumbs-collapsed) .mrm-reader-page__main {
      padding-bottom: calc(var(--mrm-reader-dock-height) + var(--mrm-reader-thumbs-height) + 64px);
    }

    .mrm-reader-page__stack {
      width: var(--mrm-reader-width);
      max-width: 100%;
      margin: 0 auto;
      display: grid;
      gap: 18px;
    }

    #mrm-reader-page[data-view="strip"] .mrm-reader-page__stack {
      gap: 0;
    }

    #mrm-reader-page[data-view="strip"] .mrm-reader-page__page {
      border-radius: 0;
      border-color: transparent;
      background: transparent;
      box-shadow: none;
    }

    #mrm-reader-page[data-view="strip"] .mrm-reader-page__caption {
      display: none;
    }

    #mrm-reader-page[data-view="paged"] .mrm-reader-page__main {
      height: calc(100vh - 69px);
      overflow-y: auto;
      scroll-snap-type: y proximity;
    }

    #mrm-reader-page[data-view="paged"]:not(.is-thumbs-collapsed) .mrm-reader-page__main {
      height: calc(100vh - 69px - var(--mrm-reader-thumbs-height) - var(--mrm-reader-dock-height) - 30px);
    }

    #mrm-reader-page[data-view="paged"] .mrm-reader-page__page {
      min-height: min(calc(100vh - 140px), 1200px);
      scroll-snap-align: start;
    }

    #mrm-reader-page[data-fit="height"] .mrm-reader-page__page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 10px;
    }

    #mrm-reader-page[data-fit="height"] .mrm-reader-page__image {
      width: auto;
      max-width: 100%;
      height: auto;
      max-height: var(--mrm-reader-page-height);
      margin: 0 auto;
    }

    #mrm-reader-page[data-direction="rtl"] .mrm-reader-page__stack,
    #mrm-reader-page[data-direction="rtl"] .mrm-reader-page__caption {
      direction: rtl;
    }

    .mrm-reader-page__page {
      margin: 0;
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.06);
      background: rgba(10, 16, 28, 0.68);
      box-shadow: 0 20px 40px rgba(0,0,0,.22);
    }

    .mrm-reader-page__page.is-active {
      outline: 1px solid rgba(124,92,255,.34);
      outline-offset: 1px;
    }

    .mrm-reader-page__image {
      display: block;
      width: 100%;
      height: auto;
      margin: 0 auto;
      background: rgba(255,255,255,.02);
    }

    .mrm-reader-page__caption {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 12px 10px;
      color: var(--mrm-reader-muted);
      font-size: 12px;
      font-weight: 600;
    }

    .mrm-reader-page__hint,
    .mrm-reader-page__empty,
    .mrm-reader-page__loading {
      width: var(--mrm-reader-width);
      max-width: 100%;
      margin: 0 auto;
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 18px;
      background: rgba(11, 18, 29, 0.74);
      box-shadow: 0 18px 40px rgba(0,0,0,.22);
    }

    .mrm-reader-page__hint {
      margin-top: 18px;
      padding: 14px 16px;
      color: var(--mrm-reader-muted);
      font-size: 12px;
      font-weight: 600;
    }

    .mrm-reader-page__empty,
    .mrm-reader-page__loading {
      padding: 18px;
    }

    .mrm-reader-page__empty p,
    .mrm-reader-page__loading p {
      margin: 0 0 14px;
      color: var(--mrm-reader-text);
    }

    .mrm-reader-page__loading-bar {
      height: 12px;
      border-radius: 999px;
            background-size: 200% 100%;
      animation: mrm-reader-loading 1.15s linear infinite;
    }

    .mrm-reader-page__dock {
      position: fixed;
      left: 14px;
      right: 14px;
      bottom: 12px;
      z-index: 28;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      padding: 12px 14px;
      border: 1px solid var(--mrm-reader-line);
      border-radius: 20px;
      background: rgba(9, 15, 24, 0.88);
            box-shadow: 0 20px 48px rgba(0,0,0,.34);
    }

    .mrm-reader-page__dock-main {
      min-width: 0;
      display: grid;
      gap: 8px;
    }

    .mrm-reader-page__dock-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: var(--mrm-reader-muted);
      font-size: 12px;
      font-weight: 700;
    }

    .mrm-reader-page__range-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .mrm-reader-page__range {
      width: 100%;
      accent-color: #7c5cff;
      cursor: pointer;
    }

    .mrm-reader-page__dock-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .mrm-reader-page__page-jump {
      min-width: 54px;
      justify-content: center;
    }

    .mrm-reader-page__thumbs {
      position: fixed;
      left: 14px;
      right: 14px;
      bottom: calc(var(--mrm-reader-dock-height) + 22px);
      z-index: 27;
      display: grid;
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--mrm-reader-line);
      border-radius: 20px;
      background: rgba(9, 15, 24, 0.84);
            box-shadow: 0 20px 48px rgba(0,0,0,.28);
      transition: transform .18s ease, opacity .18s ease;
    }

    #mrm-reader-page.is-thumbs-collapsed .mrm-reader-page__thumbs {
      opacity: 0;
      transform: translateY(12px);
      pointer-events: none;
    }

    .mrm-reader-page__thumbs-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: var(--mrm-reader-muted);
      font-size: 12px;
      font-weight: 700;
    }

    .mrm-reader-page__thumbs-strip {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(84px, 96px);
      gap: 10px;
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 4px;
      scrollbar-width: thin;
      min-height: 116px;
    }

    .mrm-reader-page__thumb {
      appearance: none;
      display: grid;
      gap: 6px;
      padding: 8px;
      border: 1px solid var(--mrm-reader-line);
      border-radius: 16px;
      background: rgba(255,255,255,.03);
      color: var(--mrm-reader-text);
      cursor: pointer;
      text-align: left;
    }

    .mrm-reader-page__thumb.is-active {
      border-color: rgba(124,92,255,.55);
      background: rgba(124,92,255,.12);
      box-shadow: inset 0 0 0 1px rgba(124,92,255,.22);
    }

    .mrm-reader-page__thumb-image-wrap {
      aspect-ratio: 5 / 7;
      border-radius: 12px;
      overflow: hidden;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.05);
    }

    .mrm-reader-page__thumb img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .mrm-reader-page__thumb-label {
      color: var(--mrm-reader-muted);
      font-size: 11px;
      font-weight: 700;
      text-align: center;
    }

    .mrm-reader-page__tapzones {
      position: fixed;
      inset: 68px 0 0;
      z-index: 22;
      display: flex;
      pointer-events: none;
    }

    .mrm-reader-page__tapzone {
      appearance: none;
      border: 0;
      padding: 0;
      margin: 0;
      background: transparent;
      pointer-events: auto;
      cursor: pointer;
      opacity: 0;
    }

    .mrm-reader-page__tapzone--start,
    .mrm-reader-page__tapzone--end {
      flex: 0 0 30%;
    }

    .mrm-reader-page__tapzone--center {
      flex: 1 1 auto;
    }

    @keyframes mrm-reader-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @media (pointer:fine) and (min-width: 921px) {
      .mrm-reader-page__tapzones {
        display: none;
      }
    }

    @media (max-width: 980px) {
      :root {
        --mrm-reader-dock-height: 112px;
        --mrm-reader-thumbs-height: 152px;
      }

      .mrm-reader-page__topbar {
        flex-wrap: wrap;
      }

      .mrm-reader-page__toolbar,
      .mrm-reader-page__dock {
        width: 100%;
        margin-left: 0;
        justify-content: flex-start;
      }

      .mrm-reader-page__dock {
        grid-template-columns: 1fr;
      }

      .mrm-reader-page__button {
        min-height: 38px;
        height: auto;
        padding: 0 12px;
        font-size: 12px;
      }

      .mrm-reader-page__thumbs-strip {
        grid-auto-columns: minmax(72px, 84px);
      }
    }

    @media (max-width: 720px) {
      .mrm-reader-page__main {
        padding-left: 8px;
        padding-right: 8px;
      }

      .mrm-reader-page__dock,
      .mrm-reader-page__thumbs {
        left: 8px;
        right: 8px;
      }

      .mrm-reader-page__thumbs-head {
        flex-wrap: wrap;
      }
    }
  `;
  document.head.appendChild(style);
}

function updateReaderPageProgress(progressNode, pages, index, title) {
  if (!(progressNode instanceof HTMLElement)) return;
  const total = pages.length;
  const current = Math.max(1, Math.min(total, index + 1));
  progressNode.textContent = total ? `Page ${current} / ${total}` : "No pages found";
  document.title = total ? `${current}/${total} · ${title}` : title;
}

function renderReaderPage(root, context) {
  const { title, images, prefs, adjacent } = context;
  if (!(root instanceof HTMLElement)) return;

  root.replaceChildren();

  const topbar = document.createElement("header");
  topbar.className = "mrm-reader-page__topbar";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "mrm-reader-page__button";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => {
    if (window.top === window.self) {
      location.href = normalizeReaderHref(location.href);
      return;
    }
    postReaderMessage("close");
  });

  const titleWrap = document.createElement("div");
  titleWrap.className = "mrm-reader-page__title";

  const titleText = document.createElement("div");
  titleText.className = "mrm-reader-page__title-text";
  titleText.textContent = title;

  const progress = document.createElement("div");
  progress.className = "mrm-reader-page__progress";
  progress.textContent = images.length ? `Page 1 / ${images.length}` : "No pages found";

  titleWrap.append(titleText, progress);

  const toolbar = document.createElement("div");
  toolbar.className = "mrm-reader-page__toolbar";

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.className = "mrm-reader-page__button";
  prevButton.textContent = "Prev Post";
  prevButton.addEventListener("click", () => {
    if (window.top === window.self) {
      if (adjacent.prev) location.href = buildReaderPopupUrl(adjacent.prev);
      return;
    }
    postReaderMessage("prev");
  });

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "mrm-reader-page__button";
  nextButton.textContent = "Next Post";
  nextButton.addEventListener("click", () => {
    if (window.top === window.self) {
      if (adjacent.next) location.href = buildReaderPopupUrl(adjacent.next);
      return;
    }
    postReaderMessage("next");
  });

  const widthButton = document.createElement("button");
  widthButton.type = "button";
  widthButton.className = "mrm-reader-page__button";

  const fitButton = document.createElement("button");
  fitButton.type = "button";
  fitButton.className = "mrm-reader-page__button";

  const viewButton = document.createElement("button");
  viewButton.type = "button";
  viewButton.className = "mrm-reader-page__button";

  const directionButton = document.createElement("button");
  directionButton.type = "button";
  directionButton.className = "mrm-reader-page__button";

  const thumbsButton = document.createElement("button");
  thumbsButton.type = "button";
  thumbsButton.className = "mrm-reader-page__button";

  const fullscreenButton = document.createElement("button");
  fullscreenButton.type = "button";
  fullscreenButton.className = "mrm-reader-page__button";
  fullscreenButton.textContent = "Fullscreen";
  fullscreenButton.addEventListener("click", () => {
    if (window.top === window.self) {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
      return;
    }
    postReaderMessage("fullscreen");
  });

  const commentsButton = document.createElement("button");
  commentsButton.type = "button";
  commentsButton.className = "mrm-reader-page__button mrm-reader-page__button--comments";
  commentsButton.textContent = "Comments";
  const commentCount = getSinglePostCommentCount();
  commentsButton.dataset.count = String(commentCount);
  commentsButton.setAttribute("aria-label", `Open comments (${commentCount})`);
  commentsButton.addEventListener("click", () => {
    if (window.top === window.self) {
      try {
        const next = new URL(normalizeReaderHref(location.href), location.href);
        next.hash = "comments";
        location.href = next.toString();
        return;
      } catch {}
      location.href = `${normalizeReaderHref(location.href)}#comments`;
      return;
    }
    postReaderMessage("comments");
  });

  const originalLink = document.createElement("a");
  originalLink.className = "mrm-reader-page__button";
  originalLink.href = normalizeReaderHref(location.href);
  originalLink.target = "_blank";
  originalLink.rel = "noopener noreferrer";
  originalLink.textContent = "Open Post";

  const controls = { widthButton, fitButton, viewButton, directionButton, thumbnailButtons: [thumbsButton] };
  const commitPrefs = () => {
    applyReaderPrefs(root, prefs, controls);
    saveReaderPrefs(prefs);
  };

  widthButton.addEventListener("click", () => {
    prefs.widthMode = prefs.widthMode === "wide" ? "comfort" : "wide";
    commitPrefs();
  });

  fitButton.addEventListener("click", () => {
    prefs.fitMode = prefs.fitMode === "height" ? "width" : "height";
    commitPrefs();
  });

  viewButton.addEventListener("click", () => {
    cycleReaderViewMode(prefs);
    commitPrefs();
  });

  directionButton.addEventListener("click", () => {
    prefs.direction = prefs.direction === "rtl" ? "ltr" : "rtl";
    commitPrefs();
  });

  thumbsButton.addEventListener("click", () => {
    prefs.thumbsCollapsed = !prefs.thumbsCollapsed;
    commitPrefs();
  });

  setReaderNavigationButtonState(prevButton, adjacent.prev);
  setReaderNavigationButtonState(nextButton, adjacent.next);

  toolbar.append(
    prevButton,
    nextButton,
    widthButton,
    fitButton,
    viewButton,
    directionButton,
    thumbsButton,
    fullscreenButton,
    commentsButton,
    originalLink
  );
  topbar.append(closeButton, titleWrap, toolbar);

  const main = document.createElement("main");
  main.className = "mrm-reader-page__main";

  const pageNodes = [];
  const thumbNodes = [];

  const tapZones = document.createElement("div");
  tapZones.className = "mrm-reader-page__tapzones";

  const tapPrev = document.createElement("button");
  tapPrev.type = "button";
  tapPrev.className = "mrm-reader-page__tapzone mrm-reader-page__tapzone--start";
  tapPrev.setAttribute("aria-label", "Previous page");
  tapPrev.addEventListener("click", () => navigateReaderPages(pageNodes, prefs, -1 * getReaderImageStep(prefs)));

  const tapToggle = document.createElement("button");
  tapToggle.type = "button";
  tapToggle.className = "mrm-reader-page__tapzone mrm-reader-page__tapzone--center";
  tapToggle.setAttribute("aria-label", "Toggle top bar");
  tapToggle.addEventListener("click", () => toggleReaderTopbar(root));

  const tapNext = document.createElement("button");
  tapNext.type = "button";
  tapNext.className = "mrm-reader-page__tapzone mrm-reader-page__tapzone--end";
  tapNext.setAttribute("aria-label", "Next page");
  tapNext.addEventListener("click", () => navigateReaderPages(pageNodes, prefs, 1 * getReaderImageStep(prefs)));

  tapZones.append(tapPrev, tapToggle, tapNext);

  if (!images.length) {
    const empty = document.createElement("section");
    empty.className = "mrm-reader-page__empty";

    const copy = document.createElement("p");
    copy.textContent = "Reader mode could not find post images in the main content area on this page.";

    const fallback = document.createElement("a");
    fallback.className = "mrm-reader-page__button";
    fallback.href = normalizeReaderHref(location.href);
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";
    fallback.textContent = "Open original page";

    empty.append(copy, fallback);
    main.appendChild(empty);
    root.append(topbar, main, tapZones);
    commitPrefs();
    return;
  }

  const stack = document.createElement("div");
  stack.className = "mrm-reader-page__stack";

  images.forEach((image, index) => {
    const figure = document.createElement("figure");
    figure.className = "mrm-reader-page__page";
    figure.dataset.index = String(index);

    const img = document.createElement("img");
    img.className = "mrm-reader-page__image";
    img.src = image.src;
    img.alt = image.alt || `${title} — page ${index + 1}`;
    img.loading = index < 3 ? "eager" : "lazy";
    img.decoding = "async";
    img.referrerPolicy = "same-origin";
    if (image.width > 0) img.width = image.width;
    if (image.height > 0) img.height = image.height;

    const caption = document.createElement("figcaption");
    caption.className = "mrm-reader-page__caption";

    const left = document.createElement("span");
    left.textContent = `Page ${index + 1}`;

    const right = document.createElement("span");
    right.textContent = image.width && image.height ? `${image.width}×${image.height}` : " ";

    caption.append(left, right);
    figure.append(img, caption);
    stack.appendChild(figure);
    pageNodes.push(figure);
  });

  const hint = document.createElement("div");
  hint.className = "mrm-reader-page__hint";
  hint.textContent = "Tap zones • Esc close • F fullscreen • W width • M fit • C view • R direction • T thumbnails • Alt+←/→ posts";

  const thumbsPanel = document.createElement("aside");
  thumbsPanel.className = "mrm-reader-page__thumbs";

  const thumbsHead = document.createElement("div");
  thumbsHead.className = "mrm-reader-page__thumbs-head";

  const thumbsTitle = document.createElement("div");
  thumbsTitle.textContent = "Thumbnail strip";

  const thumbsSummary = document.createElement("div");
  thumbsSummary.textContent = `${images.length} pages`;

  thumbsHead.append(thumbsTitle, thumbsSummary);

  const thumbsStrip = document.createElement("div");
  thumbsStrip.className = "mrm-reader-page__thumbs-strip";

  const footerDock = document.createElement("footer");
  footerDock.className = "mrm-reader-page__dock";

  const dockMain = document.createElement("div");
  dockMain.className = "mrm-reader-page__dock-main";

  const dockMeta = document.createElement("div");
  dockMeta.className = "mrm-reader-page__dock-meta";

  const dockLabel = document.createElement("span");
  dockLabel.textContent = "Page scrubber";

  const dockValue = document.createElement("span");
  dockValue.textContent = `1 / ${images.length}`;

  dockMeta.append(dockLabel, dockValue);

  const rangeWrap = document.createElement("div");
  rangeWrap.className = "mrm-reader-page__range-wrap";

  const pageRange = document.createElement("input");
  pageRange.className = "mrm-reader-page__range";
  pageRange.type = "range";
  pageRange.min = "1";
  pageRange.max = String(images.length);
  pageRange.step = "1";
  pageRange.value = "1";
  pageRange.setAttribute("aria-label", "Jump to page");

  rangeWrap.appendChild(pageRange);

  const dockActions = document.createElement("div");
  dockActions.className = "mrm-reader-page__dock-actions";

  const firstPageButton = document.createElement("button");
  firstPageButton.type = "button";
  firstPageButton.className = "mrm-reader-page__button mrm-reader-page__page-jump";
  firstPageButton.textContent = "First";

  const prevPageButton = document.createElement("button");
  prevPageButton.type = "button";
  prevPageButton.className = "mrm-reader-page__button mrm-reader-page__page-jump";
  prevPageButton.textContent = "Page −";

  const dockThumbsButton = document.createElement("button");
  dockThumbsButton.type = "button";
  dockThumbsButton.className = "mrm-reader-page__button";
  controls.thumbnailButtons.push(dockThumbsButton);

  const nextPageButton = document.createElement("button");
  nextPageButton.type = "button";
  nextPageButton.className = "mrm-reader-page__button mrm-reader-page__page-jump";
  nextPageButton.textContent = "Page +";

  const lastPageButton = document.createElement("button");
  lastPageButton.type = "button";
  lastPageButton.className = "mrm-reader-page__button mrm-reader-page__page-jump";
  lastPageButton.textContent = "Last";

  dockActions.append(firstPageButton, prevPageButton, dockThumbsButton, nextPageButton, lastPageButton);
  dockMain.append(dockMeta, rangeWrap);
  footerDock.append(dockMain, dockActions);

  const scrollToPageIndex = (index) => {
    const bounded = Math.max(0, Math.min(pageNodes.length - 1, index));
    scrollReaderPageIntoView(pageNodes, bounded);
  };

  const setActiveThumb = (index, behavior = "smooth") => {
    for (let i = 0; i < thumbNodes.length; i += 1) {
      thumbNodes[i].classList.toggle("is-active", i === index);
    }
    const activeThumb = thumbNodes[index];
    activeThumb?.scrollIntoView?.({ block: "nearest", inline: "center", behavior });
  };

  images.forEach((image, index) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = "mrm-reader-page__thumb";
    thumb.setAttribute("aria-label", `Jump to page ${index + 1}`);

    const thumbImageWrap = document.createElement("div");
    thumbImageWrap.className = "mrm-reader-page__thumb-image-wrap";

    const thumbImage = document.createElement("img");
    thumbImage.src = image.src;
    thumbImage.alt = image.alt || `${title} thumbnail ${index + 1}`;
    thumbImage.loading = Math.abs(index) < 10 ? "eager" : "lazy";
    thumbImage.decoding = "async";
    thumbImage.referrerPolicy = "same-origin";

    const thumbLabel = document.createElement("span");
    thumbLabel.className = "mrm-reader-page__thumb-label";
    thumbLabel.textContent = `Page ${index + 1}`;

    thumbImageWrap.appendChild(thumbImage);
    thumb.append(thumbImageWrap, thumbLabel);
    thumb.addEventListener("click", () => scrollToPageIndex(index));
    thumbsStrip.appendChild(thumb);
    thumbNodes.push(thumb);
  });

  thumbsPanel.append(thumbsHead, thumbsStrip);
  main.append(stack, hint);
  root.append(topbar, main, thumbsPanel, footerDock, tapZones);
  commitPrefs();

  let activeReaderPageIndex = -1;

  const syncReaderProgress = (behavior = "smooth") => {
    const currentIndex = getNearestReaderPageIndex(pageNodes);
    if (currentIndex === activeReaderPageIndex && behavior !== "auto") {
      dockValue.textContent = `${currentIndex + 1} / ${images.length}`;
      pageRange.value = String(currentIndex + 1);
      return;
    }

    updateReaderPageProgress(progress, pageNodes, currentIndex, title);
    dockValue.textContent = `${currentIndex + 1} / ${images.length}`;
    pageRange.value = String(currentIndex + 1);
    setActiveThumb(currentIndex, behavior);

    if (activeReaderPageIndex >= 0 && pageNodes[activeReaderPageIndex]) {
      pageNodes[activeReaderPageIndex].classList.remove("is-active");
    }
    if (pageNodes[currentIndex]) {
      pageNodes[currentIndex].classList.add("is-active");
    }
    activeReaderPageIndex = currentIndex;
  };

  syncReaderProgress("auto");

  const onReaderScroll = rafThrottle(() => syncReaderProgress());
  main.addEventListener("scroll", onReaderScroll, { passive: true });
  window.addEventListener("scroll", onReaderScroll, { passive: true });

  pageRange.addEventListener("input", () => {
    dockValue.textContent = `${pageRange.value} / ${images.length}`;
  });

  pageRange.addEventListener("change", () => {
    scrollToPageIndex(Number(pageRange.value) - 1);
  });

  firstPageButton.addEventListener("click", () => scrollToPageIndex(0));
  prevPageButton.addEventListener("click", () => scrollToPageIndex(getNearestReaderPageIndex(pageNodes) - Math.abs(getReaderImageStep(prefs))));
  nextPageButton.addEventListener("click", () => scrollToPageIndex(getNearestReaderPageIndex(pageNodes) + Math.abs(getReaderImageStep(prefs))));
  lastPageButton.addEventListener("click", () => scrollToPageIndex(pageNodes.length - 1));

  dockThumbsButton.addEventListener("click", () => {
    prefs.thumbsCollapsed = !prefs.thumbsCollapsed;
    commitPrefs();
  });

  const unbindTopbar = bindReaderTopbarAutoHide(root, main);

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (event.key === "Escape") {
      event.preventDefault();
      closeButton.click();
      return;
    }

    if (key === "f") {
      event.preventDefault();
      fullscreenButton.click();
      return;
    }

    if (key === "w") {
      event.preventDefault();
      widthButton.click();
      return;
    }

    if (key === "m") {
      event.preventDefault();
      fitButton.click();
      return;
    }

    if (key === "c") {
      event.preventDefault();
      viewButton.click();
      return;
    }

    if (key === "r") {
      event.preventDefault();
      directionButton.click();
      return;
    }

    if (key === "t") {
      event.preventDefault();
      dockThumbsButton.click();
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      firstPageButton.click();
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      lastPageButton.click();
      return;
    }

    if (event.key === "ArrowLeft" && event.altKey) {
      event.preventDefault();
      prevButton.click();
      return;
    }

    if (event.key === "ArrowRight" && event.altKey) {
      event.preventDefault();
      nextButton.click();
      return;
    }

    if (["PageDown", "ArrowDown", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      navigateReaderPages(pageNodes, prefs, 1 * getReaderImageStep(prefs));
      return;
    }

    if (["PageUp", "ArrowUp", "ArrowLeft"].includes(event.key)) {
      event.preventDefault();
      navigateReaderPages(pageNodes, prefs, -1 * getReaderImageStep(prefs));
    }
  }, { passive: false });

  if (window.top === window.self) {
    updateReaderPrefetchLinks([adjacent.prev, adjacent.next].filter(Boolean));
  }

  window.addEventListener("beforeunload", () => {
    main.removeEventListener("scroll", onReaderScroll);
    window.removeEventListener("scroll", onReaderScroll);
    unbindTopbar();
  }, { once: true });
}

function initReaderPage() {
  if (!isReaderPopupPage()) return false;

  cleanupSinglePostLayoutArtifacts();

  const article = getSinglePostArticle();
  const contentRoot = getSinglePostContentRoot(article);
  const title = getSinglePostTitle(article);
  const prefs = loadReaderPrefs();
  const adjacent = findAdjacentPostLinks();
  const storedPayload = loadReaderPayload(location.href);

  injectReaderPageStyles();
  document.documentElement.classList.add("mrm-reader-page");
  document.body.classList.add("mrm-reader-page");

  const loadingOverlay = document.createElement("div");
  loadingOverlay.className = "mrm-reader-page__loading";
  loadingOverlay.style.cssText = "position:fixed;inset:84px 14px auto;z-index:999999;";
  const loadingText = document.createElement("p");
  loadingText.textContent = "Building reader… collecting image URLs before the page finishes lazy-loading.";
  const loadingBar = document.createElement("div");
  loadingBar.className = "mrm-reader-page__loading-bar";
  loadingOverlay.append(loadingText, loadingBar);
  document.body.appendChild(loadingOverlay);

  (async () => {
    const payloadImages = storedPayload?.images || [];
    const liveImages = await waitForReaderImages(contentRoot, payloadImages);
    const images = mergeReaderImages(payloadImages, liveImages);

    saveReaderPayload(location.href, {
      title,
      images,
    });

    const root = document.createElement("div");
    root.id = "mrm-reader-page";

    document.body.replaceChildren(root);
    renderReaderPage(root, {
      title: storedPayload?.title || title,
      images,
      prefs,
      adjacent,
    });
  })();

  return true;
}


  const META_FAMILIES = [
    { key: "lang", prefix: "lang-" },
    { key: "category", prefix: "category-" },
    { key: "genre", prefix: "genre-" },
    { key: "tag", prefix: "tag-" },
    { key: "artist", prefix: "artist-" },
    { key: "pairing", prefix: "pairing-" },
    { key: "group", prefix: "group-" },
  ];

  const LANGUAGE_MAP = {
    english: "Eng",
    japanese: "JP",
    spanish: "Spa",
    chinese: "CN",
    korean: "KR",
    french: "Fr",
    german: "De",
    thai: "Thai",
    vietnamese: "VN",
    russian: "RU",
    portuguese: "PT",
    italian: "IT",
  };

  const CATEGORY_MAP = {
    video: "Video",
    bara: "Bara",
    anime: "Anime",
    doujinshi: "Doujinshi",
    oneshot: "Oneshot",
    manga: "Manga",
    "yaoi-manga": "Manga",
    yaoi_manga: "Manga",
  };

  const SKIP_CLASS_PREFIXES = [
    "post-",
    "type-",
    "status-",
    "format-",
    "has-",
    "menu-",
    "current-",
    "wp-",
    "genesis-",
    "entry",
    "post",
  ];

  const SELECTORS = {
  resultsContainer: [
    ".content .content-archive",
    "main.content .content-archive",
    ".ep-search-wrapper .content-archive",
    ".content-archive",
    ".content > .pad.group",
    ".content .pad.group",
    ".content > .content-inner",
    ".content .content-inner",
    ".content .post-list",
    ".content .posts",
    ".content .archive",
    ".herald-posts",
    ".herald-main-content .herald-posts",
    ".col-mod-main .herald-posts"
  ],
  card: [
    ":scope > article.post-standard",
    ":scope > article.entry",
    ":scope > article.post",
    ":scope > article.hentry",
    ":scope > article",
  ],
  titleLink: [
    ".entry-title-link",
    ".entry-title a[href]",
    "h1 a[href], h2 a[href], h3 a[href], h4 a[href]",
    ".herald-post-thumbnail a[href]",
    ".cover[href]",
    "a[href]",
  ],
  nativeSearchSidebar: ".ep-search-sidebar",
};

  function getSiteName() {
    return "mrm";
  }


  function applyDefaultHiddenFacetTerms() {
    if (!state.archive.termModes || typeof state.archive.termModes !== "object") {
      state.archive.termModes = {};
    }

    let changed = false;

    for (const [facetKey, terms] of Object.entries(DEFAULT_HIDDEN_FACET_TERMS)) {
      if (!state.archive.termModes[facetKey] || typeof state.archive.termModes[facetKey] !== "object") {
        state.archive.termModes[facetKey] = {};
      }

      const selection = state.archive.termModes[facetKey];
      for (const term of terms) {
        const raw = slugify(term);
        if (!raw || Object.prototype.hasOwnProperty.call(selection, raw)) continue;
        selection[raw] = "exclude";
        changed = true;
      }
    }

    return changed;
  }

  function loadState() {
    let shouldPersist = false;

    try {
      const keys = [getStorageKey(), ...getLegacyStorageKeys()];
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed?.archive) Object.assign(state.archive, parsed.archive);
        if (parsed?.grid) Object.assign(state.grid, parsed.grid);
        if (parsed?.ui) Object.assign(state.ui, parsed.ui);
        if (typeof state.ui.uiEnabled !== "boolean") {
          state.ui.uiEnabled = true;
          shouldPersist = true;
        }
        if (ensureUiThemeState()) {
          shouldPersist = true;
        }
        if (applyDefaultHiddenFacetTerms()) {
          shouldPersist = true;
        }
        if (key !== getStorageKey()) {
          shouldPersist = true;
        }
        if (shouldPersist) {
          saveState();
        }
        return;
      }
    } catch {}

    if (typeof state.ui.uiEnabled !== "boolean") {
      state.ui.uiEnabled = true;
      shouldPersist = true;
    }
    if (ensureUiThemeState()) {
      shouldPersist = true;
    }
    if (applyDefaultHiddenFacetTerms()) {
      shouldPersist = true;
    }
    if (shouldPersist) {
      saveState();
    }
  }

  function saveState() {
    localStorage.setItem(
      getStorageKey(),
      JSON.stringify({
        archive: state.archive,
        grid: state.grid,
        ui: state.ui,
      })
    );
  }

  function isUiMakeoverEnabled() {
    return state.ui.uiEnabled !== false;
  }

  function injectUiRestoreToggleStyles() {
    if (getCachedElementById("mrm-ui-restore-style")) return;

    const style = document.createElement("style");
    style.id = "mrm-ui-restore-style";
    style.textContent = `
      #mrm-ui-restore-toggle {
        position: fixed;
        right: 14px;
        bottom: 14px;
        z-index: 2147483601;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(10,16,28,.94);
        color: #eef4fc;
        box-shadow: 0 18px 40px rgba(0,0,0,.34);
        font: 700 12px/1 Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        cursor: pointer;
      }

      #mrm-ui-restore-toggle:hover {
        transform: translateY(-1px);
      }
    `;
    document.head.appendChild(style);
  }

  function hideUiRestoreToggle() {
    getCachedElementById("mrm-ui-restore-toggle")?.remove();
  }

  function showUiRestoreToggle() {
    injectUiRestoreToggleStyles();

    let button = getCachedElementById("mrm-ui-restore-toggle");
    if (!(button instanceof HTMLButtonElement)) {
      button = document.createElement("button");
      button.type = "button";
      button.id = "mrm-ui-restore-toggle";
      button.textContent = "Enable MRM UI";
      button.addEventListener("click", () => {
        state.ui.uiEnabled = true;
        saveState();
        location.reload();
      });
      document.body.appendChild(button);
    }
  }


  function getReadPosts() {
    try {
      const keys = [getReadPostsKey(), READ_POSTS_KEY];
      for (const key of keys) {
        const raw = JSON.parse(localStorage.getItem(key) || "[]");
        if (!Array.isArray(raw)) continue;
        if (key !== getReadPostsKey()) {
          saveReadPosts(new Set(raw));
        }
        return new Set(raw);
      }
      return new Set();
    } catch {
      return new Set();
    }
  }

  function saveReadPosts(set) {
    localStorage.setItem(getReadPostsKey(), JSON.stringify(Array.from(set).slice(-5000)));
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function titleCase(value) {
    return value
      .replace(/^\[|\]$/g, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function normalizeMetaValue(family, raw) {
    const value = raw.trim().toLowerCase();

    switch (family) {
      case "lang":
        return { raw: value, text: LANGUAGE_MAP[value] || titleCase(value) };
      case "category":
        return { raw: value, text: CATEGORY_MAP[value] || titleCase(value) };
      case "pairing":
        return { raw: value, text: titleCase(value).replace(/\bX\b/g, "×") };
      default:
        return { raw: value, text: titleCase(value) };
    }
  }

  function shouldSkipClass(cls) {
    return SKIP_CLASS_PREFIXES.some((prefix) => cls === prefix || cls.startsWith(prefix));
  }

  function findResultsContainer() {
    if (!shouldRunArchiveMode()) return null;
    for (const selector of SELECTORS.resultsContainer) {
      const root = document.querySelector(selector);
      if (!root) continue;
      const hasCards = SELECTORS.card.some((cardSelector) => root.querySelector(cardSelector));
      if (hasCards) return root;
    }

    return null;
  }

  function findCards() {
    if (!shouldRunArchiveMode()) return [];
    const preferredRoot = findResultsContainer();
    const containers = [preferredRoot, document].filter(Boolean);

    for (const root of containers) {
      for (const selector of SELECTORS.card) {
        const cards = Array.from(root.querySelectorAll(selector))
          .filter((node) => node instanceof HTMLElement)
          .filter((node) => getCardHref(node) && getCardTitle(node));
        if (cards.length) return cards;
      }
    }
    return [];
  }

  function resolveCardContainer(cards = []) {
    const nodes = cards.length ? cards : findCards();
    const parentCounts = new Map();

    for (const card of nodes) {
      if (!(card instanceof HTMLElement) || !(card.parentElement instanceof HTMLElement)) continue;
      const parent = card.parentElement;
      parentCounts.set(parent, (parentCounts.get(parent) || 0) + 1);
    }

    let bestParent = null;
    let bestCount = 0;
    for (const [parent, count] of parentCounts.entries()) {
      if (count > bestCount) {
        bestParent = parent;
        bestCount = count;
      }
    }

    if (bestParent && bestCount >= 2) return bestParent;
    return findResultsContainer();
  }

  function refreshResultsGridClass() {
    document.querySelectorAll(".mrm-results-grid").forEach((node) => {
      if (node !== state.cardContainer) node.classList.remove("mrm-results-grid");
    });

    if (state.cardContainer instanceof HTMLElement) {
      state.cardContainer.classList.add("mrm-results-grid");
    }
  }

  function isMobileView() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function getChipLimit() {
    return isMobileView() ? CHIP_LIMIT_MOBILE : CHIP_LIMIT_DESKTOP;
  }

  function getCardTitle(article) {
    return (
      article.querySelector(".entry-title-link")?.textContent?.trim() ||
      article.querySelector(".entry-title a[href]")?.textContent?.trim() ||
      article.querySelector(".entry-title")?.textContent?.trim() ||
      article.querySelector(".caption")?.textContent?.trim() ||
      article.querySelector(".name")?.textContent?.trim() ||
      article.querySelector("h1 a[href], h2 a[href], h3 a[href], h4 a[href]")?.textContent?.trim() ||
      article.querySelector("h1, h2, h3, h4")?.textContent?.trim() ||
      article.querySelector("img[alt]")?.getAttribute("alt")?.trim() ||
      ""
    );
  }

  function getCardHref(article) {
    for (const selector of SELECTORS.titleLink) {
      const link = article.querySelector(selector);
      if (link instanceof HTMLAnchorElement && link.href) return link.href;
    }
    return "";
  }

  function getCardByHref(href) {
    const normalized = normalizeReaderHref(href);
    if (!normalized) return null;
    return state.cards.find((card) => normalizeReaderHref(getCardHref(card.article)) === normalized) || null;
  }

  function updateReaderModalTitle(href = state.modal.currentHref) {
    const overlay = document.getElementById(READER_MODAL_IDS.overlay);
    const titleNode = overlay?.querySelector(".mrm-reader-title");
    if (!(titleNode instanceof HTMLElement)) return;
    const card = getCardByHref(href);
    const title = card ? getCardTitle(card.article) : "";
    state.modal.currentTitle = title;
    titleNode.textContent = title || "Reader";
    titleNode.title = title || "Reader";
    updateReaderNavButtons();
    updateReaderModalActions();
  }


  function extractCardMeta(article) {
    const cached = cardMetaCache.get(article);
    if (cached) return cached;
    if (!(article instanceof HTMLElement)) {
      return {
        lang: [],
        category: [],
        genre: [],
        tag: [],
        artist: [],
        pairing: [],
        group: [],
      };
    }

    const cachedMeta = cardMetaCache.get(article);
    if (cachedMeta) return cachedMeta;

    const meta = {
      lang: [],
      category: [],
      genre: [],
      tag: [],
      artist: [],
      pairing: [],
      group: [],
    };

    const pushMeta = (familyKey, rawValue) => {
      const normalized = normalizeMetaValue(familyKey, rawValue);
      if (!normalized?.raw) return;
      meta[familyKey].push(normalized);
    };

    const languageClassMap = {
      english: "english",
      japanese: "japanese",
      jpn: "japanese",
      chinese: "chinese",
      chi: "chinese",
      korean: "korean",
      kor: "korean",
      spanish: "spanish",
      portuguese: "portuguese",
      italian: "italian",
      french: "french",
      german: "german",
      russian: "russian",
      thai: "thai",
      vietnamese: "vietnamese",
    };

    for (const cls of Array.from(article.classList)) {
      if (shouldSkipClass(cls)) continue;
      let matched = false;
      for (const family of META_FAMILIES) {
        if (!cls.startsWith(family.prefix)) continue;
        const value = cls.slice(family.prefix.length);
        if (!value) continue;
        pushMeta(family.key, value);
        matched = true;
        break;
      }
      if (matched) continue;

      const wpCategoryMatch = cls.match(/^category-(.+)$/);
      if (wpCategoryMatch) {
        const rawCategory = wpCategoryMatch[1].replace(/-+/g, " ").trim();
        const normalizedLanguage = languageClassMap[rawCategory];
        if (normalizedLanguage) pushMeta("lang", normalizedLanguage);
        else pushMeta("category", rawCategory);
      }
    }

    const categoryLinks = Array.from(
      article.querySelectorAll(".post-category a[href], .entry-categories a[href], .cat-links a[href], a[rel~='category'][href]")
    );

    for (const link of categoryLinks) {
      const text = link.textContent?.trim();
      if (!text) continue;
      let familyKey = "category";
      try {
        const href = new URL(link.href, location.href).pathname.toLowerCase();
        if (/\/category\/languages\//.test(href) || /\/lang\//.test(href)) familyKey = "lang";
        else if (/\/(genre|tag|artist|pairing|group|author)\//.test(href)) {
          const match = href.match(/\/(genre|tag|artist|pairing|group|author)\//);
          familyKey = match?.[1] === "author" ? "artist" : (match?.[1] || "category");
        }
      } catch {}
      pushMeta(familyKey, text);
    }

    const title = getCardTitle(article);
    const langPrefixMatch = title.match(/^\s*\[([^\]]+)\]/);
    if (langPrefixMatch) {
      const prefixMap = {
        eng: "english",
        english: "english",
        jpn: "japanese",
        jp: "japanese",
        chi: "chinese",
        cn: "chinese",
        kor: "korean",
        kr: "korean",
        spa: "spanish",
        esp: "spanish",
        pt: "portuguese",
        ita: "italian",
        fr: "french",
        de: "german",
        ru: "russian",
        thai: "thai",
        vn: "vietnamese",
      };

      for (const token of langPrefixMatch[1]
        .split(/[,+/&]/)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)) {
        const resolved = prefixMap[token];
        if (resolved) pushMeta("lang", resolved);
      }
    }

    for (const family of META_FAMILIES) {
      const seen = new Set();
      meta[family.key] = meta[family.key].filter((item) => {
        if (seen.has(item.raw)) return false;
        seen.add(item.raw);
        return true;
      });
    }

    cardMetaCache.set(article, meta);
    cardMetaCache.set(article, meta);
    return meta;
  }

  function buildChipModel(meta) {
    const cachedChips = chipModelCache.get(meta);
    if (cachedChips) return cachedChips;

    const chips = [];
    const pushSome = (family, max) => {
      for (const item of meta[family].slice(0, max)) {
        chips.push({ family, item });
      }
    };

    pushSome("lang", 1);
    pushSome("category", 1);
    pushSome("genre", 2);
    pushSome("tag", 2);
    pushSome("artist", 1);
    pushSome("pairing", 1);
    pushSome("group", 1);

    chipModelCache.set(meta, chips);
    return chips;
  }

  function injectReaderModalStyles() {
    if (document.getElementById(READER_MODAL_IDS.style)) return;

    const style = document.createElement("style");
    style.id = READER_MODAL_IDS.style;
    style.textContent = `
      .mrm-reader-trigger {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 36px;
        padding: 0 14px;
        border: 1px solid rgba(255,255,255,0.12);
        padding: 0 14px;
        border-radius: 999px;
                color: #fff;
        font-size: 13px;
        font-weight: 700;
        line-height: 1;
        text-decoration: none;
        cursor: pointer;
        box-shadow: 0 10px 22px rgba(0,0,0,0.18);
      }

      .mrm-reader-trigger:hover {
        transform: translateY(-1px);
        box-shadow: 0 14px 26px rgba(0,0,0,0.22);
      }

      .mrm-reader-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
      }

      #${READER_MODAL_IDS.overlay} {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(8, 10, 18, 0.82);
              }

      #${READER_MODAL_IDS.overlay}.is-open {
        display: flex;
      }

      #${READER_MODAL_IDS.dialog} {
        position: relative;
        width: min(1560px, calc(100vw - 20px));
        height: min(95vh, 1200px);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 20px;
        overflow: hidden;
        background: #050505;
        box-shadow: 0 24px 80px rgba(0,0,0,0.45);
      }

      #${READER_MODAL_IDS.dialog}.is-fullscreen {
        width: calc(100vw - 10px);
        height: calc(100vh - 10px);
        border-radius: 14px;
      }

      .mrm-reader-toolbar {
        position: absolute;
        top: 12px;
        left: 12px;
        right: 12px;
        z-index: 4;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .mrm-reader-title {
        min-width: 0;
        flex: 1 1 auto;
        height: 40px;
        display: flex;
        align-items: center;
        padding: 0 14px;
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 999px;
        background: rgba(10, 12, 20, 0.72);
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.01em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mrm-reader-toolbar-actions {
        display: flex;
        gap: 8px;
        margin-left: auto;
      }

      .mrm-reader-prev,
      .mrm-reader-next,

      #${READER_MODAL_IDS.frame} {
        width: 100%;
        height: 100%;
        border: 0;
        background: #050505;
      }

      .mrm-reader-close,
      .mrm-reader-fullscreen,
      .mrm-reader-open-tab,
      .mrm-reader-comments,
      .mrm-reader-back,
      .mrm-reader-prev,
      .mrm-reader-next {
        appearance: none;
        min-width: 40px;
        height: 40px;
        border: 1px solid rgba(255,255,255,0.14);
        padding: 0 14px;
        border-radius: 999px;
        background: rgba(10, 12, 20, 0.85);
        color: #fff;
        font-size: 15px;
        font-weight: 700;
        line-height: 1;
        cursor: pointer;
      }

      .mrm-reader-close {
        font-size: 22px;
      }

      .mrm-reader-comments::after {
        content: attr(data-count);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        margin-left: 8px;
        padding: 0 6px;
        border-radius: 999px;
        background: rgba(255,255,255,0.16);
        color: #fff;
        font-size: 11px;
        font-weight: 800;
        line-height: 1;
      }

      .mrm-reader-back[hidden] {
        display: none !important;
      }

      .mrm-reader-prev[disabled],
      .mrm-reader-next[disabled] {
        opacity: 0.42;
        cursor: not-allowed;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureReaderModal() {
    let overlay = document.getElementById(READER_MODAL_IDS.overlay);
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = READER_MODAL_IDS.overlay;
    overlay.innerHTML = `
      <div id="${READER_MODAL_IDS.dialog}" role="dialog" aria-modal="true" aria-label="Reader popup">
        <div class="mrm-reader-toolbar">
          <div class="mrm-reader-title" aria-live="polite">Reader</div>
          <div class="mrm-reader-toolbar-actions">
            <button type="button" class="mrm-reader-prev" aria-label="Previous visible card">Prev</button>
            <button type="button" class="mrm-reader-next" aria-label="Next visible card">Next</button>
            <button type="button" class="mrm-reader-fullscreen" aria-label="Toggle fullscreen">Fullscreen</button>
            <button type="button" class="mrm-reader-comments" aria-label="Open comments">Comments</button>
            <button type="button" class="mrm-reader-back" aria-label="Back to reader" hidden>Back to Reader</button>
            <button type="button" class="mrm-reader-open-tab" aria-label="Open in new tab">Open tab</button>
            <button type="button" class="mrm-reader-close" aria-label="Close reader">×</button>
          </div>
        </div>
        <iframe id="${READER_MODAL_IDS.frame}" loading="eager" referrerpolicy="same-origin" allowfullscreen></iframe>
      </div>
    `;

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeReaderModal();
    });

    overlay.querySelector(".mrm-reader-close")?.addEventListener("click", closeReaderModal);
    overlay.querySelector(".mrm-reader-prev")?.addEventListener("click", () => navigateReaderRelative(-1));
    overlay.querySelector(".mrm-reader-next")?.addEventListener("click", () => navigateReaderRelative(1));
    overlay.querySelector(".mrm-reader-fullscreen")?.addEventListener("click", toggleReaderModalFullscreen);
    overlay.querySelector(".mrm-reader-comments")?.addEventListener("click", openReaderCommentsInModal);
    overlay.querySelector(".mrm-reader-back")?.addEventListener("click", openReaderPopupInModal);
    overlay.querySelector(".mrm-reader-open-tab")?.addEventListener("click", () => {
      const frame = overlay.querySelector(`#${READER_MODAL_IDS.frame}`);
      if (frame instanceof HTMLIFrameElement && frame.src && frame.src !== "about:blank") {
        window.open(frame.src, "_blank", "noopener,noreferrer");
      }
    });

    overlay.querySelector(`#${READER_MODAL_IDS.frame}`)?.addEventListener("load", (event) => {
      const frame = event.currentTarget;
      if (!(frame instanceof HTMLIFrameElement)) return;
      const rawUrl = getReaderModalFrameUrl(frame);
      state.modal.currentView = getReaderModalFrameView(frame);
      try {
        state.modal.commentCount = getDocumentCommentCount(frame.contentDocument || document);
      } catch {
        state.modal.commentCount = 0;
      }
      state.modal.currentHref = normalizeReaderHref(rawUrl || frame.src);
      updateReaderModalTitle(state.modal.currentHref);
      prefetchReaderAroundCurrent();
    });


    window.addEventListener("message", (event) => {
      if (event.origin !== location.origin) return;
      const data = event.data || {};
      if (data.source !== "mrm-reader-embed") return;
      if (data.action === "close") {
        closeReaderModal();
        return;
      }
      if (data.action === "back") {
        closeReaderModal();
        return;
      }
      if (data.action === "fullscreen") {
        toggleReaderModalFullscreen();
        return;
      }
      if (data.action === "comments") {
        openReaderCommentsInModal();
        return;
      }
      if (data.action === "reader") {
        openReaderPopupInModal();
        return;
      }
      if (data.action === "prev") {
        navigateReaderRelative(-1);
        return;
      }
      if (data.action === "next") {
        navigateReaderRelative(1);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && overlay.classList.contains("is-open")) {
        closeReaderModal();
      }
      if (event.key.toLowerCase() === "f" && overlay.classList.contains("is-open")) {
        event.preventDefault();
        toggleReaderModalFullscreen();
      }
    });

    document.body.appendChild(overlay);
    return overlay;
  }


  function buildReaderPopupUrl(url) {
    try {
      const next = new URL(url, location.href);
      next.searchParams.set(READER_POPUP_PARAM, "1");
      return next.toString();
    } catch {
      return url;
    }
  }


  function normalizeReaderHref(url) {
    try {
      const next = new URL(url, location.href);
      next.searchParams.delete(READER_POPUP_PARAM);
      next.hash = "";
      return next.toString();
    } catch {
      return String(url || "").replace(/[?#].*$/, "");
    }
  }

  function getReaderModalFrameUrl(frame) {
    if (!(frame instanceof HTMLIFrameElement)) return "";
    try {
      return frame.contentWindow?.location?.href || frame.src || "";
    } catch {
      return frame.src || "";
    }
  }

  function getReaderModalFrameView(frame) {
    const rawUrl = getReaderModalFrameUrl(frame);
    if (!rawUrl) return "reader";

    try {
      const next = new URL(rawUrl, location.href);
      const isReaderPopup = next.searchParams.get(READER_POPUP_PARAM) === "1";
      if (!isReaderPopup && /^(#comments|#respond)$/i.test(next.hash || "")) {
        return "comments";
      }
      return "reader";
    } catch {
      return /#comments\b|#respond\b/i.test(rawUrl) ? "comments" : "reader";
    }
  }

  function updateReaderModalActions() {
    const overlay = document.getElementById(READER_MODAL_IDS.overlay);
    const commentsButton = overlay?.querySelector(".mrm-reader-comments");
    const backButton = overlay?.querySelector(".mrm-reader-back");

    if (commentsButton instanceof HTMLButtonElement) {
      const count = Math.max(0, Number(state.modal.commentCount) || 0);
      commentsButton.dataset.count = String(count);
      commentsButton.setAttribute("aria-label", `Open comments (${count})`);
      commentsButton.title = count ? `${count} comment${count === 1 ? "" : "s"}` : "Open comments";
    }

    if (backButton instanceof HTMLButtonElement) {
      const showBack = state.modal.currentView === "comments" && Boolean(state.modal.currentHref);
      backButton.hidden = !showBack;
      backButton.disabled = !showBack;
    }
  }

  function openReaderPopupInModal() {
    const overlay = document.getElementById(READER_MODAL_IDS.overlay);
    const frame = overlay?.querySelector(`#${READER_MODAL_IDS.frame}`);
    const href = normalizeReaderHref(state.modal.currentHref || frame?.getAttribute("src") || "");
    if (!(frame instanceof HTMLIFrameElement) || !href) return;

    state.modal.currentView = "reader";
    updateReaderModalActions();
    frame.src = buildReaderPopupUrl(href);
  }

  function openReaderCommentsInModal() {
    const overlay = document.getElementById(READER_MODAL_IDS.overlay);
    const frame = overlay?.querySelector(`#${READER_MODAL_IDS.frame}`);
    const href = normalizeReaderHref(state.modal.currentHref || frame?.getAttribute("src") || "");
    if (!(frame instanceof HTMLIFrameElement) || !href) return;

    state.modal.currentView = "comments";
    updateReaderModalActions();

    try {
      const next = new URL(href, location.href);
      next.hash = "comments";
      frame.src = next.toString();
      return;
    } catch {}

    frame.src = `${href.replace(/#.*$/, "")}#comments`;
  }

  function getVisibleReaderCards() {
    return state.cards.filter((card) => !card.article.classList.contains("mrm-hidden-card") && getCardHref(card.article));
  }

  function getCurrentReaderCardIndex() {
    const cards = getVisibleReaderCards();
    if (!cards.length) return { cards, index: -1 };
    const current = normalizeReaderHref(state.modal.currentHref);
    let index = cards.findIndex((card) => normalizeReaderHref(getCardHref(card.article)) === current);
    if (index === -1 && state.modal.opener instanceof HTMLElement) {
      const article = state.modal.opener.closest("article");
      if (article instanceof HTMLElement) {
        index = cards.findIndex((card) => card.article === article);
      }
    }
    if (index === -1) index = 0;
    return { cards, index };
  }

  function updateReaderNavButtons() {
    const overlay = document.getElementById(READER_MODAL_IDS.overlay);
    const prevButton = overlay?.querySelector(".mrm-reader-prev");
    const nextButton = overlay?.querySelector(".mrm-reader-next");
    if (!(prevButton instanceof HTMLButtonElement) || !(nextButton instanceof HTMLButtonElement)) return;
    const { cards, index } = getCurrentReaderCardIndex();
    const disabled = !cards.length || index < 0;
    prevButton.disabled = disabled || index <= 0;
    nextButton.disabled = disabled || index >= cards.length - 1;
  }

  function navigateReaderRelative(step) {
    const { cards, index } = getCurrentReaderCardIndex();
    if (!cards.length) return;
    const nextIndex = Math.max(0, Math.min(cards.length - 1, index + step));
    if (nextIndex === index) {
      updateReaderNavButtons();
      return;
    }
    const nextHref = getCardHref(cards[nextIndex].article);
    if (!nextHref) return;
    openReaderModal(nextHref, state.modal.opener);
  }

  function focusReaderOpener() {
    const opener = state.modal.opener;
    if (opener instanceof HTMLElement && document.contains(opener)) {
      try {
        opener.focus({ preventScroll: false });
      } catch {
        opener.focus();
      }
    }
  }

  function toggleReaderModalFullscreen() {
    const overlay = document.getElementById(READER_MODAL_IDS.overlay);
    const dialog = document.getElementById(READER_MODAL_IDS.dialog);
    if (!(overlay instanceof HTMLElement) || !(dialog instanceof HTMLElement)) return;
    const fullscreen = dialog.classList.toggle("is-fullscreen");
    overlay.classList.toggle("is-fullscreen", fullscreen);
  }

  function openReaderModal(url, opener = null) {
    if (!url) return;
    const overlay = ensureReaderModal();
    const frame = overlay.querySelector(`#${READER_MODAL_IDS.frame}`);
    if (!(frame instanceof HTMLIFrameElement)) return;
    state.modal.opener = opener instanceof HTMLElement ? opener : state.modal.opener;
    state.modal.currentHref = normalizeReaderHref(url);
    state.modal.currentView = "reader";
    state.modal.commentCount = 0;
    updateReaderModalTitle(state.modal.currentHref);
    frame.src = buildReaderPopupUrl(url);
    prefetchReaderAroundCurrent();
    overlay.classList.add("is-open");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  function closeReaderModal({ focusOpener = true } = {}) {
    const overlay = document.getElementById(READER_MODAL_IDS.overlay);
    if (!(overlay instanceof HTMLElement)) return;
    const frame = overlay.querySelector(`#${READER_MODAL_IDS.frame}`);
    if (frame instanceof HTMLIFrameElement) frame.src = "about:blank";
    overlay.classList.remove("is-open", "is-fullscreen");
    document.getElementById(READER_MODAL_IDS.dialog)?.classList.remove("is-fullscreen");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    state.modal.currentHref = "";
    state.modal.currentTitle = "";
    state.modal.currentView = "reader";
    state.modal.commentCount = 0;
    updateReaderModalTitle("");
    if (focusOpener) focusReaderOpener();
  }

  function getReaderActionHost(article) {
    return (
      article.querySelector(".entry-header, .mrm-card-head, .entry-title, header, .post-title, .post-header, .caption-container")
      || article.querySelector(".cover")
      || article.querySelector(".entry-content, .post-content, .content")
      || article
    );
  }

  function injectReaderTrigger(article) {
    const href = getCardHref(article);
    if (!href || article.matches("a.tagchip")) return;

    let actions = article.querySelector(":scope .mrm-reader-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "mrm-reader-actions";
      getReaderActionHost(article).appendChild(actions);
    }

    let trigger = actions.querySelector(".mrm-reader-trigger");
    if (!trigger) {
      trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "mrm-reader-trigger";
      trigger.textContent = "Reader";
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openReaderModal(trigger.dataset.href || "", trigger);
      });
      actions.appendChild(trigger);
    }

    trigger.dataset.href = href;
    trigger.setAttribute("aria-label", `Open reader popup for ${getCardTitle(article) || "post"}`);
  }






  const footerObserver = new MutationObserver(
    rafThrottle(() => {
      removeBeforeFooterWidget();
    })
  );


  function injectStyles() {
    if (getCachedElementById("mrm-modern-style-v5222")) return;

    const style = document.createElement("style");
    style.id = "mrm-modern-style-v5222";
    style.textContent = `
      :root {
        --mrm-grid-desktop: ${state.grid.desktopCols};
        --mrm-grid-tablet: ${state.grid.tabletCols};
        --mrm-grid-mobile: ${state.grid.mobileCols};
        --mrm-grid-gap: ${state.grid.gap}px;
        --mrm-cover-ratio: ${state.grid.coverRatioW} / ${state.grid.coverRatioH};

        --mrm-bg: #07101a;
        --mrm-bg-2: #131926;
        --mrm-panel: rgba(13, 20, 33, 0.88);
        --mrm-panel-2: rgba(16, 24, 38, 0.94);
        --mrm-soft: rgba(255,255,255,.04);
        --mrm-soft-2: rgba(255,255,255,.03);
        --mrm-line: rgba(255,255,255,.08);
        --mrm-line-2: rgba(255,255,255,.14);
        --mrm-text: #e9eef6;
        --mrm-muted: #98a5b8;
        --mrm-accent: #7c5cff;
        --mrm-accent-2: #25c2a0;
        --mrm-danger: #ff5c8f;
        --mrm-warning: #ffcf6d;
        --mrm-shadow: 0 18px 40px rgba(0,0,0,.34);
        --mrm-shadow-lg: 0 20px 44px rgba(0,0,0,.34);
        --mrm-wrap: 1360px;
        --mrm-radius: 20px;
        --mrm-radius-sm: 14px;
      }

      html,
      body,
      .site-container {
        background:
          radial-gradient(circle at top, rgba(124,92,255,.10), transparent 28%),
          radial-gradient(circle at 85% 10%, rgba(37,194,160,.06), transparent 18%),
          var(--mrm-bg) !important;
        color: var(--mrm-text) !important;
      }

      body {
        font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important;
        line-height: 1.45 !important;
      }

      a,
      a:visited {
        color: #dfe7f3 !important;
        text-decoration: none !important;
      }

      a:hover {
        color: #fff !important;
      }

      .site-container,
      .wrap,
      .site-inner,
      .content-sidebar-wrap,
      .content,
      .full-width-content .content,
      #app,
      #content,
      .container {
        max-width: none !important;
      }

      .nav-primary .wrap,
      .site-header .wrap,
      .site-inner .wrap,
      .footer-widgets .wrap,
      .site-footer .wrap {
        max-width: var(--mrm-wrap) !important;
        margin-left: auto !important;
        margin-right: auto !important;
        padding-left: 20px !important;
        padding-right: 20px !important;
      }

      .nav-primary {
        position: sticky !important;
        top: 0 !important;
        z-index: 999 !important;
        background: rgba(13, 16, 22, 0.72) !important;
                border-bottom: 1px solid rgba(255,255,255,.05) !important;
      }

      .nav-primary .wrap {
        overflow-x: auto !important;
        scrollbar-width: none !important;
      }

      .nav-primary .wrap::-webkit-scrollbar {
        display: none !important;
      }

      .genesis-nav-menu,
      .nav-primary .menu {
        display: flex !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 14px 0 !important;
        margin: 0 !important;
        white-space: nowrap !important;
      }

      .genesis-nav-menu > li,
      .nav-primary .menu > li {
        float: none !important;
        display: inline-flex !important;
        align-items: center !important;
        margin: 0 !important;
      }

      .genesis-nav-menu a,
      .nav-primary .menu a {
        min-height: 40px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 14px !important;
        border-radius: 999px !important;
        border: 1px solid var(--mrm-line) !important;
        background: rgba(255,255,255,.03) !important;
        color: #dbe4f2 !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        letter-spacing: .01em !important;
        text-transform: none !important;
      }

      .genesis-nav-menu a:hover,
      .genesis-nav-menu .current-menu-item > a,
      .nav-primary .menu a:hover,
      .nav-primary .menu .current-menu-item > a {
        background: rgba(124,92,255,.16) !important;
        border-color: rgba(124,92,255,.45) !important;
      }

      .site-header {
        background: transparent !important;
        border: 0 !important;
        padding: 22px 0 8px !important;
      }

      .site-header .wrap {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 16px !important;
        align-items: stretch !important;
      }

      .title-area {
        min-height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .title-area:empty {
        display: none !important;
      }

      .header-widget-area {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 16px !important;
        align-items: stretch !important;
        margin: 0 !important;
      }

      #custom_html-4,
      #custom_html-4 > .widget_text,
      #custom_html-4 .custom-html-widget,
      #custom_html-4 .top_page {
        display: none !important;
      }

      .header-widget-area .search-form,
      .header-widget-area .widget_search,
      .header-widget-area form.search-form,
      .header-widget-area form.searchform {
        grid-column: 1 / -1 !important;
        width: 100% !important;
        max-width: none !important;
      }

      .top_page,
      .widget_custom_html .custom-html-widget {
        min-height: 76px !important;
        border-radius: 20px !important;
        border: 1px solid var(--mrm-line) !important;
                box-shadow: var(--mrm-shadow) !important;
        overflow: hidden !important;
      }

      .search-form {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        min-height: 76px !important;
        padding: 10px !important;
        background: var(--mrm-panel) !important;
        border: 1px solid var(--mrm-line) !important;
        border-radius: 20px !important;
        box-shadow: var(--mrm-shadow) !important;
      }

      .search-form::before {
        content: "⌕" !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 40px !important;
        height: 40px !important;
        border-radius: 12px !important;
        background: rgba(255,255,255,.04) !important;
        color: var(--mrm-muted) !important;
        font-size: 20px !important;
        flex: 0 0 auto !important;
      }

      .search-form-input,
      input.search-form-input,
      .search-form input[type="search"] {
        flex: 1 1 auto !important;
        width: auto !important;
        min-width: 0 !important;
        margin: 0 !important;
        padding: 0 4px !important;
        background: transparent !important;
        border: 0 !important;
        color: var(--mrm-text) !important;
        box-shadow: none !important;
        font-size: 15px !important;
      }

      .search-form-input::placeholder,
      .search-form input[type="search"]::placeholder {
        color: var(--mrm-muted) !important;
        opacity: 1 !important;
      }

      .search-form-submit,
      input.search-form-submit,
      .search-form input[type="submit"] {
        flex: 0 0 auto !important;
        margin: 0 !important;
        min-height: 48px !important;
        padding: 0 18px !important;
        border: 0 !important;
        border-radius: 14px !important;
                color: #fff !important;
        font-size: 14px !important;
        font-weight: 800 !important;
        cursor: pointer !important;
        box-shadow: 0 10px 24px rgba(124,92,255,.28) !important;
      }

      .site-inner {
        padding-top: 10px !important;
        padding-bottom: 36px !important;
        background: transparent !important;
      }

      ${SELECTORS.nativeSearchSidebar} {
        display: none !important;
      }

      .content,
      .full-width-content .content {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
      }

      .breadcrumb {
        margin: 0 0 18px !important;
        padding: 0 !important;
        background: transparent !important;
        border: 0 !important;
        color: var(--mrm-muted) !important;
        font-size: 13px !important;
      }

      .content-archive,
      .mrm-results-grid {
        display: grid !important;
        grid-template-columns: repeat(var(--mrm-grid-desktop), minmax(0, 1fr)) !important;
        gap: var(--mrm-grid-gap) !important;
        align-items: stretch !important;
      }

      .content-archive::before,
      .content-archive::after {
        display: none !important;
      }

      .mrm-results-grid > :not(article):not(.gallery):not(a.tagchip) {
        grid-column: 1 / -1 !important;
      }

      .mrm-results-grid > nav.pagination,
      .mrm-results-grid > .pagination,
      .mrm-results-grid > .wp-pagenavi {
        order: 999 !important;
        align-self: stretch !important;
      }

      .mrm-results-grid > .sidebar,
      .mrm-results-grid > .widget,
      .mrm-results-grid > .widget_search,
      .mrm-results-grid > .search-expand,
      .mrm-results-grid > form.searchform,
      .mrm-results-grid > [id^="search-"] {
        order: 1000 !important;
        grid-column: 1 / -1 !important;
      }

      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > nav.pagination,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > .pagination {
        margin-top: 8px !important;
      }

      body.home.blog.col-3cm .main-inner.group.mrm-results-grid,
      body.home.blog.col-3cm .content.mrm-results-grid,
      body.home.blog.col-3cm .content-inner.mrm-results-grid {
        display: block !important;
      }

      body.home.blog.col-3cm #page > .container,
      body.home.blog.col-3cm #page .container:first-child {
        max-width: 1680px !important;
      }

      body.home.blog.col-3cm #page > .container > .main {
        display: block !important;
      }

      body.home.blog.col-3cm #page > .container > .main > .main-inner.group {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) 320px !important;
        gap: 24px !important;
        align-items: start !important;
        min-width: 0 !important;
      }

      body.home.blog.col-3cm #page > .container > .main > .main-inner.group::before,
      body.home.blog.col-3cm #page > .container > .main > .main-inner.group::after {
        display: none !important;
      }

      body.home.blog.col-3cm #page > .container > .main > .main-inner.group > .content {
        grid-column: 1 !important;
        min-width: 0 !important;
        width: auto !important;
        float: none !important;
      }

      body.home.blog.col-3cm #page > .container > .main > .main-inner.group > .sidebar.s1 {
        display: none !important;
      }

      body.home.blog.col-3cm #page > .container > .main > .main-inner.group > .sidebar.s2 {
        grid-column: 2 !important;
        width: 320px !important;
        max-width: 320px !important;
        min-width: 0 !important;
        margin: 0 !important;
        float: none !important;
        position: sticky !important;
        top: 18px !important;
      }

      body.home.blog.col-3cm .content {
        min-width: 0 !important;
      }

      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid {
        grid-template-columns: repeat(var(--mrm-grid-desktop), minmax(220px, 1fr)) !important;
        gap: var(--mrm-grid-gap) !important;
        row-gap: var(--mrm-grid-gap) !important;
      }

      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > nav.pagination,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > .pagination,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > .wp-pagenavi {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-wrap: wrap !important;
        gap: 10px !important;
        padding: 10px 0 4px !important;
        margin: 4px 0 0 !important;
      }

      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > nav.pagination a,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > nav.pagination span,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > .pagination a,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > .pagination span,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > .wp-pagenavi a,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > .wp-pagenavi span {
        min-width: 42px !important;
        height: 42px !important;
        padding: 0 14px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 12px !important;
        background: rgba(255,255,255,.035) !important;
        border: 1px solid var(--mrm-line) !important;
        color: var(--mrm-text) !important;
        text-decoration: none !important;
      }

      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > nav.pagination .current,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > .pagination .current,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > .wp-pagenavi .current {
                border-color: rgba(124,92,255,.55) !important;
      }

      body.home.blog.col-3cm article.post-standard,
      body.home.blog.col-3cm article.post {
        padding: 14px !important;
        gap: 12px !important;
      }

      body.home.blog.col-3cm article.post-standard .post-inner,
      body.home.blog.col-3cm article.post .post-inner {
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
        min-height: 100% !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      body.home.blog.col-3cm article.post-standard .post-thumbnail,
      body.home.blog.col-3cm article.post .post-thumbnail {
        margin: 0 !important;
        border-radius: 16px !important;
        overflow: hidden !important;
        border: 1px solid var(--mrm-line) !important;
        background: var(--mrm-panel-2) !important;
        aspect-ratio: var(--mrm-cover-ratio) !important;
      }

      body.home.blog.col-3cm article.post-standard .post-thumbnail > a:first-child,
      body.home.blog.col-3cm article.post .post-thumbnail > a:first-child {
        display: block !important;
        width: 100% !important;
        height: 100% !important;
      }

      body.home.blog.col-3cm article.post-standard .post-thumbnail img,
      body.home.blog.col-3cm article.post .post-thumbnail img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        display: block !important;
      }

      body.home.blog.col-3cm article.post-standard .post-comments,
      body.home.blog.col-3cm article.post .post-comments {
        position: absolute !important;
        top: 10px !important;
        right: 10px !important;
        z-index: 2 !important;
      }

      body.home.blog.col-3cm article.post-standard .post-content,
      body.home.blog.col-3cm article.post .post-content {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        flex: 1 1 auto !important;
        min-height: 0 !important;
      }

      body.home.blog.col-3cm article.post-standard .post-title,
      body.home.blog.col-3cm article.post .post-title {
        margin: 0 !important;
        font-size: 15px !important;
        line-height: 1.38 !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 3 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        min-height: calc(1.38em * 4) !important;
      }

      body.home.blog.col-3cm article.post-standard .post-title a,
      body.home.blog.col-3cm article.post .post-title a {
        color: var(--mrm-text) !important;
      }

      body.home.blog.col-3cm article.post-standard .post-title,
      body.home.blog.col-3cm article.post-standard .post-title a,
      body.home.blog.col-3cm article.post .post-title,
      body.home.blog.col-3cm article.post .post-title a,
      body.home.blog.col-3cm article.post-standard .post-category,
      body.home.blog.col-3cm article.post .post-category {
        word-break: normal !important;
        overflow-wrap: break-word !important;
        white-space: normal !important;
      }

      body.home.blog.col-3cm article.post-standard .post-category,
      body.home.blog.col-3cm article.post .post-category {
        min-height: calc(1.35em * 2) !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
      }

      body.home.blog.col-3cm article.post-standard .post-date,
      body.home.blog.col-3cm article.post .post-date {
        margin-top: auto !important;
        padding-top: 2px !important;
      }

      body.home.blog.col-3cm article.post-standard .more-link-custom,
      body.home.blog.col-3cm article.post .more-link-custom {
        position: absolute !important;
        inset: auto 12px 12px auto !important;
        z-index: 2 !important;
        opacity: .92 !important;
      }

      @media (max-width: 1480px) {
        body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid {
          grid-template-columns: repeat(var(--mrm-grid-tablet), minmax(200px, 1fr)) !important;
        }
      }

      @media (max-width: 1320px) {
        body.home.blog.col-3cm #page > .container > .main > .main-inner.group {
          grid-template-columns: minmax(0, 1fr) 286px !important;
          gap: 20px !important;
        }

        body.home.blog.col-3cm #page > .container > .main > .main-inner.group > .sidebar.s2 {
          width: 286px !important;
          max-width: 286px !important;
        }
      }

      @media (max-width: 1100px) {
        body.home.blog.col-3cm #page > .container > .main > .main-inner.group {
          grid-template-columns: 1fr !important;
        }

        body.home.blog.col-3cm #page > .container > .main > .main-inner.group > .sidebar.s2 {
          grid-column: 1 !important;
          width: auto !important;
          max-width: none !important;
          position: static !important;
          top: auto !important;
        }

        body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 820px) {
        body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 560px) {
        body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid {
          grid-template-columns: 1fr !important;
        }
      }

      article.entry,
      article.post,
      article.post-standard,
      article.hentry {
        float: none !important;
        clear: none !important;
        min-width: 0 !important;
        width: auto !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 12px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
                border: 1px solid var(--mrm-line) !important;
        border-radius: 22px !important;
        box-shadow: var(--mrm-shadow) !important;
        overflow: visible !important;
        min-height: 100% !important;
        position: relative !important;
        transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease !important;
      }

      article.entry:hover,
      article.post:hover,
      article.post-standard:hover,
      article.hentry:hover {
        transform: translateY(-4px) !important;
        border-color: var(--mrm-line-2) !important;
        box-shadow: var(--mrm-shadow-lg) !important;
      }

      .mrm-hidden-card {
        display: none !important;
      }

      article.entry .entry-content,
      article.post .entry-content,
      article.post-standard .entry-content,
      article.hentry .entry-content {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        flex: 1 1 auto !important;
      }

      article.entry .entry-header,
      article.post .entry-header,
      article.post-standard .entry-header,
      article.hentry .entry-header {
        margin: 0 !important;
        flex: 0 0 auto !important;
      }

      article.entry .entry-title,
      article.post .entry-title,
      article.post-standard .entry-title,
      article.hentry .entry-title {
        margin: 0 !important;
        font-size: 15px !important;
        line-height: 1.35 !important;
        font-weight: 700 !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 3 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        min-height: calc(1.35em * 3) !important;
      }

      article.entry .entry-title-link,
      article.post .entry-title-link,
      article.post-standard .entry-title-link,
      article.hentry .entry-title-link {
        color: var(--mrm-text) !important;
      }

      article.entry .entry-image-link,
      article.post .entry-image-link,
      article.post-standard .entry-image-link,
      article.hentry .entry-image-link {
        display: block !important;
        overflow: hidden !important;
        aspect-ratio: var(--mrm-cover-ratio) !important;
        border-radius: 16px !important;
        border: 1px solid var(--mrm-line) !important;
        background: var(--mrm-panel-2) !important;
        flex: 0 0 auto !important;
      }

      article.entry .entry-image,
      article.entry .post-image,
      article.post .entry-image,
      article.post .post-image,
      article.post-standard .entry-image,
      article.post-standard .post-image,
      article.hentry .entry-image,
      article.hentry .post-image {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        display: block !important;
      }

      .mrm-chip-row-wrap {
        position: relative !important;
        flex: 0 0 auto !important;
      }

      .mrm-tag-row {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 6px !important;
        margin: 0 !important;
        padding: 0 !important;
        min-height: 54px !important;
        max-height: 54px !important;
        overflow: hidden !important;
        align-content: flex-start !important;
      }

      .mrm-chip,
      .mrm-chip-overflow-button,
      .mrm-chip-overflow-count {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 24px !important;
        padding: 0 9px !important;
        border-radius: 999px !important;
                background: rgba(255,255,255,.05) !important;
        color: #dbe4f2 !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        line-height: 1 !important;
        white-space: nowrap !important;
      }

      .mrm-chip {
        cursor: default !important;
        user-select: none !important;
      }

      .mrm-chip-overflow-count {
        background: rgba(255,207,109,.12) !important;
        color: #ffe2a3 !important;
      }

      .mrm-chip-overflow-button {
        cursor: pointer !important;
        background: rgba(124,92,255,.14) !important;
        color: #e1d7ff !important;
      }

      .mrm-chip--lang { background: rgba(37,194,160,.14) !important; color: #b2f5e7 !important; }
      .mrm-chip--category { background: rgba(124,92,255,.16) !important; color: #dfd5ff !important; }
      .mrm-chip--genre { background: rgba(255,255,255,.06) !important; }
      .mrm-chip--tag { background: rgba(255,255,255,.04) !important; }
      .mrm-chip--artist,
      .mrm-chip--group { background: rgba(255,92,143,.11) !important; color: #ffc4d7 !important; }
      .mrm-chip--pairing { background: rgba(255,188,92,.12) !important; color: #ffd9a8 !important; }

      .mrm-chip-popover {
        position: absolute !important;
        left: 0 !important;
        top: calc(100% + 8px) !important;
        z-index: 40 !important;
        width: min(320px, calc(100vw - 32px)) !important;
        padding: 10px !important;
        border-radius: 14px !important;
                background: rgba(10,16,28,.97) !important;
        box-shadow: var(--mrm-shadow) !important;
                display: flex !important;
        flex-wrap: wrap !important;
        gap: 6px !important;
        opacity: 0 !important;
        pointer-events: none !important;
        transform: translateY(6px) !important;
        transition: opacity .16s ease, transform .16s ease !important;
      }

      @media (hover: hover) and (pointer: fine) {
        .mrm-chip-row-wrap:hover .mrm-chip-popover,
        .mrm-chip-row-wrap:focus-within .mrm-chip-popover,
        .entry-title:hover + .mrm-chip-row-wrap .mrm-chip-popover,
        .entry-title:focus-within + .mrm-chip-row-wrap .mrm-chip-popover,
        .post-title:hover + .mrm-chip-row-wrap .mrm-chip-popover,
        .post-title:focus-within + .mrm-chip-row-wrap .mrm-chip-popover,
        h1:hover + .mrm-chip-row-wrap .mrm-chip-popover,
        h1:focus-within + .mrm-chip-row-wrap .mrm-chip-popover,
        h2:hover + .mrm-chip-row-wrap .mrm-chip-popover,
        h2:focus-within + .mrm-chip-row-wrap .mrm-chip-popover,
        h3:hover + .mrm-chip-row-wrap .mrm-chip-popover,
        h3:focus-within + .mrm-chip-row-wrap .mrm-chip-popover,
        h4:hover + .mrm-chip-row-wrap .mrm-chip-popover,
        h4:focus-within + .mrm-chip-row-wrap .mrm-chip-popover {
          opacity: 1 !important;
          pointer-events: auto !important;
          transform: translateY(0) !important;
        }
      }

      .mrm-chip-popover.is-open {
        opacity: 1 !important;
        pointer-events: auto !important;
        transform: translateY(0) !important;
      }

      .entry .entry-pagination.pagination {
        margin-top: auto !important;
        margin-bottom: 0 !important;
        justify-content: flex-start !important;
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
        align-items: center !important;
        padding-top: 6px !important;
        border: 0 !important;
        background: transparent !important;
      }

      .entry .entry-pagination.pagination .page-numbers {
        min-width: 30px !important;
        height: 30px !important;
        padding: 0 10px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 999px !important;
        border: 1px solid var(--mrm-line) !important;
        background: rgba(255,255,255,.04) !important;
        color: var(--mrm-muted) !important;
        font-size: 12px !important;
        font-weight: 700 !important;
      }

      .entry .entry-pagination.pagination .page-numbers.current {
        background: rgba(124,92,255,.18) !important;
        border-color: rgba(124,92,255,.4) !important;
        color: #fff !important;
      }

      .archive-pagination,
      nav.pagination,
      .pagination,
      .wp-pagenavi,
      .navigation.pagination,
      main.content > .archive-pagination,
      main.content > .navigation.pagination,
      main.content > .pagination,
      .content-archive + .archive-pagination,
      .content-archive + .navigation.pagination,
      .content-archive + .pagination,
      .mrm-results-grid > .archive-pagination,
      .mrm-results-grid > nav.pagination,
      .mrm-results-grid > .navigation.pagination,
      .mrm-results-grid > .pagination,
      .mrm-results-grid > .wp-pagenavi,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > nav.pagination,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > .navigation.pagination,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > .pagination,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.mrm-results-grid > .wp-pagenavi {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 10px !important;
        flex-wrap: wrap !important;
        margin: 8px 0 18px !important;
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        grid-column: 1 / -1 !important;
        width: 100% !important;
      }

      .archive-pagination .page-numbers,
      .archive-pagination a,
      .archive-pagination span,
      .navigation.pagination .page-numbers,
      .navigation.pagination a,
      .navigation.pagination span,
      nav.pagination .page-numbers,
      nav.pagination a,
      nav.pagination span,
      .pagination .page-numbers,
      .pagination a,
      .pagination span,
      .wp-pagenavi .page,
      .wp-pagenavi .current,
      .wp-pagenavi a,
      .wp-pagenavi span {
        min-width: 42px !important;
        height: 42px !important;
        padding: 0 16px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 999px !important;
        border: 1px solid var(--mrm-line) !important;
                color: #dbe4f2 !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        text-decoration: none !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.03), 0 10px 24px rgba(0,0,0,.18) !important;
        transition: transform .18s ease, border-color .18s ease, background .18s ease, color .18s ease !important;
      }

      .archive-pagination .dots,
      .navigation.pagination .dots,
      nav.pagination .dots,
      .pagination .dots,
      .wp-pagenavi .extend {
        min-width: auto !important;
        width: auto !important;
        padding: 0 4px !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        color: var(--mrm-muted) !important;
      }

      .archive-pagination a:hover,
      .archive-pagination .page-numbers:hover,
      .navigation.pagination a:hover,
      .navigation.pagination .page-numbers:hover,
      nav.pagination a:hover,
      nav.pagination .page-numbers:hover,
      .pagination a:hover,
      .pagination .page-numbers:hover,
      .wp-pagenavi a:hover,
      .wp-pagenavi .page:hover {
        color: #fff !important;
        border-color: rgba(124,92,255,.45) !important;
                transform: translateY(-1px) !important;
      }

      .archive-pagination .current,
      .archive-pagination .active a,
      .navigation.pagination .current,
      .navigation.pagination .page-numbers.current,
      nav.pagination .current,
      nav.pagination .page-numbers.current,
      .pagination .current,
      .pagination .page-numbers.current,
      .wp-pagenavi .current {
                border-color: rgba(124,92,255,.52) !important;
        color: #fff !important;
        box-shadow: 0 12px 28px rgba(0,0,0,.22), 0 0 0 1px rgba(124,92,255,.14) !important;
      }

      .footer-widgets {
        margin-top: 18px !important;
        padding-top: 8px !important;
        border-top: 1px solid rgba(255,255,255,.05) !important;
        background: transparent !important;
      }

      .footer-widgets .wrap {
        max-width: var(--mrm-wrap) !important;
        margin: 0 auto !important;
        padding-top: 0 !important;
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
        gap: 22px !important;
        align-items: start !important;
      }

      .footer-widgets .wrap > .widget-area {
        display: block !important;
        float: none !important;
        clear: none !important;
        min-width: 0 !important;
        width: 100% !important;
        margin: 0 !important;
      }

      .footer-widgets .wrap > .widget-area > .widget,
      .footer-widgets .wrap > .widget-area > section.widget {
        margin: 0 !important;
        min-height: 100% !important;
        padding: 18px 18px 16px !important;
        border-radius: var(--mrm-radius) !important;
        border: 1px solid var(--mrm-line) !important;
                box-shadow: var(--mrm-shadow) !important;
        height: 100% !important;
      }

      .footer-widgets .widget-wrap {
        margin: 0 !important;
      }

      .footer-widgets .widget-title,
      .footer-widgets h2,
      .footer-widgets h3,
      .footer-widgets h4 {
        margin: 0 0 14px !important;
        font-size: 1.02rem !important;
        font-weight: 800 !important;
        letter-spacing: -0.01em !important;
        color: var(--mrm-text) !important;
      }

      .footer-widgets .textwidget,
      .footer-widgets .tagcloud {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
        align-items: flex-start !important;
      }

      .footer-widgets .tagcloud a,
      .footer-widgets .textwidget a {
        display: inline-flex !important;
        align-items: center !important;
        min-height: 30px !important;
        padding: 0 11px !important;
        border-radius: 999px !important;
        border: 1px solid var(--mrm-line) !important;
        background: rgba(255,255,255,.04) !important;
        color: #d7e0ec !important;
        font-size: 13px !important;
        line-height: 1 !important;
        transition: .18s ease !important;
      }

      .footer-widgets .tagcloud a:hover,
      .footer-widgets .textwidget a:hover {
        color: #fff !important;
        border-color: var(--mrm-line-2) !important;
        background: rgba(255,255,255,.06) !important;
      }

      .footer-widgets .widget_nav_menu ul,
      .footer-widgets .widget_categories ul,
      .footer-widgets .widget_meta ul,
      .footer-widgets .widget_pages ul {
        list-style: none !important;
        margin: 0 !important;
        padding: 0 !important;
        display: grid !important;
        gap: 8px !important;
      }

      .footer-widgets .widget_nav_menu li a,
      .footer-widgets .widget_categories li a,
      .footer-widgets .widget_meta li a,
      .footer-widgets .widget_pages li a {
        display: flex !important;
        align-items: center !important;
        min-height: 38px !important;
        padding: 0 12px !important;
        border-radius: 12px !important;
        border: 1px solid transparent !important;
        background: rgba(255,255,255,.03) !important;
        color: var(--mrm-muted) !important;
        transition: .18s ease !important;
      }

      .footer-widgets .widget_nav_menu li a:hover,
      .footer-widgets .widget_categories li a:hover,
      .footer-widgets .widget_meta li a:hover,
      .footer-widgets .widget_pages li a:hover {
        color: var(--mrm-text) !important;
        border-color: var(--mrm-line) !important;
        background: rgba(255,255,255,.05) !important;
      }

      .site-footer {
        margin-top: 18px !important;
        clear: both !important;
        border-top: 1px solid rgba(255,255,255,.05) !important;
        background: transparent !important;
        color: var(--mrm-muted) !important;
      }

      .site-footer .wrap {
        max-width: 920px !important;
        margin: 0 auto !important;
        padding-top: 22px !important;
        padding-bottom: 28px !important;
        display: grid !important;
        gap: 16px !important;
        justify-items: center !important;
        text-align: center !important;
      }

      .site-footer .nav-secondary,
      .site-footer .nav-secondary .wrap {
        width: 100% !important;
        max-width: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .site-footer .nav-secondary .menu,
      .site-footer .nav-secondary .genesis-nav-menu,
      .site-footer #menu-second {
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
        gap: 10px !important;
        list-style: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .site-footer .nav-secondary li {
        margin: 0 !important;
        float: none !important;
      }

      .site-footer .nav-secondary a,
      .site-footer .nav-secondary a:visited,
      .site-footer a {
        display: inline-flex !important;
        align-items: center !important;
        min-height: 34px !important;
        padding: 0 12px !important;
        border-radius: 999px !important;
        border: 1px solid var(--mrm-line) !important;
        background: rgba(255,255,255,.035) !important;
        color: #d8e1ed !important;
        font-size: 13px !important;
        font-weight: 700 !important;
      }

      .site-footer .copyright,
      .site-footer p {
        margin: 0 !important;
        max-width: 78ch !important;
        color: var(--mrm-muted) !important;
        font-size: 13px !important;
      }

      .mrm-panel-toggle {
        position: fixed;
        z-index: 2147483001;
        width: 46px;
        height: 46px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.08);
                color: #fff;
        cursor: pointer;
        box-shadow: 0 14px 30px rgba(124,92,255,.32);
        bottom: 18px;
      }

      .mrm-panel-toggle.is-left { left: 18px; }
      .mrm-panel-toggle.is-right { right: 18px; }

      .mrm-panel {
        position: fixed;
        z-index: 2147483000;
        width: min(380px, calc(100vw - 24px));
        max-height: min(78vh, 900px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: 18px;
        background: rgba(10,16,28,.96);
        border: 1px solid rgba(255,255,255,.08);
        box-shadow: var(--mrm-shadow);
                color: var(--mrm-text);
        bottom: 74px;
      }

      .mrm-panel.is-left { left: 18px; }
      .mrm-panel.is-right { right: 18px; }

      .mrm-panel[hidden] {
        display: none !important;
      }

      .mrm-panel__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 12px 12px 8px;
        border-bottom: 1px solid rgba(255,255,255,.06);
      }

      .mrm-panel__title {
        font-size: 13px;
        font-weight: 800;
      }

      .mrm-panel__actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .mrm-btn {
        min-height: 28px;
        padding: 0 10px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(255,255,255,.04);
        color: var(--mrm-text);
        font: inherit;
        cursor: pointer;
      }

      .mrm-tabs {
        display: flex;
        gap: 8px;
        padding: 10px 12px 0;
      }

      .mrm-tab {
        flex: 1 1 0;
      }

      .mrm-tab.is-active {
        background: rgba(124,92,255,.18);
        border-color: rgba(124,92,255,.35);
      }

      .mrm-panel__body {
        overflow: auto;
        padding: 12px;
      }

      .mrm-tab-panel[hidden] {
        display: none !important;
      }

      .mrm-help {
        color: var(--mrm-muted);
        font-size: 11px;
        margin-bottom: 12px;
      }

      .mrm-results-summary {
        margin: 0 0 12px;
        color: var(--mrm-muted);
        font-size: 12px;
      }

      .mrm-field {
        display: grid;
        gap: 6px;
        margin-bottom: 12px;
      }

      .mrm-field span {
        font-size: 12px;
        font-weight: 700;
      }

      .mrm-field input,
      .mrm-field select {
        min-height: 38px;
        padding: 0 12px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(255,255,255,.04);
        color: var(--mrm-text);
      }

      .mrm-check {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 34px;
        margin-bottom: 10px;
      }

      .mrm-check input {
        margin: 0;
      }

      .mrm-grid-controls {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px 10px;
        align-items: center;
      }

      .mrm-grid-controls input[type="range"] {
        width: 100%;
        grid-column: 1 / -1;
      }

      .mrm-grid-value {
        color: var(--mrm-muted);
        min-width: 28px;
        text-align: right;
      }

      .mrm-toolbar-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }

      #backToTop {
        width: 46px !important;
        height: 46px !important;
        right: 18px !important;
        bottom: 18px !important;
        border-radius: 999px !important;
                box-shadow: 0 12px 24px rgba(124,92,255,.28) !important;
      }

      @media (max-width: 980px) {
        .footer-widgets .wrap {
          grid-template-columns: 1fr !important;
        }
      }

      @media (max-width: 920px) {
        .header-widget-area {
          grid-template-columns: 1fr !important;
        }

        .search-form {
          min-height: 64px !important;
        }

        .content-archive,
        .mrm-results-grid {
          grid-template-columns: repeat(var(--mrm-grid-mobile), minmax(0, 1fr)) !important;
        }

        .mrm-panel.is-right { right: 12px; }
        .mrm-panel.is-left { left: 12px; }
        .mrm-panel { bottom: 64px; }

        .mrm-panel-toggle.is-right { right: 12px; }
        .mrm-panel-toggle.is-left { left: 12px; }
        .mrm-panel-toggle { bottom: 12px; }

        .mrm-chip-popover {
          width: min(280px, calc(100vw - 28px)) !important;
        }
      }

      @media (max-width: 620px) {
        .nav-primary .wrap,
        .site-header .wrap,
        .site-inner .wrap,
        .footer-widgets .wrap,
        .site-footer .wrap {
          padding-left: 14px !important;
          padding-right: 14px !important;
        }

        .content-archive,
        .mrm-results-grid {
          grid-template-columns: 1fr !important;
          gap: 14px !important;
        }

        article.entry,
      article.post,
      article.post-standard,
      article.hentry {
          border-radius: 18px !important;
        }

        article.entry .entry-image-link,
      article.post .entry-image-link,
      article.post-standard .entry-image-link,
      article.hentry .entry-image-link {
          border-radius: 14px !important;
        }

        main.content > .archive-pagination .page-numbers,
        main.content > .navigation.pagination .page-numbers,
        main.content > .pagination .page-numbers,
        .content-archive + .archive-pagination .page-numbers,
        .content-archive + .navigation.pagination .page-numbers,
        .content-archive + .pagination .page-numbers,
        main.content > .archive-pagination a,
        main.content > .archive-pagination span {
          min-width: 38px !important;
          height: 38px !important;
          padding-inline: 13px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function applyGridVars() {
    const root = document.documentElement;
    root.style.setProperty("--mrm-grid-desktop", String(state.grid.desktopCols));
    root.style.setProperty("--mrm-grid-tablet", String(state.grid.tabletCols));
    root.style.setProperty("--mrm-grid-mobile", String(state.grid.mobileCols));
    root.style.setProperty("--mrm-grid-gap", `${state.grid.gap}px`);
    root.style.setProperty("--mrm-cover-ratio", `${state.grid.coverRatioW} / ${state.grid.coverRatioH}`);
  }

  function hideAds() {
    const selectors = [
      ".after_4th_post",
      ".top_page",
      ".widget_custom_html",
      "ins[data-zoneid]",
      "iframe[src*='doubleclick']",
      "iframe[src*='ads']",
      "iframe[src*='traffic']",
      "iframe[src*='pop']",
      ".offer.menu-item",
      ".ad-wrapper",
      ".advertisement",
      "[class*='ad-']",
      "[class*='ads-']",
      "[id*='ad-']",
      "[id*='ads-']",
    ];

    for (const el of document.querySelectorAll(selectors.join(","))) {
      el.remove();
    }
  }

  function createChip(family, item) {
    const chip = document.createElement("span");
    chip.className = `mrm-chip mrm-chip--${family}`;
    chip.textContent = item.text;
    chip.title = item.text;
    return chip;
  }

  function closeAllChipPopovers(except = null) {
    document.querySelectorAll(".mrm-chip-popover.is-open").forEach((node) => {
      if (except && node === except) return;
      node.classList.remove("is-open");
    });
  }

  function injectCardChips(article, meta) {
    let wrap = article.querySelector(":scope > .mrm-chip-row-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "mrm-chip-row-wrap";
      const header = article.querySelector(":scope > .entry-header");
      if (header) {
        article.insertBefore(wrap, header);
      } else {
        article.prepend(wrap);
      }
    }

    const chipModel = buildChipModel(meta);
    const limit = getChipLimit();
    const visible = chipModel.slice(0, limit);
    const hidden = chipModel.slice(limit);

    const signature = JSON.stringify({
      visible: visible.map(({ family, item }) => [family, item.raw]),
      hidden: hidden.map(({ family, item }) => [family, item.raw]),
      mobile: isMobileView(),
    });

    if (wrap.dataset.signature === signature) return;
    wrap.dataset.signature = signature;
    wrap.replaceChildren();

    const row = document.createElement("div");
    row.className = "mrm-tag-row";
    row.append(...visible.map(({ family, item }) => createChip(family, item)));
    wrap.appendChild(row);

    if (!hidden.length) return;

    const clueCount = document.createElement(isMobileView() ? "button" : "span");
    clueCount.className = isMobileView() ? "mrm-chip-overflow-button" : "mrm-chip-overflow-count";
    clueCount.textContent = `+${hidden.length}`;
    clueCount.title = `${hidden.length} more`;
    row.appendChild(clueCount);

    const popover = document.createElement("div");
    popover.className = "mrm-chip-popover";
    popover.append(...chipModel.map(({ family, item }) => createChip(family, item)));
    wrap.appendChild(popover);

    if (isMobileView()) {
      clueCount.type = "button";
      clueCount.setAttribute("aria-expanded", "false");
      clueCount.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const open = !popover.classList.contains("is-open");
        closeAllChipPopovers(popover);
        popover.classList.toggle("is-open", open);
        clueCount.setAttribute("aria-expanded", String(open));
      });
    }
  }

  function closeMobileChipPopoversOnOutsideClick() {
    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(".mrm-chip-row-wrap")) return;
      closeAllChipPopovers();
    });
  }

  function applyPanelSide() {
    const panel = getCachedElementById("mrm-panel");
    const toggle = getCachedElementById("mrm-panel-toggle");
    if (!panel || !toggle) return;

    panel.classList.toggle("is-left", state.archive.dock === "left");
    panel.classList.toggle("is-right", state.archive.dock !== "left");
    toggle.classList.toggle("is-left", state.archive.dock === "left");
    toggle.classList.toggle("is-right", state.archive.dock !== "left");
  }

  function markCards() {
    const readPosts = getReadPosts();
    const articles = findCards();

    state.cards = articles.map((article, index) => {
      const titleText = getCardTitle(article);
      const href = getCardHref(article);
      const meta = extractCardMeta(article);
      const articleText = slugify(article.textContent);
      const titleSlug = slugify(titleText);
      const metaTerms = META_FAMILIES
        .flatMap((family) => (meta?.[family.key] || []).map((item) => `${item.text || item.raw} ${item.raw}`))
        .join(" ");
      const classText = Array.from(article.classList || []).join(" ");
      const searchHaystack = slugify(`${titleText} ${metaTerms} ${articleText} ${classText}`);
      const english = /\benglish\b/.test(searchHaystack) || /\beng\b/.test(searchHaystack) || meta.lang.some((item) => item.raw === "english");
      const id = href || `${location.pathname}::${titleText || index}`;
      const isRead = readPosts.has(id);

      article.dataset.mrmId = id;
      article.dataset.mrmTitle = titleSlug;
      article.dataset.mrmEnglish = english ? "1" : "0";
      article.dataset.mrmOrder = String(index);
      article.classList.toggle("mrm-read", isRead);

      injectCardChips(article, meta);
      injectReaderTrigger(article);

      return {
        article,
        id,
        title: titleSlug,
        titleText,
        english,
        meta,
        articleText,
        searchHaystack,
        classText,
        isRead,
        isHidden: false,
        facetValues: {},
        facetValueSets: {},
      };
    });

    state.cardContainer = resolveCardContainer(articles);
    state.archivePerf.cardSignature = state.cards.map((card) => card.id).join("|");
    refreshResultsGridClass();
  }

  function sortCards() {
    const container = state.cardContainer || resolveCardContainer(state.cards.map((card) => card.article));
    if (!container || !state.cards.length) return;

    const sortKey = `${state.archive.sort}|${state.archivePerf.cardSignature}`;
    if (state.archivePerf.lastSortApplied === sortKey) return;

    const sorted = [...state.cards].sort((a, b) => {
      if (state.archive.sort === "title-asc") return a.title.localeCompare(b.title);
      if (state.archive.sort === "title-desc") return b.title.localeCompare(a.title);
      if (state.archive.sort === "english-first") {
        if (a.english === b.english) return Number(a.article.dataset.mrmOrder) - Number(b.article.dataset.mrmOrder);
        return a.english ? -1 : 1;
      }
      return Number(a.article.dataset.mrmOrder) - Number(b.article.dataset.mrmOrder);
    });

    const currentOrder = Array.from(container.children)
      .map((node) => (node instanceof HTMLElement ? node.dataset.mrmId || "" : ""))
      .filter(Boolean);
    const nextOrder = sorted.map((card) => card.id);

    if (currentOrder.join("|") !== nextOrder.join("|")) {
      const fragment = document.createDocumentFragment();
      for (const card of sorted) {
        fragment.appendChild(card.article);
      }
      container.appendChild(fragment);
    }

    state.archivePerf.lastSortApplied = sortKey;
  }


  function applyArchiveFilter() {
    const q = slugify(state.archive.q);
    const facets = getAvailableFilterFacets();
    const activeFacetState = [];
    for (const facet of facets) {
      const selection = getFacetSelectionMap(facet.key);
      const include = new Set();
      const exclude = new Set();
      for (const [key, mode] of Object.entries(selection)) {
        if (mode === "include") include.add(key);
        else if (mode === "exclude") exclude.add(key);
      }
      if (include.size || exclude.size) {
        activeFacetState.push({ facet, include, exclude });
      }
    }

    let visible = 0;

    for (const card of state.cards) {
      const article = card.article;
      card.isRead = article.classList.contains("mrm-read");

      const matchesQuery = !q || card.searchHaystack.includes(q);
      const matchesRead = !state.archive.hideRead || !card.isRead;
      const matchesEnglish = !state.archive.onlyEnglish || card.english;

      let matchesFacets = true;
      for (const entry of activeFacetState) {
        const values = getCardFacetValueSet(card, entry.facet);

        if (entry.include.size) {
          let hasIncludedValue = false;
          for (const value of entry.include) {
            if (values.has(value)) {
              hasIncludedValue = true;
              break;
            }
          }
          if (!hasIncludedValue) {
            matchesFacets = false;
            break;
          }
        }

        if (matchesFacets && entry.exclude.size) {
          for (const value of entry.exclude) {
            if (values.has(value)) {
              matchesFacets = false;
              break;
            }
          }
          if (!matchesFacets) break;
        }
      }

      const show = matchesQuery && matchesRead && matchesEnglish && matchesFacets;
      const nextHidden = !show;
      if (card.isHidden !== nextHidden) {
        article.classList.toggle("mrm-hidden-card", nextHidden);
        card.isHidden = nextHidden;
      }
      if (show) visible += 1;
    }

    const summary = getCachedElementById("mrm-results-summary");
    if (summary) summary.textContent = `Showing ${visible} of ${state.cards.length} results`;

    const activeCount = getCachedElementById("mrm-active-filter-count");
    if (activeCount) activeCount.textContent = String(getActiveFilterCount());
  }

  function trackReadClicks() {
    document.addEventListener(
      "click",
      (event) => {
        const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (!anchor) return;
        const card = anchor.closest("[data-mrm-id]");
        if (!(card instanceof HTMLElement) || !card.dataset.mrmId) return;

        const readPosts = getReadPosts();
        readPosts.add(card.dataset.mrmId);
        saveReadPosts(readPosts);
        card.classList.add("mrm-read");
        applyArchiveFilter();
      },
      true
    );
  }

  function markVisiblePageRead() {
    const readPosts = getReadPosts();

    for (const card of state.cards) {
      if (card.article.classList.contains("mrm-hidden-card")) continue;
      readPosts.add(card.id);
      card.article.classList.add("mrm-read");
    }

    saveReadPosts(readPosts);
    applyArchiveFilter();
  }

  function createPanel() {
    if (getCachedElementById("mrm-panel")) return;

    hideUiRestoreToggle();

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.id = "mrm-panel-toggle";
    toggle.className = "mrm-panel-toggle";
    toggle.textContent = "⚙";

    const panel = document.createElement("section");
    panel.id = "mrm-panel";
    panel.className = "mrm-panel";
    panel.hidden = !state.ui.panelOpen;

    const head = document.createElement("div");
    head.className = "mrm-panel__head";

    const title = document.createElement("div");
    title.className = "mrm-panel__title";
    title.textContent = "Settings Panel";

    const actions = document.createElement("div");
    actions.className = "mrm-panel__actions";

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "mrm-btn";
    resetBtn.textContent = "Reset";

    actions.append(resetBtn);
    head.append(title, actions);

    const tabs = document.createElement("div");
    tabs.className = "mrm-tabs";

    const filtersTab = document.createElement("button");
    filtersTab.type = "button";
    filtersTab.className = "mrm-btn mrm-tab";
    filtersTab.dataset.tab = "filters";
    filtersTab.textContent = "Filters";

    const gridTab = document.createElement("button");
    gridTab.type = "button";
    gridTab.className = "mrm-btn mrm-tab";
    gridTab.dataset.tab = "grid";
    gridTab.textContent = "Grid";

    const themeTab = document.createElement("button");
    themeTab.type = "button";
    themeTab.className = "mrm-btn mrm-tab";
    themeTab.dataset.tab = "theme";
    themeTab.textContent = "Theme";

    tabs.append(filtersTab, gridTab, themeTab);

    const body = document.createElement("div");
    body.className = "mrm-panel__body";

    const filtersPane = document.createElement("div");
    filtersPane.id = "mrm-tab-filters";
    filtersPane.className = "mrm-tab-panel";

    const gridPane = document.createElement("div");
    gridPane.id = "mrm-tab-grid";
    gridPane.className = "mrm-tab-panel";

    const themePane = document.createElement("div");
    themePane.id = "mrm-tab-theme";
    themePane.className = "mrm-tab-panel";

    body.append(filtersPane, gridPane, themePane);
    panel.append(head, tabs, body);
    document.body.append(panel, toggle);

    toggle.addEventListener("click", () => {
      state.ui.panelOpen = panel.hidden;
      panel.hidden = !panel.hidden;
      saveState();
    });

    filtersTab.addEventListener("click", () => setActiveTab("filters"));
    gridTab.addEventListener("click", () => setActiveTab("grid"));
    themeTab.addEventListener("click", () => setActiveTab("theme"));
    resetBtn.addEventListener("click", resetFiltersAndGrid);

    ensureFacetModal();
    renderFiltersPane();
    renderGridPane();
    renderThemePane();
    setActiveTab(state.ui.activeTab);
    applyPanelSide();
  }

  function setActiveTab(tab) {
    state.ui.activeTab = tab;
    saveState();

    document.querySelectorAll(".mrm-tab").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.tab === tab);
    });

    document.querySelectorAll(".mrm-tab-panel").forEach((node) => {
      node.hidden = node.id !== `mrm-tab-${tab}`;
    });
  }


  const FACET_FAMILY_ORDER = ["lang", "category", "genre", "tag", "artist", "pairing", "group"];
  const FACET_FAMILY_LABELS = {
    lang: "Language",
    category: "Category",
    genre: "Genre",
    tag: "Tag",
    artist: "Artist",
    pairing: "Pairing",
    group: "Group",
  };

  function getFacetSelectionMap(facetKey) {
    if (!state.archive.termModes || typeof state.archive.termModes !== "object") state.archive.termModes = {};
    if (!state.archive.termModes[facetKey] || typeof state.archive.termModes[facetKey] !== "object") {
      state.archive.termModes[facetKey] = {};
    }
    return state.archive.termModes[facetKey];
  }

  function getFacetSearchValue(facetKey) {
    if (!state.archive.facetSearch || typeof state.archive.facetSearch !== "object") state.archive.facetSearch = {};
    return state.archive.facetSearch[facetKey] || "";
  }

  function setFacetSearchValue(facetKey, value) {
    if (!state.archive.facetSearch || typeof state.archive.facetSearch !== "object") state.archive.facetSearch = {};
    state.archive.facetSearch[facetKey] = value;
  }

  function getFacetPageValue(facetKey) {
    if (!state.archive.facetPage || typeof state.archive.facetPage !== "object") state.archive.facetPage = {};
    return Math.max(1, Number(state.archive.facetPage[facetKey]) || 1);
  }

  function setFacetPageValue(facetKey, value) {
    if (!state.archive.facetPage || typeof state.archive.facetPage !== "object") state.archive.facetPage = {};
    state.archive.facetPage[facetKey] = Math.max(1, Number(value) || 1);
  }
  function getFacetCollapsedValue(facetKey) {
    if (!state.archive.facetCollapsed || typeof state.archive.facetCollapsed !== "object") state.archive.facetCollapsed = {};
    return Boolean(state.archive.facetCollapsed[facetKey]);
  }

  function setFacetCollapsedValue(facetKey, value) {
    if (!state.archive.facetCollapsed || typeof state.archive.facetCollapsed !== "object") state.archive.facetCollapsed = {};
    state.archive.facetCollapsed[facetKey] = Boolean(value);
  }

  function toggleFacetAccordionState(facetKey) {
    const nextCollapsed = !getFacetCollapsedValue(facetKey);
    const facets = getAvailableFilterFacets();

    if (nextCollapsed) {
      setFacetCollapsedValue(facetKey, true);
      return;
    }

    state.archive.facetCollapsed = {};
    for (const facet of facets) {
      state.archive.facetCollapsed[facet.key] = facet.key !== facetKey;
    }
  }

  function getFacetEmptyMessage(facet, filteredCount) {
    if (!facet?.options?.length) {
      return "No options available on this page yet.";
    }
    if (!filteredCount) {
      return "No matches after facet search. Clear the search or change page filters.";
    }
    return "No options available.";
  }


  function clearFacetPageAndSearchState() {
    state.archive.termModes = {};
    applyDefaultHiddenFacetTerms();
    state.archive.facetSearch = {};
    state.archive.facetPage = {};
  }

  function countSelectedTermsForFacet(facetKey) {
    return Object.keys(getFacetSelectionMap(facetKey)).length;
  }

  function getActiveFilterCount() {
    let count = 0;
    if (state.archive.q) count += 1;
    if (state.archive.hideRead) count += 1;
    if (state.archive.onlyEnglish) count += 1;
    for (const map of Object.values(state.archive.termModes || {})) {
      count += Object.keys(map || {}).length;
    }
    return count;
  }

  function mapNativeFacetParamToFamily(param, title = "") {
    const normalized = String(param || "").toLowerCase();
    const normalizedTitle = slugify(title);
    if (normalized === "ep_filter_lang" || normalizedTitle === "language") return "lang";
    if (normalized === "ep_filter_genre" || normalizedTitle === "genre") return "genre";
    if (normalized === "ep_filter_category" || normalizedTitle === "category") return "category";
    if (normalized === "ep_filter_post_tag" || normalizedTitle === "tag") return "tag";
    if (normalized === "ep_filter_artist" || normalizedTitle === "artist") return "artist";
    if (normalized === "ep_filter_pairing" || normalizedTitle === "pairing") return "pairing";
    if (normalized === "ep_filter_group" || normalizedTitle === "group") return "group";
    return "";
  }

  function getNativeFacetParam(termAnchor) {
    if (!(termAnchor instanceof HTMLAnchorElement) || !termAnchor.href) return "";
    try {
      const url = new URL(termAnchor.href, location.href);
      return Array.from(url.searchParams.keys()).find((key) => key.startsWith("ep_filter_")) || "";
    } catch {
      return "";
    }
  }

  function normalizeFacetOptionRaw(familyKey, name, slug) {
    const source = String(name || slug || "").trim();
    if (!source) return "";
    if (familyKey && FACET_FAMILY_ORDER.includes(familyKey)) {
      return normalizeMetaValue(familyKey, source).raw;
    }
    return slugify(slug || source);
  }

function normalizeFacetCatalogFacet(facet) {
    const title = String(facet?.title || "").trim();
    const familyKey = String(facet?.familyKey || "").trim();
    const nativeParam = String(facet?.nativeParam || "").trim();
    const key = String(facet?.key || `${nativeParam || familyKey || slugify(title)}`).trim();
    const options = Array.isArray(facet?.options)
      ? facet.options.map((option) => {
          const raw = normalizeFacetOptionRaw(familyKey, option?.label || option?.raw || option?.slug, option?.slug || option?.raw);
          if (!raw) return null;
          return {
            raw,
            label: String(option?.label || titleCase(raw)).trim() || titleCase(raw),
            slug: slugify(option?.slug || raw),
            count: Number(option?.count) || 0,
            href: "",
          };
        }).filter(Boolean)
      : [];

    if (!options.length) return null;

    return {
      key,
      familyKey,
      nativeParam,
      title: title || FACET_FAMILY_LABELS[familyKey] || titleCase(familyKey || key),
      searchable: Boolean(facet?.searchable) || options.length > FACET_PANEL_PAGE_SIZE,
      source: String(facet?.source || "cached"),
      cachedAt: Number(facet?.cachedAt) || Date.now(),
      options,
    };
  }

  function getFacetCatalogCacheKey() {
    return `${FACET_CATALOG_CACHE_KEY}:${getSiteStorageScope()}`;
  }

  function loadFacetCatalogCache() {
    try {
      const raw = localStorage.getItem(getFacetCatalogCacheKey());
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const cachedAt = Number(parsed?.cachedAt) || 0;
      if (cachedAt && Date.now() - cachedAt > FACET_CATALOG_TTL_MS) {
        return [];
      }
      return Array.isArray(parsed?.facets)
        ? parsed.facets.map(normalizeFacetCatalogFacet).filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }

  function saveFacetCatalogCache(facets) {
    try {
      const normalizedFacets = Array.isArray(facets)
        ? facets.map((facet) => normalizeFacetCatalogFacet({
            key: facet.key,
            familyKey: facet.familyKey,
            nativeParam: facet.nativeParam,
            title: facet.title,
            searchable: facet.searchable,
            source: "cached",
            cachedAt: Date.now(),
            options: facet.options,
          })).filter(Boolean)
        : [];

      if (!normalizedFacets.length) return;
      localStorage.setItem(
        getFacetCatalogCacheKey(),
        JSON.stringify({
          cachedAt: Date.now(),
          facets: normalizedFacets,
        })
      );
    } catch {}
  }

  function buildFacetsFromCachedCatalog() {
    const cachedFacets = loadFacetCatalogCache();
    if (!cachedFacets.length) return [];

    const syntheticMap = new Map(buildSyntheticFacetsFromCards().map((facet) => [facet.familyKey, facet]));
    return cachedFacets.map((facet) => {
      const synthetic = facet.familyKey ? syntheticMap.get(facet.familyKey) : null;
      const countMap = new Map();
      const labelMap = new Map();
      const slugMap = new Map();

      if (synthetic?.options?.length) {
        for (const option of synthetic.options) {
          countMap.set(option.raw, Number(option.count) || 0);
          labelMap.set(option.raw, option.label || titleCase(option.raw));
          slugMap.set(option.raw, option.slug || option.raw);
        }
      }

      const merged = new Map();

      for (const option of facet.options) {
        const raw = normalizeFacetOptionRaw(facet.familyKey, option.label || option.raw, option.slug || option.raw);
        if (!raw) continue;
        merged.set(raw, {
          raw,
          label: option.label || labelMap.get(raw) || titleCase(raw),
          slug: slugMap.get(raw) || option.slug || raw,
          count: countMap.get(raw) || 0,
          href: "",
        });
      }

      if (synthetic?.options?.length) {
        for (const option of synthetic.options) {
          if (!merged.has(option.raw)) {
            merged.set(option.raw, {
              raw: option.raw,
              label: option.label || titleCase(option.raw),
              slug: option.slug || option.raw,
              count: Number(option.count) || 0,
              href: "",
            });
          }
        }
      }

      const options = Array.from(merged.values())
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

      return {
        key: synthetic?.key || facet.key,
        familyKey: facet.familyKey,
        nativeParam: facet.nativeParam,
        title: facet.title,
        searchable: facet.searchable || options.length > FACET_PANEL_PAGE_SIZE,
        source: "cached",
        options,
      };
    }).filter((facet) => facet.options.length);
  }

  function getNativeSortConfig() {
    const select = document.querySelector(".ep-search-sort #ep-sort");
    if (!(select instanceof HTMLSelectElement)) return null;

    const options = Array.from(select.options)
      .map((option) => ({
        value: option.value,
        label: option.textContent?.trim() || option.value,
      }))
      .filter((option) => option.value);

    return {
      value: select.value || options[0]?.value || "",
      options,
    };
  }

  function buildNativeFacetsFromSidebar(root = document) {
    const widgets = Array.from(root.querySelectorAll(`${SELECTORS.nativeSearchSidebar} .ep-filter-widget.widget_ep-facet`));
    return widgets.map((widget, index) => {
      const title = widget.querySelector(".ep-filter-title")?.textContent?.trim() || `Facet ${index + 1}`;
      const firstAnchor = widget.querySelector(".term.level-0 a[href]");
      const param = getNativeFacetParam(firstAnchor);
      const familyKey = mapNativeFacetParamToFamily(param, title);
      const searchable = widget.querySelector(".facet-search") instanceof HTMLInputElement;

      const options = Array.from(widget.querySelectorAll(".term.level-0"))
        .map((term) => {
          const anchor = term.querySelector("a[href]");
          if (!(anchor instanceof HTMLAnchorElement)) return null;

          const dataName = term.getAttribute("data-term-name") || anchor.childNodes[1]?.textContent || anchor.textContent || "";
          const name = String(dataName).replace(/\(\d+\)\s*$/, "").trim();
          const slug = term.getAttribute("data-term-slug") || "";
          const countText = anchor.querySelector("span")?.textContent || "";
          const count = Number(String(countText).replace(/[^\d]/g, "")) || 0;
          const raw = normalizeFacetOptionRaw(familyKey, name, slug);
          const label = familyKey ? normalizeMetaValue(familyKey, name || slug).text : titleCase(name || slug || raw);

          return raw ? {
            raw,
            label,
            count,
            slug: slugify(slug || raw),
            href: anchor.href,
          } : null;
        })
        .filter(Boolean);

      return {
        key: `native:${param || slugify(title)}`,
        familyKey,
        nativeParam: param,
        title,
        searchable: searchable || options.length > FACET_PANEL_PAGE_SIZE,
        source: "native",
        options,
      };
    }).filter((facet) => facet.options.length);
  }

  function buildSyntheticFacetsFromCards() {
    return FACET_FAMILY_ORDER.map((familyKey) => {
      const counts = new Map();
      const labels = new Map();

      for (const card of state.cards) {
        const seen = new Set();
        for (const item of card.meta?.[familyKey] || []) {
          const raw = slugify(item.raw);
          if (!raw || seen.has(raw)) continue;
          seen.add(raw);
          counts.set(raw, (counts.get(raw) || 0) + 1);
          if (!labels.has(raw)) labels.set(raw, item.text || titleCase(item.raw));
        }
      }

      const options = Array.from(counts.entries())
        .map(([raw, count]) => ({
          raw,
          label: labels.get(raw) || titleCase(raw),
          count,
          slug: raw,
          href: "",
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

      return {
        key: `synthetic:${familyKey}`,
        familyKey,
        nativeParam: "",
        title: FACET_FAMILY_LABELS[familyKey] || titleCase(familyKey),
        searchable: options.length > FACET_PANEL_PAGE_SIZE,
        source: "synthetic",
        options,
      };
    }).filter((facet) => facet.options.length);
  }

  function getNativeFacetExcludeParam(nativeParam) {
    const normalized = String(nativeParam || "").trim();
    if (!normalized) return "";
    return `mrm_exclude_${normalized.replace(/^ep_filter_/, "")}`;
  }

  function findNativeFacetOptionByToken(facet, token) {
    const normalizedToken = slugify(token);
    if (!normalizedToken) return null;
    return facet.options.find((option) => {
      const slugToken = slugify(option.slug || "");
      const rawToken = slugify(option.raw || "");
      const labelToken = slugify(option.label || "");
      return slugToken === normalizedToken || rawToken === normalizedToken || labelToken === normalizedToken;
    }) || null;
  }

  function getNativeFacetOptionToken(facet, raw) {
    const option = facet.options.find((item) => item.raw === raw);
    return slugify(option?.slug || option?.raw || raw);
  }

  function hasNativeFacetRouting() {
    return buildNativeFacetsFromSidebar().some((facet) => facet.nativeParam);
  }

  function isSearchResultsPage() {
    const body = document.body;
    return Boolean(body?.classList.contains("search") && body?.classList.contains("search-results"));
  }

  function isFacetDirectoryPage() {
    return /^\/(?:genre|artist|tag)(?:\/|$)/.test(location.pathname || "");
  }

  function shouldShowSearchSortControl() {
    return isSearchResultsPage();
  }

  function shouldShowDisplaySortControl() {
    return isSearchResultsPage() || isFacetDirectoryPage();
  }

  function shouldDebounceNativeFacetApply() {
    return isSearchResultsPage() && hasNativeFacetRouting();
  }

  function clearScheduledNativeFacetApply() {
    if (nativeFacetApplyTimer) {
      clearTimeout(nativeFacetApplyTimer);
      nativeFacetApplyTimer = 0;
    }
    nativeFacetApplyTarget = "";
  }

  function scheduleNativeFacetUrlApply(sortOverride = null, options = {}) {
    const target = buildNativeFacetUrl(sortOverride, options);
    if (!target || target === location.href) {
      clearScheduledNativeFacetApply();
      return;
    }

    clearScheduledNativeFacetApply();
    nativeFacetApplyTarget = target;
    nativeFacetApplyTimer = window.setTimeout(() => {
      nativeFacetApplyTimer = 0;
      const nextTarget = nativeFacetApplyTarget;
      nativeFacetApplyTarget = "";
      if (nextTarget && nextTarget !== location.href) {
        location.href = nextTarget;
      }
    }, NATIVE_FILTER_APPLY_DEBOUNCE_MS);
  }

  function buildNativeFacetUrl(sortOverride = null, { clear = false } = {}) {
    const facets = buildNativeFacetsFromSidebar().filter((facet) => facet.nativeParam);
    if (!facets.length) return "";

    try {
      const url = new URL(location.href);

      url.searchParams.delete("paged");
      url.searchParams.delete("page");

      for (const facet of facets) {
        url.searchParams.delete(facet.nativeParam);
        const excludeParam = getNativeFacetExcludeParam(facet.nativeParam);
        if (excludeParam) url.searchParams.delete(excludeParam);
      }

      if (clear) {
        url.searchParams.delete("ep_sort");
        return url.toString();
      }

      const nextSort = String(
        sortOverride != null
          ? sortOverride
          : (state.archive.serverSort || url.searchParams.get("ep_sort") || "")
      ).trim();

      if (nextSort) url.searchParams.set("ep_sort", nextSort);
      else url.searchParams.delete("ep_sort");

      for (const facet of facets) {
        const selection = getFacetSelectionMap(facet.key);
        const include = new Set();
        const exclude = new Set();

        for (const [raw, mode] of Object.entries(selection)) {
          const token = getNativeFacetOptionToken(facet, raw);
          if (!token) continue;
          if (mode === "include") include.add(token);
          if (mode === "exclude") exclude.add(token);
        }

        if (include.size) url.searchParams.set(facet.nativeParam, Array.from(include).join(","));
        const excludeParam = getNativeFacetExcludeParam(facet.nativeParam);
        if (excludeParam && exclude.size) url.searchParams.set(excludeParam, Array.from(exclude).join(","));
      }

      return url.toString();
    } catch {
      return "";
    }
  }

  function applyNativeFacetUrl(sortOverride = null, options = {}) {
    const target = buildNativeFacetUrl(sortOverride, options);
    if (!target) return;

    if (options?.immediate || !shouldDebounceNativeFacetApply()) {
      clearScheduledNativeFacetApply();
      if (target !== location.href) location.href = target;
      return;
    }

    scheduleNativeFacetUrlApply(sortOverride, options);
  }

  function syncNativeFacetSelectionsFromUrl(facets) {
    try {
      const url = new URL(location.href);
      state.archive.serverSort = url.searchParams.get("ep_sort") || "";

      for (const facet of facets) {
        if (!facet.nativeParam) continue;

        const existing = getFacetSelectionMap(facet.key);
        for (const key of Object.keys(existing)) delete existing[key];

        const includeTokens = (url.searchParams.get(facet.nativeParam) || "")
          .split(",")
          .map((token) => token.trim())
          .filter(Boolean);

        for (const token of includeTokens) {
          const option = findNativeFacetOptionByToken(facet, token);
          const normalized = option?.raw || normalizeFacetOptionRaw(facet.familyKey, token, token);
          if (normalized) existing[normalized] = "include";
        }

        const excludeParam = getNativeFacetExcludeParam(facet.nativeParam);
        const excludeTokens = (url.searchParams.get(excludeParam) || "")
          .split(",")
          .map((token) => token.trim())
          .filter(Boolean);

        for (const token of excludeTokens) {
          const option = findNativeFacetOptionByToken(facet, token);
          const normalized = option?.raw || normalizeFacetOptionRaw(facet.familyKey, token, token);
          if (normalized) existing[normalized] = "exclude";
        }

        if (!Object.keys(existing).length) delete state.archive.termModes[facet.key];
      }
    } catch {}
  }

  function getFacetCatalogFetchUrls() {
    const urls = [];
    const seen = new Set();

    const pushUrl = (value) => {
      try {
        const href = new URL(value, location.origin).href;
        if (!seen.has(href)) {
          seen.add(href);
          urls.push(href);
        }
      } catch {}
    };

    pushUrl("/?s=");
    pushUrl("/?s=a");
    return urls;
  }

  function parseFacetCatalogFromHtml(html) {
    const markup = String(html || "").trim();
    if (!markup) return [];
    try {
      const doc = new DOMParser().parseFromString(markup, "text/html");
      return buildNativeFacetsFromSidebar(doc);
    } catch {
      return [];
    }
  }

  function refreshFacetUiAfterWarm() {
    if (!shouldRunArchiveMode()) return;
    renderFiltersPane();
    applyArchiveFilter();
  }

  function warmFacetCatalogInBackground(force = false) {
    if (buildNativeFacetsFromSidebar().length) return Promise.resolve([]);
    if (!force && loadFacetCatalogCache().length) return Promise.resolve([]);
    if (!force && facetCatalogWarmPromise) return facetCatalogWarmPromise;

    const nonce = `${location.pathname}|${location.search}|${Date.now()}`;
    facetCatalogWarmNonce = nonce;

    facetCatalogWarmPromise = (async () => {
      for (const url of getFacetCatalogFetchUrls()) {
        try {
          const response = await fetch(url, {
            credentials: "include",
            redirect: "follow",
          });
          if (!response.ok) continue;
          const html = await response.text();
          const facets = parseFacetCatalogFromHtml(html);
          if (!facets.length) continue;
          saveFacetCatalogCache(facets);
          if (facetCatalogWarmNonce === nonce) {
            refreshFacetUiAfterWarm();
          }
          return facets;
        } catch {}
      }
      return [];
    })().finally(() => {
      if (facetCatalogWarmNonce === nonce) {
        facetCatalogWarmPromise = null;
      }
    });

    return facetCatalogWarmPromise;
  }

  function getAvailableFilterFacets() {
    const nativeFacets = buildNativeFacetsFromSidebar();
    if (nativeFacets.length) {
      syncNativeFacetSelectionsFromUrl(nativeFacets);
      saveFacetCatalogCache(nativeFacets);
      return nativeFacets;
    }

    const cachedFacets = buildFacetsFromCachedCatalog();
    if (cachedFacets.length) {
      return cachedFacets;
    }

    warmFacetCatalogInBackground();
    return buildSyntheticFacetsFromCards();
  }

  function getFilteredFacetOptions(facet, queryOverride = null) {
    const query = slugify(queryOverride != null ? queryOverride : getFacetSearchValue(facet.key));
    return facet.options.filter((option) => {
      if (!query) return true;
      const haystack = slugify(`${option.label} ${option.raw} ${option.slug || ""}`);
      return haystack.includes(query);
    });
  }

  function getPagedFacetOptions(facet, pageSize, queryOverride = null) {
    const filtered = getFilteredFacetOptions(facet, queryOverride);
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(getFacetPageValue(facet.key), pageCount);
    const start = (page - 1) * pageSize;
    return {
      filtered,
      page,
      pageCount,
      items: filtered.slice(start, start + pageSize),
    };
  }

  function getCardFacetValues(card, facet) {
    if (!card || !facet?.key) return [];
    if (!card.facetValues || typeof card.facetValues !== "object") card.facetValues = {};
    if (!card.facetValueSets || typeof card.facetValueSets !== "object") card.facetValueSets = {};
    if (Array.isArray(card.facetValues[facet.key])) return card.facetValues[facet.key];

    const values = new Set();

    if (facet.familyKey && card.meta?.[facet.familyKey]) {
      for (const item of card.meta[facet.familyKey]) {
        const raw = slugify(item.raw);
        if (raw) values.add(raw);
      }
    }

    if (!values.size && facet.familyKey === "category") {
      for (const cls of Array.from(card.article.classList || [])) {
        if (!cls.startsWith("category-")) continue;
        const raw = slugify(cls.slice("category-".length).replace(/-+/g, " "));
        if (raw) values.add(raw);
      }
    }

    if (!values.size && facet.nativeParam) {
      const classText = slugify(Array.from(card.article.classList || []).join(" "));
      const titleText = card.articleText || card.searchHaystack || slugify(card.article.textContent || "");
      for (const option of facet.options) {
        if (classText.includes(option.raw) || titleText.includes(option.raw)) {
          values.add(option.raw);
        }
      }
    }

    const resolved = Array.from(values);
    card.facetValues[facet.key] = resolved;
    card.facetValueSets[facet.key] = values;
    return resolved;
  }

  function getCardFacetValueSet(card, facet) {
    if (!card || !facet?.key) return new Set();
    if (!card.facetValueSets || typeof card.facetValueSets !== "object") card.facetValueSets = {};
    if (card.facetValueSets[facet.key] instanceof Set) return card.facetValueSets[facet.key];
    return new Set(getCardFacetValues(card, facet));
  }

  function setFacetTermMode(facetKey, termRaw, mode) {
    const selection = getFacetSelectionMap(facetKey);
    if (!mode || selection[termRaw] === mode) {
      delete selection[termRaw];
      if (!Object.keys(selection).length) delete state.archive.termModes[facetKey];
      return;
    }
    selection[termRaw] = mode;
  }

  function syncFacetSelectionChange() {
    saveState();
    renderFiltersPane();
    if (state.ui.facetModalKey) renderFacetModal();
    applyArchiveFilter();

    if (shouldDebounceNativeFacetApply()) {
      scheduleNativeFacetUrlApply(state.archive.serverSort || getNativeSortConfig()?.value || "");
    }
  }

  function createFacetTermRow(facet, option) {
    const selection = getFacetSelectionMap(facet.key);
    const mode = selection[option.raw] || "";

    const row = document.createElement("div");
    row.className = "mrm-facet-term";

    const info = document.createElement("div");
    info.className = "mrm-facet-term__info";

    const name = document.createElement("div");
    name.className = "mrm-facet-term__name";
    name.textContent = option.label;

    const meta = document.createElement("div");
    meta.className = "mrm-facet-term__meta";
    meta.textContent = `(${option.count})`;

    info.append(name, meta);

    const controls = document.createElement("div");
    controls.className = "mrm-facet-term__controls";

    const inBtn = document.createElement("button");
    inBtn.type = "button";
    inBtn.className = "mrm-facet-mode-btn";
    inBtn.textContent = "IN";
    inBtn.classList.toggle("is-in", mode === "include");
    inBtn.addEventListener("click", (event) => {
      event.preventDefault();
      setFacetTermMode(facet.key, option.raw, mode === "include" ? "" : "include");
      syncFacetSelectionChange();
    });

    const outBtn = document.createElement("button");
    outBtn.type = "button";
    outBtn.className = "mrm-facet-mode-btn";
    outBtn.textContent = "OUT";
    outBtn.classList.toggle("is-out", mode === "exclude");
    outBtn.addEventListener("click", (event) => {
      event.preventDefault();
      setFacetTermMode(facet.key, option.raw, mode === "exclude" ? "" : "exclude");
      syncFacetSelectionChange();
    });

    controls.append(inBtn, outBtn);
    row.append(info, controls);
    return row;
  }

  function getCachedFacetNode(cacheKey, factory) {
  const cached = facetNodeCache.get(cacheKey);
  if (cached && cached.isConnected) return cached;
  const next = factory();
  facetNodeCache.set(cacheKey, next);
  return next;
}

function createFacetWidget(facet) {
    const widgetFragment = document.createDocumentFragment();
    const section = document.createElement("section");
    section.className = "mrm-facet-widget";
    section.dataset.facetKey = facet.key;

    const collapsed = getFacetCollapsedValue(facet.key);
    if (collapsed) section.classList.add("is-collapsed");

    const head = document.createElement("button");
    head.type = "button";
    head.className = "mrm-facet-widget__head mrm-facet-widget__toggle";
    head.setAttribute("aria-expanded", String(!collapsed));
    head.setAttribute("aria-controls", `mrm-facet-content-${facet.key}`);

    const titleWrap = document.createElement("div");
    titleWrap.className = "mrm-facet-widget__title-wrap";

    const title = document.createElement("div");
    title.className = "mrm-facet-widget__title";
    title.textContent = facet.title;

    const meta = document.createElement("div");
    meta.className = "mrm-facet-widget__meta";
    const selectedCount = countSelectedTermsForFacet(facet.key);
    meta.textContent = selectedCount ? `${selectedCount} selected` : `${facet.options.length} options`;

    titleWrap.append(title, meta);

    const indicator = document.createElement("div");
    indicator.className = "mrm-facet-widget__indicator";
    indicator.textContent = collapsed ? "▸" : "▾";

    head.append(titleWrap, indicator);
    head.addEventListener("click", () => {
      toggleFacetAccordionState(facet.key);
      saveState();
      renderFiltersPane();
    });
    section.appendChild(head);

    const content = document.createElement("div");
    content.className = "mrm-facet-widget__content";
    content.id = `mrm-facet-content-${facet.key}`;
    content.hidden = collapsed;

    const toolbar = document.createElement("div");
    toolbar.className = "mrm-facet-widget__toolbar";

    if (facet.searchable) {
      const search = document.createElement("input");
      search.type = "search";
      search.className = "mrm-facet-search";
      search.placeholder = `Search ${facet.title}`;
      search.value = getFacetSearchValue(facet.key);
      search.addEventListener("input", debounce((event) => {
        setFacetSearchValue(facet.key, event.target.value);
        setFacetPageValue(facet.key, 1);
        saveState();
        renderFiltersPane();
      }, 120));
      toolbar.appendChild(search);
    }

    const toolbarActions = document.createElement("div");
    toolbarActions.className = "mrm-facet-widget__toolbar-actions";

    const showAll = document.createElement("button");
    showAll.type = "button";
    showAll.className = "mrm-btn mrm-btn--small";
    showAll.textContent = "Show all";
    showAll.addEventListener("click", () => openFacetModal(facet.key));
    toolbarActions.appendChild(showAll);
    toolbar.appendChild(toolbarActions);

    content.appendChild(toolbar);

    const list = document.createElement("div");
    list.className = "mrm-facet-list";

    const paged = getPagedFacetOptions(facet, FACET_PANEL_PAGE_SIZE);
    for (const option of paged.items) {
      list.appendChild(createFacetTermRow(facet, option));
    }
    if (!paged.items.length) {
      const empty = document.createElement("div");
      empty.className = "mrm-facet-empty";
      empty.textContent = getFacetEmptyMessage(facet, paged.filtered.length);
      list.appendChild(empty);
    }
    content.appendChild(list);

    if (paged.pageCount > 1) {
      const footer = document.createElement("div");
      footer.className = "mrm-facet-widget__footer";

      const caption = document.createElement("div");
      caption.className = "mrm-facet-widget__caption";
      caption.textContent = `Page ${paged.page} of ${paged.pageCount}`;

      const pager = document.createElement("div");
      pager.className = "mrm-facet-pager";

      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "mrm-facet-page-btn";
      prev.textContent = "Prev";
      prev.disabled = paged.page <= 1;
      prev.addEventListener("click", () => {
        setFacetPageValue(facet.key, paged.page - 1);
        saveState();
        renderFiltersPane();
      });

      const next = document.createElement("button");
      next.type = "button";
      next.className = "mrm-facet-page-btn";
      next.textContent = "Next";
      next.disabled = paged.page >= paged.pageCount;
      next.addEventListener("click", () => {
        setFacetPageValue(facet.key, paged.page + 1);
        saveState();
        renderFiltersPane();
      });

      pager.append(prev, next);
      footer.append(caption, pager);
      content.appendChild(footer);
    }

    section.appendChild(content);
    return section;
  }

  function ensureFacetModal() {
    let backdrop = getCachedElementById("mrm-facet-modal-backdrop");
    if (backdrop) return backdrop;

    backdrop = document.createElement("div");
    backdrop.id = "mrm-facet-modal-backdrop";
    backdrop.className = "mrm-facet-modal-backdrop";
    backdrop.innerHTML = `
      <div class="mrm-facet-modal" role="dialog" aria-modal="true" aria-label="Facet picker">
        <div class="mrm-facet-modal__head">
          <div class="mrm-facet-modal__title">Facet</div>
          <button type="button" class="mrm-btn mrm-btn--small mrm-facet-modal__close">Close</button>
        </div>
        <div class="mrm-facet-modal__toolbar"></div>
        <div class="mrm-facet-modal__body"></div>
        <div class="mrm-facet-modal__footer"></div>
      </div>
    `;

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closeFacetModal();
    });

    backdrop.querySelector(".mrm-facet-modal__close")?.addEventListener("click", closeFacetModal);
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function closeFacetModal() {
    const backdrop = getCachedElementById("mrm-facet-modal-backdrop");
    if (!(backdrop instanceof HTMLElement)) return;
    backdrop.classList.remove("is-open");
    state.ui.facetModalKey = "";
  }

  function openFacetModal(facetKey) {
    state.ui.facetModalKey = facetKey;
    renderFacetModal();
    const backdrop = ensureFacetModal();
    backdrop.classList.add("is-open");
  }

  function renderFacetModal() {
    const modalFragment = document.createDocumentFragment();
    const fragment = document.createDocumentFragment();
    facetElementCache.clear();
    const backdrop = ensureFacetModal();
    const facets = getAvailableFilterFacets();
    const facet = facets.find((item) => item.key === state.ui.facetModalKey) || facets[0];
    if (!facet) return;

    const title = backdrop.querySelector(".mrm-facet-modal__title");
    const toolbar = backdrop.querySelector(".mrm-facet-modal__toolbar");
    const body = backdrop.querySelector(".mrm-facet-modal__body");
    const footer = backdrop.querySelector(".mrm-facet-modal__footer");

    if (!(title instanceof HTMLElement) || !(toolbar instanceof HTMLElement) || !(body instanceof HTMLElement) || !(footer instanceof HTMLElement)) return;

    title.textContent = `${facet.title} facet`;

    toolbar.replaceChildren();
    const search = document.createElement("input");
    search.type = "search";
    search.className = "mrm-facet-search";
    search.placeholder = `Search ${facet.title}`;
    search.value = getFacetSearchValue(facet.key);
    search.addEventListener("input", debounce((event) => {
      setFacetSearchValue(facet.key, event.target.value);
      setFacetPageValue(facet.key, 1);
      saveState();
      renderFacetModal();
      renderFiltersPane();
      }, 120));
    toolbar.appendChild(search);

    body.replaceChildren();
    const paged = getPagedFacetOptions(facet, FACET_MODAL_PAGE_SIZE);
    for (const option of paged.items) {
      body.appendChild(createFacetTermRow(facet, option));
    }
    if (!paged.items.length) {
      const empty = document.createElement("div");
      empty.className = "mrm-facet-empty";
      empty.textContent = getFacetEmptyMessage(facet, paged.filtered.length);
      body.appendChild(empty);
    }

    footer.replaceChildren();
    const left = document.createElement("div");
    left.className = "mrm-facet-modal__summary";
    left.textContent = `Page ${paged.page} of ${paged.pageCount}`;

    const pager = document.createElement("div");
    pager.className = "mrm-facet-pager";
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "mrm-facet-page-btn";
    prev.textContent = "Prev";
    prev.disabled = paged.page <= 1;
    prev.addEventListener("click", () => {
      setFacetPageValue(facet.key, paged.page - 1);
      saveState();
      renderFacetModal();
      renderFiltersPane();
    });

    const next = document.createElement("button");
    next.type = "button";
    next.className = "mrm-facet-page-btn";
    next.textContent = "Next";
    next.disabled = paged.page >= paged.pageCount;
    next.addEventListener("click", () => {
      setFacetPageValue(facet.key, paged.page + 1);
      saveState();
      renderFacetModal();
      renderFiltersPane();
    });

    pager.append(prev, next);

    const done = document.createElement("button");
    done.type = "button";
    done.className = "mrm-btn mrm-btn--small";
    done.textContent = "Done";
    done.addEventListener("click", closeFacetModal);

    footer.append(left, pager, done);
  }

  function applyNativeSearchSort(value) {
    state.archive.serverSort = String(value || "").trim();
    saveState();

    if (hasNativeFacetRouting()) {
      applyNativeFacetUrl(state.archive.serverSort, { immediate: true });
      return;
    }

    if (!state.archive.serverSort) return;
    try {
      const url = new URL(location.href);
      url.searchParams.set("ep_sort", state.archive.serverSort);
      location.href = url.toString();
    } catch {}
  }

  function renderFiltersPane() {
    const mount = getCachedElementById("mrm-tab-filters");
    if (!mount) return;

    ensureFacetModal();
    const facets = getAvailableFilterFacets();
    const nativeSort = shouldShowSearchSortControl() ? getNativeSortConfig() : null;
    const hasNativeRouting = facets.some((facet) => facet.source === "native" && facet.nativeParam);
    const showDisplaySort = shouldShowDisplaySortControl();
    const visible = state.cards.filter((card) => !card.article.classList.contains("mrm-hidden-card")).length;

    clearCachedElementById("mrm-results-summary");
    clearCachedElementById("mrm-active-filter-count");
    mount.replaceChildren();

    const fragment = document.createDocumentFragment();

    const summary = document.createElement("div");
    summary.id = "mrm-results-summary";
    summary.className = "mrm-results-summary";
    summary.textContent = `Showing ${visible} of ${state.cards.length} results`;

    const activeSummary = document.createElement("div");
    activeSummary.className = "mrm-results-summary";
    activeSummary.innerHTML = `Active filters: <strong id="mrm-active-filter-count">${getActiveFilterCount()}</strong>`;

    const activeChips = document.createElement("div");
    activeChips.className = "mrm-selected-chip-row";

    for (const facet of facets) {
      const selection = getFacetSelectionMap(facet.key);
      for (const [raw, mode] of Object.entries(selection)) {
        const option = facet.options.find((item) => item.raw === raw);
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = `mrm-selected-chip ${mode === "exclude" ? "is-exclude" : "is-include"}`;
        chip.textContent = `${mode === "exclude" ? "OUT" : "IN"}: ${option?.label || titleCase(raw)}`;
        chip.addEventListener("click", () => {
          setFacetTermMode(facet.key, raw, "");
          syncFacetSelectionChange();
        });
        activeChips.appendChild(chip);
      }
    }

    const globalSearch = document.createElement("label");
    globalSearch.className = "mrm-field";
    globalSearch.innerHTML = `
      <span>Search current results</span>
      <input id="mrm-archive-search" type="search" placeholder="Title, artist, tags">
    `;
    const globalSearchInput = globalSearch.querySelector("input");
    globalSearchInput.value = state.archive.q;
    const applyArchiveSearchInput = debounce((value) => {
      state.archive.q = value;
      saveState();
      applyArchiveFilter();
    }, 120);
    globalSearchInput.addEventListener("input", debounce((event) => {
      applyArchiveSearchInput(event.target.value);
      }, 120));

    const toggles = document.createElement("div");
    toggles.className = "mrm-check-grid";

    const hideReadCheck = document.createElement("label");
    hideReadCheck.className = "mrm-check";
    hideReadCheck.innerHTML = `
      <input id="mrm-hide-read" type="checkbox">
      <span>Hide read</span>
    `;
    hideReadCheck.querySelector("input").checked = state.archive.hideRead;
    hideReadCheck.querySelector("input").addEventListener("change", (event) => {
      state.archive.hideRead = event.target.checked;
      saveState();
      applyArchiveFilter();
    });

    const onlyEnglishCheck = document.createElement("label");
    onlyEnglishCheck.className = "mrm-check";
    onlyEnglishCheck.innerHTML = `
      <input id="mrm-only-english" type="checkbox">
      <span>Only English</span>
    `;
    onlyEnglishCheck.querySelector("input").checked = state.archive.onlyEnglish;
    onlyEnglishCheck.querySelector("input").addEventListener("change", (event) => {
      state.archive.onlyEnglish = event.target.checked;
      saveState();
      applyArchiveFilter();
    });

    toggles.append(hideReadCheck, onlyEnglishCheck);

    const uiToggle = document.createElement("label");
    uiToggle.className = "mrm-check";
    uiToggle.innerHTML = `
      <input id="mrm-ui-enabled-filters" type="checkbox">
      <span>Enable UI makeover</span>
    `;
    const uiInput = uiToggle.querySelector("input");
    uiInput.checked = isUiMakeoverEnabled();
    uiInput.addEventListener("change", (event) => {
      const nextEnabled = Boolean(event.target.checked);
      if (nextEnabled === isUiMakeoverEnabled()) return;
      state.ui.uiEnabled = nextEnabled;
      saveState();
      clearScheduledNativeFacetApply();
      location.reload();
    });

    fragment.append(summary, activeSummary, uiToggle);
    if (activeChips.childNodes.length) fragment.appendChild(activeChips);
    fragment.append(globalSearch, toggles);

    if (nativeSort) {
      const serverSortField = document.createElement("label");
      serverSortField.className = "mrm-field";
      serverSortField.innerHTML = `
        <span>Search sort</span>
        <select id="mrm-server-sort"></select>
      `;
      const select = serverSortField.querySelector("select");
      for (const option of nativeSort.options) {
        const element = document.createElement("option");
        element.value = option.value;
        element.textContent = option.label;
        select.appendChild(element);
      }
      select.value = state.archive.serverSort || nativeSort.value;
      select.addEventListener("change", (event) => {
        state.archive.serverSort = event.target.value;
        saveState();
        applyNativeSearchSort(event.target.value);
      });
      fragment.appendChild(serverSortField);
    }

    if (showDisplaySort) {
      const sortField = document.createElement("label");
      sortField.className = "mrm-field";
      sortField.innerHTML = `
        <span>Display sort</span>
        <select id="mrm-archive-sort">
          <option value="default">Default</option>
          <option value="title-asc">Title A–Z</option>
          <option value="title-desc">Title Z–A</option>
          <option value="english-first">English first</option>
        </select>
      `;
      sortField.querySelector("select").value = state.archive.sort;
      sortField.querySelector("select").addEventListener("change", (event) => {
        state.archive.sort = event.target.value;
        saveState();
        sortCards();
        applyArchiveFilter();
      });
      fragment.appendChild(sortField);
    }

    const toolbar = document.createElement("div");
    toolbar.className = "mrm-toolbar-row";

    const moveBtn = document.createElement("button");
    moveBtn.type = "button";
    moveBtn.className = "mrm-btn";
    moveBtn.textContent = "Move panel";
    moveBtn.addEventListener("click", () => {
      state.archive.dock = state.archive.dock === "right" ? "left" : "right";
      saveState();
      applyPanelSide();
    });

    const markReadBtn = document.createElement("button");
    markReadBtn.type = "button";
    markReadBtn.className = "mrm-btn";
    markReadBtn.textContent = "Mark visible read";
    markReadBtn.addEventListener("click", markVisiblePageRead);

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "mrm-btn";
    clearBtn.textContent = "Clear filters";
    clearBtn.addEventListener("click", resetArchiveFilters);

    if (hasNativeRouting && !shouldDebounceNativeFacetApply()) {
      const applySearchBtn = document.createElement("button");
      applySearchBtn.type = "button";
      applySearchBtn.className = "mrm-btn";
      applySearchBtn.textContent = "Apply search filters";
      applySearchBtn.addEventListener("click", () => {
        applyNativeFacetUrl(state.archive.serverSort || nativeSort?.value || "");
      });
      toolbar.append(applySearchBtn);
    }

    toolbar.append(moveBtn, markReadBtn, clearBtn);
    fragment.appendChild(toolbar);

    const facetIntro = document.createElement("div");
    facetIntro.className = "mrm-help";
    facetIntro.textContent = hasNativeRouting
      ? (shouldDebounceNativeFacetApply()
          ? "Native search facets copied into the panel. Include terms sync to ep_filter_* params, exclude terms persist as MRM client filters, the original .ep-search-sidebar can stay hidden, and search pages auto-apply after a short pause."
          : "Native search facets copied into the panel. Include terms sync to ep_filter_* params, exclude terms persist as MRM client filters, and the original .ep-search-sidebar can stay hidden.")
      : "Synthetic facets built from the visible listing cards so the same panel works on archive pages too.";
    fragment.appendChild(facetIntro);

    const facetStack = document.createElement("div");
    facetStack.className = "mrm-facet-stack";
    for (const facet of facets) {
      facetStack.appendChild(getFacetElement(facet));
    }
    fragment.appendChild(facetStack);
    mount.appendChild(fragment);
  }

  function renderGridPane() {

    const mount = getCachedElementById("mrm-tab-grid");
    if (!mount) return;

    mount.replaceChildren();

    const configBlock = document.createElement("div");
    configBlock.className = "mrm-grid-controls";

    const uiToggle = document.createElement("label");
    uiToggle.className = "mrm-check";
    uiToggle.style.marginBottom = "10px";
    uiToggle.innerHTML = `
      <input id="mrm-ui-enabled" type="checkbox">
      <span>Enable UI makeover</span>
    `;
    const uiInput = uiToggle.querySelector("input");
    uiInput.checked = isUiMakeoverEnabled();
    uiInput.addEventListener("change", (event) => {
      const nextEnabled = Boolean(event.target.checked);
      if (nextEnabled === isUiMakeoverEnabled()) return;
      state.ui.uiEnabled = nextEnabled;
      saveState();
      clearScheduledNativeFacetApply();
      location.reload();
    });

    const uiHint = document.createElement("div");
    uiHint.className = "mrm-grid-value";
    uiHint.textContent = "Turns the custom archive/search/post UI on or off. Reader popup still works.";

    configBlock.append(uiToggle, uiHint);

    const controls = document.createElement("div");
    controls.className = "mrm-grid-controls";

    const defs = [
      ["Desktop cols", 2, 8, 1, "desktopCols"],
      ["Tablet cols", 1, 6, 1, "tabletCols"],
      ["Mobile cols", 1, 4, 1, "mobileCols"],
      ["Gap", 8, 36, 1, "gap"],
      ["Cover width", 3, 8, 1, "coverRatioW"],
      ["Cover height", 4, 10, 1, "coverRatioH"],
    ];

    for (const [label, min, max, step, key] of defs) {
      const labelEl = document.createElement("label");
      labelEl.textContent = label;

      const valueEl = document.createElement("div");
      valueEl.className = "mrm-grid-value";
      valueEl.textContent = String(state.grid[key]);

      const input = document.createElement("input");
      input.type = "range";
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(state.grid[key]);
      input.addEventListener("input", () => {
        state.grid[key] = Number(input.value);
        valueEl.textContent = input.value;
        applyGridVars();
        saveState();
        markCards();
        sortCards();
        applyArchiveFilter();
      });

      controls.append(labelEl, valueEl, input);
    }

    mount.append(configBlock, controls);
  }


  function renderThemePane() {
    const mount = getCachedElementById("mrm-tab-theme");
    if (!mount) return;

    ensureUiThemeState();
    mount.replaceChildren();

    const intro = document.createElement("div");
    intro.className = "mrm-help";
    intro.textContent = "Flat near-black theme controls. Accent color is used for highlights only.";

    const accentSection = document.createElement("section");
    accentSection.className = "mrm-theme-section";

    const accentTitle = document.createElement("div");
    accentTitle.className = "mrm-theme-section__title";
    accentTitle.textContent = "Accent color";

    const accentHelp = document.createElement("div");
    accentHelp.className = "mrm-help";
    accentHelp.textContent = "Set a 6-digit hex color used for active buttons, selected pagination, and focus accents.";

    const accentRow = document.createElement("div");
    accentRow.className = "mrm-theme-accent-row";

    const accentField = document.createElement("label");
    accentField.className = "mrm-field";
    accentField.innerHTML = `
      <span>Hex code</span>
      <input id="mrm-accent-color" type="text" inputmode="text" placeholder="#7c5cff" maxlength="7">
    `;
    const accentInput = accentField.querySelector("input");
    accentInput.value = getAccentColor();
    accentInput.addEventListener("change", () => {
      const sanitized = sanitizeHexColor(accentInput.value, getAccentColor());
      accentInput.value = sanitized;
      state.ui.accentColor = sanitized;
      saveState();
      applyFlatThemeRuntime();
      renderThemePane();
    });

    const swatch = document.createElement("div");
    swatch.className = "mrm-theme-swatch";
    swatch.title = getAccentColor();

    const accentReset = document.createElement("button");
    accentReset.type = "button";
    accentReset.className = "mrm-btn";
    accentReset.textContent = "Reset";
    accentReset.addEventListener("click", () => {
      state.ui.accentColor = DEFAULT_UI_THEME.accentColor;
      saveState();
      applyFlatThemeRuntime();
      renderThemePane();
    });

    accentRow.append(accentField, swatch, accentReset);
    accentSection.append(accentTitle, accentHelp, accentRow);

    const borderSection = document.createElement("section");
    borderSection.className = "mrm-theme-section";

    const borderTitle = document.createElement("div");
    borderTitle.className = "mrm-theme-section__title";
    borderTitle.textContent = "Border toggles";

    const borderHelp = document.createElement("div");
    borderHelp.className = "mrm-help";
    borderHelp.textContent = "Toggle borders for each major UI area independently.";

    const borderGrid = document.createElement("div");
    borderGrid.className = "mrm-check-grid";

    const borderDefs = [
      ["Header", "header"],
      ["Cards", "cards"],
      ["Pagination", "pagination"],
      ["Reader", "reader"],
      ["Settings panel", "panel"],
      ["Chips / tags", "chips"],
    ];

    for (const [label, key] of borderDefs) {
      const check = document.createElement("label");
      check.className = "mrm-check";
      check.innerHTML = `
        <input type="checkbox">
        <span>${label}</span>
      `;
      const input = check.querySelector("input");
      input.checked = hasUiBorder(key);
      input.addEventListener("change", (event) => {
        setUiBorder(key, event.target.checked);
      });
      borderGrid.appendChild(check);
    }

    borderSection.append(borderTitle, borderHelp, borderGrid);

    const resetSection = document.createElement("section");
    resetSection.className = "mrm-theme-section";

    const resetTitle = document.createElement("div");
    resetTitle.className = "mrm-theme-section__title";
    resetTitle.textContent = "Theme reset";

    const resetHelp = document.createElement("div");
    resetHelp.className = "mrm-help";
    resetHelp.textContent = "Restore the default accent and all border toggles.";

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "mrm-btn";
    resetButton.textContent = "Reset theme settings";
    resetButton.addEventListener("click", resetUiThemeSettings);

    resetSection.append(resetTitle, resetHelp, resetButton);

    mount.append(intro, accentSection, borderSection, resetSection);
  }



  function resetArchiveFilters() {
    state.archive.q = "";
    state.archive.hideRead = false;
    state.archive.onlyEnglish = false;
    state.archive.sort = "default";
    state.archive.serverSort = "";
    clearFacetPageAndSearchState();
    saveState();

    if (hasNativeFacetRouting()) {
      applyNativeFacetUrl("", { clear: true });
      return;
    }

    renderFiltersPane();
    sortCards();
    applyArchiveFilter();
  }


  function resetFiltersAndGrid() {
    state.archive.q = "";
    state.archive.hideRead = false;
    state.archive.onlyEnglish = false;
    state.archive.sort = "default";
    state.archive.serverSort = "";
    state.archive.dock = "right";
    clearFacetPageAndSearchState();

    state.grid.desktopCols = 6;
    state.grid.tabletCols = 3;
    state.grid.mobileCols = 2;
    state.grid.gap = 18;
    state.grid.coverRatioW = 5;
    state.grid.coverRatioH = 7;

    saveState();
    applyGridVars();
    renderFiltersPane();
    renderGridPane();
    sortCards();
    applyArchiveFilter();
    applyPanelSide();
  }

function refreshArchiveUi(reason = "") {
    if (!shouldRunArchiveMode()) return;
    hideAds();

    const previousSignature = state.archivePerf.cardSignature || "";
    markCards();
    sortCards();
    applyArchiveFilter();

    const nextFacetSignature = JSON.stringify({
      cardSignature: state.archivePerf.cardSignature,
      onlyEnglish: state.archive.onlyEnglish,
      hideRead: state.archive.hideRead,
      termModes: state.archive.termModes,
    });

    if (previousSignature !== state.archivePerf.cardSignature || state.archivePerf.renderedFacetSignature !== nextFacetSignature) {
      renderFiltersPane();
      state.archivePerf.renderedFacetSignature = nextFacetSignature;
    }
  }

  function scheduleArchiveRefresh(reason = "") {
    if (archiveRefreshTimer) return;
    archiveRefreshTimer = window.setTimeout(() => {
      archiveRefreshTimer = 0;
      refreshArchiveUi(reason);
    }, 80);
  }

  function installPagetualHooks() {
    if (hasInstalledListingMessageHooks) return;
    hasInstalledListingMessageHooks = true;

    window.addEventListener("message", (event) => {
      const data = event.data || {};
      const command = String(data.command || "").toLowerCase();
      const action = String(data.action || "").toLowerCase();
      if (!["pagetual", "patetual"].includes(command)) return;
      if (!["insert", "lastpage"].includes(action)) return;
      scheduleArchiveRefresh(`pagetual:${action}`);
    });
  }

  function observeChanges() {
    if (state.observer) state.observer.disconnect();

    const root =
      state.cardContainer?.parentElement ||
      state.cardContainer ||
      document.querySelector(".posts, .entries, .content, main") ||
      document.body;

    const handleMutations = rafThrottle((mutations) => {
      let shouldRefresh = false;

      for (const mutation of mutations) {
        if (mutation.type !== "childList") continue;

        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.closest?.("#mrm-panel, #mrm-facet-modal, #mrm-reader-overlay")) continue;
          if (
            node.matches?.("article.entry, article.post, article.post-standard, article.hentry, .gallery, a.tagchip, .ep-search-sidebar, .ep-search-wrapper") ||
            node.querySelector?.("article.entry, article.post, article.post-standard, article.hentry, .gallery, a.tagchip, .ep-search-sidebar, .ep-search-wrapper")
          ) {
            shouldRefresh = true;
            break;
          }
        }

        if (shouldRefresh) break;
      }

      if (!shouldRefresh) return;
      scheduleArchiveRefresh("mutation");
    });

    state.observer.observe(root, {
      childList: true,
      subtree: true,
    });
  }


  function injectAdvancedFacetPanelStyles() {
    if (getCachedElementById("mrm-advanced-facet-style")) return;

    const style = document.createElement("style");
    style.id = "mrm-advanced-facet-style";
    style.textContent = `
      .mrm-panel {
        width: min(460px, calc(100vw - 24px)) !important;
        max-height: min(86vh, 980px) !important;
      }

      .mrm-check-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }

      .mrm-selected-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 0 0 12px;
      }

      .mrm-selected-chip {
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(255,255,255,.04);
        color: var(--mrm-text);
        cursor: pointer;
      }

      .mrm-selected-chip.is-include {
        background: rgba(37,194,160,.14);
        border-color: rgba(37,194,160,.28);
      }

      .mrm-selected-chip.is-exclude {
        background: rgba(255,92,143,.12);
        border-color: rgba(255,92,143,.28);
      }

      .mrm-facet-stack {
        display: grid;
        gap: 8px;
      }

      .mrm-facet-widget {
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 14px;
        background: rgba(255,255,255,.03);
        overflow: hidden;
      }

      .mrm-facet-widget.is-collapsed .mrm-facet-widget__content {
        display: none !important;
      }

      .mrm-facet-widget__head,
      .mrm-facet-widget__toolbar,
      .mrm-facet-widget__footer {
        padding: 8px 10px;
      }

      .mrm-facet-widget__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border-bottom: 1px solid rgba(255,255,255,.06);
      }

      .mrm-facet-widget__toggle {
        width: 100%;
        appearance: none;
        background: transparent;
        border: 0;
        color: inherit;
        text-align: left;
        cursor: pointer;
      }

      .mrm-facet-widget__title-wrap {
        min-width: 0;
        display: grid;
        gap: 2px;
      }

      .mrm-facet-widget__indicator {
        color: var(--mrm-muted);
        font-size: 12px;
        line-height: 1;
        flex: 0 0 auto;
      }

      .mrm-facet-widget__title {
        font-size: 12px;
        font-weight: 800;
      }

      .mrm-facet-widget__meta,
      .mrm-facet-widget__caption,
      .mrm-facet-empty,
      .mrm-facet-modal__summary {
        color: var(--mrm-muted);
        font-size: 11px;
      }

      .mrm-facet-widget__toolbar {
        display: grid;
        gap: 8px;
        border-bottom: 1px solid rgba(255,255,255,.04);
      }

      .mrm-facet-widget__toolbar-actions {
        display: flex;
        justify-content: flex-end;
      }

      .mrm-btn--small {
        min-height: 24px;
        width: auto;
        min-width: 0;
        flex: 0 0 auto;
        white-space: nowrap;
        padding: 0 8px;
        font-size: 10px;
      }

      .mrm-facet-search {
        width: 100%;
        min-width: 0;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 10px;
        padding: 8px 10px;
        background: rgba(255,255,255,.04);
        color: var(--mrm-text);
        font: inherit;
      }

      .mrm-facet-list {
        display: grid;
        gap: 6px;
        padding: 8px 10px;
      }

      .mrm-facet-term {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 10px;
        padding: 8px 10px;
        background: rgba(255,255,255,.02);
      }

      .mrm-facet-term__info {
        min-width: 0;
        display: grid;
        gap: 2px;
      }

      .mrm-facet-term__name {
        font-size: 11px;
        font-weight: 700;
        color: var(--mrm-text);
        overflow-wrap: anywhere;
      }

      .mrm-facet-term__controls {
        display: inline-flex;
        gap: 4px;
        align-items: center;
      }

      .mrm-facet-mode-btn,
      .mrm-facet-page-btn {
        min-height: 22px;
        width: auto;
        min-width: 0;
        flex: 0 0 auto;
        white-space: nowrap;
        padding: 0 7px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(255,255,255,.04);
        color: var(--mrm-text);
        cursor: pointer;
        font: 700 10px/1 system-ui,-apple-system,sans-serif;
      }

      .mrm-facet-mode-btn.is-in {
        background: rgba(37,194,160,.14);
        border-color: rgba(37,194,160,.28);
      }

      .mrm-facet-mode-btn.is-out {
        background: rgba(255,92,143,.12);
        border-color: rgba(255,92,143,.28);
      }

      .mrm-facet-widget__footer,
      .mrm-facet-pager {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }

      .mrm-facet-page-btn.is-active {
        background: rgba(124,92,255,.18);
        border-color: rgba(124,92,255,.35);
      }

      #mrm-facet-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 2147483600;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(8, 10, 18, 0.78);
              }

      #mrm-facet-modal-backdrop.is-open {
        display: flex;
      }

      .mrm-facet-modal {
        width: min(920px, calc(100vw - 24px));
        max-height: min(88vh, 980px);
        overflow: hidden;
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(10,16,28,.98);
        box-shadow: var(--mrm-shadow);
      }

      .mrm-facet-modal__head,
      .mrm-facet-modal__toolbar,
      .mrm-facet-modal__footer {
        padding: 14px 16px;
        border-bottom: 1px solid rgba(255,255,255,.06);
      }

      .mrm-facet-modal__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .mrm-facet-modal__title {
        font-size: 18px;
        font-weight: 800;
      }

      .mrm-facet-modal__body {
        overflow: auto;
        display: grid;
        gap: 10px;
        padding: 16px;
      }

      .mrm-facet-modal__footer {
        border-bottom: 0;
        border-top: 1px solid rgba(255,255,255,.06);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      @media (max-width: 760px) {
        .mrm-panel {
          width: min(100vw - 12px, 460px) !important;
          bottom: 12px !important;
        }

        .mrm-check-grid {
          grid-template-columns: 1fr;
        }

        .mrm-facet-term {
          grid-template-columns: 1fr;
        }

        .mrm-facet-term__controls,
        .mrm-facet-widget__footer,
        .mrm-facet-pager,
        .mrm-facet-modal__footer {
          justify-content: flex-start;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function startFooterObserver() {
    if (document.body) {
      footerObserver.disconnect();
      footerObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  function stopFooterObserver() {
    footerObserver.disconnect();
  }


  function injectTypographyStyles() {
    if (getCachedElementById("mrm-typography-style-v1")) return;

    const style = document.createElement("style");
    style.id = "mrm-typography-style-v1";
    style.textContent = `
      :root {
        --mrm-font-sans: "Inter var", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        --mrm-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        --mrm-type-2xs: 10px;
        --mrm-type-xs: 11px;
        --mrm-type-sm: 12px;
        --mrm-type-ui: 13px;
        --mrm-type-base: 14px;
        --mrm-type-body: 15px;
        --mrm-type-lg: 18px;
        --mrm-type-xl: 22px;
        --mrm-type-title: clamp(28px, 4vw, 40px);
        --mrm-line-tight: 1.08;
        --mrm-line-title: 1.12;
        --mrm-line-ui: 1.25;
        --mrm-line-copy: 1.66;
        --mrm-tracking-tight: -0.025em;
        --mrm-tracking-ui: 0.01em;
      }

      html {
        -webkit-text-size-adjust: 100% !important;
        text-size-adjust: 100% !important;
      }

      body {
        font-family: var(--mrm-font-sans) !important;
        font-size: var(--mrm-type-base) !important;
        line-height: var(--mrm-line-copy) !important;
        text-rendering: optimizeLegibility !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
      }

      button,
      input,
      select,
      textarea,
      [class^="mrm-"],
      [class*=" mrm-"],
      #mrm-reader-modal,
      #mrm-reader-page {
        font-family: var(--mrm-font-sans) !important;
      }

      button,
      input,
      select,
      textarea {
        font-size: var(--mrm-type-ui) !important;
        line-height: var(--mrm-line-ui) !important;
        letter-spacing: 0 !important;
        text-transform: none !important;
      }

      h1,
      h2,
      h3,
      h4,
      .entry-title,
      .post-title,
      .page-title,
      .mrm-panel__title,
      .mrm-facet-widget__title,
      .mrm-facet-modal__title,
      .mrm-reader-title,
      .mrm-reader-page__title,
      .mrm-post-hero__title {
        font-family: var(--mrm-font-sans) !important;
        font-weight: 800 !important;
        line-height: var(--mrm-line-title) !important;
        letter-spacing: var(--mrm-tracking-tight) !important;
        text-wrap: balance;
      }

      h1,
      .entry-title,
      .page-title,
      body.mrm-single-post-page .entry-title {
        font-size: var(--mrm-type-title) !important;
      }

      h2,
      .post-title,
      .mrm-reader-page__title-text {
        font-size: clamp(20px, 2.4vw, 28px) !important;
      }

      h3,
      .mrm-panel__title,
      .mrm-facet-modal__title {
        font-size: var(--mrm-type-lg) !important;
      }

      .entry-content,
      .post-content,
      .post-entry,
      article .entry,
      body.mrm-single-post-page .entry-content,
      body.mrm-single-post-page .post-content {
        font-size: var(--mrm-type-body) !important;
        line-height: var(--mrm-line-copy) !important;
      }

      .entry-content p,
      .post-content p,
      .post-entry p,
      body.mrm-single-post-page .entry-content p,
      body.mrm-single-post-page .post-content p {
        margin-top: 0 !important;
        margin-bottom: 1em !important;
      }

      .mrm-results-grid article .entry-title,
      .mrm-results-grid article .post-title,
      .mrm-results-grid article .entry-title-link,
      .mrm-results-grid article .post-title a {
        font-size: var(--mrm-type-body) !important;
        line-height: 1.35 !important;
        font-weight: 740 !important;
        letter-spacing: -0.012em !important;
      }

      .mrm-chip,
      .mrm-status-pill,
      .mrm-panel__meta,
      .mrm-facet-widget__count,
      .mrm-facet-term,
      .mrm-theme-section__title,
      .mrm-reader-page__counter,
      .mrm-reader-page__hint,
      .mrm-reader-page__button,
      .mrm-reader-control,
      .mrm-reader-chip {
        font-size: var(--mrm-type-sm) !important;
        line-height: var(--mrm-line-ui) !important;
        letter-spacing: var(--mrm-tracking-ui) !important;
      }

      .mrm-panel__title,
      .mrm-facet-widget__title,
      .mrm-theme-section__title,
      .mrm-reader-title,
      .mrm-reader-page__button,
      .mrm-reader-control,
      .mrm-chip,
      .mrm-status-pill {
        text-transform: none !important;
      }

      .mrm-facet-widget__count,
      .mrm-term-count,
      .mrm-reader-page__counter,
      .mrm-reader-progress,
      .mrm-panel__meta {
        font-variant-numeric: tabular-nums !important;
      }

      .mrm-reader-page__title,
      .mrm-reader-title {
        min-width: 0 !important;
      }

      .mrm-reader-page__title-text,
      .mrm-reader-title,
      .mrm-results-grid article .entry-title,
      .mrm-results-grid article .post-title {
        overflow-wrap: anywhere !important;
      }

      @media (max-width: 720px) {
        :root {
          --mrm-type-base: 13px;
          --mrm-type-body: 14px;
          --mrm-type-title: clamp(24px, 8vw, 32px);
        }

        .mrm-results-grid article .entry-title,
        .mrm-results-grid article .post-title,
        .mrm-results-grid article .entry-title-link,
        .mrm-results-grid article .post-title a {
          font-size: 14px !important;
          line-height: 1.32 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function initReaderPageModule() {
    stopFooterObserver();
    return initReaderPage();
  }

  function initPostPageModule() {
    stopFooterObserver();
    cleanupSinglePostLayoutArtifacts();
    injectSinglePostReaderEntryButton();
  }

  function initListingPageModule() {
    startFooterObserver();
    removeBeforeFooterWidget();
    injectReaderModalStyles();
    hideAds();
    injectStyles();
    injectAdvancedFacetPanelStyles();
    applyGridVars();

    markCards();

    const container = state.cardContainer || resolveCardContainer(state.cards.map((card) => card.article));
    if (container) container.classList.add("mrm-results-grid");

    createPanel();
    ensureReaderModal();
    sortCards();
    applyArchiveFilter();
    renderFiltersPane();
    trackReadClicks();
    closeMobileChipPopoversOnOutsideClick();
    installPagetualHooks();
    observeChanges();
  }


  function injectModernDarkFlatThemeStyles() {
    const existing = getCachedElementById("mrm-modern-dark-flat-style-v1");
    if (existing) {
      document.head.appendChild(existing);
      injectStrictDarkFlatThemeStyles();
      return;
    }

    const style = document.createElement("style");
    style.id = "mrm-modern-dark-flat-style-v1";
    style.textContent = `
      :root {
        color-scheme: dark !important;
        --mrm-bg: #050506 !important;
        --mrm-bg-2: #08090b !important;
        --mrm-panel: #0d0e12 !important;
        --mrm-panel-2: #111218 !important;
        --mrm-soft: #151720 !important;
        --mrm-soft-2: #101118 !important;
        --mrm-line: transparent !important;
        --mrm-line-2: transparent !important;
        --mrm-text: #f5f7fb !important;
        --mrm-muted: #a9b2c3 !important;
        --mrm-shadow: none !important;
        --mrm-shadow-lg: none !important;
        --mrm-reader-bg: #050506 !important;
        --mrm-reader-bg-2: #08090b !important;
        --mrm-reader-surface: #0d0e12 !important;
        --mrm-reader-line: transparent !important;
        --mrm-reader-line-strong: transparent !important;
        --mrm-reader-text: #f5f7fb !important;
        --mrm-reader-muted: #a9b2c3 !important;
      }

      html,
      body,
      body.custom-background,
      html.mrm-reader-page,
      body.mrm-reader-page,
      body.mrm-single-post-page,
      .site-container,
      .site-inner,
      .site,
      #page,
      #main,
      main,
      .content-sidebar-wrap,
      .content,
      .content-area,
      .site-content,
      .wrap {
        background: #050506 !important;
        background-color: #050506 !important;
        background-image: none !important;
        color: var(--mrm-text) !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      body::before,
      body::after,
      .site-container::before,
      .site-container::after,
      .content-sidebar-wrap::before,
      .content-sidebar-wrap::after,
      .site-inner::before,
      .site-inner::after,
      .wrap::before,
      .wrap::after {
        background: transparent !important;
        background-image: none !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      body :is(
        .site-header,
        .nav-primary,
        .menu,
        .menu-primary,
        .sub-menu,
        .sidebar,
        .widget,
        .widget-wrap,
        .widget-area,
        .footer-widgets,
        .site-footer,
        .archive-title,
        .archive-description,
        .breadcrumb,
        #breadcrumbs,
        article.entry,
        article.post,
        article.post-standard,
        .entry,
        .post,
        .entry-header,
        .entry-content,
        .entry-footer,
        .post-content,
        .post-entry,
        .post-thumbnail,
        .entry-image,
        .post-image,
        .mrm-panel,
        .mrm-panel__head,
        .mrm-panel__body,
        .mrm-panel-toggle,
        .mrm-facet-widget,
        .mrm-facet-widget__head,
        .mrm-facet-widget__body,
        .mrm-facet-modal,
        .mrm-facet-modal__dialog,
        .mrm-reader-page__topbar,
        .mrm-reader-page__dock,
        .mrm-reader-page__thumbs,
        .mrm-reader-page__page,
        .mrm-reader-page__button,
        .mrm-reader-page__hint,
        .mrm-reader-page__empty,
        .mrm-reader-page__loading,
        #mrm-reader-dialog,
        #mrm-reader-overlay,
        .pagination a,
        .pagination span,
        .entry-pagination a,
        .entry-pagination span,
        input,
        select,
        textarea,
        button
      ) {
        border: 0 !important;
        outline-offset: 3px !important;
        box-shadow: none !important;
        text-shadow: none !important;
        background-image: none !important;
      }

      body :is(
        .site-header,
        .nav-primary,
        .sidebar,
        .widget,
        .widget-wrap,
        .footer-widgets .widget-wrap,
        .site-footer,
        .search-form,
        article.entry,
        article.post,
        article.post-standard,
        .entry,
        .post,
        .mrm-panel,
        .mrm-panel-toggle,
        .mrm-facet-widget,
        .mrm-facet-modal__dialog,
        .mrm-reader-page__topbar,
        .mrm-reader-page__dock,
        .mrm-reader-page__thumbs,
        #mrm-reader-dialog,
        .mrm-reader-page__page
      ) {
        background: #0d0e12 !important;
        color: var(--mrm-text) !important;
      }

      body :is(.content, .content-area, .site-content, main, .entry-content, .post-content, .post-entry, .entry-header, .entry-footer) {
        color: var(--mrm-text) !important;
      }

      body :is(.mrm-chip, .mrm-status-pill, .mrm-btn, .mrm-field input, .mrm-field select, .mrm-theme-swatch, .mrm-chip-overflow-button, .mrm-reader-control, .mrm-reader-chip, .mrm-reader-page__button, .pagination a, .pagination span, .entry-pagination a, .entry-pagination span, input, select, textarea, button) {
        background: #151720 !important;
        color: var(--mrm-text) !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      body :is(.mrm-chip:hover, .mrm-btn:hover, .mrm-chip-overflow-button:hover, .mrm-reader-control:hover, .mrm-reader-page__button:hover, .pagination a:hover, .entry-pagination a:hover, button:hover) {
        background: rgba(var(--mrm-accent-rgb), .18) !important;
        color: #ffffff !important;
      }

      body :is(.mrm-chip.is-active, .mrm-chip.is-include, .mrm-mode-btn.is-include, .mrm-status-pill.is-active, .mrm-btn.primary, .mrm-reader-control.is-active, .pagination .current, .entry-pagination .current, button.is-active) {
        background: var(--mrm-accent) !important;
        color: #ffffff !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      body :is(.mrm-chip.is-exclude, .mrm-mode-btn.is-exclude) {
        background: rgba(255, 92, 143, .20) !important;
        color: #ffd6e4 !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      body :is(a, a:visited, .entry-title a, .post-title a, .site-title a) {
        color: #f5f7fb !important;
        text-decoration: none !important;
      }

      body :is(a:hover, a:focus-visible, .entry-title a:hover, .post-title a:hover) {
        color: var(--mrm-accent) !important;
        text-decoration: none !important;
      }

      body :is(input, select, textarea)::placeholder {
        color: var(--mrm-muted) !important;
      }

      body :is(input, select, textarea, button, a):focus-visible {
        outline: 2px solid rgba(var(--mrm-accent-rgb), .76) !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      body :is(hr, table, tr, th, td, fieldset, legend, .entry-meta, .post-meta, .post-info, .post-comments, .comment, .comment-list, .comment-respond) {
        border-color: transparent !important;
        box-shadow: none !important;
        background-image: none !important;
      }

      body :is(.entry-meta, .post-meta, .post-info, .post-comments, .mrm-panel__meta, .mrm-facet-widget__count, .mrm-reader-page__counter, small) {
        color: var(--mrm-muted) !important;
      }

      body :is(img, picture, video, canvas, iframe) {
        box-shadow: none !important;
        border: 0 !important;
      }

      @media (max-width: 760px) {
        body :is(.site-inner, .content-sidebar-wrap, .content, .mrm-panel, article.entry, article.post, article.post-standard) {
          border-radius: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);
    injectStrictDarkFlatThemeStyles();
  }

  function injectStrictDarkFlatThemeStyles() {
    const existing = document.getElementById("mrm-strict-dark-flat-polish-style-v2");
    if (existing) {
      document.head.appendChild(existing);
      return;
    }

    const style = document.createElement("style");
    style.id = "mrm-strict-dark-flat-polish-style-v2";
    style.textContent = `
      :root {
        color-scheme: dark !important;
        --mrm-bg: #050506 !important;
        --mrm-bg-2: #08090b !important;
        --mrm-panel: #0d0e12 !important;
        --mrm-panel-2: #111218 !important;
        --mrm-soft: #151720 !important;
        --mrm-soft-2: #101118 !important;
        --mrm-line: transparent !important;
        --mrm-line-2: transparent !important;
        --mrm-reader-line: transparent !important;
        --mrm-reader-line-strong: transparent !important;
        --mrm-shadow: none !important;
        --mrm-shadow-lg: none !important;
        --mrm-reader-bg: #050506 !important;
        --mrm-reader-bg-2: #08090b !important;
        --mrm-reader-surface: #0d0e12 !important;
        --mrm-text: #f5f7fb !important;
        --mrm-reader-text: #f5f7fb !important;
        --mrm-muted: #a9b2c3 !important;
        --mrm-reader-muted: #a9b2c3 !important;
      }

      html,
      body,
      body.custom-background,
      body[class*="reader-page"],
      #mrm-reader-page {
        background: #050506 !important;
        background-color: #050506 !important;
        background-image: none !important;
        color: var(--mrm-text, #f5f7fb) !important;
      }

      body :where(*) {
        border-color: transparent !important;
        box-shadow: none !important;
        text-shadow: none !important;
      }

      body :where(*::before, *::after) {
        border-color: transparent !important;
        box-shadow: none !important;
        text-shadow: none !important;
        background-image: none !important;
      }

      body :where(
        .site-container,
        .site-inner,
        .site,
        #page,
        #main,
        main,
        .content-sidebar-wrap,
        .site-content,
        .content-area,
        .content,
        .container,
        .wrap,
        .entry,
        .post,
        article,
        article.entry,
        article.post,
        article.post-standard,
        .entry-content,
        .post-content,
        .post-entry,
        .entry-header,
        .entry-footer,
        .post-thumbnail,
        .entry-image,
        .post-image,
        .site-header,
        header,
        nav,
        .nav-primary,
        .menu,
        .menu-primary,
        .sub-menu,
        .sidebar,
        aside,
        .widget,
        .widget-wrap,
        .widget-area,
        .footer-widgets,
        .site-footer,
        footer,
        .archive-title,
        .archive-description,
        .breadcrumb,
        #breadcrumbs,
        .search-form,
        table,
        thead,
        tbody,
        tr,
        th,
        td
      ) {
        background-color: #050506 !important;
        background-image: none !important;
        color: var(--mrm-text, #f5f7fb) !important;
        border-color: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        filter: none !important;
      }

      body :where(
        [class^="mrm-"],
        [class*=" mrm-"],
        #mrm-reader-dialog,
        #mrm-reader-modal,
        #mrm-reader-overlay,
        #mrm-reader-page
      ) {
        background-image: none !important;
        border: 0 !important;
        box-shadow: none !important;
        text-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      body :where(
        [class^="mrm-panel"],
        [class*=" mrm-panel"],
        [class^="mrm-facet"],
        [class*=" mrm-facet"],
        [class^="mrm-reader-page__"],
        [class*=" mrm-reader-page__"],
        [class^="mrm-config"],
        [class*=" mrm-config"],
        [class^="mrm-modal"],
        [class*=" mrm-modal"],
        [class^="mrm-drawer"],
        [class*=" mrm-drawer"],
        [class^="mrm-sheet"],
        [class*=" mrm-sheet"],
        #mrm-reader-dialog,
        #mrm-reader-modal,
        #mrm-reader-page
      ) {
        background-color: #0d0e12 !important;
        color: var(--mrm-text, #f5f7fb) !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      body :where(
        button,
        input,
        select,
        textarea,
        .button,
        .btn,
        .pagination a,
        .pagination span,
        .entry-pagination a,
        .entry-pagination span,
        [class^="mrm-btn"],
        [class*=" mrm-btn"],
        [class^="mrm-button"],
        [class*=" mrm-button"],
        [class^="mrm-chip"],
        [class*=" mrm-chip"],
        [class^="mrm-control"],
        [class*=" mrm-control"],
        [class^="mrm-mode-btn"],
        [class*=" mrm-mode-btn"],
        [class^="mrm-status-pill"],
        [class*=" mrm-status-pill"],
        [class^="mrm-theme-swatch"],
        [class*=" mrm-theme-swatch"],
        [class^="mrm-term-main"],
        [class*=" mrm-term-main"]
      ) {
        background: #151720 !important;
        background-image: none !important;
        color: var(--mrm-text, #f5f7fb) !important;
        border: 0 !important;
        box-shadow: none !important;
        border-radius: 12px !important;
      }

      body :where(
        button:hover,
        .button:hover,
        .btn:hover,
        .pagination a:hover,
        .entry-pagination a:hover,
        [class^="mrm-btn"]:hover,
        [class*=" mrm-btn"]:hover,
        [class^="mrm-button"]:hover,
        [class*=" mrm-button"]:hover,
        [class^="mrm-chip"]:hover,
        [class*=" mrm-chip"]:hover,
        [class^="mrm-control"]:hover,
        [class*=" mrm-control"]:hover,
        [class^="mrm-term-main"]:hover,
        [class*=" mrm-term-main"]:hover
      ) {
        background: rgba(var(--mrm-accent-rgb, 124, 92, 255), .18) !important;
        color: #ffffff !important;
      }

      body :where(
        .is-active,
        .current,
        [aria-current="page"],
        [aria-pressed="true"],
        [class*="is-include"],
        [class*="primary"]
      ):where([class^="mrm-"], [class*=" mrm-"], button, a) {
        background: var(--mrm-accent, #7c5cff) !important;
        color: #ffffff !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      body :where([class*="is-exclude"]):where([class^="mrm-"], [class*=" mrm-"]) {
        background: rgba(255, 92, 143, .20) !important;
        color: #ffd6e4 !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      body :where(a, a:visited, .entry-title a, .post-title a, .site-title a) {
        color: #f5f7fb !important;
        text-decoration: none !important;
      }

      body :where(a:hover, a:focus-visible, .entry-title a:hover, .post-title a:hover) {
        color: var(--mrm-accent, #7c5cff) !important;
        text-decoration: none !important;
      }

      body :where(input, select, textarea, button, a):focus-visible {
        outline: 2px solid rgba(var(--mrm-accent-rgb, 124, 92, 255), .76) !important;
        outline-offset: 3px !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      body :where(img, picture, video, canvas, iframe, svg) {
        border: 0 !important;
        box-shadow: none !important;
      }

      body :where(.entry-meta, .post-meta, .post-info, .post-comments, small, [class*="__meta"], [class*="__count"], [class*="__counter"]) {
        color: var(--mrm-muted, #a9b2c3) !important;
      }

      @media (prefers-reduced-motion: reduce) {
        body :where(*) {
          animation: none !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
    `;
    document.head.appendChild(style);

    if (!window.__mrm_strictDarkFlatThemeOrderGuard) {
      window.__mrm_strictDarkFlatThemeOrderGuard = true;
      const keepLast = () => {
        const strictStyle = document.getElementById("mrm-strict-dark-flat-polish-style-v2");
        if (strictStyle && strictStyle.parentNode === document.head && strictStyle.nextSibling) {
          document.head.appendChild(strictStyle);
        }
      };
      new MutationObserver(keepLast).observe(document.head, { childList: true });
      queueMicrotask(keepLast);
      setTimeout(keepLast, 250);
      setTimeout(keepLast, 1000);
    }
  }

function init() {
    loadState();
    applyFlatThemeRuntime();

    if (!isUiMakeoverEnabled()) {
      stopFooterObserver();
      cleanupSinglePostLayoutArtifacts();
      showUiRestoreToggle();
      return;
    }

    hideUiRestoreToggle();
    injectTypographyStyles();
    injectModernDarkFlatThemeStyles();

    const pageType = detectPageType();

    if (pageType === PAGE_TYPES.READER) {
      initReaderPageModule();
      injectModernDarkFlatThemeStyles();
      return;
    }

    if (pageType === PAGE_TYPES.POST) {
      initPostPageModule();
      injectModernDarkFlatThemeStyles();
      return;
    }

    if (pageType !== PAGE_TYPES.LISTING) {
      stopFooterObserver();
      cleanupSinglePostLayoutArtifacts();
      return;
    }

    initListingPageModule();
    injectModernDarkFlatThemeStyles();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.addEventListener("beforeunload", () => {
    stopFooterObserver();
    clearScheduledNativeFacetApply();
  });
})();