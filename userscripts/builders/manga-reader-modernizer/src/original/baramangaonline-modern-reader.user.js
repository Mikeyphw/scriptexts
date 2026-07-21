// ==UserScript==
// @name         BaraMangaOnline Modern UI + Reader (MRM Theme)
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/baramangaonline-modern-reader
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/builders/manga-reader-modernizer
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/manga-reader-modernizer/src/original/baramangaonline-modern-reader.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/manga-reader-modernizer/src/original/baramangaonline-modern-reader.user.js
// @version      1.5.5
// @description  Force an MRM-style archive/post theme on BaraMangaOnline with dropdown-backed local filters, compact facet panel, and an MRM-grade mobile-first reader popup with fit/width/view/direction controls, thumbnails, tap zones, scrubber, comments, fullscreen, and adjacent post navigation.
// @match        https://baramangaonline.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  if (!location.hostname.includes("baramangaonline.com")) return;

  const STORAGE_KEY = "bmo_mrm_ui_v1";
  const READ_KEY = "bmo_mrm_read_v1";
  const READER_PREFS_KEY = "bmo_mrm_reader_prefs_v2";
  const READER_POPUP_PARAM = "bmo_reader_popup";
  const MAX_READ = 5000;
  const FACET_PAGE_SIZE = 4;
  const FACET_DIALOG_PAGE_SIZE = 24;
  const MOBILE_BREAKPOINT = 920;

  let cachedSinglePostPage = null;
  let cachedPageType = null;
  const domIdCache = new Map();
  const selectionCache = { language: null, category: null };

const facetLabelCache = new Map();
const facetMarkupCache = new Map();
const debouncedPanelHandlers = new Map();

function getCachedFacetLabel(key, slug, fallback = "") {
  const cacheKey = `${key}:${slug}:${fallback}`;
  if (facetLabelCache.has(cacheKey)) return facetLabelCache.get(cacheKey);
  const label = String(findFacetLabel(key, slug) || fallback || titleCase(slug || "")).trim();
  facetLabelCache.set(cacheKey, label);
  return label;
}

function getDebouncedPanelHandler(cacheKey, fn, delay = 120) {
  if (debouncedPanelHandlers.has(cacheKey)) return debouncedPanelHandlers.get(cacheKey);
  const wrapped = debounce(fn, delay);
  debouncedPanelHandlers.set(cacheKey, wrapped);
  return wrapped;
}

function getFacetRowsMarkup(key, items) {
  const selection = state.selected[key] || {};
  const signature = `${key}|${items.map((item) => `${item.slug}:${item.count}`).join(",")}|${Object.entries(selection).map(([term, mode]) => `${term}:${mode}`).join(",")}`;
  const cached = facetMarkupCache.get(signature);
  if (cached) return cached;

  const rows = items.map((item) => {
    const mode = selection[item.slug] || "";
    return `
      <div class="bmo-mrm-term" data-key="${key}" data-term="${item.slug}">
        <button type="button" class="bmo-mrm-term-main" data-action="toggle-term" data-key="${key}" data-term="${item.slug}" data-mode="${mode}">
          <span class="bmo-mrm-term-name">${escapeHtml(item.name)}</span>
          <span class="bmo-mrm-term-count">${item.count}</span>
        </button>
        <div class="bmo-mrm-term-modes">
          <button type="button" class="bmo-mrm-mode-btn ${mode === "include" ? "is-include" : ""}" data-action="set-mode" data-key="${key}" data-term="${item.slug}" data-mode="include">IN</button>
          <button type="button" class="bmo-mrm-mode-btn ${mode === "exclude" ? "is-exclude" : ""}" data-action="set-mode" data-key="${key}" data-term="${item.slug}" data-mode="exclude">OUT</button>
        </div>
      </div>
    `;
  }).join("");

  facetMarkupCache.set(signature, rows);
  return rows;
}

  function getCachedElementById(id) {
    const cached = domIdCache.get(id);
    if (cached && cached.isConnected) return cached;
    const next = document.getElementById(id);
    if (next) domIdCache.set(id, next);
    return next;
  }

  function debounce(fn, delay = 120) {
    let timer = 0;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  }

  function rafThrottle(fn) {
    let scheduled = false;
    let lastArgs = null;
    return (...args) => {
      lastArgs = args;
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        fn(...(lastArgs || []));
      });
    };
  }

  function invalidateSelectionCache(key = "") {
    if (!key) {
      selectionCache.language = null;
      selectionCache.category = null;
      return;
    }
    selectionCache[key] = null;
  }

  function getSelectionSets(key) {
    const cached = selectionCache[key];
    if (cached) return cached;
    const selection = state.selected[key] || {};
    const include = new Set();
    const exclude = new Set();
    for (const [term, mode] of Object.entries(selection)) {
      if (mode === "include") include.add(term);
      else if (mode === "exclude") exclude.add(term);
    }
    const next = { include, exclude };
    selectionCache[key] = next;
    return next;
  }

  const LANGUAGE_MAP = new Map([
    ["eng", "English"],
    ["english", "English"],
    ["jpn", "Japanese"],
    ["jp", "Japanese"],
    ["japanese", "Japanese"],
    ["spa", "Spanish"],
    ["spanish", "Spanish"],
    ["chi", "Chinese"],
    ["cn", "Chinese"],
    ["chinese", "Chinese"],
    ["kor", "Korean"],
    ["kr", "Korean"],
    ["korean", "Korean"],
    ["pt", "Portuguese"],
    ["portuguese", "Portuguese"],
    ["fr", "French"],
    ["french", "French"],
    ["de", "German"],
    ["german", "German"],
    ["it", "Italian"],
    ["italian", "Italian"],
    ["thai", "Thai"],
    ["vn", "Vietnamese"],
    ["vietnamese", "Vietnamese"],
    ["ru", "Russian"],
    ["russian", "Russian"],
  ]);

  const state = {
    cards: [],
    archiveRoot: null,
    panelHost: null,
    facets: { language: [], category: [] },
    ui: {
      enabled: true,
      query: "",
      hideRead: false,
      panelCollapsed: false,
      openFacet: "language",
      facetSearch: { language: "", category: "" },
      facetPage: { language: 0, category: 0 },
      dock: "right",
      gridDesktop: 4,
      gridTablet: 3,
      gridMobile: 1,
      gap: 14,
      compact: true,
      configOpen: false,
      panelOpen: false,
    },
    selected: {
      language: {},
      category: {},
    },
    modal: {
      opener: null,
      currentHref: "",
      currentTitle: "",
      commentCount: 0,
      view: "reader",
    },
    facetDialog: {
      key: "",
      search: "",
      page: 0,
    },
    visibleCardCount: 0,
    timers: {
      apply: 0,
      panelSearch: 0,
    },
  };

  const READER_IDS = {
    style: "bmo-mrm-reader-modal-style",
    overlay: "bmo-mrm-reader-overlay",
    dialog: "bmo-mrm-reader-dialog",
    frame: "bmo-mrm-reader-frame",
  };

  const CONFIG_IDS = {
    fab: "bmo-mrm-config-fab",
    panel: "bmo-mrm-config-panel",
  };

  const ARCHIVE_PANEL_IDS = {
    mobileHost: "bmo-mrm-archive-mobile-panel-host",
    backdrop: "bmo-mrm-archive-panel-backdrop",
  };

  function isArchiveMobileViewport() {
    return document.body.classList.contains("bmo-mrm-archive-active") && window.innerWidth <= 980;
  }

  function applyArchivePanelHostState(host) {
    if (!(host instanceof HTMLElement)) return;
    const archiveActive = document.body.classList.contains("bmo-mrm-archive-active");
    const open = Boolean(archiveActive && state.ui.panelOpen);
    const mobile = isArchiveMobileViewport();
    const backdrop = document.getElementById(ARCHIVE_PANEL_IDS.backdrop);

    host.hidden = !open;
    host.setAttribute("aria-hidden", open ? "false" : "true");
    host.classList.toggle("is-open", open);
    host.setAttribute(
      "style",
      [
        "position:fixed",
        "z-index:2147483646",
        "margin:0",
        "padding:0",
        "background:transparent",
        "overflow:auto",
        "box-sizing:border-box",
        mobile ? "left:8px" : "left:auto",
        mobile ? "right:8px" : "right:16px",
        mobile ? "top:72px" : "top:auto",
        mobile ? "bottom:8px" : "bottom:72px",
        mobile ? "width:auto" : "width:min(360px, calc(100vw - 24px))",
        mobile ? "max-width:none" : "max-width:min(360px, calc(100vw - 24px))",
        mobile ? "max-height:calc(100vh - 84px)" : "max-height:calc(100vh - 100px)",
        open ? "display:block" : "display:none",
        open ? "visibility:visible" : "visibility:hidden",
        open ? "opacity:1" : "opacity:0",
        open ? "pointer-events:auto" : "pointer-events:none"
      ].join(";")
    );

    if (backdrop instanceof HTMLElement) {
      backdrop.hidden = true;
      backdrop.setAttribute(
        "style",
        [
          "position:fixed",
          "inset:0",
          "background:transparent",
          "z-index:2147483645",
          "display:none",
          "visibility:hidden",
          "opacity:0",
          "pointer-events:none"
        ].join(";")
      );
    }
  }

  function shouldHidePromoArchiveCard(article, href, title) {
    const normalizedHref = normalizeHref(href) || href || "";
    const loweredTitle = String(title || "").toLowerCase();
    const categoryText = slugify(article?.querySelector(".post-category")?.textContent || "");
    if (normalizedHref.includes("/eng-phoenix-media-gay-harem/")) return true;
    if (loweredTitle.includes("gay harem") || loweredTitle.includes("kobans")) return true;
    if (categoryText.includes("phoenix media") && categoryText.includes("gay harem")) return true;
    return false;
  }


  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[‐‑‒–—]+/g, "-");
  }

  function titleCase(value) {
    return String(value || "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function normalizeLanguage(value) {
    const raw = slugify(value);
    if (!raw) return "";
    return LANGUAGE_MAP.get(raw) || titleCase(raw);
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (parsed?.ui) {
        Object.assign(state.ui, parsed.ui);
        if (!Object.prototype.hasOwnProperty.call(parsed.ui, "gridMobile")) {
          state.ui.gridMobile = 1;
        }
      }
      if (parsed?.selected?.language) state.selected.language = parsed.selected.language;
      if (parsed?.selected?.category) state.selected.category = parsed.selected.category;
    } catch {}
  }

  function saveState() {
    const payload = {
      ui: state.ui,
      selected: state.selected,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function getReadSet() {
    try {
      const raw = JSON.parse(localStorage.getItem(READ_KEY) || "[]");
      return new Set(Array.isArray(raw) ? raw : []);
    } catch {
      return new Set();
    }
  }

  function saveReadSet(readSet) {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(readSet).slice(-MAX_READ)));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }


  function getDefaultReaderPrefs() {
    return {
      widthMode: "comfort",
      fitMode: "width",
      viewMode: "strip-gaps",
      direction: "ltr",
      thumbsCollapsed: false,
      page: 0,
    };
  }

  function sanitizeReaderPrefs(value) {
    const defaults = getDefaultReaderPrefs();
    const source = value && typeof value === "object" ? value : {};
    const legacyViewMode = source.viewMode === "gaps"
      ? "strip-gaps"
      : source.viewMode === "paged"
        ? "paged"
        : source.flowMode === "paged"
          ? "paged"
          : defaults.viewMode;

    return {
      widthMode: source.widthMode === "wide" ? "wide" : defaults.widthMode,
      fitMode: source.fitMode === "height" ? "height" : defaults.fitMode,
      viewMode: ["strip", "strip-gaps", "paged"].includes(source.viewMode) ? source.viewMode : legacyViewMode,
      direction: source.direction === "rtl" ? "rtl" : defaults.direction,
      thumbsCollapsed: source.thumbsCollapsed === undefined
        ? source.thumbsOpen === undefined
          ? defaults.thumbsCollapsed
          : !Boolean(source.thumbsOpen)
        : Boolean(source.thumbsCollapsed),
      page: Number.isFinite(source.page) ? Math.max(0, Number(source.page)) : defaults.page,
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

  function getDropdownCategoryCatalog() {
    const options = Array.from(document.querySelectorAll(".widget_categories select#cat option, .widget_categories select option"))
      .filter((node) => node instanceof HTMLOptionElement);

    const labels = options
      .map((option) => option.textContent?.trim() || "")
      .filter((label) => label && !/^select category$/i.test(label))
      .map((label) => titleCase(label));

    return [...new Set(labels)];
  }


  function isReaderPopupPage() {
    try {
      return new URL(location.href).searchParams.get(READER_POPUP_PARAM) === "1";
    } catch {
      return false;
    }
  }

  function isSinglePostPage() {
    if (cachedSinglePostPage !== null) return cachedSinglePostPage;
    const body = document.body;
    if (!body) {
      cachedSinglePostPage = false;
      return cachedSinglePostPage;
    }
    const cls = body.classList;
    cachedSinglePostPage = cls.contains("single") || cls.contains("single-post") || Boolean(document.querySelector("article.post .entry.themeform"));
    return cachedSinglePostPage;
  }

  function detectPageType() {
    if (cachedPageType) return cachedPageType;
    if (isReaderPopupPage()) {
      cachedPageType = "reader";
      return cachedPageType;
    }
    cachedPageType = isSinglePostPage() ? "post" : "listing";
    return cachedPageType;
  }

  function findArchiveRoot() {
    return (
      document.querySelector(".content > .content-inner > .pad.group") ||
      document.querySelector(".content .content-inner > .pad.group") ||
      document.querySelector(".content .pad.group")
    );
  }

  function getCardHref(article) {
    const link = article.querySelector(".post-thumbnail a[href], .post-title a[href], a[href]");
    return link instanceof HTMLAnchorElement ? link.href : "";
  }

  function getCardTitle(article) {
    return (
      article.querySelector(".post-title a")?.textContent?.trim() ||
      article.querySelector(".post-title")?.textContent?.trim() ||
      article.querySelector("h1, h2, h3")?.textContent?.trim() ||
      ""
    );
  }

  function getCardImage(article) {
    const img = article.querySelector(".post-thumbnail img, img");
    if (!(img instanceof HTMLImageElement)) return "";
    const candidates = [
      img.getAttribute("data-lazy-src"),
      img.getAttribute("data-src"),
      img.getAttribute("data-lazy-original"),
      img.getAttribute("data-original"),
      img.getAttribute("src"),
    ].filter(Boolean);

    const srcset = img.getAttribute("data-lazy-srcset") || img.getAttribute("data-srcset") || img.getAttribute("srcset");
    if (srcset) {
      for (const part of srcset.split(",")) {
        const url = part.trim().split(/\s+/)[0];
        if (url && !url.startsWith("data:")) return url;
      }
    }

    const valid = candidates.find((item) => item && !item.startsWith("data:"));
    return valid || "";
  }

  function getCardDate(article) {
    return article.querySelector(".post-date")?.textContent?.trim() || "";
  }

  function getCardComments(article) {
    const raw = article.querySelector(".post-comments")?.textContent || "";
    const count = Number.parseInt(raw.replace(/[^\d]/g, ""), 10);
    return Number.isFinite(count) ? count : 0;
  }

  function parseTaxonomiesFromLinks(links, title = "") {
    const language = [];
    const category = [];

    for (const link of links) {
      const text = link.textContent?.trim();
      if (!text) continue;
      let hrefPath = "";
      try {
        hrefPath = new URL(link.href, location.href).pathname.toLowerCase();
      } catch {}
      const byText = LANGUAGE_MAP.has(slugify(text));
      if (hrefPath.includes("/category/languages/") || byText) {
        const normalized = normalizeLanguage(text);
        if (normalized) language.push(normalized);
      } else {
        category.push(titleCase(text));
      }
    }

    const titlePrefix = title.match(/^\s*\[([^\]]+)\]/);
    if (titlePrefix) {
      for (const token of titlePrefix[1].split(/[,+/&]/).map((value) => normalizeLanguage(value)).filter(Boolean)) {
        language.push(token);
      }
    }

    return {
      language: [...new Set(language)],
      category: [...new Set(category)],
    };
  }

  function markRead(href) {
    if (!href) return;
    const readSet = getReadSet();
    const normalized = normalizeHref(href);
    if (readSet.has(normalized)) return;
    readSet.add(normalized);
    saveReadSet(readSet);
    for (const card of state.cards) {
      if (normalizeHref(card.href) === normalized) {
        card.article.classList.add("bmo-mrm-read");
        card.read = true;
      }
    }
    applyArchiveFilters();
  }

  function normalizeHref(url) {
    try {
      const next = new URL(url, location.href);
      next.searchParams.delete(READER_POPUP_PARAM);
      next.hash = "";
      return next.toString();
    } catch {
      return String(url || "").replace(/[?#].*$/, "");
    }
  }

  function isMobileView() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function indexArchiveCards() {
    const root = findArchiveRoot();
    if (!(root instanceof HTMLElement)) return [];
    state.archiveRoot = root;
    const readSet = getReadSet();
    const articles = Array.from(root.querySelectorAll(":scope > article.post-standard, :scope > article.post, :scope > article.hentry"))
      .filter((node) => node instanceof HTMLElement);

    state.cards = articles
      .map((article, index) => {
        const href = getCardHref(article);
        const title = getCardTitle(article);
        if (!href || !title) return null;
        if (shouldHidePromoArchiveCard(article, href, title)) {
          article.style.display = "none";
          article.setAttribute("data-bmo-mrm-hidden-promo", "1");
          return null;
        }
        const taxLinks = Array.from(article.querySelectorAll(".post-category a[href]")).filter((node) => node instanceof HTMLAnchorElement);
        const meta = parseTaxonomiesFromLinks(taxLinks, title);
        const titleSlug = slugify(title);
        const date = getCardDate(article);
        const language = meta.language;
        const category = meta.category;
        const languageSlugs = language.map(slugify);
        const categorySlugs = category.map(slugify);
        const entry = {
          article,
          id: normalizeHref(href) || `${location.pathname}::${index}`,
          href,
          title,
          titleSlug,
          image: getCardImage(article),
          date,
          comments: getCardComments(article),
          language,
          category,
          languageSlugs,
          categorySlugs,
          languageSlugSet: new Set(languageSlugs),
          categorySlugSet: new Set(categorySlugs),
          searchIndex: [title, date, ...language, ...category].map(slugify).join("\n"),
          read: readSet.has(normalizeHref(href)),
          visible: true,
        };
        article.dataset.bmoMrmId = entry.id;
        article.classList.toggle("bmo-mrm-read", entry.read);
        article.dataset.bmoMrmLanguage = entry.languageSlugs.join("|");
        article.dataset.bmoMrmCategory = entry.categorySlugs.join("|");
        article.dataset.bmoMrmTitle = entry.titleSlug;
        return entry;
      })
      .filter(Boolean);

    state.visibleCardCount = state.cards.length;
    refreshGridClass();
    injectArchiveCardButtons();
    return state.cards;
  }

  function buildFacetItems(values, extraNames = []) {
    const names = new Set([
      ...values.keys(),
      ...extraNames,
    ]);

    return Array.from(names)
      .map((name) => {
        const normalized = titleCase(name);
        return {
          name: normalized,
          slug: slugify(normalized),
          count: values.get(normalized) || values.get(name) || 0,
        };
      })
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  }

  function rebuildFacetModel() {
    const languageMap = new Map();
    const categoryMap = new Map();

    for (const card of state.cards) {
      for (const item of card.language) {
        languageMap.set(item, (languageMap.get(item) || 0) + 1);
      }
      for (const item of card.category) {
        categoryMap.set(item, (categoryMap.get(item) || 0) + 1);
      }
    }

    const categoryCatalog = [
      ...getDropdownCategoryCatalog(),
      ...Object.keys(state.selected.category || {}).map(titleCase),
      ...Array.from(categoryMap.keys()).map(titleCase),
    ];

    state.facets.language = buildFacetItems(languageMap, Object.keys(state.selected.language || {}).map(titleCase));
    state.facets.category = buildFacetItems(categoryMap, categoryCatalog);

    if (!state.ui.openFacet) {
      state.ui.openFacet = state.facets.language.length ? "language" : "category";
    }
  }

  function cardMatchesSelections(card, key) {
    const { include, exclude } = getSelectionSets(key);
    const valueSet = key === "language"
      ? (card.languageSlugSet || new Set(card.languageSlugs || []))
      : key === "category"
        ? (card.categorySlugSet || new Set(card.categorySlugs || []))
        : new Set((card[key] || []).map(slugify));

    if (include.size) {
      let hasIncluded = false;
      for (const item of include) {
        if (valueSet.has(item)) {
          hasIncluded = true;
          break;
        }
      }
      if (!hasIncluded) return false;
    }

    if (exclude.size) {
      for (const item of exclude) {
        if (valueSet.has(item)) return false;
      }
    }

    return true;
  }

  function applyArchiveFilters() {
    if (!state.cards.length) return;
    const query = slugify(state.ui.query);
    let visibleCount = 0;
    for (const card of state.cards) {
      const matchesQuery = !query || (card.searchIndex || "").includes(query);
      const matchesRead = !state.ui.hideRead || !card.read;
      const matchesLanguage = cardMatchesSelections(card, "language");
      const matchesCategory = cardMatchesSelections(card, "category");
      const visible = matchesQuery && matchesRead && matchesLanguage && matchesCategory;
      if (visible) visibleCount += 1;
      if (card.visible !== visible) {
        card.visible = visible;
        card.article.classList.toggle("bmo-mrm-hidden-card", !visible);
      }
    }
    state.visibleCardCount = visibleCount;
    updateReaderNavButtons();
  }

  function refreshGridClass() {
    document.querySelectorAll(".bmo-mrm-results-grid").forEach((node) => {
      if (node !== state.archiveRoot) node.classList.remove("bmo-mrm-results-grid");
    });
    if (state.archiveRoot instanceof HTMLElement) {
      state.archiveRoot.classList.add("bmo-mrm-results-grid");
    }
  }


  function syncArchivePanelVisibility() {
    const archiveOpen = Boolean(document.body.classList.contains("bmo-mrm-archive-active") && state.ui.panelOpen);
    document.body.classList.toggle("bmo-mrm-archive-panel-open", archiveOpen);
    document.body.classList.toggle("bmo-mrm-mobile-panel-open", Boolean(isArchiveMobileViewport() && state.ui.panelOpen));
    applyArchivePanelHostState(state.panelHost);
  }


  function initArchivePanelEscapeBehavior() {
    if (window.__bmoMrmPanelEscapeBound) return;
    window.__bmoMrmPanelEscapeBound = true;
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!document.body.classList.contains("bmo-mrm-archive-panel-open")) return;
      state.ui.panelOpen = false;
      state.ui.configOpen = false;
      saveState();
      syncArchivePanelVisibility();
      renderArchivePanel();
    });
  }

  function initArchivePanelBackdropBehavior() {
    if (window.__bmoMrmPanelBackdropBound) return;
    window.__bmoMrmPanelBackdropBound = true;
    document.addEventListener("click", (event) => {
      if (!document.body.classList.contains("bmo-mrm-archive-panel-open")) return;
      const host = state.panelHost;
      const fab = document.getElementById(CONFIG_IDS.fab);
      const backdrop = document.getElementById(ARCHIVE_PANEL_IDS.backdrop);
      const target = event.target;
      if (!(target instanceof Node)) return;
      if ((host && host.contains(target)) || (fab && fab.contains(target))) return;
      if (backdrop && backdrop.contains(target) || target === backdrop) {
        state.ui.panelOpen = false;
        state.ui.configOpen = false;
        saveState();
        syncArchivePanelVisibility();
        renderArchivePanel();
        return;
      }
      if (!host || !host.contains(target)) {
        state.ui.panelOpen = false;
        state.ui.configOpen = false;
        saveState();
        syncArchivePanelVisibility();
        renderArchivePanel();
      }
    }, true);
  }

  function initArchivePanelViewportBehavior() {
    if (window.__bmoMrmPanelViewportBound) {
      createPanelHost();
      syncArchivePanelVisibility();
      return;
    }
    window.__bmoMrmPanelViewportBound = true;
    const onResize = rafThrottle(() => {
      createPanelHost();
      syncArchivePanelVisibility();
    });
    window.addEventListener("resize", onResize, { passive: true });
    createPanelHost();
    syncArchivePanelVisibility();
  }

  function createPanelHost() {
    let backdrop = document.getElementById(ARCHIVE_PANEL_IDS.backdrop);
    if (!(backdrop instanceof HTMLElement)) {
      backdrop = document.createElement("div");
      backdrop.id = ARCHIVE_PANEL_IDS.backdrop;
      backdrop.className = "bmo-mrm-archive-panel-backdrop";
      document.body.appendChild(backdrop);
    } else if (backdrop.parentElement !== document.body) {
      document.body.appendChild(backdrop);
    }

    let host = document.getElementById(ARCHIVE_PANEL_IDS.mobileHost);
    if (!(host instanceof HTMLElement)) {
      host = document.createElement("aside");
      host.id = ARCHIVE_PANEL_IDS.mobileHost;
      host.className = "bmo-mrm-panel-host bmo-mrm-panel-host-floating";
      document.body.appendChild(host);
    } else if (host.parentElement !== document.body) {
      document.body.appendChild(host);
    }

    state.panelHost = host;
    applyArchivePanelHostState(host);
    return host;
  }

  function getFacetSelectionCount(key) {
    return Object.values(state.selected[key]).filter(Boolean).length;
  }

  function getFacetVisibleItems(key) {
    const allItems = state.facets[key] || [];
    const search = slugify(state.ui.facetSearch[key] || "");
    const filtered = search ? allItems.filter((item) => slugify(item.name).includes(search)) : allItems;
    const page = Math.max(0, state.ui.facetPage[key] || 0);
    const totalPages = Math.max(1, Math.ceil(filtered.length / FACET_PAGE_SIZE));
    const safePage = Math.min(page, totalPages - 1);
    state.ui.facetPage[key] = safePage;
    const start = safePage * FACET_PAGE_SIZE;
    return {
      items: filtered.slice(start, start + FACET_PAGE_SIZE),
      total: filtered.length,
      page: safePage,
      totalPages,
    };
  }

  function scheduleArchiveSearchUpdate(nextValue) {
    window.clearTimeout(state.timers.panelSearch);
    state.timers.panelSearch = window.setTimeout(() => {
      state.ui.query = nextValue;
      saveState();
      applyArchiveFilters();
      renderArchivePanel();
    }, isMobileView() ? 140 : 80);
  }

  function renderFacetSection(key, label) {
    const isOpen = state.ui.openFacet === key && !state.ui.panelCollapsed;
    const count = getFacetSelectionCount(key);
    const view = getFacetVisibleItems(key);
    const searchValue = state.ui.facetSearch[key] || "";
    const canBrowse = (state.facets[key] || []).length > FACET_PAGE_SIZE;
    const rows = getFacetRowsMarkup(key, view.items);

    const pager = view.totalPages > 1 ? `
      <div class="bmo-mrm-facet-pager">
        <button type="button" data-action="facet-page" data-key="${key}" data-page="${Math.max(0, view.page - 1)}" ${view.page === 0 ? "disabled" : ""}>‹</button>
        ${Array.from({ length: view.totalPages }, (_, index) => `
          <button type="button" data-action="facet-page" data-key="${key}" data-page="${index}" class="${index === view.page ? "is-active" : ""}">${index + 1}</button>
        `).join("")}
        <button type="button" data-action="facet-page" data-key="${key}" data-page="${Math.min(view.totalPages - 1, view.page + 1)}" ${view.page >= view.totalPages - 1 ? "disabled" : ""}>›</button>
      </div>
    ` : "";

    const empty = view.total === 0 ? `
      <div class="bmo-mrm-empty">
        No ${label.toLowerCase()} options match the current facet search.
      </div>
    ` : rows;

    return `
      <section class="bmo-mrm-facet ${isOpen ? "is-open" : ""}" data-facet="${key}">
        <button type="button" class="bmo-mrm-facet-head" data-action="toggle-facet" data-key="${key}">
          <span>${label}</span>
          <span class="bmo-mrm-facet-meta">${count ? `${count} selected` : `${state.facets[key].length} total`}</span>
        </button>
        <div class="bmo-mrm-facet-body">
          <div class="bmo-mrm-facet-search-row">
            <input class="bmo-mrm-input" type="search" value="${escapeAttribute(searchValue)}" data-action="facet-search" data-key="${key}" placeholder="Search ${label.toLowerCase()}..." />
            ${canBrowse ? `<button type="button" class="bmo-mrm-icon-btn" data-action="open-facet-dialog" data-key="${key}">Browse</button>` : ""}
          </div>
          ${empty}
          ${pager}
        </div>
      </section>
    `;
  }

  function getFacetDialogView(key) {
    const allItems = state.facets[key] || [];
    const search = slugify(state.facetDialog.search || "");
    const filtered = search ? allItems.filter((item) => slugify(item.name).includes(search)) : allItems;
    const page = Math.max(0, state.facetDialog.page || 0);
    const totalPages = Math.max(1, Math.ceil(filtered.length / FACET_DIALOG_PAGE_SIZE));
    const safePage = Math.min(page, totalPages - 1);
    state.facetDialog.page = safePage;
    const start = safePage * FACET_DIALOG_PAGE_SIZE;
    return {
      items: filtered.slice(start, start + FACET_DIALOG_PAGE_SIZE),
      total: filtered.length,
      page: safePage,
      totalPages,
    };
  }

  function renderFacetDialog() {
    const key = state.facetDialog.key;
    if (!key) return "";
    const label = key === "language" ? "Language" : key === "category" ? "Category" : titleCase(key);
    const view = getFacetDialogView(key);
    const rows = view.total === 0 ? `
      <div class="bmo-mrm-empty">
        No ${label.toLowerCase()} options match the current facet search.
      </div>
    ` : getFacetRowsMarkup(key, view.items);

    const pager = view.totalPages > 1 ? `
      <div class="bmo-mrm-facet-pager is-modal">
        <button type="button" data-action="facet-dialog-page" data-page="${Math.max(0, view.page - 1)}" ${view.page === 0 ? "disabled" : ""}>‹</button>
        ${Array.from({ length: view.totalPages }, (_, index) => `
          <button type="button" data-action="facet-dialog-page" data-page="${index}" class="${index === view.page ? "is-active" : ""}">${index + 1}</button>
        `).join("")}
        <button type="button" data-action="facet-dialog-page" data-page="${Math.min(view.totalPages - 1, view.page + 1)}" ${view.page >= view.totalPages - 1 ? "disabled" : ""}>›</button>
      </div>
    ` : "";

    return `
      <div class="bmo-mrm-facet-dialog-backdrop" data-action="close-facet-dialog">
        <div class="bmo-mrm-facet-dialog" role="dialog" aria-modal="true" aria-label="${escapeAttribute(label)} facet browser">
          <div class="bmo-mrm-facet-dialog-head">
            <div>
              <h3 class="bmo-mrm-facet-dialog-title">${escapeHtml(label)} browser</h3>
              <div class="bmo-mrm-panel-subtitle">Browse the full ${escapeHtml(label.toLowerCase())} list.</div>
            </div>
            <button type="button" class="bmo-mrm-icon-btn" data-action="close-facet-dialog">Close</button>
          </div>
          <div class="bmo-mrm-facet-dialog-toolbar">
            <input class="bmo-mrm-input" type="search" value="${escapeAttribute(state.facetDialog.search || "")}" data-dialog-search="${key}" placeholder="Search ${label.toLowerCase()}..." />
          </div>
          <div class="bmo-mrm-facet-dialog-body">
            ${rows}
          </div>
          <div class="bmo-mrm-facet-dialog-footer">
            ${pager}
            <span class="bmo-mrm-results-summary">${view.total} matching options</span>
          </div>
        </div>
      </div>
    `;
  }


  function renderInlineGridTuner() {
    return `
      <div class="bmo-mrm-inline-grid">
        <div class="bmo-mrm-inline-grid-head">
          <h3 class="bmo-mrm-inline-grid-title">Grid tuner</h3>
          <span class="bmo-mrm-inline-grid-subtitle">Live archive layout controls</span>
        </div>
        <div class="bmo-mrm-inline-grid-fields">
          <label class="bmo-mrm-inline-grid-field">
            <span>Desktop</span>
            <input class="bmo-mrm-input mini" type="number" min="2" max="8" value="${state.ui.gridDesktop}" data-inline-config="gridDesktop" />
          </label>
          <label class="bmo-mrm-inline-grid-field">
            <span>Tablet</span>
            <input class="bmo-mrm-input mini" type="number" min="1" max="6" value="${state.ui.gridTablet}" data-inline-config="gridTablet" />
          </label>
          <label class="bmo-mrm-inline-grid-field">
            <span>Mobile</span>
            <input class="bmo-mrm-input mini" type="number" min="1" max="3" value="${state.ui.gridMobile}" data-inline-config="gridMobile" />
          </label>
          <label class="bmo-mrm-inline-grid-field">
            <span>Gap</span>
            <input class="bmo-mrm-input mini" type="number" min="6" max="32" value="${state.ui.gap}" data-inline-config="gap" />
          </label>
        </div>
        <label class="bmo-mrm-toggle compact-inline">
          <input type="checkbox" ${state.ui.compact ? "checked" : ""} data-inline-config="compact" />
          <span>Compact cards and panel</span>
        </label>
      </div>
    `;
  }

  function applyInlineGridTuner(root) {
    if (!(root instanceof HTMLElement)) return;
    const gridDesktop = root.querySelector("[data-inline-config='gridDesktop']");
    const gridTablet = root.querySelector("[data-inline-config='gridTablet']");
    const gridMobile = root.querySelector("[data-inline-config='gridMobile']");
    const gap = root.querySelector("[data-inline-config='gap']");
    const compact = root.querySelector("[data-inline-config='compact']");

    if (gridDesktop instanceof HTMLInputElement) state.ui.gridDesktop = clamp(Number.parseInt(gridDesktop.value, 10) || 4, 2, 8);
    if (gridTablet instanceof HTMLInputElement) state.ui.gridTablet = clamp(Number.parseInt(gridTablet.value, 10) || 3, 1, 6);
    if (gridMobile instanceof HTMLInputElement) state.ui.gridMobile = clamp(Number.parseInt(gridMobile.value, 10) || 1, 1, 3);
    if (gap instanceof HTMLInputElement) state.ui.gap = clamp(Number.parseInt(gap.value, 10) || 14, 6, 32);
    if (compact instanceof HTMLInputElement) state.ui.compact = compact.checked;

    saveState();
    injectBaseStyles();
    injectArchiveMobileOverrideStyles();
    injectShellHotfixStyles();
    applyArchiveFilters();
    renderArchivePanel();
    renderConfigPanel();
  }

  function renderArchivePanel() {
    const host = createPanelHost();
    if (!(host instanceof HTMLElement)) return;

    host.innerHTML = `
      <div id="bmo-mrm-panel" class="${state.ui.panelCollapsed ? "is-collapsed" : ""}">
        <div class="bmo-mrm-panel-head">
          <div>
            <h2 class="bmo-mrm-panel-title">BMO Filters</h2>
            <div class="bmo-mrm-panel-subtitle">MRM-style local panel for loaded cards and site categories.</div>
          </div>
          <button type="button" class="bmo-mrm-icon-btn" data-action="toggle-panel">${state.ui.panelOpen ? "Close" : "Filters"}</button>
        </div>
        <div class="bmo-mrm-config-row">
          <label class="bmo-mrm-toggle">
            <input type="checkbox" ${state.ui.enabled ? "checked" : ""} data-action="toggle-ui" />
            <span>Enable UI makeover</span>
          </label>
        </div>
        ${renderInlineGridTuner()}
        <div class="bmo-mrm-toolbar">
          <input class="bmo-mrm-input" type="search" value="${escapeAttribute(state.ui.query)}" placeholder="Search loaded cards..." data-action="search" />
          <label class="bmo-mrm-toggle">
            <input type="checkbox" ${state.ui.hideRead ? "checked" : ""} data-action="hide-read" />
            <span>Hide read</span>
          </label>
        </div>
        <div class="bmo-mrm-active">
          ${renderActiveChips()}
        </div>
        <div class="bmo-mrm-facets">
          ${renderFacetSection("language", "Language")}
          ${renderFacetSection("category", "Category")}
        </div>
        <div class="bmo-mrm-panel-footer">
          <button type="button" class="bmo-mrm-btn ghost" data-action="reset-filters">Reset</button>
          <span class="bmo-mrm-results-summary">${getVisibleCardCount()} / ${state.cards.length} visible</span>
        </div>
        ${renderFacetDialog()}
      </div>
    `;

    host.querySelectorAll("[data-action='search']").forEach((input) => {
      const onSearchInput = getDebouncedPanelHandler("archive-search", (value) => {
        scheduleArchiveSearchUpdate(value);
      });
      input.addEventListener("input", (event) => {
        onSearchInput(event.currentTarget.value);
      });
    });

    host.querySelectorAll("[data-action='facet-search']").forEach((input) => {
      const key = input.dataset.key || "";
      const onFacetSearchInput = getDebouncedPanelHandler(`facet-search:${key}`, (value) => {
        state.ui.facetSearch[key] = value;
        state.ui.facetPage[key] = 0;
        saveState();
        renderArchivePanel();
      });
      input.addEventListener("input", (event) => {
        onFacetSearchInput(event.currentTarget.value);
      });
    });

    host.querySelectorAll("[data-dialog-search]").forEach((input) => {
      const onDialogSearchInput = getDebouncedPanelHandler("facet-dialog-search", (value) => {
        state.facetDialog.search = value;
        state.facetDialog.page = 0;
        renderArchivePanel();
      });
      input.addEventListener("input", (event) => {
        onDialogSearchInput(event.currentTarget.value);
      });
    });

    host.querySelectorAll("[data-inline-config='gridDesktop'], [data-inline-config='gridTablet'], [data-inline-config='gridMobile'], [data-inline-config='gap']").forEach((input) => {
      input.addEventListener("change", () => applyInlineGridTuner(host));
    });

    host.querySelectorAll("[data-inline-config='compact']").forEach((input) => {
      input.addEventListener("change", () => applyInlineGridTuner(host));
    });

    const backdrop = host.querySelector(".bmo-mrm-facet-dialog-backdrop");
    backdrop?.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        state.facetDialog.key = "";
        renderArchivePanel();
      }
    });

    host.onclick = onPanelClick;
  }

  function onPanelClick(event) {
    const target = event.target.closest("[data-action]");
    if (!(target instanceof HTMLElement)) {
      renderArchivePanel();
      return;
    }

    const action = target.dataset.action;
    const key = target.dataset.key;
    const term = target.dataset.term;
    switch (action) {
      case "toggle-panel":
        state.ui.panelOpen = !state.ui.panelOpen;
        state.ui.panelCollapsed = false;
        if (!state.ui.panelOpen) state.ui.configOpen = false;
        syncArchivePanelVisibility();
        break;
      case "toggle-ui":
        state.ui.enabled = target.matches("input") ? target.checked : !state.ui.enabled;
        saveState();
        location.reload();
        return;
      case "open-config":
        state.ui.configOpen = true;
        break;
      case "hide-read":
        state.ui.hideRead = target.matches("input") ? target.checked : !state.ui.hideRead;
        applyArchiveFilters();
        break;
      case "toggle-facet":
        state.ui.openFacet = state.ui.openFacet === key ? "" : key;
        break;
      case "facet-page":
        state.ui.facetPage[key] = Number.parseInt(target.dataset.page || "0", 10) || 0;
        break;
      case "open-facet-dialog":
        state.facetDialog.key = key || "";
        state.facetDialog.search = state.ui.facetSearch[key] || "";
        state.facetDialog.page = 0;
        break;
      case "close-facet-dialog":
        state.facetDialog.key = "";
        state.facetDialog.search = "";
        state.facetDialog.page = 0;
        break;
      case "facet-dialog-page":
        state.facetDialog.page = Number.parseInt(target.dataset.page || "0", 10) || 0;
        break;
      case "set-mode":
        setTermMode(key, term, target.dataset.mode || "");
        applyArchiveFilters();
        break;
      case "toggle-term": {
        const current = state.selected[key][term] || "";
        const next = current === "include" ? "exclude" : current === "exclude" ? "" : "include";
        setTermMode(key, term, next);
        applyArchiveFilters();
        break;
      }
      case "clear-chip":
        clearTermChip(key, term);
        applyArchiveFilters();
        break;
      case "reset-filters":
        state.ui.query = "";
        state.ui.hideRead = false;
        state.ui.facetSearch.language = "";
        state.ui.facetSearch.category = "";
        state.ui.facetPage.language = 0;
        state.ui.facetPage.category = 0;
        state.facetDialog.key = "";
        state.facetDialog.search = "";
        state.facetDialog.page = 0;
        state.selected.language = {};
        state.selected.category = {};
        applyArchiveFilters();
        break;
      default:
        break;
    }

    saveState();
    renderArchivePanel();
  }

  function clearTermChip(key, term) {
    delete state.selected[key][term];
  }

  function setTermMode(key, term, mode) {
    if (!key || !term) return;
    if (!mode) delete state.selected[key][term];
    else state.selected[key][term] = mode;
  }

  function renderActiveChips() {
    const chips = [];
    for (const [key, selection] of Object.entries(state.selected)) {
      for (const [term, mode] of Object.entries(selection)) {
        const label = findFacetLabel(key, term) || titleCase(term);
        chips.push(`
          <button type="button" class="bmo-mrm-chip ${mode === "exclude" ? "is-exclude" : "is-include"}" data-action="clear-chip" data-key="${key}" data-term="${term}">
            ${mode === "exclude" ? "OUT" : "IN"}: ${escapeHtml(label)} ×
          </button>
        `);
      }
    }

    if (!chips.length) {
      return `<div class="bmo-mrm-active-empty">No active filters.</div>`;
    }
    return chips.join("");
  }

  function findFacetLabel(key, slug) {
    const item = (state.facets[key] || []).find((entry) => entry.slug === slug);
    return item ? item.name : "";
  }

  function getVisibleCardCount() {
    if (Number.isFinite(state.visibleCardCount)) return state.visibleCardCount;
    return state.cards.filter((card) => card.visible !== false).length;
  }


  function injectArchiveCardChips(card, content) {
    let chipRow = content.querySelector(".bmo-mrm-card-chip-row");
    if (!(chipRow instanceof HTMLElement)) {
      chipRow = document.createElement("div");
      chipRow.className = "bmo-mrm-card-chip-row";
      const title = content.querySelector(".post-title");
      if (title instanceof HTMLElement) {
        title.insertAdjacentElement("beforebegin", chipRow);
      } else {
        content.insertAdjacentElement("afterbegin", chipRow);
      }
    }

    const chips = [
      ...card.language.slice(0, 2).map((label) => ({ label, cls: "language" })),
      ...card.category.slice(0, 3).map((label) => ({ label, cls: "category" })),
    ];

    chipRow.innerHTML = chips
      .map((item) => `<span class="bmo-mrm-card-chip ${item.cls}">${escapeHtml(item.label)}</span>`)
      .join("");
  }

  function injectArchiveCardButtons() {
    for (const card of state.cards) {
      const content = card.article.querySelector(".post-content");
      if (!(content instanceof HTMLElement)) continue;

      injectArchiveCardChips(card, content);

      let actions = content.querySelector(".bmo-mrm-card-actions");
      if (!(actions instanceof HTMLElement)) {
        actions = document.createElement("div");
        actions.className = "bmo-mrm-card-actions";
        content.appendChild(actions);
      }

      let reader = actions.querySelector(".bmo-mrm-reader-trigger");
      if (!(reader instanceof HTMLButtonElement)) {
        reader = document.createElement("button");
        reader.type = "button";
        reader.className = "bmo-mrm-card-btn bmo-mrm-reader-trigger";
        reader.textContent = "Reader";
        reader.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          markRead(card.href);
          openReaderModal(card.href, reader);
        });
        actions.appendChild(reader);
      }

      const link = card.article.querySelector(".post-title a, .post-thumbnail a");
      if (link instanceof HTMLAnchorElement && !link.dataset.bmoMrmTracked) {
        link.dataset.bmoMrmTracked = "1";
        link.addEventListener("click", () => markRead(card.href));
      }
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }

  function collectReaderImages(root = document) {
    const found = [];
    const seen = new Set();
    const container = root.querySelector("article.post .entry.themeform > .entry-inner, .entry.themeform > .entry-inner, .entry-inner, .entry");
    const anchors = Array.from((container || root).querySelectorAll("a[href*='/wp-content/uploads/']"));
    for (const anchor of anchors) {
      if (!(anchor instanceof HTMLAnchorElement)) continue;
      const href = anchor.href;
      if (!href || seen.has(href)) continue;
      const image = anchor.querySelector("img");
      if (!(image instanceof HTMLImageElement)) continue;
      seen.add(href);
      found.push({
        href,
        thumb: getImageCandidate(image),
        alt: image.getAttribute("alt") || "",
      });
    }

    if (!found.length) {
      const images = Array.from((container || root).querySelectorAll("img"));
      for (const image of images) {
        if (!(image instanceof HTMLImageElement)) continue;
        const href = getImageCandidate(image);
        if (!href || seen.has(href)) continue;
        if (!/wp-content\/uploads\//i.test(href)) continue;
        seen.add(href);
        found.push({ href, thumb: href, alt: image.getAttribute("alt") || "" });
      }
    }

    return found;
  }

  function getImageCandidate(image) {
    const srcset = image.getAttribute("data-lazy-srcset") || image.getAttribute("data-srcset") || image.getAttribute("srcset");
    if (srcset) {
      for (const part of srcset.split(",")) {
        const url = part.trim().split(/\s+/)[0];
        if (url && !url.startsWith("data:")) return url;
      }
    }
    const candidates = [
      image.getAttribute("data-lazy-src"),
      image.getAttribute("data-src"),
      image.getAttribute("data-lazy-original"),
      image.getAttribute("data-original"),
      image.getAttribute("src"),
    ];
    return candidates.find((item) => item && !item.startsWith("data:")) || "";
  }

  function getSinglePostTitle() {
    return document.querySelector("article.post > h1.post-title, article.post .post-title")?.textContent?.trim() || document.title;
  }

  function getSinglePostCommentCount() {
    const match = document.documentElement.innerHTML.match(/"commentCount"\s*:\s*(\d+)/);
    if (match) {
      const count = Number.parseInt(match[1], 10);
      if (Number.isFinite(count)) return count;
    }
    const link = document.querySelector("a[href$='#comments'], a[href*='#comments']");
    if (link) {
      const count = Number.parseInt((link.textContent || "").replace(/[^\d]/g, ""), 10);
      if (Number.isFinite(count)) return count;
    }
    return document.querySelectorAll("#comments ol li, #comments .comment").length;
  }


function extractCommentCountFromRoot(root = document) {
  try {
    const html = root?.documentElement?.innerHTML || "";
    const match = html.match(/"commentCount"\s*:\s*(\d+)/);
    if (match) {
      const count = Number.parseInt(match[1], 10);
      if (Number.isFinite(count)) return count;
    }
  } catch {}

  const commentsRoot = root?.querySelector?.("#comments");
  if (commentsRoot instanceof HTMLElement) {
    const listed = commentsRoot.querySelectorAll("ol.commentlist > li, .commentlist > li, .comment").length;
    if (listed) return listed;
  }

  const link = root?.querySelector?.(".post-comments, a[href$='#comments'], a[href*='#comments']");
  if (link instanceof HTMLElement) {
    const count = Number.parseInt((link.textContent || "").replace(/[^\d]/g, ""), 10);
    if (Number.isFinite(count)) return count;
  }

  return 0;
}

function getCommentCountForHref(href = "") {
  const target = normalizeHref(href || state.modal.currentHref || location.href);
  if (!target) return 0;
  if (target === normalizeHref(location.href)) return getSinglePostCommentCount();
  const card = findCardByHref(target);
  return card?.comments || state.modal.commentCount || 0;
}


  function getSinglePostMeta() {
    const byline = document.querySelector("article.post .post-byline");
    const links = Array.from(byline?.querySelectorAll("a[href]") || []).filter((node) => node instanceof HTMLAnchorElement);
    const meta = parseTaxonomiesFromLinks(links, getSinglePostTitle());
    return {
      language: meta.language,
      category: meta.category,
    };
  }

  function getAdjacentPostLinks(root = document, currentHref = location.href) {
    const prevSelectors = [
      ".post-nav .post-nav-prev a[href]",
      ".post-nav .prev a[href]",
      ".post-nav a[rel='prev'][href]",
      "a[rel='prev'][href]",
      ".previous a[href]",
    ];
    const nextSelectors = [
      ".post-nav .post-nav-next a[href]",
      ".post-nav .next a[href]",
      ".post-nav a[rel='next'][href]",
      "a[rel='next'][href]",
      ".next a[href]",
    ];

    const normalize = (value) => normalizeHref(value || "");
    const current = normalize(currentHref);

    function pick(selectors, fallbackIndex) {
      for (const selector of selectors) {
        const node = root?.querySelector(selector);
        if (node instanceof HTMLAnchorElement && node.href && normalize(node.href) !== current) {
          return node.href;
        }
      }
      const navRoot = root?.querySelector(".post-nav, .post-navigation, nav.navigation, .navigation.post-navigation");
      if (navRoot instanceof HTMLElement) {
        const links = Array.from(navRoot.querySelectorAll("a[href]")).filter((node) => node instanceof HTMLAnchorElement && normalize(node.href) !== current);
        const pickNode = links[fallbackIndex] || null;
        if (pickNode instanceof HTMLAnchorElement) return pickNode.href;
      }
      return "";
    }

    return {
      prev: pick(prevSelectors, 0),
      next: pick(nextSelectors, 1),
    };
  }

  function getReaderNavigationContext() {
    const visibleCards = state.cards.filter((card) => !card.article.classList.contains("bmo-mrm-hidden-card"));
    const current = normalizeHref(state.modal.currentHref);
    const index = visibleCards.findIndex((card) => normalizeHref(card.href) === current);
    if (index !== -1 && visibleCards.length) {
      return {
        mode: "cards",
        visibleCards,
        index,
        prevHref: visibleCards[index - 1]?.href || "",
        nextHref: visibleCards[index + 1]?.href || "",
      };
    }

    const frame = document.getElementById(READER_IDS.frame);
    const frameDoc = frame instanceof HTMLIFrameElement ? frame.contentDocument : null;
    const links = getAdjacentPostLinks(frameDoc || document, state.modal.currentHref);
    return {
      mode: "post",
      visibleCards: [],
      index: -1,
      prevHref: links.prev,
      nextHref: links.next,
    };
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

  function updateReaderNavButtons() {
    const overlay = document.getElementById(READER_IDS.overlay);
    if (!(overlay instanceof HTMLElement)) return;
    const prev = overlay.querySelector(".bmo-mrm-reader-prev");
    const next = overlay.querySelector(".bmo-mrm-reader-next");
    const back = overlay.querySelector(".bmo-mrm-reader-back");
    const comments = overlay.querySelector(".bmo-mrm-reader-comments");
    if (!(prev instanceof HTMLButtonElement) || !(next instanceof HTMLButtonElement) || !(back instanceof HTMLButtonElement)) return;

    const context = getReaderNavigationContext();
    prev.disabled = !context.prevHref;
    next.disabled = !context.nextHref;
    prev.title = context.mode === "cards" ? "Previous visible card" : "Previous post";
    next.title = context.mode === "cards" ? "Next visible card" : "Next post";
    back.hidden = state.modal.view !== "comments";

    if (comments instanceof HTMLButtonElement) {
      const count = getCommentCountForHref(state.modal.currentHref);
      state.modal.commentCount = count;
      comments.classList.toggle("has-count", count > 0);
      if (count > 0) comments.setAttribute("data-count", String(count));
      else comments.removeAttribute("data-count");
      comments.title = count ? `${count} comments` : "Open comments";
    }
  }

  function injectReaderModalStyles() {
    if (document.getElementById(READER_IDS.style)) return;
    const style = document.createElement("style");
    style.id = READER_IDS.style;
    style.textContent = `
      #${READER_IDS.overlay} {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(8, 10, 18, 0.82);
        backdrop-filter: blur(8px);
      }
      #${READER_IDS.overlay}.is-open { display: flex; }
      #${READER_IDS.dialog} {
        width: min(1500px, calc(100vw - 20px));
        height: min(94vh, 1200px);
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,.12);
        background: #0b0f18;
        overflow: hidden;
        box-shadow: 0 24px 80px rgba(0,0,0,.45);
        position: relative;
      }
      #${READER_IDS.dialog}.is-fullscreen {
        width: calc(100vw - 10px);
        height: calc(100vh - 10px);
        border-radius: 14px;
      }
      #${READER_IDS.frame} {
        width: 100%;
        height: 100%;
        border: 0;
        background: #0b0f18;
      }
      .bmo-mrm-reader-toolbar {
        position: absolute;
        top: 12px;
        left: 12px;
        right: 12px;
        z-index: 5;
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .bmo-mrm-reader-title {
        min-width: 0;
        flex: 1 1 auto;
        height: 40px;
        padding: 0 14px;
        display: flex;
        align-items: center;
        border-radius: 999px;
        background: rgba(10,12,20,.72);
        border: 1px solid rgba(255,255,255,.10);
        color: #fff;
        font: 700 13px/1 Inter, system-ui, sans-serif;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .bmo-mrm-reader-actions {
        display: flex;
        gap: 8px;
        margin-left: auto;
      }
      .bmo-mrm-reader-btn {
        appearance: none;
        min-width: 40px;
        height: 40px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(10,12,20,.85);
        color: #fff;
        font: 700 13px/1 Inter, system-ui, sans-serif;
        cursor: pointer;
      }
      .bmo-mrm-reader-btn.has-count::after {
        content: attr(data-count);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        margin-left: 8px;
        padding: 0 5px;
        border-radius: 999px;
        background: rgba(255,255,255,.18);
        color: #fff;
        font: 800 10px/1 Inter, system-ui, sans-serif;
      }
      .bmo-mrm-reader-btn[disabled] {
        opacity: .42;
        cursor: not-allowed;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureReaderModal() {
    let overlay = document.getElementById(READER_IDS.overlay);
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = READER_IDS.overlay;
    overlay.innerHTML = `
      <div id="${READER_IDS.dialog}" role="dialog" aria-modal="true" aria-label="BMO reader">
        <div class="bmo-mrm-reader-toolbar">
          <div class="bmo-mrm-reader-title">Reader</div>
          <div class="bmo-mrm-reader-actions">
            <button type="button" class="bmo-mrm-reader-btn bmo-mrm-reader-prev" aria-label="Previous visible card">Prev</button>
            <button type="button" class="bmo-mrm-reader-btn bmo-mrm-reader-next" aria-label="Next visible card">Next</button>
            <button type="button" class="bmo-mrm-reader-btn bmo-mrm-reader-comments" aria-label="Open comments">Comments</button>
            <button type="button" class="bmo-mrm-reader-btn bmo-mrm-reader-back" aria-label="Back to reader" hidden>Back</button>
            <button type="button" class="bmo-mrm-reader-btn bmo-mrm-reader-open-tab" aria-label="Open in new tab">Open</button>
            <button type="button" class="bmo-mrm-reader-btn bmo-mrm-reader-fullscreen" aria-label="Toggle fullscreen">Full</button>
            <button type="button" class="bmo-mrm-reader-btn bmo-mrm-reader-close" aria-label="Close reader">×</button>
          </div>
        </div>
        <iframe id="${READER_IDS.frame}" loading="eager" referrerpolicy="same-origin"></iframe>
      </div>
    `;

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeReaderModal();
    });

    overlay.querySelector(".bmo-mrm-reader-close")?.addEventListener("click", closeReaderModal);
    overlay.querySelector(".bmo-mrm-reader-prev")?.addEventListener("click", () => navigateReader(-1));
    overlay.querySelector(".bmo-mrm-reader-next")?.addEventListener("click", () => navigateReader(1));
    overlay.querySelector(".bmo-mrm-reader-fullscreen")?.addEventListener("click", toggleReaderFullscreen);
    overlay.querySelector(".bmo-mrm-reader-open-tab")?.addEventListener("click", () => {
      const target = state.modal.view === "comments" ? `${state.modal.currentHref}#comments` : buildReaderPopupUrl(state.modal.currentHref);
      window.open(target, "_blank", "noopener,noreferrer");
    });
    overlay.querySelector(".bmo-mrm-reader-comments")?.addEventListener("click", openReaderComments);
    overlay.querySelector(".bmo-mrm-reader-back")?.addEventListener("click", backToReader);

    document.addEventListener("keydown", (event) => {
      if (!overlay.classList.contains("is-open")) return;
      if (event.key === "Escape") closeReaderModal();
      if (event.key === "ArrowLeft") navigateReader(-1);
      if (event.key === "ArrowRight") navigateReader(1);
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        toggleReaderFullscreen();
      }
    });

    window.addEventListener("message", (event) => {
      if (event.origin !== location.origin) return;
      const data = event.data || {};
      if (data.source !== "bmo-reader-embed") return;
      if (data.action === "close") closeReaderModal();
      if (data.action === "comments") openReaderComments();
      if (data.action === "fullscreen") toggleReaderFullscreen();
      if (data.action === "prev-post") navigateReader(-1);
      if (data.action === "next-post") navigateReader(1);
    });

const frame = overlay.querySelector(`#${READER_IDS.frame}`);
if (frame instanceof HTMLIFrameElement) {
  frame.addEventListener("load", () => {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      state.modal.commentCount = extractCommentCountFromRoot(doc);
      const docTitle = doc.querySelector("article.post > h1.post-title, article.post .post-title")?.textContent?.trim();
      if (docTitle) state.modal.currentTitle = docTitle;
      if (state.modal.view === "comments") {
        const commentsRoot = doc.getElementById("comments");
        commentsRoot?.scrollIntoView({ behavior: "auto", block: "start" });
      }
      updateReaderTitle();
      updateReaderNavButtons();
    } catch {}
  });
}

    document.body.appendChild(overlay);
    return overlay;
  }

  function updateReaderTitle() {
    const overlay = document.getElementById(READER_IDS.overlay);
    const title = overlay?.querySelector(".bmo-mrm-reader-title");
    if (!(title instanceof HTMLElement)) return;
    const base = state.modal.currentTitle || "Reader";
    const value = state.modal.view === "comments" ? `${base} · Comments` : base;
    title.textContent = value;
    title.title = value;
  }

  function openReaderModal(url, opener = null) {
    if (!url) return;
    state.modal.currentHref = normalizeHref(url);
    state.modal.currentTitle = findCardByHref(url)?.title || getSinglePostTitle();
    state.modal.commentCount = getCommentCountForHref(url);
    state.modal.opener = opener instanceof HTMLElement ? opener : state.modal.opener;
    state.modal.view = "reader";
    const overlay = ensureReaderModal();
    const frame = overlay.querySelector(`#${READER_IDS.frame}`);
    if (!(frame instanceof HTMLIFrameElement)) return;
    frame.src = buildReaderPopupUrl(url);
    overlay.classList.add("is-open");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    updateReaderTitle();
    updateReaderNavButtons();
  }

  function closeReaderModal() {
    const overlay = document.getElementById(READER_IDS.overlay);
    if (!(overlay instanceof HTMLElement)) return;
    const frame = overlay.querySelector(`#${READER_IDS.frame}`);
    if (frame instanceof HTMLIFrameElement) frame.src = "about:blank";
    overlay.classList.remove("is-open");
    document.getElementById(READER_IDS.dialog)?.classList.remove("is-fullscreen");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    const opener = state.modal.opener;
    state.modal.view = "reader";
    if (opener instanceof HTMLElement && document.contains(opener)) {
      try { opener.focus(); } catch {}
    }
  }

  function toggleReaderFullscreen() {
    const dialog = document.getElementById(READER_IDS.dialog);
    if (!(dialog instanceof HTMLElement)) return;
    dialog.classList.toggle("is-fullscreen");
  }

  function openReaderComments() {
    const overlay = document.getElementById(READER_IDS.overlay);
    const frame = overlay?.querySelector(`#${READER_IDS.frame}`);
    if (!(frame instanceof HTMLIFrameElement) || !state.modal.currentHref) return;
    state.modal.commentCount = getCommentCountForHref(state.modal.currentHref);
    state.modal.view = "comments";
    frame.src = `${state.modal.currentHref}#comments`;
    updateReaderTitle();
    updateReaderNavButtons();
  }

  function backToReader() {
    const overlay = document.getElementById(READER_IDS.overlay);
    const frame = overlay?.querySelector(`#${READER_IDS.frame}`);
    if (!(frame instanceof HTMLIFrameElement) || !state.modal.currentHref) return;
    state.modal.view = "reader";
    frame.src = buildReaderPopupUrl(state.modal.currentHref);
    updateReaderTitle();
    updateReaderNavButtons();
  }

  function findCardByHref(url) {
    const target = normalizeHref(url);
    return state.cards.find((card) => normalizeHref(card.href) === target) || null;
  }

  function navigateReader(step) {
    if (!state.modal.currentHref) return;
    const context = getReaderNavigationContext();
    const targetHref = step < 0 ? context.prevHref : context.nextHref;
    if (!targetHref) return;
    openReaderModal(targetHref, state.modal.opener);
  }

  function injectSinglePostToolbar() {
    const article = document.querySelector("article.post");
    const title = article?.querySelector("h1.post-title");
    if (!(article instanceof HTMLElement) || !(title instanceof HTMLElement)) return;

    article.classList.add("bmo-mrm-post-article");

    const meta = getSinglePostMeta();
    if (!article.querySelector(".bmo-mrm-chip-row")) {
      const chips = document.createElement("div");
      chips.className = "bmo-mrm-chip-row";
      const allChips = [
        ...meta.language.map((item) => ({ label: item, cls: "language" })),
        ...meta.category.map((item) => ({ label: item, cls: "category" })),
      ];
      chips.innerHTML = allChips.map((item) => `<span class="bmo-mrm-post-chip ${item.cls}">${escapeHtml(item.label)}</span>`).join("");
      title.insertAdjacentElement("beforebegin", chips);
    }

    if (!article.querySelector(".bmo-mrm-post-toolbar")) {
      const toolbar = document.createElement("div");
      toolbar.className = "bmo-mrm-post-toolbar";
      const commentsCount = getSinglePostCommentCount();
      toolbar.innerHTML = `
        <button type="button" class="bmo-mrm-btn primary bmo-mrm-single-reader">Reader Mode</button>
        <a class="bmo-mrm-btn ghost" href="#comments">Comments${commentsCount ? ` <span class="bmo-mrm-btn-badge">${commentsCount}</span>` : ""}</a>
      `;
      title.insertAdjacentElement("afterend", toolbar);

      toolbar.querySelector(".bmo-mrm-single-reader")?.addEventListener("click", () => {
        openReaderModal(location.href, toolbar.querySelector(".bmo-mrm-single-reader"));
      });

      toolbar.querySelector("a[href='#comments']")?.addEventListener("click", (event) => {
        event.preventDefault();
        document.getElementById("comments")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function styleSinglePostImages() {
    const entryInner = document.querySelector("article.post .entry.themeform > .entry-inner, .entry.themeform > .entry-inner");
    if (!(entryInner instanceof HTMLElement)) return;
    for (const anchor of entryInner.querySelectorAll("a[href*='/wp-content/uploads/']")) {
      if (!(anchor instanceof HTMLAnchorElement)) continue;
      anchor.classList.add("bmo-mrm-page-anchor");
      const image = anchor.querySelector("img");
      if (image instanceof HTMLImageElement) {
        image.classList.add("bmo-mrm-page-image");
      }
    }
  }

  function styleSinglePostMeta() {
    const article = document.querySelector("article.post");
    if (!(article instanceof HTMLElement)) return;
    article.querySelector(".post-byline")?.classList.add("bmo-mrm-post-byline");
    article.querySelector(".entry.themeform > .entry-inner, .entry-inner")?.classList.add("bmo-mrm-post-entry-inner");
    article.querySelector(".post-nav")?.classList.add("bmo-mrm-post-nav");
    document.getElementById("comments")?.classList.add("bmo-mrm-comments-shell");
    document.getElementById("respond")?.classList.add("bmo-mrm-respond-shell");
    document.querySelectorAll("h4.heading, .yarpp.yarpp-related h2, .yarpp.yarpp-related h3, .yarpp-related h2, .yarpp-related h3").forEach((node) => {
      node?.classList?.add("bmo-mrm-section-heading");
    });
  }

  function styleRelatedPosts() {
    const related = document.querySelector(".related-posts");
    if (!(related instanceof HTMLElement)) return;
    related.classList.add("bmo-mrm-related-grid");
    const articles = Array.from(related.querySelectorAll(":scope > li.related article")).filter((node) => node instanceof HTMLElement);
    for (const article of articles) {
      const content = article.querySelector(".post-content");
      if (!(content instanceof HTMLElement)) continue;
      let actions = content.querySelector(".bmo-mrm-card-actions");
      if (!(actions instanceof HTMLElement)) {
        actions = document.createElement("div");
        actions.className = "bmo-mrm-card-actions";
        content.appendChild(actions);
      }
      if (!actions.querySelector(".bmo-mrm-reader-trigger")) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "bmo-mrm-card-btn bmo-mrm-reader-trigger";
        button.textContent = "Reader";
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const href = getCardHref(article);
          if (href) openReaderModal(href, button);
        });
        actions.appendChild(button);
      }
    }
  }


  function styleYouMayAlsoLike() {
    const section = document.querySelector(".yarpp.yarpp-related, .yarpp-related");
    if (!(section instanceof HTMLElement)) return;
    section.classList.add("bmo-mrm-yarpp-shell");
    const heading = section.querySelector("h2, h3, h4");
    if (heading instanceof HTMLElement) {
      heading.classList.add("bmo-mrm-yarpp-title");
      heading.textContent = (heading.textContent || "").trim().replace(/\.+$/, "");
    }
    const grid = section.querySelector(".yarpp-thumbnails-horizontal");
    if (grid instanceof HTMLElement) {
      grid.classList.add("bmo-mrm-yarpp-grid");
    }
    for (const item of section.querySelectorAll(".yarpp-thumbnail")) {
      if (!(item instanceof HTMLAnchorElement)) continue;
      item.classList.add("bmo-mrm-yarpp-card");
      item.querySelector("img")?.classList?.add("bmo-mrm-yarpp-image");
      item.querySelector(".yarpp-thumbnail-title")?.classList?.add("bmo-mrm-yarpp-card-title");
    }
  }

  function restyleSinglePostLayout() {
    document.body.classList.add("bmo-mrm-single-active");
    document.querySelector(".sidebar.s1")?.classList.add("bmo-mrm-hidden-native");
    document.querySelector(".sidebar.s2")?.classList.add("bmo-mrm-hidden-native");
    document.querySelectorAll(".sharrre-container, .attachment-magaziner-large, .post-format, .post-nav").forEach((node) => {
      node?.classList?.add("bmo-mrm-hidden-native");
    });
    injectSinglePostToolbar();
    styleSinglePostMeta();
    styleSinglePostImages();
    styleRelatedPosts();
    styleYouMayAlsoLike();
  }


  function renderReaderPage() {
    injectReaderPageStyles();

    const images = collectReaderImages(document).map((image) => ({
      src: image.href,
      thumb: image.thumb || image.href,
      alt: image.alt || "",
      width: 0,
      height: 0,
    }));
    const prefs = loadReaderPrefs();
    const title = getSinglePostTitle();
    const commentCount = getSinglePostCommentCount();
    const adjacent = getAdjacentPostLinks(document, location.href);
    const cleanUrl = new URL(location.href);
    cleanUrl.searchParams.delete(READER_POPUP_PARAM);
    const postUrl = cleanUrl.toString();

    document.documentElement.classList.add("bmo-mrm-reader-root");
    document.body.className = "bmo-mrm-reader-page";

    const root = document.createElement("div");
    root.id = "bmo-mrm-reader-page";
    document.body.replaceChildren(root);

    function postReaderMessage(action) {
      if (window.top === window.self) return;
      window.parent.postMessage({ source: "bmo-reader-embed", action }, location.origin);
    }

    function applyReaderPrefs(controls = {}) {
      const next = sanitizeReaderPrefs(prefs);
      root.classList.toggle("is-wide", next.widthMode === "wide");
      root.classList.toggle("is-thumbs-collapsed", next.thumbsCollapsed);
      root.dataset.fit = next.fitMode;
      root.dataset.view = next.viewMode;
      root.dataset.flow = next.viewMode === "paged" ? "paged" : "continuous";
      root.dataset.direction = next.direction;

      if (controls.widthButton instanceof HTMLElement) {
        controls.widthButton.textContent = `Width: ${next.widthMode === "wide" ? "Wide" : "Comfort"}`;
      }
      if (controls.fitButton instanceof HTMLElement) {
        controls.fitButton.textContent = `Fit: ${next.fitMode === "height" ? "Height" : "Width"}`;
      }
      if (controls.viewButton instanceof HTMLElement) {
        const viewLabel = next.viewMode === "strip" ? "Long Strip" : next.viewMode === "strip-gaps" ? "Long Strip + Gaps" : "Paged";
        controls.viewButton.textContent = `View: ${viewLabel}`;
      }
      if (controls.directionButton instanceof HTMLElement) {
        controls.directionButton.textContent = `Dir: ${next.direction.toUpperCase()}`;
      }
      const thumbButtons = Array.isArray(controls.thumbnailButtons) ? controls.thumbnailButtons : [];
      thumbButtons.forEach((button) => {
        if (!(button instanceof HTMLElement)) return;
        button.textContent = next.thumbsCollapsed ? "Thumbs: Show" : "Thumbs: Hide";
      });

      saveReaderPrefs(next);
    }

    function getPageStep() {
      return prefs.viewMode === "paged" ? 1 : 1;
    }

    function scrollPageIntoView(pageNodes, index, behavior = "smooth") {
      const node = pageNodes[index];
      if (!(node instanceof HTMLElement)) return;
      node.scrollIntoView({ behavior, block: prefs.viewMode === "paged" ? "center" : "start", inline: "nearest" });
    }

    function getNearestPageIndex(pageNodes) {
      if (!pageNodes.length) return 0;
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      const anchor = window.innerWidth <= 860 ? 64 : 82;
      for (let index = 0; index < pageNodes.length; index += 1) {
        const rect = pageNodes[index].getBoundingClientRect();
        const distance = Math.abs(rect.top - anchor);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      }
      return bestIndex;
    }

    function navigatePages(pageNodes, delta) {
      const current = getNearestPageIndex(pageNodes);
      const bounded = clamp(current + delta, 0, Math.max(0, pageNodes.length - 1));
      prefs.page = bounded;
      saveReaderPrefs(prefs);
      scrollPageIntoView(pageNodes, bounded);
    }

    function toggleTopbar() {
      root.classList.toggle("is-topbar-hidden");
    }

    const topbar = document.createElement("header");
    topbar.className = "bmo-mrm-reader-page__topbar";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "bmo-mrm-reader-page__button";
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", () => {
      if (window.top === window.self) {
        location.href = postUrl;
        return;
      }
      postReaderMessage("close");
    });

    const titleWrap = document.createElement("div");
    titleWrap.className = "bmo-mrm-reader-page__title";

    const titleText = document.createElement("div");
    titleText.className = "bmo-mrm-reader-page__title-text";
    titleText.textContent = title;

    const progress = document.createElement("div");
    progress.className = "bmo-mrm-reader-page__progress";
    progress.textContent = images.length ? `Page 1 / ${images.length}` : "No pages found";

    titleWrap.append(titleText, progress);

    const toolbar = document.createElement("div");
    toolbar.className = "bmo-mrm-reader-page__toolbar";

    const prevPostButton = document.createElement("button");
    prevPostButton.type = "button";
    prevPostButton.className = "bmo-mrm-reader-page__button";
    prevPostButton.textContent = "Prev Post";
    prevPostButton.disabled = !adjacent.prev;
    prevPostButton.addEventListener("click", () => {
      if (!adjacent.prev) return;
      if (window.top === window.self) {
        location.href = buildReaderPopupUrl(adjacent.prev);
        return;
      }
      postReaderMessage("prev-post");
    });

    const nextPostButton = document.createElement("button");
    nextPostButton.type = "button";
    nextPostButton.className = "bmo-mrm-reader-page__button";
    nextPostButton.textContent = "Next Post";
    nextPostButton.disabled = !adjacent.next;
    nextPostButton.addEventListener("click", () => {
      if (!adjacent.next) return;
      if (window.top === window.self) {
        location.href = buildReaderPopupUrl(adjacent.next);
        return;
      }
      postReaderMessage("next-post");
    });

    const widthButton = document.createElement("button");
    widthButton.type = "button";
    widthButton.className = "bmo-mrm-reader-page__button";

    const fitButton = document.createElement("button");
    fitButton.type = "button";
    fitButton.className = "bmo-mrm-reader-page__button";

    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.className = "bmo-mrm-reader-page__button";

    const directionButton = document.createElement("button");
    directionButton.type = "button";
    directionButton.className = "bmo-mrm-reader-page__button";

    const thumbsButton = document.createElement("button");
    thumbsButton.type = "button";
    thumbsButton.className = "bmo-mrm-reader-page__button";

    const fullscreenButton = document.createElement("button");
    fullscreenButton.type = "button";
    fullscreenButton.className = "bmo-mrm-reader-page__button";
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
    commentsButton.className = "bmo-mrm-reader-page__button bmo-mrm-reader-page__button--comments";
    commentsButton.textContent = "Comments";
    commentsButton.dataset.count = String(commentCount || 0);
    commentsButton.addEventListener("click", () => {
      if (window.top === window.self) {
        location.href = `${postUrl}#comments`;
        return;
      }
      postReaderMessage("comments");
    });

    const originalLink = document.createElement("a");
    originalLink.className = "bmo-mrm-reader-page__button";
    originalLink.href = postUrl;
    originalLink.target = "_blank";
    originalLink.rel = "noopener noreferrer";
    originalLink.textContent = "Open Post";

    toolbar.append(
      prevPostButton,
      nextPostButton,
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
    main.className = "bmo-mrm-reader-page__main";

    const tapZones = document.createElement("div");
    tapZones.className = "bmo-mrm-reader-page__tapzones";

    const tapPrev = document.createElement("button");
    tapPrev.type = "button";
    tapPrev.className = "bmo-mrm-reader-page__tapzone bmo-mrm-reader-page__tapzone--start";
    tapPrev.setAttribute("aria-label", "Previous page");

    const tapToggle = document.createElement("button");
    tapToggle.type = "button";
    tapToggle.className = "bmo-mrm-reader-page__tapzone bmo-mrm-reader-page__tapzone--center";
    tapToggle.setAttribute("aria-label", "Toggle top bar");

    const tapNext = document.createElement("button");
    tapNext.type = "button";
    tapNext.className = "bmo-mrm-reader-page__tapzone bmo-mrm-reader-page__tapzone--end";
    tapNext.setAttribute("aria-label", "Next page");

    tapZones.append(tapPrev, tapToggle, tapNext);

    if (!images.length) {
      const empty = document.createElement("section");
      empty.className = "bmo-mrm-reader-page__empty";
      const copy = document.createElement("p");
      copy.textContent = "Reader mode could not find post images in the main content area on this page.";
      empty.appendChild(copy);
      main.appendChild(empty);
      root.append(topbar, main, tapZones);
      applyReaderPrefs({ widthButton, fitButton, viewButton, directionButton, thumbnailButtons: [thumbsButton] });
      return;
    }

    const stack = document.createElement("div");
    stack.className = "bmo-mrm-reader-page__stack";

    const pageNodes = [];
    const thumbNodes = [];

    images.forEach((image, index) => {
      const figure = document.createElement("figure");
      figure.className = "bmo-mrm-reader-page__page";
      figure.dataset.index = String(index);

      const img = document.createElement("img");
      img.className = "bmo-mrm-reader-page__image";
      img.src = image.src;
      img.alt = image.alt || `${title} — page ${index + 1}`;
      img.loading = index < 3 ? "eager" : "lazy";
      img.decoding = "async";
      img.referrerPolicy = "same-origin";

      const caption = document.createElement("figcaption");
      caption.className = "bmo-mrm-reader-page__caption";
      const left = document.createElement("span");
      left.textContent = `Page ${index + 1}`;
      const right = document.createElement("span");
      right.textContent = " ";
      caption.append(left, right);

      figure.append(img, caption);
      stack.appendChild(figure);
      pageNodes.push(figure);
    });

    const hint = document.createElement("div");
    hint.className = "bmo-mrm-reader-page__hint";
    hint.textContent = "Tap zones • Esc close • F fullscreen • W width • M fit • C view • R direction • T thumbnails • Alt+←/→ posts";

    const thumbsPanel = document.createElement("aside");
    thumbsPanel.className = "bmo-mrm-reader-page__thumbs";

    const thumbsHead = document.createElement("div");
    thumbsHead.className = "bmo-mrm-reader-page__thumbs-head";
    const thumbsTitle = document.createElement("div");
    thumbsTitle.textContent = "Thumbnail strip";
    const thumbsSummary = document.createElement("div");
    thumbsSummary.textContent = `${images.length} pages`;
    thumbsHead.append(thumbsTitle, thumbsSummary);

    const thumbsStrip = document.createElement("div");
    thumbsStrip.className = "bmo-mrm-reader-page__thumbs-strip";

    images.forEach((image, index) => {
      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "bmo-mrm-reader-page__thumb";
      thumb.setAttribute("aria-label", `Jump to page ${index + 1}`);

      const thumbImageWrap = document.createElement("div");
      thumbImageWrap.className = "bmo-mrm-reader-page__thumb-image-wrap";

      const thumbImage = document.createElement("img");
      thumbImage.src = image.thumb || image.src;
      thumbImage.alt = image.alt || `${title} thumbnail ${index + 1}`;
      thumbImage.loading = index < 10 ? "eager" : "lazy";
      thumbImage.decoding = "async";
      thumbImage.referrerPolicy = "same-origin";

      const thumbLabel = document.createElement("span");
      thumbLabel.className = "bmo-mrm-reader-page__thumb-label";
      thumbLabel.textContent = `Page ${index + 1}`;

      thumbImageWrap.appendChild(thumbImage);
      thumb.append(thumbImageWrap, thumbLabel);
      thumb.addEventListener("click", () => {
        prefs.page = index;
        saveReaderPrefs(prefs);
        scrollPageIntoView(pageNodes, index);
      });
      thumbsStrip.appendChild(thumb);
      thumbNodes.push(thumb);
    });

    thumbsPanel.append(thumbsHead, thumbsStrip);

    const footerDock = document.createElement("footer");
    footerDock.className = "bmo-mrm-reader-page__dock";

    const dockMain = document.createElement("div");
    dockMain.className = "bmo-mrm-reader-page__dock-main";

    const dockMeta = document.createElement("div");
    dockMeta.className = "bmo-mrm-reader-page__dock-meta";
    const dockLabel = document.createElement("span");
    dockLabel.textContent = "Page scrubber";
    const dockValue = document.createElement("span");
    dockValue.textContent = `1 / ${images.length}`;
    dockMeta.append(dockLabel, dockValue);

    const rangeWrap = document.createElement("div");
    rangeWrap.className = "bmo-mrm-reader-page__range-wrap";
    const pageRange = document.createElement("input");
    pageRange.className = "bmo-mrm-reader-page__range";
    pageRange.type = "range";
    pageRange.min = "1";
    pageRange.max = String(images.length);
    pageRange.step = "1";
    pageRange.value = String(Math.min(Math.max(1, prefs.page + 1), images.length));
    rangeWrap.appendChild(pageRange);

    const dockActions = document.createElement("div");
    dockActions.className = "bmo-mrm-reader-page__dock-actions";

    const firstPageButton = document.createElement("button");
    firstPageButton.type = "button";
    firstPageButton.className = "bmo-mrm-reader-page__button";
    firstPageButton.textContent = "First";

    const prevPageButton = document.createElement("button");
    prevPageButton.type = "button";
    prevPageButton.className = "bmo-mrm-reader-page__button";
    prevPageButton.textContent = "Page −";

    const dockThumbsButton = document.createElement("button");
    dockThumbsButton.type = "button";
    dockThumbsButton.className = "bmo-mrm-reader-page__button";

    const nextPageButton = document.createElement("button");
    nextPageButton.type = "button";
    nextPageButton.className = "bmo-mrm-reader-page__button";
    nextPageButton.textContent = "Page +";

    const lastPageButton = document.createElement("button");
    lastPageButton.type = "button";
    lastPageButton.className = "bmo-mrm-reader-page__button";
    lastPageButton.textContent = "Last";

    dockActions.append(firstPageButton, prevPageButton, dockThumbsButton, nextPageButton, lastPageButton);
    dockMain.append(dockMeta, rangeWrap);
    footerDock.append(dockMain, dockActions);

    main.append(stack, hint);
    root.append(topbar, main, thumbsPanel, footerDock, tapZones);

    const controls = { widthButton, fitButton, viewButton, directionButton, thumbnailButtons: [thumbsButton, dockThumbsButton] };
    applyReaderPrefs(controls);

    function setActiveThumb(index, behavior = "smooth") {
      thumbNodes.forEach((thumb, thumbIndex) => thumb.classList.toggle("is-active", thumbIndex === index));
      thumbNodes[index]?.scrollIntoView?.({ block: "nearest", inline: "center", behavior });
    }

    function updateProgress(behavior = "smooth") {
      const currentIndex = getNearestPageIndex(pageNodes);
      prefs.page = currentIndex;
      saveReaderPrefs(prefs);
      progress.textContent = `${pageNodes.length ? `Page ${currentIndex + 1} / ${pageNodes.length}` : "No pages found"}`;
      dockValue.textContent = `${currentIndex + 1} / ${images.length}`;
      pageRange.value = String(currentIndex + 1);
      pageNodes.forEach((page, pageIndex) => {
        page.classList.toggle("is-active", prefs.viewMode !== "paged" || pageIndex === currentIndex);
      });
      setActiveThumb(currentIndex, behavior);
    }

    function commitPrefs() {
      applyReaderPrefs(controls);
      updateProgress("auto");
    }

    widthButton.addEventListener("click", () => {
      prefs.widthMode = prefs.widthMode === "wide" ? "comfort" : "wide";
      commitPrefs();
    });

    fitButton.addEventListener("click", () => {
      prefs.fitMode = prefs.fitMode === "height" ? "width" : "height";
      commitPrefs();
    });

    viewButton.addEventListener("click", () => {
      const order = ["strip", "strip-gaps", "paged"];
      prefs.viewMode = order[(order.indexOf(prefs.viewMode) + 1) % order.length];
      commitPrefs();
      scrollPageIntoView(pageNodes, prefs.page, "auto");
    });

    directionButton.addEventListener("click", () => {
      prefs.direction = prefs.direction === "rtl" ? "ltr" : "rtl";
      commitPrefs();
    });

    thumbsButton.addEventListener("click", () => {
      prefs.thumbsCollapsed = !prefs.thumbsCollapsed;
      commitPrefs();
    });

    dockThumbsButton.addEventListener("click", () => {
      prefs.thumbsCollapsed = !prefs.thumbsCollapsed;
      commitPrefs();
    });

    tapPrev.addEventListener("click", () => navigatePages(pageNodes, -1 * getPageStep()));
    tapToggle.addEventListener("click", toggleTopbar);
    tapNext.addEventListener("click", () => navigatePages(pageNodes, 1 * getPageStep()));

    firstPageButton.addEventListener("click", () => {
      prefs.page = 0;
      saveReaderPrefs(prefs);
      scrollPageIntoView(pageNodes, 0);
    });
    prevPageButton.addEventListener("click", () => navigatePages(pageNodes, -1 * getPageStep()));
    nextPageButton.addEventListener("click", () => navigatePages(pageNodes, 1 * getPageStep()));
    lastPageButton.addEventListener("click", () => {
      prefs.page = pageNodes.length - 1;
      saveReaderPrefs(prefs);
      scrollPageIntoView(pageNodes, pageNodes.length - 1);
    });

    pageRange.addEventListener("input", () => {
      dockValue.textContent = `${pageRange.value} / ${images.length}`;
    });
    pageRange.addEventListener("change", () => {
      const nextIndex = clamp((Number.parseInt(pageRange.value || "1", 10) || 1) - 1, 0, Math.max(0, pageNodes.length - 1));
      prefs.page = nextIndex;
      saveReaderPrefs(prefs);
      scrollPageIntoView(pageNodes, nextIndex);
    });

    let scrollTick = 0;
    const onScroll = () => {
      if (scrollTick) cancelAnimationFrame(scrollTick);
      scrollTick = requestAnimationFrame(() => updateProgress());
    };
    main.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

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
        prevPostButton.click();
        return;
      }
      if (event.key === "ArrowRight" && event.altKey) {
        event.preventDefault();
        nextPostButton.click();
        return;
      }
      if (["PageDown", "ArrowDown", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        navigatePages(pageNodes, 1 * getPageStep());
        return;
      }
      if (["PageUp", "ArrowUp", "ArrowLeft"].includes(event.key)) {
        event.preventDefault();
        navigatePages(pageNodes, -1 * getPageStep());
      }
    }, { passive: false });

    updateProgress("auto");
    if (pageNodes.length) {
      scrollPageIntoView(pageNodes, clamp(prefs.page || 0, 0, pageNodes.length - 1), "auto");
    }
  }



  function injectReaderPageStyles() {
    if (document.getElementById("bmo-mrm-reader-page-style")) return;
    const style = document.createElement("style");
    style.id = "bmo-mrm-reader-page-style";
    style.textContent = `
      :root {
        --bmo-reader-bg: #070d17;
        --bmo-reader-bg-2: rgba(9, 14, 24, 0.92);
        --bmo-reader-surface: rgba(17, 24, 39, 0.88);
        --bmo-reader-line: rgba(255,255,255,0.10);
        --bmo-reader-line-strong: rgba(255,255,255,0.18);
        --bmo-reader-text: #eef3fb;
        --bmo-reader-muted: #95a4bc;
        --bmo-reader-width: min(1120px, calc(100vw - 28px));
        --bmo-reader-page-height: calc(100vh - 154px);
        --bmo-reader-dock-height: 78px;
        --bmo-reader-thumbs-height: 176px;
      }

      html.bmo-mrm-reader-root,
      body.bmo-mrm-reader-page {
        margin: 0 !important;
        padding: 0 !important;
        min-height: 100% !important;
        background:
          radial-gradient(circle at top, rgba(124,92,255,.12), transparent 28%),
          radial-gradient(circle at 82% 12%, rgba(37,194,160,.08), transparent 20%),
          var(--bmo-reader-bg) !important;
        color: var(--bmo-reader-text) !important;
        overflow-y: auto !important;
      }

      body.bmo-mrm-reader-page {
        font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important;
      }

      #bmo-mrm-reader-page {
        min-height: 100vh;
      }

      #bmo-mrm-reader-page.is-wide {
        --bmo-reader-width: min(1480px, calc(100vw - 18px));
      }

      .bmo-mrm-reader-page__topbar {
        position: sticky;
        top: 0;
        z-index: 30;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        backdrop-filter: blur(14px);
        background: rgba(7, 13, 23, 0.78);
        border-bottom: 1px solid var(--bmo-reader-line);
        transition: transform .18s ease, opacity .18s ease;
      }

      #bmo-mrm-reader-page.is-topbar-hidden .bmo-mrm-reader-page__topbar {
        transform: translateY(calc(-100% - 12px));
        opacity: 0;
        pointer-events: none;
      }

      .bmo-mrm-reader-page__title {
        min-width: 0;
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .bmo-mrm-reader-page__title-text {
        font-size: 14px;
        font-weight: 800;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .bmo-mrm-reader-page__progress {
        color: var(--bmo-reader-muted);
        font-size: 12px;
        font-weight: 600;
      }

      .bmo-mrm-reader-page__toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .bmo-mrm-reader-page__button {
        appearance: none;
        min-width: 40px;
        min-height: 40px;
        padding: 0 14px;
        border: 1px solid var(--bmo-reader-line);
        border-radius: 999px;
        background: rgba(11, 18, 29, 0.88);
        color: var(--bmo-reader-text);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        box-sizing: border-box;
      }

      .bmo-mrm-reader-page__button[disabled] {
        opacity: 0.45;
        cursor: not-allowed;
        pointer-events: none;
      }

      .bmo-mrm-reader-page__button--comments::after {
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

      .bmo-mrm-reader-page__main {
        width: 100%;
        box-sizing: border-box;
        padding: 18px 14px calc(var(--bmo-reader-dock-height) + 42px);
      }

      #bmo-mrm-reader-page:not(.is-thumbs-collapsed) .bmo-mrm-reader-page__main {
        padding-bottom: calc(var(--bmo-reader-dock-height) + var(--bmo-reader-thumbs-height) + 64px);
      }

      .bmo-mrm-reader-page__stack {
        width: var(--bmo-reader-width);
        max-width: 100%;
        margin: 0 auto;
        display: grid;
        gap: 18px;
      }

      #bmo-mrm-reader-page[data-view="strip"] .bmo-mrm-reader-page__stack {
        gap: 0;
      }

      #bmo-mrm-reader-page[data-view="strip"] .bmo-mrm-reader-page__page {
        border-radius: 0;
        border-color: transparent;
        background: transparent;
        box-shadow: none;
      }

      #bmo-mrm-reader-page[data-view="strip"] .bmo-mrm-reader-page__caption {
        display: none;
      }

      #bmo-mrm-reader-page[data-view="paged"] .bmo-mrm-reader-page__main {
        height: calc(100vh - 69px);
        overflow-y: auto;
        scroll-snap-type: y proximity;
      }

      #bmo-mrm-reader-page[data-view="paged"]:not(.is-thumbs-collapsed) .bmo-mrm-reader-page__main {
        height: calc(100vh - 69px - var(--bmo-reader-thumbs-height) - var(--bmo-reader-dock-height) - 30px);
      }

      #bmo-mrm-reader-page[data-view="paged"] .bmo-mrm-reader-page__page {
        min-height: min(calc(100vh - 140px), 1200px);
        scroll-snap-align: start;
      }

      #bmo-mrm-reader-page[data-fit="height"] .bmo-mrm-reader-page__page {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 10px;
      }

      #bmo-mrm-reader-page[data-fit="height"] .bmo-mrm-reader-page__image {
        width: auto;
        max-width: 100%;
        height: auto;
        max-height: var(--bmo-reader-page-height);
        margin: 0 auto;
      }

      #bmo-mrm-reader-page[data-direction="rtl"] .bmo-mrm-reader-page__stack {
        direction: rtl;
      }

      .bmo-mrm-reader-page__page {
        margin: 0;
        border-radius: 22px;
        overflow: hidden;
        border: 1px solid var(--bmo-reader-line);
        background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
        box-shadow: 0 24px 54px rgba(0,0,0,.34);
      }

      .bmo-mrm-reader-page__page.is-active {
        border-color: var(--bmo-reader-line-strong);
      }

      .bmo-mrm-reader-page__image {
        display: block;
        width: 100%;
        height: auto;
        background: #0a101a;
      }

      .bmo-mrm-reader-page__caption {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 14px 12px;
        color: var(--bmo-reader-muted);
        font-size: 12px;
        font-weight: 700;
      }

      .bmo-mrm-reader-page__hint {
        width: var(--bmo-reader-width);
        max-width: 100%;
        margin: 10px auto 0;
        color: var(--bmo-reader-muted);
        font-size: 12px;
        text-align: center;
      }

      .bmo-mrm-reader-page__empty {
        width: min(720px, 100%);
        margin: 32px auto 0;
        padding: 20px;
        border-radius: 20px;
        border: 1px solid var(--bmo-reader-line);
        background: rgba(255,255,255,.03);
        color: var(--bmo-reader-muted);
        text-align: center;
      }

      .bmo-mrm-reader-page__thumbs {
        position: fixed;
        left: 0;
        right: 0;
        bottom: var(--bmo-reader-dock-height);
        z-index: 24;
        height: var(--bmo-reader-thumbs-height);
        padding: 12px 14px 14px;
        border-top: 1px solid var(--bmo-reader-line);
        background: rgba(7, 13, 23, 0.92);
        backdrop-filter: blur(16px);
        transition: transform .18s ease, opacity .18s ease;
      }

      #bmo-mrm-reader-page.is-thumbs-collapsed .bmo-mrm-reader-page__thumbs {
        transform: translateY(calc(100% + 8px));
        opacity: 0;
        pointer-events: none;
      }

      .bmo-mrm-reader-page__thumbs-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
        color: var(--bmo-reader-muted);
        font-size: 12px;
        font-weight: 700;
      }

      .bmo-mrm-reader-page__thumbs-strip {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 110px;
        gap: 10px;
        overflow-x: auto;
        overflow-y: hidden;
        padding-bottom: 6px;
        scrollbar-width: thin;
      }

      .bmo-mrm-reader-page__thumb {
        appearance: none;
        border: 1px solid var(--bmo-reader-line);
        background: rgba(255,255,255,.03);
        border-radius: 16px;
        padding: 8px;
        color: var(--bmo-reader-text);
        cursor: pointer;
        display: grid;
        gap: 8px;
        text-align: left;
      }

      .bmo-mrm-reader-page__thumb.is-active {
        border-color: rgba(124,92,255,.64);
        box-shadow: 0 0 0 1px rgba(124,92,255,.32) inset;
      }

      .bmo-mrm-reader-page__thumb-image-wrap {
        aspect-ratio: 3 / 4;
        border-radius: 12px;
        overflow: hidden;
        background: #0b0f18;
      }

      .bmo-mrm-reader-page__thumb-image-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .bmo-mrm-reader-page__thumb-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--bmo-reader-muted);
      }

      .bmo-mrm-reader-page__dock {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 26;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        min-height: var(--bmo-reader-dock-height);
        padding: 14px;
        border-top: 1px solid var(--bmo-reader-line);
        background: rgba(7, 13, 23, 0.94);
        backdrop-filter: blur(16px);
      }

      .bmo-mrm-reader-page__dock-main {
        min-width: 0;
        flex: 1 1 auto;
        display: grid;
        gap: 8px;
      }

      .bmo-mrm-reader-page__dock-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        font-size: 12px;
        font-weight: 700;
        color: var(--bmo-reader-muted);
      }

      .bmo-mrm-reader-page__range-wrap {
        width: 100%;
      }

      .bmo-mrm-reader-page__range {
        width: 100%;
      }

      .bmo-mrm-reader-page__dock-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .bmo-mrm-reader-page__tapzones {
        position: fixed;
        inset: 0;
        z-index: 10;
        pointer-events: none;
      }

      .bmo-mrm-reader-page__tapzone {
        position: absolute;
        top: 70px;
        bottom: calc(var(--bmo-reader-dock-height) + 8px);
        width: 28vw;
        border: 0;
        background: transparent;
        pointer-events: auto;
        cursor: pointer;
      }

      .bmo-mrm-reader-page__tapzone--start { left: 0; }
      .bmo-mrm-reader-page__tapzone--center {
        left: 28vw;
        width: 44vw;
      }
      .bmo-mrm-reader-page__tapzone--end { right: 0; }

      @media (max-width: 980px) {
        :root {
          --bmo-reader-width: min(100vw - 16px, 1280px);
          --bmo-reader-page-height: calc(100vh - 132px);
        }

        .bmo-mrm-reader-page__toolbar {
          width: 100%;
          margin-left: 0;
          justify-content: flex-start;
          overflow-x: auto;
          flex-wrap: nowrap;
          padding-bottom: 2px;
        }

        .bmo-mrm-reader-page__button {
          min-height: 38px;
          padding: 0 12px;
          font-size: 12px;
          flex: 0 0 auto;
        }

        .bmo-mrm-reader-page__main {
          padding-left: 8px;
          padding-right: 8px;
        }

        .bmo-mrm-reader-page__stack {
          gap: 12px;
        }

        .bmo-mrm-reader-page__page {
          border-radius: 16px;
        }

        .bmo-mrm-reader-page__thumbs {
          padding-left: 8px;
          padding-right: 8px;
        }

        .bmo-mrm-reader-page__dock {
          padding: 10px 8px calc(10px + env(safe-area-inset-bottom));
        }

        .bmo-mrm-reader-page__dock-actions {
          width: 100%;
          justify-content: stretch;
        }

        .bmo-mrm-reader-page__dock-actions .bmo-mrm-reader-page__button {
          flex: 1 1 calc(33.333% - 8px);
        }
      }

      @media (max-width: 720px) {
        :root {
          --bmo-reader-dock-height: 118px;
          --bmo-reader-thumbs-height: 132px;
        }

        .bmo-mrm-reader-page__topbar {
          gap: 8px;
          padding: 8px;
          flex-wrap: wrap;
        }

        .bmo-mrm-reader-page__title {
          width: 100%;
          order: -1;
        }

        .bmo-mrm-reader-page__title-text {
          font-size: 13px;
        }

        .bmo-mrm-reader-page__progress,
        .bmo-mrm-reader-page__hint,
        .bmo-mrm-reader-page__caption span:last-child,
        .bmo-mrm-reader-page__thumbs-head div:last-child {
          display: none;
        }

        .bmo-mrm-reader-page__toolbar {
          gap: 6px;
        }

        .bmo-mrm-reader-page__button {
          min-height: 36px;
          padding: 0 10px;
          font-size: 11px;
        }

        .bmo-mrm-reader-page__main {
          padding-top: 10px;
          padding-bottom: calc(var(--bmo-reader-dock-height) + 30px);
        }

        #bmo-mrm-reader-page:not(.is-thumbs-collapsed) .bmo-mrm-reader-page__main {
          padding-bottom: calc(var(--bmo-reader-dock-height) + var(--bmo-reader-thumbs-height) + 24px);
        }

        .bmo-mrm-reader-page__thumbs {
          bottom: var(--bmo-reader-dock-height);
          height: var(--bmo-reader-thumbs-height);
          padding-top: 8px;
          padding-bottom: 8px;
        }

        .bmo-mrm-reader-page__thumbs-strip {
          grid-auto-columns: 84px;
          gap: 8px;
        }

        .bmo-mrm-reader-page__thumb {
          padding: 6px;
          border-radius: 12px;
        }

        .bmo-mrm-reader-page__dock {
          display: grid;
          grid-template-columns: 1fr;
          align-items: stretch;
          gap: 8px;
        }

        .bmo-mrm-reader-page__dock-main {
          order: 1;
        }

        .bmo-mrm-reader-page__dock-actions {
          order: 2;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
        }

        .bmo-mrm-reader-page__dock-actions .bmo-mrm-reader-page__button {
          width: 100%;
          min-width: 0;
          padding: 0 8px;
        }

        .bmo-mrm-reader-page__tapzone {
          top: 92px;
          bottom: calc(var(--bmo-reader-dock-height) + 4px + env(safe-area-inset-bottom));
          width: 30vw;
        }

        .bmo-mrm-reader-page__tapzone--center {
          left: 30vw;
          width: 40vw;
        }
      }

      @media (max-width: 480px) {
        :root {
          --bmo-reader-dock-height: 122px;
          --bmo-reader-thumbs-height: 116px;
        }

        .bmo-mrm-reader-page__button {
          min-height: 34px;
          font-size: 10.5px;
          border-radius: 999px;
        }

        .bmo-mrm-reader-page__thumbs-strip {
          grid-auto-columns: 72px;
        }

        .bmo-mrm-reader-page__thumb-label {
          font-size: 10px;
        }

        .bmo-mrm-reader-page__page {
          border-radius: 12px;
        }

        #bmo-mrm-reader-page[data-view="strip"] .bmo-mrm-reader-page__page {
          border-radius: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }


  function initHeaderCompactBehavior() {
    if (window.__bmoMrmHeaderCompactBound) {
      applyHeaderCompactState();
      return;
    }
    window.__bmoMrmHeaderCompactBound = true;
    let scheduled = false;
    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        applyHeaderCompactState();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    applyHeaderCompactState();
  }

  function initArchivePage() {
    document.body.classList.remove("s1-collapse", "s2-collapse");
    document.body.classList.add("bmo-mrm-archive-active");
    state.ui.panelOpen = false;
    saveState();
    indexArchiveCards();
    rebuildFacetModel();
    applyArchiveFilters();
    injectBaseStyles();
    injectShellHotfixStyles();
    createPanelHost();
    renderArchivePanel();
    injectReaderModalStyles();
    ensureReaderModal();
    ensureConfigControls();
    initHeaderCompactBehavior();
    initArchivePanelViewportBehavior();
    initArchivePanelBackdropBehavior();
    initArchivePanelEscapeBehavior();
  }

  function initSinglePostPage() {
    document.body.classList.remove("s1-collapse", "s2-collapse");
    injectBaseStyles();
    injectShellHotfixStyles();
    injectReaderModalStyles();
    ensureReaderModal();
    ensureConfigControls();
    restyleSinglePostLayout();
    initHeaderCompactBehavior();
  }

  function applyConfigPanelValues(panel) {
  if (!(panel instanceof HTMLElement)) return;
  const prevEnabled = state.ui.enabled;

  const enabled = panel.querySelector("[data-config='enabled']");
  const compact = panel.querySelector("[data-config='compact']");
  const gridDesktop = panel.querySelector("[data-config='gridDesktop']");
  const gridTablet = panel.querySelector("[data-config='gridTablet']");
  const gridMobile = panel.querySelector("[data-config='gridMobile']");
  const gap = panel.querySelector("[data-config='gap']");

  if (enabled instanceof HTMLInputElement) state.ui.enabled = enabled.checked;
  if (compact instanceof HTMLInputElement) state.ui.compact = compact.checked;
  if (gridDesktop instanceof HTMLInputElement) state.ui.gridDesktop = clamp(Number.parseInt(gridDesktop.value, 10) || 4, 2, 8);
  if (gridTablet instanceof HTMLInputElement) state.ui.gridTablet = clamp(Number.parseInt(gridTablet.value, 10) || 3, 1, 6);
  if (gridMobile instanceof HTMLInputElement) state.ui.gridMobile = clamp(Number.parseInt(gridMobile.value, 10) || 1, 1, 3);
  if (gap instanceof HTMLInputElement) state.ui.gap = clamp(Number.parseInt(gap.value, 10) || 14, 6, 32);

  saveState();

  if (prevEnabled !== state.ui.enabled) {
    location.reload();
    return;
  }

  injectBaseStyles();
  injectShellHotfixStyles();

  if (document.body.classList.contains("bmo-mrm-archive-active")) {
    applyArchiveFilters();
    renderArchivePanel();
  }

  renderConfigPanel();
}

function applyHeaderCompactState() {
    const shouldCompact = window.scrollY > 56;
    if (state.headerCompact === shouldCompact) return;
    state.headerCompact = shouldCompact;
    document.body.classList.toggle("bmo-mrm-header-compact", shouldCompact);
  }

function ensureConfigControls() {
    let fab = document.getElementById(CONFIG_IDS.fab);
    if (!fab) {
      fab = document.createElement("button");
      fab.id = CONFIG_IDS.fab;
      fab.type = "button";
      document.body.appendChild(fab);
    }

    const isArchive = document.body.classList.contains("bmo-mrm-archive-active");
    if (!state.ui.enabled) {
      fab.textContent = "Enable UI";
      fab.removeAttribute("aria-label");
    } else {
      fab.innerHTML = '<span class="bmo-mrm-fab-icon" aria-hidden="true">⚙</span>';
      fab.setAttribute("aria-label", isArchive ? "Open filters and layout panel" : "Open UI settings");
    }

    fab.onclick = () => {
      if (!state.ui.enabled) {
        state.ui.enabled = true;
        saveState();
        location.reload();
        return;
      }

      if (isArchive) {
        state.ui.panelCollapsed = false;
        state.ui.panelOpen = !state.ui.panelOpen;
        saveState();
        createPanelHost();
        syncArchivePanelVisibility();
        renderArchivePanel();
        return;
      }

      state.ui.configOpen = !state.ui.configOpen;
      saveState();
      renderConfigPanel();
    };

    renderConfigPanel();
    if (isArchive) {
      createPanelHost();
      syncArchivePanelVisibility();
    }
  }

function injectArchiveMobileOverrideStyles() {
    let style = document.getElementById("bmo-mrm-archive-mobile-override-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "bmo-mrm-archive-mobile-override-style";
      document.head.appendChild(style);
    }
    style.textContent = `
      body.bmo-mrm-archive-active .main-inner.group > .content,
      body.bmo-mrm-archive-active .content > .content-inner,
      body.bmo-mrm-archive-active .content > .content-inner > .pad,
      body.bmo-mrm-archive-active .content > .content-inner > .pad.group,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid {
        min-width: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      body.bmo-mrm-archive-active .bmo-mrm-results-grid {
        width: min(100%, calc(100vw - 16px)) !important;
        margin-inline: auto !important;
      }

      body.bmo-mrm-archive-active .bmo-mrm-results-grid > article,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > article.post-standard,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > article.post,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > article.hentry,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-inner,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-content,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-thumbnail {
        min-width: 0 !important;
        max-width: 100% !important;
        width: auto !important;
        box-sizing: border-box !important;
      }

      body.bmo-mrm-archive-active #${CONFIG_IDS.panel} {
        display: none !important;
      }

      body.bmo-mrm-archive-active .bmo-mrm-panel-host-floating {
        display: none !important;
        position: fixed !important;
        right: 16px !important;
        bottom: 72px !important;
        left: auto !important;
        width: min(360px, calc(100vw - 24px)) !important;
        max-width: min(360px, calc(100vw - 24px)) !important;
        max-height: calc(100vh - 100px) !important;
        overflow: auto !important;
        z-index: 2147483644 !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }

      body.bmo-mrm-archive-active.bmo-mrm-archive-panel-open .bmo-mrm-panel-host-floating {
        display: grid !important;
      }

      body.bmo-mrm-archive-active.bmo-mrm-archive-panel-open::before {
        content: "" !important;
        position: fixed !important;
        inset: 0 !important;
        background: rgba(8,10,18,.62) !important;
        z-index: 2147483643 !important;
      }

      @media (max-width: 980px) {
        body.bmo-mrm-archive-active .bmo-mrm-panel-host-floating {
          right: 8px !important;
          left: 8px !important;
          bottom: 8px !important;
          top: 72px !important;
          width: auto !important;
          max-height: calc(100vh - 84px) !important;
        }
      }

      @media (max-width: 980px) {
        html, body,
        body.bmo-mrm-archive-active #wrapper,
        body.bmo-mrm-archive-active #page,
        body.bmo-mrm-archive-active #page > .container,
        body.bmo-mrm-archive-active .main,
        body.bmo-mrm-archive-active .main-inner.group,
        body.bmo-mrm-archive-active .content,
        body.bmo-mrm-archive-active .content-inner,
        body.bmo-mrm-archive-active .content-inner > .pad,
        body.bmo-mrm-archive-active .content-inner > .pad.group {
          max-width: 100% !important;
          min-width: 0 !important;
          overflow-x: hidden !important;
          box-sizing: border-box !important;
        }

        body.bmo-mrm-archive-active #header .container,
        body.bmo-mrm-archive-active #page > .container,
        body.bmo-mrm-archive-active #footer-bottom .container {
          width: auto !important;
          max-width: calc(100vw - 16px) !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }

        body.bmo-mrm-archive-active .main-inner.group {
          display: block !important;
        }

        body.bmo-mrm-archive-active .main-inner.group > .sidebar.s2:not(.bmo-mrm-panel-host-mobile) {
          display: none !important;
        }

        body.bmo-mrm-archive-active .bmo-mrm-results-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 560px) {
        body.bmo-mrm-archive-active .bmo-mrm-results-grid {
          grid-template-columns: repeat(${state.ui.gridMobile}, minmax(0, 1fr)) !important;
        }
      }
    `;
  }

function injectBaseStyles() {
    let style = document.getElementById("bmo-mrm-style");
    if (!(style instanceof HTMLStyleElement)) {
      style = document.createElement("style");
      style.id = "bmo-mrm-style";
      document.head.appendChild(style);
    }
    style.textContent = `
      :root {
        --bmo-mrm-bg: #030303;
        --bmo-mrm-panel: #0c0c0c;
        --bmo-mrm-panel-2: #121212;
        --bmo-mrm-line: rgba(255,255,255,.10);
        --bmo-mrm-line-2: rgba(255,255,255,.18);
        --bmo-mrm-text: #f1f5fb;
        --bmo-mrm-muted: #9ca7b5;
        --bmo-mrm-accent: #7c5cff;
        --bmo-mrm-accent-2: #25c2a0;
        --bmo-mrm-shadow: 0 10px 24px rgba(0,0,0,.28);
        --bmo-mrm-shadow-lg: 0 14px 34px rgba(0,0,0,.32);
      }
      body.bmo-mrm-archive-active,
      body.bmo-mrm-single-active {
        background:
          radial-gradient(circle at top, rgba(124,92,255,.10), transparent 28%),
          radial-gradient(circle at 85% 10%, rgba(37,194,160,.06), transparent 18%),
          var(--bmo-mrm-bg) !important;
        color: var(--bmo-mrm-text) !important;
      }
      body.bmo-mrm-archive-active a,
      body.bmo-mrm-single-active a {
        color: #dfe7f3 !important;
        text-decoration: none !important;
      }
      body.bmo-mrm-archive-active a:hover,
      body.bmo-mrm-single-active a:hover { color: #fff !important; }
      body.bmo-mrm-archive-active .nav-primary,
      body.bmo-mrm-single-active .nav-primary {
        position: sticky !important;
        top: 0 !important;
        z-index: 999 !important;
        background: rgba(13,16,22,.72) !important;
        backdrop-filter: blur(14px) !important;
        border-bottom: 1px solid rgba(255,255,255,.05) !important;
      }
      body.bmo-mrm-archive-active .nav-primary .menu,
      body.bmo-mrm-single-active .nav-primary .menu {
        display: flex !important;
        gap: 10px !important;
        align-items: center !important;
        padding: 14px 0 !important;
        overflow-x: auto !important;
        white-space: nowrap !important;
      }
      body.bmo-mrm-archive-active .nav-primary .menu::-webkit-scrollbar,
      body.bmo-mrm-single-active .nav-primary .menu::-webkit-scrollbar { display: none !important; }
      body.bmo-mrm-archive-active .nav-primary .menu > li,
      body.bmo-mrm-single-active .nav-primary .menu > li {
        float: none !important;
        display: inline-flex !important;
      }
      body.bmo-mrm-archive-active .nav-primary a,
      body.bmo-mrm-single-active .nav-primary a {
        min-height: 34px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 12px !important;
        border-radius: 999px !important;
        border: 1px solid var(--bmo-mrm-line) !important;
        background: rgba(255,255,255,.03) !important;
        color: #dbe4f2 !important;
        font: 700 13px/1 Inter, system-ui, sans-serif !important;
        text-transform: none !important;
      }
      body.bmo-mrm-archive-active .nav-primary a:hover,
      body.bmo-mrm-single-active .nav-primary a:hover {
        background: rgba(124,92,255,.16) !important;
        border-color: rgba(124,92,255,.45) !important;
      }
      body.bmo-mrm-archive-active .site-header,
      body.bmo-mrm-single-active .site-header {
        background: transparent !important;
        padding: 22px 0 8px !important;
      }
      body.bmo-mrm-archive-active .site-header .searchform,
      body.bmo-mrm-single-active .site-header .searchform,
      body.bmo-mrm-archive-active .site-header .search-form,
      body.bmo-mrm-single-active .site-header .search-form {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        min-height: 72px !important;
        padding: 10px !important;
        background: var(--bmo-mrm-panel) !important;
        border: 1px solid var(--bmo-mrm-line) !important;
        border-radius: 20px !important;
        box-shadow: var(--bmo-mrm-shadow) !important;
      }
      body.bmo-mrm-archive-active .site-header input[type="search"],
      body.bmo-mrm-single-active .site-header input[type="search"] {
        background: transparent !important;
        border: 0 !important;
        color: var(--bmo-mrm-text) !important;
        box-shadow: none !important;
      }
      body.bmo-mrm-archive-active .site-header input[type="submit"],
      body.bmo-mrm-single-active .site-header input[type="submit"] {
        min-height: 48px !important;
        padding: 0 18px !important;
        border-radius: 14px !important;
        background: linear-gradient(135deg, var(--bmo-mrm-accent), #6d7cff) !important;
        border: 0 !important;
        color: #fff !important;
        font: 800 14px/1 Inter, system-ui, sans-serif !important;
      }
      body.bmo-mrm-archive-active .site-inner,
      body.bmo-mrm-single-active .site-inner {
        padding-top: 10px !important;
        padding-bottom: 36px !important;
        background: transparent !important;
      }
      body.bmo-mrm-archive-active .site-inner,
      body.bmo-mrm-archive-active .wrap,
      body.bmo-mrm-single-active .site-inner,
      body.bmo-mrm-single-active .wrap {
        max-width: 1680px !important;
      }
      body.bmo-mrm-archive-active .main-inner.group {
        display: grid !important;
        grid-template-columns: minmax(0,1fr) minmax(300px,360px) !important;
        gap: 20px !important;
        align-items: start !important;
      }
      body.bmo-mrm-archive-active .sidebar.s1,
      body.bmo-mrm-archive-active .sidebar.s1 * {
        display: none !important;
      }
      body.bmo-mrm-archive-active .sidebar.s2.bmo-mrm-panel-host {
        display: block !important;
        width: 100% !important;
        max-width: 360px !important;
        position: sticky !important;
        top: 18px !important;
      }
      body.bmo-mrm-archive-active .content > .content-inner > .pad.group.bmo-mrm-results-grid,
      body.bmo-mrm-archive-active .content .content-inner > .pad.group.bmo-mrm-results-grid,
      body.bmo-mrm-archive-active .content .pad.group.bmo-mrm-results-grid {
        display: grid !important;
        grid-template-columns: repeat(${state.ui.gridDesktop}, minmax(220px,1fr)) !important;
        gap: ${state.ui.gap}px !important;
        align-items: start !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid::before,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid::after { display: none !important; }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > article.post-standard,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > article.post,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > article.hentry {
        float: none !important;
        width: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        min-width: 0 !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-inner {
        display: flex !important;
        flex-direction: column !important;
        min-height: 100% !important;
        border-radius: 18px !important;
        border: 1px solid rgba(255,255,255,.08) !important;
        background: linear-gradient(180deg, rgba(18,26,40,.92), rgba(10,16,28,.96)) !important;
        box-shadow: 0 18px 36px rgba(0,0,0,.26) !important;
        overflow: hidden !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-thumbnail {
        margin: 0 !important;
        aspect-ratio: 5 / 7 !important;
        background: rgba(255,255,255,.03) !important;
        overflow: hidden !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-thumbnail a,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-thumbnail img {
        display: block !important;
        width: 100% !important;
        height: 100% !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-thumbnail img {
        object-fit: cover !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-inner,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-thumbnail,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-content {
        max-width: 100% !important;
        min-width: 0 !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-content {
        min-width: 0 !important;
        display: flex !important;
        flex: 1 1 auto !important;
        flex-direction: column !important;
        gap: 8px !important;
        padding: 12px !important;
        min-width: 0 !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-title {
        margin: 0 !important;
        font-size: 17px !important;
        line-height: 1.35 !important;
        font-weight: 700 !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 4 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-category,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-category a {
        color: var(--bmo-mrm-muted) !important;
        font-size: 12px !important;
        line-height: 1.45 !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-date {
        margin-top: auto !important;
        color: rgba(255,255,255,.56) !important;
        font-size: 12px !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-comments {
        position: absolute !important;
        top: 10px !important;
        right: 10px !important;
        z-index: 3 !important;
        min-height: 28px !important;
        padding: 0 10px !important;
        border-radius: 999px !important;
        border: 1px solid rgba(255,255,255,.12) !important;
        background: rgba(10,12,20,.82) !important;
        color: #fff !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        font: 700 12px/1 Inter, system-ui, sans-serif !important;
      }

      body.bmo-mrm-archive-active .bmo-mrm-results-grid > nav.pagination,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > .pagination,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > .wp-pagenavi {
        grid-column: 1 / -1 !important;
        width: 100% !important;
        float: none !important;
        clear: both !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
        padding: 8px 0 0 !important;
        margin: 0 !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > nav.pagination a,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > nav.pagination span,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > .pagination a,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > .pagination span,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > .wp-pagenavi a,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > .wp-pagenavi span {
        min-width: 38px !important;
        min-height: 38px !important;
        padding: 0 12px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 12px !important;
        border: 1px solid var(--bmo-mrm-line) !important;
        background: rgba(255,255,255,.03) !important;
        color: var(--bmo-mrm-text) !important;
        font: 700 12px/1 Inter, system-ui, sans-serif !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > .wp-pagenavi .current,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > nav.pagination .current,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid > .pagination .current {
        background: linear-gradient(135deg, var(--bmo-mrm-accent), #6d7cff) !important;
        border-color: rgba(124,92,255,.45) !important;
      }
      .bmo-mrm-card-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: auto;
      }
      .bmo-mrm-card-btn,
      .bmo-mrm-btn,
      .bmo-mrm-icon-btn {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 34px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.12);
        background: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06));
        color: #fff;
        font: 700 12px/1 Inter, system-ui, sans-serif;
        cursor: pointer;
      }
      .bmo-mrm-btn.primary { background: linear-gradient(135deg, var(--bmo-mrm-accent), #6d7cff); border-color: rgba(124,92,255,.45); }
      .bmo-mrm-btn.ghost,
      .bmo-mrm-icon-btn { background: rgba(255,255,255,.03); box-shadow: none; }
      #bmo-mrm-panel {
        display: grid;
        gap: 10px;
        border-radius: 20px;
        border: 1px solid var(--bmo-mrm-line);
        background: linear-gradient(180deg, rgba(16,23,36,.96), rgba(9,14,24,.98));
        box-shadow: var(--bmo-mrm-shadow-lg);
        padding: 12px;
      }
      #bmo-mrm-panel.is-collapsed .bmo-mrm-toolbar,
      #bmo-mrm-panel.is-collapsed .bmo-mrm-active,
      #bmo-mrm-panel.is-collapsed .bmo-mrm-facets,
      #bmo-mrm-panel.is-collapsed .bmo-mrm-panel-footer { display: none; }
      .bmo-mrm-panel-head {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
      }
      .bmo-mrm-panel-title {
        margin: 0;
        color: #fff;
        font: 800 18px/1.2 Inter, system-ui, sans-serif;
      }
      .bmo-mrm-panel-subtitle,
      .bmo-mrm-results-summary,
      .bmo-mrm-active-empty {
        color: var(--bmo-mrm-muted);
        font-size: 12px;
      }
      .bmo-mrm-config-row,
      .bmo-mrm-toolbar,
      .bmo-mrm-panel-footer,
      .bmo-mrm-facet-search-row,
      .bmo-mrm-facet-pager,
      .bmo-mrm-term,
      .bmo-mrm-term-modes,
      .bmo-mrm-chip-row,
      .bmo-mrm-post-toolbar,
      .bmo-mrm-reader-page-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
      }
      .bmo-mrm-toolbar,
      .bmo-mrm-config-row {
        justify-content: space-between;
      }
      .bmo-mrm-inline-grid {
        display: grid;
        gap: 8px;
        padding: 10px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,.06);
        background: rgba(255,255,255,.025);
      }
      .bmo-mrm-inline-grid-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }
      .bmo-mrm-inline-grid-title {
        margin: 0;
        color: #fff;
        font: 800 13px/1.1 Inter, system-ui, sans-serif;
      }
      .bmo-mrm-inline-grid-subtitle {
        color: var(--bmo-mrm-muted);
        font: 600 10px/1.1 Inter, system-ui, sans-serif;
      }
      .bmo-mrm-inline-grid-fields {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .bmo-mrm-inline-grid-field {
        display: grid;
        gap: 4px;
      }
      .bmo-mrm-inline-grid-field > span {
        color: var(--bmo-mrm-muted);
        font: 700 11px/1.1 Inter, system-ui, sans-serif;
        text-transform: none;
      }
      .bmo-mrm-input.mini {
        min-height: 34px;
        padding: 7px 9px;
        font-size: 12px;
      }
      .bmo-mrm-toggle.compact-inline {
        justify-self: start;
      }
      .bmo-mrm-input {
        width: 100%;
        min-width: 0;
        background: rgba(255,255,255,.03);
        border: 1px solid var(--bmo-mrm-line);
        color: var(--bmo-mrm-text);
        border-radius: 12px;
        padding: 9px 12px;
        font: 500 13px/1.3 Inter, system-ui, sans-serif;
      }
      .bmo-mrm-toggle {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--bmo-mrm-text);
        font: 600 12px/1.2 Inter, system-ui, sans-serif;
      }
      .bmo-mrm-active { min-height: 24px; }
      .bmo-mrm-chip,
      .bmo-mrm-post-chip {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        padding: 0 9px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(255,255,255,.05);
        color: #dbe4f2;
        font: 700 11px/1 Inter, system-ui, sans-serif;
      }
      .bmo-mrm-chip.is-include,
      .bmo-mrm-post-chip.language {
        background: rgba(37,194,160,.14);
        border-color: rgba(37,194,160,.28);
      }
      .bmo-mrm-chip.is-exclude {
        background: rgba(255,92,143,.12);
        border-color: rgba(255,92,143,.28);
      }
      .bmo-mrm-post-chip.category {
        background: rgba(124,92,255,.14);
        border-color: rgba(124,92,255,.28);
      }
      .bmo-mrm-card-chip-row {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        align-items: center;
        margin-bottom: 2px;
      }
      .bmo-mrm-card-chip {
        display: inline-flex;
        align-items: center;
        min-height: 22px;
        padding: 0 8px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(255,255,255,.05);
        color: #dbe4f2;
        font: 700 10px/1 Inter, system-ui, sans-serif;
        max-width: 100%;
        white-space: nowrap;
      }
      .bmo-mrm-card-chip.language {
        background: rgba(37,194,160,.14);
        border-color: rgba(37,194,160,.28);
      }
      .bmo-mrm-card-chip.category {
        background: rgba(124,92,255,.14);
        border-color: rgba(124,92,255,.28);
      }
      .bmo-mrm-facet {
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 16px;
        background: rgba(255,255,255,.03);
        overflow: hidden;
      }
      .bmo-mrm-facet-head {
        width: 100%;
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
        min-height: 40px;
        padding: 10px 12px;
        border: 0;
        color: #fff;
        background: rgba(255,255,255,.02);
        font: 800 13px/1.2 Inter, system-ui, sans-serif;
        cursor: pointer;
      }
      .bmo-mrm-facet-meta { color: var(--bmo-mrm-muted); font-size: 11px; }
      .bmo-mrm-facet-body { display: none; padding: 10px; gap: 8px; }
      .bmo-mrm-facet.is-open .bmo-mrm-facet-body { display: grid; }
      .bmo-mrm-term {
        justify-content: space-between;
        padding: 8px;
        border-radius: 12px;
        background: rgba(255,255,255,.02);
        border: 1px solid rgba(255,255,255,.05);
      }
      .bmo-mrm-term-main {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
        background: transparent;
        border: 0;
        color: #dbe4f2;
        cursor: pointer;
        text-align: left;
        font: 600 12px/1.2 Inter, system-ui, sans-serif;
      }
      .bmo-mrm-term-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
      .bmo-mrm-term-count { color: var(--bmo-mrm-muted); font-size: 11px; flex: 0 0 auto; }
      .bmo-mrm-mode-btn {
        min-height: 24px;
        padding: 0 9px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(255,255,255,.03);
        color: var(--bmo-mrm-muted);
        font: 700 10px/1 Inter, system-ui, sans-serif;
        cursor: pointer;
      }
      .bmo-mrm-mode-btn.is-include {
        color: #fff;
        background: rgba(37,194,160,.14);
        border-color: rgba(37,194,160,.28);
      }
      .bmo-mrm-mode-btn.is-exclude {
        color: #fff;
        background: rgba(255,92,143,.12);
        border-color: rgba(255,92,143,.28);
      }
      .bmo-mrm-facet-pager button {
        min-width: 28px;
        min-height: 28px;
        padding: 0 9px;
        border-radius: 10px;
        border: 1px solid var(--bmo-mrm-line);
        background: rgba(255,255,255,.03);
        color: #dbe4f2;
        font: 700 11px/1 Inter, system-ui, sans-serif;
        cursor: pointer;
      }
      .bmo-mrm-facet-pager button.is-active {
        background: linear-gradient(135deg, var(--bmo-mrm-accent), #6d7cff);
        border-color: rgba(124,92,255,.45);
      }
      .bmo-mrm-empty {
        color: var(--bmo-mrm-muted);
        font-size: 12px;
        padding: 4px 2px;
      }
      .bmo-mrm-hidden-card { display: none !important; }
      .bmo-mrm-read .post-inner { opacity: .72; }
      #${CONFIG_IDS.fab} {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 2147483645;
        width: 48px;
        height: 48px;
        min-height: 48px;
        min-width: 48px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(10,12,20,.94);
        color: #fff;
        cursor: pointer;
        box-shadow: 0 12px 24px rgba(0,0,0,.24);
        font: 700 13px/1 Inter, system-ui, sans-serif;
      }
      .bmo-mrm-fab-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        font-size: 22px;
        line-height: 1;
      }
      .bmo-mrm-panel-attn {
        animation: bmo-mrm-panel-pulse .9s ease;
      }
      @keyframes bmo-mrm-panel-pulse {
        0% { transform: translateY(0); box-shadow: 0 0 0 rgba(124,92,255,0); }
        45% { transform: translateY(-2px); box-shadow: 0 0 0 6px rgba(124,92,255,.16); }
        100% { transform: translateY(0); box-shadow: 0 0 0 rgba(124,92,255,0); }
      }
      body.bmo-mrm-archive-active #${CONFIG_IDS.fab} {
        display: inline-flex !important;
      }
      #${CONFIG_IDS.panel} {
        position: fixed;
        right: 16px;
        bottom: 70px;
        z-index: 2147483645;
        width: min(320px, calc(100vw - 24px));
      }
      #${ARCHIVE_PANEL_IDS.backdrop} {
        display: none !important;
        pointer-events: none !important;
        opacity: 0 !important;
      }
      #${ARCHIVE_PANEL_IDS.mobileHost} {
        display: none;
      }
      body.bmo-mrm-archive-active #${CONFIG_IDS.panel}.is-anchored {
        position: static !important;
        right: auto !important;
        bottom: auto !important;
        width: 100% !important;
        margin-top: 10px !important;
        z-index: auto !important;
      }
      .bmo-mrm-config-card {
        display: grid;
        gap: 10px;
        border-radius: 18px;
        border: 1px solid var(--bmo-mrm-line);
        background: rgba(11,17,28,.98);
        backdrop-filter: none !important;
        box-shadow: 0 12px 24px rgba(0,0,0,.22);
        padding: 14px;
      }
      .bmo-mrm-config-card h3 { margin: 0; color: #fff; font: 800 16px/1.2 Inter, system-ui, sans-serif; }
      .bmo-mrm-config-field {
        display: grid;
        gap: 6px;
        color: var(--bmo-mrm-text);
        font: 600 12px/1.2 Inter, system-ui, sans-serif;
      }
      .bmo-mrm-config-field input {
        width: 100%;
        min-height: 36px;
        border-radius: 12px;
        border: 1px solid var(--bmo-mrm-line);
        background: rgba(255,255,255,.03);
        color: var(--bmo-mrm-text);
        padding: 8px 10px;
      }
      .bmo-mrm-config-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      body.bmo-mrm-single-active article.post.bmo-mrm-post-article {
        max-width: 1100px !important;
        margin: 0 auto !important;
        border-radius: 24px !important;
        border: 1px solid var(--bmo-mrm-line) !important;
        background: linear-gradient(180deg, rgba(16,23,36,.96), rgba(9,14,24,.98)) !important;
        box-shadow: var(--bmo-mrm-shadow-lg) !important;
        overflow: hidden !important;
        padding: 18px !important;
      }
      body.bmo-mrm-single-active article.post > h1.post-title {
        margin: 0 0 14px !important;
        color: #fff !important;
        font: 800 clamp(28px, 4vw, 40px)/1.12 Inter, system-ui, sans-serif !important;
        text-align: left !important;
      }
      body.bmo-mrm-single-active article.post > .post-byline,
      body.bmo-mrm-single-active article.post > .post-byline a {
        color: var(--bmo-mrm-muted) !important;
        font-size: 14px !important;
      }
      body.bmo-mrm-single-active article.post .attachment-magaziner-large,
      body.bmo-mrm-single-active article.post .post-format,
      body.bmo-mrm-single-active .sharrre-container,
      body.bmo-mrm-single-active .post-nav {
        display: none !important;
      }
      body.bmo-mrm-single-active .bmo-mrm-post-toolbar {
        position: sticky !important;
        top: 68px !important;
        z-index: 50 !important;
        padding: 8px 10px !important;
        margin: 0 0 4px !important;
        border-radius: 16px !important;
        border: 1px solid rgba(255,255,255,.08) !important;
        background: rgba(9,14,24,.92) !important;
        backdrop-filter: blur(10px) !important;
        box-shadow: 0 10px 24px rgba(0,0,0,.18) !important;
      }
      body.bmo-mrm-single-active .bmo-mrm-post-toolbar .bmo-mrm-btn {
        min-height: 36px !important;
      }
      body.bmo-mrm-single-active.bmo-mrm-header-compact .bmo-mrm-post-toolbar {
        top: 56px !important;
      }
      body.bmo-mrm-single-active .bmo-mrm-post-entry-inner {
        max-width: 100% !important;
      }
      body.bmo-mrm-single-active .bmo-mrm-post-entry-inner > p:first-child {
        margin-top: 0 !important;
      }
      body.bmo-mrm-single-active .bmo-mrm-section-heading,
      body.bmo-mrm-single-active .bmo-mrm-yarpp-title {
        margin: 18px 0 10px !important;
        color: #eef4fc !important;
        font: 800 20px/1.2 Inter, system-ui, sans-serif !important;
      }
      body.bmo-mrm-single-active .entry.themeform {
        margin-top: 16px !important;
        background: transparent !important;
        border: 0 !important;
      }
      body.bmo-mrm-single-active .entry.themeform > .entry-inner {
        display: grid !important;
        gap: 14px !important;
      }
      .bmo-mrm-page-anchor {
        display: block !important;
        border-radius: 18px !important;
        overflow: hidden !important;
        border: 1px solid rgba(255,255,255,.08) !important;
        background: rgba(255,255,255,.03) !important;
        box-shadow: 0 12px 26px rgba(0,0,0,.18) !important;
      }
      .bmo-mrm-page-image {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        margin: 0 !important;
        background: rgba(255,255,255,.03) !important;
      }
      body.bmo-mrm-single-active #comments,
      body.bmo-mrm-single-active #respond {
        max-width: 1100px !important;
        margin: 20px auto 0 !important;
        border-radius: 24px !important;
        border: 1px solid var(--bmo-mrm-line) !important;
        background: linear-gradient(180deg, rgba(16,23,36,.96), rgba(9,14,24,.98)) !important;
        box-shadow: var(--bmo-mrm-shadow-lg) !important;
        padding: 18px !important;
      }
      .bmo-mrm-related-grid,
      .bmo-mrm-yarpp-grid {
        list-style: none !important;
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)) !important;
        gap: 12px !important;
        margin: 18px 0 0 !important;
        padding: 0 !important;
        align-items: start !important;
      }
      .bmo-mrm-related-grid > li.related,
      .bmo-mrm-yarpp-grid > a.yarpp-thumbnail {
        float: none !important;
        width: auto !important;
        margin: 0 !important;
        min-width: 0 !important;
      }
      .bmo-mrm-related-grid article,
      .bmo-mrm-yarpp-card {
        display: flex !important;
        flex-direction: column !important;
        min-height: 100% !important;
        border-radius: 16px !important;
        border: 1px solid rgba(255,255,255,.08) !important;
        background: linear-gradient(180deg, rgba(18,26,40,.92), rgba(10,16,28,.96)) !important;
        box-shadow: 0 12px 26px rgba(0,0,0,.18) !important;
        overflow: hidden !important;
        text-decoration: none !important;
      }
      .bmo-mrm-related-grid .post-thumbnail,
      .bmo-mrm-yarpp-card img {
        margin: 0 !important;
        aspect-ratio: 4 / 5 !important;
        overflow: hidden !important;
        background: rgba(255,255,255,.03) !important;
        border-radius: 14px 14px 0 0 !important;
      }
      .bmo-mrm-related-grid .post-thumbnail a,
      .bmo-mrm-related-grid .post-thumbnail img,
      .bmo-mrm-yarpp-card img {
        display: block !important;
        width: 100% !important;
        height: 100% !important;
      }
      .bmo-mrm-related-grid .post-thumbnail img,
      .bmo-mrm-yarpp-card img { object-fit: cover !important; }
      .bmo-mrm-related-grid .post-thumbnail > a + a,
      .bmo-mrm-related-grid .post-thumbnail .post-comments,
      .bmo-mrm-yarpp-card .post-comments {
        display: none !important;
      }
      .bmo-mrm-related-grid .post-content,
      .bmo-mrm-yarpp-card {
        min-width: 0 !important;
      }
      .bmo-mrm-related-grid .post-content {
        display: flex !important;
        flex: 1 1 auto !important;
        flex-direction: column !important;
        gap: 6px !important;
        padding: 10px !important;
      }
      .bmo-mrm-related-grid .post-title,
      .bmo-mrm-related-grid .post-title a,
      .bmo-mrm-yarpp-card-title {
        margin: 0 !important;
        color: #eef3fb !important;
        font-size: 13px !important;
        line-height: 1.35 !important;
        font-weight: 700 !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 3 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        padding: 8px 10px 10px !important;
      }
      .bmo-mrm-yarpp-card-title { padding-top: 8px !important; }
      .bmo-mrm-related-grid .bmo-mrm-card-actions {
        margin-top: 0 !important;
        justify-content: flex-end !important;
        padding: 0 10px 10px !important;
      }
      .bmo-mrm-related-grid .bmo-mrm-card-btn {
        min-height: 30px !important;
        padding: 0 10px !important;
        font-size: 11px !important;
      }
      .bmo-mrm-hidden-native { display: none !important; }
      .bmo-mrm-btn-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        margin-left: 8px;
        padding: 0 6px;
        border-radius: 999px;
        background: rgba(255,255,255,.18);
        font-size: 11px;
      }
      @media (max-width: 1180px) {
        body.bmo-mrm-archive-active .main-inner.group {
          grid-template-columns: 1fr !important;
        }
        body.bmo-mrm-archive-active .sidebar.s2.bmo-mrm-panel-host {
          max-width: none !important;
          position: static !important;
        }
        body.bmo-mrm-archive-active .bmo-mrm-results-grid {
          grid-template-columns: repeat(${state.ui.gridTablet}, minmax(220px,1fr)) !important;
        }
        .bmo-mrm-related-grid, .bmo-mrm-yarpp-grid { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
      }
      @media (max-width: 980px) {
        html, body,
        body.bmo-mrm-archive-active #wrapper,
        body.bmo-mrm-archive-active #page,
        body.bmo-mrm-archive-active #page > .container,
        body.bmo-mrm-archive-active .main,
        body.bmo-mrm-archive-active .main-inner.group,
        body.bmo-mrm-archive-active .content,
        body.bmo-mrm-archive-active .content-inner,
        body.bmo-mrm-archive-active .content-inner > .pad,
        body.bmo-mrm-archive-active .content-inner > .pad.group {
          max-width: 100% !important;
          width: auto !important;
          min-width: 0 !important;
          overflow-x: hidden !important;
        }
        html, body {
          overflow-x: hidden !important;
        }
        body.bmo-mrm-archive-active #header .container,
        body.bmo-mrm-archive-active #page > .container,
        body.bmo-mrm-archive-active #footer-bottom .container,
        body.bmo-mrm-single-active #header .container,
        body.bmo-mrm-single-active #page > .container,
        body.bmo-mrm-single-active #footer-bottom .container {
          width: auto !important;
          max-width: calc(100vw - 16px) !important;
          margin-left: 8px !important;
          margin-right: 8px !important;
        }
        body.bmo-mrm-archive-active .main-inner.group {
          grid-template-columns: 1fr !important;
          gap: 12px !important;
        }
        body.bmo-mrm-archive-active .bmo-mrm-results-grid {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          overflow-x: clip !important;
          grid-template-columns: repeat(auto-fit, minmax(min(190px, calc(50vw - 20px)), 1fr)) !important;
        }
        body.bmo-mrm-archive-active .bmo-mrm-results-grid > article,
        body.bmo-mrm-archive-active .bmo-mrm-results-grid > article.post-standard,
        body.bmo-mrm-archive-active .bmo-mrm-results-grid > article.post,
        body.bmo-mrm-archive-active .bmo-mrm-results-grid > article.hentry {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
        }
        body.bmo-mrm-archive-active #${CONFIG_IDS.panel}.is-anchored {
          width: 100% !important;
          margin-top: 8px !important;
        }
      }
      @media (max-width: 720px) {
        body.bmo-mrm-archive-active .bmo-mrm-results-grid {
          grid-template-columns: repeat(${state.ui.gridMobile}, minmax(0, 1fr)) !important;
        }
        body.bmo-mrm-archive-active .bmo-mrm-results-grid > article {
          min-width: 0 !important;
        }
        .bmo-mrm-inline-grid-fields {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .bmo-mrm-related-grid, .bmo-mrm-yarpp-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
      }
    `;
    style.textContent += `
      .bmo-mrm-config-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .bmo-mrm-config-field {
        display: grid;
        gap: 6px;
        color: var(--bmo-mrm-text);
        font: 600 12px/1.2 Inter, system-ui, sans-serif;
      }
      .bmo-mrm-config-field input {
        width: 100%;
        min-width: 0;
      }
      .bmo-mrm-facet-search-row {
        justify-content: space-between;
      }
      .bmo-mrm-facet-search-row .bmo-mrm-input {
        flex: 1 1 auto;
      }
      .bmo-mrm-facet-dialog-backdrop {
        position: fixed;
        inset: 0;
        z-index: 2147483645;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(8, 10, 18, 0.82);
        backdrop-filter: blur(8px);
      }
      .bmo-mrm-facet-dialog {
        width: min(980px, calc(100vw - 24px));
        max-height: min(88vh, 960px);
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        border-radius: 22px;
        border: 1px solid rgba(255,255,255,.10);
        background: linear-gradient(180deg, rgba(16,23,36,.98), rgba(9,14,24,.99));
        box-shadow: var(--bmo-mrm-shadow-lg);
        overflow: hidden;
      }
      .bmo-mrm-facet-dialog-head,
      .bmo-mrm-facet-dialog-toolbar,
      .bmo-mrm-facet-dialog-footer {
        padding: 14px;
        border-bottom: 1px solid rgba(255,255,255,.06);
      }
      .bmo-mrm-facet-dialog-footer {
        border-bottom: 0;
        border-top: 1px solid rgba(255,255,255,.06);
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
      }
      .bmo-mrm-facet-dialog-head {
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
      }
      .bmo-mrm-facet-dialog-title {
        margin: 0;
        color: #fff;
        font: 800 20px/1.2 Inter, system-ui, sans-serif;
      }
      .bmo-mrm-facet-dialog-body {
        padding: 12px 14px 14px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        overflow: auto;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid {
        grid-template-columns: repeat(${state.ui.gridDesktop}, minmax(${state.ui.compact ? 190 : 210}px, 1fr)) !important;
        gap: ${state.ui.gap}px !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-inner {
        border-radius: ${state.ui.compact ? 16 : 18}px !important;
        box-shadow: ${state.ui.compact ? '0 14px 28px rgba(0,0,0,.24)' : '0 18px 40px rgba(0,0,0,.30)'} !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-thumbnail {
        margin-bottom: ${state.ui.compact ? 8 : 10}px !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-content {
        padding: ${state.ui.compact ? 10 : 12}px !important;
        gap: ${state.ui.compact ? 6 : 8}px !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-title,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-title a {
        font-size: ${state.ui.compact ? 15 : 16}px !important;
        line-height: 1.32 !important;
        margin: 0 !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-meta,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-category,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-date,
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-comments {
        font-size: ${state.ui.compact ? 10 : 11}px !important;
        line-height: 1.35 !important;
      }
      body.bmo-mrm-archive-active .bmo-mrm-results-grid .bmo-mrm-card-actions {
        margin-top: ${state.ui.compact ? 4 : 6}px !important;
      }
      body.bmo-mrm-archive-active #bmo-mrm-panel {
        gap: ${state.ui.compact ? 8 : 10}px;
        padding: ${state.ui.compact ? 10 : 12}px;
      }
      body.bmo-mrm-archive-active .bmo-mrm-panel-title {
        font-size: ${state.ui.compact ? 17 : 18}px;
      }
      body.bmo-mrm-archive-active .bmo-mrm-panel-subtitle,
      body.bmo-mrm-archive-active .bmo-mrm-results-summary,
      body.bmo-mrm-archive-active .bmo-mrm-active-empty {
        font-size: ${state.ui.compact ? 11 : 12}px;
      }
      body.bmo-mrm-single-active article.post.bmo-mrm-post-article {
        border-radius: 24px !important;
        border: 1px solid rgba(255,255,255,.08) !important;
        background: linear-gradient(180deg, rgba(16,23,36,.96), rgba(9,14,24,.98)) !important;
        box-shadow: var(--bmo-mrm-shadow-lg) !important;
        padding: 18px !important;
        overflow: hidden !important;
      }
      body.bmo-mrm-single-active article.post.bmo-mrm-post-article > h1.post-title,
      body.bmo-mrm-single-active article.post.bmo-mrm-post-article .post-title {
        color: #fff !important;
        font: 800 clamp(28px, 4vw, 40px)/1.12 Inter, system-ui, sans-serif !important;
        margin: 0 0 10px !important;
      }
      body.bmo-mrm-single-active .bmo-mrm-post-byline,
      body.bmo-mrm-single-active article.post .post-byline {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
        align-items: center !important;
        margin: 0 0 16px !important;
        color: var(--bmo-mrm-muted) !important;
      }
      body.bmo-mrm-single-active article.post .post-byline a {
        display: inline-flex !important;
        align-items: center !important;
        min-height: 28px !important;
        padding: 0 10px !important;
        border-radius: 999px !important;
        border: 1px solid rgba(255,255,255,.08) !important;
        background: rgba(255,255,255,.04) !important;
        color: #dbe4f2 !important;
      }
      body.bmo-mrm-single-active .bmo-mrm-post-entry-inner,
      body.bmo-mrm-single-active article.post .entry.themeform > .entry-inner {
        display: grid !important;
        gap: 14px !important;
        padding: 0 !important;
      }
      body.bmo-mrm-single-active .bmo-mrm-page-anchor {
        display: block !important;
        overflow: hidden !important;
        border-radius: 18px !important;
        border: 1px solid rgba(255,255,255,.08) !important;
        background: rgba(255,255,255,.03) !important;
        box-shadow: 0 12px 26px rgba(0,0,0,.18) !important;
      }
      body.bmo-mrm-single-active .bmo-mrm-page-image {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        margin: 0 !important;
      }
      body.bmo-mrm-single-active .bmo-mrm-post-nav,
      body.bmo-mrm-single-active .post-nav {
        margin-top: 18px !important;
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 14px !important;
      }
      body.bmo-mrm-single-active .bmo-mrm-post-nav a,
      body.bmo-mrm-single-active .post-nav a {
        display: block !important;
        padding: 14px !important;
        border-radius: 16px !important;
        border: 1px solid rgba(255,255,255,.08) !important;
        background: rgba(255,255,255,.03) !important;
      }
      body.bmo-mrm-single-active #comments,
      body.bmo-mrm-single-active #respond {
        max-width: min(1100px, calc(100vw - 24px)) !important;
        margin: 18px auto 0 !important;
        border-radius: 24px !important;
        border: 1px solid rgba(255,255,255,.08) !important;
        background: linear-gradient(180deg, rgba(16,23,36,.96), rgba(9,14,24,.98)) !important;
        box-shadow: var(--bmo-mrm-shadow-lg) !important;
        padding: 18px !important;
      }
      body.bmo-mrm-single-active .related-posts {
        margin-top: 18px !important;
      }
      body.bmo-mrm-single-active .related-posts > h4,
      body.bmo-mrm-single-active .related-posts > .related-title {
        color: #fff !important;
        margin: 0 0 12px !important;
      }
      @media (max-width: 860px) {
        .bmo-mrm-config-grid,
        .bmo-mrm-facet-dialog-body,
        body.bmo-mrm-single-active .bmo-mrm-post-nav,
        body.bmo-mrm-single-active .post-nav {
          grid-template-columns: 1fr !important;
        }
      }
      @media (max-width: 1180px) {
        body.bmo-mrm-archive-active .bmo-mrm-results-grid {
          grid-template-columns: repeat(${state.ui.gridTablet}, minmax(${state.ui.compact ? 180 : 200}px, 1fr)) !important;
        }
      }
      @media (max-width: 720px) {
        body.bmo-mrm-archive-active .bmo-mrm-results-grid {
          grid-template-columns: repeat(${state.ui.gridMobile}, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 560px) {
        .bmo-mrm-related-grid,
        .bmo-mrm-yarpp-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; gap: 10px !important; }
      }
      @media (max-width: 560px) {
        body.bmo-mrm-archive-active .bmo-mrm-results-grid {
          grid-template-columns: minmax(0, 1fr) !important;
        }
        body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-title,
        body.bmo-mrm-archive-active .bmo-mrm-results-grid .post-title a {
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
        }
      }
      @media (max-width: 420px) {
        .bmo-mrm-related-grid,
        .bmo-mrm-yarpp-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
      }
    `;
  }

function injectEnableUiButtonOnly() {
    injectBaseStyles();
    ensureConfigControls();
  }

function injectShellHotfixStyles() {
    if (document.getElementById("bmo-mrm-shell-hotfix-style")) return;
    const style = document.createElement("style");
    style.id = "bmo-mrm-shell-hotfix-style";
    style.textContent = `
      body.bmo-mrm-archive-active #header-top,
      body.bmo-mrm-single-active #header-top,
      body.bmo-mrm-archive-active #nav-footer,
      body.bmo-mrm-single-active #nav-footer,
      body.bmo-mrm-archive-active .featured-posts,
      body.bmo-mrm-single-active .featured-posts {
        display: none !important;
      }

      body.bmo-mrm-archive-active #wrapper,
      body.bmo-mrm-single-active #wrapper,
      body.bmo-mrm-archive-active #page,
      body.bmo-mrm-single-active #page,
      body.bmo-mrm-archive-active #page > .container,
      body.bmo-mrm-single-active #page > .container,
      body.bmo-mrm-archive-active .main,
      body.bmo-mrm-single-active .main,
      body.bmo-mrm-archive-active .main-inner.group,
      body.bmo-mrm-single-active .main-inner.group,
      body.bmo-mrm-archive-active .content,
      body.bmo-mrm-single-active .content,
      body.bmo-mrm-archive-active .content-inner,
      body.bmo-mrm-single-active .content-inner,
      body.bmo-mrm-archive-active .content-inner > .pad,
      body.bmo-mrm-single-active .content-inner > .pad,
      body.bmo-mrm-archive-active .content-inner > .pad.group,
      body.bmo-mrm-single-active .content-inner > .pad.group,
      body.bmo-mrm-archive-active #footer,
      body.bmo-mrm-single-active #footer,
      body.bmo-mrm-archive-active #footer-bottom,
      body.bmo-mrm-single-active #footer-bottom,
      body.bmo-mrm-archive-active .page-title,
      body.bmo-mrm-single-active .page-title {
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      body.bmo-mrm-archive-active #header .container,
      body.bmo-mrm-single-active #header .container,
      body.bmo-mrm-archive-active #page > .container,
      body.bmo-mrm-single-active #page > .container,
      body.bmo-mrm-archive-active #footer-bottom .container,
      body.bmo-mrm-single-active #footer-bottom .container {
        width: calc(100vw - 24px) !important;
        max-width: none !important;
        margin-left: auto !important;
        margin-right: auto !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        float: none !important;
      }

      body.bmo-mrm-archive-active #page,
      body.bmo-mrm-single-active #page,
      body.bmo-mrm-archive-active #page > .container,
      body.bmo-mrm-single-active #page > .container,
      body.bmo-mrm-archive-active .main,
      body.bmo-mrm-single-active .main,
      body.bmo-mrm-archive-active .main-inner.group,
      body.bmo-mrm-single-active .main-inner.group,
      body.bmo-mrm-archive-active .content,
      body.bmo-mrm-single-active .content,
      body.bmo-mrm-archive-active .content-inner,
      body.bmo-mrm-single-active .content-inner,
      body.bmo-mrm-archive-active .content-inner > .pad,
      body.bmo-mrm-single-active .content-inner > .pad,
      body.bmo-mrm-archive-active .content-inner > .pad.group,
      body.bmo-mrm-single-active .content-inner > .pad.group {
        width: 100% !important;
        max-width: none !important;
        min-width: 0 !important;
        float: none !important;
        margin: 0 !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }

      body.bmo-mrm-archive-active .page-title,
      body.bmo-mrm-single-active .page-title {
        padding: 0 0 8px !important;
        margin: 0 !important;
        color: var(--bmo-mrm-muted) !important;
      }

      body.bmo-mrm-archive-active #header-middle,
      body.bmo-mrm-single-active #header-middle {
        background: transparent !important;
        border: 0 !important;
        padding: 8px 0 4px !important;
      }

      body.bmo-mrm-archive-active #header-middle .pad,
      body.bmo-mrm-single-active #header-middle .pad,
      body.bmo-mrm-archive-active #header-bottom .pad,
      body.bmo-mrm-single-active #header-bottom .pad {
        padding-left: 0 !important;
        padding-right: 0 !important;
      }

      body.bmo-mrm-archive-active #header-middle .site-title,
      body.bmo-mrm-single-active #header-middle .site-title,
      body.bmo-mrm-archive-active #header-middle .site-title a,
      body.bmo-mrm-single-active #header-middle .site-title a {
        color: #eef4fc !important;
        font: 800 22px/1.1 Inter, system-ui, -apple-system, "Segoe UI", sans-serif !important;
        letter-spacing: -.02em !important;
      }

      body.bmo-mrm-archive-active #header-middle .site-description,
      body.bmo-mrm-single-active #header-middle .site-description {
        color: var(--bmo-mrm-muted) !important;
        margin-top: 2px !important;
      }

      body.bmo-mrm-archive-active #header-sticky,
      body.bmo-mrm-single-active #header-sticky,
      body.bmo-mrm-archive-active #header-bottom,
      body.bmo-mrm-single-active #header-bottom,
      body.bmo-mrm-archive-active #nav-header,
      body.bmo-mrm-single-active #nav-header,
      body.bmo-mrm-archive-active #nav-header .nav-wrap,
      body.bmo-mrm-single-active #nav-header .nav-wrap {
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      body.bmo-mrm-archive-active #header-bottom,
      body.bmo-mrm-single-active #header-bottom {
        position: sticky !important;
        top: 0 !important;
        z-index: 999 !important;
        background: rgba(13,16,22,.72) !important;
        backdrop-filter: blur(14px) !important;
        border-top: 1px solid rgba(255,255,255,.05) !important;
        border-bottom: 1px solid rgba(255,255,255,.05) !important;
      }

      body.bmo-mrm-archive-active #nav-header ul.nav,
      body.bmo-mrm-single-active #nav-header ul.nav {
        display: flex !important;
        gap: 10px !important;
        align-items: center !important;
        flex-wrap: nowrap !important;
        overflow-x: auto !important;
        white-space: nowrap !important;
        padding: 0 !important;
      }

      body.bmo-mrm-archive-active #nav-header ul.nav::-webkit-scrollbar,
      body.bmo-mrm-single-active #nav-header ul.nav::-webkit-scrollbar {
        display: none !important;
      }

      body.bmo-mrm-archive-active #nav-header ul.nav > li,
      body.bmo-mrm-single-active #nav-header ul.nav > li {
        float: none !important;
        display: inline-flex !important;
      }

      body.bmo-mrm-archive-active #nav-header ul.nav a,
      body.bmo-mrm-single-active #nav-header ul.nav a {
        min-height: 34px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 12px !important;
        border-radius: 999px !important;
        border: 1px solid var(--bmo-mrm-line) !important;
        background: rgba(255,255,255,.03) !important;
        color: #dbe4f2 !important;
        font: 700 12px/1 Inter, system-ui, -apple-system, "Segoe UI", sans-serif !important;
        text-transform: none !important;
      }

      body.bmo-mrm-archive-active #nav-header ul.nav a:hover,
      body.bmo-mrm-single-active #nav-header ul.nav a:hover {
        background: rgba(124,92,255,.16) !important;
        border-color: rgba(124,92,255,.45) !important;
      }

      body.bmo-mrm-archive-active .main-inner.group {
        display: grid !important;
        width: 100% !important;
        max-width: none !important;
        min-width: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 20px !important;
        align-items: start !important;
      }

      body.bmo-mrm-single-active .main-inner.group {
        display: block !important;
      }

      body.bmo-mrm-archive-active .main-inner.group > .content,
      body.bmo-mrm-single-active .main-inner.group > .content {
        width: auto !important;
        min-width: 0 !important;
        grid-column: 1 !important;
      }
      body.bmo-mrm-archive-active .content:before,
      body.bmo-mrm-archive-active .content:after,
      body.bmo-mrm-single-active .content:before,
      body.bmo-mrm-single-active .content:after {
        content: none !important;
        display: none !important;
      }

      body.bmo-mrm-archive-active .bmo-mrm-panel-host:not(#${ARCHIVE_PANEL_IDS.mobileHost}) {
        display: none !important;
      }

      body.bmo-mrm-archive-active .content {
        background: transparent !important;
        border-radius: 0 !important;
      }

      body.bmo-mrm-archive-active .content > .content-inner > .pad.group.bmo-mrm-results-grid,
      body.bmo-mrm-archive-active .content > .content-inner > .pad.bmo-mrm-results-grid,
      body.bmo-mrm-archive-active .content .content-inner > .pad.group.bmo-mrm-results-grid {
        justify-items: stretch !important;
        justify-content: stretch !important;
        align-content: start !important;
      }

      body.bmo-mrm-archive-active .post-thumbnail::before,
      body.bmo-mrm-archive-active .post-thumbnail::after,
      body.bmo-mrm-archive-active .post-thumbnail a::before,
      body.bmo-mrm-archive-active .post-thumbnail a::after,
      body.bmo-mrm-archive-active .thumb-icon,
      body.bmo-mrm-archive-active .image-overlay,
      body.bmo-mrm-archive-active .thumb-overlay,
      body.bmo-mrm-archive-active .post-thumb-overlay {
        display: none !important;
        content: none !important;
        opacity: 0 !important;
        background: none !important;
        box-shadow: none !important;
        filter: none !important;
      }

      body.bmo-mrm-archive-active .post-thumbnail > a + a,
      body.bmo-mrm-archive-active article.post-standard .post-thumbnail a:nth-of-type(2),
      body.bmo-mrm-archive-active article.post-standard .post-thumbnail div > a:nth-of-type(2) {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        box-shadow: none !important;
        filter: none !important;
      }

      body.bmo-mrm-archive-active .post-thumbnail,
      body.bmo-mrm-archive-active .post-thumbnail img,
      body.bmo-mrm-archive-active .post-thumbnail a {
        filter: none !important;
        box-shadow: none !important;
      }

      body.bmo-mrm-archive-active.bmo-mrm-header-compact #header-middle,
      body.bmo-mrm-single-active.bmo-mrm-header-compact #header-middle {
        padding: 4px 0 1px !important;
      }

      body.bmo-mrm-archive-active.bmo-mrm-header-compact #header-middle .site-title,
      body.bmo-mrm-single-active.bmo-mrm-header-compact #header-middle .site-title,
      body.bmo-mrm-archive-active.bmo-mrm-header-compact #header-middle .site-title a,
      body.bmo-mrm-single-active.bmo-mrm-header-compact #header-middle .site-title a {
        font-size: 18px !important;
      }

      body.bmo-mrm-archive-active.bmo-mrm-header-compact #header-middle .site-description,
      body.bmo-mrm-single-active.bmo-mrm-header-compact #header-middle .site-description {
        margin-top: 0 !important;
        font-size: 11px !important;
      }

      body.bmo-mrm-archive-active.bmo-mrm-header-compact #nav-header ul.nav a,
      body.bmo-mrm-single-active.bmo-mrm-header-compact #nav-header ul.nav a {
        min-height: 30px !important;
        padding: 0 10px !important;
        font-size: 11px !important;
      }

      body.bmo-mrm-archive-active.bmo-mrm-header-compact .main-inner.group > .sidebar.s2.bmo-mrm-panel-host {
        top: 60px !important;
      }

      body.bmo-mrm-archive-active .sidebar.s1,
      body.bmo-mrm-archive-active .sidebar.s2,
      body.bmo-mrm-single-active .sidebar.s1,
      body.bmo-mrm-single-active .sidebar.s2 {
        display: none !important;
      }

      body.bmo-mrm-archive-active .main-inner.group > .sidebar.s2.bmo-mrm-panel-host {
        display: none !important;
        gap: 10px !important;
        float: none !important;
        width: 100% !important;
        max-width: 332px !important;
        min-width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        grid-column: 2 !important;
        align-self: start !important;
        justify-self: stretch !important;
        position: sticky !important;
        top: 72px !important;
      }

      body.bmo-mrm-archive-active #${CONFIG_IDS.panel} {
        display: none !important;
      }

      body.bmo-mrm-archive-active #${ARCHIVE_PANEL_IDS.mobileHost} {
        display: none !important;
        position: fixed !important;
        right: 16px !important;
        bottom: 72px !important;
        left: auto !important;
        width: min(360px, calc(100vw - 24px)) !important;
        max-width: min(360px, calc(100vw - 24px)) !important;
        max-height: calc(100vh - 100px) !important;
        overflow: auto !important;
        z-index: 2147483644 !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }

      body.bmo-mrm-archive-active.bmo-mrm-archive-panel-open #${ARCHIVE_PANEL_IDS.mobileHost} {
        display: block !important;
      }

      body.bmo-mrm-archive-active.bmo-mrm-archive-panel-open::before {
        content: none !important;
        display: none !important;
      }

      @media (max-width: 980px) {
        body.bmo-mrm-archive-active #${ARCHIVE_PANEL_IDS.mobileHost} {
          right: 8px !important;
          left: 8px !important;
          top: 72px !important;
          bottom: 8px !important;
          width: auto !important;
          max-width: none !important;
          max-height: calc(100vh - 84px) !important;
        }
      }

      body.bmo-mrm-archive-active .content > .content-inner,
      body.bmo-mrm-single-active .content > .content-inner {
        margin: 0 !important;
      }

      body.bmo-mrm-archive-active .content > .content-inner > .pad,
      body.bmo-mrm-archive-active .content > .content-inner > .pad.group,
      body.bmo-mrm-single-active .content > .content-inner > .pad,
      body.bmo-mrm-single-active .content > .content-inner > .pad.group {
        padding: 0 !important;
      }

      body.bmo-mrm-archive-active .content > .content-inner > .pad.group.bmo-mrm-results-grid,
      body.bmo-mrm-archive-active .content > .content-inner > .pad.bmo-mrm-results-grid,
      body.bmo-mrm-single-active article.post.bmo-mrm-post-article {
        width: 100% !important;
      }

      body.bmo-mrm-archive-active #footer-bottom,
      body.bmo-mrm-single-active #footer-bottom {
        margin-top: 28px !important;
        padding-top: 10px !important;
        border-top: 1px solid rgba(255,255,255,.06) !important;
      }

      body.bmo-mrm-archive-active #footer-bottom .pad.group,
      body.bmo-mrm-single-active #footer-bottom .pad.group {
        padding-left: 0 !important;
        padding-right: 0 !important;
      }

      body.bmo-mrm-archive-active #footer-bottom .grid,
      body.bmo-mrm-single-active #footer-bottom .grid {
        width: auto !important;
        float: none !important;
      }

      body.bmo-mrm-archive-active #copyright p,
      body.bmo-mrm-single-active #copyright p {
        color: var(--bmo-mrm-muted) !important;
      }

      body.bmo-mrm-single-active article.post.bmo-mrm-post-article {
        max-width: min(1100px, calc(100vw - 24px)) !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }

      @media (max-width: 1180px) {
        body.bmo-mrm-archive-active .main-inner.group {
          grid-template-columns: 1fr !important;
        }

        body.bmo-mrm-archive-active .main-inner.group > .sidebar.s2.bmo-mrm-panel-host {
          grid-column: 1 !important;
          max-width: none !important;
          position: static !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

function renderConfigPanel() {
    let panel = document.getElementById(CONFIG_IDS.panel);
    if (!panel) {
      panel = document.createElement("div");
      panel.id = CONFIG_IDS.panel;
      document.body.appendChild(panel);
    }

    const isArchive = document.body.classList.contains("bmo-mrm-archive-active");
    if (isArchive) {
      state.ui.configOpen = false;
      panel.hidden = true;
      panel.innerHTML = "";
      panel.classList.remove("is-anchored", "is-mobile-drawer");
      if (panel.parentElement !== document.body) document.body.appendChild(panel);
      return;
    }

    if (panel.parentElement !== document.body) document.body.appendChild(panel);
    panel.classList.remove("is-anchored", "is-mobile-drawer");
    panel.hidden = !state.ui.configOpen;
    panel.innerHTML = `
      <div class="bmo-mrm-config-card">
        <h3>BMO UI</h3>
        <label class="bmo-mrm-toggle">
          <input type="checkbox" ${state.ui.enabled ? "checked" : ""} data-config="enabled" />
          <span>Enable UI makeover</span>
        </label>
        <label class="bmo-mrm-toggle">
          <input type="checkbox" ${state.ui.compact ? "checked" : ""} data-config="compact" />
          <span>Compact cards and panel spacing</span>
        </label>
        <div class="bmo-mrm-config-grid">
          <label class="bmo-mrm-config-field">
            <span>Desktop columns</span>
            <input type="number" min="2" max="8" value="${state.ui.gridDesktop}" data-config="gridDesktop" />
          </label>
          <label class="bmo-mrm-config-field">
            <span>Tablet columns</span>
            <input type="number" min="1" max="6" value="${state.ui.gridTablet}" data-config="gridTablet" />
          </label>
          <label class="bmo-mrm-config-field">
            <span>Mobile columns</span>
            <input type="number" min="1" max="3" value="${state.ui.gridMobile}" data-config="gridMobile" />
          </label>
          <label class="bmo-mrm-config-field">
            <span>Gap</span>
            <input type="number" min="6" max="32" value="${state.ui.gap}" data-config="gap" />
          </label>
        </div>
        <div class="bmo-mrm-config-actions">
          <button type="button" class="bmo-mrm-btn ghost" data-config-action="close">Close</button>
          <button type="button" class="bmo-mrm-btn primary" data-config-action="apply">Apply live</button>
        </div>
      </div>
    `;

    panel.querySelector("[data-config-action='close']")?.addEventListener("click", () => {
      state.ui.configOpen = false;
      saveState();
      renderConfigPanel();
    });

    panel.querySelector("[data-config-action='apply']")?.addEventListener("click", () => {
      applyConfigPanelValues(panel);
    });

    panel.querySelectorAll("[data-config='gridDesktop'], [data-config='gridTablet'], [data-config='gridMobile'], [data-config='gap']").forEach((input) => {
      input.addEventListener("change", () => applyConfigPanelValues(panel));
    });

    panel.querySelectorAll("[data-config='compact']").forEach((input) => {
      input.addEventListener("change", () => applyConfigPanelValues(panel));
    });
  }


function injectTypographyStyles() {
    if (document.getElementById("bmo-mrm-typography-style-v1")) return;

    const style = document.createElement("style");
    style.id = "bmo-mrm-typography-style-v1";
    style.textContent = `
      :root {
        --bmo-mrm-font-sans: "Inter var", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        --bmo-mrm-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        --bmo-mrm-type-2xs: 10px;
        --bmo-mrm-type-xs: 11px;
        --bmo-mrm-type-sm: 12px;
        --bmo-mrm-type-ui: 13px;
        --bmo-mrm-type-base: 14px;
        --bmo-mrm-type-body: 15px;
        --bmo-mrm-type-lg: 18px;
        --bmo-mrm-type-xl: 22px;
        --bmo-mrm-type-title: clamp(28px, 4vw, 40px);
        --bmo-mrm-line-tight: 1.08;
        --bmo-mrm-line-title: 1.12;
        --bmo-mrm-line-ui: 1.25;
        --bmo-mrm-line-copy: 1.66;
        --bmo-mrm-tracking-tight: -0.025em;
        --bmo-mrm-tracking-ui: 0.01em;
      }

      html {
        -webkit-text-size-adjust: 100% !important;
        text-size-adjust: 100% !important;
      }

      body.bmo-mrm-archive-active,
      body.bmo-mrm-single-active,
      body:has(#bmo-mrm-reader-page) {
        font-family: var(--bmo-mrm-font-sans) !important;
        font-size: var(--bmo-mrm-type-base) !important;
        line-height: var(--bmo-mrm-line-copy) !important;
        text-rendering: optimizeLegibility !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
      }

      body.bmo-mrm-archive-active button,
      body.bmo-mrm-single-active button,
      body.bmo-mrm-archive-active input,
      body.bmo-mrm-single-active input,
      body.bmo-mrm-archive-active select,
      body.bmo-mrm-single-active select,
      body.bmo-mrm-archive-active textarea,
      body.bmo-mrm-single-active textarea,
      [class^="bmo-mrm-"],
      [class*=" bmo-mrm-"],
      #bmo-mrm-reader-modal,
      #bmo-mrm-reader-page {
        font-family: var(--bmo-mrm-font-sans) !important;
      }

      body.bmo-mrm-archive-active button,
      body.bmo-mrm-single-active button,
      body.bmo-mrm-archive-active input,
      body.bmo-mrm-single-active input,
      body.bmo-mrm-archive-active select,
      body.bmo-mrm-single-active select,
      body.bmo-mrm-archive-active textarea,
      body.bmo-mrm-single-active textarea,
      #bmo-mrm-reader-page button,
      #bmo-mrm-reader-page input,
      #bmo-mrm-reader-page select {
        font-size: var(--bmo-mrm-type-ui) !important;
        line-height: var(--bmo-mrm-line-ui) !important;
        letter-spacing: 0 !important;
        text-transform: none !important;
      }

      body.bmo-mrm-archive-active h1,
      body.bmo-mrm-single-active h1,
      body.bmo-mrm-archive-active h2,
      body.bmo-mrm-single-active h2,
      body.bmo-mrm-archive-active h3,
      body.bmo-mrm-single-active h3,
      body.bmo-mrm-archive-active h4,
      body.bmo-mrm-single-active h4,
      body.bmo-mrm-archive-active .entry-title,
      body.bmo-mrm-single-active .entry-title,
      body.bmo-mrm-archive-active .post-title,
      body.bmo-mrm-single-active .post-title,
      body.bmo-mrm-archive-active .page-title,
      body.bmo-mrm-single-active .page-title,
      .bmo-mrm-panel__title,
      .bmo-mrm-facet-widget__title,
      .bmo-mrm-facet-modal__title,
      .bmo-mrm-reader-title,
      .bmo-mrm-reader-page__title,
      .bmo-mrm-post-hero__title {
        font-family: var(--bmo-mrm-font-sans) !important;
        font-weight: 800 !important;
        line-height: var(--bmo-mrm-line-title) !important;
        letter-spacing: var(--bmo-mrm-tracking-tight) !important;
        text-wrap: balance;
      }

      body.bmo-mrm-archive-active h1,
      body.bmo-mrm-single-active h1,
      body.bmo-mrm-archive-active .entry-title,
      body.bmo-mrm-single-active .entry-title,
      body.bmo-mrm-archive-active .page-title,
      body.bmo-mrm-single-active .page-title {
        font-size: var(--bmo-mrm-type-title) !important;
      }

      body.bmo-mrm-archive-active h2,
      body.bmo-mrm-single-active h2,
      body.bmo-mrm-archive-active .post-title,
      body.bmo-mrm-single-active .post-title,
      .bmo-mrm-reader-page__title-text {
        font-size: clamp(20px, 2.4vw, 28px) !important;
      }

      body.bmo-mrm-archive-active h3,
      body.bmo-mrm-single-active h3,
      .bmo-mrm-panel__title,
      .bmo-mrm-facet-modal__title {
        font-size: var(--bmo-mrm-type-lg) !important;
      }

      body.bmo-mrm-archive-active .entry-content,
      body.bmo-mrm-single-active .entry-content,
      body.bmo-mrm-archive-active .post-content,
      body.bmo-mrm-single-active .post-content,
      body.bmo-mrm-archive-active .post-entry,
      body.bmo-mrm-single-active .post-entry,
      body.bmo-mrm-archive-active article .entry,
      body.bmo-mrm-single-active article .entry {
        font-size: var(--bmo-mrm-type-body) !important;
        line-height: var(--bmo-mrm-line-copy) !important;
      }

      body.bmo-mrm-archive-active .entry-content p,
      body.bmo-mrm-single-active .entry-content p,
      body.bmo-mrm-archive-active .post-content p,
      body.bmo-mrm-single-active .post-content p,
      body.bmo-mrm-archive-active .post-entry p,
      body.bmo-mrm-single-active .post-entry p {
        margin-top: 0 !important;
        margin-bottom: 1em !important;
      }

      .bmo-mrm-results-grid article .entry-title,
      .bmo-mrm-results-grid article .post-title,
      .bmo-mrm-results-grid article .entry-title-link,
      .bmo-mrm-results-grid article .post-title a {
        font-size: var(--bmo-mrm-type-body) !important;
        line-height: 1.35 !important;
        font-weight: 740 !important;
        letter-spacing: -0.012em !important;
      }

      .bmo-mrm-chip,
      .bmo-mrm-status-pill,
      .bmo-mrm-panel__meta,
      .bmo-mrm-facet-widget__count,
      .bmo-mrm-facet-term,
      .bmo-mrm-theme-section__title,
      .bmo-mrm-reader-page__counter,
      .bmo-mrm-reader-page__hint,
      .bmo-mrm-reader-page__button,
      .bmo-mrm-reader-control,
      .bmo-mrm-reader-chip,
      .bmo-mrm-term-name,
      .bmo-mrm-term-count {
        font-size: var(--bmo-mrm-type-sm) !important;
        line-height: var(--bmo-mrm-line-ui) !important;
        letter-spacing: var(--bmo-mrm-tracking-ui) !important;
      }

      .bmo-mrm-panel__title,
      .bmo-mrm-facet-widget__title,
      .bmo-mrm-theme-section__title,
      .bmo-mrm-reader-title,
      .bmo-mrm-reader-page__button,
      .bmo-mrm-reader-control,
      .bmo-mrm-chip,
      .bmo-mrm-status-pill,
      .bmo-mrm-term-main,
      .bmo-mrm-filter-button,
      .bmo-mrm-config-button {
        text-transform: none !important;
      }

      .bmo-mrm-facet-widget__count,
      .bmo-mrm-term-count,
      .bmo-mrm-reader-page__counter,
      .bmo-mrm-reader-progress,
      .bmo-mrm-panel__meta {
        font-variant-numeric: tabular-nums !important;
      }

      .bmo-mrm-reader-page__title,
      .bmo-mrm-reader-title {
        min-width: 0 !important;
      }

      .bmo-mrm-reader-page__title-text,
      .bmo-mrm-reader-title,
      .bmo-mrm-results-grid article .entry-title,
      .bmo-mrm-results-grid article .post-title {
        overflow-wrap: anywhere !important;
      }

      @media (max-width: 720px) {
        :root {
          --bmo-mrm-type-base: 13px;
          --bmo-mrm-type-body: 14px;
          --bmo-mrm-type-title: clamp(24px, 8vw, 32px);
        }

        .bmo-mrm-results-grid article .entry-title,
        .bmo-mrm-results-grid article .post-title,
        .bmo-mrm-results-grid article .entry-title-link,
        .bmo-mrm-results-grid article .post-title a {
          font-size: 14px !important;
          line-height: 1.32 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }


function injectModernDarkFlatThemeStyles() {
  const existing = document.getElementById("bmo-mrm-modern-dark-flat-style-v1");
  if (existing) {
    document.head.appendChild(existing);
    injectStrictDarkFlatThemeStyles();
    return;
  }

  const style = document.createElement("style");
  style.id = "bmo-mrm-modern-dark-flat-style-v1";
  style.textContent = `
    :root {
      color-scheme: dark !important;
      --bmo-mrm-accent-rgb: 124, 92, 255 !important;
      --bmo-mrm-bg: #050506 !important;
      --bmo-mrm-bg-2: #08090b !important;
      --bmo-mrm-panel: #0d0e12 !important;
      --bmo-mrm-panel-2: #111218 !important;
      --bmo-mrm-soft: #151720 !important;
      --bmo-mrm-soft-2: #101118 !important;
      --bmo-mrm-line: transparent !important;
      --bmo-mrm-line-2: transparent !important;
      --bmo-mrm-text: #f5f7fb !important;
      --bmo-mrm-muted: #a9b2c3 !important;
      --bmo-mrm-shadow: none !important;
      --bmo-mrm-shadow-lg: none !important;
      --bmo-mrm-reader-bg: #050506 !important;
      --bmo-mrm-reader-bg-2: #08090b !important;
      --bmo-mrm-reader-surface: #0d0e12 !important;
      --bmo-mrm-reader-line: transparent !important;
      --bmo-mrm-reader-line-strong: transparent !important;
      --bmo-mrm-reader-text: #f5f7fb !important;
      --bmo-mrm-reader-muted: #a9b2c3 !important;
    }

    body.bmo-mrm-archive-active,
    body.bmo-mrm-single-active,
    body:has(#bmo-mrm-reader-page),
    body.bmo-mrm-archive-active #page,
    body.bmo-mrm-single-active #page,
    body.bmo-mrm-archive-active #main,
    body.bmo-mrm-single-active #main,
    body.bmo-mrm-archive-active main,
    body.bmo-mrm-single-active main,
    body.bmo-mrm-archive-active .site,
    body.bmo-mrm-single-active .site,
    body.bmo-mrm-archive-active .site-content,
    body.bmo-mrm-single-active .site-content,
    body.bmo-mrm-archive-active .content-area,
    body.bmo-mrm-single-active .content-area,
    body.bmo-mrm-archive-active .content,
    body.bmo-mrm-single-active .content,
    body.bmo-mrm-archive-active .container,
    body.bmo-mrm-single-active .container,
    #bmo-mrm-reader-page {
      background: #050506 !important;
      background-color: #050506 !important;
      background-image: none !important;
      color: var(--bmo-mrm-text) !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    body.bmo-mrm-archive-active::before,
    body.bmo-mrm-archive-active::after,
    body.bmo-mrm-single-active::before,
    body.bmo-mrm-single-active::after,
    body.bmo-mrm-archive-active .site::before,
    body.bmo-mrm-archive-active .site::after,
    body.bmo-mrm-single-active .site::before,
    body.bmo-mrm-single-active .site::after,
    #bmo-mrm-reader-page::before,
    #bmo-mrm-reader-page::after {
      background: transparent !important;
      background-image: none !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    body.bmo-mrm-archive-active :is(header, nav, .site-header, .main-navigation, .menu, .sub-menu, .sidebar, .widget, .widget-area, .site-footer, article, article.post, article.hentry, article.post-standard, .entry, .entry-header, .entry-content, .entry-footer, .post-content, .post-thumbnail, .entry-image, .post-image, input, select, textarea, button),
    body.bmo-mrm-single-active :is(header, nav, .site-header, .main-navigation, .menu, .sub-menu, .sidebar, .widget, .widget-area, .site-footer, article, article.post, article.hentry, article.post-standard, .entry, .entry-header, .entry-content, .entry-footer, .post-content, .post-thumbnail, .entry-image, .post-image, input, select, textarea, button),
    [class^="bmo-mrm-"],
    [class*=" bmo-mrm-"],
    #bmo-mrm-reader-modal,
    #bmo-mrm-reader-page,
    #bmo-mrm-reader-page :is(input, select, textarea, button) {
      border: 0 !important;
      outline-offset: 3px !important;
      box-shadow: none !important;
      text-shadow: none !important;
      background-image: none !important;
    }

    body.bmo-mrm-archive-active :is(header, nav, .site-header, .main-navigation, .sidebar, .widget, .widget-area, .site-footer, article, article.post, article.hentry, article.post-standard),
    body.bmo-mrm-single-active :is(header, nav, .site-header, .main-navigation, .sidebar, .widget, .widget-area, .site-footer, article, article.post, article.hentry, article.post-standard),
    .bmo-mrm-panel,
    .bmo-mrm-panel-toggle,
    .bmo-mrm-facet-widget,
    .bmo-mrm-config-panel,
    .bmo-mrm-reader-page__topbar,
    .bmo-mrm-reader-page__dock,
    .bmo-mrm-reader-page__thumbs,
    .bmo-mrm-reader-page__page,
    #bmo-mrm-reader-dialog {
      background: #0d0e12 !important;
      color: var(--bmo-mrm-text) !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    body.bmo-mrm-archive-active :is(.entry-content, .post-content, .entry-header, .entry-footer),
    body.bmo-mrm-single-active :is(.entry-content, .post-content, .entry-header, .entry-footer),
    #bmo-mrm-reader-page {
      color: var(--bmo-mrm-text) !important;
    }

    .bmo-mrm-chip,
    .bmo-mrm-status-pill,
    .bmo-mrm-btn,
    .bmo-mrm-field input,
    .bmo-mrm-field select,
    .bmo-mrm-theme-swatch,
    .bmo-mrm-chip-overflow-button,
    .bmo-mrm-reader-control,
    .bmo-mrm-reader-chip,
    .bmo-mrm-reader-page__button,
    .bmo-mrm-term-main,
    .bmo-mrm-mode-btn,
    body.bmo-mrm-archive-active :is(input, select, textarea, button),
    body.bmo-mrm-single-active :is(input, select, textarea, button),
    #bmo-mrm-reader-page :is(input, select, textarea, button) {
      background: #151720 !important;
      color: var(--bmo-mrm-text) !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    .bmo-mrm-chip:hover,
    .bmo-mrm-btn:hover,
    .bmo-mrm-chip-overflow-button:hover,
    .bmo-mrm-reader-control:hover,
    .bmo-mrm-reader-page__button:hover,
    .bmo-mrm-term-main:hover,
    .bmo-mrm-mode-btn:hover,
    body.bmo-mrm-archive-active button:hover,
    body.bmo-mrm-single-active button:hover,
    #bmo-mrm-reader-page button:hover {
      background: rgba(var(--bmo-mrm-accent-rgb, 124, 92, 255), .18) !important;
      color: #ffffff !important;
    }

    .bmo-mrm-chip.is-active,
    .bmo-mrm-chip.is-include,
    .bmo-mrm-mode-btn.is-include,
    .bmo-mrm-status-pill.is-active,
    .bmo-mrm-btn.primary,
    .bmo-mrm-reader-control.is-active,
    button.bmo-mrm-is-active {
      background: var(--bmo-mrm-accent, #7c5cff) !important;
      color: #ffffff !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    .bmo-mrm-chip.is-exclude,
    .bmo-mrm-mode-btn.is-exclude {
      background: rgba(255, 92, 143, .20) !important;
      color: #ffd6e4 !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    body.bmo-mrm-archive-active :is(a, a:visited, .entry-title a, .post-title a, .site-title a),
    body.bmo-mrm-single-active :is(a, a:visited, .entry-title a, .post-title a, .site-title a),
    #bmo-mrm-reader-page a {
      color: #f5f7fb !important;
      text-decoration: none !important;
    }

    body.bmo-mrm-archive-active :is(a:hover, a:focus-visible, .entry-title a:hover, .post-title a:hover),
    body.bmo-mrm-single-active :is(a:hover, a:focus-visible, .entry-title a:hover, .post-title a:hover),
    #bmo-mrm-reader-page a:hover {
      color: var(--bmo-mrm-accent, #7c5cff) !important;
      text-decoration: none !important;
    }

    body.bmo-mrm-archive-active :is(input, select, textarea)::placeholder,
    body.bmo-mrm-single-active :is(input, select, textarea)::placeholder,
    #bmo-mrm-reader-page :is(input, select, textarea)::placeholder {
      color: var(--bmo-mrm-muted) !important;
    }

    body.bmo-mrm-archive-active :is(input, select, textarea, button, a):focus-visible,
    body.bmo-mrm-single-active :is(input, select, textarea, button, a):focus-visible,
    #bmo-mrm-reader-page :is(input, select, textarea, button, a):focus-visible {
      outline: 2px solid rgba(var(--bmo-mrm-accent-rgb, 124, 92, 255), .76) !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    body.bmo-mrm-archive-active :is(hr, table, tr, th, td, fieldset, legend, .entry-meta, .post-meta, .post-info, .post-comments, .comment, .comment-list, .comment-respond),
    body.bmo-mrm-single-active :is(hr, table, tr, th, td, fieldset, legend, .entry-meta, .post-meta, .post-info, .post-comments, .comment, .comment-list, .comment-respond) {
      border-color: transparent !important;
      box-shadow: none !important;
      background-image: none !important;
    }

    body.bmo-mrm-archive-active :is(.entry-meta, .post-meta, .post-info, .post-comments, small),
    body.bmo-mrm-single-active :is(.entry-meta, .post-meta, .post-info, .post-comments, small),
    .bmo-mrm-panel__meta,
    .bmo-mrm-facet-widget__count,
    .bmo-mrm-reader-page__counter {
      color: var(--bmo-mrm-muted) !important;
    }

    body.bmo-mrm-archive-active :is(img, picture, video, canvas, iframe),
    body.bmo-mrm-single-active :is(img, picture, video, canvas, iframe),
    #bmo-mrm-reader-page :is(img, picture, video, canvas, iframe) {
      box-shadow: none !important;
      border: 0 !important;
    }

    @media (max-width: 760px) {
      body.bmo-mrm-archive-active :is(.content, .container, article, article.post, article.hentry, article.post-standard),
      body.bmo-mrm-single-active :is(.content, .container, article, article.post, article.hentry, article.post-standard),
      .bmo-mrm-panel {
        border-radius: 16px !important;
      }
    }
  `;
  document.head.appendChild(style);
  injectStrictDarkFlatThemeStyles();
}

function injectStrictDarkFlatThemeStyles() {
  const existing = document.getElementById("bmo-mrm-strict-dark-flat-polish-style-v2");
  if (existing) {
    document.head.appendChild(existing);
    return;
  }

  const style = document.createElement("style");
  style.id = "bmo-mrm-strict-dark-flat-polish-style-v2";
  style.textContent = `
    :root {
      color-scheme: dark !important;
      --bmo-mrm-bg: #050506 !important;
      --bmo-mrm-bg-2: #08090b !important;
      --bmo-mrm-panel: #0d0e12 !important;
      --bmo-mrm-panel-2: #111218 !important;
      --bmo-mrm-soft: #151720 !important;
      --bmo-mrm-soft-2: #101118 !important;
      --bmo-mrm-line: transparent !important;
      --bmo-mrm-line-2: transparent !important;
      --bmo-mrm-reader-line: transparent !important;
      --bmo-mrm-reader-line-strong: transparent !important;
      --bmo-mrm-shadow: none !important;
      --bmo-mrm-shadow-lg: none !important;
      --bmo-mrm-reader-bg: #050506 !important;
      --bmo-mrm-reader-bg-2: #08090b !important;
      --bmo-mrm-reader-surface: #0d0e12 !important;
      --bmo-mrm-text: #f5f7fb !important;
      --bmo-mrm-reader-text: #f5f7fb !important;
      --bmo-mrm-muted: #a9b2c3 !important;
      --bmo-mrm-reader-muted: #a9b2c3 !important;
    }

    html,
    body,
    body.custom-background,
    body[class*="reader-page"],
    #bmo-mrm-reader-page {
      background: #050506 !important;
      background-color: #050506 !important;
      background-image: none !important;
      color: var(--bmo-mrm-text, #f5f7fb) !important;
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
      color: var(--bmo-mrm-text, #f5f7fb) !important;
      border-color: transparent !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      filter: none !important;
    }

    body :where(
      [class^="bmo-mrm-"],
      [class*=" bmo-mrm-"],
      #bmo-mrm-reader-dialog,
      #bmo-mrm-reader-modal,
      #bmo-mrm-reader-overlay,
      #bmo-mrm-reader-page
    ) {
      background-image: none !important;
      border: 0 !important;
      box-shadow: none !important;
      text-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    body :where(
      [class^="bmo-mrm-panel"],
      [class*=" bmo-mrm-panel"],
      [class^="bmo-mrm-facet"],
      [class*=" bmo-mrm-facet"],
      [class^="bmo-mrm-reader-page__"],
      [class*=" bmo-mrm-reader-page__"],
      [class^="bmo-mrm-config"],
      [class*=" bmo-mrm-config"],
      [class^="bmo-mrm-modal"],
      [class*=" bmo-mrm-modal"],
      [class^="bmo-mrm-drawer"],
      [class*=" bmo-mrm-drawer"],
      [class^="bmo-mrm-sheet"],
      [class*=" bmo-mrm-sheet"],
      #bmo-mrm-reader-dialog,
      #bmo-mrm-reader-modal,
      #bmo-mrm-reader-page
    ) {
      background-color: #0d0e12 !important;
      color: var(--bmo-mrm-text, #f5f7fb) !important;
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
      [class^="bmo-mrm-btn"],
      [class*=" bmo-mrm-btn"],
      [class^="bmo-mrm-button"],
      [class*=" bmo-mrm-button"],
      [class^="bmo-mrm-chip"],
      [class*=" bmo-mrm-chip"],
      [class^="bmo-mrm-control"],
      [class*=" bmo-mrm-control"],
      [class^="bmo-mrm-mode-btn"],
      [class*=" bmo-mrm-mode-btn"],
      [class^="bmo-mrm-status-pill"],
      [class*=" bmo-mrm-status-pill"],
      [class^="bmo-mrm-theme-swatch"],
      [class*=" bmo-mrm-theme-swatch"],
      [class^="bmo-mrm-term-main"],
      [class*=" bmo-mrm-term-main"]
    ) {
      background: #151720 !important;
      background-image: none !important;
      color: var(--bmo-mrm-text, #f5f7fb) !important;
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
      [class^="bmo-mrm-btn"]:hover,
      [class*=" bmo-mrm-btn"]:hover,
      [class^="bmo-mrm-button"]:hover,
      [class*=" bmo-mrm-button"]:hover,
      [class^="bmo-mrm-chip"]:hover,
      [class*=" bmo-mrm-chip"]:hover,
      [class^="bmo-mrm-control"]:hover,
      [class*=" bmo-mrm-control"]:hover,
      [class^="bmo-mrm-term-main"]:hover,
      [class*=" bmo-mrm-term-main"]:hover
    ) {
      background: rgba(var(--bmo-mrm-accent-rgb, 124, 92, 255), .18) !important;
      color: #ffffff !important;
    }

    body :where(
      .is-active,
      .current,
      [aria-current="page"],
      [aria-pressed="true"],
      [class*="is-include"],
      [class*="primary"]
    ):where([class^="bmo-mrm-"], [class*=" bmo-mrm-"], button, a) {
      background: var(--bmo-mrm-accent, #7c5cff) !important;
      color: #ffffff !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    body :where([class*="is-exclude"]):where([class^="bmo-mrm-"], [class*=" bmo-mrm-"]) {
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
      color: var(--bmo-mrm-accent, #7c5cff) !important;
      text-decoration: none !important;
    }

    body :where(input, select, textarea, button, a):focus-visible {
      outline: 2px solid rgba(var(--bmo-mrm-accent-rgb, 124, 92, 255), .76) !important;
      outline-offset: 3px !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }

    body :where(img, picture, video, canvas, iframe, svg) {
      border: 0 !important;
      box-shadow: none !important;
    }

    body :where(.entry-meta, .post-meta, .post-info, .post-comments, small, [class*="__meta"], [class*="__count"], [class*="__counter"]) {
      color: var(--bmo-mrm-muted, #a9b2c3) !important;
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

  if (!window.__bmo_mrm_strictDarkFlatThemeOrderGuard) {
    window.__bmo_mrm_strictDarkFlatThemeOrderGuard = true;
    const keepLast = () => {
      const strictStyle = document.getElementById("bmo-mrm-strict-dark-flat-polish-style-v2");
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
    injectTypographyStyles();
    if (isReaderPopupPage()) {
      renderReaderPage();
      injectModernDarkFlatThemeStyles();
      return;
    }
    injectBaseStyles();
    ensureConfigControls();
    injectModernDarkFlatThemeStyles();
    if (!state.ui.enabled) {
      injectEnableUiButtonOnly();
      injectModernDarkFlatThemeStyles();
      return;
    }
    if (isSinglePostPage()) {
      initSinglePostPage();
      injectModernDarkFlatThemeStyles();
      return;
    }
    const archiveRoot = findArchiveRoot();
    if (archiveRoot && archiveRoot.querySelector("article.post-standard, article.post, article.hentry")) {
      initArchivePage();
      injectModernDarkFlatThemeStyles();
    }
  }

  init();
})();
