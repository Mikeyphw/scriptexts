(function () {
  "use strict";

  const LANGUAGE_ALIASES = {
    JP: "JPN", JPN: "JPN", JAPANESE: "JPN",
    EN: "ENG", ENG: "ENG", ENGLISH: "ENG",
    CH: "CHI", CHI: "CHI", CHINESE: "CHI", CN: "CHI", ZH: "CHI",
    KOR: "KOR", KR: "KOR", KOREAN: "KOR",
    ESP: "ESP", ES: "ESP", SPANISH: "ESP",
  };

  function text(node) {
    return String(node?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function attr(doc, selector, name) {
    return doc.querySelector(selector)?.getAttribute(name)?.trim() || "";
  }

  function normalizeLanguage(value) {
    const key = String(value || "").replace(/[\[\](){}]/g, "").trim().toUpperCase();
    return LANGUAGE_ALIASES[key] || "";
  }

  function parseLanguagePrefix(rawTitle) {
    const title = String(rawTitle || "").replace(/\s+/g, " ").trim();
    const match = title.match(/^\s*[\[(]([A-Za-z0-9 +/_-]{2,40})[\])]\s*/);
    if (!match) return { languages: [], titleWithoutPrefix: title, removedPrefix: false };
    const languages = match[1].split(/[+/_ -]+/).map(normalizeLanguage).filter(Boolean);

    if (!languages.length) {
      return { languages: [], titleWithoutPrefix: title, removedPrefix: false };
    }

    return {
      languages: Array.from(new Set(languages)),
      titleWithoutPrefix: title.slice(match[0].length).trim(),
      removedPrefix: true,
    };
  }

  function stripUnsafeUnicodeHint(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanMetadataText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .trim();
  }

  
  function parseByArtistSuffixTitle(working, languageResult) {
    const match = working.match(/^(.*?)\s+by\s+(.+?)(?:\s*\((.+?)\))?(?:\s*[–—-]\s*(Uncensored|Censored))?(?:\s*\[([A-Za-z]{2,12})\])?$/iu);
    if (!match) return null;
    const [, rawTitle, rawArtist, rawCircle, rawEdition, rawLang] = match;
    const title = cleanMetadataText(rawTitle);
    const artist = cleanMetadataText(rawArtist);
    const circle = cleanMetadataText(rawCircle || "");
    const edition = cleanMetadataText(rawEdition || "");
    const langCode = cleanMetadataText(rawLang || "");
    if (!title || !artist) return null;
    const languages = [...languageResult.languages];
    if (langCode && !languages.some((value) => value.toLowerCase() === langCode.toLowerCase())) {
      languages.push(langCode.toUpperCase());
    }
    return {
      displayTitle: working,
      title: edition ? cleanMetadataText(`${title} - ${edition}`) : title,
      sortTitle: stripUnsafeUnicodeHint(title).toLowerCase(),
      languages,
      artists: [artist],
      circles: circle ? [circle] : [],
      confidence: {
        title: "high",
        languages: languages.length ? "medium" : "low",
        artists: "high",
        circles: circle ? "medium" : "low",
      },
    };
  }

function parseTitle(rawTitle) {
    const displayTitle = cleanMetadataText(rawTitle || "Untitled") || "Untitled";
    const languageResult = parseLanguagePrefix(displayTitle);
    const working = cleanMetadataText(languageResult.titleWithoutPrefix || displayTitle);
    let title = working;
    let artists = [];
    let circles = [];
    let titleConfidence = "medium";
    let peopleConfidence = "low";

    // Parse against the original Unicode title so metadata is not truncated or ASCII-stripped.
    const artistCircle = working.match(/^(.{2,160}?)\s*\((.{1,160}?)\)\s*[-–—:]\s*(.+)$/u);
    if (artistCircle) {
      artists = [cleanMetadataText(artistCircle[1])];
      circles = [cleanMetadataText(artistCircle[2])];
      title = cleanMetadataText(artistCircle[3]);
      titleConfidence = "high";
      peopleConfidence = "medium";
    } else {
      const bracketArtist = working.match(/^\[([^\]]{2,120})\]\s+(.+)$/u);
      if (bracketArtist && !languageResult.removedPrefix) {
        artists = [cleanMetadataText(bracketArtist[1])];
        title = cleanMetadataText(bracketArtist[2]);
        titleConfidence = "high";
        peopleConfidence = "medium";
      } else {
        const dash = working.match(/^(.{2,120}?)\s*[-–—:]\s*(.+)$/u);
        if (dash && cleanMetadataText(dash[1]).split(/\s+/).length <= 10) {
          artists = [cleanMetadataText(dash[1])];
          title = cleanMetadataText(dash[2]);
          titleConfidence = "medium";
          peopleConfidence = "low";
        }
      }
    }

    title = title || displayTitle;

    return {
      displayTitle,
      title,
      sortTitle: stripUnsafeUnicodeHint(title || displayTitle).toLowerCase(),
      languages: languageResult.languages,
      artists: artists.map(cleanMetadataText).filter(Boolean),
      circles: circles.map(cleanMetadataText).filter(Boolean),
      confidence: {
        title: titleConfidence,
        languages: languageResult.languages.length ? "medium" : "low",
        artists: artists.length ? peopleConfidence : "low",
        circles: circles.length ? peopleConfidence : "low",
      },
    };
  }

  function absoluteUrl(url, base) {
    try {
      return url ? new URL(url, base || location.href).href : "";
    } catch {
      return "";
    }
  }

  function bestImageFromNode(img, base) {
    if (!img) return "";
    const srcset = img.getAttribute("srcset") || "";
    if (srcset) {
      const best = srcset.split(",").map((entry) => {
        const [url, descriptor] = entry.trim().split(/\s+/, 2);
        const score = descriptor?.endsWith("w") ? parseInt(descriptor, 10) : descriptor?.endsWith("x") ? Math.round(parseFloat(descriptor) * 1000) : 0;
        return { url, score: Number.isFinite(score) ? score : 0 };
      }).filter((item) => item.url).sort((a, b) => b.score - a.score)[0];
      if (best?.url) return absoluteUrl(best.url, base);
    }
    return absoluteUrl(img.currentSrc || img.src || img.getAttribute("data-src") || img.getAttribute("data-lazy-src") || "", base);
  }

  function getDocumentBase(doc = document, fallbackUrl = "") {
    const explicitBase = attr(doc, "base[href]", "href");
    return explicitBase || fallbackUrl || doc.location?.href || location.href;
  }

  function getCanonicalUrl(doc = document, fallbackUrl = "") {
    const base = getDocumentBase(doc, fallbackUrl);
    return absoluteUrl(
      attr(doc, "link[rel='canonical']", "href")
        || attr(doc, "meta[property='og:url']", "content")
        || fallbackUrl
        || doc.location?.href
        || location.href,
      base,
    ).split("#")[0];
  }

  function getHost(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  function getSiteName(host) {
    const normalized = String(host || "").replace(/^www\./, "");
    const names = {
      "myreadingmanga.info": "MyReadingManga",
      "baramangaonline.com": "BaraMangaOnline",
      "mangalotus.com": "MangaLotus",
      "yaoimangaonline.com": "YaoiMangaOnline",
      "nhentai.net": "nhentai",
    };
    return names[normalized] || normalized || "Unknown site";
  }

  function collectTags(doc = document) {
    const tagSelectors = [
      ".post-tags a", ".tags a", ".entry-tags a", ".tags-links a", "a[rel='tag']",
      ".tagcloud a", ".gallerytags a", "#tags a", ".entry-footer a[rel='tag']", ".postmetadata a[rel='tag']",
    ];
    const categorySelectors = [
      ".entry-categories a", ".cat-links a", "a[rel='category tag']", ".categories a", ".cat-links a[rel='category tag']", ".entry-footer a[rel='category tag']",
    ];
    const tags = new Set();
    const categories = new Set();

    tagSelectors.forEach((selector) => doc.querySelectorAll(selector).forEach((node) => {
      const value = text(node);
      if (value) tags.add(value);
    }));
    categorySelectors.forEach((selector) => doc.querySelectorAll(selector).forEach((node) => {
      const value = text(node);
      if (value) categories.add(value);
    }));

    const keywords = attr(doc, "meta[name='keywords']", "content");
    if (keywords) keywords.split(",").map((item) => item.trim()).filter(Boolean).forEach((item) => tags.add(item));

    return { tags: Array.from(tags), categories: Array.from(categories) };
  }

  function getPageTitle(doc = document) {
    return text(doc.querySelector(".entry-header h1.entry-title"))
      || text(doc.querySelector("article h1.entry-title"))
      || text(doc.querySelector("main h1"))
      || text(doc.querySelector("h1"))
      || attr(doc, "meta[property='og:title']", "content")
      || doc.title
      || "Untitled";
  }

  function getPostCover(doc = document, fallbackUrl = "") {
    const base = getDocumentBase(doc, fallbackUrl);
    return attr(doc, "meta[property='og:image']", "content")
      || attr(doc, "meta[name='twitter:image']", "content")
      || bestImageFromNode(doc.querySelector("article .entry-content img, .entry-content img, .post-content img, main article img, article img"), base)
      || "";
  }

  function extractPostMetadata(doc = document, sourceUrl = "") {
    const canonicalUrl = getCanonicalUrl(doc, sourceUrl);
    const host = getHost(canonicalUrl);
    const titleParts = parseTitle(getPageTitle(doc));
    const tagData = collectTags(doc);
    const coverUrl = absoluteUrl(getPostCover(doc, canonicalUrl || sourceUrl), canonicalUrl || sourceUrl);
    const pageCount = doc.querySelectorAll("article .entry-content img, .entry-content img, .post-content img, main article img").length || null;

    return {
      url: canonicalUrl,
      canonicalUrl,
      host,
      siteName: getSiteName(host),
      sourceType: "post",
      contentType: "doujinshi",
      title: titleParts.title,
      displayTitle: titleParts.displayTitle,
      sortTitle: titleParts.sortTitle,
      coverUrl,
      thumbnailUrl: coverUrl,
      languages: titleParts.languages,
      artists: titleParts.artists,
      circles: titleParts.circles,
      tags: tagData.tags,
      categories: tagData.categories,
      pageCount,
      metadataConfidence: {
        title: titleParts.confidence.title,
        cover: coverUrl ? "high" : "low",
        languages: titleParts.confidence.languages,
        artists: titleParts.confidence.artists,
        circles: titleParts.confidence.circles,
        tags: tagData.tags.length ? "medium" : "low",
      },
    };
  }

  function cleanCardClone(node) {
    if (!node) return null;
    const clone = node.cloneNode(true);
    clone.querySelectorAll(".mrm-listing-actions, .mrm-post-shell, button, script, style").forEach((child) => child.remove());
    return clone;
  }

  function getCardTitle(card, link) {
    const cleanCard = cleanCardClone(card);
    const selectors = [
      ".entry-title a",
      ".entry-title",
      ".post-title a",
      ".post-title",
      "h1 a",
      "h2 a",
      "h3 a",
      "h4 a",
      "h1",
      "h2",
      "h3",
      "h4",
      ".caption a",
      ".caption",
      ".title a",
      ".title",
      "a[rel='bookmark']",
      "a[title]",
    ];
    for (const selector of selectors) {
      const value = text(cleanCard?.querySelector?.(selector));
      if (value) return value;
    }
    return text(link) || link?.getAttribute?.("title") || "Untitled";
  }

  function getCardImageNode(card, link) {
    const roots = [
      card,
      link?.closest?.("article, .post, .entry, .gallery, .item, .card, .thumb, .thumbnail, .post-standard"),
      link?.parentElement,
    ].filter(Boolean);
    const selectors = [
      "img[srcset]",
      "img[data-srcset]",
      "img[data-lazy-src]",
      "img[data-src]",
      "img[data-original]",
      "img[data-orig-file]",
      "img[src]",
    ];
    for (const root of roots) {
      for (const selector of selectors) {
        const img = root.querySelector?.(selector);
        if (img) return img;
      }
    }
    return null;
  }

  function getBackgroundImageUrl(node) {
    if (!node) return "";
    const roots = [
      node,
      ...Array.from(node.querySelectorAll?.("[style*='background'], [data-bg], [data-background], [data-background-image]") || []),
    ];
    for (const root of roots) {
      const direct = root.getAttribute?.("data-bg")
        || root.getAttribute?.("data-background")
        || root.getAttribute?.("data-background-image")
        || "";
      if (direct && !/^data:/i.test(direct)) return direct;

      const style = root.getAttribute?.("style") || "";
      const match = style.match(/background(?:-image)?\s*:\s*url\((['"]?)(.*?)\1\)/i);
      if (match?.[2] && !/^data:/i.test(match[2])) return match[2];
    }
    return "";
  }

  function bestImageFromCard(card, link, base) {
    const img = getCardImageNode(card, link);
    const candidates = [];

    if (img) {
      candidates.push(
        img.getAttribute("data-full-url"),
        img.getAttribute("data-orig-file"),
        img.getAttribute("data-original"),
        img.getAttribute("data-lazy-src"),
        img.getAttribute("data-src"),
        img.currentSrc,
        img.src,
        img.getAttribute("src")
      );
      const srcset = img.getAttribute("data-srcset") || img.getAttribute("srcset") || "";
      if (srcset) {
        const best = srcset.split(",").map((entry) => {
          const [url, descriptor] = entry.trim().split(/\s+/, 2);
          const score = descriptor?.endsWith("w") ? parseInt(descriptor, 10) : descriptor?.endsWith("x") ? Math.round(parseFloat(descriptor) * 1000) : 0;
          return { url, score: Number.isFinite(score) ? score : 0 };
        }).filter((item) => item.url).sort((a, b) => b.score - a.score)[0];
        if (best?.url) candidates.unshift(best.url);
      }
    }

    candidates.push(
      link?.getAttribute?.("data-full-url"),
      link?.getAttribute?.("data-original"),
      link?.getAttribute?.("data-src"),
      getBackgroundImageUrl(card),
      getBackgroundImageUrl(link)
    );

    const selected = candidates
      .filter(Boolean)
      .find((value) => !/^data:/i.test(value) && !/blank|placeholder|spacer|transparent/i.test(value));
    return absoluteUrl(selected || "", base);
  }

  function extractCardMetadata(card, link) {
    const url = absoluteUrl(link?.href || "", location.href);
    const host = getHost(url);
    const titleParts = parseTitle(getCardTitle(card, link));
    const coverUrl = bestImageFromCard(card, link, location.href);
    const metadataRoot = cleanCardClone(card);
    const categoryTexts = Array.from(metadataRoot?.querySelectorAll?.("a[rel='tag'], .tags a, .entry-meta a, .post-tags a, .cat-links a, .category a, .categories a") || [])
      .map(text)
      .filter((value) => value && value !== titleParts.displayTitle);

    return {
      url,
      canonicalUrl: url.split("#")[0],
      host,
      siteName: getSiteName(host),
      sourceType: "post",
      contentType: "doujinshi",
      title: titleParts.title,
      displayTitle: titleParts.displayTitle,
      sortTitle: titleParts.sortTitle,
      coverUrl,
      thumbnailUrl: coverUrl,
      languages: titleParts.languages,
      artists: titleParts.artists,
      circles: titleParts.circles,
      tags: categoryTexts,
      categories: [],
      pageCount: null,
      metadataConfidence: {
        title: titleParts.confidence.title,
        cover: coverUrl ? "medium" : "low",
        languages: titleParts.confidence.languages,
        artists: titleParts.confidence.artists,
        circles: titleParts.confidence.circles,
        tags: categoryTexts.length ? "medium" : "low",
      },
    };
  }

  window.MRMMetadataExtractor = {
    parseTitle,
    extractPostMetadata,
    extractCardMetadata,
    getCanonicalUrl,
    getSiteName,
  };
})();