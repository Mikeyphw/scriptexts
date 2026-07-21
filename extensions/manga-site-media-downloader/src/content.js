// MRM Downloader Firefox Extension Content Script
(function () {
  "use strict";

  const {
    sanitizeFilename = (filename, fallback = "download") => String(filename || fallback).replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ").trim() || fallback,
    showToast = (message) => console.log("[MRM Toast]", message),
    appendDebugLog = () => {},
    logVerboseAction = async () => {},
    upsertActiveJob = async () => {},
    removeActiveJob = async () => {},
    getActiveJobs = async () => [],
    clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0)),
    normalizeLangTag = (value) => String(value || "").trim().toUpperCase(),
    splitTitleMeta = (title) => ({ rawTitle: String(title || ""), title: String(title || ""), artist: "", langs: [] }),
    buildPagedArchiveFilename = (meta, ext = "cbz") => sanitizeFilename(`${meta?.title || "download"}.${ext}`),
  } = window.MRMCommon || {};

  const directQueueDownloadLocks = new Set();
  const isAndroidRuntime = /Android/i.test(navigator.userAgent || "");

  let pageToastEnabled = true;
  let minimalQueueOverlayEnabled = true;
  let minimalQueueOverlayActiveOnly = false;
  let currentOverlayDrag = null;


  const imageSelectors = [
    ".img-myreadingmanga",
    ".img-myreadingmanga img",
    "article.post .entry-content img",
    "article.post .entry-content p > img",
    ".post .entry-content img",
    ".entry-content img",
    ".post-content img",
    ".single-post img",
    ".wp-block-image img",
    "figure img",
    ".separator img",
    "#image-container img",
    "#thumbnail-container .gallerythumb img",
    "img[decoding='async']",
  ];

  const archiveSelectors = [
    ".content-archive article.entry",
    ".content-archive article",
    ".content-archive .post",
    ".content-archive .type-post",
    ".content > .pad.group > article.post-standard",
    ".content .pad.group > article.post-standard",
    ".content article.post-standard",
    "main article.post-standard",
    ".index-container > .gallery",
    "#tag-container > a.tagchip",
    "main article",
    ".posts article",
    ".post-list article",
    ".blog-posts article",
    ".site-main article",
    ".content-area article",
    "article.post",
  ];

  const postContentSelectors = [
    "article.post .entry-content",
    ".post .entry-content",
    ".entry-content",
    "article .post-content",
    ".post-content",
  ];

  const excludedPaths = [
    "/about/",
    "/upload/",
    "/whats-that-book/",
    "/popular/",
    "/video/",
    "/cats/",
    "/pairing/",
    "/group/",
    "/privacy-policy/",
    "/dmca-notice/",
    "/contact/",
    "/terms-service/",
    "/sitemap/",
    "/my-bookmark/",
    "/tag/",
    "/genre/",
    "/status/",
    "/lang/",
    "/yaoi-manga/",
    "/manhwa/",
  ];

  const includedPaths = ["/tag/ai-generate/"];
  const currentPath = window.location.pathname;
  const isIncluded = includedPaths.some((path) => currentPath.startsWith(path));
  const isExcluded = excludedPaths.some((path) => currentPath.startsWith(path));
  const shouldExclude = isExcluded && !isIncluded;
  const POST_ACTION_ROOT_ID = "mrm-post-action-root";
  const DEBUG_PANEL_ID = "mrm-debug-panel";
  const LISTING_ACTION_SELECTOR = ".mrm-listing-shell";
  const PAGE_BRIDGE_ID = "mrm-page-fetch-bridge";
  const MODAL_FAB_ID = "mrm-popup-fab";
  const MODAL_OVERLAY_ID = "mrm-popup-modal-overlay";
  const MODAL_FRAME_ID = "mrm-popup-modal-frame";
  const AUTO_HASH = "#mrm-download-cbz";
  const COVER_GENERATION_HASH = "#mrm-generate-cover";
  const METADATA_HASH_PREFIX = "#mrm-extract-metadata=";
  const FLOAT_PREFS_KEY = "mrm-floating-ui-prefs-v1";
  let debugMode = false;
  let hideDownloadedListings = false;
  let hideQueuedListings = false;
  let debugEntries = [];
  let autoStarted = false;
  let nhentaiApiCache = null;
  let nhentaiApiPromise = null;
  let lastContentUrl = location.href;
  let routeRefreshTimer = 0;
  let currentJobState = null;
  let listingObserver = null;
  let listingRefreshTimer = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  function getDocumentUrl(doc = document) {
    return doc?.__mrmUrl || doc?.location?.href || doc?.defaultView?.location?.href || location.href;
  }

  function getDocumentOrigin(doc = document) {
    try {
      return new URL(getDocumentUrl(doc)).origin;
    } catch {
      return location.origin;
    }
  }

  function getDocumentHostname(doc = document) {
    try {
      return new URL(getDocumentUrl(doc)).hostname;
    } catch {
      return location.hostname;
    }
  }

  function getDocumentPathname(doc = document) {
    try {
      return new URL(getDocumentUrl(doc)).pathname;
    } catch {
      return location.pathname;
    }
  }

  function isMyReadingMangaUrl(url) {
    try {
      return new URL(url, location.href).hostname.replace(/^www\./, "") === "myreadingmanga.info";
    } catch {
      return false;
    }
  }

  function parseHtmlDocument(html, url) {
    const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    doc.__mrmUrl = new URL(url, location.href).href;
    const base = doc.createElement("base");
    base.href = doc.__mrmUrl;
    doc.head?.prepend(base);
    return doc;
  }

  function uint8ArrayToBase64(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
  }

  function normalizeBinaryPayload(body, bodyBase64) {
    if (typeof bodyBase64 === "string" && bodyBase64) {
      return base64ToUint8Array(bodyBase64);
    }
    if (body instanceof Uint8Array) return body;
    if (body instanceof ArrayBuffer) return new Uint8Array(body);
    if (ArrayBuffer.isView(body)) return new Uint8Array(body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength));
    if (Array.isArray(body)) return new Uint8Array(body);
    if (body && typeof body === "object") {
      const numericKeys = Object.keys(body)
        .filter((key) => /^\d+$/.test(key))
        .sort((a, b) => Number(a) - Number(b));
      if (numericKeys.length) {
        return new Uint8Array(numericKeys.map((key) => Number(body[key]) || 0));
      }
    }
    return new Uint8Array();
  }


  function normalizeImageSources(urls) {
    const unique = new Set();
    for (const value of urls) {
      if (!value) continue;
      try {
        const resolved = new URL(value, window.location.href).href;
        if (/\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i.test(resolved) || resolved.includes("/wp-content/")) {
          unique.add(resolved);
        }
      } catch {}
    }
    return Array.from(unique);
  }

  function getImageSourcesFromDocument(doc = document) {
    if (isNhentaiHost(doc)) {
      const apiData = parseNhentaiGalleryApi(doc);
      if (apiData?.pages?.length) {
        return normalizeImageSources(apiData.pages.map((page) => buildNhentaiImageUrl(page.path)).filter(Boolean));
      }
    }

    const content = getPostContent(doc) || doc;
    const seen = new Set();
    const imageSources = [];

    for (const selector of imageSelectors) {
      const images = Array.from(content.querySelectorAll(selector)).filter((img) => isLikelyContentImage(img, getDocumentUrl(doc)));
      if (!images.length) continue;
      for (const img of images) {
        const src = getBestImageSource(img, getDocumentUrl(doc));
        if (!src || seen.has(src)) continue;
        seen.add(src);
        imageSources.push(src);
      }
      if (imageSources.length) break;
    }

    return normalizeImageSources(imageSources);
  }

  function checkHasImages() {
    return getImageSourcesFromDocument(document).length > 0;
  }

  function getSiteName(doc = document) {
    const host = (getDocumentHostname(doc) || "").replace(/^www\./, "");
    if (host.includes("nhentai.net")) return "nhentai";
    if (host.includes("mangalotus.com")) return "mangalotus";
    if (host.includes("baramangaonline.com")) return "baramanga";
    if (host.includes("yaoimangaonline.com")) return "yaoimangaonline";
    return "mrm";
  }

  function isMangaLotusHost(doc = document) {
    return getSiteName(doc) === "mangalotus";
  }

  function isBaraMangaHost(doc = document) {
    return getSiteName(doc) === "baramanga";
  }

  function isYaoiMangaOnlineHost(doc = document) {
    return getSiteName(doc) === "yaoimangaonline";
  }

  function isNhentaiHost(doc = document) {
    return getSiteName(doc) === "nhentai";
  }

  function getNhentaiGalleryId(doc = document) {
    const path = getDocumentPathname(doc);
    const match = String(path).match(/^\/g\/(\d+)(?:\/(\d+))?\/?$/);
    return match ? match[1] : "";
  }

  function parseNhentaiGalleryApi(doc = document) {
    const galleryId = getNhentaiGalleryId(doc);
    if (!galleryId) return null;
    if (nhentaiApiCache?.id && String(nhentaiApiCache.id) !== String(galleryId)) {
      nhentaiApiCache = null;
      nhentaiApiPromise = null;
    }
    if (nhentaiApiCache) return nhentaiApiCache;

    const scripts = Array.from(doc.querySelectorAll('script[type="application/json"][data-sveltekit-fetched]'));
    for (const script of scripts) {
      const dataUrl = script.getAttribute("data-url") || "";
      if (!dataUrl.includes(`/api/v2/galleries/${galleryId}`)) continue;
      try {
        const envelope = JSON.parse(script.textContent || "{}");
        const body = typeof envelope.body === "string" ? JSON.parse(envelope.body) : envelope.body;
        if (body && Array.isArray(body.pages)) {
          nhentaiApiCache = body;
          return body;
        }
      } catch {}
    }

    return null;
  }

  async function fetchNhentaiGalleryApi(doc = document) {
    const galleryId = getNhentaiGalleryId(doc);
    if (!galleryId) return null;
    const embedded = parseNhentaiGalleryApi(doc);
    if (embedded?.pages?.length) return embedded;
    if (nhentaiApiPromise) return nhentaiApiPromise;

    const targetUrl = new URL(`/api/v2/galleries/${galleryId}`, getDocumentOrigin(doc)).toString();
    nhentaiApiPromise = fetch(targetUrl, {
      credentials: "include",
      cache: "no-store",
      headers: { accept: "application/json" },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (body?.pages?.length) {
          nhentaiApiCache = body;
          return body;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        nhentaiApiPromise = null;
      });

    return nhentaiApiPromise;
  }

  function buildNhentaiImageUrl(path) {
    return path ? `https://i.nhentai.net/${String(path).replace(/^\/+/, "")}` : "";
  }

  function isLikelyContentImage(img, baseUrl) {
    if (!img) return false;
    const src = getBestImageSource(img, baseUrl);
    if (!src) return false;
    const normalized = src.toLowerCase();

    if (normalized.startsWith("data:image/")) return false;
    if (/\/(avatar|emoji|icon|logo|banner|ads?|gravatar)\//.test(normalized)) return false;
    if (/(?:^|[_-])(icon|logo|avatar|emoji|thumb)(?:[_-]|\.|$)/.test(normalized)) return false;
    if (/\.(gif|svg)(?:$|[?#])/.test(normalized)) return false;

    const width = Number(img.getAttribute("width") || img.naturalWidth || 0);
    const height = Number(img.getAttribute("height") || img.naturalHeight || 0);
    if ((width && width < 140) || (height && height < 140)) return false;

    if (img.closest("header, nav, aside, footer, .sharedaddy, .jp-relatedposts, .yarpp, .widget, .sidebar, .comment-list")) {
      return false;
    }

    return true;
  }

  function getPostContent(doc = document) {
    const siteSpecificSelectors = isNhentaiHost(doc)
      ? [
        "#image-container",
        "#thumbnail-container .thumbs",
        "#bigcontainer",
        "main",
      ]
      : isMangaLotusHost(doc) || isBaraMangaHost(doc) || isYaoiMangaOnlineHost(doc)
        ? [
          "main article .entry-content",
          "#main article .entry-content",
          ".site-main article .entry-content",
          ".single-post article .entry-content",
          "article .entry-content",
          "main .entry-content",
          ".entry-content",
          "article .post-content",
          ".post-content",
        ]
        : postContentSelectors;

    for (const selector of siteSpecificSelectors) {
      const node = doc.querySelector(selector);
      if (node) return node;
    }
    return null;
  }

  function isListingCard(node) {
    if (!node) return false;
    if (node.matches?.(".gallery")) return !!node.querySelector(".cover[href]");
    if (node.matches?.("a.tagchip")) return !!node.getAttribute("href");
    if (node.matches?.("article.post, article.post-standard, article.hentry, article.entry")) return !!node.querySelector(".entry-title a, h2 a, h3 a, h4 a");
    if (node.querySelector(".entry-title a, h2 a, h3 a, h4 a")) return true;
    if (node.querySelector(".cover[href], .post-thumbnail a[href], a[href] img")) return true;
    if (node.querySelector("img") && node.querySelector("a[href]")) return true;
    return false;
  }

  function getArchiveCards(doc = document) {
    const cards = [];
    const seen = new Set();
    for (const selector of archiveSelectors) {
      doc.querySelectorAll(selector).forEach((node) => {
        if (seen.has(node) || !isListingCard(node)) return;
        seen.add(node);
        cards.push(node);
      });
    }
    return cards;
  }

  function isArchiveLikePage(doc = document) {
    if (isNhentaiHost(doc)) {
      const path = getDocumentPathname(doc);
      if (/^\/(search|tag|artist|character|parody|group|category|language)\//.test(path)) return true;
      if (/^\/(tags|artists|characters|parodies|groups)\/?$/.test(path)) return true;
      if (/^\/g\/\d+(?:\/\d+)?\/?$/.test(path)) return false;
      if (doc.querySelector(".index-container .gallery, #tag-container a.tagchip")) return true;
    }
    if (doc.body?.classList.contains("home") || doc.body?.classList.contains("archive") || doc.body?.classList.contains("search")) return true;
    if (doc.querySelector(".content-archive")) return true;
    return getArchiveCards(doc).length > 1;
  }


  function getVideoSource() {
    const videoElement = document.querySelector("#MRM_video > video > source, video > source, video source");
    return videoElement ? videoElement.src : null;
  }


function getCategoryTokens(source) {
  const tokens = new Set();
  const values = [];
  if (typeof source === "string") values.push(source);
  else if (source && source.className) values.push(String(source.className));
  for (const value of values) {
    String(value || "")
      .split(/\s+/)
      .filter(Boolean)
      .forEach((token) => {
        if (/^(category|tag|post_tag|lang|artist)-/i.test(token)) tokens.add(token);
      });
  }
  return Array.from(tokens);
}

function titleCaseSlug(slug) {
  return String(slug || "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .trim();
}

function extractPostMeta(doc = document) {
  if (isNhentaiHost(doc)) {
    const apiData = parseNhentaiGalleryApi(doc);
    const rawTitle = getTitle(doc);
    const langs = new Set();
    let artist = "";

    for (const tag of apiData?.tags || []) {
      if (!tag?.name) continue;
      if (tag.type === "language") {
        const lang = normalizeLangTag(tag.name);
        if (lang) langs.add(lang);
      }
      if (!artist && tag.type === "artist") artist = tag.name;
    }

    return {
      rawTitle,
      title: rawTitle,
      cleanTitle: apiData?.title?.pretty || rawTitle,
      artist: artist || "",
      langs: Array.from(langs),
    };
  }

  const rawTitle = getTitle(doc);
  const parsed = splitTitleMeta(rawTitle);
  const langs = new Set(parsed.langs || []);
  const entryContentText = doc.querySelector(".entry-content, .herald-entry-content")?.textContent || "";

  const categoryLinks = Array.from(doc.querySelectorAll(".entry-meta a, .post-tags a, .entry-categories a, a[rel='category tag']"));
  let artist = parsed.artist || "";
  for (const link of categoryLinks) {
    const href = link.getAttribute("href") || "";
    const text = (link.textContent || "").trim();
    if (!text) continue;
    if (/\/(lang|language)\//i.test(href) || /^(eng|english|chi|chinese|kor|korean|jp|jpn|japanese)$/i.test(text)) {
      const lang = normalizeLangTag(text);
      if (lang) langs.add(lang);
      continue;
    }
    if (!artist && /\/(artist|category|mangaka)\//i.test(href) && text.length <= 80 && !/^(doujinshi|manga|bara|yaoi|comic)$/i.test(text)) {
      artist = text;
    }
  }

  if (isYaoiMangaOnlineHost(doc)) {
    const contentLangMatch = entryContentText.match(/\bLanguage\s*:\s*([A-Za-z][A-Za-z\s-]{1,40})\b/i);
    if (contentLangMatch) {
      const lang = normalizeLangTag(contentLangMatch[1]);
      if (lang) langs.add(lang);
    }

    if (!artist) {
      const authorLink = doc.querySelector(".entry-content a[href*='/mangaka/'], .herald-entry-content a[href*='/mangaka/']");
      if (authorLink?.textContent?.trim()) {
        artist = authorLink.textContent.trim();
      } else {
        const authorMatch = entryContentText.match(/\bAuthor\s*:\s*([^\n\r]+)/i);
        if (authorMatch?.[1]) {
          artist = authorMatch[1].trim().replace(/\s{2,}/g, " ");
        }
      }
    }
  }

  const bodyTokens = getCategoryTokens(doc.body);
  for (const token of bodyTokens) {
    const langMatch = token.match(/^(?:category|lang|tag)-(.+)$/i);
    if (langMatch) {
      const lang = normalizeLangTag(titleCaseSlug(langMatch[1]));
      if (lang) langs.add(lang);
    }
  }

  const cleanTitle = isYaoiMangaOnlineHost(doc)
    ? String(parsed.title || rawTitle).replace(/\s*\((?:Updated!?|Update!?)[^)]+\)\s*$/i, "").trim()
    : (parsed.title || rawTitle);

  return {
    rawTitle,
    title: rawTitle,
    cleanTitle,
    artist: artist || "",
    langs: Array.from(langs),
  };
}

  function getTitle(doc = document) {
    if (isNhentaiHost(doc)) {
      const apiData = parseNhentaiGalleryApi(doc);
      return (
        apiData?.title?.english
        || apiData?.title?.pretty
        || doc.querySelector("#info h1 .pretty")?.textContent?.trim()
        || doc.querySelector("#info h1")?.textContent?.trim()
        || doc.querySelector("meta[property='og:title']")?.getAttribute("content")?.trim()
        || doc.querySelector("h1")?.textContent?.trim()
        || "Untitled"
      );
    }
    return (
      doc.querySelector(".entry-header h1.entry-title")?.textContent.trim()
      || doc.querySelector("article h1.entry-title")?.textContent.trim()
      || doc.querySelector("main h1")?.textContent.trim()
      || doc.querySelector("h1")?.textContent.trim()
      || "Untitled"
    );
  }

  function getCurrentPage(doc = document) {
    if (isNhentaiHost(doc)) {
      const path = getDocumentPathname(doc);
      const pageMatch = path.match(/^\/g\/\d+\/(\d+)\/?$/);
      return pageMatch ? pageMatch[1] : "1";
    }

    const pageElement = doc.querySelector(
      ".page-numbers.current, .pagination .current, .pagination .active, .nav-links .current, .wp-link-pages .current, .post-page-numbers.current",
    );
    if (pageElement) return pageElement.textContent.trim();

    const fallback = Array.from(
      doc.querySelectorAll(".wp-link-pages .post-page-numbers, .wp-link-pages a, .post-page-numbers, .pagination a, .nav-links a"),
    )
      .map((node) => node.textContent.trim())
      .find((value) => /^\d+$/.test(value));

    return fallback || "1";
  }

  function normalizePageOneUrl(url) {
    const parsed = new URL(url, location.href);
    parsed.hash = "";
    parsed.search = "";
    if (parsed.hostname.replace(/^www\./, "").includes("nhentai.net")) {
      parsed.pathname = parsed.pathname.replace(/^(\/g\/\d+)\/\d+\/?$/, "$1/");
      return parsed.toString();
    }
    parsed.pathname = parsed.pathname.replace(/\/\d+\/?$/, "/");
    return parsed.toString();
  }

  function parseBestSrcset(srcset) {
    if (!srcset) return "";
    const candidates = srcset
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [url, descriptor] = entry.split(/\s+/, 2);
        const score = descriptor?.endsWith("w") ? parseInt(descriptor, 10) : descriptor?.endsWith("x") ? Math.round(parseFloat(descriptor) * 1000) : 0;
        return { url, score: Number.isFinite(score) ? score : 0 };
      })
      .filter((item) => item.url);
    if (!candidates.length) return "";
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].url;
  }

  function absolutizeUrl(url, baseUrl) {
    try {
      return new URL(url, baseUrl || location.href).toString();
    } catch {
      return "";
    }
  }

  function getBestImageSource(img, baseUrl) {
    const srcset = img.getAttribute("srcset") || img.getAttribute("data-srcset") || img.getAttribute("data-lazy-srcset");
    const candidates = [
      parseBestSrcset(srcset),
      img.currentSrc,
      img.getAttribute("data-src"),
      img.getAttribute("data-lazy-src"),
      img.getAttribute("data-original"),
      img.getAttribute("src"),
    ].filter(Boolean);

    for (const candidate of candidates) {
      const value = absolutizeUrl(candidate, baseUrl);
      if (value) return value;
    }
    return "";
  }

  function getBestThumbnailSource(img, fallback, baseUrl) {
    const thumb = img.getAttribute("src") || img.currentSrc || img.getAttribute("data-src") || fallback;
    return absolutizeUrl(thumb, baseUrl) || fallback;
  }

  function extractTrailingPageNumber(url) {
    try {
      const parsed = new URL(url, location.href);
      const searchPage = parsed.searchParams.get("page");
      if (/^\d+$/.test(searchPage || "")) return Number(searchPage);

      const pageMatch = parsed.pathname.match(/\/page\/(\d+)\/?$/);
      if (pageMatch) return Number(pageMatch[1]);

      const trailingMatch = parsed.pathname.match(/\/(\d+)\/?$/);
      return trailingMatch ? Number(trailingMatch[1]) : 1;
    } catch {
      return 1;
    }
  }

  function discoverPaginatedPostUrls(doc, baseUrl) {
    if (isNhentaiHost(doc)) {
      const apiData = parseNhentaiGalleryApi(doc);
      const galleryId = getNhentaiGalleryId(doc);
      if (galleryId && apiData?.pages?.length) {
        return apiData.pages.map((page) => new URL(`/g/${galleryId}/${page.number || 1}/`, baseUrl).toString());
      }
    }

    const urls = new Set([baseUrl]);
    const base = new URL(baseUrl, location.href);
    const basePrefix = normalizePageOneUrl(baseUrl).replace(/\/$/, "");
    const anchors = Array.from(
      doc.querySelectorAll(
        "a[rel='next'], a[rel='prev'], .page-numbers a, a.page-numbers, .wp-pagenavi a, .pagination a, .post-page-numbers, .wp-link-pages a, .nav-links a",
      ),
    );

    for (const anchor of anchors) {
      const href = anchor.getAttribute("href");
      if (!href) continue;

      let absolute;
      try {
        absolute = new URL(href, baseUrl);
      } catch {
        continue;
      }

      absolute.hash = "";
      if (absolute.origin !== base.origin) continue;

      const normalized = normalizePageOneUrl(absolute.toString()).replace(/\/$/, "");
      if (normalized !== basePrefix) continue;

      const pageNumber = extractTrailingPageNumber(absolute.toString());
      if (!Number.isFinite(pageNumber) || pageNumber < 1) continue;

      urls.add(pageNumber === 1 ? baseUrl : absolute.toString());
    }

    return Array.from(urls).sort((a, b) => extractTrailingPageNumber(a) - extractTrailingPageNumber(b));
  }



  function determineContentType() {
    if (isNhentaiHost(document)) {
      const hasImages = checkHasImages();
      if (isArchiveLikePage(document)) return { type: "none", reason: "excluded_page" };
      return hasImages ? { type: "images", hasContent: true, supportsPdf: false } : { type: "none", reason: "no_content" };
    }

    const categoryTags = Array.from(document.querySelectorAll(".entry-categories a, .post-categories a, .cat-links a, a[rel~=category], .tags-links a"))
      .map((tag) => tag.textContent.trim().toLowerCase());

    const hasVideo = document.querySelector("#MRM_video") !== null;
    const hasYouTube = document.querySelector("iframe[src*='youtube.com'], iframe[src*='youtu.be']") !== null;
    const isHomePage = isArchiveLikePage(document);
    const hasImages = checkHasImages();

    if (shouldExclude || hasYouTube || isHomePage) {
      return { type: "none", reason: "excluded_page" };
    }

    if (categoryTags.includes("video") && hasVideo) {
      return { type: "video", hasContent: true };
    }
    if (!categoryTags.includes("video") && hasImages) {
      return { type: "images", hasContent: true, supportsPdf: false };
    }
    return { type: "none", reason: "no_content" };
  }

  async function loadSettings() {
    try {
      const result = await browser.storage.local.get(["mrmSettings", "mrmDebugLog"]);
      debugMode = !!result.mrmSettings?.debugMode;
      hideDownloadedListings = !!result.mrmSettings?.hideDownloadedListing;
      hideQueuedListings = !!result.mrmSettings?.hideQueuedListing;
      hideSavedListings = !!result.mrmSettings?.hideSavedListing;
      debugEntries = Array.isArray(result.mrmDebugLog) ? result.mrmDebugLog : [];
      if (debugMode) await debug("info", `Debug mode enabled on load for ${location.href}`);
    } catch (error) {
      console.error("[MRM Content] Failed to load settings", error);
    }
  }

  async function reportSupportedTabContext(reason = "init") {
  try {
    const url = window.location.href || "";
    if (!/^https?:\/\/(?:[^/]+\.)?(?:myreadingmanga\.info|mangalotus\.com|baramangaonline\.com|yaoimangaonline\.com|nhentai\.net)\//i.test(url)) {
      return;
    }
    await browser.runtime.sendMessage({
      type: "MRM_SET_LAST_SUPPORTED_TAB_CONTEXT",
      url,
      title: document.title || "",
      reason,
    });
  } catch {}
}

async function debug(level, message, meta = null) {
    const prefix = `[MRM Debug][Content] ${message}`;
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    if (debugMode) {
      fn(prefix, meta ?? "");
      try {
        await appendDebugLog?.("CONTENT", level, message, meta);
      } catch {}
      debugEntries.unshift({
        timestamp: new Date().toISOString(),
        source: "CONTENT",
        level,
        message,
        meta,
      });
      if (debugEntries.length > 120) debugEntries.length = 120;
      renderDebugPanel();
    }
  }


  function createJobRecord(payload = {}) {
    return {
      id: payload.id || `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      url: payload.url || location.href,
      title: payload.title || getTitle(document),
      status: payload.status || "queued",
      progress: clampPercent(payload.progress || 0),
      progressLabel: payload.progressLabel || "Queued",
      total: Number(payload.total || 0),
      completed: Number(payload.completed || 0),
      count: Number(payload.count || payload.total || 0),
      type: payload.type || "images",
      page: payload.page || getCurrentPage(document),
      format: "cbz",
      filename: payload.filename || "",
      startedAt: payload.startedAt || new Date().toISOString(),
      autoOpened: !!payload.autoOpened,
      source: payload.source || "page",
      updatedAt: new Date().toISOString(),
    };
  }

  async function syncJobState(patch = {}) {
    if (!currentJobState) return;
    currentJobState = { ...currentJobState, ...patch, updatedAt: new Date().toISOString() };
    await upsertActiveJob(currentJobState);
      await logVerboseAction("CONTENT", "Active job created", currentJobState);
    renderPostActionProgress();
  }

  async function finishCurrentJob(status, extra = {}) {
    if (!currentJobState) return;
    const finished = {
      ...currentJobState,
      ...extra,
      status,
      updatedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    };
    try {
      const storage = await browser.storage.local.get(["downloadHistory"]);
      const history = Array.isArray(storage.downloadHistory) ? storage.downloadHistory : [];
      history.unshift({
        id: Date.now(),
        title: finished.title,
        url: finished.url,
        type: finished.type || "images",
        timestamp: finished.finishedAt,
        status: status === "completed" ? "completed" : "failed",
        progress: status === "completed" ? 100 : finished.progress || 0,
        count: finished.count || finished.total || 0,
        filename: finished.filename || "",
        format: "cbz",
        error: finished.error || "",
      });
      await browser.storage.local.set({ downloadHistory: history.slice(0, 100) });
    } catch {}
    await removeActiveJob(finished.id);
    currentJobState = null;
    renderPostActionProgress();
  }

  

function loadFloatingPrefs() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FLOAT_PREFS_KEY) || "{}");
    return {
      minimized: !!parsed.minimized,
      x: Number.isFinite(parsed.x) ? parsed.x : null,
      y: Number.isFinite(parsed.y) ? parsed.y : null,
    };
  } catch {
    return { minimized: false, x: null, y: null };
  }
}

function saveFloatingPrefs(next) {
  try {
    const current = loadFloatingPrefs();
    localStorage.setItem(FLOAT_PREFS_KEY, JSON.stringify(Object.assign({}, current, next)));
  } catch {}
}

function applyFloatingPrefs(root) {
  if (!root) return;
  const prefs = loadFloatingPrefs();
  root.dataset.minimized = prefs.minimized ? "true" : "false";
  if (Number.isFinite(prefs.x) && Number.isFinite(prefs.y)) {
    root.style.left = `${prefs.x}px`;
    root.style.top = `${prefs.y}px`;
    root.style.right = "auto";
    root.style.bottom = "auto";
  }
}

function enableFloatingDrag(root) {
  const handle = root?.querySelector(".mrm-dragbar");
  if (!root || !handle) return;
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const onMove = (event) => {
    if (!dragging) return;
    const x = Math.max(8, Math.min(window.innerWidth - root.offsetWidth - 8, event.clientX - offsetX));
    const y = Math.max(8, Math.min(window.innerHeight - root.offsetHeight - 8, event.clientY - offsetY));
    root.style.left = `${x}px`;
    root.style.top = `${y}px`;
    root.style.right = "auto";
    root.style.bottom = "auto";
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    const rect = root.getBoundingClientRect();
    saveFloatingPrefs({ x: rect.left, y: rect.top });
  };

  handle.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    dragging = true;
    const rect = root.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  });
}

  function updatePostActionState(label, disabled = true, percent = null, status = null) {
    const btn = document.querySelector(`#${POST_ACTION_ROOT_ID} [data-role="download"]`);
    if (!btn) return;
    const safeLabel = label || "Download CBZ";
    btn.textContent = safeLabel;
    btn.disabled = !!disabled;
    const root = document.getElementById(POST_ACTION_ROOT_ID);
    if (!root) return;
    const fill = root.querySelector(".mrm-btn-progress-fill");
    const meta = root.querySelector(".mrm-btn-meta");
    const resolvedPercent = clampPercent(percent == null ? (currentJobState?.progress || 0) : percent);
    const progressWrap = root.querySelector(".mrm-btn-progress");
    if (fill) fill.style.width = `${resolvedPercent}%`;
    if (progressWrap) progressWrap.classList.toggle("is-indeterminate", safeLabel.toLowerCase().startsWith("packing"));
    if (meta) {
      const metaText = String(status || currentJobState?.progressLabel || "").trim();
      const normalizedLabel = safeLabel.trim().toLowerCase();
      const normalizedMeta = metaText.toLowerCase();
      const duplicateState = !metaText || normalizedMeta === normalizedLabel || normalizedMeta.includes(normalizedLabel) || normalizedLabel.includes(normalizedMeta);
      const sameProgressFamily = (normalizedLabel.startsWith("downloading") && normalizedMeta.startsWith("downloading"))
        || (normalizedLabel.startsWith("packing") && normalizedMeta.startsWith("packing"))
        || (normalizedLabel.startsWith("preparing") && normalizedMeta.startsWith("preparing"))
        || (normalizedLabel.startsWith("queued") && normalizedMeta.startsWith("queued"));
      meta.textContent = duplicateState || sameProgressFamily ? "" : metaText;
      meta.classList.toggle("is-hidden", !meta.textContent);
    }
    const shell = root.querySelector(".mrm-post-shell-main");
    shell?.classList.toggle("is-busy", !!disabled && !!safeLabel);
    shell?.classList.toggle("is-success", safeLabel === "Done");
  }

  function renderPostActionProgress() {
    const percent = currentJobState?.progress || 0;
    const label = currentJobState?.progressLabel || "";
    const btn = document.querySelector(`#${POST_ACTION_ROOT_ID} [data-role="download"]`);
    if (!btn) return;
    updatePostActionState(btn.textContent, btn.disabled, percent, label);
  }

  function normalizeJobUrl(url) {
    try {
      const parsed = new URL(url, location.href);
      parsed.hash = "";
      return parsed.toString();
    } catch {
      return String(url || "");
    }
  }

  function findJobForUrl(url, jobs = []) {
    const normalized = normalizeJobUrl(url);
    return jobs.find((job) => normalizeJobUrl(job.url) === normalized) || null;
  }

  async function getHistoryEntryForUrl(url) {
    try {
      const stored = await browser.storage.local.get(["downloadHistory"]);
      const history = Array.isArray(stored.downloadHistory) ? stored.downloadHistory : [];
      const normalized = normalizeJobUrl(url);
      return history.find((item) => normalizeJobUrl(item.url) === normalized) || null;
    } catch {
      return null;
    }
  }

  function updateListingButtonVisual(shell, button, state = {}) {
    if (!shell || !button) return;
    const fill = shell.querySelector(".mrm-btn-progress-fill");
    const meta = shell.closest(".mrm-listing-download-cell")?.querySelector(":scope > .mrm-btn-meta") || shell.querySelector(".mrm-btn-meta");
    const progressWrap = shell.querySelector(".mrm-btn-progress");
    const label = String(state.label || button.textContent || "Download CBZ");
    const metaText = String(state.meta || "").trim();
    const duplicateMeta = !metaText || metaText.toLowerCase() === label.toLowerCase()
      || metaText.toLowerCase().includes(label.toLowerCase())
      || label.toLowerCase().includes(metaText.toLowerCase())
      || (label.toLowerCase().startsWith("downloading") && metaText.toLowerCase().startsWith("downloading"))
      || (label.toLowerCase().startsWith("packing") && metaText.toLowerCase().startsWith("packing"));
    const isDownloaded = label.toLowerCase().includes("downloaded");
    const isQueued = label.toLowerCase().includes("queued");
    const isDone = label === "Done" || isDownloaded;
    if (fill) fill.style.width = `${clampPercent(state.percent || 0)}%`;
    if (progressWrap) progressWrap.classList.toggle("is-indeterminate", label.toLowerCase().startsWith("packing"));
    if (meta) {
      meta.textContent = duplicateMeta ? "" : metaText;
      meta.classList.toggle("is-hidden", !meta.textContent);
    }
    button.textContent = label;
    button.disabled = !!state.disabled;
    shell.classList.toggle("is-active", label !== "Download CBZ" && !isDone && label !== "Retry");
    shell.classList.toggle("is-done", isDone);
    shell.classList.toggle("is-downloaded", isDownloaded);
    shell.classList.toggle("is-queued", isQueued && !isDone);
    shell.classList.toggle("is-failed", label === "Retry");
  }

  function findArchiveCardFromActionShell(shell) {
    const actions = shell?.closest(".mrm-listing-actions");
    if (!actions) return null;
    return actions.closest(archiveSelectors.join(",")) || actions.parentElement;
  }

  function findDownloadedEntryForUrl(url, history = [], library = []) {
    const normalized = normalizeJobUrl(url);
    const libraryEntry = library.find((item) => item?.downloaded && normalizeJobUrl(item.url || item.canonicalUrl) === normalized);
    if (libraryEntry) {
      return {
        source: "library",
        title: libraryEntry.displayTitle || libraryEntry.title || "",
        filename: libraryEntry.filename || "",
        lastDownloadedAt: libraryEntry.lastDownloadedAt || libraryEntry.updatedAt || libraryEntry.addedAt || null,
        downloadCount: libraryEntry.downloadCount || 1,
        pageCount: libraryEntry.pageCount || null,
      };
    }

    const historyEntry = history.find((item) => item?.status === "completed" && normalizeJobUrl(item.url) === normalized);
    if (historyEntry) {
      return {
        source: "history",
        title: historyEntry.title || "",
        filename: historyEntry.filename || "",
        lastDownloadedAt: historyEntry.timestamp || historyEntry.completedAt || null,
        downloadCount: 1,
        pageCount: historyEntry.count || null,
      };
    }

    return null;
  }

  function formatDownloadedMeta(entry) {
    const parts = ["Click to download again"];
    if (entry?.pageCount) parts.push(`${entry.pageCount} pages`);
    if (entry?.filename) parts.push(entry.filename);
    return parts.join(" • ");
  }

  function applyDownloadedListingVisibility(shell, downloaded) {
    const card = findArchiveCardFromActionShell(shell);
    if (!card) return;
    card.classList.toggle("mrm-is-downloaded-post", !!downloaded);
    card.classList.toggle("mrm-hide-downloaded-post", !!downloaded && !!hideDownloadedListings);
  }

  function findQueuedEntryForUrl(url, queue = []) {
    const normalized = normalizeJobUrl(url);
    return queue.find((item) => normalizeJobUrl(item.url || "") === normalized && !["completed", "done", "failed"].includes(String(item.status || "pending").toLowerCase())) || null;
  }

  function applyQueuedListingVisibility(shell, queued) {
    const card = findArchiveCardFromActionShell(shell);
    if (!card) return;
    card.classList.toggle("mrm-is-queued-post", !!queued);
    card.classList.toggle("mrm-hide-queued-post", !!queued && !!hideQueuedListings);
  }

  function findSavedEntryForUrl(url, library = []) {
    const normalized = normalizeJobUrl(url);
    return library.find((item) => normalizeJobUrl(item.url || item.canonicalUrl || "") === normalized) || null;
  }

  function applySavedListingVisibility(shell, saved) {
    const card = findArchiveCardFromActionShell(shell);
    if (!card) return;
    card.classList.toggle("mrm-is-saved-post", !!saved);
    card.classList.toggle("mrm-hide-saved-post", !!saved && !!hideSavedListings);
  }


  async function refreshListingStates() {
    const jobs = await getActiveJobs();
    let history = [];
    let library = [];
    let queue = [];
    try {
      const stored = await browser.storage.local.get(["downloadHistory", "mrmLibraryItems", "mrmDownloadQueue", "mrmSettings"]);
      history = Array.isArray(stored.downloadHistory) ? stored.downloadHistory : [];
      library = Array.isArray(stored.mrmLibraryItems) ? stored.mrmLibraryItems : [];
      queue = Array.isArray(stored.mrmDownloadQueue) ? stored.mrmDownloadQueue : [];
      hideDownloadedListings = !!stored.mrmSettings?.hideDownloadedListing;
      hideQueuedListings = !!stored.mrmSettings?.hideQueuedListing;
      hideSavedListings = !!stored.mrmSettings?.hideSavedListing;
    } catch {}
    document.querySelectorAll(`${LISTING_ACTION_SELECTOR}[data-url]`).forEach((shell) => {
      const button = shell.querySelector(".mrm-listing-btn");
      if (!button) return;
      const url = shell.dataset.url || "";
      const job = findJobForUrl(url, jobs);
      if (job) {
        applyDownloadedListingVisibility(shell, false);
        applyQueuedListingVisibility(shell, false);
        const completed = Number(job.completed || 0);
        const total = Number(job.total || job.count || 0);
        const status = String(job.status || "").toLowerCase();
        let label = "Queued";
        if (status === "packing") label = "Packing CBZ";
        else if (status === "downloading") label = total ? `Downloading ${completed}/${total}` : (job.progressLabel || "Downloading");
        else if (status === "preparing") label = "Preparing…";
        updateListingButtonVisual(shell, button, {
          label,
          percent: Number(job.progress || 0),
          meta: status === "failed" ? (job.error || "Download failed") : "",
          disabled: true,
        });
        return;
      }
      const downloadedEntry = findDownloadedEntryForUrl(url, history, library);
      if (downloadedEntry) {
        applyQueuedListingVisibility(shell, false);
        applyDownloadedListingVisibility(shell, true);
        updateListingButtonVisual(shell, button, {
          label: "Downloaded ✓",
          percent: 100,
          meta: formatDownloadedMeta(downloadedEntry),
          disabled: false,
        });
        return;
      }
      const queuedEntry = findQueuedEntryForUrl(url, queue);
      if (queuedEntry) {
        applyDownloadedListingVisibility(shell, false);
        applyQueuedListingVisibility(shell, true);
        updateListingButtonVisual(shell, button, {
          label: "Queued ✓",
          percent: clampPercent(queuedEntry.progress || 0),
          meta: queuedEntry.progressLabel || "Saved in queue",
          disabled: false,
        });
        const queueButton = shell.querySelector(".mrm-listing-queue-btn");
        if (queueButton) {
          queueButton.textContent = "Queued";
          queueButton.classList.add("is-in-list");
        }
        return;
      }
      const savedEntry = findSavedEntryForUrl(url, library);
      if (savedEntry) {
        applyDownloadedListingVisibility(shell, false);
        applyQueuedListingVisibility(shell, false);
        applySavedListingVisibility(shell, true);
        const saveButton = shell.querySelector(".mrm-listing-save-btn");
        if (saveButton) {
          saveButton.textContent = "Saved";
          saveButton.classList.add("is-saved");
        }
        if (hideSavedListings) return;
      } else {
        applySavedListingVisibility(shell, false);
      }

      const entry = history.find((item) => normalizeJobUrl(item.url) === normalizeJobUrl(url));
      applyDownloadedListingVisibility(shell, false);
      applyQueuedListingVisibility(shell, false);
      if (entry?.status === "failed") {
        updateListingButtonVisual(shell, button, {
          label: "Retry",
          percent: 0,
          meta: entry.error || "Download failed",
          disabled: false,
        });
        return;
      }
      updateListingButtonVisual(shell, button, {
        label: "Download CBZ",
        percent: 0,
        meta: "",
        disabled: false,
      });
    });
  }

  function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function normalizeCbzFilename(filename) {
    let value = sanitizeFilename(String(filename || "download.cbz").replace(/\.cbz\.zip$/i, ".cbz").replace(/\.zip$/i, ""), "download");
    value = value.replace(/\.cbz$/i, "").replace(/[. _-]+$/g, "");
    return `${value || "download"}.cbz`;
  }

  function createAndroidSafeCbzBlob(blob) {
    return new Blob([blob], { type: "application/octet-stream" });
  }

  async function downloadBlobObject(blob, filename) {
    try {
      const response = await browser.runtime.sendMessage({
        type: "MRM_SAVE_BLOB_DOWNLOAD",
        blob,
        filename,
      });
      if (!response?.ok) {
        throw new Error(response?.error || "Could not save archive");
      }
      return response;
    } catch (error) {
      await debugLog("error", "Background blob save failed", {
        filename,
        error: String(error?.message || error),
      });
      throw error;
    }
  }

  async function fetchImagePayload(imageUrl, pageUrl) {
    const response = await pageFetch(imageUrl, {
      options: {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        mode: "cors",
        referrer: pageUrl,
      },
      wantBody: true,
      responseType: "arraybuffer",
      timeoutMs: 90000,
    });
    const hasBinaryPayload = !!(response && (response.bodyBase64 || response.body));
    if (!response?.ok || !hasBinaryPayload) {
      const statusText = response?.status ? `HTTP ${response.status}` : (response?.error || "Unknown error");
      throw new Error(`Image fetch failed: ${statusText}`);
    }
    const headers = Array.isArray(response.headers) ? response.headers : [];
    const contentTypeHeader = headers.find((entry) => String(entry[0]).toLowerCase() === "content-type");
    const contentType = contentTypeHeader ? String(contentTypeHeader[1] || "") : "";
    const bytes = normalizeBinaryPayload(response.body, response.bodyBase64);
    if (!bytes.length) {
      throw new Error("Image fetch failed: empty binary payload");
    }
    return {
      bytes,
      contentType,
    };
  }


  function arrayBufferToDataUrl(buffer, contentType = "image/jpeg") {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return `data:${contentType || "image/jpeg"};base64,${btoa(binary)}`;
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Could not read cover blob."));
      reader.readAsDataURL(blob);
    });
  }

  function loadImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not decode first downloaded page as a cover image."));
      };
      image.src = objectUrl;
    });
  }

  async function createCoverDataUrlFromDownloadedPage(bytes, contentType = "image/jpeg") {
    if (!bytes?.length) return "";
    const blob = new Blob([bytes], { type: contentType || "image/jpeg" });
    try {
      const image = await loadImageFromBlob(blob);
      const maxSide = 420;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width || 1, image.naturalHeight || image.height || 1));
      const width = Math.max(1, Math.round((image.naturalWidth || image.width || 1) * scale));
      const height = Math.max(1, Math.round((image.naturalHeight || image.height || 1) * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas is unavailable for cover thumbnail generation.");
      context.drawImage(image, 0, 0, width, height);
      const coverBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.78));
      if (!coverBlob) throw new Error("Could not encode cover thumbnail.");
      return await blobToDataUrl(coverBlob);
    } catch (error) {
      if (blob.size <= 1536 * 1024) {
        return arrayBufferToDataUrl(bytes, contentType || "image/jpeg");
      }
      await debug("warn", "First downloaded page cover fallback failed", {
        error: error?.message || String(error),
        bytes: blob.size,
      });
      return "";
    }
  }

  

  function ensurePageFeedbackStyles() {
    if (document.getElementById("mrm-page-feedback-style")) return;
    const style = document.createElement("style");
    style.id = "mrm-page-feedback-style";
    style.textContent = `
      #mrm-toast-root.mrm-toast-root{
        position:fixed;top:12px;right:12px;left:auto;bottom:auto;display:flex;flex-direction:column;gap:8px;
        z-index:2147483646;pointer-events:none;max-width:min(88vw,360px)
      }
      #mrm-toast-root .mrm-toast{
        pointer-events:none;padding:10px 12px;border-radius:12px;background:#151515;color:#f5f5f5;
        box-shadow:none;border:none;font:600 12px/1.35 system-ui,-apple-system,sans-serif
      }
      #mrm-toast-root .mrm-toast-error{background:#b42318;color:#fff}
      #mrm-toast-root .mrm-toast-success{background:#166534;color:#fff}
      #mrm-toast-root .mrm-toast-warning{background:#92400e;color:#fff}
      #mrm-toast-root .mrm-toast-info{background:#1f2937;color:#fff}
      #mrm-queue-overlay{
        position:fixed;top:max(12px, env(safe-area-inset-top));right:max(12px, env(safe-area-inset-right));left:auto;bottom:auto;z-index:2147483646;
        display:none;min-width:220px;max-width:min(86vw,340px);padding:10px 12px;border-radius:14px;
        background:#111111;color:#f5f5f5;border:none;box-shadow:none;
        font:600 12px/1.35 system-ui,-apple-system,sans-serif;cursor:pointer;user-select:none;
        touch-action:none;opacity:.98
      }
      #mrm-queue-overlay[data-visible="1"]{display:block}
      #mrm-queue-overlay .mrm-queue-overlay-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 6px}
      #mrm-queue-overlay .mrm-queue-overlay-title{font-size:12px;font-weight:800;letter-spacing:.02em;text-transform:uppercase;opacity:.92}
      #mrm-queue-overlay .mrm-queue-overlay-state{font-size:11px;opacity:.88}
      #mrm-queue-overlay .mrm-queue-overlay-file{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.95}
      #mrm-queue-overlay .mrm-queue-overlay-meta{font-size:11px;opacity:.78;margin-top:4px}
      #mrm-queue-overlay .mrm-queue-overlay-bar{
        height:6px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:8px
      }
      #mrm-queue-overlay .mrm-queue-overlay-bar > span{
        display:block;height:100%;width:0%;background:#ff7a33
      }
    `;
    document.documentElement.appendChild(style);
  }

  function ensureQueueOverlayRoot() {
    ensurePageFeedbackStyles();
    let root = document.getElementById("mrm-queue-overlay");
    if (root) return root;
    root = document.createElement("button");
    root.id = "mrm-queue-overlay";
    root.type = "button";
    root.setAttribute("aria-label", "Open MRM queue");
    root.innerHTML = '<div class="mrm-queue-overlay-head"><div class="mrm-queue-overlay-title">Queue</div><div class="mrm-queue-overlay-state">Idle</div></div><div class="mrm-queue-overlay-file"></div><div class="mrm-queue-overlay-meta"></div><div class="mrm-queue-overlay-bar"><span></span></div>';
    root.addEventListener("click", () => {
      if (currentOverlayDrag?.moved) return;
      openPopupModal("queue");
    });
    const onPointerMove = (event) => {
      if (!currentOverlayDrag || event.pointerId !== currentOverlayDrag.pointerId) return;
      currentOverlayDrag.moved = true;
      const nextRight = Math.max(8, currentOverlayDrag.startRight - (event.clientX - currentOverlayDrag.startX));
      const nextTop = Math.max(8, currentOverlayDrag.startTop + (event.clientY - currentOverlayDrag.startY));
      root.style.right = `${nextRight}px`;
      root.style.top = `${nextTop}px`;
    };
    const endDrag = (event) => {
      if (!currentOverlayDrag || event.pointerId !== currentOverlayDrag.pointerId) return;
      try { root.releasePointerCapture(event.pointerId); } catch {}
      currentOverlayDrag = { moved: currentOverlayDrag.moved };
      window.setTimeout(() => { currentOverlayDrag = null; }, 0);
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", endDrag, true);
      window.removeEventListener("pointercancel", endDrag, true);
    };
    root.addEventListener("pointerdown", (event) => {
      currentOverlayDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startRight: parseFloat(root.style.right || "12") || 12,
        startTop: parseFloat(root.style.top || "12") || 12,
        moved: false,
      };
      try { root.setPointerCapture(event.pointerId); } catch {}
      window.addEventListener("pointermove", onPointerMove, true);
      window.addEventListener("pointerup", endDrag, true);
      window.addEventListener("pointercancel", endDrag, true);
    });
          (document.body || document.documentElement).appendChild(root);
    root.style.top = root.style.top || "12px";
    root.style.right = root.style.right || "12px";
    root.style.left = "auto";
    root.style.bottom = "auto";
    return root;
  }

  function isOverlayActiveStatus(status) {
    return ["opening", "downloading", "packing", "saving"].includes(String(status || "").toLowerCase());
  }

  function normalizeOverlayUrl(url) {
    return String(url || "").split("#")[0];
  }

  function findBestOverlayQueueItem(queueItems = [], currentUrl = location.href) {
    const host = location.hostname.replace(/^www\./, "");
    const normalizedCurrent = normalizeOverlayUrl(currentUrl);
    const items = Array.isArray(queueItems) ? queueItems.slice() : [];
    const sameHost = items.filter((item) => String(item?.host || "").replace(/^www\./, "") === host);
    const sameUrlActive = items.find((item) => normalizeOverlayUrl(item?.url) === normalizedCurrent && isOverlayActiveStatus(item?.status));
    const sameHostActive = sameHost.find((item) => isOverlayActiveStatus(item?.status));
    const sameUrlAny = items.find((item) => normalizeOverlayUrl(item?.url) === normalizedCurrent);
    const sameHostRecent = sameHost.sort((a, b) => Number(b?.updatedAt || b?.addedAt || 0) - Number(a?.updatedAt || a?.addedAt || 0))[0];
    return sameUrlActive || sameHostActive || sameUrlAny || sameHostRecent || null;
  }

  async function renderPageQueueOverlay(queueItems = null) {
    try {
      if (!minimalQueueOverlayEnabled) {
        document.getElementById("mrm-queue-overlay")?.removeAttribute("data-visible");
        return;
      }
      const root = ensureQueueOverlayRoot();
      const result = queueItems ? { mrmDownloadQueue: queueItems } : await browser.storage.local.get(["mrmDownloadQueue"]);
      const item = findBestOverlayQueueItem(result.mrmDownloadQueue || [], location.href);
            const visible = !!item;
      if (!visible) {
        root.removeAttribute("data-visible");
        return;
      }
      root.dataset.visible = "1";
      root.querySelector(".mrm-queue-overlay-state").textContent = String(item.status || "pending").replace(/^\w/, (m) => m.toUpperCase());
      root.querySelector(".mrm-queue-overlay-file").textContent = String(item.filename || item.title || item.url || "");
      const progress = Math.max(0, Math.min(100, Number(item.progress || (String(item.status).toLowerCase() === "completed" ? 100 : 0))));
      const count = Number(item.currentImage || 0);
      const total = Number(item.totalImages || item.count || 0);
      root.querySelector(".mrm-queue-overlay-meta").textContent = total ? `${count}/${total} · ${progress}%` : `${progress}%`;
      root.querySelector(".mrm-queue-overlay-bar > span").style.width = `${progress}%`;
    } catch {}
  }

  async function loadPageFeedbackSettings() {
    try {
      const result = await browser.storage.local.get(["mrmSettings"]);
      const settings = result.mrmSettings || {};
      pageToastEnabled = settings.pageToastEnabled !== false;
      minimalQueueOverlayEnabled = settings.minimalQueueOverlay !== false;
      minimalQueueOverlayActiveOnly = !!settings.minimalQueueOverlayActiveOnly;
      if (pageToastEnabled || minimalQueueOverlayEnabled) ensurePageFeedbackStyles();
      await renderPageQueueOverlay();
    } catch {}
  }

  function pageToast(message, type = "info", timeout = 2600) {
    if (!pageToastEnabled) return null;
    ensurePageFeedbackStyles();
    return showToast?.(message, type, timeout) || null;
  }
const queueProgressState = new Map();

  async function reportQueueProgress(payload, patch = {}) {
    if (!payload?.queueItemId && !payload?.url) return;
    const key = payload.queueItemId || normalizeJobUrl(payload.url || "");
    const status = String(patch.status || "");
    const progress = Number(patch.progress ?? -1);
    const count = Number(patch.count ?? patch.currentImage ?? -1);
    const label = String(patch.progressLabel || "");
    const previous = queueProgressState.get(key) || { at: 0, status: "", progress: -1, count: -1, label: "" };
    const now = Date.now();
    const forced = ["completed", "failed", "packing"].includes(status) || status !== previous.status || label !== previous.label;
    const changedEnough = progress !== previous.progress || count !== previous.count;
    if (!forced && !changedEnough) return;
    if (!forced && now - previous.at < 1800) return;
    queueProgressState.set(key, { at: now, status, progress, count, label });
    try {
      await browser.runtime.sendMessage({
        type: "MRM_UPDATE_DOWNLOAD_QUEUE_ITEM",
        id: payload.queueItemId || "",
        url: payload.url || "",
        patch: {
          ...patch,
          updatedAt: now,
          lastProgressAt: now,
        },
      });
    } catch {}
  }


  function getUrlSlugTokens(url) {
    try {
      return new URL(url, location.href).pathname
        .split("/")
        .filter(Boolean)
        .pop()
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .filter((token) => token.length >= 4 && !/^(eng|jpn|chi|page|download|manga|bara|yaoi)$/i.test(token));
    } catch {
      return [];
    }
  }

  function imageLooksRelatedToPost(imageUrl, pageUrl) {
    try {
      const image = new URL(imageUrl, pageUrl);
      const page = new URL(pageUrl, location.href);
      if (image.hostname.replace(/^www\./, "") !== page.hostname.replace(/^www\./, "")) {
        return /myreadingmanga\.info$/i.test(page.hostname) && /myreadingmanga\.info$/i.test(image.hostname);
      }
      const tokens = getUrlSlugTokens(page.href);
      if (!tokens.length) return true;
      const imageText = decodeURIComponent(image.pathname).toLowerCase();
      return tokens.some((token) => imageText.includes(token));
    } catch {
      return true;
    }
  }

  function filterValidatedDownloadImages(images, pageUrl) {
    const unique = [];
    const seen = new Set();
    for (const url of images || []) {
      const normalized = normalizeJobUrl(url);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      unique.push(url);
    }

    if (unique.length < 4) return unique;

    const related = unique.filter((url) => imageLooksRelatedToPost(url, pageUrl));
    if (related.length >= Math.max(2, Math.ceil(unique.length * 0.45))) {
      const skipped = unique.length - related.length;
      if (skipped > 0) {
        logVerboseAction("CONTENT", "Skipped likely unrelated post images", {
          pageUrl,
          skipped,
          kept: related.length,
        }).catch(() => {});
      }
      return related;
    }
    return unique;
  }

  async function fetchImagePayloadWithRetries(imageUrl, pageUrl, attempts = 3) {
    const candidates = buildImageFetchFallbackUrls(imageUrl);
    let lastError = null;
    for (const candidateUrl of candidates) {
      for (let attempt = 1; attempt <= Math.max(1, attempts); attempt += 1) {
        try {
          return await fetchImagePayload(candidateUrl, pageUrl);
        } catch (error) {
          lastError = error;
          await logVerboseAction("CONTENT", "Image fetch attempt failed", {
            imageUrl: candidateUrl,
            originalImageUrl: imageUrl,
            attempt,
            attempts,
            error: error?.message || String(error),
          });
          if (attempt < attempts) {
            await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
          }
        }
      }
    }
    throw lastError || new Error("Image fetch failed.");
  }

  async function buildAndDownloadCbzInContent(payload) {
    const images = filterValidatedDownloadImages(Array.isArray(payload.images) ? payload.images : [], payload.url || location.href);
    if (!images.length) throw new Error("No images found on the page after validation.");

    await reportQueueProgress(payload, {
      status: "downloading",
      phase: "fetching",
      progress: 2,
      progressLabel: "Preparing image list…",
      currentImage: 0,
      totalImages: images.length,
      count: images.length,
      lastError: null,
    });

    const concurrency = Math.max(1, Math.min(Number(payload.imageConcurrency ?? payload.concurrency) || (isAndroidRuntime ? 3 : 6), 8));
    const files = new Array(images.length);
    let nextIndex = 0;
    let completed = 0;
    let failed = 0;
    const failedImages = [];
    let firstDownloadedPageCoverDataUrl = "";
    let lastUiFlushAt = 0;
    let lastUiFlushFinished = 0;
    let lastListingRefreshAt = 0;

    async function flushDownloadProgress(force = false) {
      const finished = completed + failed;
      const now = Date.now();
      if (!force && finished < images.length && finished === lastUiFlushFinished && now - lastUiFlushAt < 450) {
        return;
      }
      if (!force && finished < images.length && now - lastUiFlushAt < 450 && finished - lastUiFlushFinished < Math.min(2, concurrency)) {
        return;
      }
      lastUiFlushAt = now;
      lastUiFlushFinished = finished;
      const percent = Math.min(90, Math.round((finished / Math.max(images.length, 1)) * 90));
      const shortLabel = failed ? `${completed}/${images.length} · ${failed} failed` : `${completed}/${images.length}`;
      const longLabel = failed ? `Fetched ${completed}/${images.length} · ${failed} failed` : `Fetching ${completed} of ${images.length}`;
      await syncJobState({
        status: "downloading",
        progress: percent,
        progressLabel: longLabel,
        completed,
        total: images.length,
        count: images.length,
      });
      await reportQueueProgress(payload, {
        status: "downloading",
        phase: "fetching",
        progress: percent,
        progressLabel: longLabel,
        currentImage: completed,
        totalImages: images.length,
        count: images.length,
        failedImages,
        lastError: failed ? `${failed} image(s) failed` : null,
      });
      updatePostActionState(`Downloading ${shortLabel}`, true, percent, failed ? `${failed} image(s) failed` : longLabel);
      if (force || now - lastListingRefreshAt > 900) {
        lastListingRefreshAt = now;
        await refreshListingStates();
      }
    }

    async function fetchOne(index) {
      const imageUrl = images[index];
      try {
        const fetched = await fetchImagePayloadWithRetries(imageUrl, payload.url, 3);
        const typeExt = fetched.contentType && fetched.contentType.includes("/") ? fetched.contentType.split("/").pop() : "";
        const urlExt = imageUrl.split(".").pop()?.split(/[?#]/)[0] || "jpg";
        const ext = (typeExt || urlExt || "jpg").replace(/[^a-zA-Z0-9]/g, "") || "jpg";
        files[index] = {
          name: `image_${String(index + 1).padStart(3, "0")}.${ext}`,
          data: fetched.bytes,
        };
        if (index === 0) {
          firstDownloadedPageCoverDataUrl = await createCoverDataUrlFromDownloadedPage(fetched.bytes, fetched.contentType || `image/${ext}`);
          if (firstDownloadedPageCoverDataUrl) {
            await logVerboseAction("CONTENT", "First downloaded page cached as Library cover fallback", {
              url: payload.url,
              bytes: firstDownloadedPageCoverDataUrl.length,
            });
          }
        }
        completed += 1;
        await debug("info", `Fetched image ${completed + failed}/${images.length}`, { imageUrl });
      } catch (error) {
        failed += 1;
        failedImages.push({ index: index + 1, imageUrl, error: error?.message || String(error) });
        await debug("warn", `Image failed ${completed + failed}/${images.length}`, { imageUrl, error: error?.message || String(error) });
      }

      await flushDownloadProgress(false);
    }

    async function worker() {
      while (nextIndex < images.length) {
        const index = nextIndex;
        nextIndex += 1;
        await fetchOne(index);
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, images.length) }, () => worker()));
    await flushDownloadProgress(true);

    if (!files.some(Boolean)) {
      throw new Error(`All ${images.length} image fetches failed.`);
    }
    if (failedImages.length) {
      files.push({
        name: "_FAILED_IMAGES.txt",
        data: [
          "Some images failed after retries.",
          `Post: ${payload.url || location.href}`,
          "",
          ...failedImages.map((item) => `${item.index}. ${item.imageUrl} — ${item.error}`),
        ].join("\n"),
      });
    }

    await syncJobState({
      status: "packing",
      progress: 94,
      progressLabel: "Packing CBZ",
      completed: images.length,
      total: images.length,
      count: images.length,
    });
    await reportQueueProgress(payload, {
      status: "packing",
      phase: "packing",
      progress: 94,
      progressLabel: "Packing CBZ",
      currentImage: images.length,
      totalImages: images.length,
      count: images.length,
      lastError: null,
    });
    updatePostActionState("Packing CBZ", true, 94, "Packing CBZ");
    await refreshListingStates();

    const filename = normalizeCbzFilename(payload.filename || `${sanitizeFilename(payload.title)} - Page ${payload.page}.cbz`);
    const response = await browser.runtime.sendMessage({
      type: "MRM_BUILD_AND_SAVE_CBZ",
      filename,
      files,
    });
    if (!response?.ok) {
      throw new Error(response?.error || "Could not build archive");
    }
    await reportQueueProgress(payload, {
      status: "completed",
      phase: "completed",
      progress: 100,
      progressLabel: failedImages.length ? `Completed with ${failedImages.length} failed image(s)` : "Completed",
      currentImage: completed,
      totalImages: images.length,
      count: images.length,
      completedAt: Date.now(),
      filename: response.filename || filename,
      lastError: null,
    });
    return { ok: true, filename: response.filename || filename, coverDataUrl: firstDownloadedPageCoverDataUrl };
  }

  function injectStyle() {
    if (document.getElementById("mrm-content-style")) return;
    const style = document.createElement("style");
    style.id = "mrm-content-style";
    style.textContent = `
      :root{
        --mrm-ui-bg:#0a0f16;
        --mrm-ui-panel:#0f1621;
        --mrm-ui-panel-2:#141c29;
        --mrm-ui-panel-3:#1b2636;
        --mrm-ui-border:rgba(190,205,233,.10);
        --mrm-ui-border-strong:rgba(190,205,233,.16);
        --mrm-ui-text:#eef4fc;
        --mrm-ui-muted:#97a4ba;
        --mrm-ui-accent:#7b8cff;
        --mrm-ui-accent-soft:rgba(123,140,255,.14);
        --mrm-ui-success:#5fd0a4;
        --mrm-ui-danger:#ee7a96;
        --mrm-ui-shadow:0 18px 38px rgba(0,0,0,.28);
      }
      #${POST_ACTION_ROOT_ID}{
        position:fixed;right:max(12px, env(safe-area-inset-right));bottom:max(12px, env(safe-area-inset-bottom));
        z-index:2147483645;display:flex;flex-direction:column;gap:6px;min-width:0;
      }
      #${POST_ACTION_ROOT_ID}[data-placement="inline"]{
        position:static;right:auto;bottom:auto;z-index:auto;display:inline-flex;vertical-align:middle;
      }
      #${POST_ACTION_ROOT_ID}[data-placement="inline"] .mrm-post-shell-main{width:auto;max-width:none}
      #${POST_ACTION_ROOT_ID}[data-placement="inline"] .mrm-btn-meta{
        position:absolute;left:0;right:0;top:calc(100% + 4px);padding:0 2px;color:var(--mrm-ui-muted);
        font:600 10px/1.3 system-ui,-apple-system,sans-serif;text-align:center;pointer-events:none;
      }
      .mrm-post-shell,.mrm-listing-shell,.mrm-debug-shell{
        position:relative;overflow:hidden;border-radius:18px;border:1px solid var(--mrm-ui-border);
        background:linear-gradient(180deg,rgba(15,22,33,.95),rgba(10,14,21,.97));
        box-shadow:var(--mrm-ui-shadow);backdrop-filter:blur(18px);
        transition:transform .18s ease,border-color .18s ease,background-color .18s ease,box-shadow .18s ease,opacity .2s ease;
      }
      .mrm-post-shell-main{
        position:relative;display:inline-flex;flex-direction:column;gap:4px;
        min-width:0;max-width:min(92vw,320px);overflow:visible;
        background:transparent;border:none;box-shadow:none;backdrop-filter:none;border-radius:18px;
      }
      .mrm-post-download-cell{
        position:relative;display:flex;overflow:hidden;border-radius:999px;
      }
      .mrm-post-download-cell .mrm-post-btn{width:100%;z-index:1}
      .mrm-btn-progress{position:absolute;inset:0;pointer-events:none;background:rgba(255,255,255,.02)}
      .mrm-btn-progress-fill{
        height:100%;width:0%;
        background:linear-gradient(90deg,rgba(255,255,255,.20),rgba(255,255,255,.07));
        transition:width .18s ease;
      }
      .mrm-btn-progress.is-indeterminate .mrm-btn-progress-fill{width:34%!important;animation:mrm-job-slide 1.1s linear infinite}
      @keyframes mrm-job-slide{0%{transform:translateX(-115%)}100%{transform:translateX(285%)}}
      .mrm-post-btn,.mrm-listing-btn,.mrm-icon-btn{
        position:relative;border:1px solid var(--mrm-ui-border);background:rgba(255,255,255,.028);color:var(--mrm-ui-text);
        border-radius:13px;padding:9px 11px;font:700 11px/1.2 system-ui,-apple-system,sans-serif;cursor:pointer;
        display:inline-flex;align-items:center;justify-content:center;gap:7px;text-decoration:none;min-height:36px;
        transition:transform .18s ease,background-color .18s ease,border-color .18s ease,color .18s ease,filter .18s ease,box-shadow .18s ease;
      }
      .mrm-post-btn{
        appearance:none;position:relative;isolation:isolate;overflow:hidden;
        min-height:40px;padding:0 14px;border:1px solid rgba(124,92,255,.45);border-radius:999px;
        background:linear-gradient(135deg,#7c5cff,#6d7cff);color:#fff;font:700 13px/1 system-ui,-apple-system,sans-serif;
        box-shadow:0 12px 26px rgba(124,92,255,.28);white-space:nowrap;
      }
      .mrm-post-btn:hover{transform:translateY(-1px);text-decoration:none}
      .mrm-post-btn[disabled]{opacity:1;cursor:default}
      .mrm-post-shell-main.is-busy .mrm-post-btn{filter:saturate(1.02)}
      .mrm-post-shell-main.is-success .mrm-post-btn{
        border-color:rgba(95,208,164,.45);
        background:linear-gradient(135deg,rgba(68,196,142,.98),rgba(95,208,164,.92));
        box-shadow:0 12px 26px rgba(95,208,164,.24);
      }
      .mrm-post-shell-main.is-success .mrm-post-btn::before{
        content:"✓";font-weight:900;display:inline-block;margin-right:8px;
      }


      .mrm-post-btn--secondary{
        margin-top:6px;border-color:rgba(190,205,233,.18);
        background:linear-gradient(135deg,rgba(255,255,255,.10),rgba(255,255,255,.04));
        box-shadow:0 10px 22px rgba(0,0,0,.18);
      }
      .mrm-listing-queue-btn{
        border:1px solid var(--mrm-ui-border);background:rgba(255,255,255,.045);color:var(--mrm-ui-text);
        border-radius:13px;padding:9px 12px;font:800 11px/1.2 system-ui,-apple-system,sans-serif;cursor:pointer;
        min-height:36px;flex:1 1 112px;max-width:148px;
      }
      .mrm-listing-queue-btn.is-in-list,
      .mrm-listing-queue-btn.is-in-library,
      .mrm-library-btn.is-in-library{
        border-color:rgba(95,208,164,.34);background:rgba(95,208,164,.12);color:#dffbef;
      }

      .mrm-listing-btn{padding:9px 12px;min-width:0;width:100%;flex:1;text-align:center;font-size:11px;border-radius:13px;display:flex}
      .mrm-post-btn:hover,.mrm-listing-btn:hover,.mrm-icon-btn:hover{transform:translateY(-1px)}
      .mrm-post-btn[disabled],.mrm-listing-btn[disabled]{opacity:.82;cursor:default}
      .mrm-btn-meta{padding:0 14px 11px;color:var(--mrm-ui-muted);font:600 10px/1.35 system-ui,-apple-system,sans-serif;position:relative;z-index:1}
      .mrm-btn-meta.is-hidden{display:none}
      .mrm-pod-actions{display:flex;gap:8px;padding:0 12px 12px}
      .mrm-icon-btn{
        border:1px solid var(--mrm-ui-border);background:rgba(255,255,255,.035);border-radius:14px;
        padding:9px 12px;font-size:11px;font-weight:800;color:var(--mrm-ui-text)
      }
      .mrm-listing-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;align-items:center}
      .mrm-listing-download-cell{
        position:relative;flex:1 1 148px;min-width:148px;max-width:212px;display:flex;flex-direction:column;gap:4px;
      }
      .mrm-listing-shell{
        position:relative;display:flex;width:100%;min-width:0;max-width:none;
        border-radius:13px;border:1px solid var(--mrm-ui-border)!important;background:rgba(255,255,255,.028)!important;
        box-shadow:none!important;backdrop-filter:none!important;overflow:hidden!important;
      }
      .mrm-listing-shell .mrm-btn-progress{border-radius:13px;overflow:hidden;inset:0;z-index:0}
      .mrm-listing-shell .mrm-listing-btn{position:relative;z-index:1;border:0!important;background:transparent!important;box-shadow:none!important}
      .mrm-listing-download-cell > .mrm-btn-meta{padding:4px 2px 0;font-size:9px}
      .mrm-listing-shell.is-active{border-color:rgba(124,156,255,.28)}
      .mrm-listing-shell.is-done{border-color:rgba(77,216,160,.24)}
      .mrm-listing-shell.is-downloaded{background:rgba(95,208,164,.10)!important}
      .mrm-listing-shell.is-downloaded .mrm-listing-btn{color:#ddfff1}
      .mrm-is-downloaded-post{outline:1px solid rgba(95,208,164,.20);outline-offset:3px;border-radius:12px}
      .mrm-hide-downloaded-post{display:none!important}
      .mrm-is-queued-post{outline:1px solid rgba(123,140,255,.20);outline-offset:3px;border-radius:12px}
      .mrm-hide-queued-post{display:none!important}
      .mrm-is-saved-post{outline:1px solid rgba(255,191,105,.20);outline-offset:3px;border-radius:12px}
      .mrm-hide-saved-post{display:none!important}
      .mrm-listing-shell.is-queued{background:rgba(123,140,255,.10)!important}
      .mrm-listing-shell.is-queued .mrm-listing-btn{color:#eef1ff}
      .mrm-listing-shell.is-failed{border-color:rgba(255,109,143,.24)}
      .mrm-listing-shell:hover{transform:translateY(-1px);border-color:rgba(123,140,255,.22)}
      #${DEBUG_PANEL_ID}{
        position:fixed;left:max(12px, env(safe-area-inset-left));bottom:max(12px, env(safe-area-inset-bottom));z-index:2147483646;
        width:min(420px,92vw);max-height:min(42vh,340px);background:rgba(11,16,24,.97);border:1px solid var(--mrm-ui-border);
        border-radius:18px;color:var(--mrm-ui-text);box-shadow:var(--mrm-ui-shadow);overflow:hidden;display:none
      }
      #${DEBUG_PANEL_ID}.open{display:flex;flex-direction:column}
      #${DEBUG_PANEL_ID} .head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
      #${DEBUG_PANEL_ID} .body{padding:12px 14px;overflow:auto;display:flex;flex-direction:column;gap:10px}
      #${DEBUG_PANEL_ID} .entry{border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.025);border-radius:14px;padding:10px 11px;font:600 11px/1.45 system-ui,-apple-system,sans-serif}
      #${DEBUG_PANEL_ID} .muted{color:var(--mrm-ui-muted);font-size:10px}
      .mrm-hidden{display:none !important}
      .mrm-hidden{display:none !important}
      #${MODAL_FAB_ID}{
        position:fixed;right:max(12px, env(safe-area-inset-right));bottom:max(64px, calc(env(safe-area-inset-bottom) + 64px));
        z-index:2147483644;display:inline-flex;align-items:center;justify-content:center;gap:0;
        width:42px;height:42px;padding:0;border-radius:999px;cursor:pointer;
        background:color-mix(in srgb, var(--mrm-ui-panel) 78%, transparent);
        color:color-mix(in srgb, var(--mrm-ui-text) 86%, transparent);
        box-shadow:0 10px 24px rgba(0,0,0,.22);
        border:1px solid color-mix(in srgb, var(--mrm-ui-border) 82%, transparent);
        backdrop-filter:blur(8px) saturate(1.05);
        -webkit-backdrop-filter:blur(8px) saturate(1.05);
        font:700 16px/1 system-ui,-apple-system,sans-serif;
        opacity:.78;transition:transform .16s ease,opacity .16s ease,border-color .16s ease,background .16s ease,color .16s ease,box-shadow .16s ease;
      }
      #${MODAL_FAB_ID}:hover,
      #${MODAL_FAB_ID}:focus-visible{
        transform:translateY(-1px);
        opacity:.96;
        border-color:color-mix(in srgb, var(--mrm-ui-accent) 42%, var(--mrm-ui-border-strong));
        box-shadow:0 12px 28px rgba(0,0,0,.26);
        outline:none;
      }
      #${MODAL_FAB_ID}[data-open="true"]{
        background:color-mix(in srgb, var(--mrm-ui-accent) 24%, var(--mrm-ui-panel));
        color:#fff;
        opacity:.98;
        border-color:color-mix(in srgb, var(--mrm-ui-accent) 58%, var(--mrm-ui-border-strong));
      }
      @media (max-width: 720px){
        #${MODAL_FAB_ID}{
          right:max(10px, env(safe-area-inset-right));
          bottom:max(58px, calc(env(safe-area-inset-bottom) + 58px));
          width:40px;height:40px;font-size:15px;
        }
      }
      #${MODAL_OVERLAY_ID}{
        position:fixed;inset:0;z-index:2147483646;display:none;align-items:center;justify-content:center;
        background:rgba(5,10,16,.52);backdrop-filter:blur(8px);padding:12px;
      }
      #${MODAL_OVERLAY_ID}.open{display:flex}
      #${MODAL_OVERLAY_ID} .mrm-popup-modal-shell{
        width:min(700px, calc(100vw - 24px));height:min(96dvh, 980px);max-height:calc(100dvh - 24px);
        border-radius:24px;overflow:hidden;background:linear-gradient(180deg,rgba(15,22,33,.98),rgba(10,14,21,.99));
        border:1px solid var(--mrm-ui-border-strong);box-shadow:0 28px 60px rgba(0,0,0,.42);
        display:flex;flex-direction:column;
      }
      #${MODAL_OVERLAY_ID} .mrm-popup-modal-head{
        display:flex;align-items:center;justify-content:space-between;gap:10px;
        padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);
      }
      #${MODAL_OVERLAY_ID} .mrm-popup-modal-title{
        color:var(--mrm-ui-text);font:700 13px/1.2 system-ui,-apple-system,sans-serif;letter-spacing:.01em
      }
      #${MODAL_OVERLAY_ID} .mrm-popup-modal-close{
        display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;
        border:none;background:rgba(255,255,255,.04);color:var(--mrm-ui-text);cursor:pointer;
        font:700 18px/1 system-ui,-apple-system,sans-serif;
      }
      #${MODAL_OVERLAY_ID} .mrm-popup-modal-close:hover{background:rgba(255,255,255,.08)}
      #${MODAL_FRAME_ID}{
        flex:1 1 auto;width:100%;height:100%;border:none;background:transparent;
      }
      #${MODAL_OVERLAY_ID} .mrm-popup-modal-body{
        position:relative;flex:1 1 auto;min-height:320px;background:rgba(7,12,18,.98);
      }
      #${MODAL_OVERLAY_ID} .mrm-popup-modal-fallback{
        position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;
        gap:12px;padding:24px;background:linear-gradient(180deg,rgba(11,17,26,.98),rgba(8,12,18,.99));
        color:var(--mrm-ui-text);text-align:center;
      }
      #${MODAL_OVERLAY_ID} .mrm-popup-modal-fallback.show{display:flex}
      #${MODAL_OVERLAY_ID} .mrm-popup-modal-fallback-title{
        font:700 15px/1.25 system-ui,-apple-system,sans-serif;color:var(--mrm-ui-text)
      }
      #${MODAL_OVERLAY_ID} .mrm-popup-modal-fallback-text{
        max-width:320px;font:500 13px/1.45 system-ui,-apple-system,sans-serif;color:var(--mrm-ui-text-muted, rgba(255,255,255,.72))
      }
      #${MODAL_OVERLAY_ID} .mrm-popup-modal-fallback-actions{
        display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap
      }
      #${MODAL_OVERLAY_ID} .mrm-popup-modal-fallback-btn{
        appearance:none;border:1px solid rgba(255,255,255,.12);background:rgba(124,92,255,.18);color:var(--mrm-ui-text);
        padding:10px 14px;border-radius:999px;font:600 13px/1 system-ui,-apple-system,sans-serif;cursor:pointer;
      }
      #${MODAL_OVERLAY_ID} .mrm-popup-modal-fallback-btn.secondary{
        background:rgba(255,255,255,.05)
      }

      @media (max-width: 780px){
        #${MODAL_FAB_ID}{
          right:max(12px, env(safe-area-inset-right));bottom:max(72px, calc(env(safe-area-inset-bottom) + 72px));
          width:48px;height:48px;font-size:18px;
        }
        #${MODAL_OVERLAY_ID}{
          padding:0;
          align-items:stretch;
          justify-content:stretch;
          background:rgba(5,10,16,.72);
          backdrop-filter:blur(10px);
        }
        #${MODAL_OVERLAY_ID} .mrm-popup-modal-shell{
          width:100vw;
          height:100dvh;
          max-height:none;
          border-radius:0;
          border:none;
          box-shadow:none;
          margin:0;
        }
        #${MODAL_OVERLAY_ID} .mrm-popup-modal-head{
          padding:max(env(safe-area-inset-top),12px) max(env(safe-area-inset-right),14px) 12px max(env(safe-area-inset-left),14px);
        }
        #${MODAL_OVERLAY_ID} .mrm-popup-modal-body{min-height:0}
        #${MODAL_FRAME_ID}{min-height:0}
        #${POST_ACTION_ROOT_ID}[data-placement="floating"]{right:max(10px, env(safe-area-inset-right));left:auto;bottom:max(10px, env(safe-area-inset-bottom))}
        .mrm-post-shell-main{max-width:min(92vw,320px)}
        .mrm-post-shell-main{max-width:min(90vw,300px)}
        .mrm-post-btn,.mrm-listing-btn,.mrm-listing-queue-btn{min-height:44px!important;font-size:13px!important}
        .mrm-listing-actions{gap:8px!important;display:grid!important;grid-template-columns:1fr!important}
        .mrm-listing-download-cell,.mrm-listing-shell,.mrm-listing-queue-btn{width:100%!important;max-width:none!important;min-width:0!important;flex:1 1 100%!important}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureDebugPanel() {
    injectStyle();
    ensurePopupFab();
    let panel = document.getElementById(DEBUG_PANEL_ID);
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = DEBUG_PANEL_ID;
    panel.innerHTML = `
      <div class="hdr">
        <strong>MRM Debug</strong>
        <div style="display:flex;gap:8px">
          <button class="mrm-debug-btn" type="button" data-act="copy">Copy</button>
          <button class="mrm-debug-btn" type="button" data-act="close">Close</button>
        </div>
      </div>
      <div class="body"></div>
    `;
    panel.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-act]");
      if (!button) return;
      const act = button.dataset.act;
      if (act === "close") panel.classList.remove("open");
      if (act === "copy") {
        const text = debugEntries.slice(0, 80).map(formatDebugEntry).join("\n");
        await navigator.clipboard.writeText(text);
        showToast?.("Debug log copied.", "success");
      }
    });
    document.documentElement.appendChild(panel);
    return panel;
  }

  function formatDebugEntry(entry) {
    const ts = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : "";
    const meta = entry.meta ? ` ${typeof entry.meta === "string" ? entry.meta : JSON.stringify(entry.meta)}` : "";
    return `${ts} • ${entry.source} • ${entry.level}\n${entry.message}${meta}`;
  }

  function renderDebugPanel() {
    const panel = ensureDebugPanel();
    const body = panel.querySelector(".body");
    body.textContent = "";
    debugEntries.slice(0, 40).forEach((entry) => {
      const row = document.createElement("div");
      row.className = "entry";
      const ts = document.createElement("div");
      ts.className = "muted";
      ts.textContent = `${new Date(entry.timestamp).toLocaleTimeString()} • ${entry.source} • ${entry.level}`;
      const msg = document.createElement("div");
      msg.textContent = entry.message;
      row.append(ts, msg);
      if (entry.meta) {
        const meta = document.createElement("div");
        meta.className = "muted";
        meta.textContent = typeof entry.meta === "string" ? entry.meta : JSON.stringify(entry.meta);
        row.append(meta);
      }
      body.appendChild(row);
    });
  }

  function toggleDebugPanel(force) {
    const panel = ensureDebugPanel();
    panel.classList.toggle("open", force ?? !panel.classList.contains("open"));
    renderDebugPanel();
  }

  async function getPostPayload(doc = document) {
    if (isNhentaiHost(doc) && !parseNhentaiGalleryApi(doc)?.pages?.length) {
      await fetchNhentaiGalleryApi(doc);
    }
    const meta = extractPostMeta(doc);
    return {
      title: meta.title,
      cleanTitle: meta.cleanTitle,
      artist: meta.artist,
      langs: meta.langs,
      page: getCurrentPage(doc),
      images: getImageSourcesFromDocument(doc),
      url: getDocumentUrl(doc).split("#")[0],
      filename: buildPagedArchiveFilename({
        title: meta.title,
        cleanTitle: meta.cleanTitle,
        artist: meta.artist,
        langs: meta.langs,
        page: getCurrentPage(doc),
        images: getImageSourcesFromDocument(doc),
        omitPageSuffix: true,
        singleArchive: true,
      }, "cbz"),
    };
  }

  function isPostPage() {
    const contentType = determineContentType();
    return contentType.type === "images" && !isArchiveLikePage(document);
  }

  function isArchivePage() {
    return isArchiveLikePage(document);
  }

  function ensureBridgeAssets() {
    const assetIds = [
      ["mrm-jszip-asset", browser.runtime.getURL("scripts/jszip.min.js")],
      ["mrm-filesaver-asset", browser.runtime.getURL("scripts/FileSaver.min.js")],
    ];
    assetIds.forEach(([id, src]) => {
      if (document.getElementById(id)) return;
      const script = document.createElement("script");
      script.id = id;
      script.src = src;
      script.async = false;
      (document.head || document.documentElement).appendChild(script);
    });
  }

  function ensurePageFetchBridge() {
    ensureBridgeAssets();
    if (document.getElementById(PAGE_BRIDGE_ID)) return;
    const script = document.createElement("script");
    script.id = PAGE_BRIDGE_ID;
    const bridge = `
(() => {
  if (window.__mrmPageBridgeInstalled) return;
  window.__mrmPageBridgeInstalled = true;

  function post(payload, transfers) {
    try {
      window.postMessage(payload, "*", transfers || []);
    } catch {
      window.postMessage(payload, "*");
    }
  }

  function uint8ArrayToBase64(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
  }

  function waitForAssets() {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (window.JSZip && window.saveAs) return resolve();
        if (Date.now() - start > 20000) return resolve();
        setTimeout(check, 50);
      };
      check();
    });
  }

  window.addEventListener("message", async (event) => {
    const data = event.data;
    if (!data || data.source !== "mrm-extension") return;
    if (data.type === "MRM_PAGE_FETCH_REQUEST") {
      try {
        const { requestId, url, options, wantBody, responseType } = data;
        const opts = Object.assign({ credentials: "include", cache: "no-store", mode: "cors" }, options || {});
        const res = await fetch(url, opts);
        const headers = Array.from(res.headers.entries());
        if (wantBody) {
          if (responseType === "text") {
            post({ source: "mrm-page", type: "MRM_PAGE_FETCH_RESPONSE", requestId, ok: res.ok, status: res.status, statusText: res.statusText, headers, body: await res.text(), responseType: "text" });
            return;
          }
          const buffer = await res.arrayBuffer();
          const bodyBase64 = uint8ArrayToBase64(new Uint8Array(buffer));
          post({ source: "mrm-page", type: "MRM_PAGE_FETCH_RESPONSE", requestId, ok: res.ok, status: res.status, statusText: res.statusText, headers, bodyBase64, byteLength: buffer.byteLength, responseType: "arraybuffer" });
          return;
        }
        post({ source: "mrm-page", type: "MRM_PAGE_FETCH_RESPONSE", requestId, ok: res.ok, status: res.status, statusText: res.statusText, headers });
      } catch (error) {
        post({
          source: "mrm-page",
          type: "MRM_PAGE_FETCH_RESPONSE",
          requestId: data.requestId,
          ok: false,
          error: error && error.message ? error.message : String(error)
        });
      }
    }

    if (data.type === "MRM_PAGE_DOWNLOAD_CBZ") {
      await waitForAssets();
      const { requestId, payload } = data;
      try {
        const images = Array.isArray(payload.images) ? payload.images : [];
        if (!images.length) throw new Error("No images found on the page.");
        const concurrency = Math.max(1, Math.min(Number(payload.concurrency) || 4, 5));
        const zip = new window.JSZip();
        const results = new Array(images.length);
        let nextIndex = 0;
        let completed = 0;

        async function fetchOne(index) {
          const imageUrl = images[index];
          const res = await fetch(imageUrl, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            mode: "cors",
            referrer: payload.url
          });
          if (!res.ok) throw new Error("HTTP " + res.status + " for " + imageUrl);
          const blob = await res.blob();
          const ext = (blob.type && blob.type.split("/")[1]) || imageUrl.split(".").pop().split(/[?#]/)[0] || "jpg";
          results[index] = { blob, ext };
          completed += 1;
          post({
            source: "mrm-page",
            type: "MRM_PAGE_DOWNLOAD_PROGRESS",
            requestId,
            current: completed,
            total: images.length,
            phase: "download",
            message: "Downloading " + completed + " of " + images.length
          });
        }

        async function worker() {
          while (nextIndex < images.length) {
            const index = nextIndex;
            nextIndex += 1;
            await fetchOne(index);
          }
        }

        await Promise.all(Array.from({ length: Math.min(concurrency, images.length) }, worker));

        for (let i = 0; i < results.length; i += 1) {
          const item = results[i];
          zip.file("image_" + String(i + 1).padStart(3, "0") + "." + item.ext, item.blob, { binary: true });
        }

        post({ source: "mrm-page", type: "MRM_PAGE_DOWNLOAD_PROGRESS", requestId, current: images.length, total: images.length, phase: "pack", message: "Packing CBZ" });
        const content = await zip.generateAsync({ type: "blob", mimeType: "application/octet-stream" }, (meta) => {
          post({
            source: "mrm-page",
            type: "MRM_PAGE_DOWNLOAD_PROGRESS",
            requestId,
            current: Math.round(meta.percent || 0),
            total: 100,
            phase: "pack",
            message: "Packing CBZ"
          });
        });
        let filename = String(payload.filename || (payload.title || "download") + ".cbz").normalize("NFKD");
        filename = filename
          .replace(/[\\u0300-\\u036f]/g, "")
          .replace(/[\\u0000-\\u001f\\u007f]/g, "")
          .replace(/[\\\\/:*?"<>|[\\]{}()+]+/g, "_")
          .replace(/[^\\x20-\\x7e]+/g, "_")
          .replace(/[^A-Za-z0-9._ -]+/g, "_")
          .replace(/\\s+/g, " ")
          .replace(/_+/g, "_")
          .replace(/^\\.+/g, "")
          .replace(/[. _-]+$/g, "")
          .replace(/\\.cbz\\.zip$/i, ".cbz")
          .replace(/\\.zip$/i, "");
        filename = filename.replace(/\\.cbz$/i, "").replace(/[. _-]+$/g, "");
        if (!filename || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\\.|$)/i.test(filename)) filename = "download";
        filename = filename.slice(0, 150).replace(/[. _-]+$/g, "") || "download";
        const finalFilename = filename + ".cbz";
        const archiveBlob = new Blob([content], { type: "application/octet-stream" });
        window.saveAs(archiveBlob, finalFilename);
        post({ source: "mrm-page", type: "MRM_PAGE_DOWNLOAD_RESULT", requestId, ok: true, filename: finalFilename });
      } catch (error) {
        post({
          source: "mrm-page",
          type: "MRM_PAGE_DOWNLOAD_RESULT",
          requestId,
          ok: false,
          error: error && error.message ? error.message : String(error)
        });
      }
    }
  }, false);
})();
    `;
    script.textContent = bridge;
    document.documentElement.appendChild(script);
    script.remove();
  }

  function pageFetch(url, options = {}) {
    ensurePageFetchBridge();
    const requestId = `mrm_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener("message", handle, false);
        resolve({ ok: false, error: "Timed out waiting for page fetch." });
      }, options.timeoutMs || 60000);

      function handle(event) {
        const data = event.data;
        if (!data || data.source !== "mrm-page" || data.type !== "MRM_PAGE_FETCH_RESPONSE" || data.requestId !== requestId) return;
        clearTimeout(timeout);
        window.removeEventListener("message", handle, false);
        resolve(data);
      }

      window.addEventListener("message", handle, false);
      window.postMessage({
        source: "mrm-extension",
        type: "MRM_PAGE_FETCH_REQUEST",
        requestId,
        url,
        options: options.options || { method: "GET" },
        wantBody: !!options.wantBody,
        responseType: options.responseType || "arraybuffer",
      }, "*");
    });
  }

  async function requestPageBridgeDownloadCbz(payload) {
    ensurePageFetchBridge();
    const images = filterValidatedDownloadImages(Array.isArray(payload.images) ? payload.images : [], payload.url || location.href);
    if (!images.length) throw new Error("No images found on the page after validation.");

    const concurrency = Math.max(1, Math.min(Number(payload.imageConcurrency ?? payload.concurrency) || (isAndroidRuntime ? 3 : 6), 8));
    const filename = normalizeCbzFilename(payload.filename || `${sanitizeFilename(payload.title)} - Page ${payload.page}.cbz`);
    let coverDataUrl = "";

    try {
      const firstImage = images[0];
      if (firstImage) {
        const fetched = await fetchImagePayloadWithRetries(firstImage, payload.url, 2);
        coverDataUrl = await createCoverDataUrlFromDownloadedPage(fetched.bytes, fetched.contentType || "image/jpeg");
      }
    } catch {}

    return new Promise((resolve, reject) => {
      const requestId = `mrm_page_dl_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      let settled = false;
      let completionFallbackTimer = 0;
      let lastUiFlushAt = 0;
      let lastUiCurrent = -1;
      let lastListingRefreshAt = 0;
      const finish = (fn) => (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (completionFallbackTimer) clearTimeout(completionFallbackTimer);
        window.removeEventListener("message", handle, false);
        fn(value);
      };
      const resolveOnce = finish(resolve);
      const rejectOnce = finish(reject);
      const timeout = setTimeout(() => {
        rejectOnce(new Error("Timed out waiting for in-page CBZ download."));
      }, 10 * 60 * 1000);

      async function flushBridgeProgress(data, force = false) {
        const phase = String(data.phase || "");
        const total = Math.max(1, Number(data.total) || images.length || 1);
        const current = Math.max(0, Number(data.current) || 0);
        const now = Date.now();
        if (!force && phase !== "pack" && now - lastUiFlushAt < 450 && current - lastUiCurrent < Math.min(2, concurrency)) {
          return;
        }
        lastUiFlushAt = now;
        lastUiCurrent = current;
        const progress = phase === "pack"
          ? Math.max(94, Math.min(99, 94 + Math.round((current / 100) * 5)))
          : Math.max(2, Math.min(90, Math.round((current / total) * 90)));
        const status = phase === "pack" ? "packing" : "downloading";
        const progressLabel = phase === "pack"
          ? "Packing CBZ"
          : `Downloading ${Math.min(current, total)} of ${total}`;

        await syncJobState({
          status,
          progress,
          progressLabel,
          completed: phase === "pack" ? total : current,
          total,
          count: total,
        });
        await reportQueueProgress(payload, {
          status,
          phase: phase === "pack" ? "packing" : "fetching",
          progress,
          progressLabel,
          currentImage: phase === "pack" ? total : current,
          totalImages: total,
          count: total,
          lastError: null,
        });
        updatePostActionState(progressLabel, true, progress, progressLabel);
        if (force || now - lastListingRefreshAt > 900) {
          lastListingRefreshAt = now;
          await refreshListingStates();
        }

        if (phase === "pack" && Number(data.current) >= 100) {
          if (completionFallbackTimer) clearTimeout(completionFallbackTimer);
          completionFallbackTimer = window.setTimeout(() => {
            resolveOnce({ ok: true, filename, coverDataUrl, recoveredFromMissingResult: true });
          }, 2500);
        }
      }

      async function handle(event) {
        const data = event.data;
        if (!data || data.source !== "mrm-page" || data.requestId !== requestId) return;

        if (data.type === "MRM_PAGE_DOWNLOAD_PROGRESS") {
          await flushBridgeProgress(data, false);
          return;
        }

        if (data.type === "MRM_PAGE_DOWNLOAD_RESULT") {
          if (data.ok) {
            resolveOnce({ ok: true, filename: data.filename || filename, coverDataUrl });
          } else {
            rejectOnce(new Error(data.error || "Could not build archive"));
          }
        }
      }

      window.addEventListener("message", handle, false);
      window.postMessage({
        source: "mrm-extension",
        type: "MRM_PAGE_DOWNLOAD_CBZ",
        requestId,
        payload: {
          ...payload,
          images,
          concurrency,
          filename,
        },
      }, "*");
    });
  }

  async function requestPageDownloadCbz(payload) {
    ensurePageFetchBridge();
    if (isAndroidRuntime) {
      await logVerboseAction("CONTENT", "Using in-page Android CBZ builder", {
        url: payload?.url || location.href,
        host: location.hostname.replace(/^www\./, ""),
      });
      return requestPageBridgeDownloadCbz(payload);
    }
    return buildAndDownloadCbzInContent(payload);
  }

  async function generateCurrentPageLibraryCover() {
    if (!isPostPage()) {
      await debug("warn", "Library cover generation skipped: not a post page", { url: location.href });
      return;
    }

    try {
      const payload = await getPostPayload(document);
      if (!payload.images.length) {
        throw new Error("No images found on the current post page.");
      }

      await debug("info", "Starting cover-only first-page Library cover generation", {
        url: payload.url,
        firstImage: payload.images[0],
        images: payload.images.length,
      });
      await logVerboseAction("CONTENT", "Cover-only first-page Library cover generation started", {
        url: payload.url,
        firstImage: payload.images[0],
        images: payload.images.length,
      });

      const fetched = await fetchImagePayload(payload.images[0], payload.url);
      const contentType = fetched.contentType || "image/jpeg";
      await logVerboseAction("CONTENT", "Cover-only first-page image fetched", {
        url: payload.url,
        firstImage: payload.images[0],
        fetchedBytes: fetched.bytes?.byteLength || fetched.bytes?.length || 0,
        totalImagesOnPost: payload.images.length,
        coverOnly: true,
      });
      const coverDataUrl = await createCoverDataUrlFromDownloadedPage(fetched.bytes, contentType);
      if (!coverDataUrl) {
        throw new Error("Could not create a cover thumbnail from the first downloaded page.");
      }

      await browser.runtime.sendMessage({
        type: "MRM_UPDATE_LIBRARY_COVER",
        url: payload.url,
        pageCount: payload.images.length,
        coverDataUrl,
        coverFallbackSource: "first-downloaded-page-cover-only",
      });

      await debug("info", "Cover-only first-page Library cover generated", {
        url: payload.url,
        bytes: coverDataUrl.length,
        pageCount: payload.images.length,
      });
      await logVerboseAction("CONTENT", "Cover-only first-page Library cover generated", {
        url: payload.url,
        bytes: coverDataUrl.length,
        pageCount: payload.images.length,
      });

      if (location.hash === COVER_GENERATION_HASH) {
        setTimeout(() => browser.runtime.sendMessage({ type: "MRM_CLOSE_TAB_IF_BACKGROUND" }).catch(() => {}), 800);
      }
    } catch (error) {
      await debug("error", "Cover-only first-page Library cover generation failed", {
        url: location.href.split("#")[0],
        error: error?.message || String(error),
      });
      await logVerboseAction("CONTENT", "Cover-only first-page Library cover generation failed", {
        url: location.href.split("#")[0],
        error: error?.message || String(error),
      });
      if (location.hash === COVER_GENERATION_HASH) {
        setTimeout(() => browser.runtime.sendMessage({ type: "MRM_CLOSE_TAB_IF_BACKGROUND" }).catch(() => {}), 1600);
      }
    }
  }

  async function runCurrentPageDownload(triggerLabel = "Download CBZ") {
    if (!isPostPage()) {
      showToast?.("Open a post page first.", "warning");
      return;
    }
    try {
      const payload = await getPostPayload(document);
      if (!payload.images.length) {
        throw new Error("No images found on the current post page.");
      }
      payload.filename = payload.filename || buildPagedArchiveFilename({ ...payload, omitPageSuffix: true, singleArchive: true }, "cbz");
      payload.concurrency = 4;
      currentJobState = createJobRecord({
        url: payload.url,
        title: payload.title,
        page: payload.page,
        count: payload.images.length,
        total: payload.images.length,
        progress: 1,
        progressLabel: "Preparing download…",
        status: "preparing",
        autoOpened: location.hash === AUTO_HASH,
      });
      await upsertActiveJob(currentJobState);
      updatePostActionState("Preparing…", true, 1, "Preparing download…");
      await logVerboseAction("CONTENT", "Post-page download started", { url: payload.url, filename: payload.filename });
      await debug("info", "Starting post-page CBZ download", { url: payload.url, images: payload.images.length });
      const result = await requestPageDownloadCbz(payload);
      await syncJobState({
        status: "completed",
        progress: 100,
        progressLabel: "Done",
        completed: payload.images.length,
        total: payload.images.length,
        filename: result.filename || payload.filename,
      });
      await finishCurrentJob("completed", { filename: result.filename || payload.filename });
      await browser.runtime.sendMessage({
        type: "MRM_MARK_LIBRARY_DOWNLOADED",
        url: payload.url,
        pageCount: payload.images.length,
        coverDataUrl: result.coverDataUrl || "",
        coverFallbackSource: result.coverDataUrl ? "first-downloaded-page" : "",
      }).catch(() => {});
      updatePostActionState("Done", true, 100, "Saved to downloads");
      showToast?.("CBZ saved.", "success");
      if (location.hash === AUTO_HASH) {
        setTimeout(() => browser.runtime.sendMessage({ type: "MRM_CLOSE_TAB_IF_BACKGROUND" }).catch(() => {}), 800);
      }
    } catch (error) {
      await debug("error", "Post-page CBZ download failed", error?.message || String(error));
      await syncJobState({
        status: "failed",
        progressLabel: error?.message || "Download failed",
        error: error?.message || String(error),
      });
      await finishCurrentJob("failed", { error: error?.message || String(error) });
      updatePostActionState("Retry Download", false, 0, error?.message || "Download failed");
      showToast?.(error?.message || "Download failed.", "error");
    } finally {
      setTimeout(() => {
        const btn = document.querySelector(`#${POST_ACTION_ROOT_ID} [data-role="download"]`);
        const meta = document.querySelector(`#${POST_ACTION_ROOT_ID} .mrm-btn-meta`);
        if (btn && btn.textContent === "Done") {
          btn.textContent = triggerLabel;
          btn.disabled = false;
        }
        if (meta && btn && btn.textContent === triggerLabel) {
          meta.textContent = "";
          meta.classList.add("is-hidden");
          const fill = document.querySelector(`#${POST_ACTION_ROOT_ID} .mrm-btn-progress-fill`);
          if (fill) fill.style.width = "0%";
        }
      }, 1800);
    }
  }


  

function getReaderStyleButtonHost() {
  const readerButton = document.getElementById("mrm-open-reader-page");
  if (readerButton?.parentElement) return { host: readerButton.parentElement, anchor: readerButton, mode: "inline" };

  const toolbarLeft = document.querySelector(".mrm-post-toolbar-left");
  if (toolbarLeft) return { host: toolbarLeft, anchor: null, mode: "inline" };

  const toolbarRight = document.querySelector(".mrm-post-toolbar-right");
  if (toolbarRight) return { host: toolbarRight, anchor: null, mode: "inline" };

  const entryMeta = document.querySelector("article.post .entry-header .entry-meta, .post .entry-header .entry-meta, .entry-header .entry-meta");
  if (entryMeta?.parentElement) return { host: entryMeta.parentElement, anchor: entryMeta, mode: "inline-after" };

  const title = document.querySelector("article.post .entry-title, .post .entry-title, h1.entry-title, article h1");
  if (title?.parentElement) return { host: title.parentElement, anchor: title, mode: "inline-after" };

  return null;
}

function placePostActionButton(root) {
  if (!(root instanceof HTMLElement)) return;
  const shell = root.querySelector(".mrm-post-shell-main");
  if (!(shell instanceof HTMLElement)) return;

  const target = getReaderStyleButtonHost();
  if (target?.host) {
    root.dataset.placement = "inline";
    shell.classList.add("mrm-post-shell-inline");
    shell.classList.remove("mrm-post-shell-floating");

    if (target.anchor?.parentElement === target.host) {
      target.anchor.insertAdjacentElement("afterend", root);
    } else {
      target.host.appendChild(root);
    }
    return;
  }

  root.dataset.placement = "floating";
  shell.classList.add("mrm-post-shell-floating");
  shell.classList.remove("mrm-post-shell-inline");
  if (root.parentElement !== document.documentElement) {
          (document.body || document.documentElement).appendChild(root);
    root.style.top = root.style.top || "12px";
    root.style.right = root.style.right || "12px";
    root.style.left = "auto";
    root.style.bottom = "auto";
  }
}

function schedulePostActionPlacementRefresh(root) {
  const refresh = () => {
    if (document.getElementById(POST_ACTION_ROOT_ID) === root) placePostActionButton(root);
  };
  refresh();
  window.setTimeout(refresh, 300);
  window.setTimeout(refresh, 900);
  window.setTimeout(refresh, 1800);
}

function addPostActionButton() {
  if (!isPostPage() || document.getElementById(POST_ACTION_ROOT_ID)) return;
  injectStyle();

  const root = document.createElement("div");
  root.id = POST_ACTION_ROOT_ID;
  root.dataset.placement = "floating";

  const shell = document.createElement("div");
  shell.className = "mrm-post-shell mrm-post-shell-main mrm-post-shell-floating";

  const progress = document.createElement("div");
  progress.className = "mrm-btn-progress";
  progress.innerHTML = '<div class="mrm-btn-progress-fill"></div>';

  const downloadBtn = document.createElement("button");
  downloadBtn.className = "mrm-post-btn mrm-btn mrm-btn--primary";
  downloadBtn.dataset.role = "download";
  downloadBtn.type = "button";
  downloadBtn.textContent = "Download CBZ";
  downloadBtn.addEventListener("click", () => runCurrentPageDownload("Download CBZ"));

  const meta = document.createElement("div");
  meta.className = "mrm-btn-meta is-hidden";

  const addToListBtn = document.createElement("button");
  addToListBtn.className = "mrm-post-btn mrm-post-btn--secondary";
  addToListBtn.dataset.role = "add-to-queue";
  addToListBtn.type = "button";
  addToListBtn.textContent = "Add to Queue";
  addToListBtn.addEventListener("click", async () => {
    try {
      addToListBtn.disabled = true;
      const item = createQueueItemFromLink({ href: location.href, textContent: getTitle(document), getAttribute: () => "" }, null);
      const result = await addItemToDownloadQueue(item);
      addToListBtn.textContent = "Queued";
      showToast?.(result?.existed ? "Already in download queue." : "Added to download queue.", "success");
    } catch (error) {
      addToListBtn.textContent = "Retry Add";
      showToast?.(error?.message || "Could not add to list.", "error");
    } finally {
      setTimeout(() => { addToListBtn.disabled = false; }, 500);
    }
  });

  const saveLibraryBtn = document.createElement("button");
  saveLibraryBtn.className = "mrm-post-btn mrm-post-btn--secondary mrm-library-btn";
  saveLibraryBtn.dataset.role = "save-library";
  saveLibraryBtn.dataset.mrmLibraryUrl = location.href.split("#")[0];
  saveLibraryBtn.type = "button";
  saveLibraryBtn.textContent = "Save to Library";
  saveLibraryBtn.addEventListener("click", async () => {
    try {
      saveLibraryBtn.disabled = true;
      const item = await createLibraryMetadataFromLink({ href: location.href, textContent: getTitle(document), getAttribute: () => "" }, null);
      const result = await toggleItemInLibrary(item);
      saveLibraryBtn.textContent = result.removed ? "Save to Library" : "Saved";
      saveLibraryBtn.classList.toggle("is-in-library", !result.removed);
      showToast?.(result.removed ? "Removed from Library." : "Saved to Library.", "success");
    } catch (error) {
      saveLibraryBtn.textContent = "Retry Save";
      showToast?.(error?.message || "Could not save to Library.", "error");
    } finally {
      setTimeout(() => { saveLibraryBtn.disabled = false; }, 500);
    }
  });

  const openLibraryBtn = document.createElement("button");
  openLibraryBtn.className = "mrm-post-btn mrm-post-btn--secondary mrm-library-open-btn";
  openLibraryBtn.type = "button";
  openLibraryBtn.textContent = "Library";
  openLibraryBtn.addEventListener("click", () => {
    browser.runtime.sendMessage({ type: "MRM_OPEN_LIBRARY_PAGE" }).catch(() => {
      window.open(browser.runtime.getURL("library.html"), "_blank", "noopener");
    });
  });

  const downloadCell = document.createElement("div");
  downloadCell.className = "mrm-post-download-cell";
  downloadCell.append(progress, downloadBtn);

  shell.append(downloadCell, addToListBtn, saveLibraryBtn, openLibraryBtn, meta);
  updateLibraryButtonState(saveLibraryBtn, location.href.split("#")[0]);
  root.append(shell);

        (document.body || document.documentElement).appendChild(root);
    root.style.top = root.style.top || "12px";
    root.style.right = root.style.right || "12px";
    root.style.left = "auto";
    root.style.bottom = "auto";
  schedulePostActionPlacementRefresh(root);
}


  function findPostLink(card) {
    return card.querySelector(".entry-title-link, .entry-title a, h2 a, h3 a, h4 a, .entry-image a, .entry-thumb a, .post-thumbnail a, .cover[href], a[rel='bookmark'], a[href*='myreadingmanga.info/'], a[href*='mangalotus.com/'], a[href*='baramangaonline.com/'], a[href*='yaoimangaonline.com/'], a[href*='nhentai.net/g/']");
  }

  function getListingActionPlacement(card) {
    const contentHost = card.querySelector(".post-content, .entry-content, .content, .mrm-card-body, .card-content, .caption");
    if (contentHost) {
      const preferredAnchor = contentHost.querySelector(".bmo-mrm-card-actions, .post-actions, .entry-footer, .post-footer, .read-more, .reader, .btn-actions");
      if (preferredAnchor && preferredAnchor.parentElement === contentHost) {
        return { host: contentHost, before: preferredAnchor };
      }

      const metadataAnchor = contentHost.querySelector(".post-meta, .entry-meta, .post-category, .post-date, time, .meta");
      if (metadataAnchor && metadataAnchor.parentElement === contentHost) {
        return { host: contentHost, before: metadataAnchor };
      }

      return { host: contentHost, before: null };
    }

    const fallbackHost = card.querySelector(".entry-header, .mrm-card-head, .entry-title, header, .post-header")
      || card.querySelector(".cover")
      || card;

    const safeHost = /^H[1-6]$/.test(fallbackHost?.tagName || "") ? fallbackHost.parentElement || card : fallbackHost;
    return { host: safeHost, before: null };
  }

  async function fetchPostPayloadFromListingUrl(url) {
    const normalizedUrl = new URL(url, location.href).href;
    const response = await pageFetch(normalizedUrl, {
      options: {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        mode: "cors",
        referrer: location.href,
      },
      wantBody: true,
      responseType: "text",
      timeoutMs: 90000,
    });

    if (!response?.ok || typeof response.body !== "string") {
      const statusText = response?.status ? `HTTP ${response.status}` : (response?.error || "Unknown error");
      throw new Error(`Post page fetch failed: ${statusText}`);
    }

    const doc = parseHtmlDocument(response.body, normalizedUrl);
    if (isNhentaiHost(doc) && !parseNhentaiGalleryApi(doc)?.pages?.length) {
      await fetchNhentaiGalleryApi(doc);
    }

    const payload = await getPostPayload(doc);
    payload.url = normalizedUrl.split("#")[0];

    let settings = {};
    try {
      const settingsResponse = await browser.runtime.sendMessage({ type: "MRM_GET_SETTINGS" });
      settings = settingsResponse?.settings || {};
    } catch {}
    const queuePerHost = Math.max(1, Number(settings.queuePerHostConcurrency) || 1);
    const queueConcurrency = Math.max(1, Number(settings.queueConcurrency) || 1);
    const androidSafeMode = !!settings.androidSafeMode;
    const targetImageConcurrency = isAndroidRuntime
      ? (androidSafeMode ? 2 : Math.max(3, queuePerHost + queueConcurrency))
      : Math.max(queuePerHost * 2, queueConcurrency * 2, 4);
    payload.imageConcurrency = Math.max(2, Math.min(targetImageConcurrency, isAndroidRuntime ? 4 : 8));
    payload.concurrency = payload.imageConcurrency;

    if (!payload.images.length) {
      throw new Error("No images found on the linked post page.");
    }

    return payload;
  }


  const DOWNLOAD_QUEUE_KEY = "mrmDownloadQueue";

  function createQueueId(url) {
    try {
      const parsed = new URL(url, location.href);
      parsed.hash = "";
      return `${parsed.hostname.replace(/^www\./, "")}:${parsed.pathname}`.replace(/[^a-z0-9:_/-]+/gi, "-").toLowerCase();
    } catch {
      return `queued:${Date.now()}`;
    }
  }

  function cleanCardTitleText(value) {
    return String(value || "")
      .replace(/Download\s*CBZ/gi, " ")
      .replace(/Add\s*to\s*Queue/gi, " ")
      .replace(/Generate\s*cover\s*only/gi, " ")
      .replace(/Downloaded\s*✓?/gi, " ")
      .replace(/Queued\s*✓?/gi, " ")
      .replace(/Saved\s*✓?/gi, " ")
      .replace(/Retry\s*Add/gi, " ")
      .replace(/Save\s*to\s*Library/gi, " ")
      .replace(/\bSave\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getCleanCardText(card) {
    if (!card?.cloneNode) return "";
    const clone = card.cloneNode(true);
    clone.querySelectorAll(".mrm-listing-actions,.mrm-post-actions,button,input,select,textarea,.mrm-btn-meta,.mrm-listing-meta").forEach((node) => node.remove());
    return cleanCardTitleText(clone.textContent || "");
  }

  function getCardTitle(card, link) {
    const titleNode = card?.querySelector?.(".entry-title a, .post-title a, h1 a, h2 a, h3 a, h4 a, .caption a, .title a, .entry-title, .post-title, h1, h2, h3, h4, .caption, .title");
    const candidates = [
      link?.getAttribute?.("title"),
      titleNode?.getAttribute?.("title"),
      titleNode?.textContent,
      link?.textContent,
      getCleanCardText(card),
    ].map(cleanCardTitleText).filter(Boolean);
    return candidates[0] || "Untitled";
  }

  function getCardThumbnail(card) {
    const img = card?.querySelector?.("img");
    return img ? getBestThumbnailSource(img, img.currentSrc || img.src || "", location.href) : "";
  }

  function createQueueItemFromLink(link, card = null) {
    const url = new URL(link.href, location.href).href;
    return {
      id: createQueueId(url),
      title: card ? getCardTitle(card, link) : getTitle(document),
      url,
      host: new URL(url).hostname.replace(/^www\./, ""),
      thumbnailUrl: card ? getCardThumbnail(card) : "",
      status: "pending",
      addedAt: Date.now(),
      lastError: null,
    };
  }

  async function getDownloadQueue() {
    const result = await browser.storage.local.get([DOWNLOAD_QUEUE_KEY]);
    return Array.isArray(result[DOWNLOAD_QUEUE_KEY]) ? result[DOWNLOAD_QUEUE_KEY] : [];
  }

  async function saveDownloadQueue(queue) {
    await browser.storage.local.set({ [DOWNLOAD_QUEUE_KEY]: queue });
  }

  async function addItemToDownloadQueue(item) {
    try {
      const response = await browser.runtime.sendMessage({
        type: "MRM_ADD_TO_DOWNLOAD_QUEUE",
        item,
      });
      if (response?.ok) {
        await logVerboseAction("CONTENT", "Queue item saved through background", {
          url: normalizeJobUrl(item.url),
          title: item.title || "",
          count: response.count,
          existed: !!response.existed,
        });
        return { item: response.item || item, count: response.count || 0, existed: !!response.existed };
      }
      throw new Error(response?.error || "Background queue save failed.");
    } catch (backgroundError) {
      await logVerboseAction("CONTENT", "Background queue save failed; using content fallback", {
        url: normalizeJobUrl(item.url),
        title: item.title || "",
        error: backgroundError?.message || String(backgroundError),
      });
      const queue = await getDownloadQueue();
      const index = queue.findIndex((entry) => entry.id === item.id || normalizeJobUrl(entry.url) === normalizeJobUrl(item.url));
      const nextItem = { ...item, status: "pending", lastError: null, addedAt: index >= 0 ? queue[index].addedAt || Date.now() : Date.now() };
      if (index >= 0) {
        const existingStatus = String(queue[index]?.status || "").toLowerCase();
        if (!["completed", "downloading", "packing", "opening"].includes(existingStatus)) {
          queue[index] = { ...queue[index], ...nextItem };
        }
      } else {
        queue.unshift(nextItem);
      }
      await saveDownloadQueue(queue);
      return { item: nextItem, count: queue.length, existed: index >= 0 };
    }
  }

  async function updateQueueButtonState(button, url) {
    if (!button) return;
    try {
      const queue = await getDownloadQueue();
      const exists = queue.some((entry) => normalizeJobUrl(entry.url) === normalizeJobUrl(url));
      button.textContent = exists ? "Queued" : "Add to Queue";
      button.disabled = false;
      button.classList.toggle("is-in-list", exists);
    } catch {
      button.textContent = "Add to Queue";
      button.disabled = false;
    }
  }


  async function createLibraryMetadataFromLink(link, card = null) {
    const extractor = window.MRMMetadataExtractor;
    const store = window.MRMLibraryStore;
    const url = new URL(link.href, location.href).href;
    let raw = card && extractor?.extractCardMetadata
      ? extractor.extractCardMetadata(card, link)
      : extractor?.extractPostMetadata
        ? extractor.extractPostMetadata(document)
        : {
            url,
            canonicalUrl: url.split("#")[0],
            host: new URL(url).hostname.replace(/^www\./, ""),
            title: card ? getCardTitle(card, link) : getTitle(document),
            displayTitle: card ? getCardTitle(card, link) : getTitle(document),
            coverUrl: card ? getCardThumbnail(card) : "",
            thumbnailUrl: card ? getCardThumbnail(card) : "",
          };

    if (card && extractor?.extractPostMetadata) {
      try {
        const response = await pageFetch(url, {
          options: {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            mode: "cors",
            referrer: location.href,
          },
          wantBody: true,
          responseType: "text",
          timeoutMs: 45000,
        });
        if (response?.ok && typeof response.body === "string") {
          const doc = parseHtmlDocument(response.body, url);
          const postRaw = extractor.extractPostMetadata(doc);
          raw = {
            ...postRaw,
            ...raw,
            title: postRaw.title || raw.title,
            displayTitle: postRaw.displayTitle || raw.displayTitle,
            sortTitle: postRaw.sortTitle || raw.sortTitle,
            coverUrl: raw.coverUrl || postRaw.coverUrl || "",
            thumbnailUrl: raw.thumbnailUrl || raw.coverUrl || postRaw.thumbnailUrl || postRaw.coverUrl || "",
            tags: Array.from(new Set([...(postRaw.tags || []), ...(raw.tags || [])])),
            categories: Array.from(new Set([...(postRaw.categories || []), ...(raw.categories || [])])),
            languages: raw.languages?.length ? raw.languages : (postRaw.languages || []),
            artists: raw.artists?.length ? raw.artists : (postRaw.artists || []),
            circles: raw.circles?.length ? raw.circles : (postRaw.circles || []),
            metadataConfidence: {
              ...(postRaw.metadataConfidence || {}),
              ...(raw.metadataConfidence || {}),
              cover: (raw.coverUrl || postRaw.coverUrl) ? "high" : "low",
            },
          };
          await logVerboseAction("CONTENT", "Fetched post metadata for Library listing save", {
            url: normalizeJobUrl(url),
            title: raw.displayTitle || raw.title,
            coverUrl: raw.coverUrl || "",
            tags: raw.tags?.length || 0,
            categories: raw.categories?.length || 0,
          });
        }
      } catch (error) {
        await logVerboseAction("CONTENT", "Library listing metadata fetch failed; using card metadata", {
          url: normalizeJobUrl(url),
          error: error?.message || String(error),
        });
      }
    }

    const normalized = store?.normalizeLibraryItem ? store.normalizeLibraryItem(raw) : raw;
    if (card) {
      await logVerboseAction("CONTENT", "Automatic listing metadata refresh resolved", {
        url: normalized.canonicalUrl || normalized.url,
        title: normalized.displayTitle || normalized.title,
        coverUrl: normalized.coverUrl || normalized.thumbnailUrl || "",
        tagCount: normalized.tags?.length || 0,
        categoryCount: normalized.categories?.length || 0,
        pageCount: normalized.pageCount || null,
      });
    }
    return normalized;
  }

  async function cacheLibraryCoverDataUrl(item, reason = "content-library-save") {
    const coverUrl = item?.thumbnailUrl || item?.coverUrl || "";
    if (!coverUrl || item.coverDataUrl || /^data:/i.test(coverUrl)) return item;

    try {
      const response = await browser.runtime.sendMessage({
        type: "MRM_CACHE_COVER_DATA_URL",
        coverUrl,
        pageUrl: item.canonicalUrl || item.url || location.href,
        reason,
      });
      if (response?.ok && response.coverDataUrl) {
        await logVerboseAction("CONTENT", "Library cover cached before save", {
          url: item.canonicalUrl || item.url || "",
          coverUrl,
          bytes: response.coverDataUrl.length,
        });
        return { ...item, coverDataUrl: response.coverDataUrl };
      }
    } catch (error) {
      await logVerboseAction("CONTENT", "Library cover cache before save failed", {
        url: item?.canonicalUrl || item?.url || "",
        coverUrl,
        error: error?.message || String(error),
      });
    }

    return item;
  }

  async function toggleItemInLibrary(item) {
    if (!window.MRMLibraryStore?.findLibraryItemByUrl || !window.MRMLibraryStore?.removeLibraryItem) {
      return saveItemToLibrary(item);
    }
    const existing = await window.MRMLibraryStore.findLibraryItemByUrl(item.canonicalUrl || item.url);
    if (existing) {
      await window.MRMLibraryStore.removeLibraryItem(existing.id);
      await logVerboseAction("CONTENT", "Library item removed by toggle", {
        id: existing.id,
        url: existing.url,
        title: existing.displayTitle || existing.title,
      });
      return { item: existing, existed: true, removed: true };
    }
    const result = await saveItemToLibrary(item);
    return { ...result, removed: false };
  }

  async function saveItemToLibrary(item) {
    if (!window.MRMLibraryStore?.saveLibraryItem) {
      throw new Error("Library storage is not available.");
    }
    const itemWithCachedCover = await cacheLibraryCoverDataUrl(item, "content-save-library");
    const result = await window.MRMLibraryStore.saveLibraryItem(itemWithCachedCover);
    await logVerboseAction("CONTENT", "Library item saved", {
      id: result.item?.id,
      url: result.item?.url,
      existed: result.existed,
      title: result.item?.displayTitle || result.item?.title,
      coverCached: !!result.item?.coverDataUrl,
    });
    return result;
  }

  async function updateLibraryButtonState(button, url) {
    if (!button || !window.MRMLibraryStore?.findLibraryItemByUrl) return;
    try {
      const existing = await window.MRMLibraryStore.findLibraryItemByUrl(url);
      const defaultLabel = button.classList.contains("mrm-library-btn") ? "Save to Library" : "Save";
      button.textContent = existing ? "Saved" : defaultLabel;
      button.classList.toggle("is-in-library", !!existing);
    } catch {
      button.textContent = "Save";
    }
  }

  async function refreshLibraryButtonStates() {
    const buttons = document.querySelectorAll("[data-mrm-library-url]");
    for (const button of buttons) {
      await updateLibraryButtonState(button, button.dataset.mrmLibraryUrl || "");
    }
  }


  async function runDirectListingDownload(link, shell, button) {
    const targetUrl = new URL(link.href, location.href).href;

    updateListingButtonVisual(shell, button, {
      label: "Fetching…",
      percent: 8,
      meta: "Reading linked post page…",
      disabled: true,
    });

    const payload = await fetchPostPayloadFromListingUrl(targetUrl);
    currentJobState = createJobRecord({
      url: payload.url,
      title: payload.title,
      page: payload.page,
      count: payload.images.length,
      total: payload.images.length,
      progress: 1,
      progressLabel: "Preparing download…",
      status: "preparing",
      source: "listing",
    });

    await upsertActiveJob(currentJobState);
    await logVerboseAction("CONTENT", "Active listing job created", currentJobState);
    await refreshListingStates();
    await logVerboseAction("CONTENT", "Direct listing download started", { url: targetUrl });
    await debug("info", "Starting direct listing-page CBZ download", { url: payload.url, images: payload.images.length });

    try {
      const result = await requestPageDownloadCbz(payload);
      await syncJobState({
        status: "completed",
        progress: 100,
        progressLabel: "Done",
        completed: payload.images.length,
        total: payload.images.length,
        filename: result.filename || payload.filename,
      });
      await finishCurrentJob("completed", { filename: result.filename || payload.filename });
      await browser.runtime.sendMessage({
        type: "MRM_MARK_LIBRARY_DOWNLOADED",
        url: payload.url,
        pageCount: payload.images.length,
        coverDataUrl: result.coverDataUrl || "",
        coverFallbackSource: result.coverDataUrl ? "first-downloaded-page" : "",
      }).catch(() => {});
      await refreshListingStates();
      showToast?.("CBZ saved.", "success");
    } catch (error) {
      await syncJobState({
        status: "failed",
        progressLabel: error?.message || "Download failed",
        error: error?.message || String(error),
      });
      await finishCurrentJob("failed", { error: error?.message || String(error) });
      await refreshListingStates();
      throw error;
    }
  }

  async function runListingDownload(link, shell, button) {
    if (isMyReadingMangaUrl(link.href)) {
      updateListingButtonVisual(shell, button, {
        label: "Opening…",
        percent: 18,
        meta: "Creating background post tab…",
        disabled: true,
      });
      await browser.runtime.sendMessage({ type: "MRM_OPEN_POST_DOWNLOAD_TAB", url: link.href });
      updateListingButtonVisual(shell, button, {
        label: "Queued",
        percent: 32,
        meta: "Queued",
        disabled: true,
      });
      return;
    }

    await runDirectListingDownload(link, shell, button);
  }

  function addListingButtons() {
    if (!isArchivePage()) {
      logVerboseAction("CONTENT", "Skipped listing button injection: not an archive page", { url: location.href });
      return;
    }
    const cards = getArchiveCards(document);
    let scanned = 0;
    let injected = 0;
    let skippedExisting = 0;
    let skippedNoLink = 0;
    cards.forEach((card) => {
      scanned += 1;
      if (card.querySelector(".mrm-listing-actions")) {
        skippedExisting += 1;
        return;
      }
      const link = findPostLink(card);
      if (!link) {
        skippedNoLink += 1;
        return;
      }

      const wrap = document.createElement("div");
      wrap.className = "mrm-listing-actions";

      const shell = document.createElement("div");
      shell.className = "mrm-listing-shell";
      shell.dataset.url = normalizeJobUrl(link.href);
      shell.innerHTML = '<div class="mrm-btn-progress"><div class="mrm-btn-progress-fill"></div></div>';

      const dlBtn = document.createElement("button");
      dlBtn.className = "mrm-listing-btn";
      dlBtn.textContent = "Download CBZ";
      dlBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await logVerboseAction("CONTENT", "Listing download button clicked", { url: normalizeJobUrl(link.href), title: getCardTitle(card, link) });
          await runListingDownload(link, shell, dlBtn);
        } catch (error) {
          updateListingButtonVisual(shell, dlBtn, {
            label: "Retry",
            percent: 0,
            meta: error?.message || "Download failed.",
            disabled: false,
          });
          showToast?.(error?.message || "Listing page download failed.", "error");
          await debug("error", "Listing page download failed", error?.message || String(error));
        }
      });

      const queueBtn = document.createElement("button");
      queueBtn.className = "mrm-listing-queue-btn";
      queueBtn.type = "button";
      queueBtn.textContent = "Add to Queue";
      queueBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (queueBtn.disabled) return;
        if (queueBtn.classList.contains("is-in-list")) {
          showToast?.("Already in download queue.", "success");
          return;
        }
        try {
          queueBtn.disabled = true;
          queueBtn.textContent = "Queuing…";
          queueBtn.classList.add("is-pending");
          await logVerboseAction("CONTENT", "Add-to-queue button clicked", { url: normalizeJobUrl(link.href), title: getCardTitle(card, link) });
          const result = await addItemToDownloadQueue(createQueueItemFromLink(link, card));
          queueBtn.textContent = "Queued";
          queueBtn.classList.add("is-in-list");
          queueBtn.classList.remove("is-pending");
          showToast?.(result.existed ? "Already in download queue." : "Added to download queue.", "success");
        } catch (error) {
          queueBtn.textContent = "Retry Add";
          queueBtn.classList.remove("is-pending");
          showToast?.(error?.message || "Could not add to list.", "error");
        } finally {
          setTimeout(() => { queueBtn.disabled = false; }, 250);
        }
      });

      const libraryBtn = document.createElement("button");
      libraryBtn.className = "mrm-listing-queue-btn mrm-listing-library-btn";
      libraryBtn.type = "button";
      libraryBtn.dataset.mrmLibraryUrl = normalizeJobUrl(link.href);
      libraryBtn.textContent = "Save";
      libraryBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          libraryBtn.disabled = true;
          await logVerboseAction("CONTENT", "Save-to-library button clicked", { url: normalizeJobUrl(link.href), title: getCardTitle(card, link) });
          libraryBtn.textContent = "Saving…";
          const item = await createLibraryMetadataFromLink(link, card);
          const result = await toggleItemInLibrary(item);
          libraryBtn.textContent = result.removed ? "Save" : "Saved";
          libraryBtn.classList.toggle("is-in-library", !result.removed);
          if (!result.removed) {
            await logVerboseAction("CONTENT", "Listing Library save completed with automatic metadata refresh", {
              url: normalizeJobUrl(link.href),
              title: item.displayTitle || item.title,
              coverUrl: item.coverUrl || item.thumbnailUrl || "",
              coverCached: !!item.coverDataUrl,
              tagCount: item.tags?.length || 0,
              categoryCount: item.categories?.length || 0,
              pageCount: item.pageCount || null,
            });
          }
          showToast?.(result.removed ? "Removed from Library." : "Saved to Library.", "success");
        } catch (error) {
          libraryBtn.textContent = "Retry Save";
          showToast?.(error?.message || "Could not save to Library.", "error");
        } finally {
          setTimeout(() => { libraryBtn.disabled = false; }, 500);
        }
      });

      const downloadCell = document.createElement("div");
      downloadCell.className = "mrm-listing-download-cell";
      const downloadMeta = document.createElement("div");
      downloadMeta.className = "mrm-btn-meta is-hidden";
      downloadCell.append(shell, downloadMeta);
      shell.appendChild(dlBtn);
      wrap.append(downloadCell, queueBtn, libraryBtn);
      updateQueueButtonState(queueBtn, link.href);
      updateLibraryButtonState(libraryBtn, link.href);
      const placement = getListingActionPlacement(card);
      if (placement?.before) {
        placement.host.insertBefore(wrap, placement.before);
      } else {
        placement.host.appendChild(wrap);
      }
      injected += 1;
      logVerboseAction("CONTENT", "Injected listing action buttons", {
        title: getCardTitle(card, link),
        url: normalizeJobUrl(link.href),
        hostSelector: placement?.host?.className || placement?.host?.tagName || "unknown",
        insertedBefore: placement?.before?.className || placement?.before?.tagName || "",
      });
    });
    logVerboseAction("CONTENT", "Listing button injection pass finished", {
      scanned,
      injected,
      skippedExisting,
      skippedNoLink,
      totalActions: document.querySelectorAll(".mrm-listing-actions").length,
    });
  }



  function scheduleListingRefresh() {
    if (listingRefreshTimer) clearTimeout(listingRefreshTimer);
    listingRefreshTimer = setTimeout(async () => {
      listingRefreshTimer = 0;
      addListingButtons();
      await refreshListingStates();
    }, 180);
  }

  function observeListingChanges() {
    if (listingObserver || !isArchivePage()) return;
    const root = document.querySelector(".content-archive, main, .site-main, #main, body");
    if (!root) return;
    listingObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== "childList") continue;
        if ([...mutation.addedNodes].some((node) => node.nodeType === 1)) {
          scheduleListingRefresh();
          break;
        }
      }
    });
    listingObserver.observe(root, { childList: true, subtree: true });
  }

  function hideAIListing() {
    const aiListing = document.querySelectorAll(".tag-ai-generate");
    if (!aiListing.length) return;

    for (const element of aiListing) {
      element.addEventListener("click", (event) => {
        if (
          confirm(
            "Are you sure you want to view generated AI images instead of people hard work?"
          )
        ) {
          element.style.filter = "none";
          element.style.opacity = "1";
        } else {
          event.preventDefault();
        }
      });
      element.style.filter = "blur(10px)";
      element.style.opacity = "0.5";
    }
  }

  async function initHideAIListing() {
    try {
      const result = await browser.storage.local.get(["mrmSettings"]);
      const settings = result.mrmSettings || {};
      if (settings.hideAIListing !== false) {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", hideAIListing, { once: true });
        } else {
          hideAIListing();
        }
      }
    } catch {
      hideAIListing();
    }
  }

  function detectPagination() {
    const paginationLinks = document.querySelectorAll(
      ".page-numbers, .wp-link-pages .post-page-numbers, .wp-link-pages a, .pagination a, .nav-links a",
    );
    let lastPage = 1;

    paginationLinks.forEach((link) => {
      const textValue = (link.textContent || "").trim();
      const pageNum = parseInt(textValue, 10);
      if (!Number.isNaN(pageNum) && pageNum > lastPage) {
        lastPage = pageNum;
      }

      const href = link.getAttribute("href") || "";
      const hrefPage = extractTrailingPageNumber(href);
      if (hrefPage > lastPage) lastPage = hrefPage;
    });

    const nextLink = document.querySelector(".page-numbers.next, .pagination .next, .nav-links .next a, a[rel='next']");
    if (nextLink) {
      const href = nextLink.getAttribute("href") || "";
      const nextPage = extractTrailingPageNumber(href);
      if (nextPage > lastPage) lastPage = nextPage;
    }

    return { lastPage, currentPage: getCurrentPage() };
  }


  function getMetadataExtractionJobId() {
    if (location.hash.startsWith(METADATA_HASH_PREFIX)) {
      try {
        return decodeURIComponent(location.hash.slice(METADATA_HASH_PREFIX.length));
      } catch {
        return location.hash.slice(METADATA_HASH_PREFIX.length);
      }
    }

    try {
      return new URLSearchParams(location.search).get("mrm_metadata_job") || "";
    } catch {
      return "";
    }
  }

  async function runMetadataExtractionJob() {
    const jobId = getMetadataExtractionJobId();
    if (!jobId) return false;

    try {
      await logVerboseAction("CONTENT", "Metadata extraction tab started", { jobId, url: location.href.split("#")[0] });

      // Give lazy WordPress metadata/images one short paint cycle to settle.
      await new Promise((resolve) => setTimeout(resolve, 350));

      const extractor = window.MRMMetadataExtractor;
      const store = window.MRMLibraryStore;
      if (!extractor?.extractPostMetadata) {
        throw new Error("Metadata extractor is not available.");
      }

      const raw = extractor.extractPostMetadata(document, location.href.split("#")[0]);
      const metadata = store?.normalizeLibraryItem ? store.normalizeLibraryItem(raw) : raw;

      await browser.runtime.sendMessage({
        type: "MRM_METADATA_TAB_RESULT",
        jobId,
        ok: true,
        metadata,
      });

      await logVerboseAction("CONTENT", "Metadata extraction tab completed", {
        jobId,
        title: metadata.displayTitle || metadata.title,
        coverUrl: metadata.coverUrl || metadata.thumbnailUrl || "",
        tagCount: metadata.tags?.length || 0,
        categoryCount: metadata.categories?.length || 0,
        pageCount: metadata.pageCount || null,
      });
    } catch (error) {
      await browser.runtime.sendMessage({
        type: "MRM_METADATA_TAB_RESULT",
        jobId,
        ok: false,
        error: String(error?.message || error),
      });
      await logVerboseAction("CONTENT", "Metadata extraction tab failed", { jobId, error: String(error?.message || error) });
    }

    return true;
  }


  function closePopupModal() {
    const overlay = document.getElementById(MODAL_OVERLAY_ID);
    const fab = document.getElementById(MODAL_FAB_ID);
    if (overlay) {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
    }
    if (fab) {
      fab.dataset.open = "false";
      fab.setAttribute("aria-expanded", "false");
      fab.textContent = "⋯";
      fab.title = "Open MRM panel";
    }
    document.documentElement.style.overflow = "";
  }

  async function openPopupModal(targetView = "main") {
    let overlay = document.getElementById(MODAL_OVERLAY_ID);
    const fab = document.getElementById(MODAL_FAB_ID);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = MODAL_OVERLAY_ID;
      overlay.setAttribute("aria-hidden", "true");

      const shell = document.createElement("div");
      shell.className = "mrm-popup-modal-shell";

      const head = document.createElement("div");
      head.className = "mrm-popup-modal-head";

      const title = document.createElement("div");
      title.className = "mrm-popup-modal-title";
      title.textContent = "MRM Downloader";

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "mrm-popup-modal-close";
      closeBtn.setAttribute("aria-label", "Close MRM panel");
      closeBtn.textContent = "×";
      closeBtn.addEventListener("click", closePopupModal);

      head.append(title, closeBtn);

      const body = document.createElement("div");
      body.className = "mrm-popup-modal-body";

      const frame = document.createElement("iframe");
      frame.id = MODAL_FRAME_ID;
      frame.loading = "eager";
      frame.referrerPolicy = "no-referrer";

      const fallback = document.createElement("div");
      fallback.className = "mrm-popup-modal-fallback";
      fallback.innerHTML = '<div class="mrm-popup-modal-fallback-title">Loading MRM panel…</div><div class="mrm-popup-modal-fallback-text">If the embedded panel does not load on this device, use the buttons below.</div>';

      const fallbackActions = document.createElement("div");
      fallbackActions.className = "mrm-popup-modal-fallback-actions";

      const openFullBtn = document.createElement("button");
      openFullBtn.type = "button";
      openFullBtn.className = "mrm-popup-modal-fallback-btn";
      openFullBtn.textContent = "Open full panel";
      openFullBtn.addEventListener("click", () => {
        try {
          const url = browser.runtime.getURL("popup.html?embedded=1&view=queue&pageUrl=" + encodeURIComponent(location.href) + "&pageTitle=" + encodeURIComponent(document.title || ""));
          window.open(url, "_blank", "noopener,noreferrer");
        } catch {}
      });

      const closeFallbackBtn = document.createElement("button");
      closeFallbackBtn.type = "button";
      closeFallbackBtn.className = "mrm-popup-modal-fallback-btn secondary";
      closeFallbackBtn.textContent = "Close";
      closeFallbackBtn.addEventListener("click", closePopupModal);

      fallbackActions.append(openFullBtn, closeFallbackBtn);
      fallback.appendChild(fallbackActions);

      let popupQuery = "embedded=1&modal=1&view=" + encodeURIComponent(targetView || "main") + "&pageUrl=" + encodeURIComponent(location.href) + "&pageTitle=" + encodeURIComponent(document.title || "");
      try {
        const pageContext = await browser.runtime.sendMessage({ type: "MRM_GET_PAGE_CONTEXT" });
        if (pageContext?.ok) {
          if (pageContext.tabId != null) popupQuery += "&pageTabId=" + encodeURIComponent(String(pageContext.tabId));
          if (pageContext.windowId != null) popupQuery += "&pageWindowId=" + encodeURIComponent(String(pageContext.windowId));
          if (pageContext.url) popupQuery += "&pageUrl=" + encodeURIComponent(pageContext.url);
          if (pageContext.title) popupQuery += "&pageTitle=" + encodeURIComponent(pageContext.title);
        }
      } catch {}

      let frameLoaded = false;
      const fallbackTimer = window.setTimeout(() => {
        if (!frameLoaded) {
          fallback.classList.add("show");
        }
      }, 1200);

      frame.addEventListener("load", () => {
        frameLoaded = true;
        window.clearTimeout(fallbackTimer);
        fallback.classList.remove("show");
      });
      frame.addEventListener("error", () => {
        fallback.classList.add("show");
      });

      frame.src = browser.runtime.getURL("popup.html?" + popupQuery);

      body.append(frame, fallback);
      shell.append(head, body);
      overlay.appendChild(shell);

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closePopupModal();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && document.getElementById(MODAL_OVERLAY_ID)?.classList.contains("open")) {
          closePopupModal();
        }
      });

      document.documentElement.appendChild(overlay);
    }

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    if (fab) {
      fab.dataset.open = "true";
      fab.setAttribute("aria-expanded", "true");
      fab.textContent = "×";
      fab.title = "Close MRM panel";
    }
    document.documentElement.style.overflow = "hidden";
  }

  function ensurePopupFab() {
    if (document.getElementById(MODAL_FAB_ID)) return;
    const fab = document.createElement("button");
    fab.id = MODAL_FAB_ID;
    fab.type = "button";
    fab.title = "Open MRM panel";
    fab.setAttribute("aria-label", "Open MRM panel");
    fab.setAttribute("aria-expanded", "false");
    fab.textContent = "⋯";
    fab.addEventListener("click", () => {
      const overlay = document.getElementById(MODAL_OVERLAY_ID);
      if (overlay?.classList.contains("open")) {
        closePopupModal();
      } else {
        openPopupModal();
      }
    });
    document.documentElement.appendChild(fab);
  }

  async function init() {
    lastContentUrl = location.href;
    if (isNhentaiHost(document)) {
      nhentaiApiCache = null;
      nhentaiApiPromise = null;
      if (/^\/g\/\d+(?:\/\d+)?\/?$/.test(location.pathname)) {
        await fetchNhentaiGalleryApi(document);
      }
    }

    await loadSettings();
    initHideAIListing();

    if (await runMetadataExtractionJob()) {
      return;
    }

    if (shouldExclude) return;

    injectStyle();
    ensurePopupFab();
    ensureBridgeAssets();
    ensurePageFetchBridge();
    if (debugMode) toggleDebugPanel(false);
    addPostActionButton();
    addListingButtons();
    observeListingChanges();
    await refreshListingStates();
    await debug("info", `await reportSupportedTabContext("init");
Initialized on ${location.href}`);

    if (location.hash === AUTO_HASH && !autoStarted && isPostPage()) {
      autoStarted = true;
      await debug("info", "Auto-starting background-tab post download");
      runCurrentPageDownload("Download CBZ");
    }

    if (location.hash === COVER_GENERATION_HASH && !autoStarted && isPostPage()) {
      autoStarted = true;
      await debug("info", "Auto-starting cover-only first-page Library cover generation");
      generateCurrentPageLibraryCover();
    }
  }


  function scheduleRouteRefresh() {
    if (routeRefreshTimer) clearTimeout(routeRefreshTimer);
    routeRefreshTimer = window.setTimeout(async () => {
      routeRefreshTimer = 0;
      if (location.href === lastContentUrl) return;
      document.querySelectorAll(".mrm-post-actions, .mrm-listing-actions").forEach((node) => node.remove());
      autoStarted = false;
      await init();
    }, 150);
  }

  function bindRouteWatchers() {
    if (window.__mrmContentRouteWatchersBound) return;
    window.__mrmContentRouteWatchersBound = true;

    const wrapHistoryMethod = (method) => {
      const original = history[method];
      if (typeof original !== "function") return;
      history[method] = function(...args) {
        const result = original.apply(this, args);
        queueMicrotask(scheduleRouteRefresh);
        return result;
      };
    };

    wrapHistoryMethod("pushState");
    wrapHistoryMethod("replaceState");
    window.addEventListener("popstate", scheduleRouteRefresh);
    window.addEventListener("hashchange", scheduleRouteRefresh);
  }

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes.mrmSettings) {
      debugMode = !!changes.mrmSettings.newValue?.debugMode;
      hideDownloadedListings = !!changes.mrmSettings.newValue?.hideDownloadedListing;
      hideQueuedListings = !!changes.mrmSettings.newValue?.hideQueuedListing;
      hideSavedListings = !!changes.mrmSettings.newValue?.hideSavedListing;
      pageToastEnabled = changes.mrmSettings.newValue?.pageToastEnabled !== false;
      minimalQueueOverlayEnabled = changes.mrmSettings.newValue?.minimalQueueOverlay !== false;
      minimalQueueOverlayActiveOnly = !!changes.mrmSettings.newValue?.minimalQueueOverlayActiveOnly;
      logVerboseAction("CONTENT", "Settings changed in content script", {
        debugMode,
        verboseDebugMode: !!changes.mrmSettings.newValue?.verboseDebugMode,
        hideDownloadedListing: hideDownloadedListings,
        hideQueuedListing: hideQueuedListings,
        hideSavedListing: hideSavedListings,
      });
      debug("info", `Debug mode updated: ${debugMode}`);
      if (debugMode) renderDebugPanel();
      else document.getElementById(DEBUG_PANEL_ID)?.classList.remove("open");
      refreshListingStates();
    }
    if (changes.mrmActiveJobs || changes.downloadHistory || changes.mrmDownloadQueue) {
      refreshListingStates();
      renderPostActionProgress();
      renderPageQueueOverlay(changes.mrmDownloadQueue?.newValue || null);
    }
    if (changes.mrmLibraryItems) {
      refreshLibraryButtonStates();
      refreshListingStates();
    }
  });

  browser.runtime.onMessage.addListener((message) => {
    logVerboseAction("CONTENT", "Runtime message received", { type: message?.type || "" });
    if (!message || !message.type) return undefined;

    if (message.type === "GET_MRM_DATA") {
      return (async () => {
        if (isNhentaiHost(document) && isPostPage() && !parseNhentaiGalleryApi(document)?.pages?.length) {
          await fetchNhentaiGalleryApi(document);
        }
        const contentType = determineContentType();
        const archive = isArchivePage();
        const post = isPostPage();
        const meta = post ? await getPostPayload(document) : extractPostMeta(document);
        return {
          images: post ? meta.images : [],
          video: post ? getVideoSource() : "",
          title: meta.title || getTitle(document),
          cleanTitle: meta.cleanTitle || "",
          artist: meta.artist || "",
          langs: meta.langs || [],
          filename: meta.filename || "",
          page: meta.page || getCurrentPage(document),
          contentType: post ? contentType.type : "none",
          hasContent: post ? (contentType.hasContent || false) : false,
          supportsPdf: false,
          reason: contentType.reason,
          isArchivePage: archive,
          isPostPage: post,
        };
      })();
    }

    if (message.type === "GET_MRM_LIBRARY_METADATA") {
      return Promise.resolve(
        window.MRMMetadataExtractor?.extractPostMetadata
          ? window.MRMMetadataExtractor.extractPostMetadata(document)
          : createLibraryMetadataFromLink({ href: location.href, textContent: getTitle(document), getAttribute: () => "" }, null)
      );
    }

    if (message.type === "DETECT_PAGINATION") {
      return Promise.resolve(detectPagination());
    }

    if (message.type === "PAGE_FETCH") {
      return pageFetch(message.url, {
        options: message.options || { method: "GET" },
        wantBody: !!message.wantBody,
        responseType: message.responseType || "arraybuffer",
        timeoutMs: message.timeoutMs || 60000,
      });
    }

    if (message.type === "MRM_DIRECT_DOWNLOAD_URL") {
      return (async () => {
        const targetUrl = normalizeJobUrl(message.url || "");
        const lockKey = message.queueItemId || targetUrl;
        if (!targetUrl) throw new Error("Missing queued URL.");
        if (isMyReadingMangaUrl(targetUrl)) {
          throw new Error("MyReadingManga queue items must use the background-tab download flow.");
        }
        if (directQueueDownloadLocks.has(lockKey)) {
          await logVerboseAction("CONTENT", "Direct queued download ignored because it is already running", { url: targetUrl, queueItemId: message.queueItemId || "" });
          return { ok: true, skipped: true, url: targetUrl, count: 0, filename: "" };
        }
        directQueueDownloadLocks.add(lockKey);

        await debug("info", "Starting direct queued CBZ download", { url: targetUrl });
        pageToast("Queue download started.", "info");
        await logVerboseAction("CONTENT", "Direct queued download started", { url: targetUrl });

        const currentHost = location.hostname.replace(/^www\./, "");
        const targetHost = (() => {
          try { return new URL(targetUrl).hostname.replace(/^www\./, ""); } catch { return ""; }
        })();
        if (targetHost && currentHost !== targetHost) {
          throw new Error(`Worker tab host mismatch: expected ${targetHost}, got ${currentHost}`);
        }

        const payload = await fetchPostPayloadFromListingUrl(targetUrl);
        payload.queueItemId = message.queueItemId || "";
        payload.title = payload.title || message.title || "";
        await reportQueueProgress(payload, {
          status: "downloading",
          phase: "fetching",
          progress: 2,
          progressLabel: "Fetching post images…",
          currentImage: 0,
          totalImages: payload.images.length,
          count: payload.images.length,
          lastError: null,
        });
        const result = await requestPageDownloadCbz(payload);

        await browser.runtime.sendMessage({
          type: "MRM_UPDATE_DOWNLOAD_QUEUE_ITEM",
          id: message.queueItemId || "",
          url: payload.url,
          patch: {
            status: "completed",
            phase: "completed",
            progress: 100,
            progressLabel: "Completed",
            currentImage: payload.images.length,
            totalImages: payload.images.length,
            completedAt: Date.now(),
            updatedAt: Date.now(),
            lastProgressAt: Date.now(),
            lastError: null,
            filename: result.filename || payload.filename,
            count: payload.images.length,
          },
        }).catch(() => {});

        await browser.runtime.sendMessage({
          type: "MRM_MARK_LIBRARY_DOWNLOADED",
          url: payload.url,
          pageCount: payload.images.length,
          coverDataUrl: result.coverDataUrl || "",
          coverFallbackSource: result.coverDataUrl ? "first-downloaded-page" : "",
        }).catch(() => {});

        await debug("info", "Direct queued CBZ download completed", {
          url: payload.url,
          filename: result.filename || payload.filename,
          images: payload.images.length,
        });
        await logVerboseAction("CONTENT", "Direct queued download completed", {
          url: payload.url,
          filename: result.filename || payload.filename,
          images: payload.images.length,
        });
        showToast?.(`Saved ${result.filename || payload.filename || "CBZ"}.`, "success");

        directQueueDownloadLocks.delete(lockKey);
        return {
          ok: true,
          url: payload.url,
          title: payload.title,
          filename: result.filename || payload.filename,
          count: payload.images.length,
          coverDataUrl: result.coverDataUrl || "",
        };
      })().catch(async (error) => {
        const targetUrl = normalizeJobUrl(message.url || "");
        const lockKey = message.queueItemId || targetUrl;
        directQueueDownloadLocks.delete(lockKey);
        const errorMessage = error?.message || String(error);
        await browser.runtime.sendMessage({
          type: "MRM_UPDATE_DOWNLOAD_QUEUE_ITEM",
          id: message.queueItemId || "",
          url: targetUrl,
          patch: {
            status: "failed",
            phase: "failed",
            progress: 0,
            progressLabel: "Failed",
            updatedAt: Date.now(),
            lastProgressAt: Date.now(),
            lastError: errorMessage,
          },
        }).catch(() => {});
        throw error;
      });
    }

    return undefined;
  });

  bindRouteWatchers();
  loadPageFeedbackSettings();
  init();
})();