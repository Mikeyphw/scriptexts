// ==UserScript==
// @name         Manga Archive Panel + Reader Popup (Yaoi Manga Online, YMO)
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/yaoimangaonline-modern-reader
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/builders/manga-reader-modernizer
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/manga-reader-modernizer/dist/yaoimangaonline-modern-reader.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/manga-reader-modernizer/dist/yaoimangaonline-modern-reader.user.js
// @version      5.2.47
// @description  YMO-only userscript: archive panel, YMO metadata-aware filtering with IN/OUT modes, mobile-friendly UI, grid config, Komikku-style reader popup/page, and single-post UI for Yaoi Manga Online.
// @run-at       document-idle
// @match        https://yaoimangaonline.com/*
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  if (!['yaoimangaonline.com'].includes(location.hostname)) return;

  const STORAGE_KEY = "ymo_modern_archive_panel_v1";
  const READ_POSTS_KEY = "ymo_modern_archive_read_posts_v1";

  let cachedSinglePostPage = null;
  let cachedPageType = null;
  let pagetualHooksInstalled = false;
  const domIdCache = new Map();

const facetOptionLabelCache = new Map();
const facetOptionMapCache = new Map();
const debouncedFacetRenderCache = new Map();

function getFacetOptionLabel(option) {
  if (!option) return "";
  const key = `${String(option.raw || "")}::${String(option.label || "")}`;
  if (facetOptionLabelCache.has(key)) return facetOptionLabelCache.get(key);
  const label = String(option.label || titleCase(option.raw || "")).trim();
  facetOptionLabelCache.set(key, label);
  return label;
}

function getFacetOptionMap(facet) {
  if (!facet || !facet.key) return new Map();
  const signature = `${facet.key}:${Array.isArray(facet.options) ? facet.options.length : 0}`;
  const cached = facetOptionMapCache.get(signature);
  if (cached) return cached;
  const map = new Map();
  for (const option of facet.options || []) {
    map.set(option.raw, option);
  }
  facetOptionMapCache.set(signature, map);
  return map;
}

function getDebouncedFacetRenderer(cacheKey, fn, delay = 120) {
  if (debouncedFacetRenderCache.has(cacheKey)) return debouncedFacetRenderCache.get(cacheKey);
  const wrapped = debounce(fn, delay);
  debouncedFacetRenderCache.set(cacheKey, wrapped);
  return wrapped;
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

  function getSiteStorageScope() {
    return "ymo";
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
  const FACET_CATALOG_CACHE_KEY = "ymo_facet_catalog_v1";
  const FACET_CATALOG_TTL_MS = 1000 * 60 * 60 * 24 * 14;

  let nativeFacetApplyTimer = 0;
  let nativeFacetApplyTarget = "";
  let archiveRefreshTimer = 0;
  let facetCatalogWarmPromise = null;
  let facetCatalogWarmNonce = "";

  const MOBILE_MEDIA_QUERY = "(max-width: 920px)";
  const SMALL_MOBILE_MEDIA_QUERY = "(max-width: 720px)";

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


  function isMobileViewport() {
    return window.matchMedia?.(MOBILE_MEDIA_QUERY).matches ?? window.innerWidth <= 920;
  }

  function isSmallMobileViewport() {
    return window.matchMedia?.(SMALL_MOBILE_MEDIA_QUERY).matches ?? window.innerWidth <= 720;
  }

  function prefersReducedDataMode() {
    try {
      return Boolean(navigator.connection && navigator.connection.saveData);
    } catch {
      return false;
    }
  }

  function isLowPowerDevice() {
    const cores = Number(navigator.hardwareConcurrency || 0);
    return prefersReducedDataMode() || (cores > 0 && cores <= 4);
  }


  const DEFAULT_HIDDEN_FACET_TERMS = {
    "synthetic:tag": ["cuntboy", "ai", "shota"],
    "native:ep_filter_post_tag": ["cuntboy", "ai", "shota"],
  };

  const READER_MODAL_IDS = {
    style: "ymo-reader-modal-style",
    overlay: "ymo-reader-overlay",
    dialog: "ymo-reader-dialog",
    frame: "ymo-reader-frame",
  };

  const READER_POPUP_PARAM = "ymo_reader_popup";
  const READER_PREFS_KEY = "ymo_reader_page_prefs_v1";
  const READER_PAYLOAD_KEY = "ymo_reader_payload_v1";


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
  const primaryReaderImages = content.querySelectorAll("img.img-Yaoi Manga Online").length;
  const imageCount = content.querySelectorAll("img").length;
  const paragraphCount = content.querySelectorAll("p").length;

  cachedSinglePostPage = Boolean(commentArea || taxonomyArea || primaryReaderImages >= 2 || imageCount >= 4 || paragraphCount >= 3);
  return cachedSinglePostPage;
}

function detectPageType() {
  if (cachedPageType) return cachedPageType;
  if (isReaderPopupPage()) {
    cachedPageType = "reader";
    return cachedPageType;
  }
  if (document.querySelector(".content-archive, .posts, .entries, main .archive, body.home, body.archive, body.blog")) {
    cachedPageType = isSinglePostPage() ? "post" : "listing";
    return cachedPageType;
  }
  cachedPageType = isSinglePostPage() ? "post" : "listing";
  return cachedPageType;
}

function shouldRunArchiveMode() {
  return !isReaderPopupPage() && !isSinglePostPage();
}

function cleanupSinglePostLayoutArtifacts() {
  document.querySelectorAll(".ymo-results-grid").forEach((node) => node.classList.remove("ymo-results-grid"));
  document.querySelectorAll(".ymo-hidden-card, .ymo-read").forEach((node) => {
    node.classList.remove("ymo-hidden-card");
  });
  document.getElementById("ymo-panel")?.remove();
  document.getElementById("ymo-panel-toggle")?.remove();
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
  window.parent.postMessage({ source: "ymo-reader-embed", action }, location.origin);
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

  const onScroll = (event) => {
    const currentY = getScrollTop(event.currentTarget);
    const delta = currentY - lastY;

    if (currentY < 28 || delta < -12) {
      root.classList.remove("is-topbar-hidden");
    } else if (delta > 18) {
      root.classList.add("is-topbar-hidden");
    }

    lastY = currentY;
  };

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
    img.getAttribute("data-lazy-src"),
    img.getAttribute("data-lazy-src-webp"),
    img.getAttribute("data-thumb"),
    img.getAttribute("data-orig-src"),
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
  if (/img-Yaoi Manga Online/.test(className)) return true;
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

  const primaryCandidates = Array.from(contentRoot.querySelectorAll("img.img-Yaoi Manga Online"));
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
  document.querySelectorAll("link[data-ymo-reader-prefetch='1']").forEach((node) => node.remove());

  for (const href of normalized.slice(0, 3)) {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    link.as = "document";
    link.setAttribute("data-ymo-reader-prefetch", "1");
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
    ".ymo-native-ad",
    ".code-block",
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
      "img.img-Yaoi Manga Online, img[src*='/wp-content/uploads/'], img[srcset], img[decoding='async'], img[loading='lazy']"
    )
  );

  for (const img of images) {
    if (!(img instanceof HTMLImageElement)) continue;
    if (img.closest("#comments, #respond, .yarpp-thumbnails-horizontal, .ymo-post-image-card")) continue;
    if (!content.contains(img)) continue;

    const src = img.currentSrc || img.src || "";
    const widthAttr = Number(img.getAttribute("width") || 0);
    const shouldWrap = img.classList.contains("img-Yaoi Manga Online") || widthAttr >= 360 || /\/wp-content\/uploads\//.test(src);
    if (!shouldWrap) continue;

    const wrapper = document.createElement("div");
    wrapper.className = "ymo-post-image-card";
    img.parentNode?.insertBefore(wrapper, img);
    wrapper.appendChild(img);
  }
}

function injectSinglePostStyles() {
  if (document.getElementById("ymo-single-post-style-v4")) return;

  const style = document.createElement("style");
  style.id = "ymo-single-post-style-v4";
  style.textContent = `
    body.ymo-single-post-page {
      background:
        radial-gradient(circle at top, rgba(124,92,255,.10), transparent 28%),
        radial-gradient(circle at 85% 10%, rgba(37,194,160,.06), transparent 18%),
        #07101a !important;
      color: #e9eef6 !important;
      font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important;
      line-height: 1.45 !important;
    }

    body.ymo-single-post-page .site-container,
    body.ymo-single-post-page .wrap,
    body.ymo-single-post-page .site-inner,
    body.ymo-single-post-page .content-sidebar-wrap,
    body.ymo-single-post-page .content,
    body.ymo-single-post-page .full-width-content .content {
      max-width: none !important;
    }

    body.ymo-single-post-page a,
    body.ymo-single-post-page a:visited {
      color: #dfe7f3 !important;
      text-decoration: none !important;
    }

    body.ymo-single-post-page a:hover {
      color: #fff !important;
      text-decoration: none !important;
    }

    body.ymo-single-post-page .nav-primary {
      position: sticky !important;
      top: 0 !important;
      z-index: 999 !important;
      background: rgba(13, 16, 22, 0.72) !important;
      backdrop-filter: blur(14px) !important;
      border-bottom: 1px solid rgba(255,255,255,.05) !important;
      box-shadow: none !important;
    }

    body.ymo-single-post-page .nav-primary .wrap,
    body.ymo-single-post-page .site-header .wrap,
    body.ymo-single-post-page .site-inner .content-sidebar-wrap,
    body.ymo-single-post-page .site-footer .wrap {
      max-width: 1360px !important;
      margin-left: auto !important;
      margin-right: auto !important;
      padding-left: 20px !important;
      padding-right: 20px !important;
    }

    body.ymo-single-post-page .genesis-nav-menu,
    body.ymo-single-post-page .nav-primary .menu {
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

    body.ymo-single-post-page .genesis-nav-menu::-webkit-scrollbar,
    body.ymo-single-post-page .nav-primary .menu::-webkit-scrollbar {
      display: none !important;
    }

    body.ymo-single-post-page .genesis-nav-menu > li,
    body.ymo-single-post-page .nav-primary .menu > li {
      float: none !important;
      display: inline-flex !important;
      align-items: center !important;
      margin: 0 !important;
    }

    body.ymo-single-post-page .genesis-nav-menu a,
    body.ymo-single-post-page .nav-primary .menu a {
      min-height: 40px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 14px !important;
      border-radius: 999px !important;
      border: 1px solid rgba(255,255,255,.08) !important;
      background: rgba(255,255,255,.03) !important;
      color: #dbe4f2 !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      letter-spacing: .01em !important;
      text-transform: none !important;
    }

    body.ymo-single-post-page .genesis-nav-menu a:hover,
    body.ymo-single-post-page .genesis-nav-menu .current-menu-item > a,
    body.ymo-single-post-page .nav-primary .menu a:hover,
    body.ymo-single-post-page .nav-primary .menu .current-menu-item > a {
      background: rgba(124,92,255,.16) !important;
      border-color: rgba(124,92,255,.45) !important;
    }

    body.ymo-single-post-page .site-header {
      background: transparent !important;
      border: 0 !important;
      padding: 22px 0 8px !important;
    }

    body.ymo-single-post-page .site-header .wrap {
      display: grid !important;
      grid-template-columns: 1fr !important;
      gap: 16px !important;
      align-items: stretch !important;
    }

    body.ymo-single-post-page .search-form,
    body.ymo-single-post-page .site-header .search-form,
    body.ymo-single-post-page form.search-form {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      min-height: 72px !important;
      padding: 10px !important;
      width: 100% !important;
      max-width: none !important;
      margin: 12px 0 0 !important;
      background: rgba(13, 20, 33, 0.88) !important;
      border: 1px solid rgba(255,255,255,.08) !important;
      border-radius: 20px !important;
      box-shadow: 0 18px 40px rgba(0,0,0,.34) !important;
      overflow: hidden !important;
    }

    body.ymo-single-post-page .search-form::before {
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

    body.ymo-single-post-page .search-form-input,
    body.ymo-single-post-page input.search-form-input,
    body.ymo-single-post-page .search-form input[type="search"] {
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

    body.ymo-single-post-page .search-form-input::placeholder,
    body.ymo-single-post-page .search-form input[type="search"]::placeholder {
      color: #98a5b8 !important;
      opacity: 1 !important;
    }

    body.ymo-single-post-page .search-form-submit,
    body.ymo-single-post-page input.search-form-submit,
    body.ymo-single-post-page .search-form input[type="submit"] {
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
      background: linear-gradient(135deg, #7c5cff, #6d7cff) !important;
      color: #fff !important;
      font-size: 14px !important;
      font-weight: 800 !important;
      cursor: pointer !important;
      box-shadow: 0 10px 24px rgba(124,92,255,.28) !important;
      clip: auto !important;
      height: auto !important;
      position: static !important;
    }

    body.ymo-single-post-page .site-inner {
      padding-top: 10px !important;
      padding-bottom: 36px !important;
      background: transparent !important;
      box-shadow: none !important;
      border-top: 0 !important;
      margin-top: 0 !important;
    }

    body.ymo-single-post-page .content-sidebar-wrap {
      max-width: 1360px !important;
      margin: 0 auto !important;
    }

    body.ymo-single-post-page .breadcrumb {
      max-width: 1100px !important;
      margin: 0 auto 14px !important;
      padding: 0 !important;
      background: transparent !important;
      border: 0 !important;
      color: #98a5b8 !important;
      font-size: 13px !important;
    }

    body.ymo-single-post-page main.content,
    body.ymo-single-post-page .content {
      float: none !important;
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    body.ymo-single-post-page article.entry,
    body.ymo-single-post-page article.post,
    body.ymo-single-post-page article.hentry {
      max-width: 1100px !important;
      margin: 0 auto !important;
      padding: 0 !important;
      border-radius: 24px !important;
      border: 1px solid rgba(255,255,255,.08) !important;
      background: linear-gradient(180deg, rgba(16,23,36,.96), rgba(9,14,24,.98)) !important;
      box-shadow: 0 20px 44px rgba(0,0,0,.34) !important;
      overflow: hidden !important;
    }

    body.ymo-single-post-page article.entry > .ymo-chip-row-wrap,
    body.ymo-single-post-page article.post > .ymo-chip-row-wrap {
      padding: 18px 18px 0 !important;
      margin: 0 !important;
    }

    body.ymo-single-post-page article.entry > .ymo-chip-row-wrap .ymo-tag-row,
    body.ymo-single-post-page article.post > .ymo-chip-row-wrap .ymo-tag-row {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
      min-height: 28px !important;
    }

    body.ymo-single-post-page article.entry > .ymo-chip-row-wrap .ymo-chip,
    body.ymo-single-post-page article.post > .ymo-chip-row-wrap .ymo-chip {
      display: inline-flex !important;
      align-items: center !important;
      min-height: 28px !important;
      padding: 0 12px !important;
      border-radius: 999px !important;
      border: 1px solid rgba(255,255,255,.08) !important;
      background: rgba(255,255,255,.05) !important;
      color: #dbe4f2 !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      line-height: 1 !important;
      white-space: nowrap !important;
    }

    body.ymo-single-post-page article.entry > .ymo-chip-row-wrap .ymo-chip--lang,
    body.ymo-single-post-page article.post > .ymo-chip-row-wrap .ymo-chip--lang {
      background: rgba(37,194,160,.14) !important;
    }

    body.ymo-single-post-page article.entry > .ymo-chip-row-wrap .ymo-chip--category,
    body.ymo-single-post-page article.post > .ymo-chip-row-wrap .ymo-chip--category {
      background: rgba(124,92,255,.14) !important;
    }

    body.ymo-single-post-page .entry-header {
      display: grid !important;
      gap: 16px !important;
      padding: 18px 18px 0 !important;
    }

    body.ymo-single-post-page .entry-title {
      min-height: 0 !important;
      margin: 0 !important;
      color: #fff !important;
      font-size: clamp(28px, 4vw, 40px) !important;
      line-height: 1.12 !important;
      font-weight: 800 !important;
      text-align: left !important;
      text-wrap: balance !important;
    }

    body.ymo-single-post-page .entry-header .entry-meta,
    body.ymo-single-post-page .entry-meta {
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

    body.ymo-single-post-page .entry-meta a {
      color: #cfe2ff !important;
    }

    body.ymo-single-post-page .entry-comments-link::before {
      content: "" !important;
      margin: 0 !important;
    }

    body.ymo-single-post-page .ymo-post-toolbar {
      display: flex !important;
      flex-wrap: wrap !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 10px !important;
      padding-bottom: 6px !important;
    }

    body.ymo-single-post-page .ymo-post-toolbar-left,
    body.ymo-single-post-page .ymo-post-toolbar-right {
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: center !important;
      gap: 10px !important;
    }

    body.ymo-single-post-page .ymo-btn {
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
      border: 1px solid rgba(255,255,255,.12) !important;
      border-radius: 999px !important;
      background: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06)) !important;
      color: #fff !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      line-height: 1 !important;
      cursor: pointer !important;
      box-shadow: 0 10px 22px rgba(0,0,0,0.18) !important;
      text-decoration: none !important;
    }

    body.ymo-single-post-page .ymo-btn:hover {
      transform: translateY(-1px) !important;
      text-decoration: none !important;
    }

    body.ymo-single-post-page .ymo-btn--primary {
      background: linear-gradient(135deg, #7c5cff, #6d7cff) !important;
      border-color: rgba(124,92,255,.45) !important;
      box-shadow: 0 12px 26px rgba(124,92,255,.28) !important;
    }

    body.ymo-single-post-page .ymo-btn--comments::after {
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

    body.ymo-single-post-page .entry-content {
      display: grid !important;
      gap: 14px !important;
      padding: 18px !important;
    }

    body.ymo-single-post-page .entry-content > p {
      margin: 0 !important;
      color: #dbe4f2 !important;
      font-size: 15px !important;
      line-height: 1.65 !important;
      padding: 0 !important;
    }

    body.ymo-single-post-page .ymo-post-image-card {
      overflow: hidden !important;
      border-radius: 18px !important;
      border: 1px solid rgba(255,255,255,.08) !important;
      background: rgba(255,255,255,.03) !important;
      box-shadow: 0 12px 26px rgba(0,0,0,.18) !important;
    }

    body.ymo-single-post-page .entry-content img.img-Yaoi Manga Online,
    body.ymo-single-post-page .entry-content .ymo-post-image-card > img {
      display: block !important;
      width: 100% !important;
      height: auto !important;
      margin: 0 auto !important;
      background: #101826 !important;
      max-width: 100% !important;
    }

    body.ymo-single-post-page .entry-pagination,
    body.ymo-single-post-page .pagination {
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

    body.ymo-single-post-page .entry-pagination a,
    body.ymo-single-post-page .entry-pagination span,
    body.ymo-single-post-page .pagination a,
    body.ymo-single-post-page .pagination span {
      min-width: 42px !important;
      height: 42px !important;
      padding: 0 14px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 12px !important;
      background: rgba(255,255,255,.035) !important;
      border: 1px solid rgba(255,255,255,.08) !important;
      color: #e9eef6 !important;
      text-decoration: none !important;
      font-weight: 700 !important;
    }

    body.ymo-single-post-page .entry-pagination .current,
    body.ymo-single-post-page .pagination .current {
      background: linear-gradient(180deg, rgba(124,92,255,.34), rgba(37,194,160,.24)) !important;
      border-color: rgba(124,92,255,.55) !important;
    }

    body.ymo-single-post-page .bookmark,
    body.ymo-single-post-page #bottom {
      display: block !important;
      width: 100% !important;
      height: 1px !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    body.ymo-single-post-page .entry-footer {
      display: grid !important;
      gap: 16px !important;
      padding: 18px !important;
      border-top: 1px solid rgba(255,255,255,.08) !important;
      background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01)) !important;
    }

    body.ymo-single-post-page .entry-footer .entry-meta {
      display: grid !important;
      gap: 12px !important;
      color: #98a5b8 !important;
      font-size: 14px !important;
      border: 0 !important;
      padding: 0 !important;
    }

    body.ymo-single-post-page .entry-categories,
    body.ymo-single-post-page .entry-terms,
    body.ymo-single-post-page .entry-tags {
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: center !important;
      gap: 8px !important;
      margin: 0 !important;
      line-height: 1.7 !important;
    }

    body.ymo-single-post-page .meta-label {
      color: #fff !important;
      font-weight: 700 !important;
      font-size: 12px !important;
      letter-spacing: .02em !important;
      min-width: 0 !important;
      padding-right: 0 !important;
      margin-right: 4px !important;
    }

    body.ymo-single-post-page .entry-categories a,
    body.ymo-single-post-page .entry-terms a,
    body.ymo-single-post-page .entry-tags a {
      display: inline-flex !important;
      align-items: center !important;
      min-height: 30px !important;
      padding: 0 10px !important;
      border-radius: 999px !important;
      border: 1px solid rgba(255,255,255,.08) !important;
      background: rgba(255,255,255,.03) !important;
      color: #dbe4f2 !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      margin: 0 !important;
    }

    body.ymo-single-post-page .yarpp-thumbnails-horizontal {
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      gap: 16px !important;
      margin: 0 !important;
      padding: 0 !important;
      justify-content: stretch !important;
    }

    body.ymo-single-post-page .yarpp-thumbnails-horizontal .yarpp-thumbnail {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      width: auto !important;
      min-width: 0 !important;
      border-radius: 18px !important;
      border: 1px solid rgba(255,255,255,.08) !important;
      background: linear-gradient(180deg, rgba(18,26,40,.92), rgba(10,16,28,.96)) !important;
      box-shadow: 0 18px 36px rgba(0,0,0,.26) !important;
      overflow: hidden !important;
    }

    body.ymo-single-post-page .yarpp-thumbnails-horizontal .yarpp-thumbnail img {
      display: block !important;
      width: 100% !important;
      aspect-ratio: 5 / 7 !important;
      object-fit: cover !important;
      background: rgba(255,255,255,.03) !important;
    }

    body.ymo-single-post-page .yarpp-thumbnail-title {
      margin: 0 !important;
      padding: 12px !important;
      color: #eef3fb !important;
      font-size: 14px !important;
      line-height: 1.4 !important;
      font-weight: 700 !important;
      text-align: left !important;
      max-width: none !important;
    }

    body.ymo-single-post-page #comments,
    body.ymo-single-post-page #respond {
      max-width: 1100px !important;
      margin: 20px auto 0 !important;
      border-radius: 24px !important;
      border: 1px solid rgba(255,255,255,.08) !important;
      background: linear-gradient(180deg, rgba(16,23,36,.96), rgba(9,14,24,.98)) !important;
      box-shadow: 0 20px 44px rgba(0,0,0,.34) !important;
      overflow: hidden !important;
      color: #e9eef6 !important;
    }

    body.ymo-single-post-page #wpdcom {
      max-width: none !important;
      margin: 0 !important;
      padding: 18px !important;
    }

    body.ymo-single-post-page .comments-area > h3,
    body.ymo-single-post-page #reply-title,
    body.ymo-single-post-page .wpd-thread-head {
      color: #fff !important;
    }

    body.ymo-single-post-page .before-footer-widget,
    body.ymo-single-post-page .before-footer,
    body.ymo-single-post-page .ymo-native-ad,
    body.ymo-single-post-page .ymo-ad-slot,
    body.ymo-single-post-page .after_4th_post,
    body.ymo-single-post-page .top_page,
    body.ymo-single-post-page .widget_custom_html,
    body.ymo-single-post-page ins[data-zoneid],
    body.ymo-single-post-page iframe[src*='doubleclick'],
    body.ymo-single-post-page iframe[src*='ads'],
    body.ymo-single-post-page iframe[src*='traffic'],
    body.ymo-single-post-page iframe[src*='pop'],
    body.ymo-single-post-page [class*='ad-'],
    body.ymo-single-post-page [class*='ads-'],
    body.ymo-single-post-page [id*='ad-'],
    body.ymo-single-post-page [id*='ads-'] {
      display: none !important;
    }

    body.ymo-single-post-page .site-footer {
      margin-top: 28px !important;
      background: #0b121d !important;
      border-top: 1px solid rgba(255,255,255,.06) !important;
      box-shadow: none !important;
      padding: 0 !important;
    }

    body.ymo-single-post-page .site-footer .wrap {
      padding-top: 26px !important;
      padding-bottom: 36px !important;
      color: #98a5b8 !important;
      text-align: center !important;
      font-size: 13px !important;
      line-height: 1.6 !important;
    }

    @media (max-width: 1100px) {
      body.ymo-single-post-page .yarpp-thumbnails-horizontal {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    @media (max-width: 720px) {
      body.ymo-single-post-page .nav-primary .wrap,
      body.ymo-single-post-page .site-header .wrap,
      body.ymo-single-post-page .site-inner .content-sidebar-wrap,
      body.ymo-single-post-page .site-footer .wrap {
        padding-left: 12px !important;
        padding-right: 12px !important;
      }

      body.ymo-single-post-page .entry-header,
      body.ymo-single-post-page .entry-content,
      body.ymo-single-post-page .entry-footer,
      body.ymo-single-post-page article.entry > .ymo-chip-row-wrap,
      body.ymo-single-post-page article.post > .ymo-chip-row-wrap,
      body.ymo-single-post-page .entry-pagination,
      body.ymo-single-post-page .pagination,
      body.ymo-single-post-page #wpdcom {
        padding-left: 12px !important;
        padding-right: 12px !important;
      }

      body.ymo-single-post-page .yarpp-thumbnails-horizontal {
        grid-template-columns: 1fr !important;
      }

      body.ymo-single-post-page .entry-title {
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

  document.body.classList.add("ymo-single-post-page");

  injectSinglePostStyles();
  removeBeforeFooterWidget();
  hideAds();
  removeSinglePostInterstitialNodes(article);
  wrapSinglePostContentImages(content);
  injectCardChips(article, extractCardMeta(article));

  let toolbar = header.querySelector(":scope > .ymo-post-toolbar");
  if (!(toolbar instanceof HTMLElement)) {
    toolbar = document.createElement("div");
    toolbar.className = "ymo-post-toolbar";

    const left = document.createElement("div");
    left.className = "ymo-post-toolbar-left";

    const right = document.createElement("div");
    right.className = "ymo-post-toolbar-right";

    toolbar.append(left, right);
    header.appendChild(toolbar);
  }

  let left = toolbar.querySelector(".ymo-post-toolbar-left");
  if (!(left instanceof HTMLElement)) {
    left = document.createElement("div");
    left.className = "ymo-post-toolbar-left";
    toolbar.prepend(left);
  }

  let readerButton = toolbar.querySelector("#ymo-open-reader-page");
  if (!(readerButton instanceof HTMLButtonElement)) {
    readerButton = document.createElement("button");
    readerButton.type = "button";
    readerButton.id = "ymo-open-reader-page";
    readerButton.className = "ymo-btn ymo-btn--primary ymo-reader-trigger";
    readerButton.textContent = "Reader Mode";
    readerButton.addEventListener("click", () => {
      primeReaderPayloadForCurrentPage(location.href);
      location.href = buildReaderPopupUrl(location.href);
    });
    left.appendChild(readerButton);
  }

  const commentCount = getSinglePostCommentCount();
  const commentsRoot =
    document.getElementById("comments") ||
    document.querySelector(".comments-area, #commentform, .comment-respond, #respond");

  let commentsButton = toolbar.querySelector("#ymo-jump-comments");
  if (!(commentsButton instanceof HTMLAnchorElement)) {
    commentsButton = document.createElement("a");
    commentsButton.id = "ymo-jump-comments";
    commentsButton.className = "ymo-btn ymo-btn--comments";
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

  if (!document.body.dataset.ymoSinglePostObserved) {
    const observer = new MutationObserver(() => {
      removeBeforeFooterWidget();
      hideAds();
      removeSinglePostInterstitialNodes(article);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.body.dataset.ymoSinglePostObserved = "1";
  }
}

function injectReaderPageStyles() {
  if (document.getElementById("ymo-reader-page-style")) return;

  const style = document.createElement("style");
  style.id = "ymo-reader-page-style";
  style.textContent = `
    :root {
      --ymo-reader-bg: #070d17;
      --ymo-reader-bg-2: rgba(9, 14, 24, 0.92);
      --ymo-reader-surface: rgba(17, 24, 39, 0.88);
      --ymo-reader-line: rgba(255,255,255,0.10);
      --ymo-reader-line-strong: rgba(255,255,255,0.18);
      --ymo-reader-text: #eef3fb;
      --ymo-reader-muted: #95a4bc;
      --ymo-reader-width: min(1120px, calc(100vw - 28px));
      --ymo-reader-page-height: calc(100vh - 154px);
      --ymo-reader-dock-height: 78px;
      --ymo-reader-thumbs-height: 176px;
    }

    html.ymo-reader-page,
    body.ymo-reader-page {
      margin: 0 !important;
      padding: 0 !important;
      min-height: 100% !important;
      background:
        radial-gradient(circle at top, rgba(124,92,255,.12), transparent 28%),
        radial-gradient(circle at 82% 12%, rgba(37,194,160,.08), transparent 20%),
        var(--ymo-reader-bg) !important;
      color: var(--ymo-reader-text) !important;
      overflow-y: auto !important;
    }

    body.ymo-reader-page {
      font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important;
    }

    #ymo-reader-page {
      min-height: 100vh;
    }

    #ymo-reader-page.is-wide {
      --ymo-reader-width: min(1480px, calc(100vw - 18px));
    }

    .ymo-reader-page__topbar {
      position: sticky;
      top: 0;
      z-index: 30;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      backdrop-filter: blur(14px);
      background: rgba(7, 13, 23, 0.78);
      border-bottom: 1px solid var(--ymo-reader-line);
      transition: transform .18s ease, opacity .18s ease;
    }

    #ymo-reader-page.is-topbar-hidden .ymo-reader-page__topbar {
      transform: translateY(calc(-100% - 12px));
      opacity: 0;
      pointer-events: none;
    }

    .ymo-reader-page__title {
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .ymo-reader-page__title-text {
      font-size: 14px;
      font-weight: 800;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ymo-reader-page__progress {
      color: var(--ymo-reader-muted);
      font-size: 12px;
      font-weight: 600;
    }

    .ymo-reader-page__toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .ymo-reader-page__button {
      appearance: none;
      min-width: 40px;
      height: 40px;
      padding: 0 14px;
      border: 1px solid var(--ymo-reader-line);
      border-radius: 999px;
      background: rgba(11, 18, 29, 0.88);
      color: var(--ymo-reader-text);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }

    .ymo-reader-page__button[disabled] {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    .ymo-reader-page__button--comments::after {
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

    .ymo-reader-page__main {
      width: 100%;
      box-sizing: border-box;
      padding: 18px 14px calc(var(--ymo-reader-dock-height) + 42px);
    }

    #ymo-reader-page:not(.is-thumbs-collapsed) .ymo-reader-page__main {
      padding-bottom: calc(var(--ymo-reader-dock-height) + var(--ymo-reader-thumbs-height) + 64px);
    }

    .ymo-reader-page__stack {
      width: var(--ymo-reader-width);
      max-width: 100%;
      margin: 0 auto;
      display: grid;
      gap: 18px;
    }

    #ymo-reader-page[data-view="strip"] .ymo-reader-page__stack {
      gap: 0;
    }

    #ymo-reader-page[data-view="strip"] .ymo-reader-page__page {
      border-radius: 0;
      border-color: transparent;
      background: transparent;
      box-shadow: none;
    }

    #ymo-reader-page[data-view="strip"] .ymo-reader-page__caption {
      display: none;
    }

    #ymo-reader-page[data-view="paged"] .ymo-reader-page__main {
      height: calc(100vh - 69px);
      overflow-y: auto;
      scroll-snap-type: y proximity;
    }

    #ymo-reader-page[data-view="paged"]:not(.is-thumbs-collapsed) .ymo-reader-page__main {
      height: calc(100vh - 69px - var(--ymo-reader-thumbs-height) - var(--ymo-reader-dock-height) - 30px);
    }

    #ymo-reader-page[data-view="paged"] .ymo-reader-page__page {
      min-height: min(calc(100vh - 140px), 1200px);
      scroll-snap-align: start;
    }

    #ymo-reader-page[data-fit="height"] .ymo-reader-page__page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 10px;
    }

    #ymo-reader-page[data-fit="height"] .ymo-reader-page__image {
      width: auto;
      max-width: 100%;
      height: auto;
      max-height: var(--ymo-reader-page-height);
      margin: 0 auto;
    }

    #ymo-reader-page[data-direction="rtl"] .ymo-reader-page__stack,
    #ymo-reader-page[data-direction="rtl"] .ymo-reader-page__caption {
      direction: rtl;
    }

    .ymo-reader-page__page {
      margin: 0;
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.06);
      background: rgba(10, 16, 28, 0.68);
      box-shadow: 0 20px 40px rgba(0,0,0,.22);
    }

    .ymo-reader-page__page.is-active {
      outline: 1px solid rgba(124,92,255,.34);
      outline-offset: 1px;
    }

    .ymo-reader-page__image {
      display: block;
      width: 100%;
      height: auto;
      margin: 0 auto;
      background: rgba(255,255,255,.02);
    }

    .ymo-reader-page__caption {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 12px 10px;
      color: var(--ymo-reader-muted);
      font-size: 12px;
      font-weight: 600;
    }

    .ymo-reader-page__hint,
    .ymo-reader-page__empty,
    .ymo-reader-page__loading {
      width: var(--ymo-reader-width);
      max-width: 100%;
      margin: 0 auto;
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 18px;
      background: rgba(11, 18, 29, 0.74);
      box-shadow: 0 18px 40px rgba(0,0,0,.22);
    }

    .ymo-reader-page__hint {
      margin-top: 18px;
      padding: 14px 16px;
      color: var(--ymo-reader-muted);
      font-size: 12px;
      font-weight: 600;
    }

    .ymo-reader-page__empty,
    .ymo-reader-page__loading {
      padding: 18px;
    }

    .ymo-reader-page__empty p,
    .ymo-reader-page__loading p {
      margin: 0 0 14px;
      color: var(--ymo-reader-text);
    }

    .ymo-reader-page__loading-bar {
      height: 12px;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(124,92,255,.18), rgba(37,194,160,.14), rgba(124,92,255,.18));
      background-size: 200% 100%;
      animation: ymo-reader-loading 1.15s linear infinite;
    }

    .ymo-reader-page__dock {
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
      border: 1px solid var(--ymo-reader-line);
      border-radius: 20px;
      background: rgba(9, 15, 24, 0.88);
      backdrop-filter: blur(14px);
      box-shadow: 0 20px 48px rgba(0,0,0,.34);
    }

    .ymo-reader-page__dock-main {
      min-width: 0;
      display: grid;
      gap: 8px;
    }

    .ymo-reader-page__dock-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: var(--ymo-reader-muted);
      font-size: 12px;
      font-weight: 700;
    }

    .ymo-reader-page__range-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .ymo-reader-page__range {
      width: 100%;
      accent-color: #7c5cff;
      cursor: pointer;
    }

    .ymo-reader-page__dock-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .ymo-reader-page__page-jump {
      min-width: 54px;
      justify-content: center;
    }

    .ymo-reader-page__thumbs {
      position: fixed;
      left: 14px;
      right: 14px;
      bottom: calc(var(--ymo-reader-dock-height) + 22px);
      z-index: 27;
      display: grid;
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--ymo-reader-line);
      border-radius: 20px;
      background: rgba(9, 15, 24, 0.84);
      backdrop-filter: blur(14px);
      box-shadow: 0 20px 48px rgba(0,0,0,.28);
      transition: transform .18s ease, opacity .18s ease;
    }

    #ymo-reader-page.is-thumbs-collapsed .ymo-reader-page__thumbs {
      opacity: 0;
      transform: translateY(12px);
      pointer-events: none;
    }

    .ymo-reader-page__thumbs-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: var(--ymo-reader-muted);
      font-size: 12px;
      font-weight: 700;
    }

    .ymo-reader-page__thumbs-strip {
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

    .ymo-reader-page__thumb {
      appearance: none;
      display: grid;
      gap: 6px;
      padding: 8px;
      border: 1px solid var(--ymo-reader-line);
      border-radius: 16px;
      background: rgba(255,255,255,.03);
      color: var(--ymo-reader-text);
      cursor: pointer;
      text-align: left;
    }

    .ymo-reader-page__thumb.is-active {
      border-color: rgba(124,92,255,.55);
      background: rgba(124,92,255,.12);
      box-shadow: inset 0 0 0 1px rgba(124,92,255,.22);
    }

    .ymo-reader-page__thumb-image-wrap {
      aspect-ratio: 5 / 7;
      border-radius: 12px;
      overflow: hidden;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.05);
    }

    .ymo-reader-page__thumb img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .ymo-reader-page__thumb-label {
      color: var(--ymo-reader-muted);
      font-size: 11px;
      font-weight: 700;
      text-align: center;
    }

    .ymo-reader-page__tapzones {
      position: fixed;
      inset: 68px 0 0;
      z-index: 22;
      display: flex;
      pointer-events: none;
    }

    .ymo-reader-page__tapzone {
      appearance: none;
      border: 0;
      padding: 0;
      margin: 0;
      background: transparent;
      pointer-events: auto;
      cursor: pointer;
      opacity: 0;
    }

    .ymo-reader-page__tapzone--start,
    .ymo-reader-page__tapzone--end {
      flex: 0 0 30%;
    }

    .ymo-reader-page__tapzone--center {
      flex: 1 1 auto;
    }

    @keyframes ymo-reader-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @media (pointer:fine) and (min-width: 921px) {
      .ymo-reader-page__tapzones {
        display: none;
      }
    }

    @media (max-width: 980px) {
      :root {
        --ymo-reader-dock-height: 112px;
        --ymo-reader-thumbs-height: 152px;
      }

      .ymo-reader-page__topbar {
        flex-wrap: wrap;
      }

      .ymo-reader-page__toolbar,
      .ymo-reader-page__dock {
        width: 100%;
        margin-left: 0;
        justify-content: flex-start;
      }

      .ymo-reader-page__dock {
        grid-template-columns: 1fr;
      }

      .ymo-reader-page__button {
        min-height: 38px;
        height: auto;
        padding: 0 12px;
        font-size: 12px;
      }

      .ymo-reader-page__thumbs-strip {
        grid-auto-columns: minmax(72px, 84px);
      }
    }

    @media (max-width: 720px) {
      .ymo-reader-page__main {
        padding-left: 8px;
        padding-right: 8px;
      }

      .ymo-reader-page__dock,
      .ymo-reader-page__thumbs {
        left: 8px;
        right: 8px;
      }

      .ymo-reader-page__thumbs-head {
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
  topbar.className = "ymo-reader-page__topbar";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "ymo-reader-page__button";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => {
    if (window.top === window.self) {
      location.href = normalizeReaderHref(location.href);
      return;
    }
    postReaderMessage("close");
  });

  const titleWrap = document.createElement("div");
  titleWrap.className = "ymo-reader-page__title";

  const titleText = document.createElement("div");
  titleText.className = "ymo-reader-page__title-text";
  titleText.textContent = title;

  const progress = document.createElement("div");
  progress.className = "ymo-reader-page__progress";
  progress.textContent = images.length ? `Page 1 / ${images.length}` : "No pages found";

  titleWrap.append(titleText, progress);

  const toolbar = document.createElement("div");
  toolbar.className = "ymo-reader-page__toolbar";

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.className = "ymo-reader-page__button";
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
  nextButton.className = "ymo-reader-page__button";
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
  widthButton.className = "ymo-reader-page__button";

  const fitButton = document.createElement("button");
  fitButton.type = "button";
  fitButton.className = "ymo-reader-page__button";

  const viewButton = document.createElement("button");
  viewButton.type = "button";
  viewButton.className = "ymo-reader-page__button";

  const directionButton = document.createElement("button");
  directionButton.type = "button";
  directionButton.className = "ymo-reader-page__button";

  const thumbsButton = document.createElement("button");
  thumbsButton.type = "button";
  thumbsButton.className = "ymo-reader-page__button";

  const fullscreenButton = document.createElement("button");
  fullscreenButton.type = "button";
  fullscreenButton.className = "ymo-reader-page__button";
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
  commentsButton.className = "ymo-reader-page__button ymo-reader-page__button--comments";
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
  originalLink.className = "ymo-reader-page__button";
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
  main.className = "ymo-reader-page__main";

  const pageNodes = [];
  const thumbNodes = [];

  const tapZones = document.createElement("div");
  tapZones.className = "ymo-reader-page__tapzones";

  const tapPrev = document.createElement("button");
  tapPrev.type = "button";
  tapPrev.className = "ymo-reader-page__tapzone ymo-reader-page__tapzone--start";
  tapPrev.setAttribute("aria-label", "Previous page");
  tapPrev.addEventListener("click", () => navigateReaderPages(pageNodes, prefs, -1 * getReaderImageStep(prefs)));

  const tapToggle = document.createElement("button");
  tapToggle.type = "button";
  tapToggle.className = "ymo-reader-page__tapzone ymo-reader-page__tapzone--center";
  tapToggle.setAttribute("aria-label", "Toggle top bar");
  tapToggle.addEventListener("click", () => toggleReaderTopbar(root));

  const tapNext = document.createElement("button");
  tapNext.type = "button";
  tapNext.className = "ymo-reader-page__tapzone ymo-reader-page__tapzone--end";
  tapNext.setAttribute("aria-label", "Next page");
  tapNext.addEventListener("click", () => navigateReaderPages(pageNodes, prefs, 1 * getReaderImageStep(prefs)));

  tapZones.append(tapPrev, tapToggle, tapNext);

  if (!images.length) {
    const empty = document.createElement("section");
    empty.className = "ymo-reader-page__empty";

    const copy = document.createElement("p");
    copy.textContent = "Reader mode could not find post images in the main content area on this page.";

    const fallback = document.createElement("a");
    fallback.className = "ymo-reader-page__button";
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
  stack.className = "ymo-reader-page__stack";

  images.forEach((image, index) => {
    const figure = document.createElement("figure");
    figure.className = "ymo-reader-page__page";
    figure.dataset.index = String(index);

    const img = document.createElement("img");
    img.className = "ymo-reader-page__image";
    img.src = image.src;
    img.alt = image.alt || `${title} — page ${index + 1}`;
    img.loading = index < 3 ? "eager" : "lazy";
    img.decoding = "async";
    img.referrerPolicy = "same-origin";
    if (image.width > 0) img.width = image.width;
    if (image.height > 0) img.height = image.height;

    const caption = document.createElement("figcaption");
    caption.className = "ymo-reader-page__caption";

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
  hint.className = "ymo-reader-page__hint";
  hint.textContent = "Tap zones • Esc close • F fullscreen • W width • M fit • C view • R direction • T thumbnails • Alt+←/→ posts";

  const thumbsPanel = document.createElement("aside");
  thumbsPanel.className = "ymo-reader-page__thumbs";

  const thumbsHead = document.createElement("div");
  thumbsHead.className = "ymo-reader-page__thumbs-head";

  const thumbsTitle = document.createElement("div");
  thumbsTitle.textContent = "Thumbnail strip";

  const thumbsSummary = document.createElement("div");
  thumbsSummary.textContent = `${images.length} pages`;

  thumbsHead.append(thumbsTitle, thumbsSummary);

  const thumbsStrip = document.createElement("div");
  thumbsStrip.className = "ymo-reader-page__thumbs-strip";

  const footerDock = document.createElement("footer");
  footerDock.className = "ymo-reader-page__dock";

  const dockMain = document.createElement("div");
  dockMain.className = "ymo-reader-page__dock-main";

  const dockMeta = document.createElement("div");
  dockMeta.className = "ymo-reader-page__dock-meta";

  const dockLabel = document.createElement("span");
  dockLabel.textContent = "Page scrubber";

  const dockValue = document.createElement("span");
  dockValue.textContent = `1 / ${images.length}`;

  dockMeta.append(dockLabel, dockValue);

  const rangeWrap = document.createElement("div");
  rangeWrap.className = "ymo-reader-page__range-wrap";

  const pageRange = document.createElement("input");
  pageRange.className = "ymo-reader-page__range";
  pageRange.type = "range";
  pageRange.min = "1";
  pageRange.max = String(images.length);
  pageRange.step = "1";
  pageRange.value = "1";
  pageRange.setAttribute("aria-label", "Jump to page");

  rangeWrap.appendChild(pageRange);

  const dockActions = document.createElement("div");
  dockActions.className = "ymo-reader-page__dock-actions";

  const firstPageButton = document.createElement("button");
  firstPageButton.type = "button";
  firstPageButton.className = "ymo-reader-page__button ymo-reader-page__page-jump";
  firstPageButton.textContent = "First";

  const prevPageButton = document.createElement("button");
  prevPageButton.type = "button";
  prevPageButton.className = "ymo-reader-page__button ymo-reader-page__page-jump";
  prevPageButton.textContent = "Page −";

  const dockThumbsButton = document.createElement("button");
  dockThumbsButton.type = "button";
  dockThumbsButton.className = "ymo-reader-page__button";
  controls.thumbnailButtons.push(dockThumbsButton);

  const nextPageButton = document.createElement("button");
  nextPageButton.type = "button";
  nextPageButton.className = "ymo-reader-page__button ymo-reader-page__page-jump";
  nextPageButton.textContent = "Page +";

  const lastPageButton = document.createElement("button");
  lastPageButton.type = "button";
  lastPageButton.className = "ymo-reader-page__button ymo-reader-page__page-jump";
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
    thumb.className = "ymo-reader-page__thumb";
    thumb.setAttribute("aria-label", `Jump to page ${index + 1}`);

    const thumbImageWrap = document.createElement("div");
    thumbImageWrap.className = "ymo-reader-page__thumb-image-wrap";

    const thumbImage = document.createElement("img");
    thumbImage.src = image.src;
    thumbImage.alt = image.alt || `${title} thumbnail ${index + 1}`;
    thumbImage.loading = Math.abs(index) < 10 ? "eager" : "lazy";
    thumbImage.decoding = "async";
    thumbImage.referrerPolicy = "same-origin";

    const thumbLabel = document.createElement("span");
    thumbLabel.className = "ymo-reader-page__thumb-label";
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

  const syncReaderProgress = (behavior = "smooth") => {
    const currentIndex = getNearestReaderPageIndex(pageNodes);
    updateReaderPageProgress(progress, pageNodes, currentIndex, title);
    dockValue.textContent = `${currentIndex + 1} / ${images.length}`;
    pageRange.value = String(currentIndex + 1);
    setActiveThumb(currentIndex, behavior);

    for (let index = 0; index < pageNodes.length; index += 1) {
      pageNodes[index].classList.toggle("is-active", index === currentIndex);
    }
  };

  syncReaderProgress("auto");

  const onReaderScroll = () => syncReaderProgress();
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
  document.documentElement.classList.add("ymo-reader-page");
  document.body.classList.add("ymo-reader-page");

  const loadingOverlay = document.createElement("div");
  loadingOverlay.className = "ymo-reader-page__loading";
  loadingOverlay.style.cssText = "position:fixed;inset:84px 14px auto;z-index:999999;";
  const loadingText = document.createElement("p");
  loadingText.textContent = "Building reader… collecting image URLs before the page finishes lazy-loading.";
  const loadingBar = document.createElement("div");
  loadingBar.className = "ymo-reader-page__loading-bar";
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
    root.id = "ymo-reader-page";

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
    ".content > .content-inner",
    ".content .content-inner",
    ".herald-posts",
    ".herald-main-content .herald-posts",
    ".col-mod-main .herald-posts",
    ".site-content .herald-posts"
  ],
  card: [
    ":scope > article.herald-lay-i",
    ":scope > article.post-standard",
    ":scope > article.entry",
    ":scope > article.post",
    ":scope > article.hentry",
    ":scope > article",
  ],
  titleLink: [
    ".entry-title a[href]",
    "h1 a[href], h2 a[href], h3 a[href], h4 a[href]",
    ".herald-post-thumbnail a[href]",
    ".cover[href]",
    "a[href]",
  ],
  nativeSearchSidebar: ".ep-search-sidebar",
};

  function getSiteName() {
    return "ymo";
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
    if (document.getElementById("ymo-ui-restore-style")) return;

    const style = document.createElement("style");
    style.id = "ymo-ui-restore-style";
    style.textContent = `
      #ymo-ui-restore-toggle {
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

      #ymo-ui-restore-toggle:hover {
        transform: translateY(-1px);
      }
    `;
    document.head.appendChild(style);
  }

  function hideUiRestoreToggle() {
    document.getElementById("ymo-ui-restore-toggle")?.remove();
  }

  function showUiRestoreToggle() {
    injectUiRestoreToggleStyles();

    let button = document.getElementById("ymo-ui-restore-toggle");
    if (!(button instanceof HTMLButtonElement)) {
      button = document.createElement("button");
      button.type = "button";
      button.id = "ymo-ui-restore-toggle";
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
      case "category": {
        const compact = value.replace(/[_-]+/g, " ").trim();
        const compactMap = {
          "bara manga": "Bara",
          "yaoi manga": "Manga",
          "yaoi doujinshi": "Doujinshi",
          "doujinshi": "Doujinshi",
          "oneshot": "Oneshot",
          "yaoi oneshots": "Oneshot",
        };
        return { raw: value, text: compactMap[compact] || CATEGORY_MAP[value] || titleCase(compact) };
      }
      case "pairing":
        return { raw: value, text: titleCase(value).replace(/\bX\b/g, "×") };
      default:
        return { raw: value, text: titleCase(value) };
    }
  }

  function resolveLanguageAlias(raw) {
    const value = slugify(String(raw || "").toLowerCase()).replace(/-?yaoi$/g, "");
    const languageAliases = {
      eng: "english",
      english: "english",
      en: "english",
      jp: "japanese",
      jpn: "japanese",
      japanese: "japanese",
      japan: "japanese",
      cn: "chinese",
      chi: "chinese",
      chinese: "chinese",
      kr: "korean",
      kor: "korean",
      korean: "korean",
      es: "spanish",
      spa: "spanish",
      spanish: "spanish",
      pt: "portuguese",
      br: "portuguese",
      portuguese: "portuguese",
      fr: "french",
      french: "french",
      de: "german",
      german: "german",
      ru: "russian",
      russian: "russian",
      it: "italian",
      italian: "italian",
      thai: "thai",
      vn: "vietnamese",
      vietnamese: "vietnamese",
    };
    return languageAliases[value] || "";
  }

  function extractYmoContentMeta(article, pushMeta) {
    const content = article.querySelector(".entry-content, .herald-entry-content, .post-content");
    if (!(content instanceof HTMLElement)) return;

    const strings = content.textContent
      .split(/\n+/)
      .map((value) => value.trim())
      .filter(Boolean);

    for (let index = 0; index < strings.length; index += 1) {
      const line = strings[index];
      const languageMatch = line.match(/^Language:\s*(.+)$/i);
      if (languageMatch) {
        const resolved = resolveLanguageAlias(languageMatch[1]);
        if (resolved) pushMeta("lang", resolved);
        else pushMeta("lang", languageMatch[1]);
        continue;
      }

      if (/^Author:\s*$/i.test(line) && strings[index + 1]) {
        pushMeta("artist", strings[index + 1]);
        continue;
      }

      const authorInlineMatch = line.match(/^Author:\s*(.+)$/i);
      if (authorInlineMatch) {
        pushMeta("artist", authorInlineMatch[1]);
        continue;
      }

      const categoryLabelMatch = line.match(/^([A-Za-z][A-Za-z\s&+\-]{1,40}):\s*.+$/);
      if (categoryLabelMatch) {
        const label = categoryLabelMatch[1].trim();
        if (!/^(author|language|tags?)$/i.test(label)) {
          pushMeta("category", label);
        }
      }
    }

    for (const link of content.querySelectorAll(".meta-tags a[rel~='tag'][href], .meta-tags a[href]")) {
      const label = link.textContent?.trim();
      if (!label) continue;
      const resolved = resolveLanguageAlias(label);
      if (resolved) pushMeta("lang", resolved);
      pushMeta("tag", label);
    }

    for (const link of content.querySelectorAll(".meta-category a[href], a[href*='/mangaka/']")) {
      const label = link.textContent?.trim();
      if (!label) continue;
      try {
        const pathname = new URL(link.href, location.href).pathname.toLowerCase();
        if (/\/mangaka\//.test(pathname) || /\/author\//.test(pathname)) {
          pushMeta("artist", label);
        } else if (/\/category\//.test(pathname)) {
          pushMeta("category", label);
        }
      } catch {}
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
    document.querySelectorAll(".ymo-results-grid").forEach((node) => {
      if (node !== state.cardContainer) node.classList.remove("ymo-results-grid");
    });

    if (state.cardContainer instanceof HTMLElement) {
      state.cardContainer.classList.add("ymo-results-grid");
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
    const titleNode = overlay?.querySelector(".ymo-reader-title");
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

    for (const cls of Array.from(article.classList)) {
      if (shouldSkipClass(cls)) continue;

      const mangakaMatch = cls.match(/^mangaka-(.+)$/);
      if (mangakaMatch) {
        pushMeta("artist", mangakaMatch[1]);
        continue;
      }

      const pairingMatch = cls.match(/^pairing-(.+)$/);
      if (pairingMatch) {
        pushMeta("pairing", pairingMatch[1]);
        continue;
      }

      const tagMatch = cls.match(/^tag-(.+)$/);
      if (tagMatch) {
        const rawTag = tagMatch[1];
        const resolvedLanguage = resolveLanguageAlias(rawTag);
        if (resolvedLanguage) pushMeta("lang", resolvedLanguage);
        pushMeta("tag", rawTag);
        continue;
      }

      let matched = false;
      for (const family of META_FAMILIES) {
        if (!cls.startsWith(family.prefix)) continue;
        const value = cls.slice(family.prefix.length);
        if (!value) continue;
        const resolvedLanguage = family.key === "lang" ? resolveLanguageAlias(value) : "";
        pushMeta(family.key, resolvedLanguage || value);
        matched = true;
        break;
      }
      if (matched) continue;

      const wpCategoryMatch = cls.match(/^category-(.+)$/);
      if (wpCategoryMatch) {
        const rawCategory = wpCategoryMatch[1].replace(/-+/g, " ").trim();
        const resolvedLanguage = resolveLanguageAlias(rawCategory);
        if (resolvedLanguage) pushMeta("lang", resolvedLanguage);
        else pushMeta("category", rawCategory);
      }
    }

    const taxonomyLinks = Array.from(
      article.querySelectorAll(".post-category a[href], .entry-categories a[href], .cat-links a[href], .meta-category a[href], .meta-tags a[href], a[rel~='category'][href], a[rel~='tag'][href], a[href*='/mangaka/']")
    );

    for (const link of taxonomyLinks) {
      const text = link.textContent?.trim();
      if (!text) continue;
      let familyKey = "category";
      try {
        const href = new URL(link.href, location.href).pathname.toLowerCase();
        if (/\/mangaka\//.test(href) || /\/author\//.test(href)) familyKey = "artist";
        else if (/\/(genre|tag|artist|pairing|group)\//.test(href) || /rel=['"]?tag/i.test(link.getAttribute("rel") || "")) {
          const match = href.match(/\/(genre|tag|artist|pairing|group)\//);
          familyKey = match?.[1] || "tag";
        } else if (/\/category\//.test(href)) {
          familyKey = "category";
        }
      } catch {}

      const resolvedLanguage = familyKey !== "artist" ? resolveLanguageAlias(text) : "";
      if (resolvedLanguage) pushMeta("lang", resolvedLanguage);
      pushMeta(familyKey, text);
    }

    extractYmoContentMeta(article, pushMeta);

    const title = getCardTitle(article);
    const titleLangTokens = Array.from(title.matchAll(/\[([^\]]+)\]/g)).map((match) => String(match[1] || "").trim().toLowerCase());
    for (const token of titleLangTokens) {
      const resolved = resolveLanguageAlias(token.replace(/[^a-z]/g, ""));
      if (resolved) pushMeta("lang", resolved);
    }

    const langPrefixMatch = title.match(/^\s*\[([^\]]+)\]/);
    if (langPrefixMatch) {
      for (const token of langPrefixMatch[1]
        .split(/[,+/&]/)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)) {
        const resolved = resolveLanguageAlias(token);
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

    return meta;
  }

  function buildChipModel(meta) {
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

    return chips;
  }

  function injectReaderModalStyles() {
    if (document.getElementById(READER_MODAL_IDS.style)) return;

    const style = document.createElement("style");
    style.id = READER_MODAL_IDS.style;
    style.textContent = `
      .ymo-reader-trigger {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 36px;
        padding: 0 14px;
        border: 1px solid rgba(255,255,255,0.12);
        padding: 0 14px;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        line-height: 1;
        text-decoration: none;
        cursor: pointer;
        box-shadow: 0 10px 22px rgba(0,0,0,0.18);
      }

      .ymo-reader-trigger:hover {
        transform: translateY(-1px);
        box-shadow: 0 14px 26px rgba(0,0,0,0.22);
      }

      .ymo-reader-actions {
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
        backdrop-filter: blur(8px);
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
        background: #0b0f18;
        box-shadow: 0 24px 80px rgba(0,0,0,0.45);
      }

      #${READER_MODAL_IDS.dialog}.is-fullscreen {
        width: calc(100vw - 10px);
        height: calc(100vh - 10px);
        border-radius: 14px;
      }

      .ymo-reader-toolbar {
        position: absolute;
        top: 12px;
        left: 12px;
        right: 12px;
        z-index: 4;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .ymo-reader-title {
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

      .ymo-reader-toolbar-actions {
        display: flex;
        gap: 8px;
        margin-left: auto;
      }

      .ymo-reader-prev,
      .ymo-reader-next,

      #${READER_MODAL_IDS.frame} {
        width: 100%;
        height: 100%;
        border: 0;
        background: #0b0f18;
      }

      .ymo-reader-close,
      .ymo-reader-fullscreen,
      .ymo-reader-open-tab,
      .ymo-reader-comments,
      .ymo-reader-back,
      .ymo-reader-prev,
      .ymo-reader-next {
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

      .ymo-reader-close {
        font-size: 22px;
      }

      .ymo-reader-comments::after {
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

      .ymo-reader-back[hidden] {
        display: none !important;
      }

      .ymo-reader-prev[disabled],
      .ymo-reader-next[disabled] {
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
        <div class="ymo-reader-toolbar">
          <div class="ymo-reader-title" aria-live="polite">Reader</div>
          <div class="ymo-reader-toolbar-actions">
            <button type="button" class="ymo-reader-prev" aria-label="Previous visible card">Prev</button>
            <button type="button" class="ymo-reader-next" aria-label="Next visible card">Next</button>
            <button type="button" class="ymo-reader-fullscreen" aria-label="Toggle fullscreen">Fullscreen</button>
            <button type="button" class="ymo-reader-comments" aria-label="Open comments">Comments</button>
            <button type="button" class="ymo-reader-back" aria-label="Back to reader" hidden>Back to Reader</button>
            <button type="button" class="ymo-reader-open-tab" aria-label="Open in new tab">Open tab</button>
            <button type="button" class="ymo-reader-close" aria-label="Close reader">×</button>
          </div>
        </div>
        <iframe id="${READER_MODAL_IDS.frame}" loading="eager" referrerpolicy="same-origin" allowfullscreen></iframe>
      </div>
    `;

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeReaderModal();
    });

    overlay.querySelector(".ymo-reader-close")?.addEventListener("click", closeReaderModal);
    overlay.querySelector(".ymo-reader-prev")?.addEventListener("click", () => navigateReaderRelative(-1));
    overlay.querySelector(".ymo-reader-next")?.addEventListener("click", () => navigateReaderRelative(1));
    overlay.querySelector(".ymo-reader-fullscreen")?.addEventListener("click", toggleReaderModalFullscreen);
    overlay.querySelector(".ymo-reader-comments")?.addEventListener("click", openReaderCommentsInModal);
    overlay.querySelector(".ymo-reader-back")?.addEventListener("click", openReaderPopupInModal);
    overlay.querySelector(".ymo-reader-open-tab")?.addEventListener("click", () => {
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
      if (data.source !== "ymo-reader-embed") return;
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
    const commentsButton = overlay?.querySelector(".ymo-reader-comments");
    const backButton = overlay?.querySelector(".ymo-reader-back");

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
    return state.cards.filter((card) => !card.article.classList.contains("ymo-hidden-card") && getCardHref(card.article));
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
    const prevButton = overlay?.querySelector(".ymo-reader-prev");
    const nextButton = overlay?.querySelector(".ymo-reader-next");
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
      article.querySelector(".entry-header, .ymo-card-head, .entry-title, header, .post-title, .post-header, .caption-container")
      || article.querySelector(".cover")
      || article.querySelector(".entry-content, .post-content, .content")
      || article
    );
  }

  function injectReaderTrigger(article) {
    const href = getCardHref(article);
    if (!href || article.matches("a.tagchip")) return;

    let actions = article.querySelector(":scope .ymo-reader-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "ymo-reader-actions";
      getReaderActionHost(article).appendChild(actions);
    }

    let trigger = actions.querySelector(".ymo-reader-trigger");
    if (!trigger) {
      trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "ymo-reader-trigger";
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






  const throttledRemoveBeforeFooterWidget = rafThrottle(() => {
    removeBeforeFooterWidget();
  });

  const footerObserver = new MutationObserver(() => {
    throttledRemoveBeforeFooterWidget();
  });


  function injectStyles() {
    if (document.getElementById("ymo-modern-style-v5222")) return;

    const style = document.createElement("style");
    style.id = "ymo-modern-style-v5222";
    style.textContent = `
      :root {
        --ymo-grid-desktop: ${state.grid.desktopCols};
        --ymo-grid-tablet: ${state.grid.tabletCols};
        --ymo-grid-mobile: ${state.grid.mobileCols};
        --ymo-grid-gap: ${state.grid.gap}px;
        --ymo-cover-ratio: ${state.grid.coverRatioW} / ${state.grid.coverRatioH};

        --ymo-bg: #07101a;
        --ymo-bg-2: #131926;
        --ymo-panel: rgba(13, 20, 33, 0.88);
        --ymo-panel-2: rgba(16, 24, 38, 0.94);
        --ymo-soft: rgba(255,255,255,.04);
        --ymo-soft-2: rgba(255,255,255,.03);
        --ymo-line: rgba(255,255,255,.08);
        --ymo-line-2: rgba(255,255,255,.14);
        --ymo-text: #e9eef6;
        --ymo-muted: #98a5b8;
        --ymo-accent: #7c5cff;
        --ymo-accent-2: #25c2a0;
        --ymo-danger: #ff5c8f;
        --ymo-warning: #ffcf6d;
        --ymo-shadow: 0 18px 40px rgba(0,0,0,.34);
        --ymo-shadow-lg: 0 20px 44px rgba(0,0,0,.34);
        --ymo-wrap: 1360px;
        --ymo-radius: 20px;
        --ymo-radius-sm: 14px;
      }

      html,
      body,
      .site-container {
        background:
          radial-gradient(circle at top, rgba(124,92,255,.10), transparent 28%),
          radial-gradient(circle at 85% 10%, rgba(37,194,160,.06), transparent 18%),
          var(--ymo-bg) !important;
        color: var(--ymo-text) !important;
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
        max-width: var(--ymo-wrap) !important;
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
        backdrop-filter: blur(14px) !important;
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
        border: 1px solid var(--ymo-line) !important;
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
        border: 1px solid var(--ymo-line) !important;
        background:
          linear-gradient(135deg, rgba(124,92,255,.14), rgba(37,194,160,.08)),
          var(--ymo-panel) !important;
        box-shadow: var(--ymo-shadow) !important;
        overflow: hidden !important;
      }

      .search-form {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        min-height: 76px !important;
        padding: 10px !important;
        background: var(--ymo-panel) !important;
        border: 1px solid var(--ymo-line) !important;
        border-radius: 20px !important;
        box-shadow: var(--ymo-shadow) !important;
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
        color: var(--ymo-muted) !important;
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
        color: var(--ymo-text) !important;
        box-shadow: none !important;
        font-size: 15px !important;
      }

      .search-form-input::placeholder,
      .search-form input[type="search"]::placeholder {
        color: var(--ymo-muted) !important;
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
        background: linear-gradient(135deg, var(--ymo-accent), #6d7cff) !important;
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
        color: var(--ymo-muted) !important;
        font-size: 13px !important;
      }

      .content-archive,
      .ymo-results-grid {
        display: grid !important;
        grid-template-columns: repeat(var(--ymo-grid-desktop), minmax(0, 1fr)) !important;
        gap: var(--ymo-grid-gap) !important;
        align-items: stretch !important;
      }

      .content-archive::before,
      .content-archive::after {
        display: none !important;
      }

      .ymo-results-grid > :not(article):not(.gallery):not(a.tagchip) {
        grid-column: 1 / -1 !important;
      }

      .ymo-results-grid > nav.pagination,
      .ymo-results-grid > .pagination,
      .ymo-results-grid > .wp-pagenavi {
        order: 999 !important;
        align-self: stretch !important;
      }

      .ymo-results-grid > .sidebar,
      .ymo-results-grid > .widget,
      .ymo-results-grid > .widget_search,
      .ymo-results-grid > .search-expand,
      .ymo-results-grid > form.searchform,
      .ymo-results-grid > [id^="search-"] {
        order: 1000 !important;
        grid-column: 1 / -1 !important;
      }

      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > nav.pagination,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > .pagination {
        margin-top: 8px !important;
      }

      body.home.blog.col-3cm .main-inner.group.ymo-results-grid,
      body.home.blog.col-3cm .content.ymo-results-grid,
      body.home.blog.col-3cm .content-inner.ymo-results-grid {
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

      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid {
        grid-template-columns: repeat(var(--ymo-grid-desktop), minmax(220px, 1fr)) !important;
        gap: var(--ymo-grid-gap) !important;
        row-gap: var(--ymo-grid-gap) !important;
      }

      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > nav.pagination,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > .pagination,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > .wp-pagenavi {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-wrap: wrap !important;
        gap: 10px !important;
        padding: 10px 0 4px !important;
        margin: 4px 0 0 !important;
      }

      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > nav.pagination a,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > nav.pagination span,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > .pagination a,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > .pagination span,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > .wp-pagenavi a,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > .wp-pagenavi span {
        min-width: 42px !important;
        height: 42px !important;
        padding: 0 14px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 12px !important;
        background: rgba(255,255,255,.035) !important;
        border: 1px solid var(--ymo-line) !important;
        color: var(--ymo-text) !important;
        text-decoration: none !important;
      }

      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > nav.pagination .current,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > .pagination .current,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > .wp-pagenavi .current {
        background: linear-gradient(180deg, rgba(124,92,255,.34), rgba(37,194,160,.24)) !important;
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
        border: 1px solid var(--ymo-line) !important;
        background: var(--ymo-panel-2) !important;
        aspect-ratio: var(--ymo-cover-ratio) !important;
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
        color: var(--ymo-text) !important;
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
        body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid {
          grid-template-columns: repeat(var(--ymo-grid-tablet), minmax(200px, 1fr)) !important;
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

        body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 820px) {
        body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 560px) {
        body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid {
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
        background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01)) !important;
        border: 1px solid var(--ymo-line) !important;
        border-radius: 22px !important;
        box-shadow: var(--ymo-shadow) !important;
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
        border-color: var(--ymo-line-2) !important;
        box-shadow: var(--ymo-shadow-lg) !important;
      }

      .ymo-hidden-card {
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
        color: var(--ymo-text) !important;
      }

      article.entry .entry-image-link,
      article.post .entry-image-link,
      article.post-standard .entry-image-link,
      article.hentry .entry-image-link {
        display: block !important;
        overflow: hidden !important;
        aspect-ratio: var(--ymo-cover-ratio) !important;
        border-radius: 16px !important;
        border: 1px solid var(--ymo-line) !important;
        background: var(--ymo-panel-2) !important;
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

      .ymo-chip-row-wrap {
        position: relative !important;
        flex: 0 0 auto !important;
      }

      .ymo-tag-row {
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

      .ymo-chip,
      .ymo-chip-overflow-button,
      .ymo-chip-overflow-count {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 24px !important;
        padding: 0 9px !important;
        border-radius: 999px !important;
        border: 1px solid rgba(255,255,255,.08) !important;
        background: rgba(255,255,255,.05) !important;
        color: #dbe4f2 !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        line-height: 1 !important;
        white-space: nowrap !important;
      }

      .ymo-chip {
        cursor: default !important;
        user-select: none !important;
      }

      .ymo-chip-overflow-count {
        background: rgba(255,207,109,.12) !important;
        color: #ffe2a3 !important;
      }

      .ymo-chip-overflow-button {
        cursor: pointer !important;
        background: rgba(124,92,255,.14) !important;
        color: #e1d7ff !important;
      }

      .ymo-chip--lang { background: rgba(37,194,160,.14) !important; color: #b2f5e7 !important; }
      .ymo-chip--category { background: rgba(124,92,255,.16) !important; color: #dfd5ff !important; }
      .ymo-chip--genre { background: rgba(255,255,255,.06) !important; }
      .ymo-chip--tag { background: rgba(255,255,255,.04) !important; }
      .ymo-chip--artist,
      .ymo-chip--group { background: rgba(255,92,143,.11) !important; color: #ffc4d7 !important; }
      .ymo-chip--pairing { background: rgba(255,188,92,.12) !important; color: #ffd9a8 !important; }

      .ymo-chip-popover {
        position: absolute !important;
        left: 0 !important;
        top: calc(100% + 8px) !important;
        z-index: 40 !important;
        width: min(320px, calc(100vw - 32px)) !important;
        padding: 10px !important;
        border-radius: 14px !important;
        border: 1px solid rgba(255,255,255,.08) !important;
        background: rgba(10,16,28,.97) !important;
        box-shadow: var(--ymo-shadow) !important;
        backdrop-filter: blur(12px) !important;
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 6px !important;
        opacity: 0 !important;
        pointer-events: none !important;
        transform: translateY(6px) !important;
        transition: opacity .16s ease, transform .16s ease !important;
      }

      @media (hover: hover) and (pointer: fine) {
        .ymo-chip-row-wrap:hover .ymo-chip-popover,
        .ymo-chip-row-wrap:focus-within .ymo-chip-popover,
        .entry-title:hover + .ymo-chip-row-wrap .ymo-chip-popover,
        .entry-title:focus-within + .ymo-chip-row-wrap .ymo-chip-popover,
        .post-title:hover + .ymo-chip-row-wrap .ymo-chip-popover,
        .post-title:focus-within + .ymo-chip-row-wrap .ymo-chip-popover,
        h1:hover + .ymo-chip-row-wrap .ymo-chip-popover,
        h1:focus-within + .ymo-chip-row-wrap .ymo-chip-popover,
        h2:hover + .ymo-chip-row-wrap .ymo-chip-popover,
        h2:focus-within + .ymo-chip-row-wrap .ymo-chip-popover,
        h3:hover + .ymo-chip-row-wrap .ymo-chip-popover,
        h3:focus-within + .ymo-chip-row-wrap .ymo-chip-popover,
        h4:hover + .ymo-chip-row-wrap .ymo-chip-popover,
        h4:focus-within + .ymo-chip-row-wrap .ymo-chip-popover {
          opacity: 1 !important;
          pointer-events: auto !important;
          transform: translateY(0) !important;
        }
      }

      .ymo-chip-popover.is-open {
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
        border: 1px solid var(--ymo-line) !important;
        background: rgba(255,255,255,.04) !important;
        color: var(--ymo-muted) !important;
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
      .ymo-results-grid > .archive-pagination,
      .ymo-results-grid > nav.pagination,
      .ymo-results-grid > .navigation.pagination,
      .ymo-results-grid > .pagination,
      .ymo-results-grid > .wp-pagenavi,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > nav.pagination,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > .navigation.pagination,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > .pagination,
      body.home.blog.col-3cm .content > .content-inner > .pad.group.ymo-results-grid > .wp-pagenavi {
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
        border: 1px solid var(--ymo-line) !important;
        background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03)) !important;
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
        color: var(--ymo-muted) !important;
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
        background: linear-gradient(180deg, rgba(124,92,255,.18), rgba(37,194,160,.10)) !important;
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
        background: linear-gradient(135deg, rgba(124,92,255,.24), rgba(37,194,160,.16)) !important;
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
        max-width: var(--ymo-wrap) !important;
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
        border-radius: var(--ymo-radius) !important;
        border: 1px solid var(--ymo-line) !important;
        background:
          linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015)),
          var(--ymo-panel) !important;
        box-shadow: var(--ymo-shadow) !important;
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
        color: var(--ymo-text) !important;
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
        border: 1px solid var(--ymo-line) !important;
        background: rgba(255,255,255,.04) !important;
        color: #d7e0ec !important;
        font-size: 13px !important;
        line-height: 1 !important;
        transition: .18s ease !important;
      }

      .footer-widgets .tagcloud a:hover,
      .footer-widgets .textwidget a:hover {
        color: #fff !important;
        border-color: var(--ymo-line-2) !important;
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
        color: var(--ymo-muted) !important;
        transition: .18s ease !important;
      }

      .footer-widgets .widget_nav_menu li a:hover,
      .footer-widgets .widget_categories li a:hover,
      .footer-widgets .widget_meta li a:hover,
      .footer-widgets .widget_pages li a:hover {
        color: var(--ymo-text) !important;
        border-color: var(--ymo-line) !important;
        background: rgba(255,255,255,.05) !important;
      }

      .site-footer {
        margin-top: 18px !important;
        clear: both !important;
        border-top: 1px solid rgba(255,255,255,.05) !important;
        background: transparent !important;
        color: var(--ymo-muted) !important;
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
        border: 1px solid var(--ymo-line) !important;
        background: rgba(255,255,255,.035) !important;
        color: #d8e1ed !important;
        font-size: 13px !important;
        font-weight: 700 !important;
      }

      .site-footer .copyright,
      .site-footer p {
        margin: 0 !important;
        max-width: 78ch !important;
        color: var(--ymo-muted) !important;
        font-size: 13px !important;
      }

      .ymo-panel-toggle {
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
        background: linear-gradient(135deg, var(--ymo-accent), #6d7cff);
        color: #fff;
        cursor: pointer;
        box-shadow: 0 14px 30px rgba(124,92,255,.32);
        bottom: 18px;
      }

      .ymo-panel-toggle.is-left { left: 18px; }
      .ymo-panel-toggle.is-right { right: 18px; }

      .ymo-panel {
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
        box-shadow: var(--ymo-shadow);
        backdrop-filter: blur(12px);
        color: var(--ymo-text);
        bottom: 74px;
      }

      .ymo-panel.is-left { left: 18px; }
      .ymo-panel.is-right { right: 18px; }

      .ymo-panel[hidden] {
        display: none !important;
      }

      .ymo-panel__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 12px 12px 8px;
        border-bottom: 1px solid rgba(255,255,255,.06);
      }

      .ymo-panel__title {
        font-size: 13px;
        font-weight: 800;
      }

      .ymo-panel__actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .ymo-btn {
        min-height: 28px;
        padding: 0 10px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(255,255,255,.04);
        color: var(--ymo-text);
        font: inherit;
        cursor: pointer;
      }

      .ymo-tabs {
        display: flex;
        gap: 8px;
        padding: 10px 12px 0;
      }

      .ymo-tab {
        flex: 1 1 0;
      }

      .ymo-tab.is-active {
        background: rgba(124,92,255,.18);
        border-color: rgba(124,92,255,.35);
      }

      .ymo-panel__body {
        overflow: auto;
        padding: 12px;
      }

      .ymo-tab-panel[hidden] {
        display: none !important;
      }

      .ymo-help {
        color: var(--ymo-muted);
        font-size: 11px;
        margin-bottom: 12px;
      }

      .ymo-results-summary {
        margin: 0 0 12px;
        color: var(--ymo-muted);
        font-size: 12px;
      }

      .ymo-field {
        display: grid;
        gap: 6px;
        margin-bottom: 12px;
      }

      .ymo-field span {
        font-size: 12px;
        font-weight: 700;
      }

      .ymo-field input,
      .ymo-field select {
        min-height: 38px;
        padding: 0 12px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(255,255,255,.04);
        color: var(--ymo-text);
      }

      .ymo-check {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 34px;
        margin-bottom: 10px;
      }

      .ymo-check input {
        margin: 0;
      }

      .ymo-grid-controls {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px 10px;
        align-items: center;
      }

      .ymo-grid-controls input[type="range"] {
        width: 100%;
        grid-column: 1 / -1;
      }

      .ymo-grid-value {
        color: var(--ymo-muted);
        min-width: 28px;
        text-align: right;
      }

      .ymo-toolbar-row {
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
        background: linear-gradient(135deg, var(--ymo-accent), #6d7cff) !important;
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
        .ymo-results-grid {
          grid-template-columns: repeat(var(--ymo-grid-mobile), minmax(0, 1fr)) !important;
        }

        .ymo-panel.is-right { right: 12px; }
        .ymo-panel.is-left { left: 12px; }
        .ymo-panel { bottom: 64px; }

        .ymo-panel-toggle.is-right { right: 12px; }
        .ymo-panel-toggle.is-left { left: 12px; }
        .ymo-panel-toggle { bottom: 12px; }

        .ymo-chip-popover {
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
        .ymo-results-grid {
          grid-template-columns: repeat(var(--ymo-grid-mobile), minmax(0, 1fr)) !important;
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
    root.style.setProperty("--ymo-grid-desktop", String(state.grid.desktopCols));
    root.style.setProperty("--ymo-grid-tablet", String(state.grid.tabletCols));
    root.style.setProperty("--ymo-grid-mobile", String(state.grid.mobileCols));
    root.style.setProperty("--ymo-grid-gap", `${state.grid.gap}px`);
    root.style.setProperty("--ymo-cover-ratio", `${state.grid.coverRatioW} / ${state.grid.coverRatioH}`);
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

  function getSidebarWidgetState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SIDEBAR_STATE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveSidebarWidgetState(next) {
    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(next && typeof next === "object" ? next : {}));
    } catch {}
  }

  function normalizeChipMatch(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&amp;/g, "&")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function buildChipCompareValues(item) {
    const base = new Set();
    const raw = String(item?.raw || "").trim();
    const text = String(item?.text || "").trim();

    if (raw) {
      base.add(normalizeChipMatch(raw));
      base.add(normalizeChipMatch(raw.replace(/-/g, " ")));
      base.add(normalizeChipMatch(titleCase(raw)));
    }
    if (text) {
      base.add(normalizeChipMatch(text));
    }

    if (raw) {
      base.add(normalizeChipMatch(raw.replace(/-yaoi$/i, "")));
      base.add(normalizeChipMatch(raw.replace(/^mangaka-/i, "")));
    }
    if (text) {
      base.add(normalizeChipMatch(text.replace(/\byaoi\b/ig, "")));
    }

    return Array.from(base).filter(Boolean);
  }

  function resolveChipHref(contextNode, family, item) {
    if (!(contextNode instanceof HTMLElement) || !item) return "";
    const compareValues = buildChipCompareValues(item);
    if (!compareValues.length) return "";

    const links = Array.from(contextNode.querySelectorAll("a[href]"));
    for (const link of links) {
      const href = link.getAttribute("href") || "";
      if (!href || !/^https?:\/\//i.test(href)) continue;
      const hrefLooksTaxonomy = /\/tag\/|\/mangaka\/|\/category\/|\/bara-manga\/|\/yaoi-doujinshi\/|\/yaoi-webtoons\/|\/yaoi-manhwa\//i.test(href);
      if (!hrefLooksTaxonomy) continue;

      const textValue = normalizeChipMatch(link.textContent || "");
      const hrefValue = normalizeChipMatch(href);
      if (!textValue && !hrefValue) continue;

      if (compareValues.some((value) => value && (textValue === value || hrefValue.includes(value)))) {
        return href;
      }
    }

    return "";
  }

  function createChip(family, item, contextNode = null) {
    const href = resolveChipHref(contextNode, family, item);
    const chip = document.createElement(href ? "a" : "span");
    chip.className = `ymo-chip ymo-chip--${family}${href ? " is-link" : ""}`;
    chip.textContent = item.text;
    chip.title = item.text;
    if (href && chip instanceof HTMLAnchorElement) {
      chip.href = href;
      chip.target = "_self";
      chip.rel = "noopener noreferrer";
    }
    return chip;
  }

  function closeAllChipPopovers(except = null) {
    document.querySelectorAll(".ymo-chip-popover.is-open").forEach((node) => {
      if (except && node === except) return;
      node.classList.remove("is-open");
    });
  }

  function injectCardChips(article, meta) {
    let wrap = article.querySelector(":scope > .ymo-chip-row-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "ymo-chip-row-wrap";
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
    row.className = "ymo-tag-row";
    row.append(...visible.map(({ family, item }) => createChip(family, item, article)));
    wrap.appendChild(row);

    if (!hidden.length) return;

    const clueCount = document.createElement(isMobileView() ? "button" : "span");
    clueCount.className = isMobileView() ? "ymo-chip-overflow-button" : "ymo-chip-overflow-count";
    clueCount.textContent = `+${hidden.length}`;
    clueCount.title = `${hidden.length} more`;
    row.appendChild(clueCount);

    const popover = document.createElement("div");
    popover.className = "ymo-chip-popover";
    popover.append(...chipModel.map(({ family, item }) => createChip(family, item, article)));
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
      if (event.target.closest(".ymo-chip-row-wrap")) return;
      closeAllChipPopovers();
    });
  }

  function applyPanelSide() {
    const panel = document.getElementById("ymo-panel");
    const toggle = document.getElementById("ymo-panel-toggle");
    if (!panel || !toggle) return;

    panel.classList.toggle("is-left", state.archive.dock === "left");
    panel.classList.toggle("is-right", state.archive.dock !== "left");
    toggle.classList.toggle("is-left", state.archive.dock === "left");
    toggle.classList.toggle("is-right", state.archive.dock !== "left");
  }

  function buildCardRecord(article, index, readPosts, previousMap = new Map()) {
    const titleText = getCardTitle(article);
    const href = getCardHref(article);
    const meta = extractCardMeta(article);
    const articleText = slugify(article.textContent);
    const titleSlug = slugify(titleText);
    const metaTerms = META_FAMILIES
      .flatMap((family) => (meta?.[family.key] || []).map((item) => `${item.text || item.raw} ${item.raw}`))
      .join(" ");
    const searchHaystack = slugify(`${titleText} ${metaTerms} ${articleText}`);
    const english = /\benglish\b/.test(searchHaystack) || /\beng\b/.test(searchHaystack) || meta.lang.some((item) => item.raw === "english");
    const id = href || `${location.pathname}::${titleText || index}`;
    const metaSignature = JSON.stringify(meta);

    article.dataset.ymoId = id;
    article.dataset.ymoTitle = titleSlug;
    article.dataset.ymoEnglish = english ? "1" : "0";
    article.dataset.ymoOrder = String(index);
    article.classList.toggle("ymo-read", readPosts.has(id));

    const previous = previousMap.get(id);
    const previousSignature = previous?.article?.dataset?.ymoMetaSignature || "";
    article.dataset.ymoMetaSignature = metaSignature;

    if (previous?.article !== article || previousSignature !== metaSignature) {
      injectCardChips(article, meta);
      injectReaderTrigger(article);
    } else {
      injectReaderTrigger(article);
    }

    return {
      article,
      id,
      title: titleSlug,
      titleText,
      english,
      meta,
      articleText,
      searchHaystack,
      facetValues: previous?.facetValues || {},
    };
  }

  function markCards() {
    const readPosts = getReadPosts();
    const articles = findCards();
    const previousMap = new Map((state.cards || []).map((card) => [card.id, card]));
    const nextCards = [];

    for (const [index, article] of articles.entries()) {
      nextCards.push(buildCardRecord(article, index, readPosts, previousMap));
    }

    state.cards = nextCards;
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
        if (a.english === b.english) return Number(a.article.dataset.ymoOrder) - Number(b.article.dataset.ymoOrder);
        return a.english ? -1 : 1;
      }
      return Number(a.article.dataset.ymoOrder) - Number(b.article.dataset.ymoOrder);
    });

    const currentOrder = Array.from(container.children)
      .map((node) => (node instanceof HTMLElement ? node.dataset.ymoId || "" : ""))
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
    const activeFacetState = facets.map((facet) => {
      const selection = getFacetSelectionMap(facet.key);
      const include = Object.keys(selection).filter((key) => selection[key] === "include");
      const exclude = Object.keys(selection).filter((key) => selection[key] === "exclude");
      return { facet, include, exclude, active: Boolean(include.length || exclude.length) };
    });
    let visible = 0;

    for (const card of state.cards) {
      const matchesQuery = !q || card.searchHaystack.includes(q);
      const matchesRead = !state.archive.hideRead || !card.article.classList.contains("ymo-read");
      const matchesEnglish = !state.archive.onlyEnglish || card.english;

      let matchesFacets = true;
      for (const entry of activeFacetState) {
        if (!entry.active) continue;
        const values = getCardFacetValues(card, entry.facet);
        if (entry.include.length && !entry.include.some((value) => values.includes(value))) {
          matchesFacets = false;
          break;
        }
        if (entry.exclude.some((value) => values.includes(value))) {
          matchesFacets = false;
          break;
        }
      }

      const show = matchesQuery && matchesRead && matchesEnglish && matchesFacets;
      card.article.classList.toggle("ymo-hidden-card", !show);
      if (show) visible += 1;
    }

    const summary = document.getElementById("ymo-results-summary");
    if (summary) summary.textContent = `Showing ${visible} of ${state.cards.length} results`;

    const activeCount = document.getElementById("ymo-active-filter-count");
    if (activeCount) activeCount.textContent = String(getActiveFilterCount());
  }

  function trackReadClicks() {
    document.addEventListener(
      "click",
      (event) => {
        const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (!anchor) return;
        const card = anchor.closest("[data-ymo-id]");
        if (!(card instanceof HTMLElement) || !card.dataset.ymoId) return;

        const readPosts = getReadPosts();
        readPosts.add(card.dataset.ymoId);
        saveReadPosts(readPosts);

        document.querySelectorAll(`[data-ymo-id="${CSS.escape(card.dataset.ymoId)}"]`).forEach((node) => {
          if (node instanceof HTMLElement) node.classList.add("ymo-read");
        });

        for (const entry of state.cards) {
          if (entry.id === card.dataset.ymoId) {
            entry.article.classList.add("ymo-read");
          }
        }

        applyArchiveFilter();
      },
      true
    );
  }

  function markVisiblePageRead() {
    const readPosts = getReadPosts();

    for (const card of state.cards) {
      if (card.article.classList.contains("ymo-hidden-card")) continue;
      readPosts.add(card.id);
      card.article.classList.add("ymo-read");
    }

    saveReadPosts(readPosts);
    applyArchiveFilter();
  }

  function createPanel() {
    if (document.getElementById("ymo-panel")) return;

    hideUiRestoreToggle();

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.id = "ymo-panel-toggle";
    toggle.className = "ymo-panel-toggle";
    toggle.textContent = "☰";
    toggle.setAttribute("aria-label", "Open filter panel");
    toggle.setAttribute("title", "Filters");

    const panel = document.createElement("section");
    panel.id = "ymo-panel";
    panel.className = "ymo-panel";
    panel.hidden = !state.ui.panelOpen;

    const head = document.createElement("div");
    head.className = "ymo-panel__head";

    const title = document.createElement("div");
    title.className = "ymo-panel__title";
    title.textContent = "YMO Filters";

    const actions = document.createElement("div");
    actions.className = "ymo-panel__actions";

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "ymo-btn";
    resetBtn.textContent = "Reset";

    actions.append(resetBtn);
    head.append(title, actions);

    const tabs = document.createElement("div");
    tabs.className = "ymo-tabs";

    const filtersTab = document.createElement("button");
    filtersTab.type = "button";
    filtersTab.className = "ymo-btn ymo-tab";
    filtersTab.dataset.tab = "filters";
    filtersTab.textContent = "Filters";

    const gridTab = document.createElement("button");
    gridTab.type = "button";
    gridTab.className = "ymo-btn ymo-tab";
    gridTab.dataset.tab = "grid";
    gridTab.textContent = "Grid";

    tabs.append(filtersTab, gridTab);

    const body = document.createElement("div");
    body.className = "ymo-panel__body";

    const filtersPane = document.createElement("div");
    filtersPane.id = "ymo-tab-filters";
    filtersPane.className = "ymo-tab-panel";

    const gridPane = document.createElement("div");
    gridPane.id = "ymo-tab-grid";
    gridPane.className = "ymo-tab-panel";

    body.append(filtersPane, gridPane);
    panel.append(head, tabs, body);
    document.body.append(panel, toggle);

    const syncPanelVisibility = () => {
      const open = !panel.hidden;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close filter panel" : "Open filter panel");
    };

    toggle.addEventListener("click", () => {
      state.ui.panelOpen = panel.hidden;
      panel.hidden = !panel.hidden;
      syncPanelVisibility();
      saveState();
    });

    document.addEventListener("click", (event) => {
      if (panel.hidden || !isMobileViewport()) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panel.contains(target) || toggle.contains(target)) return;
      panel.hidden = true;
      state.ui.panelOpen = false;
      syncPanelVisibility();
      saveState();
    }, true);

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || panel.hidden) return;
      panel.hidden = true;
      state.ui.panelOpen = false;
      syncPanelVisibility();
      saveState();
    });

    filtersTab.addEventListener("click", () => setActiveTab("filters"));
    gridTab.addEventListener("click", () => setActiveTab("grid"));
    resetBtn.addEventListener("click", resetFiltersAndGrid);

    ensureFacetModal();
    renderFiltersPane();
    renderGridPane();
    setActiveTab(state.ui.activeTab);
    applyPanelSide();
    syncPanelVisibility();
  }

  function setActiveTab(tab) {
    state.ui.activeTab = tab;
    saveState();

    document.querySelectorAll(".ymo-tab").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.tab === tab);
    });

    document.querySelectorAll(".ymo-tab-panel").forEach((node) => {
      node.hidden = node.id !== `ymo-tab-${tab}`;
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


  function getPopularTagsFacet(root = document) {
    const widget = root.querySelector(".widget_tag_cloud .tagcloud, #tag_cloud-2 .tagcloud, .widget.widget_tag_cloud .tagcloud");
    if (!(widget instanceof HTMLElement)) return null;

    const options = Array.from(widget.querySelectorAll("a[href]"))
      .map((anchor) => {
        const label = anchor.textContent?.trim() || "";
        if (!label) return null;
        const aria = anchor.getAttribute("aria-label") || "";
        const count = Number((aria.match(/(\d[\d,]*)\s+items?/i) || [])[1]?.replace(/,/g, "") || 0);
        const raw = normalizeFacetOptionRaw("tag", label, label);
        if (!raw) return null;
        return {
          raw,
          label: normalizeMetaValue("tag", label).text,
          count: count || 1,
          slug: slugify(label),
          href: anchor.href,
        };
      })
      .filter(Boolean);

    if (!options.length) return null;

    return {
      key: "native:popular_tags",
      familyKey: "tag",
      nativeParam: "",
      title: "Popular Tags",
      searchable: true,
      source: "native",
      options,
    };
  }

  function getMangaIndexData(root = document) {
    const select = root.querySelector(".widget_categories select.postform, #categories-3 select.postform, select.postform[name='cat']");
    if (!(select instanceof HTMLSelectElement)) return null;

    const form = select.closest("form");
    const action = form instanceof HTMLFormElement && form.action ? form.action : `${location.origin}/`;
    const options = Array.from(select.options)
      .map((option) => ({
        value: String(option.value || "").trim(),
        label: String(option.textContent || "").replace(/\s+/g, " ").trim(),
        selected: option.selected,
      }))
      .filter((option) => option.value && option.value !== "-1");

    return {
      action,
      options,
      currentValue: String(select.value || "").trim(),
    };
  }

  function renderMangaIndexControl() {
    const data = getMangaIndexData();
    if (!data || !data.options.length) return null;

    const field = document.createElement("label");
    field.className = "ymo-field ymo-field--manga-index";
    field.innerHTML = `
      <span>Manga index</span>
      <select id="ymo-manga-index-select"></select>
    `;

    const select = field.querySelector("select");
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select category";
    select.appendChild(placeholder);

    for (const option of data.options) {
      const node = document.createElement("option");
      node.value = option.value;
      node.textContent = option.label.replace(/\(\d+\)\s*$/, "").trim();
      if (option.value === data.currentValue) node.selected = true;
      select.appendChild(node);
    }

    select.value = data.currentValue && data.currentValue !== "-1" ? data.currentValue : "";
    select.addEventListener("change", () => {
      const value = String(select.value || "").trim();
      try {
        const next = new URL(data.action || `${location.origin}/`, location.origin);
        if (value) next.searchParams.set("cat", value);
        else next.searchParams.delete("cat");
        next.searchParams.delete("paged");
        next.searchParams.delete("page");
        location.href = next.toString();
      } catch {
        location.href = value ? `/?cat=${encodeURIComponent(value)}` : "/";
      }
    });

    return field;
  }

function buildNativeFacetsFromSidebar(root = document) {
    const widgets = Array.from(root.querySelectorAll(`${SELECTORS.nativeSearchSidebar} .ep-filter-widget.widget_ep-facet`));
    const facets = widgets.map((widget, index) => {
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

    const popularTagsFacet = getPopularTagsFacet(root);
    if (popularTagsFacet && !facets.some((facet) => facet.key === popularTagsFacet.key)) {
      facets.push(popularTagsFacet);
    }

    return facets;
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


function mergeFacetCollections(primaryFacets, supplementalFacets = []) {
  const merged = [];
  const byKey = new Map();

  for (const facet of primaryFacets || []) {
    const clone = {
      ...facet,
      options: Array.isArray(facet.options) ? facet.options.map((option) => ({ ...option })) : [],
    };
    merged.push(clone);
    byKey.set(clone.key, clone);
  }

  for (const facet of supplementalFacets || []) {
    if (!facet || !Array.isArray(facet.options) || !facet.options.length) continue;

    const mergeTarget =
      (facet.familyKey && merged.find((item) => item.familyKey === facet.familyKey)) ||
      byKey.get(facet.key) ||
      null;

    if (!mergeTarget) {
      const clone = {
        ...facet,
        source: facet.source || "supplemental",
        options: facet.options.map((option) => ({ ...option })),
      };
      merged.push(clone);
      byKey.set(clone.key, clone);
      continue;
    }

    const optionMap = new Map(mergeTarget.options.map((option) => [option.raw, option]));
    for (const option of facet.options) {
      if (!option?.raw) continue;
      const existing = optionMap.get(option.raw);
      if (existing) {
        existing.count = Math.max(Number(existing.count || 0), Number(option.count || 0));
        if (!existing.label && option.label) existing.label = option.label;
        if (!existing.slug && option.slug) existing.slug = option.slug;
        if (!existing.href && option.href) existing.href = option.href;
        continue;
      }
      const cloneOption = { ...option };
      mergeTarget.options.push(cloneOption);
      optionMap.set(cloneOption.raw, cloneOption);
    }

    mergeTarget.options.sort((a, b) => (Number(b.count || 0) - Number(a.count || 0)) || String(a.label || "").localeCompare(String(b.label || "")));
    mergeTarget.searchable = Boolean(mergeTarget.searchable || facet.searchable || mergeTarget.options.length > FACET_PANEL_PAGE_SIZE);
  }

  return merged;
}


  function getNativeFacetExcludeParam(nativeParam) {
    const normalized = String(nativeParam || "").trim();
    if (!normalized) return "";
    return `ymo_exclude_${normalized.replace(/^ep_filter_/, "")}`;
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
    if (buildNativeFacetsFromSidebar().some((facet) => facet.nativeParam)) return Promise.resolve([]);
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
    const routeableNativeFacets = nativeFacets.filter((facet) => facet.nativeParam);
    const supplementalFacets = nativeFacets.filter((facet) => !facet.nativeParam);

    const syntheticFacets = buildSyntheticFacetsFromCards();
    const localFacets = mergeFacetCollections(syntheticFacets, supplementalFacets);

    if (routeableNativeFacets.length) {
      syncNativeFacetSelectionsFromUrl(routeableNativeFacets);
      saveFacetCatalogCache(routeableNativeFacets);
      return mergeFacetCollections(routeableNativeFacets, localFacets);
    }

    const cachedFacets = buildFacetsFromCachedCatalog();
    if (cachedFacets.length) {
      return mergeFacetCollections(localFacets, cachedFacets);
    }

    warmFacetCatalogInBackground();
    return localFacets;
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

    const classText = slugify(Array.from(card.article.classList || []).join(" "));
    const titleText = card.articleText || card.searchHaystack || slugify(card.article.textContent || "");

    if (!values.size && facet.nativeParam) {
      for (const option of facet.options) {
        if (classText.includes(option.raw) || titleText.includes(option.raw)) {
          values.add(option.raw);
        }
      }
    }

    if (facet.familyKey && Array.isArray(facet.options)) {
      for (const option of facet.options) {
        const optionTokens = [
          slugify(option.raw || ""),
          slugify(option.slug || ""),
          slugify(option.label || ""),
        ].filter(Boolean);

        if (!optionTokens.length) continue;

        const matched = optionTokens.some((token) => {
          if (values.has(option.raw)) return true;
          if (classText.includes(token) || titleText.includes(token)) return true;

          if (facet.familyKey === "tag") {
            const softToken = token
              .replace(/-yaoi/g, "")
              .replace(/-manga/g, "")
              .replace(/-manhwa/g, "")
              .replace(/-dj/g, "")
              .replace(/-doujinshi/g, "");
            if (softToken && (classText.includes(softToken) || titleText.includes(softToken))) {
              return true;
            }
          }

          return false;
        });

        if (matched) values.add(option.raw);
      }
    }

    const resolved = Array.from(values);
    card.facetValues[facet.key] = resolved;
    return resolved;
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
    row.className = "ymo-facet-term";

    const info = document.createElement("div");
    info.className = "ymo-facet-term__info";

    const name = document.createElement("div");
    name.className = "ymo-facet-term__name";
    name.textContent = getFacetOptionLabel(option);

    const meta = document.createElement("div");
    meta.className = "ymo-facet-term__meta";
    meta.textContent = `(${option.count})`;

    info.append(name, meta);

    const controls = document.createElement("div");
    controls.className = "ymo-facet-term__controls";

    const inBtn = document.createElement("button");
    inBtn.type = "button";
    inBtn.className = "ymo-facet-mode-btn";
    inBtn.textContent = "IN";
    inBtn.classList.toggle("is-in", mode === "include");
    inBtn.addEventListener("click", (event) => {
      event.preventDefault();
      setFacetTermMode(facet.key, option.raw, mode === "include" ? "" : "include");
      syncFacetSelectionChange();
    });

    const outBtn = document.createElement("button");
    outBtn.type = "button";
    outBtn.className = "ymo-facet-mode-btn";
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

  function createFacetWidget(facet) {
    const section = document.createElement("section");
    section.className = "ymo-facet-widget";
    section.dataset.facetKey = facet.key;

    const collapsed = getFacetCollapsedValue(facet.key);
    if (collapsed) section.classList.add("is-collapsed");

    const head = document.createElement("button");
    head.type = "button";
    head.className = "ymo-facet-widget__head ymo-facet-widget__toggle";
    head.setAttribute("aria-expanded", String(!collapsed));
    head.setAttribute("aria-controls", `ymo-facet-content-${facet.key}`);

    const titleWrap = document.createElement("div");
    titleWrap.className = "ymo-facet-widget__title-wrap";

    const title = document.createElement("div");
    title.className = "ymo-facet-widget__title";
    title.textContent = facet.title;

    const meta = document.createElement("div");
    meta.className = "ymo-facet-widget__meta";
    const selectedCount = countSelectedTermsForFacet(facet.key);
    meta.textContent = selectedCount ? `${selectedCount} selected` : `${facet.options.length} options`;

    titleWrap.append(title, meta);

    const indicator = document.createElement("div");
    indicator.className = "ymo-facet-widget__indicator";
    indicator.textContent = collapsed ? "▸" : "▾";

    head.append(titleWrap, indicator);
    head.addEventListener("click", () => {
      toggleFacetAccordionState(facet.key);
      saveState();
      renderFiltersPane();
    });
    section.appendChild(head);

    const content = document.createElement("div");
    content.className = "ymo-facet-widget__content";
    content.id = `ymo-facet-content-${facet.key}`;
    content.hidden = collapsed;

    const toolbar = document.createElement("div");
    toolbar.className = "ymo-facet-widget__toolbar";

    if (facet.searchable) {
      const search = document.createElement("input");
      search.type = "search";
      search.className = "ymo-facet-search";
      search.placeholder = `Search ${facet.title}`;
      search.value = getFacetSearchValue(facet.key);
      const onFacetSearchInput = getDebouncedFacetRenderer(`facet-panel:${facet.key}`, (value) => {
        setFacetSearchValue(facet.key, value);
        setFacetPageValue(facet.key, 1);
        saveState();
        renderFiltersPane();
      });
      search.addEventListener("input", (event) => {
        onFacetSearchInput(event.target.value);
      });
      toolbar.appendChild(search);
    }

    const toolbarActions = document.createElement("div");
    toolbarActions.className = "ymo-facet-widget__toolbar-actions";

    const showAll = document.createElement("button");
    showAll.type = "button";
    showAll.className = "ymo-btn ymo-btn--small";
    showAll.textContent = "Show all";
    showAll.addEventListener("click", () => openFacetModal(facet.key));
    toolbarActions.appendChild(showAll);
    toolbar.appendChild(toolbarActions);

    content.appendChild(toolbar);

    const list = document.createElement("div");
    list.className = "ymo-facet-list";

    const paged = getPagedFacetOptions(facet, FACET_PANEL_PAGE_SIZE);
    const listFragment = document.createDocumentFragment();
    for (const option of paged.items) {
      listFragment.appendChild(createFacetTermRow(facet, option));
    }
    list.appendChild(listFragment);
    if (!paged.items.length) {
      const empty = document.createElement("div");
      empty.className = "ymo-facet-empty";
      empty.textContent = getFacetEmptyMessage(facet, paged.filtered.length);
      list.appendChild(empty);
    }
    content.appendChild(list);

    if (paged.pageCount > 1) {
      const footer = document.createElement("div");
      footer.className = "ymo-facet-widget__footer";

      const caption = document.createElement("div");
      caption.className = "ymo-facet-widget__caption";
      caption.textContent = `Page ${paged.page} of ${paged.pageCount}`;

      const pager = document.createElement("div");
      pager.className = "ymo-facet-pager";

      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "ymo-facet-page-btn";
      prev.textContent = "Prev";
      prev.disabled = paged.page <= 1;
      prev.addEventListener("click", () => {
        setFacetPageValue(facet.key, paged.page - 1);
        saveState();
        renderFiltersPane();
      });

      const next = document.createElement("button");
      next.type = "button";
      next.className = "ymo-facet-page-btn";
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
    let backdrop = document.getElementById("ymo-facet-modal-backdrop");
    if (backdrop) return backdrop;

    backdrop = document.createElement("div");
    backdrop.id = "ymo-facet-modal-backdrop";
    backdrop.className = "ymo-facet-modal-backdrop";
    backdrop.innerHTML = `
      <div class="ymo-facet-modal" role="dialog" aria-modal="true" aria-label="Facet picker">
        <div class="ymo-facet-modal__head">
          <div class="ymo-facet-modal__title">Facet</div>
          <button type="button" class="ymo-btn ymo-btn--small ymo-facet-modal__close">Close</button>
        </div>
        <div class="ymo-facet-modal__toolbar"></div>
        <div class="ymo-facet-modal__body"></div>
        <div class="ymo-facet-modal__footer"></div>
      </div>
    `;

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closeFacetModal();
    });

    backdrop.querySelector(".ymo-facet-modal__close")?.addEventListener("click", closeFacetModal);
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function closeFacetModal() {
    const backdrop = document.getElementById("ymo-facet-modal-backdrop");
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
    const backdrop = ensureFacetModal();
    const facets = getAvailableFilterFacets();
    const facet = facets.find((item) => item.key === state.ui.facetModalKey) || facets[0];
    if (!facet) return;

    const title = backdrop._ymoFacetModalTitle || backdrop.querySelector(".ymo-facet-modal__title");
    const toolbar = backdrop._ymoFacetModalToolbar || backdrop.querySelector(".ymo-facet-modal__toolbar");
    const body = backdrop._ymoFacetModalBody || backdrop.querySelector(".ymo-facet-modal__body");
    const footer = backdrop._ymoFacetModalFooter || backdrop.querySelector(".ymo-facet-modal__footer");

    backdrop._ymoFacetModalTitle = title;
    backdrop._ymoFacetModalToolbar = toolbar;
    backdrop._ymoFacetModalBody = body;
    backdrop._ymoFacetModalFooter = footer;

    if (!(title instanceof HTMLElement) || !(toolbar instanceof HTMLElement) || !(body instanceof HTMLElement) || !(footer instanceof HTMLElement)) return;

    title.textContent = `${facet.title} facet`;

    toolbar.replaceChildren();
    const search = document.createElement("input");
    search.type = "search";
    search.className = "ymo-facet-search";
    search.placeholder = `Search ${facet.title}`;
    search.value = getFacetSearchValue(facet.key);
    const onModalFacetSearchInput = getDebouncedFacetRenderer(`facet-modal:${facet.key}`, (value) => {
      setFacetSearchValue(facet.key, value);
      setFacetPageValue(facet.key, 1);
      saveState();
      renderFacetModal();
      renderFiltersPane();
    });
    search.addEventListener("input", (event) => {
      onModalFacetSearchInput(event.target.value);
    });
    toolbar.appendChild(search);

    body.replaceChildren();
    const paged = getPagedFacetOptions(facet, FACET_MODAL_PAGE_SIZE);
    const bodyFragment = document.createDocumentFragment();
    for (const option of paged.items) {
      bodyFragment.appendChild(createFacetTermRow(facet, option));
    }
    body.appendChild(bodyFragment);
    if (!paged.items.length) {
      const empty = document.createElement("div");
      empty.className = "ymo-facet-empty";
      empty.textContent = getFacetEmptyMessage(facet, paged.filtered.length);
      body.appendChild(empty);
    }

    footer.replaceChildren();
    const left = document.createElement("div");
    left.className = "ymo-facet-modal__summary";
    left.textContent = `Page ${paged.page} of ${paged.pageCount}`;

    const pager = document.createElement("div");
    pager.className = "ymo-facet-pager";
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "ymo-facet-page-btn";
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
    next.className = "ymo-facet-page-btn";
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
    done.className = "ymo-btn ymo-btn--small";
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
    const mount = getCachedElementById("ymo-tab-filters");
    if (!mount) return;

    ensureFacetModal();
    const facets = getAvailableFilterFacets();
    const nativeSort = shouldShowSearchSortControl() ? getNativeSortConfig() : null;
    const hasNativeRouting = facets.some((facet) => facet.source === "native" && facet.nativeParam);
    const showDisplaySort = shouldShowDisplaySortControl();
    const visible = state.cards.filter((card) => !card.article.classList.contains("ymo-hidden-card")).length;

    mount.replaceChildren();

    const summary = document.createElement("div");
    summary.id = "ymo-results-summary";
    summary.className = "ymo-results-summary";
    summary.textContent = `Showing ${visible} of ${state.cards.length} results`;

    const activeSummary = document.createElement("div");
    activeSummary.className = "ymo-results-summary";
    activeSummary.innerHTML = `Active filters: <strong id="ymo-active-filter-count">${getActiveFilterCount()}</strong>`;

    const activeChips = document.createElement("div");
    activeChips.className = "ymo-selected-chip-row";
    const activeChipsFragment = document.createDocumentFragment();

    for (const facet of facets) {
      const selection = getFacetSelectionMap(facet.key);
      const optionMap = getFacetOptionMap(facet);
      for (const [raw, mode] of Object.entries(selection)) {
        const option = optionMap.get(raw);
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = `ymo-selected-chip ${mode === "exclude" ? "is-exclude" : "is-include"}`;
        chip.textContent = `${mode === "exclude" ? "OUT" : "IN"}: ${getFacetOptionLabel(option || { raw, label: titleCase(raw) })}`;
        chip.addEventListener("click", () => {
          setFacetTermMode(facet.key, raw, "");
          syncFacetSelectionChange();
        });
        activeChipsFragment.appendChild(chip);
      }
    }
    activeChips.appendChild(activeChipsFragment);

    const globalSearch = document.createElement("label");
    globalSearch.className = "ymo-field";
    globalSearch.innerHTML = `
      <span>Search current results</span>
      <input id="ymo-archive-search" type="search" placeholder="Title, artist, tags">
    `;
    const globalSearchInput = globalSearch.querySelector("input");
    globalSearchInput.value = state.archive.q;
    const onArchiveSearchInput = getDebouncedFacetRenderer("archive-search", (value) => {
      state.archive.q = value;
      saveState();
      applyArchiveFilter();
    });
    globalSearchInput.addEventListener("input", (event) => {
      onArchiveSearchInput(event.target.value);
    });

    const toggles = document.createElement("div");
    toggles.className = "ymo-check-grid";

    const hideReadCheck = document.createElement("label");
    hideReadCheck.className = "ymo-check";
    hideReadCheck.innerHTML = `
      <input id="ymo-hide-read" type="checkbox">
      <span>Hide read</span>
    `;
    hideReadCheck.querySelector("input").checked = state.archive.hideRead;
    hideReadCheck.querySelector("input").addEventListener("change", (event) => {
      state.archive.hideRead = event.target.checked;
      saveState();
      applyArchiveFilter();
    });

    const onlyEnglishCheck = document.createElement("label");
    onlyEnglishCheck.className = "ymo-check";
    onlyEnglishCheck.innerHTML = `
      <input id="ymo-only-english" type="checkbox">
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
    uiToggle.className = "ymo-check";
    uiToggle.innerHTML = `
      <input id="ymo-ui-enabled-filters" type="checkbox">
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

    mount.append(summary, activeSummary, uiToggle);
    if (activeChips.childNodes.length) mount.appendChild(activeChips);
    mount.append(globalSearch, toggles);

    const mangaIndexControl = renderMangaIndexControl();
    if (mangaIndexControl) mount.appendChild(mangaIndexControl);

    if (nativeSort) {
      const serverSortField = document.createElement("label");
      serverSortField.className = "ymo-field";
      serverSortField.innerHTML = `
        <span>Search sort</span>
        <select id="ymo-server-sort"></select>
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
      mount.appendChild(serverSortField);
    }

    if (showDisplaySort) {
      const sortField = document.createElement("label");
      sortField.className = "ymo-field";
      sortField.innerHTML = `
        <span>Display sort</span>
        <select id="ymo-archive-sort">
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
      mount.appendChild(sortField);
    }

    const toolbar = document.createElement("div");
    toolbar.className = "ymo-toolbar-row";

    const moveBtn = document.createElement("button");
    moveBtn.type = "button";
    moveBtn.className = "ymo-btn";
    moveBtn.textContent = "Move panel";
    moveBtn.addEventListener("click", () => {
      state.archive.dock = state.archive.dock === "right" ? "left" : "right";
      saveState();
      applyPanelSide();
    });

    const markReadBtn = document.createElement("button");
    markReadBtn.type = "button";
    markReadBtn.className = "ymo-btn";
    markReadBtn.textContent = "Mark visible read";
    markReadBtn.addEventListener("click", markVisiblePageRead);

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "ymo-btn";
    clearBtn.textContent = "Clear filters";
    clearBtn.addEventListener("click", resetArchiveFilters);

    if (hasNativeRouting && !shouldDebounceNativeFacetApply()) {
      const applySearchBtn = document.createElement("button");
      applySearchBtn.type = "button";
      applySearchBtn.className = "ymo-btn";
      applySearchBtn.textContent = "Apply search filters";
      applySearchBtn.addEventListener("click", () => {
        applyNativeFacetUrl(state.archive.serverSort || nativeSort?.value || "");
      });
      toolbar.append(applySearchBtn);
    }

    toolbar.append(moveBtn, markReadBtn, clearBtn);
    mount.appendChild(toolbar);

    const facetIntro = document.createElement("div");
    facetIntro.className = "ymo-help";
    facetIntro.textContent = hasNativeRouting
      ? (shouldDebounceNativeFacetApply()
          ? "Native search facets copied into the panel. Include terms sync to ep_filter_* params, exclude terms persist as MRM client filters, the original .ep-search-sidebar can stay hidden, and search pages auto-apply after a short pause."
          : "Native search facets copied into the panel. Include terms sync to ep_filter_* params, exclude terms persist as MRM client filters, and the original .ep-search-sidebar can stay hidden.")
      : "Synthetic facets built from the visible listing cards so the same panel works on archive pages too.";
    mount.appendChild(facetIntro);

    const facetStack = document.createElement("div");
    facetStack.className = "ymo-facet-stack";
    for (const facet of facets) {
      facetStack.appendChild(createFacetWidget(facet));
    }
    mount.appendChild(facetStack);
  }

  function renderGridPane() {

    const mount = document.getElementById("ymo-tab-grid");
    if (!mount) return;

    mount.replaceChildren();

    const configBlock = document.createElement("div");
    configBlock.className = "ymo-grid-controls";

    const uiToggle = document.createElement("label");
    uiToggle.className = "ymo-check";
    uiToggle.style.marginBottom = "10px";
    uiToggle.innerHTML = `
      <input id="ymo-ui-enabled" type="checkbox">
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
    uiHint.className = "ymo-grid-value";
    uiHint.textContent = "Turns the custom archive/search/post UI on or off. Reader popup still works.";

    configBlock.append(uiToggle, uiHint);

    const controls = document.createElement("div");
    controls.className = "ymo-grid-controls";

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
      valueEl.className = "ymo-grid-value";
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

function getFacetVocabularySignature() {
    const facets = getAvailableFilterFacets();
    return JSON.stringify(
      facets.map((facet) => ({
        key: facet.key,
        options: facet.options.map((option) => option.raw),
      }))
    );
  }

  function refreshArchiveUi(reason = "") {
    if (!shouldRunArchiveMode()) return;
    hideAds();

    const previousSignature = state.archivePerf.cardSignature || "";
    const previousVocabularySignature = state.archivePerf.facetVocabularySignature || "";
    markCards();
    sortCards();
    applyArchiveFilter();

    const nextFacetSignature = JSON.stringify({
      onlyEnglish: state.archive.onlyEnglish,
      hideRead: state.archive.hideRead,
      termModes: state.archive.termModes,
    });
    const nextVocabularySignature = getFacetVocabularySignature();

    if (
      previousSignature !== state.archivePerf.cardSignature ||
      state.archivePerf.renderedFacetSignature !== nextFacetSignature ||
      previousVocabularySignature !== nextVocabularySignature
    ) {
      renderFiltersPane();
      state.archivePerf.renderedFacetSignature = nextFacetSignature;
      state.archivePerf.facetVocabularySignature = nextVocabularySignature;
    }
  }

  function scheduleArchiveRefresh(reason = "") {
    if (archiveRefreshTimer) return;
    const fastAppend = reason === "append-cards" || String(reason).startsWith("pagetual:");
    archiveRefreshTimer = window.setTimeout(() => {
      archiveRefreshTimer = 0;
      refreshArchiveUi(reason);
    }, fastAppend ? (isLowPowerDevice() ? 80 : 30) : (isLowPowerDevice() ? 140 : 80));
  }

  function installPagetualHooks() {
    if (pagetualHooksInstalled) return;
    pagetualHooksInstalled = true;

    const queueRefresh = rafThrottle((reason) => {
      window.setTimeout(() => scheduleArchiveRefresh(reason), isLowPowerDevice() ? 120 : 40);
    });

    window.addEventListener("message", (event) => {
      const data = event.data || {};
      const command = String(data.command || "").toLowerCase();
      const action = String(data.action || "").toLowerCase();
      if (!["pagetual", "patetual"].includes(command)) return;
      if (!["insert", "lastpage", "loaded", "append"].includes(action)) return;
      queueRefresh(`pagetual:${action}`);
    });

    for (const eventName of ["pagetual:insert", "pagetual:lastpage", "AutoPatchWork.DOMNodeInserted", "autopagerize_DOMNodeInserted"]) {
      window.addEventListener(eventName, () => queueRefresh(eventName), { passive: true });
      document.addEventListener(eventName, () => queueRefresh(eventName), { passive: true });
    }
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
      let onlyCardsAppended = true;

      for (const mutation of mutations) {
        if (mutation.type !== "childList") continue;

        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.closest?.("#ymo-panel, #ymo-facet-modal, #ymo-reader-overlay")) continue;

          const isCardLike =
            node.matches?.("article.entry, article.post, article.post-standard, article.hentry, article.herald-lay-i, .pagetual-page") ||
            node.querySelector?.("article.entry, article.post, article.post-standard, article.hentry, article.herald-lay-i");

          const isUiLike =
            node.matches?.(".gallery, a.tagchip, .ep-search-sidebar, .ep-search-wrapper, .pagination") ||
            node.querySelector?.(".gallery, a.tagchip, .ep-search-sidebar, .ep-search-wrapper, .pagination");

          if (isCardLike || isUiLike) {
            shouldRefresh = true;
          }
          if (!isCardLike || isUiLike) {
            onlyCardsAppended = false;
          }
          if (shouldRefresh && !onlyCardsAppended) break;
        }

        if (shouldRefresh && !onlyCardsAppended) break;
      }

      if (!shouldRefresh) return;
      scheduleArchiveRefresh(onlyCardsAppended ? "append-cards" : "mutation");
    });

    state.observer.observe(root, {
      childList: true,
      subtree: true,
    });
  }


  function injectAdvancedFacetPanelStyles() {
    if (document.getElementById("ymo-advanced-facet-style")) return;

    const style = document.createElement("style");
    style.id = "ymo-advanced-facet-style";
    style.textContent = `
      .ymo-panel {
        width: min(460px, calc(100vw - 24px)) !important;
        max-height: min(86vh, 980px) !important;
      }

      .ymo-panel-toggle,
      .ymo-btn,
      .ymo-facet-widget__toggle,
      .ymo-facet-row__btn,
      .ymo-field input,
      .ymo-field select {
        touch-action: manipulation;
      }

      .ymo-check-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }

      .ymo-field--manga-index {
        margin-bottom: 12px;
      }

      .ymo-selected-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 0 0 12px;
      }

      .ymo-selected-chip {
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(255,255,255,.04);
        color: var(--ymo-text);
        cursor: pointer;
      }

      .ymo-selected-chip.is-include {
        background: rgba(37,194,160,.14);
        border-color: rgba(37,194,160,.28);
      }

      .ymo-selected-chip.is-exclude {
        background: rgba(255,92,143,.12);
        border-color: rgba(255,92,143,.28);
      }

      .ymo-facet-stack {
        display: grid;
        gap: 8px;
      }

      .ymo-facet-widget {
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 14px;
        background: rgba(255,255,255,.03);
        overflow: hidden;
      }

      .ymo-facet-widget.is-collapsed .ymo-facet-widget__content {
        display: none !important;
      }

      .ymo-facet-widget__head,
      .ymo-facet-widget__toolbar,
      .ymo-facet-widget__footer {
        padding: 8px 10px;
      }

      .ymo-facet-widget__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border-bottom: 1px solid rgba(255,255,255,.06);
      }

      .ymo-facet-widget__toggle {
        width: 100%;
        appearance: none;
        background: transparent;
        border: 0;
        color: inherit;
        text-align: left;
        cursor: pointer;
      }

      .ymo-facet-widget__title-wrap {
        min-width: 0;
        display: grid;
        gap: 2px;
      }

      .ymo-facet-widget__indicator {
        color: var(--ymo-muted);
        font-size: 12px;
        line-height: 1;
        flex: 0 0 auto;
      }

      .ymo-facet-widget__title {
        font-size: 12px;
        font-weight: 800;
      }

      .ymo-facet-widget__meta,
      .ymo-facet-widget__caption,
      .ymo-facet-empty,
      .ymo-facet-modal__summary {
        color: var(--ymo-muted);
        font-size: 11px;
      }

      .ymo-facet-widget__toolbar {
        display: grid;
        gap: 8px;
        border-bottom: 1px solid rgba(255,255,255,.04);
      }

      .ymo-facet-widget__toolbar-actions {
        display: flex;
        justify-content: flex-end;
      }

      .ymo-btn--small {
        min-height: 24px;
        width: auto;
        min-width: 0;
        flex: 0 0 auto;
        white-space: nowrap;
        padding: 0 8px;
        font-size: 10px;
      }

      .ymo-facet-search {
        width: 100%;
        min-width: 0;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 10px;
        padding: 8px 10px;
        background: rgba(255,255,255,.04);
        color: var(--ymo-text);
        font: inherit;
      }

      .ymo-facet-list {
        display: grid;
        gap: 6px;
        padding: 8px 10px;
      }

      .ymo-facet-term {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 10px;
        padding: 8px 10px;
        background: rgba(255,255,255,.02);
      }

      .ymo-facet-term__info {
        min-width: 0;
        display: grid;
        gap: 2px;
      }

      .ymo-facet-term__name {
        font-size: 11px;
        font-weight: 700;
        color: var(--ymo-text);
        overflow-wrap: anywhere;
      }

      .ymo-facet-term__controls {
        display: inline-flex;
        gap: 4px;
        align-items: center;
      }

      .ymo-facet-mode-btn,
      .ymo-facet-page-btn {
        min-height: 22px;
        width: auto;
        min-width: 0;
        flex: 0 0 auto;
        white-space: nowrap;
        padding: 0 7px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(255,255,255,.04);
        color: var(--ymo-text);
        cursor: pointer;
        font: 700 10px/1 system-ui,-apple-system,sans-serif;
      }

      .ymo-facet-mode-btn.is-in {
        background: rgba(37,194,160,.14);
        border-color: rgba(37,194,160,.28);
      }

      .ymo-facet-mode-btn.is-out {
        background: rgba(255,92,143,.12);
        border-color: rgba(255,92,143,.28);
      }

      .ymo-facet-widget__footer,
      .ymo-facet-pager {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }

      .ymo-facet-page-btn.is-active {
        background: rgba(124,92,255,.18);
        border-color: rgba(124,92,255,.35);
      }

      #ymo-facet-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 2147483600;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(8, 10, 18, 0.78);
        backdrop-filter: blur(8px);
      }

      #ymo-facet-modal-backdrop.is-open {
        display: flex;
      }

      .ymo-facet-modal {
        width: min(920px, calc(100vw - 24px));
        max-height: min(88vh, 980px);
        overflow: hidden;
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(10,16,28,.98);
        box-shadow: var(--ymo-shadow);
      }

      .ymo-facet-modal__head,
      .ymo-facet-modal__toolbar,
      .ymo-facet-modal__footer {
        padding: 14px 16px;
        border-bottom: 1px solid rgba(255,255,255,.06);
      }

      .ymo-facet-modal__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .ymo-facet-modal__title {
        font-size: 18px;
        font-weight: 800;
      }

      .ymo-facet-modal__body {
        overflow: auto;
        display: grid;
        gap: 10px;
        padding: 16px;
      }

      .ymo-facet-modal__footer {
        border-bottom: 0;
        border-top: 1px solid rgba(255,255,255,.06);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      @media (max-width: 760px) {
        .ymo-panel {
          width: min(100vw - 12px, 460px) !important;
          bottom: 12px !important;
        }

        .ymo-check-grid {
          grid-template-columns: 1fr;
        }

        .ymo-facet-term {
          grid-template-columns: 1fr;
        }

        .ymo-facet-term__controls,
        .ymo-facet-widget__footer,
        .ymo-facet-pager,
        .ymo-facet-modal__footer {
          justify-content: flex-start;
        }
      }
    `;
    document.head.appendChild(style);
  }



  function isDiscordPromoCard(article) {
    if (!(article instanceof HTMLElement)) return false;
    const title = (
      article.querySelector(".entry-title, .post-title, h2, h3, h4, .archive-title")?.textContent ||
      article.textContent ||
      ""
    ).trim().toLowerCase();
    const href = (article.querySelector("a[href]")?.getAttribute("href") || "").toLowerCase();
    const classes = String(article.className || "").toLowerCase();
    return /discord/.test(title) || /discord/.test(href) || /\bsticky\b/.test(classes);
  }

  function normalizePinnedPromoCards() {
    const cards = Array.from(document.querySelectorAll("article"));
    if (!cards.length) return;

    const moveTargets = cards.filter((article) => isDiscordPromoCard(article));
    if (!moveTargets.length) return;

    const container = resolveCardContainer(moveTargets) || moveTargets[0]?.parentElement;
    if (!(container instanceof HTMLElement)) return;

    for (const article of moveTargets) {
      article.classList.remove("sticky");
      article.dataset.ymoPromo = "1";
      container.appendChild(article);
    }
  }

  function getArchiveSearchValue() {
    const candidates = [
      document.querySelector("input[type='search'][name='s']"),
      document.querySelector("input[type='text'][name='s']"),
      document.querySelector(".search-form input[type='search']"),
      document.querySelector("form.searchform input[type='text']"),
    ];
    for (const input of candidates) {
      if (input instanceof HTMLInputElement) return input.value || "";
    }
    return "";
  }

  function toggleYmoSidebar() {
    const triggerSelectors = [
      "#herald-responsive-header .herald-nav-toggle",
      ".herald-responsive-header .herald-nav-toggle",
      ".herald-nav-toggle",
      ".toggle-sidebar",
      ".sidebar-toggle",
      ".nav-toggle",
      ".menu-toggle",
      ".toggle-nav",
      "[data-toggle='sidebar']",
      "[aria-controls*='sidebar']",
      ".icon-sidebar",
    ];

    for (const selector of triggerSelectors) {
      const trigger = document.querySelector(selector);
      if (trigger instanceof HTMLElement && !trigger.closest("#ymo-mrm-header")) {
        trigger.click();
        return;
      }
    }

    const mobileNav = document.querySelector(".herald-mobile-nav");
    const responsiveHeader = document.getElementById("herald-responsive-header");
    if (mobileNav instanceof HTMLElement) {
      const shouldOpen = !mobileNav.classList.contains("open") && !mobileNav.classList.contains("is-open");
      mobileNav.classList.toggle("open", shouldOpen);
      mobileNav.classList.toggle("is-open", shouldOpen);
      document.body.classList.toggle("ymo-mobile-nav-open", shouldOpen);
      document.documentElement.classList.toggle("ymo-mobile-nav-open", shouldOpen);
      if (responsiveHeader instanceof HTMLElement) responsiveHeader.classList.add("open");
      return;
    }

    document.body.classList.toggle("mobile-sidebar-open");
    document.body.classList.toggle("is-sidebar-open");
    document.documentElement.classList.toggle("mobile-sidebar-open");
  }

  function submitYmoSearch(form) {
    if (!(form instanceof HTMLFormElement)) return;
    const input = form.querySelector("input[name='s']");
    if (!(input instanceof HTMLInputElement)) return;

    const value = input.value.trim();
    if (value) {
      const url = new URL(location.href);
      url.searchParams.set("s", value);
      url.searchParams.delete("post_type");
      location.href = url.toString();
      return;
    }

    form.submit();
  }

  function injectMrmArchiveOverrides() {
    if (document.getElementById("ymo-mrm-archive-overrides-v1")) return;

    const style = document.createElement("style");
    style.id = "ymo-mrm-archive-overrides-v1";
    style.textContent = `
      :root {
        --ymo-bg: #0b101b !important;
        --ymo-bg-2: #111827 !important;
        --ymo-panel: rgba(13, 18, 31, 0.94) !important;
        --ymo-panel-2: rgba(16, 22, 38, 0.98) !important;
        --ymo-soft: rgba(255,255,255,.05) !important;
        --ymo-soft-2: rgba(255,255,255,.035) !important;
        --ymo-line: rgba(255,255,255,.09) !important;
        --ymo-line-2: rgba(255,255,255,.16) !important;
        --ymo-text: #eef2fb !important;
        --ymo-muted: #9aa7bc !important;
        --ymo-accent: #7c5cff !important;
        --ymo-accent-2: #6f8bff !important;
        --ymo-danger: #ff6a9c !important;
        --ymo-warning: #ffd26f !important;
        --ymo-shadow: 0 18px 42px rgba(0,0,0,.34) !important;
        --ymo-shadow-lg: 0 24px 56px rgba(0,0,0,.42) !important;
        --ymo-wrap: 1320px !important;
        color-scheme: dark !important;
      }

      body {
        background:
          radial-gradient(circle at top, rgba(124,92,255,.12), transparent 26%),
          radial-gradient(circle at 85% 10%, rgba(111,139,255,.07), transparent 18%),
          #0b101b !important;
      }

      .site-header,
      .herald-site-header,
      #header,
      .header-top,
      .header-middle,
      .header-bottom,
      .herald-ad-above-header,
      .herald-header-wraper {
        display: none !important;
      }

      .herald-mobile-nav {
        background: rgba(11, 16, 27, 0.98) !important;
        border-right: 1px solid rgba(255,255,255,.08) !important;
      }

      .herald-mobile-nav li a,
      .herald-mobile-nav li a:visited {
        color: #eef2fb !important;
      }

      .herald-mobile-nav li a:hover {
        background: rgba(124,92,255,.16) !important;
      }

      .herald-responsive-header,
      .herald-responsive-header a {
        background: #111827 !important;
        color: #eef2fb !important;
      }

      body.ymo-right-sidebar-enhanced .herald-sidebar {
        position: sticky;
        top: calc(76px + env(safe-area-inset-top));
        align-self: start;
      }

      body.ymo-right-sidebar-enhanced .herald-sidebar .widget {
        margin-bottom: 16px !important;
        border: 1px solid rgba(255,255,255,.08) !important;
        border-radius: 18px !important;
        background: linear-gradient(180deg, rgba(16,22,38,.96), rgba(10,15,28,.98)) !important;
        box-shadow: 0 18px 42px rgba(0,0,0,.26) !important;
        overflow: hidden !important;
      }

      body.ymo-right-sidebar-enhanced .herald-sidebar .widget-title,
      body.ymo-right-sidebar-enhanced .herald-sidebar h4.widget-title {
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
      }

      body.ymo-right-sidebar-enhanced .ymo-sidebar-widget__toggle {
        width: 100%;
        appearance: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-height: 48px;
        padding: 13px 16px;
        border: 0;
        background: rgba(255,255,255,.03);
        color: var(--ymo-text);
        font: 800 14px/1.2 Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        cursor: pointer;
      }

      body.ymo-right-sidebar-enhanced .ymo-sidebar-widget__toggle::after {
        content: "▾";
        color: var(--ymo-muted);
        transition: transform .18s ease;
      }

      body.ymo-right-sidebar-enhanced .widget.ymo-widget-collapsed .ymo-sidebar-widget__toggle::after {
        transform: rotate(-90deg);
      }

      body.ymo-right-sidebar-enhanced .ymo-sidebar-widget__body {
        padding: 14px 16px 16px;
        border-top: 1px solid rgba(255,255,255,.06);
      }

      body.ymo-right-sidebar-enhanced .widget.ymo-widget-collapsed .ymo-sidebar-widget__body {
        display: none !important;
      }

      body.ymo-right-sidebar-enhanced .herald-sidebar .widget ul,
      body.ymo-right-sidebar-enhanced .herald-sidebar .widget ol {
        display: grid;
        gap: 10px;
        margin: 0;
        padding-left: 18px;
      }

      body.ymo-right-sidebar-enhanced .herald-sidebar .widget select,
      body.ymo-right-sidebar-enhanced .herald-sidebar .widget input[type="search"],
      body.ymo-right-sidebar-enhanced .herald-sidebar .widget input[type="text"] {
        width: 100%;
        min-height: 42px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(255,255,255,.04);
        color: var(--ymo-text);
        padding: 0 12px;
      }

      body.ymo-right-sidebar-enhanced .herald-sidebar .tagcloud,
      body.ymo-right-sidebar-enhanced .herald-sidebar .wp-block-tag-cloud {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      body.ymo-right-sidebar-enhanced .herald-sidebar .tagcloud a,
      body.ymo-right-sidebar-enhanced .herald-sidebar .wp-block-tag-cloud a {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(255,255,255,.04);
        color: var(--ymo-text) !important;
        font-size: 12px !important;
        box-shadow: none !important;
      }

      .ymo-chip.is-link {
        cursor: pointer;
      }

      .ymo-chip.is-link:hover {
        background: rgba(124,92,255,.18) !important;
        border-color: rgba(124,92,255,.34) !important;
        color: #fff !important;
      }

      #ymo-mrm-header {
        position: sticky;
        top: 0;
        z-index: 2147482990;
        border-bottom: 1px solid rgba(255,255,255,.07);
        background:
          linear-gradient(180deg, rgba(9, 13, 23, 0.96), rgba(9, 13, 23, 0.88));
        backdrop-filter: blur(16px);
      }

      #ymo-mrm-header .ymo-mrm-header__wrap {
        max-width: var(--ymo-wrap);
        margin: 0 auto;
        padding: max(10px, env(safe-area-inset-top)) 16px 12px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) minmax(220px, 420px);
        align-items: center;
        gap: 12px;
      }

      #ymo-mrm-header .ymo-mrm-header__menu,
      #ymo-mrm-header .ymo-mrm-header__search-button {
        width: 46px;
        height: 46px;
        flex: 0 0 46px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,.08);
        background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 12px 28px rgba(0,0,0,.2);
      }

      #ymo-mrm-header .ymo-mrm-header__menu::before {
        content: "☰";
        font-size: 24px;
        line-height: 1;
      }

      #ymo-mrm-header .ymo-mrm-header__brand {
        min-width: 0;
        display: grid;
        gap: 2px;
      }

      #ymo-mrm-header .ymo-mrm-header__title,
      #ymo-mrm-header .ymo-mrm-header__title:visited {
        color: #fff !important;
        font-size: clamp(20px, 3.4vw, 28px);
        line-height: 1.05;
        font-weight: 800;
        letter-spacing: .01em;
      }

      #ymo-mrm-header .ymo-mrm-header__subtitle {
        color: var(--ymo-muted);
        font-size: 12px;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      #ymo-mrm-header .ymo-mrm-header__search {
        min-width: 0;
      }

      #ymo-mrm-header .ymo-mrm-header__search-form {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 52px;
        margin: 0;
        padding: 8px 8px 8px 12px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 16px;
        background: rgba(255,255,255,.04);
        box-shadow: 0 16px 36px rgba(0,0,0,.18);
      }

      #ymo-mrm-header .ymo-mrm-header__search-form::before {
        content: "⌕";
        color: var(--ymo-muted);
        font-size: 20px;
        line-height: 1;
      }

      #ymo-mrm-header .ymo-mrm-header__search-input {
        min-width: 0;
        flex: 1 1 auto;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--ymo-text);
        font: inherit;
        padding: 0;
        margin: 0;
      }

      #ymo-mrm-header .ymo-mrm-header__search-input::placeholder {
        color: var(--ymo-muted);
        opacity: 1;
      }

      #ymo-mrm-header .ymo-mrm-header__search-button {
        padding: 0 14px;
        width: auto;
        min-width: 46px;
        background: linear-gradient(135deg, var(--ymo-accent), #6d7cff);
        border-color: rgba(124,92,255,.42);
        box-shadow: 0 14px 32px rgba(124,92,255,.28);
      }

      #ymo-mrm-header .ymo-mrm-header__search-button::before {
        content: "Search";
        font-size: 13px;
        font-weight: 800;
        letter-spacing: .01em;
      }

      .nav-primary {
        top: calc(env(safe-area-inset-top) + 70px) !important;
        background: rgba(10, 14, 24, 0.82) !important;
      }

      .content-archive,
      .ymo-results-grid {
        gap: 20px !important;
      }

      article[data-ymo-promo="1"] {
        order: 998 !important;
      }

      article[data-ymo-promo="1"] .entry-title::before,
      article[data-ymo-promo="1"] .post-title::before,
      article[data-ymo-promo="1"] h2::before,
      article[data-ymo-promo="1"] h3::before {
        content: "Community";
        display: inline-flex;
        align-items: center;
        min-height: 22px;
        margin: 0 0 8px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid rgba(124,92,255,.22);
        background: rgba(124,92,255,.12);
        color: #ddd8ff;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .02em;
      }

      article[data-ymo-promo="1"] [class*="pin"],
      article[data-ymo-promo="1"] .sticky-post,
      article[data-ymo-promo="1"] .post-sticky,
      article[data-ymo-promo="1"] .fa-thumb-tack,
      article[data-ymo-promo="1"] .fa-thumbtack,
      article[data-ymo-promo="1"] .dashicons-sticky {
        display: none !important;
      }

      .ymo-panel-toggle {
        width: 56px !important;
        height: 56px !important;
        right: max(16px, env(safe-area-inset-right)) !important;
        bottom: max(16px, env(safe-area-inset-bottom)) !important;
        border-radius: 18px !important;
        background: linear-gradient(135deg, #7c5cff, #6d7cff) !important;
        box-shadow: 0 18px 38px rgba(124,92,255,.34) !important;
      }

      .ymo-panel {
        bottom: calc(max(16px, env(safe-area-inset-bottom)) + 70px) !important;
        border-radius: 22px !important;
        background: rgba(10, 15, 26, 0.98) !important;
      }

      .ymo-btn,
      .ymo-chip,
      .ymo-reader-trigger,
      .ymo-tab {
        border-radius: 14px !important;
      }

      @media (max-width: 920px) {
        #ymo-mrm-header .ymo-mrm-header__wrap {
          grid-template-columns: auto minmax(0, 1fr);
          gap: 10px;
          padding-left: 12px;
          padding-right: 12px;
        }

        #ymo-mrm-header .ymo-mrm-header__search {
          grid-column: 1 / -1;
        }

        #ymo-mrm-header .ymo-mrm-header__search-form {
          min-height: 48px;
          padding: 7px 7px 7px 12px;
          border-radius: 14px;
        }

        #ymo-mrm-header .ymo-mrm-header__menu,
        #ymo-mrm-header .ymo-mrm-header__search-button {
          width: 44px;
          height: 44px;
          border-radius: 14px;
        }

        #ymo-mrm-header .ymo-mrm-header__search-button {
          min-width: 44px;
          padding: 0 12px;
        }

        #ymo-mrm-header .ymo-mrm-header__menu::before {
          content: "☰";
          font-size: 22px;
          line-height: 1;
        }

        #ymo-mrm-header .ymo-mrm-header__search-button::before {
          content: "⌕";
          font-size: 18px;
          line-height: 1;
        }

        #ymo-mrm-header .ymo-mrm-header__title {
          font-size: 22px;
        }

        #ymo-mrm-header .ymo-mrm-header__subtitle {
          font-size: 11px;
        }

        .nav-primary {
          top: calc(env(safe-area-inset-top) + 116px) !important;
        }
      }

      @media (max-width: 640px) {
        #ymo-mrm-header .ymo-mrm-header__wrap {
          grid-template-columns: 44px minmax(0, 1fr);
        }

        #ymo-mrm-header .ymo-mrm-header__subtitle {
          display: none;
        }

        #ymo-mrm-header .ymo-mrm-header__search {
          grid-column: 1 / -1;
        }

        #ymo-mrm-header .ymo-mrm-header__search-form {
          min-height: 46px;
        }

        #ymo-mrm-header .ymo-mrm-header__search-button::before {
          content: "Go";
        }

        .ymo-panel {
          width: min(100vw - 12px, 460px) !important;
          left: 6px !important;
          right: 6px !important;
          bottom: calc(max(8px, env(safe-area-inset-bottom)) + 72px) !important;
          max-height: min(76vh, 840px) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function injectMrmArchiveHeader() {
    if (isSinglePostPage() || isReaderPopupPage()) return;
    if (document.getElementById("ymo-mrm-header")) return;

    const mount =
      document.querySelector(".nav-primary")?.parentElement ||
      document.querySelector("#page") ||
      document.body;

    if (!(mount instanceof HTMLElement)) return;

    const header = document.createElement("header");
    header.id = "ymo-mrm-header";

    const wrap = document.createElement("div");
    wrap.className = "ymo-mrm-header__wrap";

    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "ymo-mrm-header__menu";
    menuButton.setAttribute("aria-label", "Toggle sidebar");
    menuButton.addEventListener("click", toggleYmoSidebar, { passive: true });

    const brand = document.createElement("div");
    brand.className = "ymo-mrm-header__brand";

    const title = document.createElement("a");
    title.className = "ymo-mrm-header__title";
    title.href = "/";
    title.textContent = "Yaoi Manga Online";

    const subtitle = document.createElement("div");
    subtitle.className = "ymo-mrm-header__subtitle";
    subtitle.textContent = "Archive • reader • filters";

    brand.append(title, subtitle);

    const search = document.createElement("div");
    search.className = "ymo-mrm-header__search";

    const form = document.createElement("form");
    form.className = "ymo-mrm-header__search-form";
    form.action = "/";
    form.method = "get";

    const input = document.createElement("input");
    input.className = "ymo-mrm-header__search-input";
    input.type = "search";
    input.name = "s";
    input.placeholder = "Search archive";
    input.autocomplete = "off";
    input.value = getArchiveSearchValue();

    const button = document.createElement("button");
    button.type = "submit";
    button.className = "ymo-mrm-header__search-button";
    button.setAttribute("aria-label", "Search");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitYmoSearch(form);
    });

    form.append(input, button);
    search.appendChild(form);
    wrap.append(menuButton, brand, search);
    header.appendChild(wrap);

    mount.insertBefore(header, mount.firstChild);
  }


  function enhanceRightSidebar() {
    if (isSinglePostPage() || isReaderPopupPage()) return;

    const sidebar = document.querySelector(".herald-sidebar.herald-sidebar-right, .herald-sidebar-right");
    if (!(sidebar instanceof HTMLElement)) return;

    document.body.classList.add("ymo-right-sidebar-enhanced");
    const savedState = getSidebarWidgetState();
    const widgets = Array.from(sidebar.querySelectorAll(":scope > .widget"))
      .filter((widget) => widget instanceof HTMLElement)
      .filter((widget) => !widget.classList.contains("sf-hidden"))
      .filter((widget) => {
        const bodyText = widget.textContent?.replace(/\s+/g, " ").trim() || "";
        const hasTitle = widget.querySelector(".widget-title, h4, h3");
        const hasBody = widget.querySelector("ul, ol, select, form, .tagcloud, .wp-block-tag-cloud, .textwidget, .menu");
        return Boolean(hasTitle || hasBody || bodyText);
      });

    for (const widget of widgets) {
      const titleNode = widget.querySelector(":scope > .widget-title, :scope > h4.widget-title, :scope > h3.widget-title");
      const existingBody = widget.querySelector(":scope > .ymo-sidebar-widget__body");
      const widgetId = widget.id || slugify(titleNode?.textContent || widget.textContent || "sidebar-widget");
      const titleText = titleNode?.textContent?.trim() || "Widget";

      if (!(existingBody instanceof HTMLElement)) {
        const body = document.createElement("div");
        body.className = "ymo-sidebar-widget__body";

        const children = Array.from(widget.childNodes);
        for (const child of children) {
          if (child === titleNode) continue;
          body.appendChild(child);
        }

        if (titleNode instanceof HTMLElement) {
          titleNode.replaceChildren();
          const button = document.createElement("button");
          button.type = "button";
          button.className = "ymo-sidebar-widget__toggle";
          button.textContent = titleText;
          button.setAttribute("aria-expanded", "true");
          titleNode.appendChild(button);

          button.addEventListener("click", () => {
            const stateMap = getSidebarWidgetState();
            const nextCollapsed = !widget.classList.contains("ymo-widget-collapsed");
            widget.classList.toggle("ymo-widget-collapsed", nextCollapsed);
            button.setAttribute("aria-expanded", String(!nextCollapsed));
            stateMap[widgetId] = nextCollapsed;
            saveSidebarWidgetState(stateMap);
          });
        }

        widget.appendChild(body);
      }

      const collapsed = Boolean(savedState[widgetId]);
      widget.classList.toggle("ymo-widget-collapsed", collapsed);
      const button = widget.querySelector(":scope > .widget-title .ymo-sidebar-widget__toggle, :scope > h4.widget-title .ymo-sidebar-widget__toggle, :scope > h3.widget-title .ymo-sidebar-widget__toggle");
      if (button instanceof HTMLButtonElement) {
        button.setAttribute("aria-expanded", String(!collapsed));
      }
    }
  }


  function injectTypographyStyles() {
    if (document.getElementById("ymo-typography-style-v1")) return;

    const style = document.createElement("style");
    style.id = "ymo-typography-style-v1";
    style.textContent = `
      :root {
        --ymo-font-sans: "Inter var", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        --ymo-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        --ymo-type-2xs: 10px;
        --ymo-type-xs: 11px;
        --ymo-type-sm: 12px;
        --ymo-type-ui: 13px;
        --ymo-type-base: 14px;
        --ymo-type-body: 15px;
        --ymo-type-lg: 18px;
        --ymo-type-xl: 22px;
        --ymo-type-title: clamp(28px, 4vw, 40px);
        --ymo-line-tight: 1.08;
        --ymo-line-title: 1.12;
        --ymo-line-ui: 1.25;
        --ymo-line-copy: 1.66;
        --ymo-tracking-tight: -0.025em;
        --ymo-tracking-ui: 0.01em;
      }

      html {
        -webkit-text-size-adjust: 100% !important;
        text-size-adjust: 100% !important;
      }

      body {
        font-family: var(--ymo-font-sans) !important;
        font-size: var(--ymo-type-base) !important;
        line-height: var(--ymo-line-copy) !important;
        text-rendering: optimizeLegibility !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
      }

      button,
      input,
      select,
      textarea,
      [class^="ymo-"],
      [class*=" ymo-"],
      #ymo-reader-modal,
      #ymo-reader-page {
        font-family: var(--ymo-font-sans) !important;
      }

      button,
      input,
      select,
      textarea {
        font-size: var(--ymo-type-ui) !important;
        line-height: var(--ymo-line-ui) !important;
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
      .ymo-panel__title,
      .ymo-facet-widget__title,
      .ymo-facet-modal__title,
      .ymo-reader-title,
      .ymo-reader-page__title,
      .ymo-post-hero__title {
        font-family: var(--ymo-font-sans) !important;
        font-weight: 800 !important;
        line-height: var(--ymo-line-title) !important;
        letter-spacing: var(--ymo-tracking-tight) !important;
        text-wrap: balance;
      }

      h1,
      .entry-title,
      .page-title,
      body.ymo-single-post-page .entry-title {
        font-size: var(--ymo-type-title) !important;
      }

      h2,
      .post-title,
      .ymo-reader-page__title-text {
        font-size: clamp(20px, 2.4vw, 28px) !important;
      }

      h3,
      .ymo-panel__title,
      .ymo-facet-modal__title {
        font-size: var(--ymo-type-lg) !important;
      }

      .entry-content,
      .post-content,
      .post-entry,
      article .entry,
      body.ymo-single-post-page .entry-content,
      body.ymo-single-post-page .post-content {
        font-size: var(--ymo-type-body) !important;
        line-height: var(--ymo-line-copy) !important;
      }

      .entry-content p,
      .post-content p,
      .post-entry p,
      body.ymo-single-post-page .entry-content p,
      body.ymo-single-post-page .post-content p {
        margin-top: 0 !important;
        margin-bottom: 1em !important;
      }

      .ymo-results-grid article .entry-title,
      .ymo-results-grid article .post-title,
      .ymo-results-grid article .entry-title-link,
      .ymo-results-grid article .post-title a {
        font-size: var(--ymo-type-body) !important;
        line-height: 1.35 !important;
        font-weight: 740 !important;
        letter-spacing: -0.012em !important;
      }

      .ymo-chip,
      .ymo-status-pill,
      .ymo-panel__meta,
      .ymo-facet-widget__count,
      .ymo-facet-term,
      .ymo-theme-section__title,
      .ymo-reader-page__counter,
      .ymo-reader-page__hint,
      .ymo-reader-page__button,
      .ymo-reader-control,
      .ymo-reader-chip {
        font-size: var(--ymo-type-sm) !important;
        line-height: var(--ymo-line-ui) !important;
        letter-spacing: var(--ymo-tracking-ui) !important;
      }

      .ymo-panel__title,
      .ymo-facet-widget__title,
      .ymo-theme-section__title,
      .ymo-reader-title,
      .ymo-reader-page__button,
      .ymo-reader-control,
      .ymo-chip,
      .ymo-status-pill {
        text-transform: none !important;
      }

      .ymo-facet-widget__count,
      .ymo-term-count,
      .ymo-reader-page__counter,
      .ymo-reader-progress,
      .ymo-panel__meta {
        font-variant-numeric: tabular-nums !important;
      }

      .ymo-reader-page__title,
      .ymo-reader-title {
        min-width: 0 !important;
      }

      .ymo-reader-page__title-text,
      .ymo-reader-title,
      .ymo-results-grid article .entry-title,
      .ymo-results-grid article .post-title {
        overflow-wrap: anywhere !important;
      }

      @media (max-width: 720px) {
        :root {
          --ymo-type-base: 13px;
          --ymo-type-body: 14px;
          --ymo-type-title: clamp(24px, 8vw, 32px);
        }

        .ymo-results-grid article .entry-title,
        .ymo-results-grid article .post-title,
        .ymo-results-grid article .entry-title-link,
        .ymo-results-grid article .post-title a {
          font-size: 14px !important;
          line-height: 1.32 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function initListingPageModule() {
  injectStyles();
  injectAdvancedFacetPanelStyles();
  applyGridVars();
  normalizePinnedPromoCards();
  injectMrmArchiveHeader();
  enhanceRightSidebar();

  markCards();

  const container = state.cardContainer || resolveCardContainer(state.cards.map((card) => card.article));
  if (container) container.classList.add("ymo-results-grid");

  createPanel();
  ensureReaderModal();
  sortCards();
  applyArchiveFilter();
  renderFiltersPane();
  trackReadClicks();
  closeMobileChipPopoversOnOutsideClick();
  installPagetualHooks();
  observeChanges();

  if (document.body && !isLowPowerDevice()) {
    footerObserver.observe(document.body, { childList: true, subtree: true });
  }
}

function initPostPageModule() {
  cleanupSinglePostLayoutArtifacts();
  injectSinglePostReaderEntryButton();
}

function initReaderPageModule() {
  initReaderPage();
}


function injectModernDarkFlatThemeStyles() {
  const existing = document.getElementById("ymo-modern-dark-flat-style-v1");
  if (existing) {
    document.head.appendChild(existing);
    injectStrictDarkFlatThemeStyles();
    return;
  }

  const style = document.createElement("style");
  style.id = "ymo-modern-dark-flat-style-v1";
  style.textContent = `
    :root {
      color-scheme: dark !important;
      --ymo-accent-rgb: 124, 92, 255 !important;
      --ymo-bg: #050506 !important;
      --ymo-bg-2: #08090b !important;
      --ymo-panel: #0d0e12 !important;
      --ymo-panel-2: #111218 !important;
      --ymo-soft: #151720 !important;
      --ymo-soft-2: #101118 !important;
      --ymo-line: transparent !important;
      --ymo-line-2: transparent !important;
      --ymo-text: #f5f7fb !important;
      --ymo-muted: #a9b2c3 !important;
      --ymo-shadow: none !important;
      --ymo-shadow-lg: none !important;
      --ymo-reader-bg: #050506 !important;
      --ymo-reader-bg-2: #08090b !important;
      --ymo-reader-surface: #0d0e12 !important;
      --ymo-reader-line: transparent !important;
      --ymo-reader-line-strong: transparent !important;
      --ymo-reader-text: #f5f7fb !important;
      --ymo-reader-muted: #a9b2c3 !important;
    }

    html,
    body,
    body.custom-background,
    html.ymo-reader-page,
    body.ymo-reader-page,
    body.ymo-single-post-page,
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
      color: var(--ymo-text) !important;
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
      .ymo-panel,
      .ymo-panel__head,
      .ymo-panel__body,
      .ymo-panel-toggle,
      .ymo-facet-widget,
      .ymo-facet-widget__head,
      .ymo-facet-widget__body,
      .ymo-facet-modal,
      .ymo-facet-modal__dialog,
      .ymo-reader-page__topbar,
      .ymo-reader-page__dock,
      .ymo-reader-page__thumbs,
      .ymo-reader-page__page,
      .ymo-reader-page__button,
      .ymo-reader-page__hint,
      .ymo-reader-page__empty,
      .ymo-reader-page__loading,
      #ymo-reader-dialog,
      #ymo-reader-overlay,
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
      .ymo-panel,
      .ymo-panel-toggle,
      .ymo-facet-widget,
      .ymo-facet-modal__dialog,
      .ymo-reader-page__topbar,
      .ymo-reader-page__dock,
      .ymo-reader-page__thumbs,
      #ymo-reader-dialog,
      .ymo-reader-page__page
    ) {
      background: #0d0e12 !important;
      color: var(--ymo-text) !important;
    }

    body :is(.content, .content-area, .site-content, main, .entry-content, .post-content, .post-entry, .entry-header, .entry-footer) {
      color: var(--ymo-text) !important;
    }

    body :is(.ymo-chip, .ymo-status-pill, .ymo-btn, .ymo-field input, .ymo-field select, .ymo-theme-swatch, .ymo-chip-overflow-button, .ymo-reader-control, .ymo-reader-chip, .ymo-reader-page__button, .pagination a, .pagination span, .entry-pagination a, .entry-pagination span, input, select, textarea, button) {
      background: #151720 !important;
      color: var(--ymo-text) !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    body :is(.ymo-chip:hover, .ymo-btn:hover, .ymo-chip-overflow-button:hover, .ymo-reader-control:hover, .ymo-reader-page__button:hover, .pagination a:hover, .entry-pagination a:hover, button:hover) {
      background: rgba(var(--ymo-accent-rgb), .18) !important;
      color: #ffffff !important;
    }

    body :is(.ymo-chip.is-active, .ymo-chip.is-include, .ymo-mode-btn.is-include, .ymo-status-pill.is-active, .ymo-btn.primary, .ymo-reader-control.is-active, .pagination .current, .entry-pagination .current, button.is-active) {
      background: var(--ymo-accent) !important;
      color: #ffffff !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    body :is(.ymo-chip.is-exclude, .ymo-mode-btn.is-exclude) {
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
      color: var(--ymo-accent) !important;
      text-decoration: none !important;
    }

    body :is(input, select, textarea)::placeholder {
      color: var(--ymo-muted) !important;
    }

    body :is(input, select, textarea, button, a):focus-visible {
      outline: 2px solid rgba(var(--ymo-accent-rgb), .76) !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    body :is(hr, table, tr, th, td, fieldset, legend, .entry-meta, .post-meta, .post-info, .post-comments, .comment, .comment-list, .comment-respond) {
      border-color: transparent !important;
      box-shadow: none !important;
      background-image: none !important;
    }

    body :is(.entry-meta, .post-meta, .post-info, .post-comments, .ymo-panel__meta, .ymo-facet-widget__count, .ymo-reader-page__counter, small) {
      color: var(--ymo-muted) !important;
    }

    body :is(img, picture, video, canvas, iframe) {
      box-shadow: none !important;
      border: 0 !important;
    }

    @media (max-width: 760px) {
      body :is(.site-inner, .content-sidebar-wrap, .content, .ymo-panel, article.entry, article.post, article.post-standard) {
        border-radius: 16px !important;
      }
    }
  `;
  document.head.appendChild(style);
  injectStrictDarkFlatThemeStyles();
}

function injectStrictDarkFlatThemeStyles() {
  const existing = document.getElementById("ymo-strict-dark-flat-polish-style-v2");
  if (existing) {
    document.head.appendChild(existing);
    return;
  }

  const style = document.createElement("style");
  style.id = "ymo-strict-dark-flat-polish-style-v2";
  style.textContent = `
    :root {
      color-scheme: dark !important;
      --ymo-bg: #050506 !important;
      --ymo-bg-2: #08090b !important;
      --ymo-panel: #0d0e12 !important;
      --ymo-panel-2: #111218 !important;
      --ymo-soft: #151720 !important;
      --ymo-soft-2: #101118 !important;
      --ymo-line: transparent !important;
      --ymo-line-2: transparent !important;
      --ymo-reader-line: transparent !important;
      --ymo-reader-line-strong: transparent !important;
      --ymo-shadow: none !important;
      --ymo-shadow-lg: none !important;
      --ymo-reader-bg: #050506 !important;
      --ymo-reader-bg-2: #08090b !important;
      --ymo-reader-surface: #0d0e12 !important;
      --ymo-text: #f5f7fb !important;
      --ymo-reader-text: #f5f7fb !important;
      --ymo-muted: #a9b2c3 !important;
      --ymo-reader-muted: #a9b2c3 !important;
    }

    html,
    body,
    body.custom-background,
    body[class*="reader-page"],
    #ymo-reader-page {
      background: #050506 !important;
      background-color: #050506 !important;
      background-image: none !important;
      color: var(--ymo-text, #f5f7fb) !important;
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
      color: var(--ymo-text, #f5f7fb) !important;
      border-color: transparent !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      filter: none !important;
    }

    body :where(
      [class^="ymo-"],
      [class*=" ymo-"],
      #ymo-reader-dialog,
      #ymo-reader-modal,
      #ymo-reader-overlay,
      #ymo-reader-page
    ) {
      background-image: none !important;
      border: 0 !important;
      box-shadow: none !important;
      text-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    body :where(
      [class^="ymo-panel"],
      [class*=" ymo-panel"],
      [class^="ymo-facet"],
      [class*=" ymo-facet"],
      [class^="ymo-reader-page__"],
      [class*=" ymo-reader-page__"],
      [class^="ymo-config"],
      [class*=" ymo-config"],
      [class^="ymo-modal"],
      [class*=" ymo-modal"],
      [class^="ymo-drawer"],
      [class*=" ymo-drawer"],
      [class^="ymo-sheet"],
      [class*=" ymo-sheet"],
      #ymo-reader-dialog,
      #ymo-reader-modal,
      #ymo-reader-page
    ) {
      background-color: #0d0e12 !important;
      color: var(--ymo-text, #f5f7fb) !important;
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
      [class^="ymo-btn"],
      [class*=" ymo-btn"],
      [class^="ymo-button"],
      [class*=" ymo-button"],
      [class^="ymo-chip"],
      [class*=" ymo-chip"],
      [class^="ymo-control"],
      [class*=" ymo-control"],
      [class^="ymo-mode-btn"],
      [class*=" ymo-mode-btn"],
      [class^="ymo-status-pill"],
      [class*=" ymo-status-pill"],
      [class^="ymo-theme-swatch"],
      [class*=" ymo-theme-swatch"],
      [class^="ymo-term-main"],
      [class*=" ymo-term-main"]
    ) {
      background: #151720 !important;
      background-image: none !important;
      color: var(--ymo-text, #f5f7fb) !important;
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
      [class^="ymo-btn"]:hover,
      [class*=" ymo-btn"]:hover,
      [class^="ymo-button"]:hover,
      [class*=" ymo-button"]:hover,
      [class^="ymo-chip"]:hover,
      [class*=" ymo-chip"]:hover,
      [class^="ymo-control"]:hover,
      [class*=" ymo-control"]:hover,
      [class^="ymo-term-main"]:hover,
      [class*=" ymo-term-main"]:hover
    ) {
      background: rgba(var(--ymo-accent-rgb, 124, 92, 255), .18) !important;
      color: #ffffff !important;
    }

    body :where(
      .is-active,
      .current,
      [aria-current="page"],
      [aria-pressed="true"],
      [class*="is-include"],
      [class*="primary"]
    ):where([class^="ymo-"], [class*=" ymo-"], button, a) {
      background: var(--ymo-accent, #7c5cff) !important;
      color: #ffffff !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    body :where([class*="is-exclude"]):where([class^="ymo-"], [class*=" ymo-"]) {
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
      color: var(--ymo-accent, #7c5cff) !important;
      text-decoration: none !important;
    }

    body :where(input, select, textarea, button, a):focus-visible {
      outline: 2px solid rgba(var(--ymo-accent-rgb, 124, 92, 255), .76) !important;
      outline-offset: 3px !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }

    body :where(img, picture, video, canvas, iframe, svg) {
      border: 0 !important;
      box-shadow: none !important;
    }

    body :where(.entry-meta, .post-meta, .post-info, .post-comments, small, [class*="__meta"], [class*="__count"], [class*="__counter"]) {
      color: var(--ymo-muted, #a9b2c3) !important;
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

  if (!window.__ymo_strictDarkFlatThemeOrderGuard) {
    window.__ymo_strictDarkFlatThemeOrderGuard = true;
    const keepLast = () => {
      const strictStyle = document.getElementById("ymo-strict-dark-flat-polish-style-v2");
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

  if (!isUiMakeoverEnabled()) {
    cleanupSinglePostLayoutArtifacts();
    showUiRestoreToggle();
    return;
  }

  removeBeforeFooterWidget();
  injectTypographyStyles();
  injectReaderModalStyles();
  hideAds();
  injectMrmArchiveOverrides();
  injectModernDarkFlatThemeStyles();

  const pageType = detectPageType();

  switch (pageType) {
    case "reader":
      initReaderPageModule();
      injectModernDarkFlatThemeStyles();
      return;
    case "post":
      initPostPageModule();
      injectModernDarkFlatThemeStyles();
      return;
    case "listing":
      initListingPageModule();
      injectModernDarkFlatThemeStyles();
      return;
    default:
      cleanupSinglePostLayoutArtifacts();
      return;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

window.addEventListener("beforeunload", clearScheduledNativeFacetApply);
})();